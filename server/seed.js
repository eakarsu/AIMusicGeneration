const { Pool } = require('pg');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ai_music_generation',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  const client = await pool.connect();
  try {
    // Drop and recreate all tables
    await client.query(`
      DROP TABLE IF EXISTS mixing_assistant CASCADE;
      DROP TABLE IF EXISTS music_analysis CASCADE;
      DROP TABLE IF EXISTS genre_fusions CASCADE;
      DROP TABLE IF EXISTS beat_patterns CASCADE;
      DROP TABLE IF EXISTS melodies CASCADE;
      DROP TABLE IF EXISTS chord_progressions CASCADE;
      DROP TABLE IF EXISTS lyrics CASCADE;
      DROP TABLE IF EXISTS sound_designs CASCADE;
      DROP TABLE IF EXISTS remixes CASCADE;
      DROP TABLE IF EXISTS compositions CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 1. Compositions
    await client.query(`
      CREATE TABLE compositions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        genre VARCHAR(100),
        key_signature VARCHAR(20),
        tempo INTEGER,
        time_signature VARCHAR(10),
        mood VARCHAR(100),
        instruments TEXT,
        structure TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Remixes
    await client.query(`
      CREATE TABLE remixes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        original_track VARCHAR(255),
        remix_style VARCHAR(100),
        target_bpm INTEGER,
        target_key VARCHAR(20),
        effects TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. Sound Designs
    await client.query(`
      CREATE TABLE sound_designs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        synth_type VARCHAR(100),
        category VARCHAR(100),
        oscillators TEXT,
        filter_settings TEXT,
        envelope TEXT,
        modulation TEXT,
        effects TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. Lyrics
    await client.query(`
      CREATE TABLE lyrics (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        genre VARCHAR(100),
        mood VARCHAR(100),
        theme VARCHAR(255),
        verse_count INTEGER DEFAULT 2,
        has_chorus BOOLEAN DEFAULT true,
        has_bridge BOOLEAN DEFAULT true,
        language VARCHAR(50) DEFAULT 'English',
        lyrics_text TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. Chord Progressions
    await client.query(`
      CREATE TABLE chord_progressions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        key_signature VARCHAR(20),
        scale_type VARCHAR(50),
        style VARCHAR(100),
        complexity VARCHAR(50),
        bars INTEGER DEFAULT 8,
        progression_text TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 6. Melodies
    await client.query(`
      CREATE TABLE melodies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        key_signature VARCHAR(20),
        scale_type VARCHAR(50),
        tempo INTEGER,
        range_low VARCHAR(10),
        range_high VARCHAR(10),
        style VARCHAR(100),
        contour VARCHAR(50),
        melody_notation TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 7. Beat Patterns
    await client.query(`
      CREATE TABLE beat_patterns (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        genre VARCHAR(100),
        bpm INTEGER,
        time_signature VARCHAR(10),
        swing_amount INTEGER DEFAULT 0,
        kick_pattern TEXT,
        snare_pattern TEXT,
        hihat_pattern TEXT,
        percussion TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 8. Genre Fusions
    await client.query(`
      CREATE TABLE genre_fusions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        genre_a VARCHAR(100),
        genre_b VARCHAR(100),
        tempo INTEGER,
        key_signature VARCHAR(20),
        fusion_approach TEXT,
        elements TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 9. Music Analysis
    await client.query(`
      CREATE TABLE music_analysis (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        track_name VARCHAR(255),
        artist VARCHAR(255),
        genre VARCHAR(100),
        analysis_type VARCHAR(100),
        key_detected VARCHAR(20),
        bpm_detected INTEGER,
        structure_notes TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'complete',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 10. Mixing Assistant
    await client.query(`
      CREATE TABLE mixing_assistant (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        project_type VARCHAR(100),
        track_count INTEGER,
        genre VARCHAR(100),
        target_loudness VARCHAR(50),
        eq_notes TEXT,
        compression_notes TEXT,
        spatial_notes TEXT,
        master_chain TEXT,
        description TEXT,
        ai_output TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Insert default user (password: password123)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (email, password, name) VALUES
      ('admin@aimusic.com', $1, 'Music Producer');
    `, [hashedPassword]);

    // Seed Compositions (15 items)
    await client.query(`
      INSERT INTO compositions (title, genre, key_signature, tempo, time_signature, mood, instruments, structure, description, status) VALUES
      ('Midnight Sonata', 'Classical Crossover', 'C Minor', 72, '3/4', 'Melancholic', 'Piano, Strings, Cello', 'ABA', 'A modern take on classical sonata form with electronic elements', 'published'),
      ('Neon Pulse', 'Synthwave', 'A Minor', 128, '4/4', 'Energetic', 'Analog Synths, Drum Machine, Bass', 'Verse-Chorus-Bridge', 'Retro-futuristic synthwave composition with driving basslines', 'published'),
      ('Ocean Breath', 'Ambient', 'D Major', 60, '4/4', 'Peaceful', 'Pads, Field Recordings, Guitar', 'Free-form', 'Ambient seascape with layered textures and gentle guitar melodies', 'draft'),
      ('Urban Jungle', 'Hip Hop', 'G Minor', 90, '4/4', 'Aggressive', '808, Piano, Brass', 'Verse-Hook-Verse', 'Hard-hitting hip hop beat with orchestral brass stabs', 'published'),
      ('Cherry Blossom', 'Lo-fi', 'F Major', 75, '4/4', 'Nostalgic', 'Rhodes, Vinyl Crackle, Soft Drums', 'Loop-based', 'Lo-fi hip hop track with Japanese-inspired melodies', 'published'),
      ('Thunderstrike', 'EDM', 'E Minor', 150, '4/4', 'Powerful', 'Supersaw, Sub Bass, Percussion', 'Build-Drop-Build-Drop', 'Festival-ready EDM anthem with massive drops', 'draft'),
      ('Velvet Dreams', 'R&B', 'Bb Major', 85, '4/4', 'Sensual', 'Vocals, Keys, Bass Guitar', 'Verse-Pre-Chorus-Chorus', 'Smooth R&B ballad with lush vocal harmonies', 'published'),
      ('Quantum Leap', 'Progressive Rock', 'B Minor', 140, '7/8', 'Epic', 'Guitar, Drums, Synth, Bass', 'Through-composed', 'Complex progressive rock piece with odd time signatures', 'draft'),
      ('Sahara Wind', 'World Fusion', 'D Minor', 110, '4/4', 'Mystical', 'Oud, Tabla, Synth Pads', 'ABAC', 'Middle Eastern melodies fused with electronic production', 'published'),
      ('Crystal Cave', 'New Age', 'E Major', 65, '6/8', 'Ethereal', 'Crystal Bowls, Flute, Harp', 'Meditative', 'Healing music with crystal singing bowl resonances', 'published'),
      ('Broken Circuit', 'Glitch Hop', 'F# Minor', 108, '4/4', 'Quirky', 'Glitch FX, Wonky Bass, Drums', 'Verse-Drop-Verse', 'Experimental glitch hop with chopped vocal samples', 'draft'),
      ('Sunrise Protocol', 'Trance', 'A Minor', 138, '4/4', 'Uplifting', 'Supersaw, Pluck, Pads, Arps', 'Intro-Build-Climax-Break', 'Uplifting trance with euphoric melodies and driving energy', 'published'),
      ('Rust and Gold', 'Folk Electronic', 'G Major', 95, '4/4', 'Warm', 'Acoustic Guitar, Banjo, Synth', 'Verse-Chorus', 'Folk melodies enhanced with subtle electronic textures', 'published'),
      ('Dark Matter', 'Industrial', 'C# Minor', 135, '4/4', 'Dark', 'Distorted Synths, Metal Percussion', 'Linear', 'Heavy industrial track with crushing sound design', 'draft'),
      ('Carnival of Lights', 'Latin Electronic', 'D Major', 122, '4/4', 'Joyful', 'Congas, Trumpet, Synth Bass', 'Verse-Chorus-Bridge', 'Latin rhythms meet electronic production for dance floors', 'published');
    `);

    // Seed Remixes (15 items)
    await client.query(`
      INSERT INTO remixes (title, original_track, remix_style, target_bpm, target_key, effects, description, status) VALUES
      ('Midnight Sonata (Club Mix)', 'Midnight Sonata', 'Club/Dance', 126, 'C Minor', 'Sidechain compression, build-ups, drops', 'Dance floor rework of the classical piece', 'published'),
      ('Neon Pulse (Chillwave)', 'Neon Pulse', 'Chillwave', 85, 'A Minor', 'Tape saturation, chorus, reverb wash', 'Slowed down dreamy version with washed out textures', 'published'),
      ('Ocean Breath (Deep House)', 'Ocean Breath', 'Deep House', 122, 'D Major', 'Subtle compression, warm saturation', 'Deep house remix keeping the ambient atmosphere', 'draft'),
      ('Urban Jungle (Trap Remix)', 'Urban Jungle', 'Trap', 140, 'G Minor', 'Heavy 808, pitch-shifted vocals, risers', 'Aggressive trap rework with half-time feel', 'published'),
      ('Cherry Blossom (Jazz Remix)', 'Cherry Blossom', 'Jazz', 95, 'F Major', 'Reverb, tape delay, vinyl warmth', 'Jazz club arrangement with live instrument feel', 'published'),
      ('Thunderstrike (DnB Remix)', 'Thunderstrike', 'Drum and Bass', 174, 'E Minor', 'Distortion, amens, reese bass', 'High-energy drum and bass rework', 'draft'),
      ('Velvet Dreams (Acoustic)', 'Velvet Dreams', 'Acoustic', 80, 'Bb Major', 'Room reverb, compression', 'Stripped back acoustic version with raw vocals', 'published'),
      ('Quantum Leap (Dubstep)', 'Quantum Leap', 'Dubstep', 140, 'B Minor', 'Wobble bass, heavy distortion, risers', 'Heavy dubstep interpretation of the prog rock original', 'published'),
      ('Sahara Wind (Techno)', 'Sahara Wind', 'Techno', 130, 'D Minor', 'Delay throws, industrial reverb', 'Dark techno remix with Middle Eastern vocal chops', 'draft'),
      ('Crystal Cave (Downtempo)', 'Crystal Cave', 'Downtempo', 90, 'E Major', 'Granular synthesis, shimmer reverb', 'Downtempo electronic version with glitchy textures', 'published'),
      ('Broken Circuit (House)', 'Broken Circuit', 'House', 124, 'F# Minor', 'Phaser, filter sweeps, sidechain', 'Groovy house remix with funky bassline', 'published'),
      ('Sunrise Protocol (Psytrance)', 'Sunrise Protocol', 'Psytrance', 145, 'A Minor', 'TB-303, acid lines, gated reverb', 'Psychedelic trance interpretation with acid elements', 'draft'),
      ('Rust and Gold (Indie Dance)', 'Rust and Gold', 'Indie Dance', 115, 'G Major', 'Chorus, tremolo, analog warmth', 'Indie dance remix keeping the folk charm', 'published'),
      ('Dark Matter (Hardstyle)', 'Dark Matter', 'Hardstyle', 150, 'C# Minor', 'Distorted kick, reverse bass, screeches', 'Extreme hardstyle version with reverse bass', 'published'),
      ('Carnival (Afrobeats)', 'Carnival of Lights', 'Afrobeats', 108, 'D Major', 'Log drums, shakers, vocal chops', 'Afrobeats fusion remix with dancehall influences', 'draft');
    `);

    // Seed Sound Designs (15 items)
    await client.query(`
      INSERT INTO sound_designs (title, synth_type, category, oscillators, filter_settings, envelope, modulation, effects, description, status) VALUES
      ('Massive Supersaw', 'Subtractive', 'Lead', '7x Saw detuned ±25 cents', 'LP 24dB, Cutoff 4kHz, Res 20%', 'A:5ms D:200ms S:80% R:300ms', 'LFO→Pitch subtle vibrato', 'Chorus, Reverb, OTT', 'Classic trance/EDM supersaw lead sound', 'published'),
      ('Deep Sub Bass', 'Subtractive', 'Bass', 'Sine + Triangle sub', 'LP 12dB, Cutoff 200Hz, Res 0%', 'A:10ms D:500ms S:70% R:200ms', 'Envelope→Filter', 'Saturation, Compressor', 'Clean deep sub bass for hip hop and electronic', 'published'),
      ('Ethereal Pad', 'Wavetable', 'Pad', 'WT: Vocal formants, detuned', 'BP 12dB, Cutoff 1.5kHz, Res 35%', 'A:2s D:1s S:60% R:4s', 'LFO→WT Position, LFO→Pan', 'Reverb (6s), Shimmer Delay', 'Evolving atmospheric pad for ambient music', 'draft'),
      ('Acid Squelch', 'Subtractive', 'Bass', 'Single Saw', 'LP 24dB, Cutoff 800Hz, Res 80%', 'A:1ms D:300ms S:0% R:50ms', 'Envelope→Filter (high amount)', 'Distortion, Delay', 'Classic TB-303 acid bass sound', 'published'),
      ('Crystal Pluck', 'FM Synthesis', 'Pluck', '2-op FM, Ratio 1:3', 'LP 24dB, Cutoff 3kHz, Res 10%', 'A:1ms D:400ms S:0% R:500ms', 'Velocity→FM Amount', 'Chorus, Plate Reverb', 'Bright FM pluck for melodic sequences', 'published'),
      ('Cinematic Drone', 'Granular', 'Texture', 'Granular: orchestral sample', 'LP+HP Band 200Hz-2kHz', 'A:5s D:0 S:100% R:8s', 'LFO→Grain Position, LFO→Size', 'Convolution Reverb, EQ', 'Dark cinematic drone for film scoring', 'draft'),
      ('Wobble Bass', 'Wavetable', 'Bass', 'WT: Square variants', 'LP 24dB, Cutoff 2kHz, Res 40%', 'A:5ms D:100ms S:90% R:100ms', 'LFO→Filter (1/4 note sync)', 'Distortion, Compressor', 'Classic dubstep wobble bass with LFO sync', 'published'),
      ('Glass Bell', 'Additive', 'Keys', 'Partials 1,3,5,7,9 (bell ratios)', 'HP 6dB at 500Hz', 'A:2ms D:3s S:10% R:4s', 'Velocity→Brightness', 'Reverb, Stereo Widener', 'Delicate glass bell sound for ambient textures', 'published'),
      ('Reese Bass', 'Subtractive', 'Bass', '2x Saw, heavy detune ±50 cents', 'LP 24dB, Cutoff 1kHz, Res 15%', 'A:20ms D:0 S:100% R:200ms', 'LFO→Detune amount (slow)', 'Chorus, Distortion, EQ', 'Thick reese bass for DnB and neurofunk', 'published'),
      ('Vocal Chop Synth', 'Sampler', 'Vocal', 'Sliced vocal phrases mapped', 'LP 12dB, Cutoff varies', 'A:5ms D:100ms S:50% R:200ms', 'LFO→Pan, Seq→Slice', 'Glitch, Delay, Reverb', 'Chopped vocal synthesis for future bass', 'draft'),
      ('Analog Brass', 'Subtractive', 'Brass', '2x Saw + 1x Pulse (PWM)', 'LP 24dB, Cutoff 1.5kHz, Res 25%', 'A:50ms D:200ms S:70% R:300ms', 'LFO→PWM, Velocity→Filter', 'Chorus, Saturation', 'Warm analog brass ensemble sound', 'published'),
      ('Granular Texture', 'Granular', 'Texture', 'Granular: metal scrape sample', 'BP 12dB, Cutoff sweep', 'A:3s D:2s S:50% R:5s', 'Random→Position, LFO→Density', 'Reverb (8s), Pitch Shift', 'Evolving industrial texture from granular processing', 'draft'),
      ('Chip Lead', '8-bit', 'Lead', 'Pulse wave 25% duty cycle', 'None (raw)', 'A:1ms D:0 S:100% R:10ms', 'Arp→Pitch (16th notes)', 'Bit Crusher, Delay', 'Retro 8-bit chiptune lead for game music', 'published'),
      ('Storm FX', 'Noise', 'SFX', 'White + Pink noise layers', 'BP sweep 100Hz-8kHz', 'A:4s D:2s S:30% R:6s', 'LFO→Filter (random), Env→Pitch', 'Reverb, Flanger, Delay', 'Weather sound effect with building intensity', 'published'),
      ('Warm Keys', 'Subtractive', 'Keys', 'Saw + Triangle layered', 'LP 12dB, Cutoff 2kHz, Res 10%', 'A:10ms D:1s S:40% R:500ms', 'Velocity→Filter, Aftertouch→Vibrato', 'Chorus, Tape Saturation', 'Vintage electric piano style warm keys', 'published');
    `);

    // Seed Lyrics (15 items)
    await client.query(`
      INSERT INTO lyrics (title, genre, mood, theme, verse_count, has_chorus, has_bridge, language, lyrics_text, description, status) VALUES
      ('Echoes of Tomorrow', 'Pop', 'Hopeful', 'Future and dreams', 2, true, true, 'English', 'Verse 1:\nStanding at the edge of time\nEvery star is yours and mine\nWe paint the sky with hopeful signs\nLeaving yesterday behind', 'Uplifting pop song about embracing the future', 'published'),
      ('Concrete Garden', 'Hip Hop', 'Reflective', 'Urban life', 3, true, true, 'English', 'Verse 1:\nGrowing up between the cracks\nConcrete jungle, no looking back\nStreetlights guide my midnight walk\nWalls tell stories if they could talk', 'Introspective hip hop about city life', 'published'),
      ('Wildfire Heart', 'Rock', 'Passionate', 'Love and intensity', 2, true, true, 'English', 'Verse 1:\nYou set my world ablaze\nA wildfire in the haze\nBurning through my darkest days\nIn a hundred different ways', 'Passionate rock anthem about intense love', 'draft'),
      ('Neon Tears', 'Synthpop', 'Melancholic', 'Heartbreak', 2, true, false, 'English', 'Verse 1:\nCity lights blur through the rain\nDigital love, analog pain\nYour hologram still haunts this place\nNeon tears run down my face', 'Retro synthpop heartbreak ballad', 'published'),
      ('Roots Run Deep', 'Folk', 'Warm', 'Heritage and family', 3, true, true, 'English', 'Verse 1:\nOld oak tree in grandpa''s yard\nCarved our names, left our mark\nSeasons change but roots run deep\nPromises we swore to keep', 'Folk song about family traditions', 'published'),
      ('Bass Drop Anthem', 'EDM', 'Energetic', 'Party and freedom', 1, true, false, 'English', 'Verse:\nHands up to the ceiling\nCan you feel this feeling\nBass drops heavy, crowd goes wild\nWe are freedom''s children', 'High-energy EDM anthem for festivals', 'published'),
      ('Moonlight Serenade', 'Jazz', 'Romantic', 'Romance under moonlight', 2, true, true, 'English', 'Verse 1:\nMoonlight paints the garden white\nSaxophone plays through the night\nDarling, take my hand and sway\nLet the music lead the way', 'Romantic jazz standard about moonlit evenings', 'draft'),
      ('Digital Dystopia', 'Industrial', 'Dark', 'Technology and control', 3, true, true, 'English', 'Verse 1:\nScreens replace the open sky\nAlgorithms decide who lives or dies\nFeed the machine your data stream\nNothing left but the digital dream', 'Dark industrial track about tech dystopia', 'published'),
      ('Island Breeze', 'Reggae', 'Relaxed', 'Island life and peace', 2, true, true, 'English', 'Verse 1:\nSun coming up over the bay\nNo worries gonna spoil this day\nCoconut trees sway side to side\nLet the island be your guide', 'Laid-back reggae about tropical living', 'published'),
      ('War Paint', 'Metal', 'Fierce', 'Battle and strength', 3, true, true, 'English', 'Verse 1:\nSteel and thunder, blood and flame\nWriting history, carving names\nShields up high, the battle cry\nWe will never say goodbye', 'Epic metal anthem about warriors', 'draft'),
      ('Stardust Lullaby', 'Dream Pop', 'Dreamy', 'Dreams and space', 2, true, true, 'English', 'Verse 1:\nFloat among the distant stars\nLeave behind your earthly scars\nStardust falling through your hair\nDreaming without any care', 'Ethereal dream pop lullaby', 'published'),
      ('Hustle Hard', 'Trap', 'Determined', 'Ambition and success', 3, true, false, 'English', 'Verse 1:\nStarted from the basement floor\nNow I''m knocking on every door\nDiamonds dripping, vision clear\nThey gon'' know my name this year', 'Motivational trap track about grinding', 'published'),
      ('Autumn Letters', 'Indie', 'Bittersweet', 'Nostalgia and change', 2, true, true, 'English', 'Verse 1:\nLeaves like letters falling down\nOrange whispers paint the town\nI found your photo in my coat\nAnd the words you never wrote', 'Indie song about autumn nostalgia', 'published'),
      ('Sacred Ground', 'Gospel', 'Spiritual', 'Faith and redemption', 2, true, true, 'English', 'Verse 1:\nWalking through the valley low\nGrace will guide me, this I know\nEvery step on sacred ground\nIn His love I have been found', 'Uplifting gospel about faith journey', 'draft'),
      ('Voltage', 'Electropop', 'Excited', 'Electric connection', 2, true, true, 'English', 'Verse 1:\nSparks fly when our eyes connect\nElectric current, cause and effect\nVoltage rising through my veins\nYou short-circuit all my pain', 'Electropop song about electric chemistry', 'published');
    `);

    // Seed Chord Progressions (15 items)
    await client.query(`
      INSERT INTO chord_progressions (title, key_signature, scale_type, style, complexity, bars, progression_text, description, status) VALUES
      ('Classic Pop Four', 'C Major', 'Major', 'Pop', 'Simple', 4, 'C - G - Am - F', 'The most popular chord progression in pop music', 'published'),
      ('Jazz ii-V-I', 'Bb Major', 'Major', 'Jazz', 'Advanced', 4, 'Cm7 - F7 - BbMaj7 - BbMaj7', 'Essential jazz cadence pattern', 'published'),
      ('Emotional Minor', 'A Minor', 'Natural Minor', 'Ballad', 'Intermediate', 8, 'Am - F - C - G | Am - Dm - E7 - Am', 'Emotional minor key progression for ballads', 'published'),
      ('12-Bar Blues', 'E Major', 'Blues Scale', 'Blues', 'Simple', 12, 'E7 - E7 - E7 - E7 | A7 - A7 - E7 - E7 | B7 - A7 - E7 - B7', 'Traditional 12-bar blues form', 'published'),
      ('Neo Soul Groove', 'Eb Major', 'Major', 'Neo Soul', 'Advanced', 8, 'EbMaj9 - Cm11 - AbMaj7 - Bb13 | Gm7 - Cm9 - Fm9 - Bb7#11', 'Rich neo-soul progression with extended chords', 'draft'),
      ('Dark Trap', 'F# Minor', 'Minor', 'Trap', 'Simple', 4, 'F#m - D - A - E', 'Moody trap progression with cinematic feel', 'published'),
      ('Bossa Nova Classic', 'C Major', 'Major', 'Bossa Nova', 'Advanced', 8, 'CMaj7 - C#dim7 - Dm7 - G7 | Em7 - A7b9 - Dm7 - G7', 'Authentic bossa nova harmony', 'published'),
      ('Epic Cinematic', 'D Minor', 'Minor', 'Film Score', 'Intermediate', 8, 'Dm - Bb - F - C | Dm - Gm - A - Dm', 'Powerful cinematic progression for trailers', 'published'),
      ('Lofi Chill', 'F Major', 'Major', 'Lo-fi', 'Intermediate', 4, 'FMaj7 - Em7 - Dm7 - CMaj7', 'Descending major 7th chords for lo-fi beats', 'draft'),
      ('Progressive Metal', 'B Minor', 'Minor', 'Metal', 'Advanced', 8, 'Bm - G - D/F# - Em | Bm - F#7 - G - A', 'Complex prog metal progression with key changes', 'published'),
      ('Reggae Skank', 'G Major', 'Major', 'Reggae', 'Simple', 4, 'G - C - D - C', 'Classic reggae rhythm chord pattern', 'published'),
      ('Modal Interchange', 'C Major', 'Mixed', 'Alternative', 'Advanced', 8, 'C - Ab - Bb - F | C - Eb - Bb - G', 'Borrowing chords from parallel minor for color', 'draft'),
      ('Country Two-Step', 'D Major', 'Major', 'Country', 'Simple', 8, 'D - A - G - D | D - G - A - D', 'Traditional country progression', 'published'),
      ('Funk Groove', 'E Minor', 'Dorian', 'Funk', 'Intermediate', 4, 'Em9 - A13 - Em9 - A13', 'Two-chord funk vamp with Dorian flavor', 'published'),
      ('Worship Anthem', 'G Major', 'Major', 'Worship', 'Simple', 8, 'G - D/F# - Em - C | G - D - C - G', 'Contemporary worship progression with bass movement', 'published');
    `);

    // Seed Melodies (15 items)
    await client.query(`
      INSERT INTO melodies (title, key_signature, scale_type, tempo, range_low, range_high, style, contour, melody_notation, description, status) VALUES
      ('Morning Light', 'C Major', 'Major Pentatonic', 100, 'C4', 'G5', 'Pop', 'Ascending', 'C4-E4-G4-C5-E5-D5-C5-G4', 'Bright uplifting pop melody', 'published'),
      ('Shadow Dance', 'A Minor', 'Natural Minor', 120, 'A3', 'E5', 'Electronic', 'Arch', 'A3-C4-E4-A4-E5-D5-B4-A4', 'Dark electronic melody with dramatic arch', 'published'),
      ('Golden Hour', 'D Major', 'Major', 85, 'D4', 'A5', 'Indie', 'Wave', 'D4-F#4-A4-D5-B4-G4-A4-D5', 'Warm indie melody reminiscent of sunset', 'draft'),
      ('Street Corner', 'G Minor', 'Blues Scale', 92, 'G3', 'D5', 'Blues', 'Descending', 'D5-Bb4-G4-F4-Eb4-D4-G3-G4', 'Soulful blues melody with classic bends', 'published'),
      ('Cloud Nine', 'E Major', 'Lydian', 110, 'E4', 'B5', 'Dream Pop', 'Floating', 'E4-G#4-A#4-B4-E5-B5-G#5-E5', 'Dreamy lydian melody that floats ethereally', 'published'),
      ('Iron March', 'C Minor', 'Minor', 140, 'C3', 'G4', 'Orchestral', 'Stepwise', 'C3-D3-Eb3-F3-G3-Ab3-G3-C4', 'Powerful marching orchestral theme', 'published'),
      ('Sakura Breeze', 'F Major', 'Pentatonic', 70, 'F4', 'C6', 'World', 'Ornamental', 'F4-A4-C5-F5-A5-G5-F5-C5', 'Japanese-inspired pentatonic melody', 'draft'),
      ('Velocity', 'B Minor', 'Harmonic Minor', 160, 'B3', 'F#5', 'Metal', 'Angular', 'B3-D4-F#4-A#4-B4-F#5-E5-B4', 'Fast angular metal melody with harmonic minor', 'published'),
      ('Lullaby Moon', 'Ab Major', 'Major', 60, 'Ab3', 'Eb5', 'Classical', 'Gentle Arc', 'Ab3-C4-Eb4-Ab4-Bb4-Ab4-F4-Eb4', 'Gentle lullaby in classical style', 'published'),
      ('Neon Runner', 'E Minor', 'Minor Pentatonic', 135, 'E3', 'B4', 'Synthwave', 'Repetitive', 'E3-G3-A3-B3-E4-B3-A3-G3', 'Driving synthwave melody with retro feel', 'published'),
      ('Desert Mirage', 'D Minor', 'Phrygian', 105, 'D4', 'A5', 'World Fusion', 'Meandering', 'D4-Eb4-G4-A4-D5-C5-Bb4-A4', 'Exotic phrygian melody evoking desert landscapes', 'draft'),
      ('Pixel Adventure', 'C Major', 'Major', 150, 'C4', 'C6', '8-bit', 'Bouncy', 'C4-E4-G4-C5-G5-E5-C5-G4', 'Cheerful 8-bit game melody', 'published'),
      ('Midnight Jazz', 'Bb Major', 'Bebop', 180, 'Bb3', 'F5', 'Jazz', 'Chromatic', 'Bb3-D4-F4-Ab4-A4-Bb4-D5-C5', 'Bebop jazz melody with chromatic passing tones', 'published'),
      ('Tidal Wave', 'F# Minor', 'Aeolian', 128, 'F#3', 'C#5', 'Progressive', 'Building', 'F#3-A3-B3-C#4-E4-F#4-A4-C#5', 'Building progressive melody that crescendos', 'published'),
      ('Whisper Song', 'G Major', 'Major', 72, 'G4', 'D5', 'Acoustic', 'Intimate', 'G4-A4-B4-D5-C5-B4-A4-G4', 'Intimate acoustic melody for fingerpicking', 'draft');
    `);

    // Seed Beat Patterns (15 items)
    await client.query(`
      INSERT INTO beat_patterns (title, genre, bpm, time_signature, swing_amount, kick_pattern, snare_pattern, hihat_pattern, percussion, description, status) VALUES
      ('Four on Floor', 'House', 124, '4/4', 0, 'X...X...X...X...', '....X.......X...', 'X.X.X.X.X.X.X.X.', 'Clap on 2&4, ride bell on &s', 'Classic house 4/4 pattern', 'published'),
      ('Boom Bap Classic', 'Hip Hop', 90, '4/4', 60, 'X..X..X.....X...', '....X.......X...', 'X.X.X.X.X.X.X.X.', 'Shaker 16ths, tambourine 8ths', 'Old school hip hop drum pattern', 'published'),
      ('Trap Thunder', 'Trap', 140, '4/4', 0, 'X.......X...X.X.', '....X.......X...', 'X.XXX.X.X.XXX.X.', '808 on kicks, rimshot fills', 'Modern trap beat with hi-hat rolls', 'published'),
      ('Breakbeat Jungle', 'Jungle', 170, '4/4', 30, 'X.X...X.X.....X.', '....X...X.X.X...', 'X.X.X.X.X.X.X.X.', 'Amen break chops, timestretched', 'Classic jungle breakbeat pattern', 'draft'),
      ('Bossa Beat', 'Bossa Nova', 120, '4/4', 40, 'X.....X...X.....', '..........X.....', '..X..X..X..X..X.', 'Rim click on 2, agogo bell', 'Traditional bossa nova rhythm', 'published'),
      ('Rock Solid', 'Rock', 130, '4/4', 0, 'X...X...X...X...', '....X.......X...', 'X.X.X.X.X.X.X.X.', 'Crash on 1 every 4 bars', 'Straightforward rock drum pattern', 'published'),
      ('Reggaeton Dembow', 'Reggaeton', 95, '4/4', 0, 'X..X..X.X..X..X.', '..X...X...X...X.', '....X.......X...', 'Tresillo pattern on toms', 'Classic dembow reggaeton rhythm', 'published'),
      ('Jazz Swing', 'Jazz', 140, '4/4', 70, '........X.......', '....X.......X...', 'X..X.XX..X.XX..X', 'Brush swirl, ride bell on 2&4', 'Traditional jazz swing pattern with brushes', 'draft'),
      ('DnB Roller', 'Drum and Bass', 174, '4/4', 0, 'X.....X.........', '....X.......X...', 'X.X.X.X.X.X.X.X.', 'Ghost snares, ride cymbal 8ths', 'Rolling drum and bass pattern', 'published'),
      ('Afrobeats Groove', 'Afrobeats', 108, '4/4', 30, 'X..X....X..X....', '....X.......X...', '.X.X.X.X.X.X.X.', 'Shaker, log drum, bell pattern', 'Authentic afrobeats drum pattern', 'published'),
      ('Waltz Time', 'Classical', 90, '3/4', 0, 'X.........', '....X.X...', '..X...X...', 'Triangle on beat 1 every 4 bars', 'Elegant 3/4 waltz pattern', 'published'),
      ('Samba Fire', 'Samba', 100, '4/4', 50, 'X..X..X.X..X..X.', '..X.X.....X.X...', 'XXXXXXXXXXXXXXXX', 'Surdo, tamborim, agogo, caixa', 'Full samba batucada pattern', 'draft'),
      ('Halftime Drill', 'UK Drill', 140, '4/4', 0, 'X...........X...', '....X.......X...', 'X.XXX.XXX.XXX.XX', 'Sliding 808, wood block fills', 'UK drill halftime pattern', 'published'),
      ('Disco Fever', 'Disco', 120, '4/4', 0, 'X...X...X...X...', '....X.......X...', '.X.X.X.X.X.X.X.', 'Open hat on upbeats, claps', 'Classic disco beat with open hats', 'published'),
      ('Polyrhythm X', 'Experimental', 120, '4/4', 0, 'X..X..X..X..X..X', '...X...X...X...X', 'X.X.X.X.X.X.X.X.', '3 over 4 bell pattern, shaker 5/4', 'Complex polyrhythmic experimental beat', 'draft');
    `);

    // Seed Genre Fusions (15 items)
    await client.query(`
      INSERT INTO genre_fusions (title, genre_a, genre_b, tempo, key_signature, fusion_approach, elements, description, status) VALUES
      ('Jazz Meets DnB', 'Jazz', 'Drum and Bass', 174, 'Bb Major', 'Jazz harmony over DnB rhythms', 'Walking bass synth, jazz chords, breakbeats, saxophone', 'Liquid DnB with live jazz instrumentation', 'published'),
      ('Country Trap', 'Country', 'Trap', 130, 'G Major', 'Twangy guitars over 808s', 'Banjo, 808 bass, steel guitar, hi-hat rolls', 'Modern country meets trap production', 'published'),
      ('Classical Dubstep', 'Classical', 'Dubstep', 140, 'D Minor', 'Orchestral arrangement with drops', 'Full orchestra, wobble bass, choir, heavy drums', 'Symphonic dubstep with live orchestra feel', 'draft'),
      ('Reggae House', 'Reggae', 'Deep House', 122, 'A Minor', 'Reggae vocals over house groove', 'Dub delays, 4/4 kick, offbeat chords, deep bass', 'Tropical house with authentic reggae elements', 'published'),
      ('Metal Bluegrass', 'Heavy Metal', 'Bluegrass', 155, 'E Minor', 'Distorted banjo and fiddle shreds', 'Electric banjo, blast beats, fiddle, double kick', 'Extreme bluegrass with metal intensity', 'published'),
      ('K-Pop Flamenco', 'K-Pop', 'Flamenco', 115, 'A Minor', 'K-pop structure with flamenco guitar', 'Flamenco guitar, synth pop, handclaps, castanets', 'K-pop production with Spanish flair', 'published'),
      ('Ambient Techno', 'Ambient', 'Techno', 128, 'C Minor', 'Atmospheric pads over minimal techno', 'Evolving pads, minimal kick, field recordings, subtle percussion', 'Hypnotic techno with ambient soundscapes', 'draft'),
      ('Bollywood EDM', 'Bollywood', 'EDM', 135, 'D Major', 'Indian vocals and instruments over EDM drops', 'Sitar, tabla, synth leads, massive drops, vocal chops', 'Epic Bollywood-EDM festival tracks', 'published'),
      ('Gothic R&B', 'Gothic Rock', 'R&B', 80, 'Bb Minor', 'Dark R&B with gothic aesthetics', 'Choir pads, smooth vocals, minor keys, reverb guitars', 'Moody R&B with dark gothic undertones', 'published'),
      ('Polka Punk', 'Polka', 'Punk Rock', 180, 'C Major', 'Polka melodies at punk speed', 'Accordion, power chords, fast polka drums, shouted vocals', 'High-energy polka-punk crossover', 'draft'),
      ('Afro Jazz Fusion', 'Afrobeats', 'Jazz Fusion', 110, 'Eb Major', 'Afrobeats rhythms with jazz improvisation', 'Log drums, jazz guitar, brass section, talking drum', 'Sophisticated afro-jazz blend', 'published'),
      ('Synthwave Orchestral', 'Synthwave', 'Film Score', 100, 'F Minor', 'Analog synths with full orchestra', 'Strings, analog arps, brass, retro drums, choir', 'Cinematic synthwave with orchestral grandeur', 'published'),
      ('Blues Electronica', 'Blues', 'Electronica', 95, 'E Major', 'Blues guitar over electronic beats', 'Blues guitar, glitch beats, subtle synths, harmonica', 'Smoky blues reimagined with electronic textures', 'published'),
      ('Celtic Hip Hop', 'Celtic', 'Hip Hop', 88, 'D Minor', 'Celtic instruments over boom bap', 'Tin whistle, bodhran, turntable scratches, 808 bass', 'Celtic melodies meet hip hop production', 'draft'),
      ('Cumbia Bass Music', 'Cumbia', 'Bass Music', 100, 'G Minor', 'Cumbia rhythms with heavy bass', 'Guira, accordion, sub bass, cumbia drums, synth stabs', 'Latin cumbia fused with modern bass music', 'published');
    `);

    // Seed Music Analysis (15 items)
    await client.query(`
      INSERT INTO music_analysis (title, track_name, artist, genre, analysis_type, key_detected, bpm_detected, structure_notes, description, status) VALUES
      ('Bohemian Analysis', 'Bohemian Rhapsody', 'Queen', 'Rock', 'Full Analysis', 'Bb Major', 72, 'Intro-Ballad-Opera-Rock-Outro (through-composed)', 'Complete analysis of Queen''s masterpiece', 'complete'),
      ('Billie Jean Breakdown', 'Billie Jean', 'Michael Jackson', 'Pop', 'Rhythmic Analysis', 'F# Minor', 117, 'Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro', 'Rhythmic and harmonic analysis of the iconic bassline', 'complete'),
      ('Clair de Lune Study', 'Clair de Lune', 'Claude Debussy', 'Classical', 'Harmonic Analysis', 'Db Major', 66, 'ABA form with extensive rubato', 'Impressionist harmony analysis of Debussy classic', 'complete'),
      ('Get Lucky Groove', 'Get Lucky', 'Daft Punk ft. Pharrell', 'Disco/Funk', 'Production Analysis', 'B Minor', 116, 'Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro', 'Production techniques and arrangement analysis', 'complete'),
      ('Stairway Deep Dive', 'Stairway to Heaven', 'Led Zeppelin', 'Rock', 'Full Analysis', 'A Minor', 82, 'Multi-section through-composed: Acoustic-Electric-Solo-Finale', 'Progressive structure and dynamic analysis', 'complete'),
      ('Blinding Lights Study', 'Blinding Lights', 'The Weeknd', 'Synthpop', 'Production Analysis', 'F Minor', 171, 'Intro-Verse-Pre-Chorus-Chorus (standard pop)', 'Synthwave production technique breakdown', 'complete'),
      ('Take Five Analysis', 'Take Five', 'Dave Brubeck', 'Jazz', 'Rhythmic Analysis', 'Eb Minor', 172, 'AABA in 5/4 time', 'Analysis of odd time signature usage in jazz', 'complete'),
      ('Levels Breakdown', 'Levels', 'Avicii', 'EDM', 'Production Analysis', 'Bb Minor', 126, 'Intro-Build-Drop-Break-Build-Drop-Outro', 'EDM arrangement and sound design analysis', 'complete'),
      ('Shape of You Anatomy', 'Shape of You', 'Ed Sheeran', 'Pop', 'Melodic Analysis', 'C# Minor', 96, 'Intro-Verse-Pre-Chorus-Chorus-Post-Chorus-repeat', 'Vocal melody and hook analysis', 'complete'),
      ('No Woman No Cry Live', 'No Woman No Cry (Live)', 'Bob Marley', 'Reggae', 'Full Analysis', 'C Major', 76, 'Intro-Verse-Chorus-Verse-Chorus-Solo-Chorus', 'Live arrangement analysis of reggae classic', 'complete'),
      ('Scary Monsters Analysis', 'Scary Monsters and Nice Sprites', 'Skrillex', 'Dubstep', 'Sound Design Analysis', 'Bb Minor', 140, 'Intro-Build-Drop-Break-Drop-Outro', 'Iconic dubstep sound design breakdown', 'complete'),
      ('Yesterday Harmony', 'Yesterday', 'The Beatles', 'Pop/Folk', 'Harmonic Analysis', 'F Major', 97, 'Verse-Chorus-Verse-Chorus-Outro', 'Simple yet effective harmonic analysis', 'complete'),
      ('Smells Like Analysis', 'Smells Like Teen Spirit', 'Nirvana', 'Grunge', 'Full Analysis', 'F Minor', 117, 'Intro-Verse-Pre-Chorus-Chorus (standard)', 'Dynamic contrast and arrangement analysis', 'complete'),
      ('One More Time Study', 'One More Time', 'Daft Punk', 'House', 'Production Analysis', 'B Major', 122, 'Intro-Verse-Chorus-Break-Verse-Chorus-Outro', 'Vocal processing and house production analysis', 'complete'),
      ('Moonlight Sonata', 'Piano Sonata No. 14', 'Beethoven', 'Classical', 'Harmonic Analysis', 'C# Minor', 60, 'Three movements: Adagio-Allegretto-Presto', 'Detailed harmonic and structural analysis', 'complete');
    `);

    // Seed Mixing Assistant (15 items)
    await client.query(`
      INSERT INTO mixing_assistant (title, project_type, track_count, genre, target_loudness, eq_notes, compression_notes, spatial_notes, master_chain, description, status) VALUES
      ('Pop Single Mix', 'Single', 24, 'Pop', '-14 LUFS', 'HPF all non-bass at 80Hz, vocal presence 3-5kHz', 'Vocal 3:1, Drum bus 4:1, Master 2:1', 'Vocals center, guitars 30% L/R, synths wide', 'EQ → Multiband → Stereo Width → Limiter', 'Professional pop single mixing session', 'published'),
      ('Hip Hop Master', 'Album Track', 16, 'Hip Hop', '-12 LUFS', '808 sub boost 40-60Hz, vocal clarity 2-4kHz', 'Vocal parallel comp, 808 sidechain to kick', 'Vocals center, ad-libs panned wide, 808 mono', 'Soft Clip → EQ → Compressor → Limiter', 'Hard-hitting hip hop mix with emphasis on low end', 'published'),
      ('Orchestra Score', 'Film Score', 48, 'Orchestral', '-18 LUFS', 'Reduce string harshness 2-3kHz, air on brass 10kHz+', 'Light bus compression 1.5:1, preserve dynamics', 'L-R stereo image per section seating', 'EQ → Light Comp → Reverb → Limiter (-2dB)', 'Wide dynamic range orchestral film score mix', 'draft'),
      ('EDM Festival Track', 'Single', 20, 'EDM', '-8 LUFS', 'Sidechain everything to kick, cut mud 200-400Hz', 'Heavy sidechain, OTT on synths, limiter on master', 'Mono below 200Hz, super wide above 5kHz', 'Soft Clip → EQ → Multiband → Clipper → Limiter', 'Loud festival-ready EDM mixdown', 'published'),
      ('Jazz Trio Session', 'Live Recording', 8, 'Jazz', '-18 LUFS', 'Minimal EQ, natural tone, slight HPF on piano', 'Gentle 2:1 on piano, barely touch drums', 'Natural stereo from room mics, minimal panning', 'EQ → Tape Saturation → Limiter (-3dB)', 'Natural jazz recording preserving room ambiance', 'published'),
      ('Rock Band Mix', 'Album Track', 32, 'Rock', '-12 LUFS', 'Guitars: cut 400Hz, boost 3kHz presence', 'Drum parallel comp, guitar bus 3:1', 'Hard pan rhythm guitars L/R, drums natural', 'EQ → Comp → Tape Sat → Limiter', 'Punchy rock mix with big guitars', 'published'),
      ('Lo-fi Beat Mix', 'Beat Tape', 10, 'Lo-fi', '-14 LUFS', 'Roll off highs above 10kHz, warm low-mids', 'Gentle compression, vinyl character', 'Slight mono, intimate feel, narrow stereo', 'Tape Saturation → EQ → Limiter', 'Warm lo-fi aesthetic with vinyl character', 'draft'),
      ('Metal Production', 'Album Track', 40, 'Metal', '-10 LUFS', 'Scoop mids on rhythm guitar, vocal cut through 1-3kHz', 'Heavy drum compression, parallel on everything', 'Quad-tracked guitars L/R, bass center with guitars', 'EQ → Multiband → Clipper → Limiter', 'Massive modern metal production', 'published'),
      ('Acoustic Singer Mix', 'EP Track', 6, 'Acoustic', '-16 LUFS', 'Guitar body 200Hz, vocal air 12kHz, de-ess 6kHz', 'Gentle vocal comp 2:1, guitar barely touched', 'Guitar slight L, vocal center, reverb fills space', 'EQ → Comp → Reverb → Limiter', 'Intimate acoustic singer-songwriter mix', 'published'),
      ('Techno Club Mix', 'Single', 14, 'Techno', '-10 LUFS', 'Kick fundamental 50Hz, hi-hat presence 8kHz', 'Sidechain all to kick, subtle bus comp', 'Mono kick/bass, effects in stereo, wide reverb', 'EQ → Comp → Soft Clip → Limiter', 'Driving techno mix optimized for club systems', 'published'),
      ('R&B Vocal Mix', 'Single', 22, 'R&B', '-14 LUFS', 'Vocal warmth 200Hz, presence 4kHz, air 12kHz', 'Vocal chain: DeEss → Comp → Comp (serial)', 'Lead vocal center, harmonies 40% L/R, instruments bed', 'EQ → Multiband → Stereo Width → Limiter', 'Vocal-forward R&B mix with lush harmonies', 'draft'),
      ('Podcast Master', 'Podcast', 3, 'Spoken Word', '-16 LUFS', 'HPF 80Hz, reduce room resonance, clarity 3kHz', 'Voice 4:1, fast attack, medium release', 'Host center, guests slightly panned', 'EQ → Comp → De-ess → Limiter', 'Clear podcast mix optimized for voice', 'published'),
      ('Country Mix', 'Album Track', 28, 'Country', '-14 LUFS', 'Acoustic guitar body, fiddle presence, vocal twang', 'Gentle compression preserving dynamics', 'Steel guitar L, fiddle R, acoustic center', 'EQ → Comp → Tape Sat → Limiter', 'Authentic country mix with natural dynamics', 'published'),
      ('Reggaeton Mix', 'Single', 18, 'Reggaeton', '-10 LUFS', 'Heavy 808 sub, vocal bright 5kHz, dembow sharp', 'Heavy compression, 808 sidechain', 'Mono low end, vocal center, effects wide', 'EQ → Multiband → Soft Clip → Limiter', 'Punchy reggaeton mix for streaming and clubs', 'published'),
      ('Ambient Soundscape', 'Album', 12, 'Ambient', '-20 LUFS', 'Gentle sculpting, preserve natural frequency balance', 'Barely any compression, preserve all dynamics', 'Ultra-wide stereo, immersive spatial placement', 'Gentle EQ → Limiter (-4dB ceiling)', 'Spacious ambient mix preserving full dynamic range', 'draft');
    `);

    const governedMigration = fs.readFileSync(
      path.join(__dirname, 'migrations', '001_governed_music_creation.sql'),
      'utf8'
    );
    await client.query(governedMigration);
    const tenant = await client.query(
      `INSERT INTO organizations(name) VALUES('AI Music Generation') RETURNING id`
    );
    const administrator = await client.query(
      `UPDATE users SET tenant_id=$1 WHERE email='admin@aimusic.com' RETURNING id`,
      [tenant.rows[0].id]
    );
    await client.query(
      `INSERT INTO tenant_memberships(tenant_id,user_id,role,active)
       VALUES($1,$2,'admin',TRUE)
       ON CONFLICT(tenant_id,user_id) DO UPDATE SET role='admin',active=TRUE`,
      [tenant.rows[0].id, administrator.rows[0].id]
    );

    console.log('✅ Database seeded successfully with all 15 items per feature!');
    console.log('📊 Tables created: users, compositions, remixes, sound_designs, lyrics, chord_progressions, melodies, beat_patterns, genre_fusions, music_analysis, mixing_assistant');
    console.log('👤 Default user: admin@aimusic.com / password123');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
