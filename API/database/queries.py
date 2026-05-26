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
    SELECT o.*, s.name as supplier_name, stat.name as status_name 
    FROM opportunities o 
    JOIN suppliers s ON o.supplier_id = s.id
    JOIN statuses stat ON o.status_id = stat.id
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
    SELECT n.*, s.name as supplier_name, o.category, stat.name as status_name
    FROM negotiations n
    JOIN suppliers s ON n.supplier_id = s.id
    JOIN opportunities o ON n.opportunity_id = o.id
    JOIN statuses stat ON n.status_id = stat.id
    WHERE n.buyer_id = %s
"""

CREATE_DOCUMENT = """
    INSERT INTO uploaded_documents (filename, doc_type_id, uploaded_by_id, processing_status_id) 
    VALUES (%s, (SELECT id FROM types WHERE category='DocumentType' AND name=%s), %s, (SELECT id FROM statuses WHERE category='Document' AND name='Uploading'))
"""

UPDATE_DOCUMENT_STATUS = """
    UPDATE uploaded_documents 
    SET processing_status_id = (SELECT id FROM statuses WHERE category='Document' AND name=%s), extraction_status = %s 
    WHERE id = %s
"""

GET_DASHBOARD_SAVINGS = """
    SELECT 
        SUM(planned_savings) as total_planned,
        SUM(realized_savings) as total_realized
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
