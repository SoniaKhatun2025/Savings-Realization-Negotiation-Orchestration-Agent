CREATE DATABASE  IF NOT EXISTS `nexus_procure_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `nexus_procure_db`;
-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 187.127.163.17    Database: nexus_procure_db
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `approvals`
--

DROP TABLE IF EXISTS `approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approvals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `negotiation_id` int NOT NULL,
  `approved_by` int NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `comment` text,
  `decided_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `negotiation_id` (`negotiation_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `approvals_ibfk_1` FOREIGN KEY (`negotiation_id`) REFERENCES `negotiations` (`id`),
  CONSTRAINT `approvals_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approvals`
--

LOCK TABLES `approvals` WRITE;
/*!40000 ALTER TABLE `approvals` DISABLE KEYS */;
INSERT INTO `approvals` VALUES (1,1,4,'approved','','2026-05-27 12:27:08');
/*!40000 ALTER TABLE `approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` varchar(255) NOT NULL,
  `fiscal_year` year NOT NULL,
  `allocated_amount` decimal(15,2) NOT NULL,
  `actual_spend` decimal(15,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category` (`category`,`fiscal_year`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budgets`
--

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
INSERT INTO `budgets` VALUES (1,'IT Hardware',2026,500000.00,0.00,'2026-05-27 11:14:22');
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_history`
--

DROP TABLE IF EXISTS `chat_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `message` text NOT NULL,
  `sender_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `sender_id` (`sender_id`),
  CONSTRAINT `chat_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chat_history_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_history`
--

LOCK TABLES `chat_history` WRITE;
/*!40000 ALTER TABLE `chat_history` DISABLE KEYS */;
INSERT INTO `chat_history` VALUES (12,1,'Show expiring contracts',11,'2026-05-27 12:30:07'),(13,1,' Based on the provided data, there are no explicit contract expiration dates listed in the context. However, I can provide you with a list of ongoing contracts for IT Hardware suppliers that have significant variance amounts, which could potentially be renegotiated or replaced before their natural expiry to secure potential savings:\n\n1. TechSource India Pvt Ltd\n   - Category: IT Hardware\n   - Variance Amount: Rs.120000.00, Potential Savings: Rs.120000.00\n\n2. TechSource India Pvt Ltd\n   - Category: IT Hardware\n   - Variance Amount: Rs.100000.00, Potential Savings: Rs.100000.00\n\n3. TechSource India Pvt Ltd\n   - Category: IT Hardware\n   - Variance Amount: Rs.-100000.00, Potential Savings: Rs.100000.00\n\n4. CloudNet Solutions\n   - Category: IT Hardware\n   - Variance Amount: Rs.-100000.00, Potential Savings: Rs.100000.00\n\nThese suppliers have shown significant variance in their pricing compared to historical spending, and renegotiating or replacing these contracts could potentially lead to substantial savings for your enterprise. I recommend reviewing these contracts and initiating discussions with the respective suppliers regarding potential price adjustments or contract renewals.',12,'2026-05-27 12:31:00');
/*!40000 ALTER TABLE `chat_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `negotiations`
--

DROP TABLE IF EXISTS `negotiations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `negotiations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `opportunity_id` varchar(50) DEFAULT NULL,
  `supplier_id` int DEFAULT NULL,
  `buyer_id` int DEFAULT NULL,
  `target_price` decimal(15,2) DEFAULT NULL,
  `walkaway_price` decimal(15,2) DEFAULT NULL,
  `expected_savings` decimal(15,2) DEFAULT NULL,
  `ai_confidence_explanation` text,
  `talking_points` text,
  `status_id` int NOT NULL,
  `sla_due_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actual_price` decimal(15,2) DEFAULT NULL,
  `realised_savings` decimal(15,2) DEFAULT NULL,
  `comment` text,
  PRIMARY KEY (`id`),
  KEY `opportunity_id` (`opportunity_id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `buyer_id` (`buyer_id`),
  KEY `status_id` (`status_id`),
  CONSTRAINT `negotiations_ibfk_1` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`id`),
  CONSTRAINT `negotiations_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `negotiations_ibfk_3` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `negotiations_ibfk_4` FOREIGN KEY (`status_id`) REFERENCES `statuses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `negotiations`
--

LOCK TABLES `negotiations` WRITE;
/*!40000 ALTER TABLE `negotiations` DISABLE KEYS */;
INSERT INTO `negotiations` VALUES (1,'OPP-869BD06F',1,2,400000.00,520000.00,100000.00,'The target price is calculated by subtracting the savings potential from the current spend and adjusting for a 5% margin. The walkaway price is set at the current spend plus a 10% premium to account for any risk or unwillingness to negotiate on the supplier\'s part. The expected savings are based on the identified savings potential and a confidence score of 95.','[\"Given the current spend and variance amount, we believe a reduction in price is necessary to align with our budget for IT Hardware.\", \"Our analysis shows that TechSource India Pvt Ltd has shown a willingness to discount in the past. We are hoping to leverage this history to secure a better deal.\", \"We have identified a savings potential of $120,000 based on benchmark spend. Our goal is to achieve at least 83% of this potential ($100,000) in this negotiation.\"]',12,NULL,'2026-05-27 09:20:12',88000.00,12000.00,'Negotiated successfully with volume discount.'),(2,'OPP-869BD06F',1,1,400000.00,520000.00,100000.00,'The target price of $400,000 is based on the current spend, benchmark spend, variance amount, and the supplier\'s history of discounting. The walkaway price of $520,000 is set to ensure a minimum savings of $80,000 (the difference between the current spend and the benchmark spend). The expected savings of $100,000 is calculated as the variance amount minus a reasonable margin for negotiation.','[\"Given the current spend of $500,000 and the benchmark spend of $380,000, we see a variance of $120,000. This opportunity presents a potential savings of $120,000.\", \"Our analysis indicates a confidence score of 95% that this opportunity can be realized. The priority score is also high at 9.\", \"Historically, TechSource India Pvt Ltd has shown a willingness to discount.\"]',6,NULL,'2026-05-27 11:16:29',NULL,NULL,NULL),(3,'OPP-869BD06F',1,1,400000.00,520000.00,120000.00,'Based on the high confidence score (95) and the past performance of TechSource India Pvt Ltd in discounting, it is expected that they will be willing to negotiate towards our target price. The walkaway price is set at $520,000 as a contingency in case negotiations do not meet our expectations.','[\"Given the current spend of $500,000 and our benchmark spend of $380,000, we see a variance of $120,000.\", \"Our analysis indicates that TechSource India Pvt Ltd has shown a willingness to discount in the past.\", \"We are aiming for a target price of $400,000, which would result in an expected savings of $120,000. However, we understand that this is a significant reduction and are open to discussing potential solutions.\"]',6,NULL,'2026-05-27 12:29:12',NULL,NULL,NULL);
/*!40000 ALTER TABLE `negotiations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `opportunity_id` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `opportunity_id` (`opportunity_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opportunities`
--

DROP TABLE IF EXISTS `opportunities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opportunities` (
  `id` varchar(50) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `supplier_id` int DEFAULT NULL,
  `current_spend` decimal(15,2) DEFAULT NULL,
  `benchmark_spend` decimal(15,2) DEFAULT NULL,
  `variance_amount` decimal(15,2) DEFAULT NULL,
  `savings_potential` decimal(15,2) DEFAULT NULL,
  `confidence_score` int DEFAULT NULL,
  `risk_level_id` int DEFAULT NULL,
  `priority_score` int DEFAULT NULL,
  `status_id` int NOT NULL,
  `assigned_buyer_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `assigned_buyer_id` (`assigned_buyer_id`),
  KEY `risk_level_id` (`risk_level_id`),
  KEY `status_id` (`status_id`),
  CONSTRAINT `opportunities_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `opportunities_ibfk_2` FOREIGN KEY (`assigned_buyer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `opportunities_ibfk_3` FOREIGN KEY (`risk_level_id`) REFERENCES `types` (`id`),
  CONSTRAINT `opportunities_ibfk_4` FOREIGN KEY (`status_id`) REFERENCES `statuses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opportunities`
--

LOCK TABLES `opportunities` WRITE;
/*!40000 ALTER TABLE `opportunities` DISABLE KEYS */;
INSERT INTO `opportunities` VALUES ('OPP-869BD06F','IT Hardware',1,500000.00,380000.00,120000.00,120000.00,95,1,10,1,1,'2026-05-27 09:17:35'),('OPP-871FA655','IT Hardware',1,500000.00,600000.00,-100000.00,100000.00,95,1,9,1,NULL,'2026-05-27 11:25:18'),('OPP-AB2C2B4F','IT Hardware',3,500000.00,600000.00,-100000.00,100000.00,95,1,9,1,NULL,'2026-05-27 11:24:07'),('OPP-FB3F0B73','IT Hardware',1,500000.00,400000.00,100000.00,100000.00,95,1,9,1,NULL,'2026-05-27 11:24:48');
/*!40000 ALTER TABLE `opportunities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Buyer'),(2,'Category Manager'),(4,'CPO'),(3,'Finance Controller');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `savings_tracker`
--

DROP TABLE IF EXISTS `savings_tracker`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `savings_tracker` (
  `id` int NOT NULL AUTO_INCREMENT,
  `negotiation_id` int DEFAULT NULL,
  `planned_savings` decimal(15,2) DEFAULT NULL,
  `realized_savings` decimal(15,2) DEFAULT '0.00',
  `status_id` int NOT NULL,
  `validated_by_id` int DEFAULT NULL,
  `validated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `negotiation_id` (`negotiation_id`),
  KEY `validated_by_id` (`validated_by_id`),
  KEY `status_id` (`status_id`),
  CONSTRAINT `savings_tracker_ibfk_1` FOREIGN KEY (`negotiation_id`) REFERENCES `negotiations` (`id`),
  CONSTRAINT `savings_tracker_ibfk_2` FOREIGN KEY (`validated_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `savings_tracker_ibfk_3` FOREIGN KEY (`status_id`) REFERENCES `statuses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `savings_tracker`
--

LOCK TABLES `savings_tracker` WRITE;
/*!40000 ALTER TABLE `savings_tracker` DISABLE KEYS */;
INSERT INTO `savings_tracker` VALUES (1,1,100000.00,12000.00,15,4,'2026-05-27 12:27:08');
/*!40000 ALTER TABLE `savings_tracker` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `statuses`
--

DROP TABLE IF EXISTS `statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `statuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category` (`category`,`name`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `statuses`
--

LOCK TABLES `statuses` WRITE;
/*!40000 ALTER TABLE `statuses` DISABLE KEYS */;
INSERT INTO `statuses` VALUES (20,'Document','Failed'),(19,'Document','Indexed'),(18,'Document','Processing'),(17,'Document','Uploading'),(6,'Negotiation','Assigned'),(12,'Negotiation','Completed'),(13,'Negotiation','Escalated'),(10,'Negotiation','Negotiating'),(8,'Negotiation','Outreach Sent'),(11,'Negotiation','Pending Approval'),(7,'Negotiation','Reviewing'),(9,'Negotiation','Supplier Responded'),(4,'Opportunity','Completed'),(5,'Opportunity','Escalated'),(3,'Opportunity','In Progress'),(1,'Opportunity','Pending Analysis'),(2,'Opportunity','Ready for Negotiation'),(16,'Savings','Leakage Detected'),(14,'Savings','Pending Validation'),(15,'Savings','Validated');
/*!40000 ALTER TABLE `statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `risk_level_id` int NOT NULL,
  `historical_discount` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `risk_level_id` (`risk_level_id`),
  CONSTRAINT `suppliers_ibfk_1` FOREIGN KEY (`risk_level_id`) REFERENCES `types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'TechSource India Pvt Ltd','IT Hardware',1,12.50,'2026-05-27 09:16:44'),(2,'Global Office Supplies Co','Office Supplies',2,8.00,'2026-05-27 09:16:44'),(3,'CloudNet Solutions','Software & Licensing',1,15.00,'2026-05-27 09:16:44'),(4,'BuildPro Materials Ltd','Facilities & Maintenance',3,5.50,'2026-05-27 09:16:44'),(5,'LogiTrans Freight Services','Logistics',2,9.00,'2026-05-27 09:16:44'),(6,'PrintMax Services','Marketing & Print',1,11.00,'2026-05-27 09:16:44'),(7,'SecureGuard Systems','Security Services',2,7.50,'2026-05-27 09:16:44'),(8,'EnergyFirst Utilities','Utilities',3,3.00,'2026-05-27 09:16:44');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `types`
--

DROP TABLE IF EXISTS `types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category` (`category`,`name`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `types`
--

LOCK TABLES `types` WRITE;
/*!40000 ALTER TABLE `types` DISABLE KEYS */;
INSERT INTO `types` VALUES (12,'ChatSender','AI'),(11,'ChatSender','User'),(9,'DocumentType','Benchmark'),(4,'DocumentType','Contract'),(6,'DocumentType','Invoice'),(10,'DocumentType','Other'),(8,'DocumentType','Policy'),(7,'DocumentType','Pricing Sheet'),(5,'DocumentType','RFQ'),(3,'RiskLevel','High'),(1,'RiskLevel','Low'),(2,'RiskLevel','Medium');
/*!40000 ALTER TABLE `types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uploaded_documents`
--

DROP TABLE IF EXISTS `uploaded_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uploaded_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `storage_url` varchar(500) DEFAULT NULL,
  `doc_type_id` int NOT NULL,
  `uploaded_by_id` int DEFAULT NULL,
  `processing_status_id` int NOT NULL,
  `extraction_status` varchar(50) DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `uploaded_by_id` (`uploaded_by_id`),
  KEY `doc_type_id` (`doc_type_id`),
  KEY `processing_status_id` (`processing_status_id`),
  CONSTRAINT `uploaded_documents_ibfk_1` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `uploaded_documents_ibfk_2` FOREIGN KEY (`doc_type_id`) REFERENCES `types` (`id`),
  CONSTRAINT `uploaded_documents_ibfk_3` FOREIGN KEY (`processing_status_id`) REFERENCES `statuses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uploaded_documents`
--

LOCK TABLES `uploaded_documents` WRITE;
/*!40000 ALTER TABLE `uploaded_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `uploaded_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `role_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Suman Khamrai','sumankhamrai.98@gmail.com','$2b$12$HcR9z3RKfH5eILQDf53.HOw.qWFW/Lqjow5kLezE3Rp7VsYJfvZZa',1,'2026-05-26 12:23:37','Active'),(2,'Manager Agent','khamraisuman7211@gmail.com','$2b$12$HcR9z3RKfH5eILQDf53.HOw.qWFW/Lqjow5kLezE3Rp7VsYJfvZZa',2,'2026-05-26 12:23:37','Active'),(3,'Finance Agent','finance@insureai.com','$2b$12$HcR9z3RKfH5eILQDf53.HOw.qWFW/Lqjow5kLezE3Rp7VsYJfvZZa',3,'2026-05-26 12:23:37','Active'),(4,'CPO Agent','cpo@insureai.com','$2b$12$HcR9z3RKfH5eILQDf53.HOw.qWFW/Lqjow5kLezE3Rp7VsYJfvZZa',4,'2026-05-26 12:23:37','Active');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'nexus_procure_db'
--

--
-- Dumping routines for database 'nexus_procure_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-27 19:55:00
