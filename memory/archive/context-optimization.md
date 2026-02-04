# Context Efficiency & Token Usage Analysis
*Date: 2026-02-01*

## The Problem: "The Heavy Backpack"
We consumed ~30% of the weekly Opus limit in 12 hours.

### 1. The Mechanics
LLMs are stateless. They don't "remember" the previous message.
*   **Turn 1:** User says "Hi". System sends "Hi". (Usage: ~10 tokens)
*   **Turn 50:** System sends "Hi" + *all previous 49 messages*. (Usage: ~100,000+ tokens)

### 2. The Multiplier
*   **Model:** We used Claude Opus (most expensive) for *everything*, even ACK messages.
*   **Setup Tax:** We pasted large logs, read huge documentation files, and installed heavy CLIs (HubSpot, Google Cloud). This bloated the context permanently for that session.

### 3. The Result
*   **Session Context:** Reached ~127k tokens.
*   **Impact:** A simple "Okay, done" response cost the same as reading a novel (127k tokens) because the *input* context must be processed every time.

## Research Areas for "New Session"
To solve this in the future, we need to move from **Context-Heavy** to **Retrieval-Heavy** workflows.

### A. RAG (Retrieval-Augmented Generation)
*   **Concept:** Keep active context small (<10k tokens).
*   **Action:** Instead of keeping the whole chat, *search* for relevant facts in `MEMORY.md` only when needed.
*   **Goal:** Infinite memory, tiny footprint.

### B. Episodic Sessions (The "Ticket" Model)
*   **Concept:** Treat every task (e.g., "Install HubSpot") as a disposable session.
*   **Action:** 
    1. Start Task.
    2. Do Work.
    3. Summarize to File.
    4. **Kill Session.**
*   **Goal:** Never let context grow beyond the task at hand.

### C. Auto-Summarization Skill
*   **Concept:** Build a skill that detects when context hits 20k tokens.
*   **Action:** It pauses, summarizes the last 20k tokens into 500 tokens of notes, saves to memory, and wipes the history.

## Immediate Fixes Applied
1.  **Switched Model:** Gemini 3 Pro (High capacity, low/no cost via Workspace).
2.  **Memory First:** Created this analysis file to persist lessons without keeping the raw chat logs.
