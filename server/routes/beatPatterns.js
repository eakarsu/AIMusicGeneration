const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM beat_patterns ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM beat_patterns WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, genre, bpm, time_signature, swing_amount, kick_pattern, snare_pattern, hihat_pattern, percussion, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO beat_patterns (title, genre, bpm, time_signature, swing_amount, kick_pattern, snare_pattern, hihat_pattern, percussion, description, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [title, genre, bpm, time_signature || '4/4', swing_amount || 0, kick_pattern, snare_pattern, hihat_pattern, percussion, description, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, genre, bpm, time_signature, swing_amount, kick_pattern, snare_pattern, hihat_pattern, percussion, description, status } = req.body;
    const result = await pool.query(
      'UPDATE beat_patterns SET title=$1, genre=$2, bpm=$3, time_signature=$4, swing_amount=$5, kick_pattern=$6, snare_pattern=$7, hihat_pattern=$8, percussion=$9, description=$10, status=$11, updated_at=NOW() WHERE id=$12 RETURNING *',
      [title, genre, bpm, time_signature, swing_amount, kick_pattern, snare_pattern, hihat_pattern, percussion, description, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM beat_patterns WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/generate', authenticateToken, async (req, res) => {
  try {
    const { title, genre, bpm, time_signature } = req.body;
    const prompt = `Create a drum beat pattern for ${genre || 'hip hop'} music titled "${title || 'New Beat'}" at ${bpm || 120} BPM in ${time_signature || '4/4'}.
Include: kick pattern, snare/clap pattern, hi-hat pattern (with variations), percussion layers, fill patterns, mix/processing tips, and groove notes. Use X for hits and . for rests in grid notation.`;

    const aiResult = await queryOpenRouter(prompt, 'You are an expert beat maker and drum programmer. Create detailed, groovy beat patterns.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
