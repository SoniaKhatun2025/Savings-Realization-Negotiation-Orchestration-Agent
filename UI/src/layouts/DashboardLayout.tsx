import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, Briefcase, MessageSquare, PieChart, LogOut, Menu, ShieldAlert } from 'lucide-react';
import Topbar from './Topbar';

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const savedRole = localStorage.getItem('nexus_role');
    if (!savedRole) {
      navigate('/login');
    } else {
      setRole(savedRole);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('nexus_role');
    navigate('/');
  };

  const toggleSidebar = () => setIsExpanded(!isExpanded);
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="layout">
      <nav className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center', marginBottom: '30px' }}>
          {isExpanded && <h2 style={{ cursor: 'pointer', margin: 0 }} onClick={() => navigate('/')}>NexusProcure</h2>}
          <button onClick={toggleSidebar} style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', cursor: 'pointer', padding: 0 }}>
            <Menu size={24} />
          </button>
        </div>

        {isExpanded && (
          <div style={{ marginBottom: '20px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
            Logged in as:<br />
            <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{role}</strong>
          </div>
        )}

        <ul>
          {role === 'CPO' && (
            <>
              <li>
                <Link to="/dashboard/cpo" title="Executive Dashboard">
                  <LayoutDashboard size={20} />
                  {isExpanded && <span>Executive Dashboard</span>}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/supplier-analytics" title="Supplier Analytics">
                  <PieChart size={20} />
                  {isExpanded && <span>Supplier Analytics</span>}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/knowledge-base" title="Knowledge Base & Upload">
                  <Database size={20} />
                  {isExpanded && <span>Knowledge Base & Upload</span>}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/audit-logs" title="System Audit Logs">
                  <ShieldAlert size={20} />
                  {isExpanded && <span>System Audit Logs</span>}
                </Link>
              </li>
            </>
          )}

          {role === 'Category Manager' && (
            <>
              <li>
                <Link to="/dashboard/category" title="Category Dashboard">
                  <LayoutDashboard size={20} />
                  {isExpanded && <span>Category Dashboard</span>}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/knowledge-base" title="Knowledge Base & Upload">
                  <Database size={20} />
                  {isExpanded && <span>Knowledge Base & Upload</span>}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/supplier-analytics" title="Supplier Analytics">
                  <PieChart size={20} />
                  {isExpanded && <span>Supplier Analytics</span>}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/opportunity-queue" title="Opportunity Queue">
                  <Briefcase size={20} />
                  {isExpanded && <span>Opportunity Queue</span>}
                </Link>
              </li>
            </>
          )}

          {role === 'Buyer' && (
            <>
              <li>
                <Link to="/dashboard/buyer" title="Buyer Workspace" className={isActive('/dashboard/buyer') ? 'active' : ''}>
                  <Briefcase size={20} />
                  {isExpanded && <span>Buyer Workspace</span>}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/opportunity-queue" title="Opportunity Queue" className={isActive('/dashboard/opportunity-queue') ? 'active' : ''}>
                  <LayoutDashboard size={20} />
                  {isExpanded && <span>Opportunity Queue</span>}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/savings-tracker" title="Savings Tracker" className={isActive('/dashboard/savings-tracker') ? 'active' : ''}>
                  <PieChart size={20} />
                  {isExpanded && <span>Savings Tracker</span>}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/chatbot" title="AI Procurement Assistant" className={isActive('/dashboard/chatbot') ? 'active' : ''}>
                  <MessageSquare size={20} />
                  {isExpanded && <span>AI Procurement Assistant</span>}
                </Link>
              </li>
            </>
          )}

          {(role === 'Finance' || role === 'Finance Controller') && (
            <>
              <li>
                <Link to="/dashboard/finance" title="Savings Analytics">
                  <PieChart size={20} />
                  {isExpanded && <span>Savings Analytics</span>}
                </Link>
              </li>
              <li>
                <Link to="/dashboard/savings-tracker" title="Savings Tracker">
                  <LayoutDashboard size={20} />
                  {isExpanded && <span>Savings Tracker</span>}
                </Link>
              </li>
            </>
          )}
        </ul>

        <div style={{ position: 'absolute', bottom: '20px', left: isExpanded ? '20px' : '0', width: isExpanded ? 'calc(100% - 40px)' : '100%', textAlign: isExpanded ? 'left' : 'center' }}>
          <button onClick={handleLogout} title="Logout" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '10px', width: '100%', justifyContent: isExpanded ? 'flex-start' : 'center' }}>
            <LogOut size={20} />
            {isExpanded && <span>Logout</span>}
          </button>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar role={role} />
        <main className="main-content" style={{ overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
