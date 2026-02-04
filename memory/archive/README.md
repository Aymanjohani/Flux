# Flux-Lite Memory System

A lightweight, file-based semantic memory system using LanceDB for vector search.

## Architecture

```
memory/
├── episodic/           # Daily raw logs (existing)
├── semantic/           # Curated knowledge files
│   ├── index.md        # Table of contents
│   └── *.md           # Topic-specific knowledge
├── users/              # User profiles
├── vector_db/          # LanceDB storage (auto-managed)
└── README.md          # This file
```

## Quick Start

### 1. Prerequisites

- Node.js v22+
- Gemini API key (set as `GEMINI_API_KEY` environment variable)

### 2. Install Dependencies

```bash
npm install vectordb @google/generative-ai
```

### 3. Ingest Knowledge

```bash
GEMINI_API_KEY="your-key" node scripts/memory_engine.js ingest memory/semantic/test_knowledge.md
```

### 4. Search Memory

```bash
GEMINI_API_KEY="your-key" node scripts/memory_engine.js retrieve "your search query"
```

## How It Works

### Ingestion
1. Reads markdown files
2. Splits content by headers (creating logical chunks)
3. Generates embeddings using Gemini `text-embedding-004`
4. Stores in LanceDB with metadata (source, header, timestamp)

### Retrieval
1. Embeds the search query
2. Performs vector similarity search
3. Returns ranked results with scores

## Chunking Strategy

The system uses **header-based chunking** for optimal semantic coherence:

- Each markdown header (# through ######) starts a new chunk
- Chunks include the header and all content until the next header
- Metadata tracks: source file, header name, chunk index, line numbers

## Scoring

- **Score range:** 0.0 (irrelevant) to 1.0 (perfect match)
- **Default threshold:** 0.5 (configurable)
- **Distance metric:** Cosine distance, normalized to similarity score

## Usage Examples

### Programmatic Usage

```javascript
const { ingest, retrieve } = require('./scripts/memory_engine.js');

// Ingest a file
await ingest('memory/semantic/projects.md');

// Search
const results = await retrieve('current project status', {
  limit: 5,
  scoreThreshold: 0.6
});

console.log(results.results);
```

### CLI Usage

```bash
# Ingest multiple files
node scripts/memory_engine.js ingest memory/semantic/projects.md
node scripts/memory_engine.js ingest memory/semantic/tech_stack.md

# Search with natural language
node scripts/memory_engine.js retrieve "what technologies are we using?"
```

## Testing

Run the test suite:

```bash
GEMINI_API_KEY="your-key" node scripts/test_memory.js
```

Tests verify:
- ✅ File ingestion and chunking
- ✅ Vector embedding generation
- ✅ Semantic search accuracy
- ✅ Result ranking

## API Reference

### `ingest(filePath)`

Ingests a markdown file into the vector database.

**Parameters:**
- `filePath` (string): Path to markdown file (relative or absolute)

**Returns:**
- `{ success: boolean, chunksAdded: number }`

### `retrieve(query, options)`

Searches the vector database for relevant content.

**Parameters:**
- `query` (string): Search query in natural language
- `options` (object):
  - `limit` (number): Max results to return (default: 5)
  - `scoreThreshold` (number): Minimum similarity score (default: 0.5)

**Returns:**
```javascript
{
  query: string,
  results: [
    {
      text: string,        // Chunk content
      source: string,      // File path
      header: string,      // Section header
      score: number,       // Similarity score (0-1)
      chunkIndex: number   // Chunk position in source file
    }
  ],
  count: number
}
```

## Phase 3 Status ✅

- [x] Implement `dream()` consolidation function
- [x] Create OpenClaw skill (`skills/flux-memory/SKILL.md`)
- [x] Set up cron job for nightly consolidation (4 AM Saudi)
- [ ] Add user profile management (future)
- [ ] Implement memory expiration/archival (future)

## Performance Notes

- **Embedding model:** `text-embedding-004` (768 dimensions)
- **Average chunk size:** ~200-500 characters
- **Search latency:** ~200-500ms for typical queries
- **Storage:** ~1MB per 100 chunks (including vectors)

## Troubleshooting

### No results found
- Check that files have been ingested: `ls memory/vector_db/`
- Lower the `scoreThreshold` (try 0.3-0.4 for more permissive search)
- Verify query phrasing matches content style

### API errors
- Ensure `GEMINI_API_KEY` is set correctly
- Check API quota limits

### Chunking issues
- Use clear markdown headers (# through ######)
- Keep sections focused on single topics
- Avoid extremely long sections (>1000 words)

## License

Internal use - IIoT Solutions
