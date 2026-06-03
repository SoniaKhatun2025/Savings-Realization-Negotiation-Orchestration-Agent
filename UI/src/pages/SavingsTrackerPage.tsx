import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import KpiCard from '../components/KpiCard';

const SavingsTrackerPage: React.FC = () => {
  const [kpis, setKpis] = useState<any[]>([
    { title: "Planned Savings (Assigned)", value: "₹0", trend: "Loading...", positive: true },
    { title: "Realized Savings (YTD)", value: "₹0", trend: "Loading...", positive: true },
    { title: "Negotiation Success Rate", value: "0%", trend: "Loading...", positive: true },
    { title: "Completed Negotiations", value: "0", trend: "Loading...", positive: true }
  ]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("nexus_token");
        const headers = { "Authorization": `Bearer ${token}` };

        const [savingsRes, negsRes] = await Promise.all([
          fetch("http://localhost:8002/savings/dashboard", { headers }),
          fetch("http://localhost:8002/negotiations/list", { headers })
        ]);

        let planned = 0;
        let realized = 0;
        if (savingsRes.ok) {
          const savingsData = await savingsRes.json();
          if (savingsData.data) {
            planned = savingsData.data.planned_savings || 0;
            realized = savingsData.data.realized_savings || 0;
            setMonthlyTrend(savingsData.data.monthly_trend || []);
            setTopCategories(savingsData.data.top_categories || []);
          }
        }

        let totalNegs = 0;
        let completedNegs = 0;
        if (negsRes.ok) {
          const negsData = await negsRes.json();
          if (negsData.data) {
            const negs = negsData.data;
            totalNegs = negs.length;
            completedNegs = negs.filter((n: any) => n.status_name === "Completed").length;
          }
        }

        const plannedFormatted = planned >= 1000 ? `₹${(planned / 1000).toFixed(0)}k` : `₹${planned}`;
        const realizedFormatted = realized >= 1000 ? `₹${(realized / 1000).toFixed(0)}k` : `₹${realized}`;
        const successRate = totalNegs > 0 ? Math.round((completedNegs / totalNegs) * 100) : 0;
        const targetPercent = planned > 0 ? Math.round((realized / planned) * 100) : 0;

        setKpis([
          { title: "Planned Savings (Assigned)", value: plannedFormatted, trend: "Q3 Target", positive: true },
          { title: "Realized Savings (YTD)", value: realizedFormatted, trend: `${targetPercent}% of Target`, positive: true },
          { title: "Negotiation Success Rate", value: `${successRate}%`, trend: "YTD Rate", positive: true },
          { title: "Completed Negotiations", value: String(completedNegs), trend: "This Quarter", positive: true }
        ]);

      } catch (err) {
        console.error("Error fetching savings tracker metrics:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <header className="dashboard-header">
        <h1>Savings Realization Tracker</h1>
        <p>Monitor planned vs realized savings and negotiation success rates across all categories.</p>
      </header>
      
      <div className="dashboard-grid">
        {kpis.map((kpi, idx) => (
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
                      <motion.div initial={{ height: 0 }} animate={{ height: `${plannedPercent}%` }} transition={{ duration: 1, delay: 0.5 }} style={{ background: 'rgba(59, 130, 246, 0.5)', width: '30px', borderRadius: '4px 4px 0 0' }} title={`Planned: ₹${(data.planned || 0).toLocaleString()}`}></motion.div>
                      <motion.div initial={{ height: 0 }} animate={{ height: `${realizedPercent}%` }} transition={{ duration: 1, delay: 0.7 }} style={{ background: '#10b981', width: '30px', borderRadius: '4px 4px 0 0' }} title={`Realized: ₹${(data.realized || 0).toLocaleString()}`}></motion.div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.8rem', color: '#94a3b8' }}>
                      {data.month}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
 
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="kpi-card" style={{ display: 'flex', flexDirection: 'column' }}>
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
                      <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: colors[idx % colors.length] }}></motion.div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SavingsTrackerPage;
