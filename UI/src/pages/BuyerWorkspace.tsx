import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { dummyActiveNegotiations } from "../data/dummyData";
import { ShieldAlert, History, TrendingDown, RefreshCcw } from "lucide-react";

const BuyerWorkspace: React.FC = () => {
  const [selectedPlaybook, setSelectedPlaybook] = useState<any>(null);

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
        return 4;
      case "Supplier Responded":
        return 4;
      case "Pending Approval":
        return 5;
      case "Completed":
        return 6;
      default:
        return 2;
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
        {/* <p>AI-assisted procurement operating system for Supplier Negotiations.</p> */}
      </header>

      <div
        className="dashboard-grid"
        style={{ gridTemplateColumns: selectedPlaybook ? "1fr 1fr" : "1fr" }}
      >
        <motion.div layout className="kpi-card" style={{ overflowX: "auto" }}>
          <h3>Active Negotiations</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Category</th>
                <th>Workflow Stage</th>
                <th>SLA</th>
                <th>Risk</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {dummyActiveNegotiations.map((task) => (
                <motion.tr
                  key={task.id}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  onClick={() => setSelectedPlaybook(task)}
                  style={{
                    cursor: "pointer",
                    borderLeft:
                      selectedPlaybook?.id === task.id
                        ? "3px solid var(--primary)"
                        : "3px solid transparent",
                  }}
                >
                  <td>
                    <strong>{task.supplier}</strong>
                    <br />
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                      {task.id}
                    </span>
                  </td>
                  <td>{task.category}</td>
                  <td>
                    <span
                      className={`status-badge ${task.status.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td
                    style={{
                      color: task.slaTimer.includes("Overdue")
                        ? "#ef4444"
                        : "#22c55e",
                    }}
                  >
                    {task.slaTimer}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        background: task.riskScore.includes("High")
                          ? "rgba(239, 68, 68, 0.2)"
                          : "rgba(234, 179, 8, 0.2)",
                        color: task.riskScore.includes("High")
                          ? "#f87171"
                          : "#facc15",
                      }}
                    >
                      {task.riskScore}
                    </span>
                  </td>
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
                <h3 style={{ margin: 0, color: "var(--primary)" }}>
                  {selectedPlaybook.supplier} Playbook
                </h3>
                <button
                  onClick={() => setSelectedPlaybook(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
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
                    width: `${(getStepIndex(selectedPlaybook.status) / (workflowSteps.length - 1)) * 100}%`,
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
                          idx <= getStepIndex(selectedPlaybook.status)
                            ? "var(--primary)"
                            : "#1e293b",
                        border: "2px solid #0f172a",
                      }}
                    ></div>
                    <span
                      style={{
                        fontSize: "0.6rem",
                        color:
                          idx <= getStepIndex(selectedPlaybook.status)
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
                    Current Price
                  </strong>
                  <div style={{ fontSize: "1.2rem" }}>
                    {selectedPlaybook.playbook.currentPrice}
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
                    Target Savings
                  </strong>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      color: "#22c55e",
                      fontWeight: "bold",
                    }}
                  >
                    {selectedPlaybook.playbook.expectedSavings}
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
                  Why did AI recommend this?
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
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
                      <History size={14} /> Historical Precedent
                    </div>
                    <div style={{ fontSize: "0.9rem", marginTop: "5px" }}>
                      {selectedPlaybook.playbook.prevOutcome}
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
                      <TrendingDown size={14} /> Market Benchmark
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        marginTop: "5px",
                        color: "#22c55e",
                      }}
                    >
                      Identified 10% lower rates regionally.
                    </div>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        color: "#94a3b8",
                        fontSize: "0.8rem",
                      }}
                    >
                      <RefreshCcw size={14} /> AI Confidence Analysis
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        marginTop: "5px",
                        fontStyle: "italic",
                      }}
                    >
                      "{selectedPlaybook.playbook.aiConfidenceExplanation}"
                    </div>
                  </div>
                </div>
              </div>

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
                  {selectedPlaybook.playbook.talkingPoints.map(
                    (tp: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: "5px" }}>
                        {tp}
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, padding: "12px" }}
                >
                  {selectedPlaybook.aiAction}
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 1, background: "#475569", padding: "12px" }}
                >
                  Escalate to Manager
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default BuyerWorkspace;
