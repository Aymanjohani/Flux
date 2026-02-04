# Semantic Memory Index

Auto-generated: 2026-02-01

## Knowledge Files

### team.md
Team structure, roles, contacts, hiring roadmap
- Leadership (Ayman, Aadil)
- Technology, Business Dev, Admin, Project Management departments
- Open positions and priorities
- Telegram contacts

### company.md
IIoT Solutions business overview
- Company profile, mission, market position
- Products: IoT Logix, EnOptix EMS, ProdOptix MES
- 2026 pipeline and key clients
- SIRI assessment service
- Competitive advantages

### infrastructure.md
Technical systems and configurations
- VPS server details (Hostinger)
- OpenClaw configuration (models, safeguards)
- Integrations: Google Workspace, Gemini API, Recall.ai, Groq STT, Todoist, Brave Search
- Flux-Lite memory system
- Security protocols

### lessons-learned.md
Experience and mistakes
- Security lessons (verify tools, Hostinger firewall)
- Communication improvements (check before ask)
- Model issues (Gemini timeouts)
- Memory management (context bloat)
- Session management best practices
- Integration setup tips

### protocols.md
Operating procedures and guidelines
- Session start protocol
- Check before ask procedure
- Audio/voice message handling
- Cross-session messaging
- Session end protocol
- Context management
- Memory management
- Group chat behavior
- Heartbeat protocol
- Platform-specific formatting
- Safety & security guidelines

## Users

### ayman.md
Primary user profile template

### aadil.md
CTO profile template

## Usage

Search memory:
```bash
./scripts/memory retrieve "your question"
```

Update knowledge:
1. Edit semantic/*.md files
2. Re-ingest: `./scripts/memory ingest memory/semantic/filename.md`

Consolidate daily logs:
```bash
./scripts/memory dream
```

## Statistics

- **Total files:** 5 knowledge files
- **Total chunks:** 117 searchable chunks
- **Last update:** 2026-02-01 20:56 UTC
- **Vector DB:** LanceDB with Gemini embeddings (768 dimensions)

## Maintenance

Files are organized by topic for easy updates. When knowledge changes:
1. Edit the relevant semantic/*.md file
2. Re-ingest to update vector DB
3. Update this index if adding/removing files

Nightly consolidation (4 AM Saudi) automatically extracts facts from daily logs.
