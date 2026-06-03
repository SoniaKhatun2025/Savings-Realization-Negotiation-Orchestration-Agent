import React, { useState, useEffect } from 'react';

interface SupplierData {
  name: string;
  category: string;
  variance: string;
  risk: string;
  trendClass: string;
}

const SupplierAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);

  useEffect(() => {
    const fetchSupplierAnalytics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("nexus_token");
        const response = await fetch("http://localhost:8002/opportunities/list", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const resData = await response.json();
        if (response.ok && resData.data) {
          // Group by supplier name to aggregate spend and variance, ensuring a single unique row per supplier
          const groups: { [name: string]: {
            supplier_name: string;
            category: string;
            variance_amount: number;
            benchmark_spend: number;
            risk_level_id: number;
          }} = {};

          resData.data.forEach((opt: any) => {
            const name = opt.supplier_name || `Supplier #${opt.supplier_id}`;
            if (!groups[name]) {
              groups[name] = {
                supplier_name: name,
                category: opt.category || "General Procurement",
                variance_amount: 0,
                benchmark_spend: 0,
                risk_level_id: opt.risk_level_id || 1
              };
            }
            groups[name].variance_amount += Number(opt.variance_amount || 0);
            groups[name].benchmark_spend += Number(opt.benchmark_spend || 0);
            // Keep the maximum risk level detected
            if (opt.risk_level_id > groups[name].risk_level_id) {
              groups[name].risk_level_id = opt.risk_level_id;
            }
          });

          const mapped: SupplierData[] = Object.values(groups).map((group: any) => {
            const variancePercent = group.benchmark_spend > 0 
              ? Math.round((group.variance_amount / group.benchmark_spend) * 100)
              : 0;
            const variance = variancePercent > 0 
              ? `+${variancePercent}% (Overpaying)` 
              : `${variancePercent}% (Savings)`;
            const trendClass = variancePercent > 0 ? 'trend-down' : 'trend-up';

            let risk = "Low";
            if (group.risk_level_id === 2) risk = "Medium";
            else if (group.risk_level_id === 3) risk = "High";

            return {
              name: group.supplier_name,
              category: group.category,
              variance,
              risk,
              trendClass
            };
          });
          
          setSuppliers(mapped);
        }
      } catch (err) {
        console.error("Error fetching supplier analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierAnalytics();
  }, []);

  return (
    <div className="kpi-card" style={{ marginTop: '20px' }}>
      <h3>Supplier Variance Analytics</h3>
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Loading supplier analytics...</div>
      ) : suppliers.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No supplier data available.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>Category</th>
              <th>Historical Price Variance</th>
              <th>Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((sup, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 'bold' }}>{sup.name}</td>
                <td>{sup.category}</td>
                <td className={sup.trendClass}>{sup.variance}</td>
                <td>
                  <span style={{
                    color: sup.risk === 'High' ? '#ef4444' : sup.risk === 'Medium' ? '#eab308' : '#22c55e',
                    fontWeight: 'bold'
                  }}>
                    {sup.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SupplierAnalytics;
