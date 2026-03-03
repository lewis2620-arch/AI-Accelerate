# PM Copilot Agent
**AI Accelerate Skills Library — Interactive | David Lewis | 2026**

A working AI agent that makes the 51-skill library interactive — turning frameworks into actionable outputs for any AI PM task in under 60 seconds.

---

## What It Does

Five specialized modes, each powered by the full AI Accelerate skills library loaded as context:

| Mode | Input | Output |
|---|---|---|
| **PRD Generator** | Problem brief | Full PRD with EDGE framework, metrics, risk tier, HITL design |
| **Opportunity Scorer** | Problem description | AI fit score /35, architecture recommendation, next step |
| **Agent Architect** | Workflow description | Complete multi-agent spec with ASCII diagram |
| **Interview Prep** | Question + role | Structured answer, signal boosters, watch-outs |
| **Risk Analyzer** | Feature spec | Risk matrix, top 3 launch blockers, recommended controls |

---

## Architecture

```
User Input
    │
    ▼
Mode Selection
(PRD / Opportunity / Architecture / Interview / Risk)
    │
    ▼
Mode-Specific System Prompt
+ Full 51-Skill Library Context
+ Relevant Framework Library (EDGE, PRISM, PLG, FITR)
    │
    ▼
Claude Sonnet (claude-sonnet-4-20250514)
    │
    ▼
Structured Markdown Output
with skill references, frameworks, and concrete recommendations
```

**Pattern**: Single agent with mode-switching system prompts.
**Model**: Claude Sonnet
**Framework**: React + Anthropic API

---

## Skills Demonstrated

| Skill | Application |
|---|---|
| Skill 10 — System Prompt Architecture | Each mode has a distinct, governed system prompt |
| Skill 08 — Context Window Strategy | Full 51-skill library loaded efficiently as context |
| Skill 50 — PM-to-Agent Delegation | The copilot itself is a demonstration of Tier A PM task delegation |
| Skill 49 — Prototype Spec | Built using the design-system-first approach |
| Skill 47 — Vibe-Coding | Built with Claude Code using the AI Accelerate methodology |

---

## Running Locally

```bash
git clone https://github.com/lewis2620-arch/AI-Accelerate
cd AI-Accelerate/agents/pm-copilot-agent
npm install
npm run dev
```

Requires an Anthropic API key.

---

## Design Decisions

**Why 5 modes instead of a free-form chat?**
Modes produce better output than open-ended prompting. Each mode has a tightly governed system prompt that forces the model to apply the right frameworks for that task type. Free-form chat produces generic responses; mode-specific prompts produce expert-level outputs.

**Why load all 51 skills as context?**
The copilot's value is that it references the actual AI Accelerate framework throughout its outputs — specific skill numbers, specific frameworks, specific tradeoffs. This only works if the full library is available as context. The cost is reasonable for the quality gain.

**Why not streaming?**
Streaming adds implementation complexity for a portfolio demo. The output quality is the same. Easy to add for a production version.

---

## Relationship to the Skills Library

This agent IS the skills library made interactive. It demonstrates:
- Every skill in Category G (Builder Skills) in practice
- Skill 50 (PM-to-Agent Delegation) — the copilot handles Tier A PM tasks
- Skill 21 (Goal Vectors) — each mode has a specific, measurable output goal
- The EDGE and PRISM frameworks applied to real PM problems

---

*AI Accelerate | David Lewis | 2026*
