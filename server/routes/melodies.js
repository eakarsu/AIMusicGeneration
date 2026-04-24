const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM melodies ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM melodies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, key_signature, scale_type, tempo, range_low, range_high, style, contour, melody_notation, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO melodies (title, key_signature, scale_type, tempo, range_low, range_high, style, contour, melody_notation, description, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [title, key_signature, scale_type, tempo, range_low, range_high, style, contour, melody_notation, description, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, key_signature, scale_type, tempo, range_low, range_high, style, contour, melody_notation, description, status } = req.body;
    const result = await pool.query(
      'UPDATE melodies SET title=$1, key_signature=$2, scale_type=$3, tempo=$4, range_low=$5, range_high=$6, style=$7, contour=$8, melody_notation=$9, description=$10, status=$11, updated_at=NOW() WHERE id=$12 RETURNING *',
      [title, key_signature, scale_type, tempo, range_low, range_high, style, contour, melody_notation, description, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM melodies WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/generate', authenticateToken, async (req, res) => {
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
