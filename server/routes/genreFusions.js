const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM genre_fusions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM genre_fusions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, genre_a, genre_b, tempo, key_signature, fusion_approach, elements, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO genre_fusions (title, genre_a, genre_b, tempo, key_signature, fusion_approach, elements, description, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [title, genre_a, genre_b, tempo, key_signature, fusion_approach, elements, description, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, genre_a, genre_b, tempo, key_signature, fusion_approach, elements, description, status } = req.body;
    const result = await pool.query(
      'UPDATE genre_fusions SET title=$1, genre_a=$2, genre_b=$3, tempo=$4, key_signature=$5, fusion_approach=$6, elements=$7, description=$8, status=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [title, genre_a, genre_b, tempo, key_signature, fusion_approach, elements, description, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM genre_fusions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/generate', authenticateToken, async (req, res) => {
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
