const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function queryOpenRouter(prompt, systemPrompt = 'You are an expert AI music assistant.') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

  if (!apiKey || apiKey === 'your-openrouter-api-key-here') {
    throw new Error('OpenRouter API key is not configured');
  }

  const baseUrl = new URL(process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1');

  const data = JSON.stringify({
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    max_tokens: 2000,
    temperature: 0.8
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: baseUrl.hostname,
      port: baseUrl.port || 443,
      path: `${baseUrl.pathname.replace(/\/$/, '')}/chat/completions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Music Generation'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode < 200 || res.statusCode >= 300 || parsed.error) {
            resolve({
              success: false,
              error: parsed.error.message || 'OpenRouter API error',
              model: model,
              raw: parsed
            });
          } else {
            const content = parsed.choices?.[0]?.message?.content;
            if (!content) {
              return resolve({ success: false, error: 'OpenRouter returned no message content', raw: parsed });
            }
            resolve({
              success: true,
              model: model,
              result: content,
              usage: parsed.usage,
              id: parsed.id
            });
          }
        } catch (e) {
          resolve({ success: false, error: 'Failed to parse response', raw: body });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });

    req.write(data);
    req.end();
  });
}

function generateMockResponse(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('composition') || lowerPrompt.includes('compose')) {
    return "🎼 **AI Composition Suggestion**\n\n**Structure:** Intro (4 bars) → Verse A (8 bars) → Chorus (8 bars) → Verse B (8 bars) → Chorus (8 bars) → Bridge (4 bars) → Final Chorus (8 bars) → Outro (4 bars)\n\n**Key:** C minor\n**Tempo:** 120 BPM\n**Time Signature:** 4/4\n\n**Harmonic Framework:**\n- Verse: Cm - Ab - Eb - Bb\n- Chorus: Ab - Bb - Cm - G\n- Bridge: Fm - Cm - Ddim - G7\n\n**Instrumentation:** Piano lead, strings pad, light percussion, bass synth\n\n**Mood:** Melancholic yet hopeful, building intensity through the bridge.";
  }
  if (lowerPrompt.includes('remix')) {
    return "🔄 **AI Remix Concept**\n\n**Style:** Lo-fi Electronic Rework\n\n**BPM Change:** 128 → 85 BPM (half-time feel)\n\n**Key Modifications:**\n1. Pitch-shift vocals down 2 semitones\n2. Add vinyl crackle & tape saturation\n3. Replace drums with boom-bap pattern\n4. Add Rhodes electric piano chords\n5. Sidechain compress the pad to the kick\n\n**Effects Chain:** Tape delay (1/4 note) → Plate reverb (2.5s) → Subtle chorus\n\n**Arrangement:** Strip to vocals + one melodic element, rebuild with lo-fi textures.";
  }
  if (lowerPrompt.includes('sound') || lowerPrompt.includes('synth')) {
    return "🎛️ **AI Sound Design Patch**\n\n**Type:** Evolving Cinematic Pad\n\n**Oscillators:**\n- OSC 1: Saw wave, -12 cents detune\n- OSC 2: Square wave, +7 cents detune\n- OSC 3: Noise (filtered), low mix\n\n**Filter:** Low-pass 24dB, Cutoff: 2.4kHz, Resonance: 30%\n**Envelope:** A: 1.2s, D: 0.8s, S: 65%, R: 3.5s\n\n**Modulation:**\n- LFO1 → Filter cutoff (slow sine, 0.3Hz)\n- LFO2 → OSC2 pitch (triangle, 0.1Hz, subtle)\n- Envelope → Filter cutoff (positive)\n\n**Effects:** Chorus → Reverb (Hall, 4s) → Delay (1/8 dotted)";
  }
  if (lowerPrompt.includes('lyric') || lowerPrompt.includes('lyrics') || lowerPrompt.includes('words')) {
    return "✍️ **AI Generated Lyrics**\n\n**Verse 1:**\nUnderneath the neon glow\nWe find the rhythm, let it flow\nEvery heartbeat tells a story\nIn the silence, finding glory\n\n**Chorus:**\nWe are the music in the night\nDancing through the fading light\nEvery note a constellation\nWe're the sound of liberation\n\n**Verse 2:**\nThrough the static, hear the call\nMelodies that never fall\nIn the spaces between sound\nThat's where we are finally found\n\n**Bridge:**\nTurn it up, let the bass resonate\nFeel the pulse, it's never too late\nIn this moment, we're alive\nIn this rhythm, we survive";
  }
  if (lowerPrompt.includes('chord') || lowerPrompt.includes('harmony') || lowerPrompt.includes('progression')) {
    return "🎹 **AI Chord Progression**\n\n**Style:** Neo-Soul / Jazz Fusion\n**Key:** Eb Major\n**Tempo:** 92 BPM\n\n**Progression (8 bars):**\n| EbMaj9 | Cm11 | AbMaj7 | Bb13 |\n| Gm7 | Cm9 | Fm9 | Bb7(#11) |\n\n**Voice Leading Notes:**\n- Bar 1→2: Hold Bb as common tone\n- Bar 3→4: Chromatic bass movement Ab→Bb\n- Bar 5→6: Drop the 3rd of Gm7 to the root of Cm9\n\n**Rhythm Pattern:** Dotted quarter on beat 1, eighth notes on the & of 2 and 3\n\n**Substitution Options:**\n- Bar 3: Try Db7 for a tritone sub\n- Bar 8: Bdim7 for chromatic approach to bar 1";
  }
  if (lowerPrompt.includes('melody') || lowerPrompt.includes('melodic') || lowerPrompt.includes('tune')) {
    return "🎵 **AI Melody Generation**\n\n**Key:** A minor\n**Scale:** Natural Minor with occasional Dorian #6\n**Range:** A3 to E5\n**Tempo:** 110 BPM\n\n**Phrase 1 (4 bars):**\nA4 - C5 - B4 - A4 | G4 - A4 - E4 - (rest) | F4 - G4 - A4 - C5 | B4 - A4 - (half note)\n\n**Phrase 2 (4 bars):**\nE5 - D5 - C5 - B4 | A4 - G4 - F#4 - G4 | A4 - B4 - C5 - D5 | E5 - (whole note)\n\n**Rhythmic Motif:** Syncopated eighth note pattern with dotted quarter emphasis\n\n**Contour:** Arch shape - ascending in phrase 1, peak and descend in phrase 2\n\n**Embellishments:** Grace notes on beat 3 of bars 2 and 6, trill on the final whole note";
  }
  if (lowerPrompt.includes('beat') || lowerPrompt.includes('drum') || lowerPrompt.includes('rhythm') || lowerPrompt.includes('pattern')) {
    return "🥁 **AI Beat Pattern**\n\n**Genre:** Trap / Future Bass Hybrid\n**BPM:** 140 (half-time feel at 70)\n\n**Kick Pattern:**\n`X...X...X.....X.`\n`X...X...X...X.X.`\n\n**Snare/Clap:**\n`....X.......X...`\n`....X.......X..X`\n\n**Hi-Hats:**\n`X.X.X.X.X.X.X.X.`\n`X.XXX.X.X.XXX.X.` (with rolls)\n\n**808 Bass:** Follow kick pattern, pitch: C2, glide on bar 2 beat 4\n\n**Percs:** Rim shot on & of 2, shaker 16ths panned L/R\n\n**Fills:** 32nd note hi-hat rolls every 4 bars, snare build on bar 8\n\n**Mix Notes:** Heavy sidechain on hi-hats, 808 mono below 200Hz";
  }
  if (lowerPrompt.includes('genre') || lowerPrompt.includes('fusion') || lowerPrompt.includes('blend') || lowerPrompt.includes('mix')) {
    return "🌍 **AI Genre Fusion Concept**\n\n**Fusion:** Jazz × Drum & Bass\n\n**Foundation:** 174 BPM breakbeat pattern with jazz brush snare layers\n\n**Harmonic Layer:**\n- Walking bass synth following jazz changes\n- Rhodes chords: ii-V-I progressions in Bb\n- Reese bass underneath for DnB weight\n\n**Melodic Elements:**\n- Saxophone lead (or sampled) with delay throws\n- Piano comping in the mid-range\n- Atmospheric pads bridging genres\n\n**Production Techniques:**\n1. Time-stretch jazz samples to DnB tempo\n2. Layer acoustic drum breaks under programmed beats\n3. Use jazz voicings in synth patches\n4. Add sub-bass following root notes\n5. Swing the hi-hats at 60% for jazz feel\n\n**Reference Artists:** London Elektricity, Makoto, Calibre";
  }
  if (lowerPrompt.includes('analy') || lowerPrompt.includes('analyze') || lowerPrompt.includes('analysis')) {
    return "📊 **AI Music Analysis**\n\n**Structural Analysis:**\n- Form: AABA (32-bar standard)\n- Sections detected: Intro, Verse, Pre-Chorus, Chorus, Bridge, Outro\n- Total duration estimate: 3:45\n\n**Harmonic Analysis:**\n- Key: G Major (with modal mixture from G Mixolydian)\n- Chord complexity: Moderate (diatonic with secondary dominants)\n- Tension points: Bar 12 (V/V), Bar 24 (bVII borrowed chord)\n\n**Rhythmic Analysis:**\n- Time signature: 4/4\n- Groove type: Straight 8ths with push on beat 4\n- Syncopation level: Medium\n\n**Timbral Profile:**\n- Frequency balance: Mid-heavy (vocal-focused)\n- Instrumentation density: 6-8 simultaneous elements\n- Dynamic range: 8 dB (moderately compressed)\n\n**Mood Indicators:** Uplifting, energetic, nostalgic undertones";
  }
  if (lowerPrompt.includes('mix') || lowerPrompt.includes('master') || lowerPrompt.includes('eq') || lowerPrompt.includes('compress')) {
    return "🎚️ **AI Mixing & Mastering Guide**\n\n**EQ Recommendations:**\n- Kick: Boost 60Hz (+3dB), Cut 400Hz (-4dB), Click at 4kHz (+2dB)\n- Snare: Body at 200Hz, Crack at 2kHz, Air at 10kHz\n- Vocals: HPF at 80Hz, Presence 3-5kHz (+2dB), De-ess 6-8kHz\n- Bass: Sub 40-80Hz, Cut 250Hz mud, Harmonics 800Hz-1kHz\n\n**Compression Settings:**\n- Drums bus: Ratio 4:1, Attack 10ms, Release 100ms\n- Vocals: Ratio 3:1, Attack 5ms, Release 50ms (+ parallel compression)\n- Master bus: Ratio 2:1, Attack 30ms, Release auto\n\n**Spatial Placement:**\n- Center: Kick, Snare, Bass, Lead Vocal\n- Slight L/R: Guitars, Keys, Backing Vocals\n- Wide: Pads, Reverb returns, Stereo delays\n\n**Mastering Chain:** EQ → Multiband Comp → Stereo Width → Limiter (-1dB ceiling)\n\n**Target Loudness:** -14 LUFS (streaming optimized)";
  }
  return "🎵 **AI Music Assistant Response**\n\nI've analyzed your request and here are my suggestions:\n\n1. **Tempo:** 120 BPM in 4/4 time\n2. **Key:** C minor for emotional depth\n3. **Structure:** Verse-Chorus-Verse-Chorus-Bridge-Chorus\n4. **Instrumentation:** Start minimal, build layers\n5. **Production tip:** Use parallel compression for punch\n\nWould you like me to elaborate on any specific aspect?";
}

function parseAIJson(text) {
  if (!text) return null;
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) return JSON.parse(text.slice(start, end + 1));
    return JSON.parse(text);
  } catch { return null; }
}

module.exports = { queryOpenRouter, parseAIJson };
