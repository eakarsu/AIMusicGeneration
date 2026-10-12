
import FullAIExamples, { useFullAIExamples } from "../components/FullAIExamples.jsx";
import AIReport from '../components/AIReport';
import React, { useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const TABS = [
  { key: 'beat', label: 'Beat', icon: '🥁', endpoint: '/api/ai/generate-beat' },
  { key: 'chords', label: 'Chord Progression', icon: '🎹', endpoint: '/api/ai/generate-chord-progression' },
  { key: 'lyrics', label: 'Lyrics', icon: '✍️', endpoint: '/api/ai/generate-lyrics' },
  { key: 'melody', label: 'Melody', icon: '🎵', endpoint: '/api/ai/generate-melody' },
  { key: 'remix', label: 'Remix Idea', icon: '🔄', endpoint: '/api/ai/remix-suggestion' },
  { key: 'theory', label: 'Theory Advisor', icon: '🎓', endpoint: '/api/ai/music-theory-advisor' },
  { key: 'daw', label: 'DAW Arrangement', icon: '🎛️', endpoint: '/api/ai/daw-arrange' },
  { key: 'royalty', label: 'Royalty Splits', icon: '💰', endpoint: '/api/ai/royalty-split-suggest' },
  { key: 'distribute', label: 'Distribution Checklist', icon: '📦', endpoint: '/api/ai/distribution-checklist' },
];

export default function AIGenerators({ token }) {
  const fullAIExamples = useFullAIExamples();

  const [tab, setTab] = useState('beat');
  const [form, setForm] = useState({
    genre: 'pop', bpm: 120, complexity: 'medium', style: '',
    key: 'C major', mood: 'uplifting', length: 8,
    theme: '', structure: 'verse-chorus-verse-chorus-bridge-chorus', tone: 'sincere',
    scale: 'natural minor', tempo: 110, range_low: 'A3', range_high: 'E5',
    original_track: '', original_genre: '', target_style: 'lo-fi', target_bpm: 90, target_key: 'unchanged', vibe: 'chill',
    question: '', mode: '', context: 'general', level: 'intermediate',
    daw: 'Logic Pro', song_idea: '', duration_minutes: 3,
    contributors_json: JSON.stringify([
      { name: 'Alice', role: 'songwriter+vocalist', contribution: 'wrote lyrics + topline melody' },
      { name: 'Bob', role: 'producer', contribution: 'beat + mix' },
    ], null, 2),
    song_title: '', work_type: 'songwriting + master recording',
    artist_name: '', release_date: '', platforms: 'Spotify, Apple Music, YouTube Music',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const switchTab = (k) => { setTab(k); setResult(null); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);

    let body = {};
    let endpoint = '';
    if (tab === 'beat') {
      body = { genre: form.genre, bpm: parseInt(form.bpm), complexity: form.complexity, style: form.style };
      endpoint = '/api/ai/generate-beat';
    } else if (tab === 'chords') {
      body = { key: form.key, genre: form.genre, mood: form.mood, length: parseInt(form.length) };
      endpoint = '/api/ai/generate-chord-progression';
    } else if (tab === 'lyrics') {
      if (!form.theme.trim()) { setError('Theme is required'); setLoading(false); return; }
      body = { theme: form.theme, genre: form.genre, mood: form.mood, structure: form.structure, tone: form.tone };
      endpoint = '/api/ai/generate-lyrics';
    } else if (tab === 'melody') {
      body = { key: form.key, scale: form.scale, tempo: parseInt(form.tempo), genre: form.genre, mood: form.mood, range_low: form.range_low, range_high: form.range_high, length: parseInt(form.length) };
      endpoint = '/api/ai/generate-melody';
    } else if (tab === 'remix') {
      if (!form.original_track.trim()) { setError('Original track is required'); setLoading(false); return; }
      body = { original_track: form.original_track, original_genre: form.original_genre, target_style: form.target_style, target_bpm: parseInt(form.target_bpm), target_key: form.target_key, vibe: form.vibe };
      endpoint = '/api/ai/remix-suggestion';
    } else if (tab === 'theory') {
      if (!form.question.trim()) { setError('Question is required'); setLoading(false); return; }
      body = { question: form.question, key: form.key, mode: form.mode, context: form.context, level: form.level };
      endpoint = '/api/ai/music-theory-advisor';
    } else if (tab === 'daw') {
      body = { genre: form.genre, song_idea: form.song_idea, daw: form.daw, tempo: parseInt(form.tempo) || 100, key: form.key, duration_minutes: parseInt(form.duration_minutes) || 3 };
      endpoint = '/api/ai/daw-arrange';
    } else if (tab === 'royalty') {
      let contribs;
      try { contribs = JSON.parse(form.contributors_json); }
      catch (e) { setError('Contributors must be valid JSON array'); setLoading(false); return; }
      body = { contributors: contribs, song_title: form.song_title, work_type: form.work_type };
      endpoint = '/api/ai/royalty-split-suggest';
    } else if (tab === 'distribute') {
      const platformList = (form.platforms || '').split(',').map(s => s.trim()).filter(Boolean);
      body = { song_title: form.song_title, artist_name: form.artist_name, genre: form.genre, release_date: form.release_date, platforms: platformList };
      endpoint = '/api/ai/distribution-checklist';
    }

    try {
      const res = await fetch(`${API}${endpoint}`, { method: 'POST', headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.status === 503) {
        setError(data.error || 'AI not configured: backend missing OPENROUTER_API_KEY.');
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const genres = ['Pop', 'Rock', 'R&B', 'Hip-Hop', 'Electronic', 'Jazz', 'Country', 'Indie', 'Classical', 'Folk'];
  const moods = ['Uplifting', 'Melancholic', 'Energetic', 'Peaceful', 'Romantic', 'Mysterious', 'Dark', 'Hopeful'];

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div className="feature-header-left">
          <span className="feature-header-icon">🎚️</span>
          <div>
            <h1 className="feature-title">AI Generators</h1>
            <div className="feature-count">Beat, chord, and lyric generation tools</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(108,92,231,0.3)',
              background: tab === t.key ? 'rgba(108,92,231,0.3)' : 'rgba(255,255,255,0.03)',
              color: tab === t.key ? '#fff' : '#a29bfe', cursor: 'pointer', fontSize: 14 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 16, padding: 28, marginBottom: 24 }}>
        <form onSubmit={handleSubmit} data-full-ai-workspace="AIGenerators"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
          {tab === 'beat' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Genre</label>
                <select className="form-select" value={form.genre} onChange={e => handle('genre', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.genre, change: e => handle('genre', e.target.value), label: "form.genre", manual: false, json: false, sample: 'pop' }, "p1-14259", undefined)}>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">BPM</label>
                <input className="form-input" type="number" min={60} max={200} value={form.bpm} onChange={e => handle('bpm', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.bpm, change: e => handle('bpm', e.target.value), label: "form.bpm", manual: false, json: false, sample: 120 }, "p1-14576", undefined)} />
              </div>
              <div>
                <label className="form-label">Complexity</label>
                <select className="form-select" value={form.complexity} onChange={e => handle('complexity', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.complexity, change: e => handle('complexity', e.target.value), label: "form.complexity", manual: false, json: false, sample: 'medium' }, "p1-14827", undefined)}>
                  <option value="simple">Simple</option><option value="medium">Medium</option><option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="form-label">Style notes</label>
                <input className="form-input" type="text" value={form.style} onChange={e => handle('style', e.target.value)} placeholder="e.g. trap, breakbeat" data-full-ai-field={fullAIExamples.bind({ current: form.style, change: e => handle('style', e.target.value), label: "form.style", manual: false, json: false, sample: '' }, "p1-15223", undefined)} />
              </div>
            </div>
          )}
          {tab === 'chords' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Key</label>
                <input className="form-input" type="text" value={form.key} onChange={e => handle('key', e.target.value)} placeholder="C major" data-full-ai-field={fullAIExamples.bind({ current: form.key, change: e => handle('key', e.target.value), label: "form.key", manual: false, json: false, sample: 'C major' }, "p1-15637", undefined)} />
              </div>
              <div>
                <label className="form-label">Genre</label>
                <select className="form-select" value={form.genre} onChange={e => handle('genre', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.genre, change: e => handle('genre', e.target.value), label: "form.genre", manual: false, json: false, sample: 'pop' }, "p1-15884", undefined)}>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Mood</label>
                <select className="form-select" value={form.mood} onChange={e => handle('mood', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.mood, change: e => handle('mood', e.target.value), label: "form.mood", manual: false, json: false, sample: 'uplifting' }, "p1-16202", undefined)}>
                  {moods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Bars</label>
                <input className="form-input" type="number" min={2} max={32} value={form.length} onChange={e => handle('length', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.length, change: e => handle('length', e.target.value), label: "form.length", manual: false, json: false, sample: 8 }, "p1-16517", undefined)} />
              </div>
            </div>
          )}
          {tab === 'lyrics' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Theme *</label>
                <input className="form-input" type="text" value={form.theme} onChange={e => handle('theme', e.target.value)} placeholder="e.g. summer love, perseverance" data-full-ai-field={fullAIExamples.bind({ current: form.theme, change: e => handle('theme', e.target.value), label: "form.theme", manual: false, json: false, sample: '' }, "p1-16954", undefined)} />
              </div>
              <div>
                <label className="form-label">Genre</label>
                <select className="form-select" value={form.genre} onChange={e => handle('genre', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.genre, change: e => handle('genre', e.target.value), label: "form.genre", manual: false, json: false, sample: 'pop' }, "p1-17228", undefined)}>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Mood</label>
                <select className="form-select" value={form.mood} onChange={e => handle('mood', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.mood, change: e => handle('mood', e.target.value), label: "form.mood", manual: false, json: false, sample: 'uplifting' }, "p1-17546", undefined)}>
                  {moods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Structure</label>
                <input className="form-input" type="text" value={form.structure} onChange={e => handle('structure', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.structure, change: e => handle('structure', e.target.value), label: "form.structure", manual: false, json: false, sample: 'verse-chorus-verse-chorus-bridge-chorus' }, "p1-17899", undefined)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Tone</label>
                <input className="form-input" type="text" value={form.tone} onChange={e => handle('tone', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.tone, change: e => handle('tone', e.target.value), label: "form.tone", manual: false, json: false, sample: 'sincere' }, "p1-18168", undefined)} />
              </div>
            </div>
          )}
          {tab === 'melody' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Key</label>
                <input className="form-input" type="text" value={form.key} onChange={e => handle('key', e.target.value)} placeholder="A minor" data-full-ai-field={fullAIExamples.bind({ current: form.key, change: e => handle('key', e.target.value), label: "form.key", manual: false, json: false, sample: 'C major' }, "p1-18545", undefined)} />
              </div>
              <div>
                <label className="form-label">Scale</label>
                <input className="form-input" type="text" value={form.scale} onChange={e => handle('scale', e.target.value)} placeholder="natural minor" data-full-ai-field={fullAIExamples.bind({ current: form.scale, change: e => handle('scale', e.target.value), label: "form.scale", manual: false, json: false, sample: 'natural minor' }, "p1-18792", undefined)} />
              </div>
              <div>
                <label className="form-label">Tempo (BPM)</label>
                <input className="form-input" type="number" min={40} max={240} value={form.tempo} onChange={e => handle('tempo', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.tempo, change: e => handle('tempo', e.target.value), label: "form.tempo", manual: false, json: false, sample: 110 }, "p1-19055", undefined)} />
              </div>
              <div>
                <label className="form-label">Bars</label>
                <input className="form-input" type="number" min={2} max={32} value={form.length} onChange={e => handle('length', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.length, change: e => handle('length', e.target.value), label: "form.length", manual: false, json: false, sample: 8 }, "p1-19304", undefined)} />
              </div>
              <div>
                <label className="form-label">Range Low</label>
                <input className="form-input" type="text" value={form.range_low} onChange={e => handle('range_low', e.target.value)} placeholder="A3" data-full-ai-field={fullAIExamples.bind({ current: form.range_low, change: e => handle('range_low', e.target.value), label: "form.range_low", manual: false, json: false, sample: 'A3' }, "p1-19558", undefined)} />
              </div>
              <div>
                <label className="form-label">Range High</label>
                <input className="form-input" type="text" value={form.range_high} onChange={e => handle('range_high', e.target.value)} placeholder="E5" data-full-ai-field={fullAIExamples.bind({ current: form.range_high, change: e => handle('range_high', e.target.value), label: "form.range_high", manual: false, json: false, sample: 'E5' }, "p1-19817", undefined)} />
              </div>
              <div>
                <label className="form-label">Genre</label>
                <select className="form-select" value={form.genre} onChange={e => handle('genre', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.genre, change: e => handle('genre', e.target.value), label: "form.genre", manual: false, json: false, sample: 'pop' }, "p1-20073", undefined)}>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Mood</label>
                <select className="form-select" value={form.mood} onChange={e => handle('mood', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.mood, change: e => handle('mood', e.target.value), label: "form.mood", manual: false, json: false, sample: 'uplifting' }, "p1-20391", undefined)}>
                  {moods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          )}
          {tab === 'remix' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Original Track *</label>
                <input className="form-input" type="text" value={form.original_track} onChange={e => handle('original_track', e.target.value)} placeholder="e.g. Daft Punk - Around the World" data-full-ai-field={fullAIExamples.bind({ current: form.original_track, change: e => handle('original_track', e.target.value), label: "form.original_track", manual: false, json: false, sample: '' }, "p1-20902", undefined)} />
              </div>
              <div>
                <label className="form-label">Original Genre</label>
                <input className="form-input" type="text" value={form.original_genre} onChange={e => handle('original_genre', e.target.value)} placeholder="house" data-full-ai-field={fullAIExamples.bind({ current: form.original_genre, change: e => handle('original_genre', e.target.value), label: "form.original_genre", manual: false, json: false, sample: '' }, "p1-21206", undefined)} />
              </div>
              <div>
                <label className="form-label">Target Style</label>
                <input className="form-input" type="text" value={form.target_style} onChange={e => handle('target_style', e.target.value)} placeholder="lo-fi, dnb, trap" data-full-ai-field={fullAIExamples.bind({ current: form.target_style, change: e => handle('target_style', e.target.value), label: "form.target_style", manual: false, json: false, sample: 'lo-fi' }, "p1-21480", undefined)} />
              </div>
              <div>
                <label className="form-label">Target BPM</label>
                <input className="form-input" type="number" min={40} max={220} value={form.target_bpm} onChange={e => handle('target_bpm', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.target_bpm, change: e => handle('target_bpm', e.target.value), label: "form.target_bpm", manual: false, json: false, sample: 90 }, "p1-21759", undefined)} />
              </div>
              <div>
                <label className="form-label">Target Key</label>
                <input className="form-input" type="text" value={form.target_key} onChange={e => handle('target_key', e.target.value)} placeholder="unchanged or e.g. C minor" data-full-ai-field={fullAIExamples.bind({ current: form.target_key, change: e => handle('target_key', e.target.value), label: "form.target_key", manual: false, json: false, sample: 'unchanged' }, "p1-22024", undefined)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Vibe</label>
                <input className="form-input" type="text" value={form.vibe} onChange={e => handle('vibe', e.target.value)} placeholder="chill, aggressive, nostalgic" data-full-ai-field={fullAIExamples.bind({ current: form.vibe, change: e => handle('vibe', e.target.value), label: "form.vibe", manual: false, json: false, sample: 'chill' }, "p1-22335", undefined)} />
              </div>
            </div>
          )}
          {tab === 'theory' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Question *</label>
                <textarea className="form-input" rows={3} value={form.question} onChange={e => handle('question', e.target.value)} placeholder="e.g. How do I modulate from C major to E minor?" data-full-ai-field={fullAIExamples.bind({ current: form.question, change: e => handle('question', e.target.value), label: "form.question", manual: false, json: false, sample: '' }, "p1-22795", undefined)} />
              </div>
              <div>
                <label className="form-label">Key</label>
                <input className="form-input" type="text" value={form.key} onChange={e => handle('key', e.target.value)} placeholder="C major" data-full-ai-field={fullAIExamples.bind({ current: form.key, change: e => handle('key', e.target.value), label: "form.key", manual: false, json: false, sample: 'C major' }, "p1-23090", undefined)} />
              </div>
              <div>
                <label className="form-label">Mode/Scale</label>
                <input className="form-input" type="text" value={form.mode} onChange={e => handle('mode', e.target.value)} placeholder="Dorian, Mixolydian" data-full-ai-field={fullAIExamples.bind({ current: form.mode, change: e => handle('mode', e.target.value), label: "form.mode", manual: false, json: false, sample: '' }, "p1-23342", undefined)} />
              </div>
              <div>
                <label className="form-label">Context</label>
                <input className="form-input" type="text" value={form.context} onChange={e => handle('context', e.target.value)} placeholder="jazz combo, film score" data-full-ai-field={fullAIExamples.bind({ current: form.context, change: e => handle('context', e.target.value), label: "form.context", manual: false, json: false, sample: 'general' }, "p1-23604", undefined)} />
              </div>
              <div>
                <label className="form-label">Level</label>
                <select className="form-select" value={form.level} onChange={e => handle('level', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.level, change: e => handle('level', e.target.value), label: "form.level", manual: false, json: false, sample: 'intermediate' }, "p1-23874", undefined)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          )}
          {tab === 'daw' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">DAW</label>
                <select className="form-select" value={form.daw} onChange={e => handle('daw', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.daw, change: e => handle('daw', e.target.value), label: "form.daw", manual: false, json: false, sample: 'Logic Pro' }, "p1-24455", undefined)}>
                  <option>Logic Pro</option><option>Ableton Live</option><option>FL Studio</option>
                  <option>Pro Tools</option><option>Reaper</option><option>Studio One</option><option>Cubase</option>
                </select>
              </div>
              <div>
                <label className="form-label">Genre</label>
                <select className="form-select" value={form.genre} onChange={e => handle('genre', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.genre, change: e => handle('genre', e.target.value), label: "form.genre", manual: false, json: false, sample: 'pop' }, "p1-24912", undefined)}>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Song Idea</label>
                <input className="form-input" type="text" value={form.song_idea} onChange={e => handle('song_idea', e.target.value)} placeholder="cinematic build with vocal hook" data-full-ai-field={fullAIExamples.bind({ current: form.song_idea, change: e => handle('song_idea', e.target.value), label: "form.song_idea", manual: false, json: false, sample: '' }, "p1-25268", undefined)} />
              </div>
              <div>
                <label className="form-label">Tempo (BPM)</label>
                <input className="form-input" type="number" value={form.tempo} onChange={e => handle('tempo', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.tempo, change: e => handle('tempo', e.target.value), label: "form.tempo", manual: false, json: false, sample: 110 }, "p1-25557", undefined)} />
              </div>
              <div>
                <label className="form-label">Key</label>
                <input className="form-input" type="text" value={form.key} onChange={e => handle('key', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.key, change: e => handle('key', e.target.value), label: "form.key", manual: false, json: false, sample: 'C major' }, "p1-25786", undefined)} />
              </div>
              <div>
                <label className="form-label">Duration (min)</label>
                <input className="form-input" type="number" min={1} max={20} value={form.duration_minutes} onChange={e => handle('duration_minutes', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.duration_minutes, change: e => handle('duration_minutes', e.target.value), label: "form.duration_minutes", manual: false, json: false, sample: 3 }, "p1-26020", undefined)} />
              </div>
            </div>
          )}
          {tab === 'royalty' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Song Title</label>
                <input className="form-input" type="text" value={form.song_title} onChange={e => handle('song_title', e.target.value)} placeholder="Midnight Drive" data-full-ai-field={fullAIExamples.bind({ current: form.song_title, change: e => handle('song_title', e.target.value), label: "form.song_title", manual: false, json: false, sample: '' }, "p1-26448", undefined)} />
              </div>
              <div>
                <label className="form-label">Work Type</label>
                <input className="form-input" type="text" value={form.work_type} onChange={e => handle('work_type', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.work_type, change: e => handle('work_type', e.target.value), label: "form.work_type", manual: false, json: false, sample: 'songwriting + master recording' }, "p1-26720", undefined)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Contributors (JSON array, max 20)</label>
                <textarea className="form-input" rows={8} value={form.contributors_json} onChange={e => handle('contributors_json', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.contributors_json, change: e => handle('contributors_json', e.target.value), label: "form.contributors_json", manual: false, json: true, sample: JSON.stringify([
      { name: 'Alice', role: 'songwriter+vocalist', contribution: 'wrote lyrics + topline melody' },
      { name: 'Bob', role: 'producer', contribution: 'beat + mix' },
    ], null, 2) }, "p1-27018", undefined)} />
              </div>
            </div>
          )}
          {tab === 'distribute' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Song Title</label>
                <input className="form-input" type="text" value={form.song_title} onChange={e => handle('song_title', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.song_title, change: e => handle('song_title', e.target.value), label: "form.song_title", manual: false, json: false, sample: '' }, "p1-27432", undefined)} />
              </div>
              <div>
                <label className="form-label">Artist Name</label>
                <input className="form-input" type="text" value={form.artist_name} onChange={e => handle('artist_name', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.artist_name, change: e => handle('artist_name', e.target.value), label: "form.artist_name", manual: false, json: false, sample: '' }, "p1-27677", undefined)} />
              </div>
              <div>
                <label className="form-label">Genre</label>
                <select className="form-select" value={form.genre} onChange={e => handle('genre', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.genre, change: e => handle('genre', e.target.value), label: "form.genre", manual: false, json: false, sample: 'pop' }, "p1-27918", undefined)}>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Release Date</label>
                <input className="form-input" type="date" value={form.release_date} onChange={e => handle('release_date', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.release_date, change: e => handle('release_date', e.target.value), label: "form.release_date", manual: false, json: false, sample: '' }, "p1-28244", undefined)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Platforms (comma-separated)</label>
                <input className="form-input" type="text" value={form.platforms} onChange={e => handle('platforms', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.platforms, change: e => handle('platforms', e.target.value), label: "form.platforms", manual: false, json: false, sample: 'Spotify, Apple Music, YouTube Music' }, "p1-28542", undefined)} />
              </div>
            </div>
          )}
          {error && <div style={{ color: '#e74c3c', marginTop: 12, fontSize: 14 }}>{error}</div>}
          <button type="submit" className="btn-ai" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            {loading ? 'Generating…' : <><span>✨</span> Generate</>}
          </button>
        </form>
      </div>

      {result && <AIReport response={result} title={`${TABS.find(item => item.key === tab)?.label || 'AI'} result`} />}
    </div>
  );
}
