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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Seed initial users with password '1234'
INSERT IGNORE INTO users (name, email, hashed_password, role_id) VALUES 
('Buyer Agent', 'buyer@insureai.com', '$2b$12$HcR9z3RKfH5eILQDf53.HOw.qWFW/Lqjow5kLezE3Rp7VsYJfvZZa', (SELECT id FROM roles WHERE name='Buyer')),
('Manager Agent', 'manager@insureai.com', '$2b$12$HcR9z3RKfH5eILQDf53.HOw.qWFW/Lqjow5kLezE3Rp7VsYJfvZZa', (SELECT id FROM roles WHERE name='Category Manager')),
('Finance Agent', 'finance@insureai.com', '$2b$12$HcR9z3RKfH5eILQDf53.HOw.qWFW/Lqjow5kLezE3Rp7VsYJfvZZa', (SELECT id FROM roles WHERE name='Finance Controller')),
('CPO Agent', 'cpo@insureai.com', '$2b$12$HcR9z3RKfH5eILQDf53.HOw.qWFW/Lqjow5kLezE3Rp7VsYJfvZZa', (SELECT id FROM roles WHERE name='CPO'));

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
