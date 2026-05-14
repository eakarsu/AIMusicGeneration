const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter, parseAIJson } = require('../openrouter');
const { rateLimiter } = require('../middleware/rateLimiter');

// POST /api/ai/create-song-pipeline
router.post('/create-song-pipeline', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { theme, genre, mood, tempo } = req.body;
    if (!theme || !theme.trim()) return res.status(400).json({ error: 'Theme is required' });

    const context = `Genre: ${genre || 'pop'}, Mood: ${mood || 'uplifting'}, Tempo: ${tempo || 120} BPM, Theme: ${theme}`;

    // Step 1: Lyrics concept
    const lyricsResult = await queryOpenRouter(
      `Create a lyrics concept for a ${genre || 'pop'} song with theme "${theme}", mood: ${mood || 'uplifting'}. Provide: title, main hook (2 lines), verse concept, bridge concept. Keep it concise.`,
      'You are a professional songwriter.'
    );
    const lyrics_concept = lyricsResult.result || lyricsResult.error;

    // Step 2: Chord progression
    const chordsResult = await queryOpenRouter(
      `Create a chord progression for a ${genre || 'pop'} song. ${context}. Return 4-8 chords with labels (verse, chorus). Be concise.`,
      'You are a music theorist.'
    );
    const chord_progression = chordsResult.result || chordsResult.error;

    // Step 3: Melody description
    const melodyResult = await queryOpenRouter(
      `Describe the melodic character for a ${genre || 'pop'} song. ${context}. Include: range, contour, rhythmic feel, key motifs. Be concise.`,
      'You are a melodist and composer.'
    );
    const melody_description = melodyResult.result || melodyResult.error;

    // Step 4: Arrangement
    const arrangementResult = await queryOpenRouter(
      `Create an arrangement plan for a ${genre || 'pop'} song. ${context}. Include: instrumentation, song sections, dynamics, production notes. Be concise.`,
      'You are a music arranger and producer.'
    );
    const arrangement_notes = arrangementResult.result || arrangementResult.error;

    res.json({
      success: true,
      pipeline: {
        lyrics_concept,
        chord_progression,
        melody_description,
        arrangement_notes,
        complete_song_brief: `Song Brief\n\nTheme: ${theme}\nGenre: ${genre || 'pop'}\nMood: ${mood || 'uplifting'}\nTempo: ${tempo || 120} BPM\n\n--- LYRICS CONCEPT ---\n${lyrics_concept}\n\n--- CHORD PROGRESSION ---\n${chord_progression}\n\n--- MELODY ---\n${melody_description}\n\n--- ARRANGEMENT ---\n${arrangement_notes}`
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/generate-beat
router.post('/generate-beat', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { genre, bpm, complexity, style } = req.body || {};
    const prompt = `Generate a drum/beat pattern.
Genre: ${genre || 'pop'}
BPM: ${bpm || 120}
Complexity: ${complexity || 'medium'}
Style notes: ${style || ''}

Return JSON only: { "kick_pattern": string, "snare_pattern": string, "hihat_pattern": string, "perc_pattern": string, "bpm": number, "swing": number, "fills": [string], "production_tips": [string] }`;
    const r = await queryOpenRouter(prompt, 'You are an expert beatmaker and rhythm programmer.');
    const parsed = parseAIJson(r.result || '');
    res.json({ success: r.success !== false, raw: r.result, parsed, model: r.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/generate-chord-progression
router.post('/generate-chord-progression', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { key, genre, mood, length } = req.body || {};
    const prompt = `Generate a chord progression.
Key: ${key || 'C major'}
Genre: ${genre || 'pop'}
Mood: ${mood || 'uplifting'}
Bars: ${length || 8}

Return JSON only: { "key": string, "chords": [string], "roman_numerals": [string], "voice_leading_tips": [string], "substitutions": [string], "rhythm_pattern": string }`;
    const r = await queryOpenRouter(prompt, 'You are a music theorist and composer.');
    const parsed = parseAIJson(r.result || '');
    res.json({ success: r.success !== false, raw: r.result, parsed, model: r.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/generate-lyrics
router.post('/generate-lyrics', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { theme, genre, mood, structure, tone } = req.body || {};
    if (!theme) return res.status(400).json({ error: 'theme is required' });
    const prompt = `Write song lyrics.
Theme: ${theme}
Genre: ${genre || 'pop'}
Mood: ${mood || 'uplifting'}
Structure: ${structure || 'verse-chorus-verse-chorus-bridge-chorus'}
Tone: ${tone || 'sincere'}

Return JSON only: { "title": string, "verse_1": string, "chorus": string, "verse_2": string, "bridge": string, "rhyme_scheme": string, "themes": [string] }`;
    const r = await queryOpenRouter(prompt, 'You are a professional songwriter.');
    const parsed = parseAIJson(r.result || '');
    res.json({ success: r.success !== false, raw: r.result, parsed, model: r.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/generate-melody
router.post('/generate-melody', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { key, scale, tempo, genre, mood, range_low, range_high, length } = req.body || {};
    const prompt = `Generate a melody.
Key: ${key || 'A minor'}
Scale: ${scale || 'natural minor'}
Tempo: ${tempo || 110} BPM
Genre: ${genre || 'pop'}
Mood: ${mood || 'reflective'}
Range: ${range_low || 'A3'} to ${range_high || 'E5'}
Bars: ${length || 8}

Return JSON only: { "key": string, "scale": string, "tempo": number, "phrases": [string], "contour": string, "rhythmic_motif": string, "embellishments": [string], "range": { "low": string, "high": string }, "performance_tips": [string] }`;
    const r = await queryOpenRouter(prompt, 'You are a melodist and composer.');
    const parsed = parseAIJson(r.result || '');
    res.json({ success: r.success !== false, raw: r.result, parsed, model: r.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/remix-suggestion
router.post('/remix-suggestion', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { original_track, original_genre, target_style, target_bpm, target_key, vibe } = req.body || {};
    if (!original_track || !String(original_track).trim()) {
      return res.status(400).json({ error: 'original_track is required' });
    }
    const prompt = `Suggest a remix concept for an existing track.
Original Track: ${original_track}
Original Genre: ${original_genre || 'unknown'}
Target Style: ${target_style || 'lo-fi'}
Target BPM: ${target_bpm || 90}
Target Key: ${target_key || 'unchanged'}
Desired Vibe: ${vibe || 'chill'}

Return JSON only: { "remix_style": string, "bpm_change": string, "key_modifications": [string], "drum_redesign": string, "harmonic_changes": [string], "effects_chain": [string], "arrangement_plan": string, "production_tips": [string] }`;
    const r = await queryOpenRouter(prompt, 'You are an experienced remix producer and sound designer.');
    const parsed = parseAIJson(r.result || '');
    res.json({ success: r.success !== false, raw: r.result, parsed, model: r.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/music-theory-advisor
router.post('/music-theory-advisor', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { question, key, mode, context, level } = req.body || {};
    if (!question || !String(question).trim()) {
      return res.status(400).json({ error: 'question is required' });
    }
    const prompt = `Music theory advisory request.
Question: ${question}
Key: ${key || 'unspecified'}
Mode/Scale: ${mode || 'unspecified'}
Musical Context: ${context || 'general'}
Student Level: ${level || 'intermediate'}

Return JSON only: { "answer": string, "key_concepts": [string], "examples": [string], "common_pitfalls": [string], "practice_exercises": [string], "further_reading": [string] }`;
    const r = await queryOpenRouter(prompt, 'You are a clear, patient music theory teacher.');
    const parsed = parseAIJson(r.result || '');
    res.json({ success: r.success !== false, raw: r.result, parsed, model: r.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/daw-arrange
// Audit-recommended (NEEDS-PRODUCT-DECISION): DAW integration.
// PRODUCT-DECISION: We do NOT integrate with any specific DAW; we generate a text-only
// arrangement plan that works across Logic Pro / Ableton Live / FL Studio / Pro Tools / Reaper.
// Output is a session-template description (track list, routing, plugin suggestions).
// ENV: OPENROUTER_API_KEY — handled by queryOpenRouter (mock if unset).
router.post('/daw-arrange', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { genre, song_idea, daw, tempo, key, duration_minutes } = req.body || {};
    const dawName = daw || 'any DAW';
    const prompt = `Generate a DAW-agnostic session arrangement plan that a producer can rebuild in ${dawName}.
Genre: ${genre || 'pop'}
Song Idea: ${song_idea || 'open brief'}
Tempo: ${tempo || 100} BPM
Key: ${key || 'C major'}
Target Duration: ${duration_minutes || 3} min

Return JSON only: { "track_list": [{"name": string, "role": string, "plugins": [string], "send": string}], "routing_buses": [string], "tempo_map": string, "automation_targets": [string], "session_template_steps": [string], "exports": { "stems": [string], "mix_bounce": string }, "compatibility_notes": [string] }`;
    const r = await queryOpenRouter(prompt, 'You are an experienced mixing/mastering engineer who builds DAW templates.');
    const parsed = parseAIJson(r.result || '');
    if (r.mock) {
      return res.status(503).json({ error: 'AI not configured.', missing: 'OPENROUTER_API_KEY', raw: r.result, parsed, model: r.model });
    }
    res.json({ success: r.success !== false, raw: r.result, parsed, model: r.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/royalty-split-suggest
// Audit-recommended (NEEDS-PRODUCT-DECISION): Royalty tracking.
// PRODUCT-DECISION: Static "split-suggestion" engine — does NOT register with PROs / publishers.
// Caller passes contributor list + contribution descriptions; we return a recommended split %
// with rationale based on industry conventions. Pure advisory; no payout machinery.
// ENV: OPENROUTER_API_KEY — 503 if unset.
router.post('/royalty-split-suggest', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { contributors, song_title, work_type } = req.body || {};
    if (!Array.isArray(contributors) || contributors.length === 0) {
      return res.status(400).json({ error: 'contributors must be a non-empty array of {name, role, contribution}' });
    }
    if (contributors.length > 20) {
      return res.status(400).json({ error: 'Max 20 contributors per request.' });
    }
    const list = contributors.map((c, i) =>
      `${i + 1}. ${c.name || 'Unknown'} — role: ${c.role || 'unspecified'}; contribution: ${c.contribution || 'unspecified'}`
    ).join('\n');

    const prompt = `Suggest a fair royalty split for a ${work_type || 'songwriting + master recording'} work titled "${song_title || 'Untitled'}".
Contributors:
${list}

Apply standard splits: songwriting 50% (publishing) + master 50% (sound recording). Allocate per contribution.
Return JSON only: { "publishing_split": [{"name": string, "percent": number, "rationale": string}], "master_split": [{"name": string, "percent": number, "rationale": string}], "writer_share_total_pct": number, "publisher_share_total_pct": number, "notes": [string], "disclaimer": string }`;
    const r = await queryOpenRouter(prompt, 'You are a music-industry royalty consultant. Be conservative and document rationale.');
    const parsed = parseAIJson(r.result || '');
    if (r.mock) {
      return res.status(503).json({ error: 'AI not configured.', missing: 'OPENROUTER_API_KEY', raw: r.result, parsed, model: r.model });
    }
    res.json({ success: r.success !== false, raw: r.result, parsed, model: r.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/distribution-checklist
// Audit-recommended (NEEDS-CREDS): Distribution (Spotify/Apple).
// We do NOT call distributor APIs (would require DistroKid/CD Baby/Tunecore creds + paid plan).
// Instead we generate a release-prep checklist (metadata, ISRCs, artwork specs, smart-link
// strategy) so the artist can hand it to a distributor of their choice.
// ENV: OPENROUTER_API_KEY — 503 if unset, plus optional DISTROKID_API_KEY/etc placeholder
// markers in the response if any creds are also missing.
router.post('/distribution-checklist', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { song_title, artist_name, genre, release_date, platforms } = req.body || {};
    const platformList = Array.isArray(platforms) && platforms.length
      ? platforms.join(', ')
      : 'Spotify, Apple Music, YouTube Music, Amazon Music, Tidal';
    const prompt = `Build a pre-release distribution checklist.
Song Title: ${song_title || 'Untitled'}
Artist: ${artist_name || 'Unknown'}
Genre: ${genre || 'pop'}
Target Release Date: ${release_date || 'TBD'}
Platforms: ${platformList}

Return JSON only: { "metadata": {"isrc_required": boolean, "upc_required": boolean, "fields": [string]}, "artwork": {"min_pixels": number, "color_space": string, "filetype": string, "do_not": [string]}, "audio_master": {"format": string, "loudness_target_lufs": number, "sample_rate": number, "bit_depth": number}, "release_strategy": {"pre_save_window_days": number, "pitch_to_editorial": boolean, "smart_link_required": boolean}, "platform_specific": [{"platform": string, "notes": string}], "rights_check": [string], "submission_steps": [string], "missing_credentials_hint": [string] }`;
    const r = await queryOpenRouter(prompt, 'You are a music distribution and release-strategy specialist.');
    const parsed = parseAIJson(r.result || '');
    if (r.mock) {
      return res.status(503).json({ error: 'AI not configured.', missing: 'OPENROUTER_API_KEY', raw: r.result, parsed, model: r.model });
    }
    // Surface which (optional) distribution-credential env vars are missing so the FE can warn.
    const missingCreds = [];
    if (!process.env.DISTROKID_API_KEY) missingCreds.push('DISTROKID_API_KEY');
    if (!process.env.CDBABY_API_KEY) missingCreds.push('CDBABY_API_KEY');
    if (!process.env.TUNECORE_API_KEY) missingCreds.push('TUNECORE_API_KEY');
    res.json({ success: r.success !== false, raw: r.result, parsed, model: r.model, missing_distributor_creds: missingCreds });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
