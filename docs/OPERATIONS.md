# Governed music creation

The supported API is `/api/governed-creation`. It versions source assets, rights, consent, editable timelines, brand/moderation policies, render manifests/jobs/outcomes, reviews, publications/exports, usage, and evaluations. Generated direct-provider, autonomous, collaboration, distribution, and gap routes are unmounted.

Every asset requires a content digest, license and territory; performer consent is mandatory for identifiable people. Living-artist impersonation is prohibited. Render queueing requires distinct rights and moderation approvals plus ready providers. Publication/export requires publisher role, watermark and disclosure evidence. No synchronous provider call or automatic publication occurs in the API.

The durable stem-separation replacement accepts a versioned source digest/model and explicit supported stems, queues retries/dead letters, and stores outputs only through provider reconciliation. It never returns an in-memory demo result.

Lifecycle uses explicit lockfile bootstrap, reviewed/guarded migration, production-disabled seed, and nondestructive startup. Startup never creates secrets, installs, starts PostgreSQL, creates/migrates/seeds a database, or kills occupied ports.

Provider/rights contracts, licensed assets, performer consent verification, model evaluations, moderation/red-team review, watermark verification, accessibility and multilingual user testing, export compatibility in real DAWs/players, publishing reconciliation, migration/restore rehearsals, and qualified legal/rights/brand/security approval remain external gates.
