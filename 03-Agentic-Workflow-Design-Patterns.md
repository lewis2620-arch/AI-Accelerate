# 03 — Agentic Workflow Design Patterns
**AI Accelerate | Product Edge | March 2026**

> *"The pattern is more durable than the model. Design the workflow first; the AI fills the role."*

---

## Purpose

This document catalogs the core design patterns used across the AI Accelerate portfolio. Each pattern addresses a recurring workflow architecture challenge in regulated environments. For each, we cover the business scenario, structural design, tradeoffs, and implications for UX, cost, and governance.

These patterns are not mutually exclusive — most production systems combine two or three. Understanding the tradeoffs at pattern level is what separates a PM who can spec an agentic system from one who can only describe the idea.

---

## Pattern 1: Triage-and-Draft (Human-in-the-Loop Classification)

### What It Is
An agent monitors a high-volume input stream, classifies items by priority and type, and produces a draft response or recommended action. A human reviews the draft before any action is taken.

### Business Scenario
A large healthcare network's clinicians receive 200+ in-basket messages per day: refill requests, test result notifications, billing queries, urgent patient questions. The agent classifies each message (urgent / routine / administrative), drafts an appropriate response or routes to the correct team, and surfaces a work queue ordered by clinical priority. Clinician reviews and approves or edits before sending.

### Architecture
```
Input Stream (EHR Inbox)
       │
       ▼
[Classifier Agent] ── risk score, message type, urgency flag
       │
       ▼
[Draft Agent] ── generates response using patient context + policy rules
       │
       ▼
[PRISM Critic] ── flags PHI exposure risk, policy violations, drug interactions
       │
       ▼
[Human Review Queue] ── clinician approves / edits / rejects
       │
       ▼
[Outcome Logger] ── captures override rate, latency, feedback for retraining
```

### Tradeoffs

| Dimension | Benefit | Risk | Mitigation |
|---|---|---|---|
| **Quality** | Agent handles high volume; human catches errors | Human may rubber-stamp without reading | Sample audits + friction on high-risk items |
| **UX** | Reduces cognitive load; clinician sees pre-sorted queue | Poor draft quality destroys trust faster than no agent | Start with read-only triage before drafting |
| **Cost** | Dramatically reduces triage time per message | LLM cost scales with message volume | Batch classification; reserve drafting for high-value message types |
| **Governance** | Full audit trail on every draft and approval | PHI in prompt context requires strict data handling | Tokenization, access controls, minimal context design |

### When to Use
High-volume, structured input streams where classification rules are learnable and human expert time is the primary constraint. Strong fit for clinical inbox management, legal document intake, compliance ticket triage, and IT helpdesk operations.

### Portfolio Example
Clinical In-Basket AI Copilot — large healthcare network. Running at Stage 2 (Draft Mode) with clinician override tracking as the primary quality signal.

---

## Pattern 2: Orchestrated Multi-Step Workflow (Sequential Agent Chain)

### What It Is
A workflow that requires multiple sequential steps — each requiring different tools, context, or specialized reasoning — is decomposed across a chain of specialized agents. Each agent completes its step and passes enriched output to the next.

### Business Scenario
A patient is being discharged from inpatient care. The workflow requires: (1) medication reconciliation across inpatient and outpatient records, (2) follow-up appointment scheduling based on clinical criteria, (3) home health eligibility check, (4) patient education material generation, (5) readmission risk scoring, and (6) summary generation for the handoff care team. Each step requires different data sources, different logic, and different compliance checks. No single agent can do all of this reliably.

### Architecture
```
Trigger: Discharge Order Signed
       │
       ▼
[Reconciliation Agent] ── EHR API: cross-checks inpatient vs. outpatient meds
       │ (structured reconciliation report)
       ▼
[Scheduling Agent] ── Calendar API: books follow-up per clinical protocol
       │ (confirmed appointment slots)
       ▼
[Home Health Agent] ── Benefits API: checks eligibility, initiates referral
       │ (referral confirmation)
       ▼
[Education Agent] ── Content Library: generates patient-specific materials
       │ (education packet)
       ▼
[Risk Scoring Agent] ── Predictive Model: generates 30-day readmission risk
       │ (risk score + contributing factors)
       ▼
[Summary Agent] ── Synthesizes all outputs into handoff summary
       │
       ▼
[Clinician Approval Gate] ── Human reviews summary before patient handoff
```

### Tradeoffs

| Dimension | Benefit | Risk | Mitigation |
|---|---|---|---|
| **Quality** | Each agent is specialized; higher accuracy per step | Error propagation — a mistake in step 1 degrades all downstream steps | Validation checkpoints between agents; reject-and-retry logic |
| **UX** | Clinician receives a complete, synthesized handoff package | Long orchestration chains increase latency | Parallel execution where steps are independent; progressive disclosure of outputs |
| **Cost** | Specialization reduces per-agent token usage | Multiple LLM calls multiply cost | Cheap classification agents; expensive reasoning agents only where required |
| **Governance** | Clean audit trail per agent step | Complex provenance tracking across agent chain | Structured logging with step_id, agent_id, input hash, output hash |

### When to Use
Complex operational workflows with distinct sequential stages, multiple data sources, and multiple compliance touch points. Strong fit for discharge coordination, loan origination, incident response runbooks, regulatory filing workflows.

### Portfolio Example
Agentic Discharge & Care Transition Coordinator — multi-system orchestration across EHR, scheduling, benefits, and content systems.

---

## Pattern 3: Parallel Agent Mesh (Simultaneous Specialized Execution)

### What It Is
Multiple specialized agents execute simultaneously against the same input, with an orchestrator synthesizing their outputs. Designed for situations where speed is critical and no sequential dependency exists between subtasks.

### Business Scenario
A cybersecurity operations center receives a Tier 1 alert. Within seconds, the system must: classify the threat vector, check the affected asset against the asset inventory, look up the CVE against the threat intelligence feed, correlate against the last 90 days of similar alerts, and draft an initial incident response action plan. Sequential execution would take 4–6 minutes. Parallel execution delivers a synthesized brief in under 60 seconds.

### Architecture
```
Trigger: SIEM Alert (P1 Indicator)
       │
       ▼
[Orchestrator] ── fans out to 4 agents simultaneously
    │        │         │         │
    ▼        ▼         ▼         ▼
[Threat   [Asset    [CVE       [Historical
 Classifier] Inventory] Lookup]  Correlator]
    │        │         │         │
    └────────┴─────────┴─────────┘
                 │
                 ▼
         [Synthesis Agent] ── assembles parallel outputs into incident brief
                 │
                 ▼
         [PRISM Critic] ── validates completeness, flags gaps, checks escalation criteria
                 │
                 ▼
         [Analyst Review Queue] ── human reviews brief and initiates response
```

### Tradeoffs

| Dimension | Benefit | Risk | Mitigation |
|---|---|---|---|
| **Quality** | Broad coverage; no step is skipped under time pressure | Synthesis agent must resolve conflicting findings from parallel agents | Confidence scoring per agent; explicit conflict resolution instructions |
| **UX** | Speed is the primary UX value — analysts get a complete brief fast | Information density can overwhelm; synthesis quality determines value | Progressive disclosure; headline summary first, detail on demand |
| **Cost** | Parallel calls multiply LLM cost per trigger | P1 alert volume drives cost significantly | Reserve full parallel mesh for P1/P2 only; lighter pattern for P3/P4 |
| **Governance** | Each agent produces independently auditable output | Fan-out creates more audit records to manage | Correlated trace IDs across all parallel agents; single incident_id as anchor |

### When to Use
Time-critical workflows where multiple independent analysis dimensions must be covered simultaneously. Strong fit for security incident response, emergency clinical triage, financial risk escalations, supply chain disruption response.

### Portfolio Example
Sentra AI Cybersecurity Co-Pilot — parallel threat analysis mesh across threat classification, asset inventory, CVE lookup, and historical correlation.

---

## Pattern 4: Continuous Monitor-and-Intervene (Event-Driven Autonomous Loop)

### What It Is
An agent runs persistently against a data stream or operational system, monitoring for conditions that trigger autonomous intervention within pre-defined guardrails. Unlike the previous patterns, this agent is not triggered by a human action — it triggers itself based on detected conditions.

### Business Scenario
An enterprise finance team needs continuous monitoring of a large portfolio for risk threshold breaches. When a position crosses a defined risk threshold, the agent automatically generates a compliance report, notifies the appropriate risk officer, and — within defined limits — executes a pre-approved hedging action. No human initiates the workflow; the agent operates autonomously within a defined playbook.

### Architecture
```
Continuous Data Feed (Portfolio Positions, Market Data)
       │
       ▼
[Monitor Agent] ── runs on schedule (e.g., every 5 min); checks against risk thresholds
       │ (only proceeds if threshold breached)
       ▼
[Risk Scoring Agent] ── calculates breach severity, affected positions, regulatory flags
       │
       ▼
[Playbook Router] ── matches breach type to pre-approved response playbook
       │
       ├── LOW SEVERITY ──► [Automated Report Agent] → notification only
       │
       ├── MED SEVERITY ──► [Draft Action Agent] → human approval required
       │
       └── HIGH SEVERITY ──► [Immediate Escalation] → human + automated circuit breaker
```

### Tradeoffs

| Dimension | Benefit | Risk | Mitigation |
|---|---|---|---|
| **Quality** | 24/7 coverage; no human fatigue or missed shifts | Model drift over time in a live data environment | Automated drift detection; weekly ground-truth calibration |
| **UX** | Invisible to end users until action is needed | Alert fatigue if thresholds poorly calibrated | Start with broad thresholds; tighten based on false positive history |
| **Cost** | Persistent polling has baseline compute cost | Cost of monitoring scales with data volume and frequency | Tiered polling (high-frequency for critical assets, low-frequency for stable) |
| **Governance** | Most powerful governance challenge in this catalog | Autonomous action without human approval creates liability | Hard-coded human approval gates for any action above materiality threshold; rollback always available |

### When to Use
High-frequency, data-rich environments where the cost of delayed human detection is measurable. Strong fit for financial risk monitoring, population health surveillance, industrial equipment anomaly detection, compliance exception monitoring.

### Portfolio Example
Helios Agentic Financial Risk Platform — continuous portfolio monitoring with autonomous reporting and human-gated intervention logic.

---

## Pattern 5: Vibe-to-Artifact Orchestration (PM Productivity Pattern)

### What It Is
A PM-facing pattern specifically designed to convert a loosely specified idea (a "vibe") into a structured, reviewed, ready-to-use artifact — PRD, user story set, prioritized backlog, or discovery brief — through a researcher → writer → critic agent loop.

### Business Scenario
A product manager needs a full PRD for a new clinical workflow feature. They have a 3-sentence idea, no time for a 3-hour document session, and a regulated-industry compliance requirement that the PRD must pass governance review. The orchestrator takes the vibe, researches relevant context, writes a structured PRD using EDGE + PRISM frameworks, and produces a critic-reviewed draft ready for stakeholder review in under 10 minutes.

### Architecture
```
PM Input: "Build an agentic discharge coordinator for large healthcare"
       │
       ▼
[Researcher Agent] ── gathers regulated-industry context, workflow best practices, competitive signals
       │ (structured research brief)
       ▼
[Writer Agent] ── produces full PRD using EDGE framework, PRISM guardrails, Cagan principles
       │ (complete Markdown PRD)
       ▼
[Critic Agent] ── reviews for PRISM compliance, regulatory gaps, tradeoff completeness, outcome clarity
       │ (approved draft or revision list)
       ▼
[PM Review] ── human reviews final draft, edits, and ships to stakeholders
```

### Tradeoffs

| Dimension | Benefit | Risk | Mitigation |
|---|---|---|---|
| **Quality** | Consistent structure; PRISM guardrails enforced by default | Generic output if the input vibe is too vague | Invest in prompt engineering; require 3–5 context sentences minimum |
| **UX** | Dramatically reduces time-to-first-draft for PMs | PMs may over-trust output and underinvest in discovery | Frame output as "structured hypothesis" requiring validation, not a finished spec |
| **Cost** | Researcher + writer + critic = 3 LLM calls; high value per dollar | Researcher agent can over-fetch context, inflating cost | Scope researcher to 3–5 targeted queries; cap context window |
| **Governance** | Critic agent enforces compliance review on every PRD | Critic is only as good as its training — may miss domain-specific risks | Augment critic instructions with regulated-industry-specific checklists |

### When to Use
Any product team that needs to accelerate time-to-first-draft while maintaining structural quality and governance compliance. Especially powerful for non-engineering PMs who want to ship agentic systems without getting blocked on documentation overhead.

### Portfolio Example
Vibe-to-Ship Orchestrator — live in `agents/vibe-to-ship-orchestrator/`. Run it today.

---

## Pattern Selection Guide

| If your workflow is… | Use Pattern |
|---|---|
| High-volume, human-reviewed classification | Pattern 1: Triage-and-Draft |
| Multi-step process with sequential dependencies | Pattern 2: Orchestrated Multi-Step |
| Time-critical, multi-dimension analysis | Pattern 3: Parallel Agent Mesh |
| Continuous operational monitoring | Pattern 4: Continuous Monitor-and-Intervene |
| PM productivity / artifact generation | Pattern 5: Vibe-to-Artifact |

Most production agentic systems in this portfolio combine 2–3 patterns. The Discharge Coordinator, for example, combines Pattern 2 (sequential steps) with Pattern 1 (human approval gate at the handoff summary stage).

---

*Built with ❤️ by David Lewis | Founder, AI Accelerate*
*PRISM Framework · EDGE Framework · 5-Layer Agentic Infrastructure Stack*
