import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { dummyOpportunities } from '../data/dummyData';
import { Filter, Search, ChevronDown, Info } from 'lucide-react';

const OpportunityQueue: React.FC = () => {
  const [opportunities] = useState(dummyOpportunities);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="dashboard">
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Opportunity Queue</h1>
          <p>AI-detected savings opportunities awaiting negotiation.</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="Search opportunities..." style={{ padding: '8px 15px 8px 35px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
          </div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>
            <Filter size={16} /> Filters
          </button>
        </div>
      </header>
      
      <div className="kpi-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '1200px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
              <tr>
                <th style={{ padding: '15px', cursor: 'pointer' }}>ID <ChevronDown size={12} style={{ display: 'inline' }}/></th>
                <th style={{ padding: '15px', cursor: 'pointer' }}>Category <ChevronDown size={12} style={{ display: 'inline' }}/></th>
                <th style={{ padding: '15px', cursor: 'pointer' }}>Supplier <ChevronDown size={12} style={{ display: 'inline' }}/></th>
                <th style={{ padding: '15px' }}>Current Spend</th>
                <th style={{ padding: '15px' }}>Benchmark Spend</th>
                <th style={{ padding: '15px' }}>Variance ($)</th>
                <th style={{ padding: '15px' }}>Savings Potential</th>
                <th style={{ padding: '15px' }}>AI Confidence</th>
                <th style={{ padding: '15px' }}>Risk</th>
                <th style={{ padding: '15px' }}>Priority</th>
                <th style={{ padding: '15px' }}>Recommended Action</th>
                <th style={{ padding: '15px' }}>Status</th>
                <th style={{ padding: '15px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opt, idx) => (
                <motion.tr 
                  key={opt.id}
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: idx * 0.05 }}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                >
                  <td style={{ padding: '15px' }}>{opt.id}</td>
                  <td style={{ padding: '15px' }}>{opt.category}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{opt.supplier}</td>
                  <td style={{ padding: '15px' }}>{opt.currentSpend}</td>
                  <td style={{ padding: '15px', color: '#94a3b8' }}>{opt.benchmarkSpend}</td>
                  <td style={{ padding: '15px', color: '#ef4444' }}>{opt.variance}</td>
                  <td style={{ padding: '15px', color: '#22c55e', fontWeight: 'bold' }}>{opt.savingsPotential}</td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', 
                        background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' 
                      }}>
                        High Confidence
                      </span>
                      <Info size={14} color="#94a3b8" title="Based on 14 historical negotiations and regional benchmarks." style={{ cursor: 'help' }} />
                    </div>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ color: opt.risk === 'High' ? '#ef4444' : (opt.risk === 'Medium' ? '#facc15' : '#22c55e') }}>
                      {opt.risk}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>{opt.priorityScore}</td>
                  <td style={{ padding: '15px' }}>{opt.action}</td>
                  <td style={{ padding: '15px' }}><span className={`status-badge ${opt.status.replace(/\s+/g, '-').toLowerCase()}`}>{opt.status}</span></td>
                  <td style={{ padding: '15px' }}><button className="btn-primary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>Execute</button></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
          <span>Showing 1 to 3 of 24 entries</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Previous</button>
            <button style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>1</button>
            <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>2</button>
            <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Next</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OpportunityQueue;
