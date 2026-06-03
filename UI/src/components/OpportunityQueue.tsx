import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, Search, ChevronDown, Info } from 'lucide-react';

interface Opportunity {
  id: string;
  category: string;
  supplier_id: number;
  supplier_name?: string;
  current_spend: number;
  benchmark_spend: number;
  variance_amount: number;
  savings_potential: number;
  confidence_score: number;
  risk_level_id: number;
  priority_score: number;
  status_id: number;
  status_name?: string;
  assigned_buyer_id: number;
  assigned_buyer_name?: string;
}

const OpportunityQueue: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const executingId = null;

  const userRole = localStorage.getItem("nexus_role");
  const showAction = userRole === 'Category Manager' || userRole === 'CPO';

  // Assign buyer state
  const [buyers, setBuyers] = useState<{ id: number; name: string; email: string }[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [selectedBuyerId, setSelectedBuyerId] = useState<number | "">("");
  const [assigning, setAssigning] = useState(false);

  const token = localStorage.getItem("nexus_token");

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8002/opportunities/list", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const resData = await response.json();
      if (response.ok && resData.data) {
        setOpportunities(resData.data);
      }
    } catch (err) {
      console.error("Error fetching opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    
    // Fetch buyers for assignment modal
    const fetchBuyers = async () => {
      try {
        const response = await fetch("http://localhost:8002/opportunities/buyers", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const resData = await response.json();
        if (response.ok && resData.data) {
          setBuyers(resData.data);
        }
      } catch (err) {
        console.error("Error fetching buyers:", err);
      }
    };
    fetchBuyers();
  }, []);

  const handleExecuteClick = (oppId: string) => {
    setSelectedOppId(oppId);
    setSelectedBuyerId("");
    setShowAssignModal(true);
  };

  const handleConfirmExecute = async () => {
    if (!selectedOppId || selectedBuyerId === "") return;
    try {
      setAssigning(true);
      // 1. Assign Buyer
      const assignRes = await fetch("http://localhost:8002/category-manager/assign-buyer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          opportunity_id: selectedOppId,
          buyer_id: Number(selectedBuyerId),
          priority: 5
        })
      });
      if (!assignRes.ok) {
        const errData = await assignRes.ok ? {} : await assignRes.json();
        throw new Error(errData.detail || "Failed to assign buyer");
      }

      // 2. Start negotiation
      const response = await fetch("http://localhost:8002/negotiations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ opportunity_id: selectedOppId })
      });
      const resData = await response.json();
      if (response.ok) {
        alert("Buyer assigned and negotiation playbook generated successfully!");
        setShowAssignModal(false);
        fetchOpportunities();
      } else {
        throw new Error(resData.detail || "Failed to start negotiation");
      }
    } catch (err: any) {
      alert(`Workflow execution failed: ${err.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const filtered = opportunities.filter(opt => 
    opt.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.supplier_name && opt.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    opt.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <input 
              type="text" 
              placeholder="Search opportunities..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px 15px 8px 35px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }} 
            />
          </div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>
            <Filter size={16} /> Filters
          </button>
        </div>
      </header>
      
      <div className="kpi-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading opportunities...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No opportunities found.</div>
          ) : (
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
                  <th style={{ padding: '15px' }}>Priority</th>
                  <th style={{ padding: '15px' }}>Recommended Action</th>
                  <th style={{ padding: '15px' }}>Assigned Buyer</th>
                  <th style={{ padding: '15px' }}>Status</th>
                  {showAction && <th style={{ padding: '15px' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((opt, idx) => (
                  <motion.tr 
                    key={opt.id}
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: idx * 0.03 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                  >
                    <td style={{ padding: '15px' }}>{opt.id}</td>
                    <td style={{ padding: '15px' }}>{opt.category}</td>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{opt.supplier_name || `Supplier #${opt.supplier_id}`}</td>
                    <td style={{ padding: '15px' }}>₹{opt.current_spend.toLocaleString()}</td>
                    <td style={{ padding: '15px', color: '#94a3b8' }}>₹{opt.benchmark_spend.toLocaleString()}</td>
                    <td style={{ padding: '15px', color: '#ef4444' }}>+₹{opt.variance_amount.toLocaleString()}</td>
                    <td style={{ padding: '15px', color: '#22c55e', fontWeight: 'bold' }}>₹{opt.savings_potential.toLocaleString()}</td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', 
                          background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' 
                        }}>
                          {opt.confidence_score}% Match
                        </span>
                        <span title="Calculated based on category history and regional pricing benchmarks." style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <Info size={14} color="#94a3b8" style={{ cursor: 'help' }} />
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>{opt.priority_score}</td>
                    <td style={{ padding: '15px' }}>Renegotiate Contract</td>
                    <td style={{ padding: '15px' }}>
                      {opt.assigned_buyer_name ? (
                        <span style={{ fontWeight: '500', color: '#cbd5e1' }}>{opt.assigned_buyer_name}</span>
                      ) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span className={`status-badge ${(opt.status_name || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                        {opt.status_name || 'Pending Analysis'}
                      </span>
                    </td>
                    {showAction && (
                      <td style={{ padding: '15px' }}>
                        {!opt.assigned_buyer_id ? (
                          <button 
                            className="btn-primary" 
                            onClick={() => handleExecuteClick(opt.id)}
                            disabled={executingId === opt.id}
                            style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                          >
                            {executingId === opt.id ? "Assigning..." : "Assign"}
                          </button>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>-</span>
                        )}
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
          <span>Showing {filtered.length} entries</span>
        </div>
      </div>

      {/* Assign Buyer & Execute Modal */}
      {showAssignModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "#1e293b",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "450px",
            padding: "25px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.5)"
          }}>
            <h3 style={{ margin: 0, color: "var(--primary)" }}>Assign Buyer & Start Workflow</h3>
            <p style={{ color: "#cbd5e1", fontSize: "0.85rem", margin: 0 }}>
              Select a Buyer to assign to opportunity <strong>{selectedOppId}</strong> and trigger AI playbook generation.
            </p>
            
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: "5px" }}>Select Buyer *</label>
              <select
                required
                value={selectedBuyerId}
                onChange={(e) => setSelectedBuyerId(e.target.value === "" ? "" : Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  color: "white",
                  outline: "none"
                }}
              >
                <option value="">-- Choose Buyer --</option>
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.email})</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                className="btn-primary"
                onClick={handleConfirmExecute}
                disabled={assigning || selectedBuyerId === ""}
                style={{ flex: 1, padding: "12px", backgroundColor: "#8b5cf6", opacity: selectedBuyerId === "" ? 0.6 : 1 }}
              >
                {assigning ? "Assigning..." : "Confirm & Assign"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowAssignModal(false)}
                style={{ padding: "12px 20px", background: "rgba(255,255,255,0.08)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default OpportunityQueue;
