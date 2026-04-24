const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lyrics ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lyrics WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, genre, mood, theme, verse_count, has_chorus, has_bridge, language, lyrics_text, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO lyrics (title, genre, mood, theme, verse_count, has_chorus, has_bridge, language, lyrics_text, description, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [title, genre, mood, theme, verse_count || 2, has_chorus !== false, has_bridge !== false, language || 'English', lyrics_text, description, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, genre, mood, theme, verse_count, has_chorus, has_bridge, language, lyrics_text, description, status } = req.body;
    const result = await pool.query(
      'UPDATE lyrics SET title=$1, genre=$2, mood=$3, theme=$4, verse_count=$5, has_chorus=$6, has_bridge=$7, language=$8, lyrics_text=$9, description=$10, status=$11, updated_at=NOW() WHERE id=$12 RETURNING *',
      [title, genre, mood, theme, verse_count, has_chorus, has_bridge, language, lyrics_text, description, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM lyrics WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/generate', authenticateToken, async (req, res) => {
  try {
    const { title, genre, mood, theme, verse_count, has_chorus, has_bridge } = req.body;
    const prompt = `Write complete song lyrics for a ${genre || 'pop'} song titled "${title || 'Untitled'}".
Mood: ${mood || 'uplifting'}, Theme: ${theme || 'love and hope'}.
Include ${verse_count || 2} verses${has_chorus !== false ? ', a chorus' : ''}${has_bridge !== false ? ', and a bridge' : ''}.
Make the lyrics poetic, memorable, with strong imagery and emotional depth. Include rhyme scheme notes.`;

    const aiResult = await queryOpenRouter(prompt, 'You are an award-winning songwriter and lyricist. Write compelling, professional-quality lyrics.');
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
