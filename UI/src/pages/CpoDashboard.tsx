import React, { useState, useEffect } from 'react';
import KpiCard from '../components/KpiCard';

const CpoDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any[]>([
    { title: "Total Planned Savings", value: "₹0", trend: "Loading...", positive: true },
    { title: "Realized Savings", value: "₹0", trend: "Loading...", positive: true },
    { title: "Savings Leakage", value: "₹0", trend: "Loading...", positive: false },
    { title: "Pending Approvals", value: "0", trend: "Loading...", positive: false }
  ]);
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [topOpportunities, setTopOpportunities] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  
  // Charts state
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);

  const token = localStorage.getItem("nexus_token");

  const fetchCpoData = async () => {
    try {
      setLoading(true);
      const headers = { "Authorization": `Bearer ${token}` };
      
      const [cpoRes, savingsRes] = await Promise.all([
        fetch("http://localhost:8002/cpo/dashboard", { headers }),
        fetch("http://localhost:8002/savings/dashboard", { headers })
      ]);
      
      const cpoData = await cpoRes.json();
      if (cpoRes.ok && cpoData.data) {
        const { savings, top_opportunities, pending_approvals, pending_list } = cpoData.data;
        const planned = savings.total_planned || 0;
        const realized = savings.total_realized || 0;
        const leakage = Math.max(0, planned - realized);

        const formatCurrency = (val: number) => {
          if (val >= 1000000) return `₹${(val / 1000000).toFixed(1)}M`;
          if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
          return `₹${val}`;
        };

        const winRate = planned > 0 ? Math.round((realized / planned) * 100) : 0;

        setKpis([
          { title: "Total Planned Savings", value: formatCurrency(planned), trend: "Cumulative", positive: true },
          { title: "Realized Savings", value: formatCurrency(realized), trend: `${winRate}% Realization Rate`, positive: true },
          { title: "Savings Leakage", value: formatCurrency(leakage), trend: "Planned vs Realized Gap", positive: leakage === 0 },
          { title: "Pending Approvals", value: String(pending_approvals), trend: "Requires Attention", positive: pending_approvals === 0 }
        ]);

        setPendingList(pending_list || []);
        setTopOpportunities(top_opportunities || []);
      }
      
      if (savingsRes.ok) {
        const savingsData = await savingsRes.json();
        if (savingsData.data) {
          setMonthlyTrend(savingsData.data.monthly_trend || []);
          setTopCategories(savingsData.data.top_categories || []);
        }
      }
    } catch (err) {
      console.error("Error fetching CPO dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCpoData();
  }, []);

  const handleApprove = async (negotiationId: number) => {
    try {
      setApprovingId(negotiationId);
      const response = await fetch(`http://localhost:8002/cpo/approve/${negotiationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        alert("Negotiation outcome approved and validated!");
        fetchCpoData();
      } else {
        const errData = await response.json();
        alert(`Failed to approve: ${errData.detail || "Error"}`);
      }
    } catch (err) {
      console.error("Error approving negotiation:", err);
      alert("Network error while approving.");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div>
      <header className="dashboard-header">
        <h1>Executive Dashboard</h1>
        <p>Welcome, Chief Procurement Officer. Here are the enterprise savings KPIs.</p>
      </header>
      
      <div className="dashboard-grid">
        {kpis.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* Pending Approvals Table */}
        <div className="kpi-card" style={{ padding: 0 }}>
          <div style={{ padding: '20px' }}>
            <h3>Pending Approvals Queue</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Negotiations finalized by buyers awaiting executive sign-off.</p>
          </div>
          {loading ? (
            <div style={{ padding: '20px', color: '#94a3b8' }}>Loading queue...</div>
          ) : pendingList.length === 0 ? (
            <div style={{ padding: '20px', color: '#22c55e' }}>No pending approvals. Queue is clear!</div>
          ) : (
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Negotiation ID</th>
                  <th>Category</th>
                  <th>Supplier</th>
                  <th>Expected Savings</th>
                  <th>Walkaway Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.map((app, idx) => (
                  <tr key={idx}>
                    <td>TSK-{app.negotiation_id}</td>
                    <td>{app.category}</td>
                    <td style={{ fontWeight: 'bold' }}>{app.supplier_name}</td>
                    <td style={{ color: '#22c55e', fontWeight: 'bold' }}>₹{app.expected_savings.toLocaleString()}</td>
                    <td>₹{app.walkaway_price.toLocaleString()}</td>
                    <td>
                      <button 
                        className="btn-primary" 
                        onClick={() => handleApprove(app.negotiation_id)}
                        disabled={approvingId === app.negotiation_id}
                        style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                      >
                        {approvingId === app.negotiation_id ? "Approving..." : "Approve"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Savings Opportunities */}
        <div className="kpi-card" style={{ padding: 0 }}>
          <div style={{ padding: '20px' }}>
            <h3>Top Opportunities</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Identified variance outliers with high savings potential.</p>
          </div>
          {loading ? (
            <div style={{ padding: '20px', color: '#94a3b8' }}>Loading opportunities...</div>
          ) : topOpportunities.length === 0 ? (
            <div style={{ padding: '20px', color: '#94a3b8' }}>No opportunities found.</div>
          ) : (
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Current Spend</th>
                  <th>Potential</th>
                </tr>
              </thead>
              <tbody>
                {topOpportunities.map((opp, idx) => (
                  <tr key={idx}>
                    <td>{opp.category}</td>
                    <td>₹{opp.current_spend.toLocaleString()}</td>
                    <td style={{ color: '#22c55e', fontWeight: 'bold' }}>₹{opp.savings_potential.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Monthly Savings Realization Trend & Top Categories (same as in Savings Tracker but for CPO) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px', marginBottom: '30px' }}>
        <div className="kpi-card">
          <h3>Monthly Savings Realization Trend</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Comparing Planned Savings (Blue) vs Realized Validation (Green)</p>
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '40px', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', marginTop: '20px' }}>
            {monthlyTrend.length === 0 ? (
              <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8' }}>No monthly data available yet.</div>
            ) : (
              monthlyTrend.map((data, idx) => {
                const maxVal = Math.max(...monthlyTrend.map((d: any) => Math.max(d.planned || 0, d.realized || 0))) || 1;
                const plannedPercent = ((data.planned || 0) / maxVal) * 100;
                const realizedPercent = ((data.realized || 0) / maxVal) * 100;
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '5px', height: '100%', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div style={{ height: `${plannedPercent}%`, background: 'rgba(59, 130, 246, 0.5)', width: '30px', borderRadius: '4px 4px 0 0' }} title={`Planned: ₹${(data.planned || 0).toLocaleString()}`}></div>
                      <div style={{ height: `${realizedPercent}%`, background: '#10b981', width: '30px', borderRadius: '4px 4px 0 0' }} title={`Realized: ₹${(data.realized || 0).toLocaleString()}`}></div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.8rem', color: '#94a3b8' }}>
                      {data.month}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
 
        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3>Top Savings by Category</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
            {topCategories.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center' }}>No category data available yet.</div>
            ) : (
              topCategories.map((cat, idx) => {
                const maxVal = Math.max(...topCategories.map((c: any) => c.total_realized || 0)) || 1;
                const percent = ((cat.total_realized || 0) / maxVal) * 100;
                const colors = ['var(--primary)', '#8b5cf6', '#eab308'];
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                      <span>{cat.category}</span>
                      <span style={{ color: '#22c55e', fontWeight: 'bold' }}>₹{(cat.total_realized || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: colors[idx % colors.length], width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default CpoDashboard;
