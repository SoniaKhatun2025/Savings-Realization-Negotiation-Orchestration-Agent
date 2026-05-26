import React from 'react';
import { motion } from 'framer-motion';
import KpiCard from '../components/KpiCard';
import { dummyKpis } from '../data/dummyData';

const SavingsTrackerPage: React.FC = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <header className="dashboard-header">
        <h1>Savings Realization Tracker</h1>
        <p>Monitor planned vs realized savings and negotiation success rates across all categories.</p>
      </header>
      
      <div className="dashboard-grid">
        {dummyKpis.buyerTracker.map((kpi, idx) => (
          <motion.div key={idx} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }}>
            <KpiCard {...kpi} />
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="kpi-card">
          <h3>Monthly Savings Realization Trend</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Comparing Planned Savings (Blue) vs Realized Validation (Green)</p>
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '40px', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', marginTop: '20px' }}>
            {/* Enterprise Bar Chart Mockup */}
            {[
              { month: 'Jan', planned: 40, realized: 35 },
              { month: 'Feb', planned: 55, realized: 50 },
              { month: 'Mar', planned: 30, realized: 28 },
              { month: 'Apr', planned: 80, realized: 75, highlight: true },
              { month: 'May', planned: 90, realized: 85, highlight: true }
            ].map((data, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', position: 'relative' }}>
                <div style={{ display: 'flex', gap: '5px', height: '100%', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${data.planned}%` }} transition={{ duration: 1, delay: 0.5 }} style={{ background: 'rgba(59, 130, 246, 0.5)', width: '30px', borderRadius: '4px 4px 0 0' }}></motion.div>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${data.realized}%` }} transition={{ duration: 1, delay: 0.7 }} style={{ background: data.highlight ? '#22c55e' : '#10b981', width: '30px', borderRadius: '4px 4px 0 0', boxShadow: data.highlight ? '0 0 15px rgba(34, 197, 94, 0.4)' : 'none' }}></motion.div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.8rem', color: data.highlight ? '#fff' : '#94a3b8', fontWeight: data.highlight ? 'bold' : 'normal' }}>
                  {data.month}
                  {data.highlight && <div style={{ fontSize: '0.6rem', color: '#22c55e' }}>AI Deployed</div>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="kpi-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3>Top Savings by Category</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span>IT Hardware</span>
                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>₹120k</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ duration: 1 }} style={{ height: '100%', background: 'var(--primary)' }}></motion.div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span>Facilities</span>
                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>₹85k</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: '60%' }} transition={{ duration: 1 }} style={{ height: '100%', background: '#8b5cf6' }}></motion.div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span>Marketing</span>
                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>₹45k</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: '35%' }} transition={{ duration: 1 }} style={{ height: '100%', background: '#eab308' }}></motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SavingsTrackerPage;
