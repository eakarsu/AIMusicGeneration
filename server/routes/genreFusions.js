const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');
const { rateLimiter } = require('../middleware/rateLimiter');

pool.query('ALTER TABLE genre_fusions ADD COLUMN IF NOT EXISTS user_id INTEGER').catch(() => {});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM genre_fusions WHERE user_id = $1', [req.user.id]);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      'SELECT * FROM genre_fusions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );
    res.json({ data: result.rows, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM genre_fusions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, genre_a, genre_b, tempo, key_signature, fusion_approach, elements, description, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'INSERT INTO genre_fusions (title, genre_a, genre_b, tempo, key_signature, fusion_approach, elements, description, status, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [title, genre_a, genre_b, tempo, key_signature, fusion_approach, elements, description, status || 'draft', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, genre_a, genre_b, tempo, key_signature, fusion_approach, elements, description, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'UPDATE genre_fusions SET title=$1, genre_a=$2, genre_b=$3, tempo=$4, key_signature=$5, fusion_approach=$6, elements=$7, description=$8, status=$9, updated_at=NOW() WHERE id=$10 AND user_id=$11 RETURNING *',
      [title, genre_a, genre_b, tempo, key_signature, fusion_approach, elements, description, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM genre_fusions WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/generate', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { title, genre_a, genre_b, tempo, key_signature } = req.body;
    const prompt = `Create a genre fusion concept blending ${genre_a || 'Jazz'} and ${genre_b || 'Electronic'} titled "${title || 'New Fusion'}".
Tempo: ${tempo || 120} BPM, Key: ${key_signature || 'C Minor'}.
Include: which elements to take from each genre, instrumentation, rhythmic approach, harmonic framework, production techniques, arrangement ideas, and reference artists.`;
    const aiResult = await queryOpenRouter(prompt, 'You are an innovative music producer specializing in genre fusion. Create unique, detailed fusion concepts.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
