# Vibe-to-Ship Orchestrator

**Problem:** Non-engineering PMs have great ideas but hit friction turning a 3-sentence "vibe" into a full PRD, user stories, and prioritized backlog — especially in regulated environments.

**Solution:** A multi-agent CrewAI crew that takes a short idea prompt, runs research + drafting + critic loops, applies Product Edge + PRISM guardrails, and outputs ready-to-use artifacts.

## How to Run

```bash
pip install crewai langchain-openai
export OPENAI_API_KEY=your_key_here
# or use Anthropic:
export ANTHROPIC_API_KEY=your_key_here
python main.py
```

## What It Outputs
- Problem statement (EDGE Empathize)
- User stories with acceptance criteria
- Full PRD with PRISM guardrails applied
- Critic review with compliance flags

## Architecture
Three-agent sequential crew:
1. **Researcher** — Gathers regulated-industry context and best practices
2. **PRD Writer** — Creates outcome-focused PRD using EDGE framework
3. **PRISM Critic** — Enforces responsible AI, compliance, and regulated-industry standards

## Tradeoffs
- Used CrewAI for rapid role-based orchestration (accessible for PMs)
- Lightweight tools over full LangGraph for v1 (upgrade path planned)
- PRISM checks embedded as critic agent, not external validator

## What I Learned
Agentic systems amplify PM strengths (framing, prioritization, judgment) when the orchestration itself follows Product Edge principles.
