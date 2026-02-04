# Flux-Lite Quick Start Guide

Get up and running in 2 minutes.

## Prerequisites
- ✅ Node.js installed
- ✅ Dependencies installed (`npm install` in workspace)
- ✅ Gemini API key in OpenClaw config

## Basic Usage

### 1. Ingest Your First Document

```bash
# Create a knowledge file
cat > memory/semantic/my_notes.md << EOF
# My Notes

## Project Alpha
We're building a cool thing with Node.js.

## Team
- Alice: Lead developer
- Bob: Designer
EOF

# Ingest it
./scripts/memory ingest memory/semantic/my_notes.md
```

Expected output:
```
📥 Ingesting: memory/semantic/my_notes.md
   Split into 3 chunks
   ✅ Added 3 chunks to existing table
```

### 2. Search Your Memory

```bash
./scripts/memory retrieve "Who is on the team?"
```

Expected output:
```
🔍 Searching for: "Who is on the team?"
   Found 1 relevant chunks

📋 Results:

1. [memory/semantic/my_notes.md] Team (score: 0.782)
   ## Team
   - Alice: Lead developer
   - Bob: Designer
```

## Common Commands

```bash
# Ingest all semantic memory
for file in memory/semantic/*.md; do
  ./scripts/memory ingest "$file"
done

# Search with natural language
./scripts/memory retrieve "current projects"
./scripts/memory retrieve "who works on what"
./scripts/memory retrieve "technical stack details"

# Run tests
GEMINI_API_KEY="your-key" node scripts/test_memory.js
```

## Tips

1. **Organize with headers:** Use `#`, `##`, `###` to structure your markdown
2. **One topic per section:** Each header section becomes a searchable chunk
3. **Re-ingest after edits:** Run `./scripts/memory ingest <file>` after updating files
4. **Natural queries work best:** Ask questions as you would to a human

## Troubleshooting

**"No results found"**
→ File not ingested yet. Run: `./scripts/memory ingest <file>`

**"GEMINI_API_KEY not found"**
→ Check `~/.openclaw/openclaw.json` has `memorySearch.apiKey`

**Duplicate results**
→ Known issue, will be fixed in Phase 3

## File Organization

```
memory/
├── semantic/          # Put curated knowledge here
│   ├── projects.md
│   ├── team.md
│   └── tech.md
├── users/            # User profiles (auto-updated later)
└── vector_db/        # Don't touch! (auto-managed)
```

## What's Next?

- Read `memory/README.md` for full documentation
- Read `memory/IMPLEMENTATION_SUMMARY.md` for technical details
- Wait for Phase 3 for automatic consolidation from daily logs

---

**Need help?** Check `memory/README.md` or the source code at `scripts/memory_engine.js`
