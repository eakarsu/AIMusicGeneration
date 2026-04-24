const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sound_designs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sound_designs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, synth_type, category, oscillators, filter_settings, envelope, modulation, effects, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO sound_designs (title, synth_type, category, oscillators, filter_settings, envelope, modulation, effects, description, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [title, synth_type, category, oscillators, filter_settings, envelope, modulation, effects, description, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, synth_type, category, oscillators, filter_settings, envelope, modulation, effects, description, status } = req.body;
    const result = await pool.query(
      'UPDATE sound_designs SET title=$1, synth_type=$2, category=$3, oscillators=$4, filter_settings=$5, envelope=$6, modulation=$7, effects=$8, description=$9, status=$10, updated_at=NOW() WHERE id=$11 RETURNING *',
      [title, synth_type, category, oscillators, filter_settings, envelope, modulation, effects, description, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM sound_designs WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/generate', authenticateToken, async (req, res) => {
  try {
    const { title, synth_type, category } = req.body;
    const prompt = `Design a detailed synthesizer patch for a ${category || 'pad'} sound using ${synth_type || 'subtractive'} synthesis, named "${title || 'New Sound'}".
Include: oscillator settings, filter configuration, envelope (ADSR), modulation routing, effects chain, and playing tips. Be very specific with parameter values.`;

    const aiResult = await queryOpenRouter(prompt, 'You are an expert sound designer and synthesizer programmer. Provide detailed, precise synth patch designs.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
