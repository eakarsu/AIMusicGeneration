const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');
const { rateLimiter } = require('../middleware/rateLimiter');

pool.query('ALTER TABLE mixing_assistant ADD COLUMN IF NOT EXISTS user_id INTEGER').catch(() => {});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM mixing_assistant WHERE user_id = $1', [req.user.id]);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      'SELECT * FROM mixing_assistant WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );
    res.json({ data: result.rows, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mixing_assistant WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, project_type, track_count, genre, target_loudness, eq_notes, compression_notes, spatial_notes, master_chain, description, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'INSERT INTO mixing_assistant (title, project_type, track_count, genre, target_loudness, eq_notes, compression_notes, spatial_notes, master_chain, description, status, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [title, project_type, track_count, genre, target_loudness, eq_notes, compression_notes, spatial_notes, master_chain, description, status || 'draft', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, project_type, track_count, genre, target_loudness, eq_notes, compression_notes, spatial_notes, master_chain, description, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'UPDATE mixing_assistant SET title=$1, project_type=$2, track_count=$3, genre=$4, target_loudness=$5, eq_notes=$6, compression_notes=$7, spatial_notes=$8, master_chain=$9, description=$10, status=$11, updated_at=NOW() WHERE id=$12 AND user_id=$13 RETURNING *',
      [title, project_type, track_count, genre, target_loudness, eq_notes, compression_notes, spatial_notes, master_chain, description, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM mixing_assistant WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/generate', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { title, project_type, track_count, genre, target_loudness } = req.body;
    const prompt = `Provide a professional mixing and mastering guide for a ${genre || 'pop'} ${project_type || 'single'} with ${track_count || 20} tracks, titled "${title || 'New Mix'}".
Target loudness: ${target_loudness || '-14 LUFS'}.
Include: EQ recommendations per instrument, compression settings, spatial/panning guide, master bus chain, gain staging tips, and genre-specific mixing techniques.`;
    const aiResult = await queryOpenRouter(prompt, 'You are a Grammy-winning mixing and mastering engineer. Provide detailed, professional mixing guides.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
