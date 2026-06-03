import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocRecord {
  id: number;
  filename: string;
  doc_type: string;
  processing_status: string;
  extraction_status: string;
  uploaded_at: string;
  storage_url?: string;
}

const KnowledgeBaseUpload: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [documents, setDocuments] = useState<DocRecord[]>([]);
  const [stats, setStats] = useState({ supplier_profiles: 0, active_contracts: 0, benchmark_sources: 0 });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("nexus_token");

  const fetchDocuments = async () => {
    try {
      const response = await fetch("http://localhost:8002/knowledge/documents", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const resData = await response.json();
      if (response.ok && resData.data) {
        setDocuments(resData.data);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:8002/knowledge/stats", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const resData = await response.json();
      if (response.ok && resData.data) {
        setStats(resData.data);
      }
    } catch (err) {
      console.error("Error fetching knowledge stats:", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const selectedFilesMapRef = useRef<{ [filename: string]: File }>({});
  const [uploadedDocs, setUploadedDocs] = useState<{
    id: number;
    filename: string;
    status: string;
    extraction_status?: string;
    doc_type?: string;
    supplier_name?: string;
    extracted_spend?: number;
    extracted_benchmark?: number;
    extracted_savings?: number;
    confidence_score?: number;
  }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files) as File[];
      setSelectedFiles(filesArray);
      filesArray.forEach(f => {
        selectedFilesMapRef.current[f.name] = f;
      });
    }
  };

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      setSelectedFiles(filesArray);
      filesArray.forEach(f => {
        selectedFilesMapRef.current[f.name] = f;
      });
    }
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select files first.");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("doc_type", "Auto-Detect");

    try {
      setAnalyzing(true);
      setIsProcessing(true);
      setUploadedDocs(selectedFiles.map(f => ({ id: -1, filename: f.name, status: "Uploading & Analyzing..." })));

      const response = await fetch("http://localhost:8002/knowledge/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to upload documents");
      }
      
      const resData = await response.json();
      if (resData.data) {
        setUploadedDocs(resData.data.map((ad: any) => ({
          id: ad.doc_id || -1,
          filename: ad.filename,
          status: ad.success ? "Indexed" : "Failed",
          extraction_status: ad.success ? "Complete" : ad.error,
          doc_type: ad.doc_type,
          supplier_name: ad.supplier_name,
          extracted_spend: ad.extracted_spend,
          extracted_benchmark: ad.extracted_benchmark,
          extracted_savings: ad.extracted_savings,
          confidence_score: ad.confidence_score
        })));
      }
      setSelectedFiles([]);
      setIsProcessing(false);
      fetchDocuments();
      fetchStats();
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setUploadedDocs(selectedFiles.map(f => ({
        id: -1,
        filename: f.name,
        status: "Failed",
        extraction_status: err.message || "Failed to Fetch (Network Error)"
      })));
    }
  };

  const handleRetryUpload = async (filename: string) => {
    const fileObj = selectedFilesMapRef.current[filename];
    if (!fileObj) {
      alert(`Original file object for "${filename}" not found. Please browse and select the file again.`);
      return;
    }

    // Set item status back to Uploading & Analyzing...
    setUploadedDocs(prev => prev.map(d => d.filename === filename ? { ...d, status: "Uploading & Analyzing...", extraction_status: undefined } : d));
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("files", fileObj);
    formData.append("doc_type", "Auto-Detect");

    try {
      const response = await fetch("http://localhost:8002/knowledge/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to upload document");
      }

      const resData = await response.json();
      if (resData.data && resData.data.length > 0) {
        const result = resData.data[0];
        setUploadedDocs(prev => prev.map(d => d.filename === filename ? {
          id: result.doc_id || -1,
          filename: d.filename,
          status: result.success ? "Indexed" : "Failed",
          extraction_status: result.success ? "Complete" : result.error,
          doc_type: result.doc_type,
          supplier_name: result.supplier_name,
          extracted_spend: result.extracted_spend,
          extracted_benchmark: result.extracted_benchmark,
          extracted_savings: result.extracted_savings,
          confidence_score: result.confidence_score
        } : d));
      }
      setIsProcessing(false);
      fetchDocuments();
      fetchStats();
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setUploadedDocs(prev => prev.map(d => d.filename === filename ? {
        ...d,
        status: "Failed",
        extraction_status: err.message || "Retry Failed"
      } : d));
    }
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
          <div style={{ fontSize: '1.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>{documents.length}</div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Indexed Documents</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '1.8rem', color: '#22c55e', fontWeight: 'bold' }}>{stats.supplier_profiles}</div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Supplier Profiles</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '1.8rem', color: '#a855f7', fontWeight: 'bold' }}>{stats.active_contracts}</div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Active Contracts</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '1.8rem', color: '#eab308', fontWeight: 'bold' }}>{stats.benchmark_sources}</div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Benchmark Sources</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="kpi-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: 0 }}>Document Processing Queue</h3>
        </div>
        {documents.length === 0 ? (
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
              {documents.map((doc, idx) => (
                <motion.tr key={doc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                  <td>{doc.filename}</td>
                  <td>{new Date(doc.uploaded_at.endsWith('Z') ? doc.uploaded_at : doc.uploaded_at + 'Z').toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${doc.processing_status.toLowerCase()}`}>
                      {doc.processing_status}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: doc.processing_status === 'Indexed' ? '#22c55e' : (doc.processing_status === 'Failed' ? '#ef4444' : '#eab308') }}>
                      {doc.extraction_status || (doc.processing_status === 'Indexed' ? 'Complete' : 'In Progress')}
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
              style={{ background: '#1e293b', width: '600px', borderRadius: '16px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Upload Procurement Documents</h3>
                <button onClick={() => !isProcessing && setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>

              {!analyzing ? (
                <>
                  {/* Procurement Ingestion Rulebook Display */}
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '18px',
                    marginBottom: '20px',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '1.3rem', color: '#60a5fa' }}>📋</span>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.025em' }}>
                        Procurement Ingestion Rulebook
                      </h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#38bdf8', fontSize: '0.9rem', marginTop: '2px' }}>✦</span>
                        <div style={{ fontSize: '0.8rem', lineHeight: '1.4', color: '#cbd5e1' }}>
                          <strong style={{ color: '#f1f5f9' }}>Format Constraint:</strong> Only <span style={{ color: '#38bdf8', fontFamily: 'monospace', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>PDF</span>, <span style={{ color: '#38bdf8', fontFamily: 'monospace', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>XLSX</span>, <span style={{ color: '#38bdf8', fontFamily: 'monospace', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>CSV</span>, or <span style={{ color: '#38bdf8', fontFamily: 'monospace', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>TXT</span> file types.
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#38bdf8', fontSize: '0.9rem', marginTop: '2px' }}>✦</span>
                        <div style={{ fontSize: '0.8rem', lineHeight: '1.4', color: '#cbd5e1' }}>
                          <strong style={{ color: '#f1f5f9' }}>Size Threshold:</strong> Single file uploads must be strictly under <span style={{ color: '#eab308', fontWeight: 600 }}>20MB</span>.
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#38bdf8', fontSize: '0.9rem', marginTop: '2px' }}>✦</span>
                        <div style={{ fontSize: '0.8rem', lineHeight: '1.4', color: '#cbd5e1' }}>
                          <strong style={{ color: '#f1f5f9' }}>Text Completeness:</strong> Scanned/blank documents must yield <span style={{ color: '#eab308', fontWeight: 600 }}>&gt;20 characters</span> of readable text.
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#38bdf8', fontSize: '0.9rem', marginTop: '2px' }}>✦</span>
                        <div style={{ fontSize: '0.8rem', lineHeight: '1.4', color: '#cbd5e1' }}>
                          <strong style={{ color: '#f1f5f9' }}>Procurement Alignment:</strong> Document contents must contain relevant keywords (e.g. <em>invoice, contract, spend, cost, supplier, vendor, pricing</em>).
                        </div>
                      </div>
                    </div>
                  </div>

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
                    <p style={{ marginBottom: '20px', color: '#cbd5e1' }}>
                      {selectedFiles.length > 0
                        ? `Selected (${selectedFiles.length}): ${selectedFiles.map(f => f.name).join(', ')}`
                        : "Drag and drop multiple PDF, XLSX, CSV, or TXT files here (Max 20MB)"}
                    </p>
                    <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept=".pdf,.xlsx,.csv,.txt" />
                    <button className="btn-secondary" onClick={handleBrowseClick} style={{ padding: '8px 20px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                      Browse Files
                    </button>
                  </div>

                  <button className="btn-primary" onClick={handleAnalyze} style={{ width: '100%', padding: '12px', fontSize: '1rem' }} disabled={selectedFiles.length === 0}>
                    Upload & Analyze
                  </button>
                </>
              ) : (
                <div style={{ padding: '10px 0' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: 'var(--primary)', textAlign: 'center' }}>
                    AI RAG Ingestion Pipeline
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '420px', overflowY: 'auto', marginBottom: '20px', paddingRight: '5px' }}>
                    {uploadedDocs.map((doc, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '10px',
                        background: 'rgba(30, 41, 59, 0.4)',
                        padding: '12px 15px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.02)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '70%' }}>
                            <span style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.filename}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: doc.status === 'Indexed' ? '#22c55e' : (doc.status === 'Failed' ? '#ef4444' : '#eab308') }}>
                              {doc.extraction_status || doc.status}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {doc.status === 'Uploading...' && (
                              <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>Uploading...</span>
                            )}
                            {(doc.status === 'Processing' || doc.status === 'In Progress' || doc.status === 'Uploading' || doc.status === 'Uploading & Analyzing...') && (
                              <div className="spinner-small" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            )}
                            {doc.status === 'Indexed' && (
                              <span style={{ color: '#22c55e', fontSize: '1.1rem', fontWeight: 'bold' }}>✓</span>
                            )}
                            {doc.status === 'Failed' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button 
                                  onClick={() => handleRetryUpload(doc.filename)}
                                  style={{ 
                                    background: 'rgba(239, 68, 68, 0.1)', 
                                    color: '#ef4444', 
                                    border: '1px solid rgba(239, 68, 68, 0.2)', 
                                    padding: '4px 10px', 
                                    borderRadius: '4px', 
                                    fontSize: '0.75rem', 
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                  }}
                                >
                                  Re-upload
                                </button>
                                <span style={{ color: '#ef4444', fontSize: '1.1rem', fontWeight: 'bold' }}>✕</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {doc.status === 'Indexed' && (
                          <div style={{
                            marginTop: '4px',
                            padding: '12px',
                            background: '#0f172a',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            color: '#cbd5e1'
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                              <div>
                                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier Name</span>
                                <span style={{ color: '#f8fafc', fontWeight: 600 }}>{doc.supplier_name || 'Unknown Supplier'}</span>
                              </div>
                              <div>
                                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Document Type</span>
                                <span style={{ color: '#f8fafc', fontWeight: 600 }}>{doc.doc_type || 'Unknown'}</span>
                              </div>
                              <div>
                                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Spend</span>
                                <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                                  {doc.extracted_spend !== undefined && doc.extracted_spend > 0 ? `₹${doc.extracted_spend.toLocaleString('en-IN')}` : '—'}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Benchmark Spend</span>
                                <span style={{ color: '#a78bfa', fontWeight: 600 }}>
                                  {doc.extracted_benchmark !== undefined && doc.extracted_benchmark > 0 ? `₹${doc.extracted_benchmark.toLocaleString('en-IN')}` : '—'}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Savings Potential</span>
                                <span style={{ color: '#34d399', fontWeight: 600 }}>
                                  {doc.extracted_savings !== undefined && doc.extracted_savings > 0 ? `₹${doc.extracted_savings.toLocaleString('en-IN')}` : '—'}
                                </span>
                              </div>
                              <div>
                                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Confidence</span>
                                <span style={{ 
                                  color: doc.confidence_score && doc.confidence_score >= 90 ? '#34d399' : (doc.confidence_score && doc.confidence_score >= 70 ? '#fbbf24' : '#ef4444'), 
                                  fontWeight: 600 
                                }}>
                                  {doc.confidence_score !== undefined ? `${doc.confidence_score}%` : '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                    {isProcessing ? (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="spinner-small" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255, 255, 255, 0.1)', borderTop: '2px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        Analyzing and detecting anomalies...
                      </p>
                    ) : (
                      <>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#22c55e', fontWeight: 500 }}>
                          ✓ AI analysis completed!
                        </p>
                        <button className="btn-primary" onClick={() => { setAnalyzing(false); setShowModal(false); }} style={{ width: '100%', padding: '10px' }}>
                          Close
                        </button>
                      </>
                    )}
                  </div>
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
