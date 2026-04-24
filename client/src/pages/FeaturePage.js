import React, { useState, useEffect, useCallback } from 'react';

function FeaturePage({ feature, fields, token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState(null);
  const [saving, setSaving] = useState(false);

  const API = `http://localhost:3001${feature.apiPath}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { headers });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchItems();
    setShowDetail(false);
    setShowForm(false);
    setAiOutput(null);
  }, [feature.key]);

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
    setShowForm(false);
    setAiOutput(item.ai_output ? { success: true, result: item.ai_output, model: 'cached' } : null);
  };

  const handleNew = () => {
    const empty = {};
    fields.forEach(f => {
      if (f.type === 'checkbox') empty[f.name] = true;
      else if (f.type === 'number') empty[f.name] = '';
      else empty[f.name] = '';
    });
    setFormData(empty);
    setEditMode(false);
    setShowForm(true);
    setShowDetail(false);
    setAiOutput(null);
  };

  const handleEdit = () => {
    const data = {};
    fields.forEach(f => {
      data[f.name] = selectedItem[f.name] ?? '';
    });
    setFormData(data);
    setEditMode(true);
    setShowForm(true);
    setShowDetail(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${selectedItem.title}"?`)) return;
    try {
      await fetch(`${API}/${selectedItem.id}`, { method: 'DELETE', headers });
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editMode ? 'PUT' : 'POST';
      const url = editMode ? `${API}/${selectedItem.id}` : API;
      const body = { ...formData };

      // Convert number fields
      fields.forEach(f => {
        if (f.type === 'number' && body[f.name] !== '') {
          body[f.name] = Number(body[f.name]);
        }
      });

      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowForm(false);
      fetchItems();

      if (editMode) {
        setSelectedItem(data);
        setShowDetail(true);
      }
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);
    setAiOutput(null);
    try {
      const bodyData = showForm ? formData : (selectedItem || {});
      const res = await fetch(`${API}/ai/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyData),
      });
      const data = await res.json();
      setAiOutput(data);
    } catch (err) {
      setAiOutput({ success: false, error: err.message });
    } finally {
      setAiLoading(false);
    }
  };

  const handleFormChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatAiContent = (text) => {
    if (!text) return '';
    // Convert markdown-like formatting to styled HTML
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gm, '<h3 style="color:#a29bfe;margin:16px 0 8px;font-size:16px;">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 style="color:#a29bfe;margin:20px 0 10px;font-size:18px;">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 style="color:#fff;margin:24px 0 12px;font-size:22px;">$1</h1>')
      .replace(/^- (.*$)/gm, '<div style="padding:2px 0 2px 16px;border-left:2px solid rgba(108,92,231,0.3);">$1</div>')
      .replace(/^\d+\. (.*$)/gm, '<div style="padding:2px 0 2px 16px;color:#d0d0d0;">$&</div>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(108,92,231,0.15);padding:2px 8px;border-radius:4px;font-size:13px;color:#a29bfe;">$1</code>')
      .replace(/\|(.*?)\|/g, '<span style="background:rgba(255,255,255,0.04);padding:4px 8px;border-radius:4px;font-family:monospace;">|$1|</span>')
      .replace(/\n/g, '<br/>');
  };

  const getDisplayColumns = () => {
    const always = ['title'];
    const extra = fields
      .filter(f => !['description', 'status', 'title'].includes(f.name) && f.type !== 'textarea' && f.type !== 'checkbox')
      .slice(0, 3)
      .map(f => f.name);
    return [...always, ...extra, 'status'];
  };

  const displayCols = getDisplayColumns();

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div className="feature-header-left">
          <span className="feature-header-icon">{feature.icon}</span>
          <div>
            <h1 className="feature-title">{feature.label}</h1>
            <div className="feature-count">{items.length} items</div>
          </div>
        </div>
        <button className="btn-new" onClick={handleNew}>
          + New {feature.label.replace(/s$/, '').replace(/ies$/, 'y')}
        </button>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="empty-state">
          <div className="ai-loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <div className="empty-state-text">Loading...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="data-table-container">
          <div className="empty-state">
            <div className="empty-state-icon">{feature.icon}</div>
            <div className="empty-state-text">No items yet</div>
            <div className="empty-state-sub">Click "New" to create your first item</div>
          </div>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                {displayCols.map(col => (
                  <th key={col}>{col.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => handleRowClick(item)}>
                  {displayCols.map(col => (
                    <td key={col}>
                      {col === 'status' ? (
                        <span className={`status-badge status-${item[col]}`}>
                          {item[col]}
                        </span>
                      ) : col === 'title' ? (
                        <span style={{ fontWeight: 600, color: '#fff' }}>{item[col]}</span>
                      ) : (
                        <span>{String(item[col] ?? '—')}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedItem && (
        <div className="modal-overlay" onClick={() => { setShowDetail(false); setAiOutput(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{feature.icon} {selectedItem.title}</h2>
              <button className="modal-close" onClick={() => { setShowDetail(false); setAiOutput(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {fields.filter(f => f.name !== 'title').map(f => {
                  const val = selectedItem[f.name];
                  if (val === null || val === undefined || val === '') return null;
                  const isLong = f.type === 'textarea' || String(val).length > 60;
                  return (
                    <div key={f.name} className={`detail-item ${isLong ? 'full-width' : ''}`}>
                      <div className="detail-label">{f.label}</div>
                      <div className="detail-value">
                        {f.type === 'checkbox' ? (val ? 'Yes' : 'No') :
                         f.name === 'status' ? (
                           <span className={`status-badge status-${val}`}>{val}</span>
                         ) : String(val)}
                      </div>
                    </div>
                  );
                }).filter(Boolean)}
              </div>

              {/* AI Generate Button */}
              <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                <button className="btn-ai" onClick={handleAiGenerate} disabled={aiLoading}>
                  {aiLoading ? (
                    <><div className="ai-loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> Generating...</>
                  ) : (
                    <><span>✨</span> Generate with AI</>
                  )}
                </button>
              </div>

              {/* AI Output */}
              {aiLoading && (
                <div className="ai-output-container" style={{ marginTop: 20 }}>
                  <div className="ai-loading">
                    <div className="ai-loading-spinner"></div>
                    AI is composing your response...
                  </div>
                </div>
              )}

              {aiOutput && !aiLoading && (
                <div className="ai-output-container" style={{ marginTop: 20 }}>
                  <div className="ai-output-header">
                    <span className="ai-output-badge">AI GENERATED</span>
                    <span className="ai-output-model">
                      {aiOutput.model || 'OpenRouter'} {aiOutput.mock ? '(Demo Mode)' : ''}
                    </span>
                    {aiOutput.success === false && (
                      <span style={{ color: '#e74c3c', fontSize: 12 }}>⚠ {aiOutput.error}</span>
                    )}
                  </div>
                  <div className="ai-output-body">
                    <div
                      className="ai-output-content"
                      dangerouslySetInnerHTML={{ __html: formatAiContent(aiOutput.result || aiOutput.error || 'No response') }}
                    />
                  </div>
                  {aiOutput.usage && (
                    <div className="ai-output-meta">
                      <span>Prompt tokens: {aiOutput.usage.prompt_tokens}</span>
                      <span>Completion tokens: {aiOutput.usage.completion_tokens}</span>
                      <span>ID: {aiOutput.id}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
              <button className="btn-secondary" onClick={handleEdit}>Edit</button>
              <button className="btn-secondary" onClick={() => { setShowDetail(false); setAiOutput(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editMode ? 'Edit' : 'New'} {feature.label.replace(/s$/, '').replace(/ies$/, 'y')}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  {fields.map(f => (
                    <div key={f.name} className={`form-group ${f.type === 'textarea' ? 'full-width' : ''}`}>
                      <label className="form-label">{f.label}</label>
                      {f.type === 'textarea' ? (
                        <textarea
                          className="form-textarea"
                          value={formData[f.name] || ''}
                          onChange={e => handleFormChange(f.name, e.target.value)}
                          rows={3}
                        />
                      ) : f.type === 'select' ? (
                        <select
                          className="form-select"
                          value={formData[f.name] || f.options?.[0] || ''}
                          onChange={e => handleFormChange(f.name, e.target.value)}
                        >
                          {f.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : f.type === 'checkbox' ? (
                        <label className="form-checkbox">
                          <input
                            type="checkbox"
                            checked={!!formData[f.name]}
                            onChange={e => handleFormChange(f.name, e.target.checked)}
                          />
                          <span>{formData[f.name] ? 'Yes' : 'No'}</span>
                        </label>
                      ) : (
                        <input
                          className="form-input"
                          type={f.type}
                          value={formData[f.name] ?? ''}
                          onChange={e => handleFormChange(f.name, e.target.value)}
                          required={f.required}
                          placeholder={`Enter ${f.label.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* AI Generate in Form */}
                <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                  <button type="button" className="btn-ai" onClick={handleAiGenerate} disabled={aiLoading}>
                    {aiLoading ? (
                      <><div className="ai-loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> Generating...</>
                    ) : (
                      <><span>✨</span> Generate with AI</>
                    )}
                  </button>
                </div>

                {aiLoading && (
                  <div className="ai-output-container" style={{ marginTop: 20 }}>
                    <div className="ai-loading">
                      <div className="ai-loading-spinner"></div>
                      AI is composing your response...
                    </div>
                  </div>
                )}

                {aiOutput && !aiLoading && (
                  <div className="ai-output-container" style={{ marginTop: 20 }}>
                    <div className="ai-output-header">
                      <span className="ai-output-badge">AI GENERATED</span>
                      <span className="ai-output-model">
                        {aiOutput.model || 'OpenRouter'} {aiOutput.mock ? '(Demo Mode)' : ''}
                      </span>
                    </div>
                    <div className="ai-output-body">
                      <div
                        className="ai-output-content"
                        dangerouslySetInnerHTML={{ __html: formatAiContent(aiOutput.result || aiOutput.error || 'No response') }}
                      />
                    </div>
                    {aiOutput.usage && (
                      <div className="ai-output-meta">
                        <span>Prompt tokens: {aiOutput.usage.prompt_tokens}</span>
                        <span>Completion tokens: {aiOutput.usage.completion_tokens}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '12px 32px' }} disabled={saving}>
                  {saving ? 'Saving...' : editMode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeaturePage;
