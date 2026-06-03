import React, { useState, useEffect } from 'react';
import KpiCard from '../components/KpiCard';

const SavingsAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any[]>([
    { title: "YTD Realized Savings", value: "₹0", trend: "Loading...", positive: true },
    { title: "Planned vs Realized Gap", value: "₹0", trend: "Loading...", positive: false },
    { title: "Savings Validation Pending", value: "0", trend: "Loading...", positive: false }
  ]);

  const [budgets, setBudgets] = useState<any[]>([]);
  const [validations, setValidations] = useState<any[]>([]);
  const [pendingValidations, setPendingValidations] = useState<any[]>([]);

  // Create budget form state
  const [category, setCategory] = useState("");
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [allocatedAmount, setAllocatedAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Validate savings form state
  const [validateOppId, setValidateOppId] = useState("");
  const [validateAmount, setValidateAmount] = useState("");
  const [validatingSavings, setValidatingSavings] = useState(false);

  const handleValidateSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOppId.trim() || !validateAmount) return;
    try {
      setValidatingSavings(true);
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      const response = await fetch("http://localhost:8002/savings/validate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          opportunity_id: validateOppId.trim(),
          validated_amount: Number(validateAmount)
        })
      });
      const resData = await response.json();
      if (response.ok) {
        alert("Savings validated successfully!");
        setValidateOppId("");
        setValidateAmount("");
        fetchData();
      } else {
        throw new Error(resData.detail || "Failed to validate savings");
      }
    } catch (err: any) {
      alert(`Validation failed: ${err.message}`);
    } finally {
      setValidatingSavings(false);
    }
  };

  const token = localStorage.getItem("nexus_token");

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { "Authorization": `Bearer ${token}` };

      const [savingsRes, validateRes, budgetsRes, financeRes] = await Promise.all([
        fetch("http://localhost:8002/savings/dashboard", { headers }),
        fetch("http://localhost:8002/finance/validate", { headers }),
        fetch("http://localhost:8002/finance/budgets", { headers }),
        fetch("http://localhost:8002/dashboard/finance", { headers })
      ]);

      let realized = 0;
      let gap = 0;
      if (savingsRes.ok) {
        const savingsData = await savingsRes.json();
        if (savingsData.data) {
          realized = savingsData.data.realized_savings || 0;
          gap = savingsData.data.savings_leakage || 0;
        }
      }

      let valItems: any[] = [];
      if (validateRes.ok) {
        const valData = await validateRes.json();
        if (valData.data) {
          valItems = valData.data;
        }
      }

      let budgetItems: any[] = [];
      if (budgetsRes.ok) {
        const bData = await budgetsRes.json();
        if (bData.data) {
          budgetItems = bData.data;
        }
      }

      let pendingValItems: any[] = [];
      if (financeRes.ok) {
        const fdData = await financeRes.json();
        if (fdData.data && fdData.data.validation_queue) {
          pendingValItems = fdData.data.validation_queue;
        }
      }

      setBudgets(budgetItems);
      setValidations(valItems);
      setPendingValidations(pendingValItems);

      const realizedFormatted = realized >= 1000 ? `₹${(realized / 1000).toFixed(0)}k` : `₹${realized}`;
      const gapFormatted = gap >= 1000 ? `-₹${(gap / 1000).toFixed(0)}k` : `-₹${gap}`;

      setKpis([
        { title: "YTD Realized Savings", value: realizedFormatted, trend: "On Track", positive: true },
        { title: "Planned vs Realized Gap", value: gapFormatted, trend: gap > 0 ? "Requires Attention" : "Ideal", positive: gap <= 0 },
        { title: "Savings Validation Pending", value: String(pendingValItems.length), trend: "Action Required", positive: pendingValItems.length === 0 }
      ]);

    } catch (err) {
      console.error("Error fetching finance analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !allocatedAmount) return;
    try {
      setSubmitting(true);
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      const response = await fetch("http://localhost:8002/finance/budget", {
        method: "POST",
        headers,
        body: JSON.stringify({
          category: category.trim(),
          fiscal_year: Number(fiscalYear),
          allocated_amount: Number(allocatedAmount)
        })
      });
      if (response.ok) {
        setCategory("");
        setAllocatedAmount("");
        fetchData();
      }
    } catch (err) {
      console.error("Error creating budget:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <header className="dashboard-header">
        <h1>Savings Analytics & Finance Control</h1>
        <p>Validate realized savings and monitor planned vs realized variances.</p>
      </header>
      
      <div className="dashboard-grid">
        {kpis.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>

      {/* Pending Savings Validation Queue */}
      <div className="kpi-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '25px' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: 0 }}>Pending Savings Validation Queue</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '5px 0 0 0' }}>Realized savings records reported by buyers awaiting audit and validation.</p>
        </div>
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Loading validation queue...</div>
        ) : pendingValidations.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#22c55e' }}>✓ No pending savings validations. Ledger is fully audited!</div>
        ) : (
          <table className="data-table" style={{ width: '100%', margin: 0 }}>
            <thead>
              <tr>
                <th>Opportunity ID</th>
                <th>Category</th>
                <th>Supplier</th>
                <th>Expected Savings</th>
                <th>Realized Savings Reported</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingValidations.map((item, idx) => (
                <tr key={idx}>
                  <td><strong>{item.opportunity_id}</strong></td>
                  <td>{item.category}</td>
                  <td style={{ fontWeight: 'bold' }}>{item.supplier_name}</td>
                  <td>₹{item.expected_savings.toLocaleString()}</td>
                  <td style={{ color: '#22c55e', fontWeight: 'bold' }}>₹{item.realised_savings.toLocaleString()}</td>
                  <td>
                    <span className="status-badge pending-analysis">
                      {item.status || "Pending Approval"}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-primary" 
                      onClick={() => {
                        setValidateOppId(item.opportunity_id);
                        setValidateAmount(String(item.realised_savings));
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }}
                      style={{ padding: '5px 12px', fontSize: '0.8rem', background: '#10b981' }}
                    >
                      Select to Validate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* Planned vs Realized Chart */}
        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '350px' }}>
          <h3>Category Target vs Realized Savings</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Comparing Budget Allocations (Blue) vs Realized Validation (Green)</p>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', height: '220px', gap: '30px', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', marginTop: '20px' }}>
            {loading ? (
              <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8' }}>Loading charts...</div>
            ) : validations.length === 0 ? (
              <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8' }}>All categories currently balanced.</div>
            ) : (
              validations.map((val: any, idx: number) => {
                const maxVal = Math.max(val.allocated_amount || 0, val.realized || 0) || 1;
                const plannedPercent = ((val.allocated_amount || 0) / maxVal) * 100;
                const realizedPercent = ((val.realized || 0) / maxVal) * 100;
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '5px', height: '100%', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div style={{ height: `${plannedPercent}%`, background: 'rgba(59, 130, 246, 0.5)', width: '30px', borderRadius: '4px 4px 0 0' }} title={`Budgeted: ₹${(val.allocated_amount || 0).toLocaleString()}`}></div>
                      <div style={{ height: `${realizedPercent}%`, background: '#22c55e', width: '30px', borderRadius: '4px 4px 0 0' }} title={`Realized: ₹${(val.realized || 0).toLocaleString()}`}></div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.8rem', color: '#94a3b8' }}>
                      {val.category}
                      <div style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>FY{val.fiscal_year}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px', gap: '20px', fontSize: '0.85rem' }}>
            <div><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'rgba(59, 130, 246, 0.5)', marginRight: '5px', borderRadius: '2px' }}></span> Budget Target</div>
            <div><span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#22c55e', marginRight: '5px', borderRadius: '2px' }}></span> Realized Savings</div>
          </div>
        </div>

        {/* Create Budget & Validate Savings Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Create Budget Target Form */}
          <div className="kpi-card">
            <h3>Create Budget Target</h3>
            <form onSubmit={handleCreateBudget} style={{ marginTop: '15px' }}>
              <div className="form-group">
                <label>Category</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. IT Hardware" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label>Fiscal Year</label>
                  <input 
                    type="number" 
                    className="form-input"
                    placeholder="2026" 
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label>Target Budget (₹)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    placeholder="500000" 
                    value={allocatedAmount}
                    onChange={(e) => setAllocatedAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', padding: '12px', marginTop: '10px' }}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Establish Target"}
              </button>
            </form>
          </div>

          {/* Validate Savings Form */}
          <div className="kpi-card">
            <h3>Validate Realized Savings</h3>
            <form onSubmit={handleValidateSavings} style={{ marginTop: '15px' }}>
              <div className="form-group">
                <label>Opportunity ID</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. OPP-869BD06F" 
                  value={validateOppId}
                  onChange={(e) => setValidateOppId(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Validated Savings Amount (₹)</label>
                <input 
                  type="number" 
                  className="form-input"
                  placeholder="e.g. 120000" 
                  value={validateAmount}
                  onChange={(e) => setValidateAmount(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', padding: '12px', marginTop: '10px', backgroundColor: '#10b981' }}
                disabled={validatingSavings}
              >
                {validatingSavings ? "Validating..." : "Validate Savings"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
        {/* Planned vs Realized Mismatch Details */}
        <div className="kpi-card" style={{ padding: 0 }}>
          <div style={{ padding: '20px' }}>
            <h3>Planned vs Realized Gaps</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>List of categories exhibiting variance between budget targets and validation.</p>
          </div>
          {loading ? (
            <div style={{ padding: '20px', color: '#94a3b8' }}>Loading validations...</div>
          ) : validations.length === 0 ? (
            <div style={{ padding: '20px', color: '#22c55e' }}>No variance items found. All savings validated against targets.</div>
          ) : (
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Fiscal Year</th>
                  <th>Allocated Amount</th>
                  <th>Realized Savings</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {validations.map((val, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 'bold' }}>{val.category}</td>
                    <td>{val.fiscal_year}</td>
                    <td>₹{val.allocated_amount.toLocaleString()}</td>
                    <td style={{ color: '#22c55e', fontWeight: 'bold' }}>₹{val.realized.toLocaleString()}</td>
                    <td style={{ color: val.variance > 0 ? '#ef4444' : '#22c55e' }}>
                      {val.variance > 0 ? `+₹${val.variance.toLocaleString()}` : `₹${val.variance.toLocaleString()}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Existing Budget Table */}
        <div className="kpi-card" style={{ padding: 0 }}>
          <div style={{ padding: '20px' }}>
            <h3>All Budget Targets</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Active category targets and actual spend records.</p>
          </div>
          {loading ? (
            <div style={{ padding: '20px', color: '#94a3b8' }}>Loading budgets...</div>
          ) : budgets.length === 0 ? (
            <div style={{ padding: '20px', color: '#94a3b8' }}>No budgets created yet.</div>
          ) : (
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Year</th>
                  <th>Target Budget</th>
                  <th>Actual Spend</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b, idx) => (
                  <tr key={idx}>
                    <td>{b.category}</td>
                    <td>{b.fiscal_year}</td>
                    <td>₹{b.allocated_amount.toLocaleString()}</td>
                    <td>₹{b.actual_spend.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavingsAnalyticsDashboard;
