const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.SERVER_PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Security
app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
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
app.use('/api/ai', require('./routes/songPipeline'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`AI Music Generation Server running on port ${PORT}`);
});

// === BATCH 05 AUTO-MOUNT (custom feature suggestions) ===
app.use('/api/music-composer-agent', require('./routes/music-composer-agent'));
app.use('/api/daw-copilot', require('./routes/daw-copilot'));
app.use('/api/remix-agent', require('./routes/remix-agent'));
app.use('/api/producer-vertical-pack', require('./routes/producer-vertical-pack'));
app.use('/api/artist-collab-platform', require('./routes/artist-collab-platform'));

// === Batch 05 Gaps & Frontend Mounts ===
try { const _gap_ai_audio_stem_separator = require('./routes/gap-ai-audio-stem-separator'); app.use('/api/gap-ai-audio-stem-separator', _gap_ai_audio_stem_separator); } catch(e) { console.error('gap mount fail ai-audio-stem-separator:', e.message); }
try { const _gap_ai_mastering_engineer = require('./routes/gap-ai-mastering-engineer'); app.use('/api/gap-ai-mastering-engineer', _gap_ai_mastering_engineer); } catch(e) { console.error('gap mount fail ai-mastering-engineer:', e.message); }
try { const _gap_ai_cover_art_generator = require('./routes/gap-ai-cover-art-generator'); app.use('/api/gap-ai-cover-art-generator', _gap_ai_cover_art_generator); } catch(e) { console.error('gap mount fail ai-cover-art-generator:', e.message); }
try { const _gap_ai_vocal_melody_cloner = require('./routes/gap-ai-vocal-melody-cloner'); app.use('/api/gap-ai-vocal-melody-cloner', _gap_ai_vocal_melody_cloner); } catch(e) { console.error('gap mount fail ai-vocal-melody-cloner:', e.message); }
try { const _gap_daw = require('./routes/gap-daw'); app.use('/api/gap-daw', _gap_daw); } catch(e) { console.error('gap mount fail daw:', e.message); }
try { const _gap_audio = require('./routes/gap-audio'); app.use('/api/gap-audio', _gap_audio); } catch(e) { console.error('gap mount fail audio:', e.message); }
try { const _gap_collaboration = require('./routes/gap-collaboration'); app.use('/api/gap-collaboration', _gap_collaboration); } catch(e) { console.error('gap mount fail collaboration:', e.message); }
try { const _gap_distribution = require('./routes/gap-distribution'); app.use('/api/gap-distribution', _gap_distribution); } catch(e) { console.error('gap mount fail distribution:', e.message); }
try { const _gap_royalty = require('./routes/gap-royalty'); app.use('/api/gap-royalty', _gap_royalty); } catch(e) { console.error('gap mount fail royalty:', e.message); }
try { const _gap_music = require('./routes/gap-music'); app.use('/api/gap-music', _gap_music); } catch(e) { console.error('gap mount fail music:', e.message); }
try { const _gap_community = require('./routes/gap-community'); app.use('/api/gap-community', _gap_community); } catch(e) { console.error('gap mount fail community:', e.message); }
try { const _gap_limited = require('./routes/gap-limited'); app.use('/api/gap-limited', _gap_limited); } catch(e) { console.error('gap mount fail limited:', e.message); }
// === End Batch 05 Mounts ===
