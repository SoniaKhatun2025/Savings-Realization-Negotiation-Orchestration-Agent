import React from 'react';
import KpiCard from '../components/KpiCard';
import { dummyKpis } from '../data/dummyData';

const SavingsAnalyticsDashboard: React.FC = () => {
  return (
    <div>
      <h1>Savings Analytics & Finance Control</h1>
      <p>Validate realized savings and monitor planned vs realized variances.</p>
      
      <div className="dashboard-grid">
        {dummyKpis.finance.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="kpi-card">
          <h3>Planned vs Realized Savings (Monthly)</h3>
          {/* Simple CSS-based bar chart representation */}
          <div className="css-chart-container" style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '20px', marginTop: '20px' }}>
            <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', height: '100%', position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '80%', backgroundColor: 'var(--primary)' }}></div>
              <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '60%', backgroundColor: '#22c55e', opacity: 0.8 }}></div>
            </div>
            <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', height: '100%', position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '90%', backgroundColor: 'var(--primary)' }}></div>
              <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '85%', backgroundColor: '#22c55e', opacity: 0.8 }}></div>
            </div>
            <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', height: '100%', position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '70%', backgroundColor: 'var(--primary)' }}></div>
              <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '40%', backgroundColor: '#22c55e', opacity: 0.8 }}></div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px', gap: '20px', fontSize: '0.9rem' }}>
            <div><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'var(--primary)', marginRight: '5px' }}></span> Planned</div>
            <div><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#22c55e', marginRight: '5px' }}></span> Realized</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsAnalyticsDashboard;
