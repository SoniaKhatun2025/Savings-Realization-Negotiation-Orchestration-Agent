import React from 'react';
import KpiCard from '../components/KpiCard';
import KnowledgeBaseUpload from '../components/KnowledgeBaseUpload';
import { dummyKpis } from '../data/dummyData';

const CpoDashboard: React.FC = () => {
  return (
    <div>
      <h1>Executive Dashboard</h1>
      <p>Welcome, Chief Procurement Officer. Here are the enterprise savings KPIs.</p>
      
      <div className="dashboard-grid">
        {dummyKpis.cpo.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>
      
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        <KnowledgeBaseUpload />
      </div>
    </div>
  );
};

export default CpoDashboard;
