import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API = 'http://localhost:3001';

export default function PublicComposition() {
  const { token } = useParams();
  const [composition, setComposition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/compositions/public/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setComposition(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d1a', color: '#fff' }}>
      <div>Loading composition...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d1a', color: '#e74c3c', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <div style={{ fontSize: 18 }}>Composition not found or not shared</div>
      <div style={{ color: '#888', fontSize: 14 }}>{error}</div>
    </div>
  );

  const fields = [
    { key: 'genre', label: 'Genre' },
    { key: 'key_signature', label: 'Key' },
    { key: 'tempo', label: 'Tempo (BPM)' },
    { key: 'time_signature', label: 'Time Signature' },
    { key: 'mood', label: 'Mood' },
    { key: 'instruments', label: 'Instruments' },
    { key: 'structure', label: 'Structure' },
    { key: 'description', label: 'Description' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#fff', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎼</div>
          <h1 style={{ fontSize: 32, color: '#fff', marginBottom: 8 }}>{composition.title}</h1>
          <span style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: 20,
            background: composition.status === 'published' ? 'rgba(0,184,148,0.15)' : 'rgba(108,92,231,0.15)',
            color: composition.status === 'published' ? '#00b894' : '#a29bfe',
            fontSize: 12, border: `1px solid ${composition.status === 'published' ? 'rgba(0,184,148,0.3)' : 'rgba(108,92,231,0.3)'}`
          }}>
            {composition.status}
          </span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(108,92,231,0.2)',
          borderRadius: 16, padding: 28
        }}>
          {fields.map(f => {
            const val = composition[f.key];
            if (!val) return null;
            const isLong = String(val).length > 60;
            return (
              <div key={f.key} style={{ gridColumn: isLong ? '1 / -1' : 'auto' }}>
                <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>{f.label}</div>
                <div style={{ color: '#fff', fontSize: 14 }}>{String(val)}</div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 40, color: '#666', fontSize: 13 }}>
          Shared via AI Music Generation
          <br />
          {new Date(composition.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
