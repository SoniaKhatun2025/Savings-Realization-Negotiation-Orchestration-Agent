import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  trend: string;
  positive: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, trend, positive }) => {
  return (
    <div className="kpi-card">
      <h3 className="kpi-title">{title}</h3>
      <div className="kpi-value">{value}</div>
      <div className={`kpi-trend ${positive ? 'trend-up' : 'trend-down'}`}>
        {trend}
      </div>
    </div>
  );
};

export default KpiCard;
