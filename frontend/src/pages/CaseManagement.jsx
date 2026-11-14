import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Plus, 
  FolderOpen, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Download, 
  Trash2, 
  ExternalLink, 
  MessageSquare, 
  ShieldAlert, 
  User, 
  FileText,
  Search,
  Filter,
  X
} from 'lucide-react';
import { 
  getCases, 
  createCase, 
  getCaseDetail, 
  updateCase, 
  deleteCase, 
  attachCaseEntity, 
  removeCaseEntity, 
  addCaseNote, 
  exportCaseDossier,
  extractErrorMessage 
} from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { LoadingState, ErrorState } from '../components/LoadingState';

export const CaseManagement = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Selected Case Detail View
  const [activeCase, setActiveCase] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // New Case Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'OPEN',
    assigned_to: 'Investigator'
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Quick Attach Entity State
  const [attachInput, setAttachInput] = useState('');
  const [attachNotes, setAttachNotes] = useState('');
  const [attachLoading, setAttachLoading] = useState(false);

  // New Note State
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('Investigator');
  const [noteLoading, setNoteLoading] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCases(statusFilter ? { status: statusFilter } : {});
      setCases(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter]);

  const handleOpenCase = async (caseId) => {
    setDetailLoading(true);
    try {
      const detail = await getCaseDetail(caseId);
      setActiveCase(detail);
    } catch (err) {
      alert(`Failed to load case: ${extractErrorMessage(err)}`);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateCaseSubmit = async (e) => {
    e.preventDefault();
    if (!newCase.title.trim()) return;
    setCreateSubmitting(true);
    try {
      const created = await createCase(newCase);
      setCreateModalOpen(false);
      setNewCase({
        title: '',
        description: '',
        priority: 'MEDIUM',
        status: 'OPEN',
        assigned_to: 'Investigator'
      });
      await fetchCases();
      setActiveCase(created);
    } catch (err) {
      alert(`Error creating case: ${extractErrorMessage(err)}`);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!activeCase) return;
    try {
      const updated = await updateCase(activeCase.case_id, { status: newStatus });
      setActiveCase(updated);
      fetchCases();
    } catch (err) {
      alert(`Error updating case status: ${extractErrorMessage(err)}`);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    if (!activeCase) return;
    try {
      const updated = await updateCase(activeCase.case_id, { priority: newPriority });
      setActiveCase(updated);
      fetchCases();
    } catch (err) {
      alert(`Error updating priority: ${extractErrorMessage(err)}`);
    }
  };

  const handleDeleteCase = async (caseId) => {
    if (!window.confirm('Are you sure you want to delete this investigation case dossier?')) return;
    try {
      await deleteCase(caseId);
      if (activeCase?.case_id === caseId) setActiveCase(null);
      fetchCases();
    } catch (err) {
      alert(`Error deleting case: ${extractErrorMessage(err)}`);
    }
  };

  const handleAttachEntity = async (e) => {
    e.preventDefault();
    if (!attachInput.trim() || !activeCase) return;
    setAttachLoading(true);
    try {
      const updated = await attachCaseEntity(activeCase.case_id, {
        entity_id: attachInput.trim(),
        notes: attachNotes.trim()
      });
      setActiveCase(updated);
      setAttachInput('');
      setAttachNotes('');
      fetchCases();
    } catch (err) {
      alert(`Failed to attach entity: ${extractErrorMessage(err)}`);
    } finally {
      setAttachLoading(false);
    }
  };

  const handleRemoveEntity = async (entityId) => {
    if (!activeCase) return;
    try {
      const updated = await removeCaseEntity(activeCase.case_id, entityId);
      setActiveCase(updated);
      fetchCases();
    } catch (err) {
      alert(`Error removing entity: ${extractErrorMessage(err)}`);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !activeCase) return;
    setNoteLoading(true);
    try {
      const updated = await addCaseNote(activeCase.case_id, {
        content: newNoteContent.trim(),
        author: noteAuthor.trim() || 'Investigator'
      });
      setActiveCase(updated);
      setNewNoteContent('');
    } catch (err) {
      alert(`Error adding note: ${extractErrorMessage(err)}`);
    } finally {
      setNoteLoading(false);
    }
  };

  const handleExportDossier = async (format) => {
    if (!activeCase) return;
    try {
      const content = await exportCaseDossier(activeCase.case_id, format);
      const mime = format === 'csv' ? 'text/csv' : 'text/markdown';
      const ext = format === 'csv' ? 'csv' : 'md';
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Case_Dossier_${activeCase.case_id.slice(0, 8)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${extractErrorMessage(err)}`);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Briefcase size={18} style={{ color: 'var(--primary-accent)' }} />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ScamTrace Intelligence Workspace
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Investigation Case Management
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Structured workspace for threat analysts to correlate suspect entities, log chronological forensic notes, and export actionable dossiers.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn btn-primary"
          style={{ padding: '10px 18px' }}
        >
          <Plus size={16} /> Open New Case
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '8px' }}>Filter Status:</span>
        {['', 'OPEN', 'UNDER_INVESTIGATION', 'ESCALATED', 'RESOLVED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className="btn btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              backgroundColor: statusFilter === st ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              borderColor: statusFilter === st ? 'var(--primary-accent)' : 'var(--border-color)',
              color: statusFilter === st ? 'var(--primary-accent)' : 'var(--text-secondary)',
            }}
          >
            {st ? st.replace(/_/g, ' ') : 'All Cases'}
          </button>
        ))}
      </div>

      {/* Main Grid: Cases List + Active Case Drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: activeCase ? '1fr 1.25fr' : '1fr', gap: '24px' }}>
        {/* Left Column: Cases List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <LoadingState message="Fetching investigation cases..." />
          ) : error ? (
            <ErrorState title="Error Loading Cases" message={error} onRetry={fetchCases} />
          ) : cases.length === 0 ? (
            <div
              className="cyber-card"
              style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}
            >
              <Briefcase size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                No investigation cases found
              </div>
              <p style={{ fontSize: '13px', marginTop: '6px' }}>
                Open an investigation case to organize and track connected threat entities.
              </p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="btn btn-primary"
                style={{ marginTop: '16px', fontSize: '13px' }}
              >
                <Plus size={14} /> Open First Case
              </button>
            </div>
          ) : (
            cases.map((c) => {
              const isSelected = activeCase?.case_id === c.case_id;
              return (
                <div
                  key={c.case_id}
                  onClick={() => handleOpenCase(c.case_id)}
                  className={`cyber-card ${isSelected ? 'cyber-card-glow' : ''}`}
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--primary-accent)' : 'var(--border-color)',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.04)' : 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <span
                        className={`badge badge-${c.priority.toLowerCase()}`}
                        style={{ fontSize: '10px', marginBottom: '6px' }}
                      >
                        {c.priority} Priority
                      </span>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {c.title}
                      </h3>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#0D1527',
                        border: '1px solid var(--border-color)',
                        color: c.status === 'ESCALATED' ? 'var(--accent-critical)' : 'var(--text-secondary)',
                      }}
                    >
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {c.description && (
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                      {c.description.length > 140 ? `${c.description.slice(0, 140)}...` : c.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <span><strong>{c.entity_count}</strong> Entities</span>
                      <span><strong>{c.note_count}</strong> Notes</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={12} />
                      <span>{c.assigned_to || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Case Workspace */}
        {activeCase && (
          <div
            className="cyber-card"
            style={{
              borderColor: 'var(--primary-accent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              height: 'fit-content',
            }}
          >
            {/* Header / Actions */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className={`badge badge-${activeCase.priority.toLowerCase()}`}>
                    {activeCase.priority}
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    ID: {activeCase.case_id.slice(0, 8)}
                  </span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeCase.title}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Lead: <strong>{activeCase.assigned_to}</strong> • Opened: {new Date(activeCase.created_at).toLocaleDateString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleExportDossier('markdown')}
                  className="btn btn-secondary"
                  title="Export Markdown Dossier"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                >
                  <Download size={14} /> MD
                </button>
                <button
                  onClick={() => handleExportDossier('csv')}
                  className="btn btn-secondary"
                  title="Export CSV Dossier"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                >
                  <Download size={14} /> CSV
                </button>
                <button
                  onClick={() => handleDeleteCase(activeCase.case_id)}
                  className="btn btn-danger"
                  title="Delete Case"
                  style={{ padding: '6px 10px' }}
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setActiveCase(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Status / Priority Controls */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', backgroundColor: '#0D1527', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status:</span>
                <select
                  value={activeCase.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{
                    backgroundColor: '#111827',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11.5px',
                  }}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="UNDER_INVESTIGATION">UNDER INVESTIGATION</option>
                  <option value="ESCALATED">ESCALATED</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Priority:</span>
                <select
                  value={activeCase.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  style={{
                    backgroundColor: '#111827',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11.5px',
                  }}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            {/* Attached Suspect Entities Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-accent)', textTransform: 'uppercase' }}>
                  Attached Threat Entities ({activeCase.entities.length})
                </h4>
              </div>

              {activeCase.entities.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px', backgroundColor: '#0D1527', borderRadius: '6px', textAlign: 'center' }}>
                  No suspect entities attached to this case yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeCase.entities.map((ent) => (
                    <div
                      key={ent.id}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#0D1527',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                            {ent.entity_identifier}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({ent.entity_type})</span>
                          <RiskBadge level={ent.risk_level || 'MEDIUM'} score={ent.risk_score} size="small" />
                        </div>
                        {ent.notes && (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {ent.notes}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => navigate(`/trace/investigate/${encodeURIComponent(ent.entity_id)}`)}
                          className="btn btn-secondary"
                          title="Investigate in ScamTrace"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          <ExternalLink size={12} />
                        </button>
                        <button
                          onClick={() => handleRemoveEntity(ent.entity_id)}
                          className="btn btn-secondary"
                          title="Detach Entity"
                          style={{ padding: '4px 8px', color: 'var(--accent-critical)', fontSize: '11px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Attach Entity Form */}
              <form onSubmit={handleAttachEntity} style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Suspect Phone / URL / Bank ID / Entity ID..."
                  value={attachInput}
                  onChange={(e) => setAttachInput(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '12px', padding: '6px 10px', flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={attachLoading || !attachInput.trim()}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <Plus size={14} /> Attach
                </button>
              </form>
            </div>

            {/* Investigation Notes Thread */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Investigation Notes & Hypotheses ({activeCase.notes.length})
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto', marginBottom: '12px' }}>
                {activeCase.notes.map((n) => (
                  <div
                    key={n.note_id}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#111827',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--primary-accent)' }}>{n.author}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Add investigative lead, hypothesis, or note..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '12px', padding: '6px 10px', flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={noteLoading || !newNoteContent.trim()}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  Add Note
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Investigation Case */}
      {createModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="cyber-card"
            style={{ width: '100%', maxWidth: '540px', backgroundColor: '#0B1020', border: '1px solid var(--primary-accent)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={18} style={{ color: 'var(--primary-accent)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Open New Investigation Case
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCaseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">CASE TITLE / SYNDICATE NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operation Fake Electricity Bill Ring"
                  value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">OVERVIEW / HYPOTHESIS</label>
                <textarea
                  rows={3}
                  placeholder="Describe observed attack vectors, target demographics, and initial indicators..."
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">INITIAL PRIORITY</label>
                  <select
                    value={newCase.priority}
                    onChange={(e) => setNewCase({ ...newCase, priority: e.target.value })}
                    className="form-input"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">LEAD INVESTIGATOR</label>
                  <input
                    type="text"
                    value={newCase.assigned_to}
                    onChange={(e) => setNewCase({ ...newCase, assigned_to: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="btn btn-primary"
                >
                  {createSubmitting ? 'Creating Case...' : 'Create Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseManagement;
