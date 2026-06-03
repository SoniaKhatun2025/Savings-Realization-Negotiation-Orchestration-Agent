import uuid
from fastapi import APIRouter, Depends, HTTPException
from utils.auth_deps import require_role
from utils.helpers import format_api_response, log_audit_event
from database.connection import get_db_connection
from database.queries import GET_ALL_OPPORTUNITIES, CREATE_OPPORTUNITY
from database.models import OpportunityDetectRequest, AssignTaskRequest, UpdateTaskStatusRequest
from services.opportunity_service import analyze_opportunity_with_ai

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])
router_tasks = APIRouter(prefix="/tasks", tags=["Tasks"])
router_suppliers = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.get("/list")
def list_opportunities(current_user: dict = Depends(require_role(["Buyer", "Category Manager", "CPO"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(GET_ALL_OPPORTUNITIES)
    ops = cursor.fetchall()
    conn.close()
    # Serialize Decimal values for JSON
    result = []
    for op in ops:
        result.append({
            "id": op["id"],
            "category": op["category"],
            "supplier_id": op["supplier_id"],
            "supplier_name": op.get("supplier_name"),
            "status_name": op.get("status_name"),
            "current_spend": float(op["current_spend"] or 0),
            "benchmark_spend": float(op["benchmark_spend"] or 0),
            "variance_amount": float(op["variance_amount"] or 0),
            "savings_potential": float(op["savings_potential"] or 0),
            "confidence_score": op["confidence_score"],
            "risk_level_id": op["risk_level_id"],
            "priority_score": op["priority_score"],
            "status_id": op["status_id"],
            "assigned_buyer_id": op["assigned_buyer_id"],
            "assigned_buyer_name": op.get("buyer_name"),
        })
    return format_api_response(data=result)


@router.post("/detect")
def detect_and_save_opportunity(
    req: OpportunityDetectRequest,
    current_user: dict = Depends(require_role(["Category Manager", "CPO"]))
):
    """
    AI-powered opportunity detection pipeline:
    1. Runs LLM analysis on invoice vs benchmark data
    2. Persists the detected opportunity to the database
    3. Returns the saved opportunity details
    """
    # ── 1. Build structured inputs for the AI agent ──────────────────────────
    invoice_data = {
        "category": req.category,
        "supplier_id": req.supplier_id,
        "current_spend": req.current_spend,
    }
    benchmark_data = {
        "benchmark_spend": req.benchmark_spend,
        "variance": req.current_spend - req.benchmark_spend,
    }

    # ── 2. Run AI analysis ───────────────────────────────────────────────────
    analysis = analyze_opportunity_with_ai(invoice_data, benchmark_data)

    # ── 3. Validate supplier exists ──────────────────────────────────────────
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM suppliers WHERE id = %s", (req.supplier_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Supplier ID {req.supplier_id} not found.")

    # ── 4. Persist or Consolidate Opportunity to database ──────────────────────────────────
    opp_id = f"OPP-{str(uuid.uuid4())[:8].upper()}"
    variance_amount = req.current_spend - req.benchmark_spend
    savings_potential = float(analysis.get("savings_potential", variance_amount * 0.6))
    confidence_score = int(analysis.get("confidence_score", 70))
    risk_level = analysis.get("risk_level", "Medium")
    priority_score = min(10, max(1, int(confidence_score / 10)))

    try:
        # Check if an active/pending opportunity already exists for this supplier and category
        cursor.execute("""
            SELECT id, current_spend FROM opportunities
            WHERE supplier_id = %s AND category = %s
              AND status_id = (SELECT id FROM statuses WHERE category='Opportunity' AND name='Pending Analysis')
            LIMIT 1
        """, (req.supplier_id, req.category))
        existing_opp = cursor.fetchone()
        
        if existing_opp:
            existing_spend = float(existing_opp["current_spend"])
            if req.current_spend > existing_spend:
                print(f"Consolidating/Updating existing opportunity {existing_opp['id']} with larger spend {req.current_spend}")
                cursor.execute("""
                    UPDATE opportunities
                    SET current_spend = %s, benchmark_spend = %s, variance_amount = %s,
                        savings_potential = %s, confidence_score = %s, risk_level_id = (SELECT id FROM types WHERE category='RiskLevel' AND name=%s),
                        priority_score = %s
                    WHERE id = %s
                """, (req.current_spend, req.benchmark_spend, variance_amount, savings_potential, confidence_score, risk_level, priority_score, existing_opp["id"]))
            opp_id = existing_opp["id"]
        else:
            cursor.execute(
                CREATE_OPPORTUNITY,
                (
                    opp_id,
                    req.category,
                    req.supplier_id,
                    req.current_spend,
                    req.benchmark_spend,
                    variance_amount,
                    savings_potential,
                    confidence_score,
                    risk_level,
                    priority_score,
                    "Pending Analysis",   # initial status
                    None,                 # no buyer assigned yet
                )
            )
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Failed to save opportunity: {str(e)}")

    log_audit_event(current_user["id"], "Detect Opportunity", "/api/opportunities/detect", {"opportunity_id": opp_id})
    conn.close()

    return format_api_response(
        data={
            "opportunity_id": opp_id,
            "category": req.category,
            "supplier_id": req.supplier_id,
            "current_spend": req.current_spend,
            "benchmark_spend": req.benchmark_spend,
            "variance_amount": variance_amount,
            "savings_potential": savings_potential,
            "confidence_score": confidence_score,
            "risk_level": risk_level,
            "priority_score": priority_score,
            "ai_explanation": analysis.get("explanation", ""),
        },
        message=f"Opportunity {opp_id} detected and saved successfully"
    )


@router.get("/buyers")
def list_buyers(current_user: dict = Depends(require_role(["Category Manager", "CPO"]))):
    """Returns all active Buyers for the assign-buyer dropdown."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.name, u.email
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.name = 'Buyer' AND u.status = 'Active'
        ORDER BY u.name ASC
    """)
    buyers = cursor.fetchall()
    conn.close()
    return format_api_response(data=buyers)

@router_tasks.post("/assign")
def assign_task(req: AssignTaskRequest, current_user: dict = Depends(require_role(["Category Manager", "CPO"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Verify opportunity exists
    cursor.execute("SELECT id, supplier_id, category FROM opportunities WHERE id = %s", (req.opportunity_id,))
    opp = cursor.fetchone()
    if not opp:
        conn.close()
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    # 2. Verify buyer exists and is active and has role Buyer
    cursor.execute("""
        SELECT u.id, u.name 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.id = %s AND r.name = 'Buyer' AND u.status = 'Active'
    """, (req.buyer_id,))
    buyer = cursor.fetchone()
    if not buyer:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid buyer_id. User must be active and have 'Buyer' role.")
        
    # 3. Create Task
    cursor.execute("""
        INSERT INTO tasks (opportunity_id, buyer_id, status, sla_hours)
        VALUES (%s, %s, 'OPEN', %s)
    """, (req.opportunity_id, req.buyer_id, req.sla_hours))
    task_id = cursor.lastrowid
    
    # 4. Update Opportunity
    cursor.execute("""
        UPDATE opportunities 
        SET assigned_buyer_id = %s, status_id = (SELECT id FROM statuses WHERE category='Opportunity' AND name='In Progress')
        WHERE id = %s
    """, (req.buyer_id, req.opportunity_id))
    
    # 5. Create Notification
    notif_title = f"New Task Assigned: {opp['category']}"
    notif_msg = f"You have been assigned to negotiate opportunity {req.opportunity_id}. SLA: {req.sla_hours} hours."
    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, opportunity_id)
        VALUES (%s, %s, %s, %s)
    """, (req.buyer_id, notif_title, notif_msg, req.opportunity_id))
    
    log_audit_event(current_user["id"], "Assign Task", "/api/tasks/assign", {"buyer_id": req.buyer_id, "opportunity_id": req.opportunity_id, "task_id": task_id})
    conn.close()
    return format_api_response(data={"task_id": f"TASK{task_id}", "status": "OPEN"}, message="Buyer assigned and task created successfully")

@router_tasks.put("/status")
def update_task_status(req: UpdateTaskStatusRequest, current_user: dict = Depends(require_role(["Buyer", "Category Manager", "CPO"]))):
    # Extract integer ID
    try:
        task_id_int = int(''.join(filter(str.isdigit, req.task_id)))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task_id format. Must contain digits.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Verify task exists
    cursor.execute("SELECT id, status, opportunity_id, buyer_id FROM tasks WHERE id = %s", (task_id_int,))
    task = cursor.fetchone()
    if not task:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
        
    # 2. Update status
    cursor.execute("UPDATE tasks SET status = %s WHERE id = %s", (req.status, task_id_int))
    
    # 3. Update opportunity status accordingly if status is CLOSED
    if req.status.upper() == "CLOSED":
        cursor.execute("""
            UPDATE opportunities 
            SET status_id = (SELECT id FROM statuses WHERE category='Opportunity' AND name='Completed')
            WHERE id = %s
        """, (task["opportunity_id"],))
        
    log_audit_event(current_user["id"], "Update Task Status", "/api/tasks/status", {"task_id": req.task_id, "status": req.status})
    conn.close()
    return format_api_response(message=f"Task status updated to {req.status} successfully")

@router_suppliers.get("/analytics")
def get_supplier_analytics(current_user: dict = Depends(require_role(["Buyer", "Category Manager", "CPO"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Fetch all suppliers and calculate analytics
    cursor.execute("""
        SELECT 
            s.id as supplier_id,
            s.name as supplier_name,
            s.category,
            t.name as risk_level,
            s.historical_discount
        FROM suppliers s
        JOIN types t ON s.risk_level_id = t.id
    """)
    suppliers = cursor.fetchall()
    
    analytics = []
    for s in suppliers:
        # risk_score: Low: 15, Medium: 50, High: 85
        risk_map = {"Low": 15.0, "Medium": 50.0, "High": 85.0}
        risk_score = risk_map.get(s["risk_level"], 40.0)
        
        historical_discount = float(s["historical_discount"] or 5.0)
        
        # pricing trend: calculate values based on actual negotiations
        cursor.execute("SELECT expected_savings, realised_savings FROM negotiations WHERE supplier_id = %s", (s["supplier_id"],))
        negs = cursor.fetchall()
        
        total_negs = len(negs)
        success_negs = 0
        realized_savings_sum = 0.0
        planned_savings_sum = 0.0
        
        for n in negs:
            realized = float(n["realised_savings"] or 0.0)
            planned = float(n["expected_savings"] or 0.0)
            realized_savings_sum += realized
            planned_savings_sum += planned
            if realized > 0.0:
                success_negs += 1
                
        success_rate = (success_negs / total_negs * 100.0) if total_negs > 0 else 85.0
        
        # pricing trend: mock Q1-Q4 trends
        pricing_trends = {
            "Q1": 100.0 - historical_discount,
            "Q2": 98.5 - historical_discount,
            "Q3": 97.0 - historical_discount,
            "Q4": 96.0 - historical_discount
        }
        
        # SLA score: mock average
        sla_score = 92.5 if s["risk_level"] == "Low" else (88.0 if s["risk_level"] == "Medium" else 81.0)
        
        # Delivery score: mock average
        delivery_score = 94.0 if s["risk_level"] == "Low" else (89.5 if s["risk_level"] == "Medium" else 83.0)
        
        analytics.append({
            "supplier_id": s["supplier_id"],
            "supplier_name": s["supplier_name"],
            "category": s["category"],
            "risk_score": risk_score,
            "sla_score": sla_score,
            "pricing_trends": pricing_trends,
            "delivery_score": delivery_score,
            "negotiation_success_rate": success_rate,
            "historical_discount": historical_discount,
            "total_negotiations": total_negs,
            "realized_savings": realized_savings_sum
        })
        
    conn.close()
    return format_api_response(data=analytics)


