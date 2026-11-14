import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Info, 
  Layers, 
  Clock,
  HardDrive
} from 'lucide-react';
import { getDatasetsStatus, uploadDataset, extractErrorMessage } from '../services/api';
import { LoadingState, ErrorState, EmptyState } from '../components/LoadingState';

export const DataSources = () => {
  const fileInputRef = useRef(null);

  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadClassification, setUploadClassification] = useState('Crowdsourced Consented Reports');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getDatasetsStatus();
      setDatasets(Array.isArray(data) ? data : data?.datasets || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.csv')) {
        setUploadError('Only CSV threat dataset files are supported.');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccess(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('classification', uploadClassification);

    try {
      const res = await uploadDataset(formData, (progress) => {
        setUploadProgress(progress);
      });

      setUploadSuccess(res.message || `Successfully ingested ${selectedFile.name} into ScamTrace.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchStatus(); // Refresh datasets table
    } catch (err) {
      setUploadError(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Database size={18} style={{ color: 'var(--primary-accent)' }} />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Intelligence Lineage & Ingestion
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Threat Datasets & Ingestion Engine
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Transparent provenance tracking across regulatory feeds, honeypot telemetry, and consented user disclosures.
          </p>
        </div>

        <button onClick={fetchStatus} className="btn btn-secondary" style={{ fontSize: '12px' }}>
          <RefreshCw size={14} /> Refresh Datasets
        </button>
      </div>

      {/* CSV Ingestion Dropzone Card */}
      <div className="cyber-card" style={{ backgroundColor: '#0F172A', border: '1px solid var(--border-glow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Upload size={18} style={{ color: 'var(--primary-accent)' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Ingest New Threat Dataset (CSV)
          </h3>
        </div>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="grid-2">
            <div>
              <label className="form-label">EVIDENCE CLASSIFICATION</label>
              <select
                value={uploadClassification}
                onChange={(e) => setUploadClassification(e.target.value)}
                className="form-select"
              >
                <option value="Verified Regulatory Intelligence">Verified Regulatory Intelligence</option>
                <option value="Honeypot / Telemetry Feed">Honeypot / Telemetry Feed</option>
                <option value="Crowdsourced Consented Reports">Crowdsourced Consented Reports</option>
                <option value="Synthetic Training Pattern">Synthetic Training Pattern</option>
              </select>
            </div>

            <div>
              <label className="form-label">SELECT CSV DATASET FILE</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="form-input"
                style={{ padding: '8px' }}
              />
            </div>
          </div>

          {/* Progress Bar when uploading */}
          {uploading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Streaming & Parsing Indicators...</span>
                <span style={{ color: 'var(--primary-accent)', fontFamily: 'var(--font-mono)' }}>{uploadProgress}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#111827', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: 'var(--primary-accent)', transition: 'width 0.2s' }} />
              </div>
            </div>
          )}

          {/* Upload Success Alert */}
          {uploadSuccess && (
            <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', color: 'var(--accent-green)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Upload Error Alert */}
          {uploadError && (
            <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', color: 'var(--accent-critical)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{uploadError}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="btn btn-primary"
              style={{ padding: '10px 22px', fontSize: '13px' }}
            >
              {uploading ? 'Processing Dataset...' : 'Upload & Parse Indicators'}
            </button>
          </div>
        </form>
      </div>

      {/* Datasets Table */}
      <div className="cyber-card">
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Active Intelligence Repositories
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Provenance, ingestion health, and analytical limitations per dataset
          </span>
        </div>

        {error && (
          <ErrorState
            title="Failed to Load Dataset Repositories"
            message={error}
            onRetry={fetchStatus}
          />
        )}

        {loading ? (
          <LoadingState message="Querying dataset registry from /api/datasets/status..." />
        ) : datasets.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px' }}>Dataset Name</th>
                  <th style={{ padding: '12px' }}>Source / Authority</th>
                  <th style={{ padding: '12px' }}>Imported Records</th>
                  <th style={{ padding: '12px' }}>Classification</th>
                  <th style={{ padding: '12px' }}>Ingestion Status</th>
                  <th style={{ padding: '12px' }}>Limitations & Scope</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((d, idx) => (
                  <tr
                    key={d.id || idx}
                    style={{ borderBottom: '1px solid #111827' }}
                  >
                    <td style={{ padding: '14px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HardDrive size={15} style={{ color: 'var(--primary-accent)' }} />
                        <span>{d.name || d.dataset_name}</span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 12px', color: 'var(--text-secondary)' }}>
                      {d.source || 'National Cyber Registry'}
                    </td>

                    <td style={{ padding: '14px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {(d.recordCount ?? d.record_count ?? 0).toLocaleString()}
                    </td>

                    <td style={{ padding: '14px 12px' }}>
                      <span
                        className={`badge ${d.isSynthetic || d.classification?.toLowerCase().includes('synthetic') ? 'badge-synthetic' : 'badge-low'}`}
                        style={{ fontSize: '11px' }}
                      >
                        {d.classification || 'Verified Intel'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent-green)' }}>
                        <span className="pulse-dot pulse-dot-green" />
                        {d.status || d.importStatus || 'Synced'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 12px', color: 'var(--text-muted)', fontSize: '12px', maxWidth: '300px' }}>
                      {d.limitations || 'Correlative indicator scope only.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No datasets currently registered in ScamTrace." />
        )}
      </div>
    </div>
  );
};

export default DataSources;
