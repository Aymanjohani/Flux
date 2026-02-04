# Flux-Lite Implementation Plan
*Date: 2026-02-01*
*Goal: Low-resource, high-autonomy memory system for Single VPS*

## Phase 1: Infrastructure & Structure
**Directory Layout:**
```text
memory/
├── episodic/           # (Existing) Daily raw logs
├── semantic/           # (New) Curated Wiki files
│   ├── index.md        # Table of contents
│   ├── projects.md     # Active projects state
│   ├── tech_stack.md   # Tech details
│   └── company.md      # IIoT Solutions facts
├── users/              # (New) User profiles
│   ├── ayman.md
│   └── aadil.md
└── vector_db/          # (New) LanceDB files (hidden/managed)
```

## Phase 2: Core Coding (The "Memory Engine")
**Script:** `scripts/memory_engine.js` (Node.js)
**Dependencies:** `vectordb`, `@langchain/embeddings` (or direct API)

**Functions:**
1.  `ingest(filePath)`:
    *   Read markdown file.
    *   Split into logical chunks (headers/paragraphs).
    *   Generate embeddings (using Gemini or local embedding).
    *   Upsert to LanceDB with metadata `{source: filePath, lastUpdated: timestamp}`.

2.  `retrieve(query, context)`:
    *   Embed query.
    *   Search LanceDB.
    *   **Rerank** (optional, maybe simple score threshold).
    *   Return formatted markdown snippets.

3.  `dream()` (The Consolidation Script):
    *   Read `memory/episodic/yesterday.md`.
    *   Use LLM to extract:
        *   New Facts -> Update `semantic/*.md`
        *   User Prefs -> Update `users/*.md`
    *   Trigger `ingest()` on updated files.

## Phase 3: Integration
1.  Create `skills/flux-memory/SKILL.md`.
2.  Expose tools: `memory_store` (manual save), `memory_query` (vector search).
3.  Set up Cron Job for `dream()` (4 AM).

## Tech Stack for Coder
*   **Language:** Node.js (matches OpenClaw runtime) or Python (better ecosystem, but requires venv). *Decision: Node.js for tighter integration.*
*   **DB:** LanceDB (Serverless).
*   **Model:** Claude 3.5 Sonnet (for coding).
