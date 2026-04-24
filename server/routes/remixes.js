const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM remixes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM remixes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, original_track, remix_style, target_bpm, target_key, effects, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO remixes (title, original_track, remix_style, target_bpm, target_key, effects, description, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [title, original_track, remix_style, target_bpm, target_key, effects, description, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, original_track, remix_style, target_bpm, target_key, effects, description, status } = req.body;
    const result = await pool.query(
      'UPDATE remixes SET title=$1, original_track=$2, remix_style=$3, target_bpm=$4, target_key=$5, effects=$6, description=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
      [title, original_track, remix_style, target_bpm, target_key, effects, description, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM remixes WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/generate', authenticateToken, async (req, res) => {
  try {
    const { title, original_track, remix_style, target_bpm, target_key } = req.body;
    const prompt = `Create a detailed remix plan for "${original_track || title || 'a track'}" in ${remix_style || 'electronic'} style.
Target BPM: ${target_bpm || 128}, Target Key: ${target_key || 'original'}.
Include: arrangement changes, effects chain, BPM/key modifications, new elements to add, sections to keep/modify, mixing approach, and creative ideas.`;

    const aiResult = await queryOpenRouter(prompt, 'You are an expert remix artist and music producer. Provide detailed, creative remix concepts.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
