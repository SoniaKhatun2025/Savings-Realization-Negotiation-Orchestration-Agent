import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout and Pages
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CpoDashboard from './pages/CpoDashboard';
import CategoryManagerDashboard from './pages/CategoryManagerDashboard';
import BuyerWorkspace from './pages/BuyerWorkspace';
import SavingsAnalyticsDashboard from './pages/SavingsAnalyticsDashboard';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import SupplierAnalyticsPage from './pages/SupplierAnalyticsPage';
import OpportunityQueuePage from './pages/OpportunityQueuePage';
import ProcurementChatbotPage from './pages/ProcurementChatbotPage';
import SavingsTrackerPage from './pages/SavingsTrackerPage';
import AuditLogsPage from './pages/AuditLogsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Default redirect if they hit /dashboard directly */}
          <Route index element={<Navigate to="cpo" replace />} />
          
          {/* Persona Dashboards */}
          <Route path="cpo" element={<CpoDashboard />} />
          <Route path="category" element={<CategoryManagerDashboard />} />
          <Route path="buyer" element={<BuyerWorkspace />} />
          <Route path="finance" element={<SavingsAnalyticsDashboard />} />
          
          {/* Component-Specific Pages */}
          <Route path="knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="supplier-analytics" element={<SupplierAnalyticsPage />} />
          <Route path="opportunity-queue" element={<OpportunityQueuePage />} />
          <Route path="chatbot" element={<ProcurementChatbotPage />} />
          <Route path="savings-tracker" element={<SavingsTrackerPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
