const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compositions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get one
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compositions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, genre, key_signature, tempo, time_signature, mood, instruments, structure, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO compositions (title, genre, key_signature, tempo, time_signature, mood, instruments, structure, description, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [title, genre, key_signature, tempo, time_signature, mood, instruments, structure, description, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, genre, key_signature, tempo, time_signature, mood, instruments, structure, description, status } = req.body;
    const result = await pool.query(
      'UPDATE compositions SET title=$1, genre=$2, key_signature=$3, tempo=$4, time_signature=$5, mood=$6, instruments=$7, structure=$8, description=$9, status=$10, updated_at=NOW() WHERE id=$11 RETURNING *',
      [title, genre, key_signature, tempo, time_signature, mood, instruments, structure, description, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM compositions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Generate
router.post('/ai/generate', authenticateToken, async (req, res) => {
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
