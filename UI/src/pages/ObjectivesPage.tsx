import React from 'react';
import { Link } from 'react-router-dom';

const ObjectivesPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Link to="/" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.5rem' }}>Agent19</Link>
        <Link to="/" className="nav-link">Back to Home</Link>
      </header>
      <main style={{ padding: '60px 40px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '50px' }}>Main Objectives</h2>
        <div className="dashboard-grid" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="kpi-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Identify Savings Opportunities</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.5' }}>Continuously analyze ERP spend data and purchase orders to surface hidden savings and price variance anomalies.</p>
          </div>
          <div className="kpi-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Orchestrate Negotiations</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.5' }}>Generate targeted playbooks, draft RFQ communications, and assign contextual tasks directly to Category Managers.</p>
          </div>
          <div className="kpi-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Track Realized Savings</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.5' }}>Close the loop by reconciling planned savings against actual outcomes, providing Finance Controllers with validated ROI metrics.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ObjectivesPage;
