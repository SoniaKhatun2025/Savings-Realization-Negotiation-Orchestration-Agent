import React from 'react';
import OpportunityQueue from '../components/OpportunityQueue';
import KpiCard from '../components/KpiCard';
import SupplierAnalytics from '../components/SupplierAnalytics';
import { dummyKpis } from '../data/dummyData';

const CategoryManagerDashboard: React.FC = () => {
  return (
    <div>
      <h1>Category Manager Dashboard</h1>
      <p>Review procurement opportunities and supplier performance.</p>
      
      <div className="dashboard-grid">
        {dummyKpis.categoryManager.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>
      
      <SupplierAnalytics />
      
      <OpportunityQueue />
    </div>
  );
};

export default CategoryManagerDashboard;
