import React from 'react';
import { dummySupplierAnalytics } from '../data/dummyData';

const SupplierAnalytics: React.FC = () => {
  return (
    <div className="kpi-card" style={{ marginTop: '20px' }}>
      <h3>Supplier Variance Analytics</h3>
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
          {dummySupplierAnalytics.map((sup, idx) => (
            <tr key={idx}>
              <td>{sup.name}</td>
              <td>{sup.category}</td>
              <td className={sup.trendClass}>{sup.variance}</td>
              <td>{sup.risk}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SupplierAnalytics;
