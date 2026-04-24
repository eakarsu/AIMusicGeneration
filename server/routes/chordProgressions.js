const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chord_progressions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chord_progressions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, key_signature, scale_type, style, complexity, bars, progression_text, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO chord_progressions (title, key_signature, scale_type, style, complexity, bars, progression_text, description, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [title, key_signature, scale_type, style, complexity, bars || 8, progression_text, description, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, key_signature, scale_type, style, complexity, bars, progression_text, description, status } = req.body;
    const result = await pool.query(
      'UPDATE chord_progressions SET title=$1, key_signature=$2, scale_type=$3, style=$4, complexity=$5, bars=$6, progression_text=$7, description=$8, status=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [title, key_signature, scale_type, style, complexity, bars, progression_text, description, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM chord_progressions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/generate', authenticateToken, async (req, res) => {
  try {
    const { title, key_signature, scale_type, style, complexity, bars } = req.body;
    const prompt = `Generate a ${complexity || 'intermediate'} chord progression in ${key_signature || 'C Major'} (${scale_type || 'Major'} scale) for ${style || 'pop'} music.
Length: ${bars || 8} bars. Title: "${title || 'New Progression'}".
Include: chord symbols, roman numeral analysis, voice leading suggestions, rhythm pattern, and substitution options.`;

    const aiResult = await queryOpenRouter(prompt, 'You are an expert music theorist and harmony specialist. Provide detailed chord progressions with analysis.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
