import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, TrendingDown, RefreshCcw } from "lucide-react";

interface Negotiation {
  id: number;
  opportunity_id: string;
  supplier_id: number;
  supplier_name: string;
  buyer_id: number;
  category: string;
  current_spend?: number;
  target_price: number;
  walkaway_price: number;
  expected_savings: number;
  ai_confidence_explanation: string;
  talking_points: string[];
  status_name: string;
  sla_due_date?: string;
  created_at: string;
  actual_price?: number;
  realised_savings?: number;
  comment?: string;
}

const BuyerWorkspace: React.FC = () => {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(false);

  // Outcome submission state
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);
  const [actualPrice, setActualPrice] = useState("");
  const [realisedSavings, setRealisedSavings] = useState("");
  const [outcomeComment, setOutcomeComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Email draft state
  const [draftEmail, setDraftEmail] = useState<{ subject: string; body: string } | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const token = localStorage.getItem("nexus_token");

  const fetchNegotiations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await fetch("http://localhost:8002/negotiations/list", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const resData = await response.json();
      if (response.ok && resData.data) {
        setNegotiations(resData.data);
      }
    } catch (err) {
      console.error("Error fetching negotiations:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const handleOpenPlaybook = (task: Negotiation) => {
    setSelectedPlaybook(task);
    setShowOutcomeForm(false);
    setActualPrice(task.actual_price ? String(task.actual_price) : "");
    setRealisedSavings(task.realised_savings ? String(task.realised_savings) : "");
    setOutcomeComment(task.comment || "");
  };

  const handleRecordOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaybook) return;

    try {
      setSubmitting(true);
      const response = await fetch(`http://localhost:8002/negotiations/outcome/${selectedPlaybook.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          actual_price: parseFloat(actualPrice),
          realised_savings: parseFloat(realisedSavings),
          comment: outcomeComment
        })
      });

      const resData = await response.json();
      if (response.ok) {
        alert("Negotiation outcome recorded successfully!");
        setShowOutcomeForm(false);
        setSelectedPlaybook(null);
        fetchNegotiations(true);
      } else {
        throw new Error(resData.detail || "Failed to save outcome");
      }
    } catch (err: any) {
      alert(`Error saving outcome: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDraftEmail = async () => {
    if (!selectedPlaybook) return;
    try {
      setLoadingEmail(true);
      const response = await fetch("http://localhost:8002/negotiation/draft-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ opportunity_id: selectedPlaybook.opportunity_id })
      });
      const resData = await response.json();
      if (response.ok && resData.data) {
        setDraftEmail(resData.data);
        setShowEmailModal(true);
        
        await fetch(`http://localhost:8002/negotiations/status/${selectedPlaybook.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ status_name: "Outreach Sent" })
        });
        
        fetchNegotiations(true);
        setSelectedPlaybook(prev => prev ? { ...prev, status_name: "Outreach Sent" } : null);
      } else {
        throw new Error(resData.detail || "Failed to generate email");
      }
    } catch (err: any) {
      alert(`Error generating email: ${err.message}`);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleStartNegotiation = async () => {
    if (!selectedPlaybook) return;
    try {
      const response = await fetch(`http://localhost:8002/negotiations/status/${selectedPlaybook.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status_name: "Negotiating" })
      });
      if (response.ok) {
        alert("Negotiation started! Status updated to Negotiating.");
        fetchNegotiations(true);
        setSelectedPlaybook(prev => prev ? { ...prev, status_name: "Negotiating" } : null);
      } else {
        const resData = await response.json();
        throw new Error(resData.detail || "Failed to start negotiation");
      }
    } catch (err: any) {
      alert(`Error starting negotiation: ${err.message}`);
    }
  };

  const workflowSteps = [
    "Upload",
    "Opportunity",
    "Playbook",
    "Outreach",
    "Negotiation",
    "Approval",
    "Validated",
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "Outreach Sent":
        return 3;
      case "Negotiating":
      case "Supplier Responded":
        return 4;
      case "Pending Approval":
        return 5;
      case "Completed":
        return 6;
      default:
        return 3; // "Outreach" is the next pending action since Playbook is already generated.
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="dashboard"
    >
      <header className="dashboard-header">
        <h1>Negotiation Execution Workspace</h1>
        <p>AI-assisted procurement operating system for Supplier Negotiations.</p>
      </header>

      <div
        className="dashboard-grid"
        style={{ gridTemplateColumns: selectedPlaybook ? "1fr 1.1fr" : "1fr" }}
      >
        <motion.div layout className="kpi-card" style={{ overflowX: "auto" }}>
          <h3>Active Negotiations</h3>
          {loading ? (
            <div style={{ padding: "40px", color: "#94a3b8", textAlign: "center" }}>Loading negotiations...</div>
          ) : negotiations.length === 0 ? (
            <div style={{ padding: "40px", color: "#94a3b8", textAlign: "center" }}>No active negotiations assigned.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Category</th>
                  <th>Current Spend</th>
                  <th>Workflow Stage</th>
                  <th>Expected Savings</th>
                  <th>Target Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {negotiations.map((task) => (
                  <motion.tr
                    key={task.id}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    onClick={() => handleOpenPlaybook(task)}
                    style={{
                      cursor: "pointer",
                      borderLeft:
                        selectedPlaybook?.id === task.id
                          ? "3px solid var(--primary)"
                          : "3px solid transparent",
                    }}
                  >
                    <td>
                      <strong>{task.supplier_name}</strong>
                      <br />
                      <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                        NEG-{task.id} (Opp: {task.opportunity_id})
                      </span>
                    </td>
                    <td>{task.category}</td>
                    <td>₹{(task.current_spend || 0).toLocaleString()}</td>
                    <td>
                      <span
                        className={`status-badge ${(task.status_name || 'Assigned').replace(/\s+/g, "-").toLowerCase()}`}
                      >
                        {task.status_name || 'Assigned'}
                      </span>
                    </td>
                    <td>₹{task.expected_savings.toLocaleString()}</td>
                    <td>₹{task.target_price.toLocaleString()}</td>
                    <td>
                      <button
                        className="btn-primary"
                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                      >
                        Open
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        <AnimatePresence>
          {selectedPlaybook && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="kpi-card"
              style={{
                background: "rgba(59, 130, 246, 0.05)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 style={{ margin: 0, color: "var(--primary)" }}>
                    {selectedPlaybook.supplier_name} Playbook
                  </h3>
                  <span className={`status-badge ${(selectedPlaybook.status_name || 'Assigned').replace(/\s+/g, "-").toLowerCase()}`}>
                    {selectedPlaybook.status_name || 'Assigned'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPlaybook(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: "1.2rem"
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Workflow Timeline */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  position: "relative",
                  margin: "10px 0 20px 0",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "rgba(255,255,255,0.1)",
                    zIndex: 0,
                  }}
                ></div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(getStepIndex(selectedPlaybook.status_name) / (workflowSteps.length - 1)) * 100}%`,
                  }}
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: 0,
                    height: "2px",
                    background: "var(--primary)",
                    zIndex: 1,
                  }}
                />
                {workflowSteps.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background:
                          idx <= getStepIndex(selectedPlaybook.status_name)
                            ? "var(--primary)"
                            : "#1e293b",
                        border: "2px solid #0f172a",
                      }}
                    ></div>
                    <span
                      style={{
                        fontSize: "0.6rem",
                        color:
                          idx <= getStepIndex(selectedPlaybook.status_name)
                            ? "white"
                            : "#94a3b8",
                        marginTop: "5px",
                        textAlign: "center",
                        width: "50px",
                      }}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                <div
                  style={{
                    background: "rgba(0,0,0,0.2)",
                    padding: "15px",
                    borderRadius: "8px",
                  }}
                >
                  <strong style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                    Target Price
                  </strong>
                  <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                    ₹{selectedPlaybook.target_price.toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(34, 197, 94, 0.1)",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                    padding: "15px",
                    borderRadius: "8px",
                  }}
                >
                  <strong style={{ color: "#22c55e", fontSize: "0.8rem" }}>
                    Expected Savings
                  </strong>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      color: "#22c55e",
                      fontWeight: "bold",
                    }}
                  >
                    ₹{selectedPlaybook.expected_savings.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* AI Explainability Panel */}
              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  padding: "20px",
                  borderRadius: "8px",
                  borderLeft: "4px solid var(--primary)",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 15px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <ShieldAlert size={18} color="var(--primary)" />
                  AI Suggested Strategy & Explanations
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                      }}
                    >
                      <TrendingDown size={14} /> Walkaway Price Threshold
                    </div>
                    <div style={{ fontSize: "1rem", marginTop: "5px", fontWeight: "bold", color: "#f87171" }}>
                      ₹{selectedPlaybook.walkaway_price.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                      }}
                    >
                      <RefreshCcw size={14} /> AI Context Analysis
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        marginTop: "5px",
                        fontStyle: "italic",
                        color: "#cbd5e1"
                      }}
                    >
                      "{selectedPlaybook.ai_confidence_explanation || "No explanation provided."}"
                    </div>
                  </div>
                </div>
              </div>

              {/* Talking Points */}
              <div
                style={{
                  background: "rgba(59, 130, 246, 0.1)",
                  padding: "15px",
                  borderRadius: "8px",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0" }}>
                  AI Suggested Talking Points
                </h4>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "20px",
                    color: "#cbd5e1",
                    fontSize: "0.9rem",
                  }}
                >
                  {Array.isArray(selectedPlaybook.talking_points) ? (
                    selectedPlaybook.talking_points.map((tp, idx) => (
                      <li key={idx} style={{ marginBottom: "5px" }}>
                        {tp}
                      </li>
                    ))
                  ) : (
                    <li>No specific talking points generated.</li>
                  )}
                </ul>
              </div>

              {/* Action buttons or Outcome Form */}
              {showOutcomeForm ? (
                <form onSubmit={handleRecordOutcome} style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(0,0,0,0.2)", padding: "15px", borderRadius: "8px" }}>
                  <h4 style={{ margin: 0 }}>Record Sourcing Outcome</h4>
                  
                  {selectedPlaybook.current_spend !== undefined && (
                    <div style={{ background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: "10px", borderRadius: "6px", fontSize: "0.8rem", color: "#cbd5e1" }}>
                      <strong>Current Spend:</strong> ₹{selectedPlaybook.current_spend.toLocaleString('en-IN')}
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#cbd5e1", display: "block", marginBottom: "4px" }}>Actual Contract Price (₹)</label>
                    <input 
                      type="number" 
                      required 
                      value={actualPrice} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setActualPrice(val);
                        const priceVal = parseFloat(val);
                        if (!isNaN(priceVal) && selectedPlaybook.current_spend !== undefined) {
                          setRealisedSavings(String(selectedPlaybook.current_spend - priceVal));
                        } else {
                          setRealisedSavings("");
                        }
                      }} 
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "white" }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#cbd5e1", display: "block", marginBottom: "4px" }}>Realised Savings (₹)</label>
                    <input 
                      type="number" 
                      required 
                      value={realisedSavings} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setRealisedSavings(val);
                        const savingsVal = parseFloat(val);
                        if (!isNaN(savingsVal) && selectedPlaybook.current_spend !== undefined) {
                          setActualPrice(String(selectedPlaybook.current_spend - savingsVal));
                        } else {
                          setActualPrice("");
                        }
                      }} 
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "white" }} 
                    />
                  </div>

                  {selectedPlaybook.current_spend !== undefined && (
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px", fontStyle: "italic" }}>
                      Formula: Realised Savings = Current Spend (₹{selectedPlaybook.current_spend.toLocaleString('en-IN')}) - Actual Contract Price
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#cbd5e1", display: "block", marginBottom: "4px" }}>Outcome Comments</label>
                    <textarea 
                      value={outcomeComment} 
                      onChange={(e) => setOutcomeComment(e.target.value)} 
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "white", minHeight: "60px" }} 
                    />
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: "10px" }} disabled={submitting}>
                      {submitting ? "Saving..." : "Submit Outcome"}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setShowOutcomeForm(false)} style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {selectedPlaybook.status_name === "Assigned" && (
                      <button
                        className="btn-primary"
                        onClick={handleStartNegotiation}
                        style={{ flex: 1, padding: "12px", backgroundColor: "#10b981" }}
                      >
                        Start Negotiation
                      </button>
                    )}
                    
                    {selectedPlaybook.status_name !== "Completed" && (
                      <button
                        className="btn-primary"
                        onClick={handleDraftEmail}
                        disabled={loadingEmail}
                        style={{ flex: 1, padding: "12px", backgroundColor: "#3b82f6" }}
                      >
                        {loadingEmail ? "Drafting..." : "Draft Supplier Email"}
                      </button>
                    )}
                  </div>
                  
                  <div style={{ display: "flex", gap: "10px" }}>
                    {selectedPlaybook.status_name !== "Completed" && (
                      <button
                        className="btn-primary"
                        onClick={() => setShowOutcomeForm(true)}
                        style={{ flex: 1, padding: "12px" }}
                      >
                        Record Final Outcome
                      </button>
                    )}
                    <button
                      className="btn-primary"
                      style={{ flex: 1, background: "#475569", padding: "12px" }}
                      onClick={() => alert("Escalated email sent to Category Manager.")}
                    >
                      Escalate to Manager
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Email Draft Modal */}
      {showEmailModal && draftEmail && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
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
            maxWidth: "650px",
            padding: "25px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, color: "var(--primary)" }}>AI Generated Supplier Email Draft</h3>
              <button 
                onClick={() => setShowEmailModal(false)}
                style={{ background: "transparent", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>
            
            <div>
              <strong style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Subject:</strong>
              <div style={{
                background: "rgba(0,0,0,0.2)",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.05)",
                marginTop: "5px",
                fontWeight: "bold",
                color: "white"
              }}>
                {draftEmail.subject}
              </div>
            </div>
            
            <div>
              <strong style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Body:</strong>
              <textarea 
                readOnly
                value={draftEmail.body}
                style={{
                  width: "100%",
                  height: "250px",
                  background: "rgba(0,0,0,0.2)",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.05)",
                  marginTop: "5px",
                  color: "#e2e8f0",
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  resize: "none"
                }}
              />
            </div>
            
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button 
                className="btn-primary" 
                onClick={() => {
                  navigator.clipboard.writeText(draftEmail.body || "");
                  alert("Email body copied to clipboard!");
                }}
                style={{ padding: "10px 20px" }}
              >
                Copy to Clipboard
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setShowEmailModal(false)}
                style={{ padding: "10px 20px", background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BuyerWorkspace;
