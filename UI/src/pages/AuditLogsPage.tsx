import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldAlert, Calendar, User, Activity, Globe } from 'lucide-react';

interface AuditLog {
  id: number;
  user_name: string;
  email: string;
  action: string;
  target_api: string;
  details_json: any;
  timestamp: string;
}

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const token = localStorage.getItem("nexus_token");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8002/audit/logs", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const resData = await response.json();
      if (response.ok && resData.data) {
        setLogs(resData.data);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.target_api.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.details_json && JSON.stringify(log.details_json).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard">
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={28} color="var(--primary)" /> System Audit Logs
          </h1>
          <p>Real-time security and operational transaction logs for system activity.</p>
        </div>
        <div>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search audit logs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px 15px 8px 35px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', width: '250px' }} 
            />
          </div>
        </div>
      </header>

      <div className="kpi-card" style={{ padding: 0, overflow: 'hidden', marginTop: '20px' }}>
        <div style={{ overflowX: 'auto', maxHeight: '650px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading audit logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No audit logs matching search criteria.</div>
          ) : (
            <table className="data-table" style={{ width: '100%', margin: 0 }}>
              <thead style={{ position: 'sticky', top: 0, background: '#1e293b', zIndex: 10 }}>
                <tr>
                  <th style={{ padding: '15px' }}><Calendar size={14} style={{ display: 'inline', marginRight: '5px' }}/> Timestamp</th>
                  <th style={{ padding: '15px' }}><User size={14} style={{ display: 'inline', marginRight: '5px' }}/> Actor</th>
                  <th style={{ padding: '15px' }}><Activity size={14} style={{ display: 'inline', marginRight: '5px' }}/> Action</th>
                  <th style={{ padding: '15px' }}><Globe size={14} style={{ display: 'inline', marginRight: '5px' }}/> Target API</th>
                  <th style={{ padding: '15px' }}>Payload / Metadata</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <motion.tr 
                    key={log.id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  >
                    <td style={{ padding: '15px', color: '#cbd5e1', fontSize: '0.8rem' }}>{formatDate(log.timestamp)}</td>
                    <td style={{ padding: '15px' }}>
                      <strong style={{ color: 'white' }}>{log.user_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.email}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                        background: log.action.includes('Delete') || log.action.includes('Fail') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: log.action.includes('Delete') || log.action.includes('Fail') ? '#f87171' : '#60a5fa',
                        border: `1px solid ${log.action.includes('Delete') || log.action.includes('Fail') ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '15px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#cbd5e1' }}>{log.target_api}</td>
                    <td style={{ padding: '15px' }}>
                      {log.details_json ? (
                        <pre style={{ margin: 0, padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.75rem', color: '#a78bfa', overflowX: 'auto', maxWidth: '350px', fontFamily: 'monospace' }}>
                          {JSON.stringify(log.details_json, null, 2)}
                        </pre>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>None</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem' }}>
          <span>Total {filteredLogs.length} audit trail entries</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AuditLogsPage;
