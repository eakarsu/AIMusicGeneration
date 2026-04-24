const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM music_analysis ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM music_analysis WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, track_name, artist, genre, analysis_type, key_detected, bpm_detected, structure_notes, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO music_analysis (title, track_name, artist, genre, analysis_type, key_detected, bpm_detected, structure_notes, description, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [title, track_name, artist, genre, analysis_type, key_detected, bpm_detected, structure_notes, description, status || 'complete']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, track_name, artist, genre, analysis_type, key_detected, bpm_detected, structure_notes, description, status } = req.body;
    const result = await pool.query(
      'UPDATE music_analysis SET title=$1, track_name=$2, artist=$3, genre=$4, analysis_type=$5, key_detected=$6, bpm_detected=$7, structure_notes=$8, description=$9, status=$10, updated_at=NOW() WHERE id=$11 RETURNING *',
      [title, track_name, artist, genre, analysis_type, key_detected, bpm_detected, structure_notes, description, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM music_analysis WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/generate', authenticateToken, async (req, res) => {
  try {
    const { track_name, artist, genre, analysis_type } = req.body;
    const prompt = `Perform a detailed ${analysis_type || 'full'} analysis of "${track_name || 'the track'}" by ${artist || 'the artist'} (${genre || 'unknown genre'}).
Include: structural analysis (form/sections), harmonic analysis (key, chords, modulations), rhythmic analysis (time signature, groove, syncopation), melodic analysis (range, contour, motifs), timbral profile (instrumentation, EQ balance), dynamic analysis, and production techniques used.`;

    const aiResult = await queryOpenRouter(prompt, 'You are an expert musicologist and music analyst. Provide thorough, professional music analysis.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
