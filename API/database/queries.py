# SQL Query Strings for NexusProcure (Master Tables Schema)

GET_USER_BY_EMAIL = """
    SELECT u.*, r.name as role 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.email = %s
"""

CREATE_USER = """
    INSERT INTO users (name, email, hashed_password, role_id) 
    VALUES (%s, %s, %s, (SELECT id FROM roles WHERE name = %s))
"""

GET_ALL_OPPORTUNITIES = """
    SELECT o.*, s.name as supplier_name, stat.name as status_name, u.name as buyer_name
    FROM opportunities o 
    JOIN suppliers s ON o.supplier_id = s.id
    JOIN statuses stat ON o.status_id = stat.id
    LEFT JOIN users u ON o.assigned_buyer_id = u.id
"""

GET_OPPORTUNITY_BY_ID = """
    SELECT o.*, s.name as supplier_name 
    FROM opportunities o 
    JOIN suppliers s ON o.supplier_id = s.id
    WHERE o.id = %s
"""

CREATE_OPPORTUNITY = """
    INSERT INTO opportunities 
    (id, category, supplier_id, current_spend, benchmark_spend, variance_amount, savings_potential, confidence_score, risk_level_id, priority_score, status_id, assigned_buyer_id)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, (SELECT id FROM types WHERE category='RiskLevel' AND name=%s), %s, (SELECT id FROM statuses WHERE category='Opportunity' AND name=%s), %s)
"""

CREATE_NEGOTIATION = """
    INSERT INTO negotiations
    (opportunity_id, supplier_id, buyer_id, target_price, walkaway_price, expected_savings, ai_confidence_explanation, talking_points, status_id)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, (SELECT id FROM statuses WHERE category='Negotiation' AND name='Assigned'))
"""

GET_NEGOTIATIONS_BY_BUYER = """
    SELECT n.*, s.name as supplier_name, o.category, o.current_spend as current_spend, stat.name as status_name
    FROM negotiations n
    JOIN suppliers s ON n.supplier_id = s.id
    JOIN opportunities o ON n.opportunity_id = o.id
    JOIN statuses stat ON n.status_id = stat.id
    WHERE n.buyer_id = %s
"""

CREATE_DOCUMENT = """
    INSERT INTO uploaded_documents (filename, storage_url, doc_type_id, uploaded_by_id, processing_status_id) 
    VALUES (%s, %s, (SELECT id FROM types WHERE category='DocumentType' AND name=%s), %s, (SELECT id FROM statuses WHERE category='Document' AND name='Uploading'))
"""

UPDATE_DOCUMENT_STATUS = """
    UPDATE uploaded_documents 
    SET processing_status_id = (SELECT id FROM statuses WHERE category='Document' AND name=%s), extraction_status = %s 
    WHERE id = %s
"""

UPDATE_DOCUMENT_TYPE = """
    UPDATE uploaded_documents 
    SET doc_type_id = (SELECT id FROM types WHERE category='DocumentType' AND name=%s)
    WHERE id = %s
"""

GET_DASHBOARD_SAVINGS = """
    SELECT 
        SUM(planned_savings) as total_planned,
        SUM(CASE WHEN status_id = (SELECT id FROM statuses WHERE category='Savings' AND name='Validated') THEN realized_savings ELSE 0.0 END) as total_realized
    FROM savings_tracker
"""

SAVE_CHAT_MESSAGE = """
    INSERT INTO chat_history (user_id, message, sender_id) 
    VALUES (%s, %s, (SELECT id FROM types WHERE category='ChatSender' AND name=%s))
"""

GET_CHAT_HISTORY = """
    SELECT c.message, t.name as sender, c.created_at 
    FROM chat_history c
    JOIN types t ON c.sender_id = t.id
    WHERE c.user_id = %s ORDER BY c.created_at ASC
"""

GET_ALL_USERS = """
    SELECT u.id, u.name, u.email, r.name as role, u.status, u.created_at 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    ORDER BY u.created_at DESC
"""

UPDATE_USER_STATUS = """
    UPDATE users 
    SET status = %s 
    WHERE id = %s
"""

CREATE_BUDGET = """
    INSERT INTO budgets (category, fiscal_year, allocated_amount)
    VALUES (%s, %s, %s)
"""

UPDATE_BUDGET = """
    UPDATE budgets
    SET allocated_amount = %s, actual_spend = %s
    WHERE id = %s
"""

GET_BUDGETS = "SELECT * FROM budgets"

GET_BUDGET_BY_CATEGORY_YEAR = """
    SELECT * FROM budgets WHERE category = %s AND fiscal_year = %s
"""

CREATE_APPROVAL = """
    INSERT INTO approvals (negotiation_id, approved_by, comment)
    VALUES (%s, %s, %s)
"""

UPDATE_APPROVAL_STATUS = """
    UPDATE approvals
    SET status = %s, comment = %s, decided_at = CURRENT_TIMESTAMP
    WHERE id = %s
"""

GET_APPROVAL_BY_NEGOTIATION = """
    SELECT * FROM approvals WHERE negotiation_id = %s ORDER BY decided_at DESC LIMIT 1
"""

ASSIGN_BUYER_TO_OPPORTUNITY = """
    UPDATE opportunities
    SET assigned_buyer_id = %s, priority_score = %s
    WHERE id = %s
"""

UPDATE_NEGOTIATION_OUTCOME = """
    UPDATE negotiations
    SET actual_price = %s,
        realised_savings = %s,
        comment = %s,
        status_id = (SELECT id FROM statuses WHERE category='Negotiation' AND name='Completed')
    WHERE id = %s
"""

VALIDATE_SAVINGS_AGAINST_BUDGET = """
    SELECT b.category, b.fiscal_year, b.allocated_amount,
           COALESCE(SUM(s.realized_savings), 0) AS realized,
           b.allocated_amount - COALESCE(SUM(s.realized_savings), 0) AS variance
    FROM budgets b
    LEFT JOIN opportunities o ON b.category = o.category AND YEAR(o.created_at) = b.fiscal_year
    LEFT JOIN negotiations n ON o.id = n.opportunity_id
    LEFT JOIN savings_tracker s ON n.id = s.negotiation_id
    GROUP BY b.id
    HAVING variance <> 0
"""

GET_KNOWLEDGE_STATS = """
    SELECT 
        (SELECT COUNT(*) FROM suppliers) as total_suppliers,
        (SELECT COUNT(*) FROM uploaded_documents WHERE doc_type_id = (SELECT id FROM types WHERE category='DocumentType' AND name='Contract')) as total_contracts,
        (SELECT COUNT(*) FROM uploaded_documents WHERE doc_type_id = (SELECT id FROM types WHERE category='DocumentType' AND name='Benchmark')) as total_benchmarks
"""

GET_MONTHLY_SAVINGS_TREND = """
    SELECT 
        DATE_FORMAT(n.created_at, '%b') as month,
        SUM(n.expected_savings) as planned,
        SUM(n.realised_savings) as realized
    FROM negotiations n
    GROUP BY MONTH(n.created_at), DATE_FORMAT(n.created_at, '%b')
    ORDER BY MONTH(n.created_at) ASC
"""

GET_TOP_SAVINGS_CATEGORIES = """
    SELECT 
        o.category,
        SUM(n.realised_savings) as total_realized
    FROM negotiations n
    JOIN opportunities o ON n.opportunity_id = o.id
    WHERE n.realised_savings IS NOT NULL AND n.realised_savings > 0
    GROUP BY o.category
    ORDER BY total_realized DESC
    LIMIT 3
"""

CREATE_NOTIFICATION = """
    INSERT INTO notifications (user_id, title, message, opportunity_id)
    VALUES (%s, %s, %s, %s)
"""

GET_UNREAD_NOTIFICATIONS = """
    SELECT * FROM notifications 
    WHERE user_id = %s AND is_read = FALSE 
    ORDER BY created_at DESC
"""

MARK_NOTIFICATION_READ = """
    UPDATE notifications SET is_read = TRUE WHERE id = %s AND user_id = %s
"""

FIND_SUPPLIER_BY_NAME = """
    SELECT id, name FROM suppliers WHERE LOWER(name) LIKE %s LIMIT 1
"""

GET_RANDOM_BUYER = """
    SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name='Buyer') ORDER BY RAND() LIMIT 1
"""

