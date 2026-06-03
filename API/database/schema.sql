CREATE DATABASE IF NOT EXISTS nexus_procure_db;
USE nexus_procure_db;

-- Universal Master Tables
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- e.g. Opportunity, Negotiation, Savings, Document
    name VARCHAR(50) NOT NULL,
    UNIQUE(category, name)
);

CREATE TABLE IF NOT EXISTS types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- e.g. RiskLevel, DocumentType, ChatSender
    name VARCHAR(50) NOT NULL,
    UNIQUE(category, name)
);

-- Seed Initial Master Data
INSERT IGNORE INTO roles (name) VALUES 
('Buyer'), ('Category Manager'), ('Finance Controller'), ('CPO');

INSERT IGNORE INTO statuses (category, name) VALUES 
('Opportunity', 'Pending Analysis'), ('Opportunity', 'Ready for Negotiation'), ('Opportunity', 'In Progress'), ('Opportunity', 'Completed'), ('Opportunity', 'Escalated'),
('Negotiation', 'Assigned'), ('Negotiation', 'Reviewing'), ('Negotiation', 'Outreach Sent'), ('Negotiation', 'Supplier Responded'), ('Negotiation', 'Negotiating'), ('Negotiation', 'Pending Approval'), ('Negotiation', 'Completed'), ('Negotiation', 'Escalated'),
('Savings', 'Pending Validation'), ('Savings', 'Validated'), ('Savings', 'Leakage Detected'),
('Document', 'Uploading'), ('Document', 'Processing'), ('Document', 'Indexed'), ('Document', 'Failed');

INSERT IGNORE INTO types (category, name) VALUES 
('RiskLevel', 'Low'), ('RiskLevel', 'Medium'), ('RiskLevel', 'High'),
('DocumentType', 'Contract'), ('DocumentType', 'RFQ'), ('DocumentType', 'Invoice'), ('DocumentType', 'Pricing Sheet'), ('DocumentType', 'Policy'), ('DocumentType', 'Benchmark'), ('DocumentType', 'Other'),
('ChatSender', 'User'), ('ChatSender', 'AI');


-- Core Tables
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Seed initial users with password '1234'
INSERT IGNORE INTO users (name, email, hashed_password, role_id, status) VALUES 
('Buyer Agent', 'sumanaiinhome@gmail.com', '$2b$12$HcR9z3RKfH5eILQDf53.HOw.qWFW/Lqjow5kLezE3Rp7VsYJfvZZa', (SELECT id FROM roles WHERE name='Buyer'), 'Active'),
('Manager Agent', 'khamraisuman7211@gmail.com', '$2b$12$HcR9z3RKfH5eILQDf53.HOw.qWFW/Lqjow5kLezE3Rp7VsYJfvZZa', (SELECT id FROM roles WHERE name='Category Manager'), 'Active'),
('Finance Agent', 'gobindakhamrai.98@gmail.com', '$2b$12$HcR9z3RKfH5eILQDf53.HOw.qWFW/Lqjow5kLezE3Rp7VsYJfvZZa', (SELECT id FROM roles WHERE name='Finance Controller'), 'Active'),
('CPO Agent', 'sumankhamrai.98@gmail.com', '$2b$12$HcR9z3RKfH5eILQDf53.HOw.qWFW/Lqjow5kLezE3Rp7VsYJfvZZa', (SELECT id FROM roles WHERE name='CPO'), 'Active');

CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    risk_level_id INT NOT NULL,
    historical_discount DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (risk_level_id) REFERENCES types(id)
);

CREATE TABLE IF NOT EXISTS opportunities (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(255),
    supplier_id INT,
    current_spend DECIMAL(15,2),
    benchmark_spend DECIMAL(15,2),
    variance_amount DECIMAL(15,2),
    savings_potential DECIMAL(15,2),
    confidence_score INT,
    risk_level_id INT,
    priority_score INT,
    status_id INT NOT NULL,
    assigned_buyer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (assigned_buyer_id) REFERENCES users(id),
    FOREIGN KEY (risk_level_id) REFERENCES types(id),
    FOREIGN KEY (status_id) REFERENCES statuses(id)
);

CREATE TABLE IF NOT EXISTS negotiations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    opportunity_id VARCHAR(50),
    supplier_id INT,
    buyer_id INT,
    target_price DECIMAL(15,2),
    walkaway_price DECIMAL(15,2),
    expected_savings DECIMAL(15,2),
    actual_price DECIMAL(15,2) NULL,
    realised_savings DECIMAL(15,2) NULL,
    comment TEXT NULL,
    ai_confidence_explanation TEXT,
    talking_points TEXT, -- Stored as JSON string
    status_id INT NOT NULL,
    sla_due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (status_id) REFERENCES statuses(id)
);

CREATE TABLE IF NOT EXISTS savings_tracker (
    id INT AUTO_INCREMENT PRIMARY KEY,
    negotiation_id INT,
    planned_savings DECIMAL(15,2),
    realized_savings DECIMAL(15,2) DEFAULT 0.00,
    status_id INT NOT NULL,
    validated_by_id INT,
    validated_at TIMESTAMP NULL,
    FOREIGN KEY (negotiation_id) REFERENCES negotiations(id),
    FOREIGN KEY (validated_by_id) REFERENCES users(id),
    FOREIGN KEY (status_id) REFERENCES statuses(id)
);

CREATE TABLE IF NOT EXISTS uploaded_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    doc_type_id INT NOT NULL,
    uploaded_by_id INT,
    processing_status_id INT NOT NULL,
    extraction_status VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by_id) REFERENCES users(id),
    FOREIGN KEY (doc_type_id) REFERENCES types(id),
    FOREIGN KEY (processing_status_id) REFERENCES statuses(id)
);

CREATE TABLE IF NOT EXISTS chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    message TEXT NOT NULL,
    sender_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (sender_id) REFERENCES types(id)
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(255) NOT NULL,
    fiscal_year YEAR NOT NULL,
    allocated_amount DECIMAL(15,2) NOT NULL,
    actual_spend DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, fiscal_year)
);

-- Approvals table
CREATE TABLE IF NOT EXISTS approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    negotiation_id INT NOT NULL,
    approved_by INT NOT NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    comment TEXT,
    decided_at TIMESTAMP NULL,
    FOREIGN KEY (negotiation_id) REFERENCES negotiations(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    opportunity_id VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    opportunity_id VARCHAR(50) NOT NULL,
    buyer_id INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    sla_hours INT DEFAULT 48,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id)
);

-- Savings ledger table
CREATE TABLE IF NOT EXISTS savings_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    opportunity_id VARCHAR(50) NOT NULL,
    validated_amount DECIMAL(15,2) DEFAULT '0.00',
    validated_by INT NOT NULL,
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'Approved',
    FOREIGN KEY (opportunity_id) REFERENCES opportunities(id),
    FOREIGN KEY (validated_by) REFERENCES users(id)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    target_api VARCHAR(255) NOT NULL,
    details_json TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

