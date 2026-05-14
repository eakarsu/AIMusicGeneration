const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter, parseAIJson } = require('../openrouter');
const { rateLimiter } = require('../middleware/rateLimiter');

pool.query('ALTER TABLE chord_progressions ADD COLUMN IF NOT EXISTS user_id INTEGER').catch(() => {});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM chord_progressions WHERE user_id = $1', [req.user.id]);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      'SELECT * FROM chord_progressions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );
    res.json({ data: result.rows, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chord_progressions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, key_signature, scale_type, style, complexity, bars, progression_text, description, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'INSERT INTO chord_progressions (title, key_signature, scale_type, style, complexity, bars, progression_text, description, status, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [title, key_signature, scale_type, style, complexity, bars || 8, progression_text, description, status || 'draft', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, key_signature, scale_type, style, complexity, bars, progression_text, description, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'UPDATE chord_progressions SET title=$1, key_signature=$2, scale_type=$3, style=$4, complexity=$5, bars=$6, progression_text=$7, description=$8, status=$9, updated_at=NOW() WHERE id=$10 AND user_id=$11 RETURNING *',
      [title, key_signature, scale_type, style, complexity, bars, progression_text, description, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM chord_progressions WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/generate', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { title, key_signature, scale_type, style, complexity, bars } = req.body;
    const prompt = `Generate a ${complexity || 'intermediate'} chord progression in ${key_signature || 'C Major'} (${scale_type || 'Major'} scale) for ${style || 'pop'} music.
Length: ${bars || 8} bars. Title: "${title || 'New Progression'}".
Return JSON: { "key": "...", "mode": "...", "time_signature": "...", "chords": [{"position": 1, "chord": "Cmaj7", "duration_beats": 4, "inversion": "root", "function": "tonic"}], "progression_name": "...", "mood": "...", "recommended_tempo_bpm": 120 }`;

    const aiResult = await queryOpenRouter(prompt, 'You are an expert music theorist. Return only valid JSON, no markdown.');
    const structured = parseAIJson(aiResult.result);
    res.json({ ...aiResult, structured });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
