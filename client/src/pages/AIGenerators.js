import React, { useState } from 'react';

const API = 'http://localhost:3001';

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

function Section({ title, content, icon }) {
  if (!content) return null;
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 12, marginBottom: 16, padding: '14px 20px' }}>
      <div style={{ color: '#a29bfe', fontWeight: 600, marginBottom: 8 }}>{icon} {title}</div>
      <div style={{ color: '#ccc', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: 14 }}>
        {Array.isArray(content) ? content.map((c, i) => <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid rgba(108,92,231,0.1)' }}>• {typeof c === 'string' ? c : JSON.stringify(c)}</div>) :
         typeof content === 'object' ? <pre style={{ margin: 0, fontFamily: 'inherit' }}>{JSON.stringify(content, null, 2)}</pre> :
         String(content)}
      </div>
    </div>
  );
}

export default function AIGenerators({ token }) {
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

  const renderResult = () => {
    if (!result) return null;
    const parsed = result.parsed || {};
    if (tab === 'beat') {
      return (
        <>
          <Section title="Kick Pattern" content={parsed.kick_pattern} icon="🦵" />
          <Section title="Snare Pattern" content={parsed.snare_pattern} icon="🥁" />
          <Section title="Hi-Hat Pattern" content={parsed.hihat_pattern} icon="🎩" />
          <Section title="Percussion" content={parsed.perc_pattern} icon="🪘" />
          <Section title="BPM / Swing" content={parsed.bpm ? `BPM: ${parsed.bpm}, Swing: ${parsed.swing || 0}` : null} icon="⏱️" />
          <Section title="Fills" content={parsed.fills} icon="🎯" />
          <Section title="Production Tips" content={parsed.production_tips} icon="💡" />
        </>
      );
    }
    if (tab === 'chords') {
      return (
        <>
          <Section title="Key" content={parsed.key} icon="🎼" />
          <Section title="Chords" content={parsed.chords} icon="🎹" />
          <Section title="Roman Numerals" content={parsed.roman_numerals} icon="📜" />
          <Section title="Voice Leading Tips" content={parsed.voice_leading_tips} icon="🎶" />
          <Section title="Substitutions" content={parsed.substitutions} icon="🔁" />
          <Section title="Rhythm Pattern" content={parsed.rhythm_pattern} icon="🎵" />
        </>
      );
    }
    if (tab === 'lyrics') {
      return (
        <>
          <Section title={parsed.title || 'Lyrics'} content={null} icon="🎤" />
          <Section title="Verse 1" content={parsed.verse_1} icon="1️⃣" />
          <Section title="Chorus" content={parsed.chorus} icon="🌟" />
          <Section title="Verse 2" content={parsed.verse_2} icon="2️⃣" />
          <Section title="Bridge" content={parsed.bridge} icon="🌉" />
          <Section title="Rhyme Scheme" content={parsed.rhyme_scheme} icon="🔤" />
          <Section title="Themes" content={parsed.themes} icon="💭" />
        </>
      );
    }
    if (tab === 'melody') {
      return (
        <>
          <Section title="Key / Scale" content={`${parsed.key || ''} ${parsed.scale || ''}`} icon="🎼" />
          <Section title="Tempo" content={parsed.tempo} icon="⏱️" />
          <Section title="Phrases" content={parsed.phrases} icon="🎵" />
          <Section title="Contour" content={parsed.contour} icon="📈" />
          <Section title="Rhythmic Motif" content={parsed.rhythmic_motif} icon="🥁" />
          <Section title="Embellishments" content={parsed.embellishments} icon="✨" />
          <Section title="Range" content={parsed.range} icon="📏" />
          <Section title="Performance Tips" content={parsed.performance_tips} icon="💡" />
        </>
      );
    }
    if (tab === 'remix') {
      return (
        <>
          <Section title="Remix Style" content={parsed.remix_style} icon="🎚️" />
          <Section title="BPM Change" content={parsed.bpm_change} icon="⏱️" />
          <Section title="Key Modifications" content={parsed.key_modifications} icon="🎹" />
          <Section title="Drum Redesign" content={parsed.drum_redesign} icon="🥁" />
          <Section title="Harmonic Changes" content={parsed.harmonic_changes} icon="🎶" />
          <Section title="Effects Chain" content={parsed.effects_chain} icon="🎛️" />
          <Section title="Arrangement Plan" content={parsed.arrangement_plan} icon="🗺️" />
          <Section title="Production Tips" content={parsed.production_tips} icon="💡" />
        </>
      );
    }
    if (tab === 'theory') {
      return (
        <>
          <Section title="Answer" content={parsed.answer} icon="📘" />
          <Section title="Key Concepts" content={parsed.key_concepts} icon="🔑" />
          <Section title="Examples" content={parsed.examples} icon="📝" />
          <Section title="Common Pitfalls" content={parsed.common_pitfalls} icon="⚠️" />
          <Section title="Practice Exercises" content={parsed.practice_exercises} icon="🏋️" />
          <Section title="Further Reading" content={parsed.further_reading} icon="📚" />
        </>
      );
    }
    if (tab === 'daw') {
      return (
        <>
          <Section title="Track List" content={parsed.track_list} icon="🎚️" />
          <Section title="Routing Buses" content={parsed.routing_buses} icon="🔀" />
          <Section title="Tempo Map" content={parsed.tempo_map} icon="⏱️" />
          <Section title="Automation Targets" content={parsed.automation_targets} icon="🎛️" />
          <Section title="Session Template Steps" content={parsed.session_template_steps} icon="📋" />
          <Section title="Exports" content={parsed.exports} icon="📤" />
          <Section title="Compatibility Notes" content={parsed.compatibility_notes} icon="🔗" />
        </>
      );
    }
    if (tab === 'royalty') {
      return (
        <>
          <Section title="Publishing Split" content={parsed.publishing_split} icon="📜" />
          <Section title="Master Split" content={parsed.master_split} icon="💿" />
          <Section title="Writer Share Total %" content={parsed.writer_share_total_pct} icon="✍️" />
          <Section title="Publisher Share Total %" content={parsed.publisher_share_total_pct} icon="🏢" />
          <Section title="Notes" content={parsed.notes} icon="📝" />
          <Section title="Disclaimer" content={parsed.disclaimer} icon="⚠️" />
        </>
      );
    }
    if (tab === 'distribute') {
      return (
        <>
          <Section title="Metadata" content={parsed.metadata} icon="🏷️" />
          <Section title="Artwork" content={parsed.artwork} icon="🖼️" />
          <Section title="Audio Master" content={parsed.audio_master} icon="🎚️" />
          <Section title="Release Strategy" content={parsed.release_strategy} icon="🚀" />
          <Section title="Platform-Specific" content={parsed.platform_specific} icon="🎧" />
          <Section title="Rights Check" content={parsed.rights_check} icon="📜" />
          <Section title="Submission Steps" content={parsed.submission_steps} icon="📦" />
          <Section title="Missing Distributor Credentials" content={result.missing_distributor_creds} icon="🔑" />
        </>
      );
    }
    return null;
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
        <form onSubmit={handleSubmit}>
          {tab === 'beat' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Genre</label>
                <select className="form-select" value={form.genre} onChange={e => handle('genre', e.target.value)}>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">BPM</label>
                <input className="form-input" type="number" min={60} max={200} value={form.bpm} onChange={e => handle('bpm', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Complexity</label>
                <select className="form-select" value={form.complexity} onChange={e => handle('complexity', e.target.value)}>
                  <option value="simple">Simple</option><option value="medium">Medium</option><option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="form-label">Style notes</label>
                <input className="form-input" type="text" value={form.style} onChange={e => handle('style', e.target.value)} placeholder="e.g. trap, breakbeat" />
              </div>
            </div>
          )}
          {tab === 'chords' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Key</label>
                <input className="form-input" type="text" value={form.key} onChange={e => handle('key', e.target.value)} placeholder="C major" />
              </div>
              <div>
                <label className="form-label">Genre</label>
                <select className="form-select" value={form.genre} onChange={e => handle('genre', e.target.value)}>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Mood</label>
                <select className="form-select" value={form.mood} onChange={e => handle('mood', e.target.value)}>
                  {moods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Bars</label>
                <input className="form-input" type="number" min={2} max={32} value={form.length} onChange={e => handle('length', e.target.value)} />
              </div>
            </div>
          )}
          {tab === 'lyrics' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Theme *</label>
                <input className="form-input" type="text" value={form.theme} onChange={e => handle('theme', e.target.value)} placeholder="e.g. summer love, perseverance" />
              </div>
              <div>
                <label className="form-label">Genre</label>
                <select className="form-select" value={form.genre} onChange={e => handle('genre', e.target.value)}>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Mood</label>
                <select className="form-select" value={form.mood} onChange={e => handle('mood', e.target.value)}>
                  {moods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Structure</label>
                <input className="form-input" type="text" value={form.structure} onChange={e => handle('structure', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Tone</label>
                <input className="form-input" type="text" value={form.tone} onChange={e => handle('tone', e.target.value)} />
              </div>
            </div>
          )}
          {tab === 'melody' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Key</label>
                <input className="form-input" type="text" value={form.key} onChange={e => handle('key', e.target.value)} placeholder="A minor" />
              </div>
              <div>
                <label className="form-label">Scale</label>
                <input className="form-input" type="text" value={form.scale} onChange={e => handle('scale', e.target.value)} placeholder="natural minor" />
              </div>
              <div>
                <label className="form-label">Tempo (BPM)</label>
                <input className="form-input" type="number" min={40} max={240} value={form.tempo} onChange={e => handle('tempo', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Bars</label>
                <input className="form-input" type="number" min={2} max={32} value={form.length} onChange={e => handle('length', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Range Low</label>
                <input className="form-input" type="text" value={form.range_low} onChange={e => handle('range_low', e.target.value)} placeholder="A3" />
              </div>
              <div>
                <label className="form-label">Range High</label>
                <input className="form-input" type="text" value={form.range_high} onChange={e => handle('range_high', e.target.value)} placeholder="E5" />
              </div>
              <div>
                <label className="form-label">Genre</label>
                <select className="form-select" value={form.genre} onChange={e => handle('genre', e.target.value)}>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Mood</label>
                <select className="form-select" value={form.mood} onChange={e => handle('mood', e.target.value)}>
                  {moods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          )}
          {tab === 'remix' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Original Track *</label>
                <input className="form-input" type="text" value={form.original_track} onChange={e => handle('original_track', e.target.value)} placeholder="e.g. Daft Punk - Around the World" />
              </div>
              <div>
                <label className="form-label">Original Genre</label>
                <input className="form-input" type="text" value={form.original_genre} onChange={e => handle('original_genre', e.target.value)} placeholder="house" />
              </div>
              <div>
                <label className="form-label">Target Style</label>
                <input className="form-input" type="text" value={form.target_style} onChange={e => handle('target_style', e.target.value)} placeholder="lo-fi, dnb, trap" />
              </div>
              <div>
                <label className="form-label">Target BPM</label>
                <input className="form-input" type="number" min={40} max={220} value={form.target_bpm} onChange={e => handle('target_bpm', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Target Key</label>
                <input className="form-input" type="text" value={form.target_key} onChange={e => handle('target_key', e.target.value)} placeholder="unchanged or e.g. C minor" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Vibe</label>
                <input className="form-input" type="text" value={form.vibe} onChange={e => handle('vibe', e.target.value)} placeholder="chill, aggressive, nostalgic" />
              </div>
            </div>
          )}
          {tab === 'theory' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Question *</label>
                <textarea className="form-input" rows={3} value={form.question} onChange={e => handle('question', e.target.value)} placeholder="e.g. How do I modulate from C major to E minor?" />
              </div>
              <div>
                <label className="form-label">Key</label>
                <input className="form-input" type="text" value={form.key} onChange={e => handle('key', e.target.value)} placeholder="C major" />
              </div>
              <div>
                <label className="form-label">Mode/Scale</label>
                <input className="form-input" type="text" value={form.mode} onChange={e => handle('mode', e.target.value)} placeholder="Dorian, Mixolydian" />
              </div>
              <div>
                <label className="form-label">Context</label>
                <input className="form-input" type="text" value={form.context} onChange={e => handle('context', e.target.value)} placeholder="jazz combo, film score" />
              </div>
              <div>
                <label className="form-label">Level</label>
                <select className="form-select" value={form.level} onChange={e => handle('level', e.target.value)}>
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
                <select className="form-select" value={form.daw} onChange={e => handle('daw', e.target.value)}>
                  <option>Logic Pro</option><option>Ableton Live</option><option>FL Studio</option>
                  <option>Pro Tools</option><option>Reaper</option><option>Studio One</option><option>Cubase</option>
                </select>
              </div>
              <div>
                <label className="form-label">Genre</label>
                <select className="form-select" value={form.genre} onChange={e => handle('genre', e.target.value)}>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Song Idea</label>
                <input className="form-input" type="text" value={form.song_idea} onChange={e => handle('song_idea', e.target.value)} placeholder="cinematic build with vocal hook" />
              </div>
              <div>
                <label className="form-label">Tempo (BPM)</label>
                <input className="form-input" type="number" value={form.tempo} onChange={e => handle('tempo', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Key</label>
                <input className="form-input" type="text" value={form.key} onChange={e => handle('key', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Duration (min)</label>
                <input className="form-input" type="number" min={1} max={20} value={form.duration_minutes} onChange={e => handle('duration_minutes', e.target.value)} />
              </div>
            </div>
          )}
          {tab === 'royalty' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Song Title</label>
                <input className="form-input" type="text" value={form.song_title} onChange={e => handle('song_title', e.target.value)} placeholder="Midnight Drive" />
              </div>
              <div>
                <label className="form-label">Work Type</label>
                <input className="form-input" type="text" value={form.work_type} onChange={e => handle('work_type', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Contributors (JSON array, max 20)</label>
                <textarea className="form-input" rows={8} value={form.contributors_json} onChange={e => handle('contributors_json', e.target.value)} />
              </div>
            </div>
          )}
          {tab === 'distribute' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Song Title</label>
                <input className="form-input" type="text" value={form.song_title} onChange={e => handle('song_title', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Artist Name</label>
                <input className="form-input" type="text" value={form.artist_name} onChange={e => handle('artist_name', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Genre</label>
                <select className="form-select" value={form.genre} onChange={e => handle('genre', e.target.value)}>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Release Date</label>
                <input className="form-input" type="date" value={form.release_date} onChange={e => handle('release_date', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Platforms (comma-separated)</label>
                <input className="form-input" type="text" value={form.platforms} onChange={e => handle('platforms', e.target.value)} />
              </div>
            </div>
          )}
          {error && <div style={{ color: '#e74c3c', marginTop: 12, fontSize: 14 }}>{error}</div>}
          <button type="submit" className="btn-ai" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            {loading ? 'Generating…' : <><span>✨</span> Generate</>}
          </button>
        </form>
      </div>

      {result && (
        <div>
          <h2 style={{ color: '#a29bfe', marginBottom: 16, fontSize: 18 }}>Result</h2>
          {renderResult()}
          {result.raw && !result.parsed && (
            <pre style={{ color: '#ccc', fontSize: 12, whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12 }}>
              {result.raw}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
