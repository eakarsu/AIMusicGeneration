'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters');
}

const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  credentials: true,
  origin: (origin, callback) => (
    !origin || allowedOrigins.includes(origin)
      ? callback(null, true)
      : callback(new Error('origin not allowed'))
  ),
}));
app.use(express.json({ limit: '2mb' }));

const { authenticateToken } = require('./middleware/auth');

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'ai-music-generation' }));
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
app.use('/api/ai', require('./routes/songPipeline'));
app.use('/api/governed-creation', require('./routes/governedCreation')(authenticateToken));
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

const port = Number(process.env.SERVER_PORT || 3001);
app.listen(port, '127.0.0.1', () => console.log(`AI music API listening on ${port}`));
