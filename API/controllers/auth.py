from fastapi import APIRouter, HTTPException, Depends
from database.connection import get_db_connection
from database.queries import GET_USER_BY_EMAIL, GET_ALL_USERS, UPDATE_USER_STATUS, CREATE_USER
from database.models import UserLogin, Token, UserCreate, UserStatusUpdate
from utils.security import get_password_hash, verify_password, create_access_token
from utils.helpers import format_api_response
from utils.auth_deps import require_role, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])
router_audit = APIRouter(prefix="/audit", tags=["Audit"])

@router.post("/login", response_model=Token)
def login(user: UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(GET_USER_BY_EMAIL, (user.email,))
    db_user = cursor.fetchone()
    conn.close()
    
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # Check if the user is Active
    user_status = db_user.get("status", "Active")
    if user_status != "Active":
        raise HTTPException(
            status_code=403,
            detail=f"Your account is {user_status}. Please contact your administrator."
        )
        
    access_token = create_access_token(
        data={"sub": str(db_user["id"]), "role": db_user["role"], "name": db_user["name"]}
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": db_user["role"], "name": db_user["name"]}

@router.get("/users")
def get_users(current_user: dict = Depends(require_role(["CPO"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(GET_ALL_USERS)
    users = cursor.fetchall()
    conn.close()
    return format_api_response(users)

@router.put("/users/{user_id}/status")
def update_status(user_id: int, status_update: UserStatusUpdate, current_user: dict = Depends(require_role(["CPO"]))):
    if status_update.status not in ["Active", "Suspended", "Inactive"]:
        raise HTTPException(status_code=400, detail="Invalid status value. Must be Active, Suspended, or Inactive.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
        
    cursor.execute(UPDATE_USER_STATUS, (status_update.status, user_id))
    conn.close()
    return format_api_response(message=f"User status updated to {status_update.status} successfully")

@router.post("/users")
def create_user(user: UserCreate, current_user: dict = Depends(require_role(["CPO"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if email is already registered
    cursor.execute("SELECT id FROM users WHERE email = %s", (user.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Check if role exists
    cursor.execute("SELECT id FROM roles WHERE name = %s", (user.role,))
    role_db = cursor.fetchone()
    if not role_db:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Role '{user.role}' does not exist.")
        
    hashed_pwd = get_password_hash(user.password)
    cursor.execute(CREATE_USER, (user.name, user.email, hashed_pwd, user.role))
    conn.close()
    return format_api_response(message="User created successfully")

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return format_api_response(data=current_user)

@router_audit.get("/logs")
def get_audit_logs(current_user: dict = Depends(require_role(["CPO", "Admin", "Category Manager", "Finance Controller"]))):
    # Added other roles temporarily for testing and flexibility if needed, or CPO/Admin
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.id, u.name as user_name, u.email, a.action, a.target_api, a.details_json, a.timestamp
        FROM audit_logs a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.timestamp DESC
    """)
    logs = cursor.fetchall()
    
    import json
    for log in logs:
        if log.get("details_json"):
            try:
                log["details_json"] = json.loads(log["details_json"])
            except:
                pass
                
    conn.close()
    return format_api_response(data=logs)

