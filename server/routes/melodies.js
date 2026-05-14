const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');
const { rateLimiter } = require('../middleware/rateLimiter');

pool.query('ALTER TABLE melodies ADD COLUMN IF NOT EXISTS user_id INTEGER').catch(() => {});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM melodies WHERE user_id = $1', [req.user.id]);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      'SELECT * FROM melodies WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );
    res.json({ data: result.rows, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM melodies WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, key_signature, scale_type, tempo, range_low, range_high, style, contour, melody_notation, description, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'INSERT INTO melodies (title, key_signature, scale_type, tempo, range_low, range_high, style, contour, melody_notation, description, status, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [title, key_signature, scale_type, tempo, range_low, range_high, style, contour, melody_notation, description, status || 'draft', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, key_signature, scale_type, tempo, range_low, range_high, style, contour, melody_notation, description, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'UPDATE melodies SET title=$1, key_signature=$2, scale_type=$3, tempo=$4, range_low=$5, range_high=$6, style=$7, contour=$8, melody_notation=$9, description=$10, status=$11, updated_at=NOW() WHERE id=$12 AND user_id=$13 RETURNING *',
      [title, key_signature, scale_type, tempo, range_low, range_high, style, contour, melody_notation, description, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM melodies WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/generate', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { title, key_signature, scale_type, tempo, style, contour } = req.body;
    const prompt = `Generate a melody for a ${style || 'pop'} piece titled "${title || 'New Melody'}" in ${key_signature || 'C Major'} (${scale_type || 'Major'} scale).
Tempo: ${tempo || 120} BPM, Contour: ${contour || 'arch'}.
Include: note sequence with rhythm, phrase structure, motif development, embellishments, and performance tips.`;
    const aiResult = await queryOpenRouter(prompt, 'You are an expert melodist and composer. Generate beautiful, singable melodies with detailed notation.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
