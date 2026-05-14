# Audit Apply Note — AIMusicGeneration

Source: `_AUDIT/reports/batch_05.md` section 31.

## Original Recommendations
### Missing AI counterparts
- `/ai/generate-beat`
- `/ai/generate-chord-progression`
- `/ai/generate-melody`
- `/ai/generate-lyrics`
- `/ai/remix-suggestion`
- `/ai/music-theory-advisor`

### Missing non-AI features
- DAW integration, audio recording, collaboration tools, distribution integration, royalty tracking, music theory lessons, community

### Custom feature suggestions
- Agentic music composer; real-time DAW co-pilot; AI remix agent; vertical genre packs; artist collab platform; licensing/royalties

## Implemented (this pass)
Added three endpoints to `server/routes/songPipeline.js` (already mounted at `/api/ai`):
- `POST /api/ai/generate-beat`
- `POST /api/ai/generate-chord-progression`
- `POST /api/ai/generate-lyrics`

Reuses `queryOpenRouter`, `parseAIJson`, `authenticateToken`, `rateLimiter`.

## Backlog
| Item | Tag |
|---|---|
| `/ai/generate-melody` | MECHANICAL |
| `/ai/remix-suggestion` | MECHANICAL |
| `/ai/music-theory-advisor` | MECHANICAL |
| DAW integration | NEEDS-PRODUCT-DECISION |
| Audio recording capability | NEEDS-PRODUCT-DECISION |
| Distribution (Spotify/Apple) | NEEDS-CREDS |
| Royalty tracking | NEEDS-PRODUCT-DECISION |
| Collaboration tools | NEEDS-PRODUCT-DECISION |
| Community / artist discovery | NEEDS-PRODUCT-DECISION |

## Apply pass 3 (frontend)

- **Status:** FE already wired — no changes.
- `client/src/pages/AIGenerators.js` is a tabbed page (Beat / Chord Progression / Lyrics) that calls all three pass-2 endpoints (`/api/ai/generate-beat`, `/api/ai/generate-chord-progression`, `/api/ai/generate-lyrics`).
- Auth: passes `Authorization: Bearer ${token}` from props (token is read from `localStorage` in `App.js` and threaded through).
- `App.js` registers `/ai-generators` and the FEATURES nav exposes "AI Generators".
- Renders structured `parsed.*` results for each tab and falls back to `result.raw` on parse failure.

## Apply pass 4 (mechanical backlog)

Implemented all 3 MECHANICAL endpoints from the backlog (cap reached at 3 — far under the 5-feature cap).

- **BE:** Added 3 routes in `server/routes/songPipeline.js` (mounted at `/api/ai`):
  - `POST /api/ai/generate-melody` — JSON of phrases, contour, motif, range, performance tips.
  - `POST /api/ai/remix-suggestion` — JSON of remix style, BPM/key changes, drum redesign, harmonic changes, effects chain, arrangement plan, tips. Requires `original_track`.
  - `POST /api/ai/music-theory-advisor` — JSON answer + key concepts, examples, pitfalls, exercises, further reading. Requires `question`.
  Each reuses `queryOpenRouter`, `parseAIJson`, `authenticateToken`, `rateLimiter`. Returns `{ success, raw, parsed, model }` matching the existing pass-2 endpoints.
- **FE:** Extended `client/src/pages/AIGenerators.js` — added 3 tabs (`melody`, `remix`, `theory`) to `TABS`, expanded `form` state with the new fields, added per-tab field rendering, switched to a `else if` ladder so `lyrics` no longer absorbs every other tab, added per-tab result rendering via `<Section>` blocks, and added explicit 503 handling. No new deps, matches existing CSS classes (`form-input`, `form-select`, `form-label`, `btn-ai`).
- **Syntax:** `node --check` PASS on `songPipeline.js`. JSX bracket balance verified.
- **Smoke test:** Started backend on alt port :3091 (3001 in use by a parallel agent). Login `admin@aimusic.com / password123` ok; `POST /api/ai/generate-melody` returned a parsed JSON melody (key/scale/tempo/phrases/contour/motif) using a live OpenRouter call.

## Apply pass 5 (all backlog)

Implemented 3 of the 6 remaining backlog rows (cap 5/project; we hit 3 because the
other 3 — community/discovery, collaboration tools, audio recording — require either
a separate WebRTC/audio surface or a multi-user product surface that isn't an
additive code change).

- **BE:** `server/routes/songPipeline.js` — 3 new routes mounted at `/api/ai`:
  - `POST /api/ai/daw-arrange` — was NEEDS-PRODUCT-DECISION (DAW integration).
    PRODUCT-DECISION: text-only session-template plan that works in any DAW; we
    do **not** export to `.als/.logicx/.flp` (requires per-DAW SDKs).
  - `POST /api/ai/royalty-split-suggest` — was NEEDS-PRODUCT-DECISION (royalty
    tracking). PRODUCT-DECISION: advisory split engine; does **not** register with
    PROs/publishers. Cap 20 contributors.
  - `POST /api/ai/distribution-checklist` — was NEEDS-CREDS (Spotify/Apple
    distribution). We don't call distributor APIs; we generate the *prep* checklist
    (metadata, ISRC, artwork, master spec, smart-link strategy) so the artist can
    hand it to a distributor of their choice. Surfaces `missing_distributor_creds`
    array (`DISTROKID_API_KEY`, `CDBABY_API_KEY`, `TUNECORE_API_KEY`) so the FE
    can warn when those env vars are missing.

  All three explicitly return `503 { error, missing: 'OPENROUTER_API_KEY' }` when
  the underlying `queryOpenRouter` helper is in mock mode.

- **FE:** extended `client/src/pages/AIGenerators.js` — added 3 tabs
  (`daw`, `royalty`, `distribute`) to the `TABS` array, expanded `form` state,
  added per-tab field rendering, and per-tab result rendering via the existing
  `<Section>` component. No new deps, matches existing CSS classes.

- **Syntax:** `node --check songPipeline.js` PASS.

- **Smoke test:** BE on alt port :3092. Login `admin@aimusic.com / password123`
  → 200 + JWT. POST `/api/ai/daw-arrange` → 200 with parsed `track_list` (Drums,
  Bass, etc.) using a live OpenRouter call.

### Remaining backlog
- Audio recording capability (NEEDS-PRODUCT-DECISION) — requires browser
  MediaRecorder UX + audio storage backend.
- Collaboration tools (NEEDS-PRODUCT-DECISION) — requires real-time
  multi-user infrastructure.
- Community / artist discovery (NEEDS-PRODUCT-DECISION) — separate social product
  surface.
