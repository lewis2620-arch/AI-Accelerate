# Clinical In-Basket AI Copilot – Large Healthcare Network

**Category:** Burnout Reduction Agent
**North Star:** Turn inbox overload into prioritized, safe action for clinicians.

## Problem
High-volume messages across EHR in-basket, orders, and alerts causing significant administrative burden. Physicians spending 2+ hours daily on inbox management — time taken directly from patient care.

## Solution
Context-aware triage agent with:
- Message classification (clinical question, medication refill, test result, admin, urgent)
- Risk prioritization by urgency tier
- Draft response generation with personalization flags
- Order suggestions for routine requests
- Medication safety checks
- Human-in-the-loop approval before any response is sent

## Impact
- Measurable reduction in physician administrative time
- Higher clinician productivity and satisfaction scores
- Routing accuracy that reduced inappropriate escalations

## Framework Alignment
- **PRISM**: Full responsible AI implementation — HITL at every output, audit trail, physician override always available
- **EDGE Govern**: Human oversight designed into architecture from day one, not retrofitted

## Agentic Architecture
Three-agent sequential pipeline:
1. **Classifier Agent** — Message type, urgency, risk flags
2. **Drafter Agent** — Response draft calibrated to urgency
3. **Critic Agent** — Safety review before physician sees it

See /agents/clinical-triage-agent/ for the working prototype.

## Key Learnings
Agentic systems shine when they augment clinical judgment, not replace it. The physician always has the final word. Trust is earned one inbox message at a time.

---
*AI Accelerate | David Lewis | 2026*
