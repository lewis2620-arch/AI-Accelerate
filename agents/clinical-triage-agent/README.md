# Clinical Inbox Triage Agent
**Ambulatory Physician Inbox Intelligence | AI Accelerate | David Lewis | 2026**

A working 3-agent pipeline that classifies, drafts, and safety-reviews incoming physician in-basket messages — demonstrating the exact architecture used in enterprise clinical AI systems.

---

## What It Does

Physicians receive hundreds of inbox messages daily. This agent pipeline:

1. **Classifies** each message by type, urgency, risk flags, and routing recommendation
2. **Drafts** an appropriate response calibrated to the message type and urgency
3. **Critiques** the draft for safety issues, scope violations, and quality — before any physician sees it

The physician reviews the pre-triaged, pre-drafted, safety-reviewed output and approves or edits before sending. Human-in-the-loop by design.

---

## Architecture

```
Incoming Message
       │
       ▼
┌─────────────────────┐
│   Classifier Agent  │  → Message type, urgency tier, risk flags, routing, confidence
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│    Drafter Agent    │  → Draft response + personalization flags + estimated response time
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│    Critic Agent     │  → Safety score, issues list, verdict: APPROVED / NEEDS_REVISION / ESCALATE
└─────────────────────┘
       │
       ▼
  Physician Review
  (Approve / Edit / Escalate)
```

**Pattern**: Sequential chain with HITL gate at final step.
**Model**: Claude Sonnet (claude-sonnet-4-20250514)
**Framework**: React + Anthropic API

---

## Agent Specifications

### Agent 1 — Classifier
- **Input**: Raw inbox message text
- **Output**: Structured JSON — message_type, urgency, risk_flags, confidence, routing, summary
- **Urgency tiers**: URGENT (2hr) / SAME_DAY / ROUTINE (24-48hr) / ADMINISTRATIVE
- **Safety rule**: Always escalates to higher urgency tier when ambiguous

### Agent 2 — Drafter
- **Input**: Original message + classifier output
- **Output**: Draft response + requires_physician_review flag + personalization notes
- **Constraints**: No clinical diagnosis, no medication dosing, no definitive reassurance on serious symptoms

### Agent 3 — Critic
- **Input**: Original message + classification + draft response
- **Output**: Safety score + issues list + APPROVED / NEEDS_REVISION / ESCALATE verdict
- **Catches**: Safety violations, scope creep, compliance issues, quality problems
- **Blocks**: Any ESCALATE verdict from reaching the approval step

---

## Skills Demonstrated

| Skill | Reference |
|---|---|
| Multi-agent orchestration design | Skill 16 |
| HITL gate design | Skill 17 |
| Agent escalation design | Skill 20 |
| Agentic UX design | Skill 22 |
| System prompt architecture | Skill 10 |
| AI risk classification (Tier 1) | Skill 32 |

---

## Running Locally

```bash
git clone https://github.com/lewis2620-arch/AI-Accelerate
cd AI-Accelerate/agents/clinical-triage-agent
npm install
npm run dev
```

Requires an Anthropic API key. The app calls the API directly from the browser — no backend needed.

---

## Design Decisions

**Why 3 agents instead of 1?** Separation of concerns. The classifier outputs structured JSON. The drafter calibrates to urgency. The critic is an independent safety layer. A single agent doing all three degrades quality on each.

**Why sequential chain?** Each agent's output is the next agent's input — sequential dependency by design.

**Why HITL at the final step only?** Intermediate outputs are internal pipeline states. The gate is at the point of action: the response going to the patient.

**Why ESCALATE as a separate verdict?** NEEDS_REVISION means fixable. ESCALATE means immediate human attention regardless of draft quality — no approval path exists.

---

## Relationship to Oracle Health Clinical AI Agent Work

Oracle Health's Clinical AI Agent team is building exactly this class of system. This prototype demonstrates working knowledge of the 3-agent architecture, HITL design requirements in regulated clinical contexts, and practical implementation of the agentic patterns in the AI Accelerate skills library.

---

*AI Accelerate | David Lewis | Clinical AI PM Portfolio | March 2026*
