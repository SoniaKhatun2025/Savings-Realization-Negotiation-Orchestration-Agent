import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dummyKnowledgeBaseFiles } from '../data/dummyData';

const KnowledgeBaseUpload: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      alert('File selected. Ready to upload.');
    }
  };

  const steps = [
    "Document Uploaded",
    "Text Extracted",
    "Chunking Complete",
    "Embeddings Generated",
    "Indexed into ChromaDB",
    "Supplier Intelligence Created",
    "Opportunity Detection Started"
  ];

  useEffect(() => {
    let interval: any;
    if (analyzing) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              setAnalyzing(false);
              setShowModal(false); // Auto close modal on finish
              alert('AI Indexing Complete! New opportunities detected.');
            }, 1000);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
    } else {
      setCurrentStep(0);
    }
    return () => clearInterval(interval);
  }, [analyzing, steps.length]);

  const handleDrag = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    alert('File dropped. Ready to upload.');
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      {/* Page Header */}
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0' }}>Knowledge Base Intelligence</h1>
          <p style={{ margin: 0, color: '#94a3b8' }}>Manage procurement documents used by the AI semantic indexing system.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Upload Document
        </button>
      </header>
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>142</div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Indexed Documents</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '1.8rem', color: '#22c55e', fontWeight: 'bold' }}>58</div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Supplier Profiles</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '1.8rem', color: '#a855f7', fontWeight: 'bold' }}>214</div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Active Contracts</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '1.8rem', color: '#eab308', fontWeight: 'bold' }}>12</div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Benchmark Sources</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="kpi-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: 0 }}>Document Processing Queue</h3>
        </div>
        {dummyKnowledgeBaseFiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            No procurement documents uploaded yet.
          </div>
        ) : (
          <table className="data-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Upload Date</th>
                <th>Processing Status</th>
                <th>AI Extraction Status</th>
              </tr>
            </thead>
            <tbody>
              {dummyKnowledgeBaseFiles.map((file, idx) => (
                <motion.tr key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                  <td>{file.name}</td>
                  <td>{file.date}</td>
                  <td>
                    <span className={`status-badge ${file.processingStatus.toLowerCase()}`}>
                      {file.processingStatus}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: file.aiExtraction === 'Complete' ? '#22c55e' : (file.aiExtraction.includes('Error') ? '#ef4444' : '#eab308') }}>
                      {file.aiExtraction}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{ background: '#1e293b', width: '500px', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Upload Procurement Document</h3>
                <button onClick={() => !analyzing && setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>

              {!analyzing ? (
                <>
                  <div 
                    className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    style={{
                      border: '2px dashed rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      padding: '40px 20px',
                      textAlign: 'center',
                      backgroundColor: dragActive ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.2)',
                      transition: 'all 0.3s',
                      marginBottom: '20px'
                    }}
                  >
                    <p style={{ marginBottom: '20px', color: '#cbd5e1' }}>Drag and drop PDF, DOCX, CSV, or Pricing Sheets here</p>
                    <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept=".pdf,.docx,.xlsx,.csv" />
                    <button className="btn-secondary" onClick={handleBrowseClick} style={{ padding: '8px 20px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                      Browse Files
                    </button>
                  </div>
                  
                  <button className="btn-primary" onClick={handleAnalyze} style={{ width: '100%', padding: '12px', fontSize: '1rem' }}>
                    Upload & Analyze
                  </button>
                </>
              ) : (
                <div style={{ padding: '20px 0' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: 'var(--primary)', textAlign: 'center' }}>AI Processing Pipeline</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {steps.map((step, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px', opacity: index <= currentStep ? 1 : 0.3 }}>
                        <div style={{ 
                          width: '24px', height: '24px', borderRadius: '50%', 
                          background: index < currentStep ? '#22c55e' : (index === currentStep ? 'var(--primary)' : 'rgba(255,255,255,0.1)'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem'
                        }}>
                          {index < currentStep ? '✓' : (index === currentStep ? '...' : '')}
                        </div>
                        <span style={{ color: index <= currentStep ? 'white' : '#94a3b8', fontSize: '0.95rem' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                  <motion.div 
                    style={{ height: '4px', background: 'var(--primary)', marginTop: '25px', borderRadius: '2px' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default KnowledgeBaseUpload;
