import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KpiCard from '../components/KpiCard';
import { UserCheck, Zap, X, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Opportunity {
  id: string;
  category: string;
  supplier_id: number;
  supplier_name?: string;
  current_spend: number;
  benchmark_spend: number;
  savings_potential: number;
  assigned_buyer_id?: number;
  status_name?: string;
}

interface Buyer {
  id: number;
  name: string;
  email: string;
}

type ToastType = { message: string; type: 'success' | 'error' } | null;

const CategoryManagerDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<any[]>([
    { title: 'Open Opportunities', value: '0', trend: 'Loading...', positive: true },
    { title: 'Avg Supplier Variance', value: '0%', trend: 'Loading...', positive: true },
    { title: 'Total Savings Pipeline', value: '₹0', trend: 'Loading...', positive: true },
    { title: 'Unassigned Opportunities', value: '0', trend: 'Needs Action', positive: false },
  ]);

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [toast, setToast] = useState<ToastType>(null);

  // ── Assign Buyer Modal ────────────────────────────────────────────────────
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignOppId, setAssignOppId] = useState('');
  const [assignBuyerId, setAssignBuyerId] = useState<number | ''>('');
  const [assignPriority, setAssignPriority] = useState(1);
  const [assigning, setAssigning] = useState(false);

  // ── Detect Opportunity Modal ──────────────────────────────────────────────
  const [showDetectModal, setShowDetectModal] = useState(false);
  const [detectCategory, setDetectCategory] = useState('');
  const [detectSupplierId, setDetectSupplierId] = useState('');
  const [detectCurrentSpend, setDetectCurrentSpend] = useState('');
  const [detectBenchmarkSpend, setDetectBenchmarkSpend] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectResult, setDetectResult] = useState<any>(null);

  const token = localStorage.getItem('nexus_token');
  const headers = { Authorization: `Bearer ${token}` };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [oppsRes, buyersRes] = await Promise.all([
        fetch('http://localhost:8002/opportunities/list', { headers }),
        fetch('http://localhost:8002/opportunities/buyers', { headers }),
      ]);
      const oppsData = await oppsRes.json();
      const buyersData = await buyersRes.json();

      if (oppsRes.ok && oppsData.data) {
        const opps: Opportunity[] = oppsData.data;
        setOpportunities(opps);

        const openCount = opps.length;
        const totalSavings = opps.reduce((sum, o) => sum + (o.savings_potential || 0), 0);
        const unassigned = opps.filter(o => !o.assigned_buyer_id).length;

        let totalVariancePercent = 0;
        opps.forEach((o: any) => {
          const v = o.benchmark_spend > 0 ? (o.variance_amount / o.benchmark_spend) * 100 : 0;
          totalVariancePercent += v;
        });
        const avgVariance = openCount > 0 ? Math.round(totalVariancePercent / openCount) : 0;
        const savingsFormatted =
          totalSavings >= 1000000
            ? `₹${(totalSavings / 1000000).toFixed(1)}M`
            : totalSavings >= 1000
              ? `₹${(totalSavings / 1000).toFixed(0)}k`
              : `₹${totalSavings}`;

        setKpis([
          { title: 'Open Opportunities', value: String(openCount), trend: 'Active Pipeline', positive: true },
          { title: 'Avg Supplier Variance', value: `${avgVariance}%`, trend: 'Above Benchmark', positive: avgVariance <= 10 },
          { title: 'Total Savings Pipeline', value: savingsFormatted, trend: 'AI Estimated', positive: true },
          { title: 'Unassigned Opportunities', value: String(unassigned), trend: unassigned > 0 ? 'Needs Action' : 'All Assigned', positive: unassigned === 0 },
        ]);
      }

      if (buyersRes.ok && buyersData.data) {
        setBuyers(buyersData.data);
      }
    } catch (err) {
      console.error('Error fetching CM dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Assign Buyer ──────────────────────────────────────────────────────────
  const openAssignModal = (oppId?: string) => {
    setAssignOppId(oppId || '');
    setAssignBuyerId('');
    setAssignPriority(1);
    setShowAssignModal(true);
  };

  const handleAssignBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignOppId || assignBuyerId === '') return;
    setAssigning(true);
    try {
      const res = await fetch('http://localhost:8002/category-manager/assign-buyer', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: assignOppId, buyer_id: Number(assignBuyerId), priority: assignPriority }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Buyer assigned to ${assignOppId} successfully!`, 'success');
        setShowAssignModal(false);
        fetchData();
      } else {
        throw new Error(data.detail || 'Assignment failed');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAssigning(false);
    }
  };

  // ── AI Opportunity Detection ──────────────────────────────────────────────
  const handleDetectOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetecting(true);
    setDetectResult(null);
    try {
      const res = await fetch('http://localhost:8002/opportunities/detect', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: detectCategory.trim(),
          supplier_id: parseInt(detectSupplierId),
          current_spend: parseFloat(detectCurrentSpend),
          benchmark_spend: parseFloat(detectBenchmarkSpend),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDetectResult(data.data);
        showToast(`Opportunity ${data.data.opportunity_id} saved to queue!`, 'success');
        fetchData();
      } else {
        throw new Error(data.detail || 'Detection failed');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setDetecting(false);
    }
  };

  const closeDetectModal = () => {
    setShowDetectModal(false);
    setDetectResult(null);
    setDetectCategory('');
    setDetectSupplierId('');
    setDetectCurrentSpend('');
    setDetectBenchmarkSpend('');
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.3)',
    color: 'white',
    fontSize: '0.9rem',
    outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    color: '#94a3b8',
    display: 'block',
    marginBottom: '6px',
    fontWeight: 600,
  };

  // ── Prepare Chart Data ───────────────────────────────────────────────────
  const colors = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];
  
  const totalSavings = opportunities.reduce((sum, o) => sum + (o.savings_potential || 0), 0);
  
  const buyerStats = buyers.map((b, idx) => {
    const assignedOpps = opportunities.filter(o => o.assigned_buyer_id === b.id);
    const savings = assignedOpps.reduce((sum, o) => sum + (o.savings_potential || 0), 0);
    return {
      name: b.name,
      email: b.email,
      count: assignedOpps.length,
      savings,
      color: colors[idx % colors.length]
    };
  });

  const unassignedOpps = opportunities.filter(o => !o.assigned_buyer_id);
  const unassignedSavings = unassignedOpps.reduce((sum, o) => sum + (o.savings_potential || 0), 0);
  
  const chartData = [
    ...buyerStats,
    {
      name: 'Unassigned',
      email: '',
      count: unassignedOpps.length,
      savings: unassignedSavings,
      color: '#64748b'
    }
  ].filter(item => item.count > 0 || item.savings > 0);

  let currentOffset = 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // 314.159

  return (
    <div>
      {/* ── Toast ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: '80px',
              right: '30px',
              zIndex: 9999,
              background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${toast.type === 'success' ? '#22c55e' : '#ef4444'}`,
              color: toast.type === 'success' ? '#4ade80' : '#f87171',
              padding: '14px 20px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              maxWidth: '380px',
            }}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span style={{ fontSize: '0.9rem' }}>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Category Manager Dashboard</h1>
          <p>Review procurement opportunities, detect savings, and assign buyers.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary"
            onClick={() => setShowDetectModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', fontSize: '0.9rem' }}
          >
            <Zap size={16} /> Detect Opportunity
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => openAssignModal()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', fontSize: '0.9rem', background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', cursor: 'pointer' }}
          >
            <UserCheck size={16} /> Assign Buyer
          </motion.button>
        </div>
      </header>
 
      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="dashboard-grid">
        {kpis.map((kpi, idx) => (
          <motion.div key={idx} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.08 }}>
            <KpiCard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* ── AI Workload & Savings Distribution Chart ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px', marginTop: '20px', marginBottom: '20px' }}>
        {/* Left Card: Semi-Donut / Pie Chart */}
        <div className="kpi-card" style={{ padding: '24px', position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>Savings Pipeline Breakdown</h3>
          <p style={{ margin: '0 0 25px 0', color: '#94a3b8', fontSize: '0.82rem' }}>Savings potential managed by each assigned Buyer.</p>
          
          <div style={{ position: 'relative', width: '200px', height: '200px', margin: 'auto auto 20px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="200" height="200" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle cx="70" cy="70" r="50" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
              
              {/* If no data */}
              {opportunities.length === 0 && (
                <circle cx="70" cy="70" r="50" fill="transparent" stroke="#475569" strokeWidth="12" />
              )}

              {/* Render segments */}
              {chartData.map((item, idx) => {
                const percent = totalSavings > 0 ? (item.savings / totalSavings) : 0;
                if (percent === 0) return null;
                const strokeDasharray = `${circumference}`;
                const strokeDashoffset = circumference - (percent * circumference);
                const rotation = (currentOffset / circumference) * 360;
                currentOffset += percent * circumference;
                
                return (
                  <motion.circle
                    key={idx}
                    cx="70"
                    cy="70"
                    r="50"
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth="12"
                    strokeDasharray={strokeDasharray}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: idx * 0.15 }}
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transformOrigin: '70px 70px',
                      cursor: 'pointer'
                    }}
                    whileHover={{ strokeWidth: 15 }}
                  />
                );
              })}
            </svg>
            
            {/* Donut Center Label */}
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pipeline</span>
              <strong style={{ fontSize: '1.25rem', color: 'white', fontWeight: 800, marginTop: '2px' }}>
                ₹{totalSavings.toLocaleString()}
              </strong>
            </div>
          </div>
          
          {/* Chart Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 15px', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
            {opportunities.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No active opportunities</div>
            ) : (
              chartData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                  <span style={{ color: '#cbd5e1' }}>{item.name}</span>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>({Math.round((totalSavings > 0 ? (item.savings / totalSavings) * 100 : 0))}% )</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Card: Workload & Detailed Progress Bars */}
        <div className="kpi-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>Buyer Workload & Allocation Ledger</h3>
          <p style={{ margin: '0 0 25px 0', color: '#94a3b8', fontSize: '0.82rem' }}>Distribution of opportunity counts and financial volume across active Buyers.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {opportunities.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                No workload allocations currently active.
              </div>
            ) : (
              chartData.map((item, idx) => {
                const countPercent = opportunities.length > 0 ? (item.count / opportunities.length) * 100 : 0;
                return (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                        <div>
                          <strong style={{ color: 'white', fontSize: '0.85rem' }}>{item.name}</strong>
                          {item.email && <span style={{ display: 'block', color: '#64748b', fontSize: '0.7rem' }}>{item.email}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', color: '#22c55e', fontWeight: 'bold', fontSize: '0.85rem' }}>₹{item.savings.toLocaleString()}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{item.count} Opp{item.count !== 1 ? 's' : ''} ({Math.round(countPercent)}%)</span>
                      </div>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${countPercent}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: idx * 0.1 }}
                        style={{ height: '100%', borderRadius: '10px', background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 1 — ASSIGN BUYER
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowAssignModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              style={{ background: '#1e293b', width: '480px', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserCheck size={20} color="#a78bfa" />
                  <h3 style={{ margin: 0 }}>Assign Buyer to Opportunity</h3>
                </div>
                <button onClick={() => setShowAssignModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}><X size={20} /></button>
              </div>

              <form onSubmit={handleAssignBuyer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Opportunity Dropdown */}
                <div>
                  <label style={labelStyle}>Opportunity ID *</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      required
                      value={assignOppId}
                      onChange={e => setAssignOppId(e.target.value)}
                      style={{ ...inputStyle, appearance: 'none', paddingRight: '36px' }}
                    >
                      <option value="">-- Select Opportunity --</option>
                      {opportunities.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.id} | {o.category} | ₹{o.savings_potential.toLocaleString()} savings
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                  </div>
                </div>

                {/* Buyer Dropdown */}
                <div>
                  <label style={labelStyle}>Assign to Buyer *</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      required
                      value={assignBuyerId}
                      onChange={e => setAssignBuyerId(Number(e.target.value))}
                      style={{ ...inputStyle, appearance: 'none', paddingRight: '36px' }}
                    >
                      <option value="">-- Select Buyer --</option>
                      {buyers.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.email})</option>
                      ))}
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                  </div>
                  {buyers.length === 0 && (
                    <p style={{ color: '#f59e0b', fontSize: '0.8rem', marginTop: '6px' }}>⚠ No active buyers found in the system.</p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label style={labelStyle}>Priority Score (1 = Low, 10 = Critical)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <input
                      type="range"
                      min={1} max={10} step={1}
                      value={assignPriority}
                      onChange={e => setAssignPriority(Number(e.target.value))}
                      style={{ flex: 1, accentColor: '#8b5cf6' }}
                    />
                    <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '1.1rem', width: '24px', textAlign: 'center' }}>{assignPriority}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="submit"
                    disabled={assigning}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', border: 'none', color: 'white', fontWeight: 700, cursor: assigning ? 'not-allowed' : 'pointer', fontSize: '0.95rem', opacity: assigning ? 0.7 : 1 }}
                  >
                    {assigning ? 'Assigning...' : '✓ Confirm Assignment'}
                  </button>
                  <button type="button" onClick={() => setShowAssignModal(false)} style={{ padding: '12px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 2 — DETECT OPPORTUNITY (AI)
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDetectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={closeDetectModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              style={{ background: '#1e293b', width: '520px', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Zap size={20} color="#3b82f6" />
                  <h3 style={{ margin: 0 }}>AI Opportunity Detection</h3>
                </div>
                <button onClick={closeDetectModal} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              {!detectResult ? (
                <form onSubmit={handleDetectOpportunity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                    Enter invoice vs benchmark data. The AI agent will detect the savings opportunity and automatically save it to the queue.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>Category *</label>
                      <input type="text" required value={detectCategory} onChange={e => setDetectCategory(e.target.value)} placeholder="e.g. IT Hardware" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Supplier ID *</label>
                      <input type="number" required value={detectSupplierId} onChange={e => setDetectSupplierId(e.target.value)} placeholder="e.g. 1" style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>Current Invoice Spend (₹) *</label>
                      <input type="number" required value={detectCurrentSpend} onChange={e => setDetectCurrentSpend(e.target.value)} placeholder="e.g. 500000" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Market Benchmark Spend (₹) *</label>
                      <input type="number" required value={detectBenchmarkSpend} onChange={e => setDetectBenchmarkSpend(e.target.value)} placeholder="e.g. 380000" style={inputStyle} />
                    </div>
                  </div>

                  {detectCurrentSpend && detectBenchmarkSpend && parseFloat(detectCurrentSpend) > parseFloat(detectBenchmarkSpend) && (
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', padding: '12px 16px', borderRadius: '8px' }}>
                      <div style={{ color: '#f87171', fontSize: '0.85rem', fontWeight: 600 }}>⚠ Overspending Detected (Preview)</div>
                      <div style={{ color: '#fca5a5', fontSize: '0.8rem', marginTop: '4px' }}>
                        Variance: ₹{(parseFloat(detectCurrentSpend) - parseFloat(detectBenchmarkSpend)).toLocaleString()} above benchmark
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button
                      type="submit"
                      disabled={detecting}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', background: detecting ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)', border: 'none', color: 'white', fontWeight: 700, cursor: detecting ? 'not-allowed' : 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      {detecting ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                          AI Analyzing...
                        </>
                      ) : (
                        <><Zap size={16} /> Run AI Detection</>
                      )}
                    </button>
                    <button type="button" onClick={closeDetectModal} style={{ padding: '12px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                // ── Result Panel ──────────────────────────────────────────
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontWeight: 700, marginBottom: '12px' }}>
                      <CheckCircle2 size={18} /> Opportunity Saved to Queue
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                      <div><span style={{ color: '#94a3b8' }}>ID: </span><strong style={{ color: '#e2e8f0' }}>{detectResult.opportunity_id}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Category: </span><strong style={{ color: '#e2e8f0' }}>{detectResult.category}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Savings Potential: </span><strong style={{ color: '#4ade80' }}>₹{detectResult.savings_potential?.toLocaleString()}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Confidence: </span><strong style={{ color: '#a78bfa' }}>{detectResult.confidence_score}%</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Risk Level: </span><strong style={{ color: detectResult.risk_level === 'High' ? '#f87171' : detectResult.risk_level === 'Medium' ? '#fbbf24' : '#4ade80' }}>{detectResult.risk_level}</strong></div>
                      <div><span style={{ color: '#94a3b8' }}>Priority Score: </span><strong style={{ color: '#e2e8f0' }}>{detectResult.priority_score}/10</strong></div>
                    </div>
                    {detectResult.ai_explanation && (
                      <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontStyle: 'italic', color: '#cbd5e1', fontSize: '0.82rem', borderLeft: '3px solid #3b82f6' }}>
                        "{detectResult.ai_explanation}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => { openAssignModal(detectResult.opportunity_id); closeDetectModal(); }}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <UserCheck size={16} /> Assign Buyer Now
                    </button>
                    <button onClick={closeDetectModal} style={{ padding: '12px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer' }}>
                      Done
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryManagerDashboard;
