const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mixing_assistant ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mixing_assistant WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, project_type, track_count, genre, target_loudness, eq_notes, compression_notes, spatial_notes, master_chain, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO mixing_assistant (title, project_type, track_count, genre, target_loudness, eq_notes, compression_notes, spatial_notes, master_chain, description, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [title, project_type, track_count, genre, target_loudness, eq_notes, compression_notes, spatial_notes, master_chain, description, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, project_type, track_count, genre, target_loudness, eq_notes, compression_notes, spatial_notes, master_chain, description, status } = req.body;
    const result = await pool.query(
      'UPDATE mixing_assistant SET title=$1, project_type=$2, track_count=$3, genre=$4, target_loudness=$5, eq_notes=$6, compression_notes=$7, spatial_notes=$8, master_chain=$9, description=$10, status=$11, updated_at=NOW() WHERE id=$12 RETURNING *',
      [title, project_type, track_count, genre, target_loudness, eq_notes, compression_notes, spatial_notes, master_chain, description, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM mixing_assistant WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/generate', authenticateToken, async (req, res) => {
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
