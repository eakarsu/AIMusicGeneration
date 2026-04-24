const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/compositions', require('./routes/compositions'));
app.use('/api/remixes', require('./routes/remixes'));
app.use('/api/sound-designs', require('./routes/soundDesigns'));
app.use('/api/lyrics', require('./routes/lyrics'));
app.use('/api/chord-progressions', require('./routes/chordProgressions'));
app.use('/api/melodies', require('./routes/melodies'));
app.use('/api/beat-patterns', require('./routes/beatPatterns'));
app.use('/api/genre-fusions', require('./routes/genreFusions'));
app.use('/api/music-analysis', require('./routes/musicAnalysis'));
app.use('/api/mixing-assistant', require('./routes/mixingAssistant'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🎵 AI Music Generation Server running on port ${PORT}`);
});
