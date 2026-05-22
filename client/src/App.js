import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import SongPipeline from './pages/SongPipeline';
import AIGenerators from './pages/AIGenerators';
import PublicComposition from './pages/PublicComposition';
import Navbar from './components/Navbar';
import './App.css';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

const FEATURES = [
  { key: 'compositions', label: 'Compositions', icon: '🎼', color: '#6C5CE7', apiPath: '/api/compositions', description: 'AI-powered music composition and arrangement' },
  { key: 'song-pipeline', label: 'Song Pipeline', icon: '🚀', color: '#00b894', apiPath: null, description: 'Full AI song creation pipeline', isPipeline: true },
  { key: 'ai-generators', label: 'AI Generators', icon: '🎚️', color: '#fd79a8', apiPath: null, description: 'Beat, chord, and lyric generators', isAIGenerators: true },
  { key: 'remixes', label: 'Remixes', icon: '🔄', color: '#00B894', apiPath: '/api/remixes', description: 'AI remix and rework concepts' },
  { key: 'sound-designs', label: 'Sound Design', icon: '🎛️', color: '#E17055', apiPath: '/api/sound-designs', description: 'AI synthesizer patch design' },
  { key: 'lyrics', label: 'Lyrics Generator', icon: '✍️', color: '#FDCB6E', apiPath: '/api/lyrics', description: 'AI songwriting and lyric generation' },
  { key: 'chord-progressions', label: 'Chord Progressions', icon: '🎹', color: '#0984E3', apiPath: '/api/chord-progressions', description: 'AI harmony and chord generation' },
  { key: 'melodies', label: 'Melody Generator', icon: '🎵', color: '#E84393', apiPath: '/api/melodies', description: 'AI melody creation and development' },
  { key: 'beat-patterns', label: 'Beat Patterns', icon: '🥁', color: '#00CEC9', apiPath: '/api/beat-patterns', description: 'AI drum programming and beat making' },
  { key: 'genre-fusions', label: 'Genre Fusion', icon: '🌍', color: '#A29BFE', apiPath: '/api/genre-fusions', description: 'AI genre blending and fusion concepts' },
  { key: 'music-analysis', label: 'Music Analysis', icon: '📊', color: '#FF7675', apiPath: '/api/music-analysis', description: 'AI-powered music analysis and breakdown' },
  { key: 'mixing-assistant', label: 'Mixing Assistant', icon: '🎚️', color: '#55EFC4', apiPath: '/api/mixing-assistant', description: 'AI mixing and mastering guidance' },
];

// Feature field configs for forms
const FEATURE_FIELDS = {
  compositions: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'genre', label: 'Genre', type: 'text' },
    { name: 'key_signature', label: 'Key Signature', type: 'text' },
    { name: 'tempo', label: 'Tempo (BPM)', type: 'number' },
    { name: 'time_signature', label: 'Time Signature', type: 'text' },
    { name: 'mood', label: 'Mood', type: 'text' },
    { name: 'instruments', label: 'Instruments', type: 'text' },
    { name: 'structure', label: 'Structure', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
  ],
  remixes: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'original_track', label: 'Original Track', type: 'text' },
    { name: 'remix_style', label: 'Remix Style', type: 'text' },
    { name: 'target_bpm', label: 'Target BPM', type: 'number' },
    { name: 'target_key', label: 'Target Key', type: 'text' },
    { name: 'effects', label: 'Effects', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
  ],
  'sound-designs': [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'synth_type', label: 'Synth Type', type: 'text' },
    { name: 'category', label: 'Category', type: 'text' },
    { name: 'oscillators', label: 'Oscillators', type: 'text' },
    { name: 'filter_settings', label: 'Filter Settings', type: 'text' },
    { name: 'envelope', label: 'Envelope (ADSR)', type: 'text' },
    { name: 'modulation', label: 'Modulation', type: 'text' },
    { name: 'effects', label: 'Effects', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
  ],
  lyrics: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'genre', label: 'Genre', type: 'text' },
    { name: 'mood', label: 'Mood', type: 'text' },
    { name: 'theme', label: 'Theme', type: 'text' },
    { name: 'verse_count', label: 'Verse Count', type: 'number' },
    { name: 'has_chorus', label: 'Has Chorus', type: 'checkbox' },
    { name: 'has_bridge', label: 'Has Bridge', type: 'checkbox' },
    { name: 'language', label: 'Language', type: 'text' },
    { name: 'lyrics_text', label: 'Lyrics', type: 'textarea' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
  ],
  'chord-progressions': [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'key_signature', label: 'Key', type: 'text' },
    { name: 'scale_type', label: 'Scale Type', type: 'text' },
    { name: 'style', label: 'Style', type: 'text' },
    { name: 'complexity', label: 'Complexity', type: 'select', options: ['Simple', 'Intermediate', 'Advanced'] },
    { name: 'bars', label: 'Bars', type: 'number' },
    { name: 'progression_text', label: 'Progression', type: 'textarea' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
  ],
  melodies: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'key_signature', label: 'Key', type: 'text' },
    { name: 'scale_type', label: 'Scale Type', type: 'text' },
    { name: 'tempo', label: 'Tempo (BPM)', type: 'number' },
    { name: 'range_low', label: 'Range Low', type: 'text' },
    { name: 'range_high', label: 'Range High', type: 'text' },
    { name: 'style', label: 'Style', type: 'text' },
    { name: 'contour', label: 'Contour', type: 'text' },
    { name: 'melody_notation', label: 'Notation', type: 'textarea' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
  ],
  'beat-patterns': [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'genre', label: 'Genre', type: 'text' },
    { name: 'bpm', label: 'BPM', type: 'number' },
    { name: 'time_signature', label: 'Time Signature', type: 'text' },
    { name: 'swing_amount', label: 'Swing %', type: 'number' },
    { name: 'kick_pattern', label: 'Kick Pattern', type: 'text' },
    { name: 'snare_pattern', label: 'Snare Pattern', type: 'text' },
    { name: 'hihat_pattern', label: 'Hi-Hat Pattern', type: 'text' },
    { name: 'percussion', label: 'Percussion', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
  ],
  'genre-fusions': [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'genre_a', label: 'Genre A', type: 'text' },
    { name: 'genre_b', label: 'Genre B', type: 'text' },
    { name: 'tempo', label: 'Tempo (BPM)', type: 'number' },
    { name: 'key_signature', label: 'Key', type: 'text' },
    { name: 'fusion_approach', label: 'Fusion Approach', type: 'textarea' },
    { name: 'elements', label: 'Elements', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
  ],
  'music-analysis': [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'track_name', label: 'Track Name', type: 'text' },
    { name: 'artist', label: 'Artist', type: 'text' },
    { name: 'genre', label: 'Genre', type: 'text' },
    { name: 'analysis_type', label: 'Analysis Type', type: 'select', options: ['Full Analysis', 'Harmonic Analysis', 'Rhythmic Analysis', 'Melodic Analysis', 'Production Analysis', 'Sound Design Analysis'] },
    { name: 'key_detected', label: 'Key Detected', type: 'text' },
    { name: 'bpm_detected', label: 'BPM Detected', type: 'number' },
    { name: 'structure_notes', label: 'Structure Notes', type: 'textarea' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['draft', 'complete'] },
  ],
  'mixing-assistant': [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'project_type', label: 'Project Type', type: 'text' },
    { name: 'track_count', label: 'Track Count', type: 'number' },
    { name: 'genre', label: 'Genre', type: 'text' },
    { name: 'target_loudness', label: 'Target Loudness', type: 'text' },
    { name: 'eq_notes', label: 'EQ Notes', type: 'textarea' },
    { name: 'compression_notes', label: 'Compression Notes', type: 'textarea' },
    { name: 'spatial_notes', label: 'Spatial Notes', type: 'textarea' },
    { name: 'master_chain', label: 'Master Chain', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
  ],
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const handleLogin = (tokenVal, userVal) => {
    localStorage.setItem('token', tokenVal);
    localStorage.setItem('user', JSON.stringify(userVal));
    setToken(tokenVal);
    setUser(userVal);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return (
      <Router>
        <Routes>
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

          <Route path="/compositions/public/:token" element={<PublicComposition />} />
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} features={FEATURES} />
        <main className="main-content">
          <Routes>
            <Route path="/compositions/public/:token" element={<PublicComposition />} />
            <Route path="/" element={<Dashboard features={FEATURES} />} />
            <Route path="/song-pipeline" element={<SongPipeline token={token} />} />
            <Route path="/ai-generators" element={<AIGenerators token={token} />} />
            {FEATURES.filter(f => !f.isPipeline && !f.isAIGenerators).map(f => (
              <Route
                key={f.key}
                path={`/${f.key}`}
                element={
                  <FeaturePage
                    feature={f}
                    fields={FEATURE_FIELDS[f.key]}
                    token={token}
                  />
                }
              />
            ))}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
