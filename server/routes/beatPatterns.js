const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter, parseAIJson } = require('../openrouter');
const { rateLimiter } = require('../middleware/rateLimiter');

pool.query('ALTER TABLE beat_patterns ADD COLUMN IF NOT EXISTS user_id INTEGER').catch(() => {});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM beat_patterns WHERE user_id = $1', [req.user.id]);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      'SELECT * FROM beat_patterns WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );
    res.json({ data: result.rows, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM beat_patterns WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, genre, bpm, time_signature, swing_amount, kick_pattern, snare_pattern, hihat_pattern, percussion, description, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'INSERT INTO beat_patterns (title, genre, bpm, time_signature, swing_amount, kick_pattern, snare_pattern, hihat_pattern, percussion, description, status, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [title, genre, bpm, time_signature || '4/4', swing_amount || 0, kick_pattern, snare_pattern, hihat_pattern, percussion, description, status || 'draft', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, genre, bpm, time_signature, swing_amount, kick_pattern, snare_pattern, hihat_pattern, percussion, description, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'UPDATE beat_patterns SET title=$1, genre=$2, bpm=$3, time_signature=$4, swing_amount=$5, kick_pattern=$6, snare_pattern=$7, hihat_pattern=$8, percussion=$9, description=$10, status=$11, updated_at=NOW() WHERE id=$12 AND user_id=$13 RETURNING *',
      [title, genre, bpm, time_signature, swing_amount, kick_pattern, snare_pattern, hihat_pattern, percussion, description, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM beat_patterns WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/generate', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { title, genre, bpm, time_signature } = req.body;
    const prompt = `Create a drum beat pattern for ${genre || 'hip hop'} music titled "${title || 'New Beat'}" at ${bpm || 120} BPM in ${time_signature || '4/4'}.
Return JSON: { "tempo_bpm": 120, "time_signature": "4/4", "measures": [{"beat_1": "kick", "beat_2": "hihat", "beat_3": "snare", "beat_4": "hihat"}], "instruments": [{"name": "kick", "pattern_description": "X...X..."}], "genre_feel": "..." }`;

    const aiResult = await queryOpenRouter(prompt, 'You are an expert beat programmer. Return only valid JSON, no markdown.');
    const structured = parseAIJson(aiResult.result);
    res.json({ ...aiResult, structured });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
