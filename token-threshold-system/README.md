# Token Threshold System

## Problem
Sessions can approach the 200k token limit without warning, risking:
- Hard resets with context loss
- Failed API calls
- Lost conversation state

## Solution
Pre-turn token monitoring with threshold warnings and forced checkpoints.

## Architecture

### Thresholds
- **50k tokens**: Warning (checkpoint recommended)
- **100k tokens**: Alert (checkpoint required)
- **140k tokens**: Critical (forced checkpoint + graceful wind-down)

### Components
1. `monitor.js` - Token counter hook
2. `test-harness.js` - Token generation tool
3. `checkpoint-trigger.js` - Auto-checkpoint logic

## Testing Strategy
1. Generate synthetic high-token sessions
2. Verify threshold triggers
3. Confirm checkpoint execution
4. Validate graceful degradation

## Status
🚧 In Development - Do NOT submit to OpenClaw yet
