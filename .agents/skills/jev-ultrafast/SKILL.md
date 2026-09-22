---
name: jev-ultrafast
description: "Ultrafast local browser agent (Jev model) for simple, speed-critical web tasks: navigate, click, type, select, scroll. Runs against the local Chrome via browser-harness. Not for shadow roots, iframes, canvas, uploads, or multi-tab flows."
---

# jev-ultrafast

Speed-optimized autonomous browser agent from Browser Use, driven by the Typesafe Jev model.
It picks an operation (CLICK, TYPE_TEXT, SELECT, SCROLL, WAIT, DONE, BLOCKED) from an indexed
DOM table in one network round trip; a small LLM only generates text for TYPE_TEXT.
It connects to the user's local Chrome through browser-harness (see the [[browser-harness]] skill
for direct, non-agent browser control). For building AI features that call the TypeSafe System One
API (Jev) directly in code — rather than driving a browser — use the [[typesafe-ai]] skill instead.

Repo location: `/Users/david/codespace/jev-ultrafast`

## Requirements

Keys live in `/Users/david/codespace/jev-ultrafast/.env`:
- `TYPESAFE_API_KEY` — Jev model access (required)
- `TEXT_MODEL_API_KEY` — OpenRouter key, only needed for tasks that type text

**If a key is empty, stop and ask the user to fill it in — do not prompt for the key inline or
attempt to run without it.**

## Usage

Interactive demo UI (opens http://127.0.0.1:8766):

```bash
cd /Users/david/codespace/jev-ultrafast && uv run --env-file .env jev
```

Library usage (ordered goal list). Prefer `run_retry.py`: it tolerates slow first
paints that would otherwise crash the run with `StalePage` (~200 ms observe window):

```bash
cd /Users/david/codespace/jev-ultrafast && uv run --env-file .env python examples/run_retry.py \
  --url https://example.com --goal 'Do the first step' --goal 'Do the second step'
```

Or inline:

```python
from jev_ultrafast import Agent

with Agent(url, goal) as agent:
    for state in agent.run():
        print(state["status"], state["page"]["url"])
```

## Limits

- MVP does not handle shadow roots, iframes, canvas, file uploads, pop-up tabs, or nested scrolling.
- A DONE result still needs independent verification — check the page state or use browser-harness
  to confirm before treating the task as complete.
- If Chrome won't connect, run `uv run browser-harness --doctor` in the repo directory.
