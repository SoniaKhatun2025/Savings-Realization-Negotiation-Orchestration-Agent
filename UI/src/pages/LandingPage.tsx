import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'radial-gradient(circle at top, #1e293b, var(--bg-color))' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <a href="#hero" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', textDecoration: 'none' }}>NexusProcure</a>
        <nav style={{ display: 'flex', gap: '30px' }}>
          <a href="#about" className="nav-link">About</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#objectives" className="nav-link">Objectives</a>
        </nav>
        <button className="btn-primary" onClick={() => navigate('/login')}>Sign In</button>
      </header>

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <section id="hero" style={{ textAlign: 'center', padding: '120px 20px', minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h1 style={{ fontSize: '4rem', color: 'var(--text-color)', marginBottom: '20px' }}>
            Enterprise <span style={{ color: 'var(--primary)' }}>AI Procurement</span>
          </h1>
          <h2 style={{ fontWeight: 'normal', color: '#94a3b8', maxWidth: '800px', margin: '0 auto 40px', lineHeight: '1.6', fontSize: '1.4rem' }}>
            NexusProcure is your intelligent sourcing co-pilot. We stop savings leakage by automatically detecting price anomalies, recommending negotiation strategies, and validating realized savings across your entire supply chain.
          </h2>
          <button className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 40px', borderRadius: '30px' }} onClick={() => navigate('/login')}>
            Sign In
          </button>
        </section>

        {/* About Section */}
        <section id="about" style={{ padding: '80px 40px', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '30px', color: 'var(--primary)' }}>What is NexusProcure?</h2>
            <p style={{ fontSize: '1.2rem', color: '#cbd5e1', lineHeight: '1.8' }}>
              Most enterprises lose millions in "savings leakage" due to poor negotiation tracking and lack of execution follow-up. 
              NexusProcure is a multi-agent AI orchestration platform designed specifically for Chief Procurement Officers, Category Managers, and Buyers. 
              It ingests ERP spend data and uses AI Semantic Search to analyze contracts, build negotiation playbooks, and assign actionable tasks to your team.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" style={{ padding: '80px 40px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '50px' }}>Core Features</h2>
          <div className="dashboard-grid" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="kpi-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>AI-Powered Chatbot</h3>
              <p style={{ color: '#94a3b8', lineHeight: '1.5' }}>Chat instantly with your procurement data to query supplier histories, contract terms, and spend variance insights.</p>
            </div>
            <div className="kpi-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Role-Based Dashboards</h3>
              <p style={{ color: '#94a3b8', lineHeight: '1.5' }}>Customized UI workspaces tailored for the CPO, Category Manager, Buyer, and Finance Controller.</p>
            </div>
            <div className="kpi-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Vector Knowledge Base</h3>
              <p style={{ color: '#94a3b8', lineHeight: '1.5' }}>Securely upload and embed your historical contracts and policies into ChromaDB for instant semantic retrieval.</p>
            </div>
          </div>
        </section>

        {/* Objectives Section */}
        <section id="objectives" style={{ padding: '80px 40px', background: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '50px' }}>Our Objectives</h2>
          <div className="dashboard-grid" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="kpi-card" style={{ textAlign: 'center', padding: '40px 20px', borderLeft: '4px solid var(--primary)' }}>
              <h3 style={{ marginBottom: '15px' }}>Identify Savings Opportunities</h3>
              <p style={{ color: '#94a3b8', lineHeight: '1.5' }}>Continuously analyze ERP spend data and purchase orders to surface hidden savings and price variance anomalies.</p>
            </div>
            <div className="kpi-card" style={{ textAlign: 'center', padding: '40px 20px', borderLeft: '4px solid #22c55e' }}>
              <h3 style={{ marginBottom: '15px' }}>Orchestrate Negotiations</h3>
              <p style={{ color: '#94a3b8', lineHeight: '1.5' }}>Generate targeted playbooks, draft RFQ communications, and assign contextual tasks directly to Buyers.</p>
            </div>
            <div className="kpi-card" style={{ textAlign: 'center', padding: '40px 20px', borderLeft: '4px solid #a855f7' }}>
              <h3 style={{ marginBottom: '15px' }}>Track Realized Savings</h3>
              <p style={{ color: '#94a3b8', lineHeight: '1.5' }}>Close the loop by reconciling planned savings against actual outcomes, providing validated ROI metrics.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: 'rgba(0,0,0,0.5)', padding: '40px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ color: '#64748b', marginBottom: '15px' }}>
          &copy; {new Date().getFullYear()} NexusProcure. All rights reserved.
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <a href="#" className="nav-link" style={{ fontSize: '0.9rem' }}>Privacy Policy</a>
          <a href="#" className="nav-link" style={{ fontSize: '0.9rem' }}>Terms of Service</a>
          <a href="#" className="nav-link" style={{ fontSize: '0.9rem' }}>Contact</a>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
