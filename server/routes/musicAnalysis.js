const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');
const { rateLimiter } = require('../middleware/rateLimiter');

pool.query('ALTER TABLE music_analysis ADD COLUMN IF NOT EXISTS user_id INTEGER').catch(() => {});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM music_analysis WHERE user_id = $1', [req.user.id]);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      'SELECT * FROM music_analysis WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );
    res.json({ data: result.rows, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM music_analysis WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, track_name, artist, genre, analysis_type, key_detected, bpm_detected, structure_notes, description, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'INSERT INTO music_analysis (title, track_name, artist, genre, analysis_type, key_detected, bpm_detected, structure_notes, description, status, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [title, track_name, artist, genre, analysis_type, key_detected, bpm_detected, structure_notes, description, status || 'complete', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, track_name, artist, genre, analysis_type, key_detected, bpm_detected, structure_notes, description, status } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const result = await pool.query(
      'UPDATE music_analysis SET title=$1, track_name=$2, artist=$3, genre=$4, analysis_type=$5, key_detected=$6, bpm_detected=$7, structure_notes=$8, description=$9, status=$10, updated_at=NOW() WHERE id=$11 AND user_id=$12 RETURNING *',
      [title, track_name, artist, genre, analysis_type, key_detected, bpm_detected, structure_notes, description, status, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM music_analysis WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/generate', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { track_name, artist, genre, analysis_type } = req.body;
    const prompt = `Perform a detailed ${analysis_type || 'full'} analysis of "${track_name || 'the track'}" by ${artist || 'the artist'} (${genre || 'unknown genre'}).
Include: structural analysis (form/sections), harmonic analysis (key, chords, modulations), rhythmic analysis (time signature, groove, syncopation), melodic analysis (range, contour, motifs), timbral profile (instrumentation, EQ balance), dynamic analysis, and production techniques used.`;
    const aiResult = await queryOpenRouter(prompt, 'You are an expert musicologist and music analyst. Provide thorough, professional music analysis.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
