import React, { useState } from 'react';
import AIReport from '../components/AIReport';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const songExamples = [
  { label: 'City nights', theme: 'Finding a way home after a late shift in a changing city', genre: 'Electronic', mood: 'Hopeful', tempo: 108 },
  { label: 'Summer reunion', theme: 'Two old friends reconnect at a summer gathering', genre: 'Pop', mood: 'Uplifting', tempo: 122 },
  { label: 'Quiet resolve', theme: 'Starting over after a difficult year with patience and resolve', genre: 'Folk', mood: 'Peaceful', tempo: 84 },
];

export default function SongPipeline({ token }) {
  const [form, setForm] = useState({ theme: '', genre: 'Pop', mood: 'Uplifting', tempo: 120 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.theme.trim()) { setError('Theme is required'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    setStep('Generating lyrics concept...');
    try {
      const res = await fetch(`${API}/api/ai/create-song-pipeline`, {
        method: 'POST', headers, body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.pipeline);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStep('');
    }
  };

  const genres = ['Pop', 'Rock', 'R&B', 'Hip-Hop', 'Electronic', 'Jazz', 'Country', 'Indie', 'Classical', 'Folk'];
  const moods = ['Uplifting', 'Melancholic', 'Energetic', 'Peaceful', 'Romantic', 'Mysterious', 'Dark', 'Hopeful'];

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div className="feature-header-left">
          <span className="feature-header-icon">🎼</span>
          <div>
            <h1 className="feature-title">Song Pipeline</h1>
            <div className="feature-count">Full AI-powered song creation in 4 steps</div>
          </div>
        </div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(108,92,231,0.2)',
        borderRadius: 16,
        padding: 28,
        marginBottom: 24
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {songExamples.map(({ label, ...values }) => <button key={label} type="button" className="btn-secondary" disabled={loading} onClick={() => { setForm(values); setError(''); }}>{label}</button>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Song Theme / Concept *</label>
              <input
                className="form-input"
                type="text"
                value={form.theme}
                onChange={e => handleChange('theme', e.target.value)}
                placeholder="e.g. Overcoming adversity, A summer romance, Lost in the city..."
                required
              />
            </div>
            <div>
              <label className="form-label">Genre</label>
              <select className="form-select" value={form.genre} onChange={e => handleChange('genre', e.target.value)}>
                {genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Mood</label>
              <select className="form-select" value={form.mood} onChange={e => handleChange('mood', e.target.value)}>
                {moods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Tempo (BPM)</label>
              <input
                className="form-input"
                type="number"
                min={60} max={200}
                value={form.tempo}
                onChange={e => handleChange('tempo', e.target.value)}
              />
            </div>
          </div>
          {error && <div style={{ color: '#e74c3c', marginBottom: 12, fontSize: 14 }}>{error}</div>}
          <button type="submit" className="btn-ai" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? (
              <><div className="ai-loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> {step || 'Creating your song...'}</>
            ) : (
              <><span>✨</span> Create Full Song</>
            )}
          </button>
        </form>
      </div>

      {result && <AIReport response={result} title="Your Song Blueprint" />}
    </div>
  );
}
