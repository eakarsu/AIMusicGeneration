const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');
const { rateLimiter } = require('../middleware/rateLimiter');

// Ensure columns exist
pool.query(`
  ALTER TABLE compositions ADD COLUMN IF NOT EXISTS user_id INTEGER;
  ALTER TABLE compositions ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;
  ALTER TABLE compositions ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE;
`).catch(() => {});

// Get all (user-scoped, paginated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM compositions WHERE user_id = $1', [req.user.id]);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      'SELECT * FROM compositions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );
    res.json({ data: result.rows, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get one
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compositions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Public share endpoint (no auth)
router.get('/public/:token', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM compositions WHERE share_token = $1 AND is_shared = TRUE',
      [req.params.token]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Composition not found or not shared' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, genre, key_signature, tempo, time_signature, mood, instruments, structure, description, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'INSERT INTO compositions (title, genre, key_signature, tempo, time_signature, mood, instruments, structure, description, status, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [title, genre, key_signature, tempo, time_signature, mood, instruments, structure, description, status || 'draft', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, genre, key_signature, tempo, time_signature, mood, instruments, structure, description, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'UPDATE compositions SET title=$1, genre=$2, key_signature=$3, tempo=$4, time_signature=$5, mood=$6, instruments=$7, structure=$8, description=$9, status=$10, updated_at=NOW() WHERE id=$11 AND user_id=$12 RETURNING *',
      [title, genre, key_signature, tempo, time_signature, mood, instruments, structure, description, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM compositions WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Share composition
router.put('/:id/share', authenticateToken, async (req, res) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const result = await pool.query(
      'UPDATE compositions SET is_shared = TRUE, share_token = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [token, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ share_token: token, share_url: `/compositions/public/${token}`, composition: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Generate
router.post('/ai/generate', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { title, genre, key_signature, tempo, mood, instruments } = req.body;
    const prompt = `Create a detailed music composition plan for a ${genre || 'modern'} piece titled "${title || 'Untitled'}".
Key: ${key_signature || 'C Major'}, Tempo: ${tempo || 120} BPM, Mood: ${mood || 'uplifting'}.
Instruments: ${instruments || 'Piano, Strings'}.
Include: structure/form, harmonic framework, melodic ideas, rhythmic patterns, dynamics, and production tips.`;

    const aiResult = await queryOpenRouter(prompt, 'You are an expert music composer and arranger. Provide detailed, professional music composition plans.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
