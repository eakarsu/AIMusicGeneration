import React, { useState } from 'react';

const API = 'http://localhost:3001';

function Section({ title, content, icon }) {
  const [open, setOpen] = useState(true);
  if (!content) return null;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(108,92,231,0.2)',
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden'
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#fff', fontSize: 16, fontWeight: 600
        }}
      >
        <span>{icon} {title}</span>
        <span style={{ color: '#a29bfe', fontSize: 18 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 20px 20px', color: '#ccc', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: 14 }}>
          {content}
        </div>
      )}
    </div>
  );
}

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

      {result && (
        <div>
          <h2 style={{ color: '#a29bfe', marginBottom: 16, fontSize: 18 }}>Your Song Blueprint</h2>
          <Section title="Lyrics Concept" content={result.lyrics_concept} icon="✍️" />
          <Section title="Chord Progression" content={result.chord_progression} icon="🎹" />
          <Section title="Melody Description" content={result.melody_description} icon="🎵" />
          <Section title="Arrangement & Production" content={result.arrangement_notes} icon="🎛️" />
          <div style={{
            background: 'rgba(108,92,231,0.05)',
            border: '1px solid rgba(108,92,231,0.3)',
            borderRadius: 12,
            padding: 20,
            marginTop: 8
          }}>
            <h3 style={{ color: '#a29bfe', marginBottom: 12, fontSize: 16 }}>Complete Song Brief</h3>
            <pre style={{ color: '#ccc', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {result.complete_song_brief}
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(result.complete_song_brief)}
              style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(108,92,231,0.3)', background: 'rgba(108,92,231,0.1)', color: '#a29bfe', cursor: 'pointer', fontSize: 13 }}
            >
              Copy Brief
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
