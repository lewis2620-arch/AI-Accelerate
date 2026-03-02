# 04 — AI Governance and Risk Model
**AI Accelerate | Product Edge | March 2026**

> *"Governance is not the thing that slows you down. It is the thing that earns you the right to go fast."*

---

## Purpose

This document defines the AI governance and risk model used across the AI Accelerate portfolio. It operationalizes the **PRISM framework** — the responsible agentic AI platform strategy that underpins every system in `portfolio-stack/` — and provides practical guidance for applying it in regulated environments.

Governance is not an audit afterthought. In regulated industries, it is the product. The organizations that build agentic infrastructure with governance baked in — not bolted on — are the ones that earn the clinical, legal, and operational trust required to expand agent autonomy over time.

---

## The PRISM Framework: Deep Dive

PRISM is the AI Accelerate governance and platform strategy framework. It was developed through delivery experience across healthcare, cybersecurity, and Big 4 consulting engagements where compliance was non-negotiable and the cost of agentic failure was asymmetric.

```
┌─────────────────────────────────────────────────────────────────┐
│                        P R I S M                                │
│                                                                 │
│  P — Platform Readiness     Is your infrastructure AI-ready?   │
│  R — Responsible AI         Are your guardrails enforced?       │
│  I — Impact Alignment       Does it serve the right outcomes?   │
│  S — System Orchestration   Is the architecture sound?          │
│  M — Market Fit & ROI       Does it earn its right to exist?    │
└─────────────────────────────────────────────────────────────────┘
```

---

### P — Platform Readiness

Before any agentic system is deployed, the underlying platform must meet a baseline of operational and security requirements. This is the most frequently skipped step — and the most common cause of production failures.

**Key Questions:**
- Is the data infrastructure clean, accessible, and governed? (Gold data layer)
- Are API integrations stable and versioned? (EHR, SIEM, ERP connectors)
- Are identity and access controls enforced for agent credentials?
- Is there a sandboxed environment for testing agent behavior before production?
- Is observability infrastructure (logging, tracing, alerting) in place?

**Regulated Industry Specifics:**

| Environment | Platform Requirement | Common Gap |
|---|---|---|
| Healthcare | HIPAA-compliant data handling; BAAs with AI vendors | LLM API calls routing PHI without signed BAA |
| Cybersecurity | SOC2 Type II for any agent with access to production systems | Agents with overprivileged credentials |
| Finance | SOX audit trail requirements; data residency constraints | Agent outputs not captured in compliance records |
| Industrial | OT/IT network segmentation; IEC 62443 alignment | Agents deployed on IT networks with OT system access |

**Platform Readiness Checklist:**
- [ ] Data classification schema defined and applied
- [ ] Agent credentials scoped to minimum necessary access
- [ ] All external LLM API calls reviewed for PHI/PII exposure
- [ ] Vendor AI agreements reviewed by legal (BAAs, DPAs)
- [ ] Observability stack capturing agent_id, input hash, output hash, latency, cost per call
- [ ] Rollback procedure documented and tested

---

### R — Responsible AI

Responsible AI in the agentic context is not a principles poster on the wall. It is a set of enforced, measurable controls that govern agent behavior in production.

**Core Controls:**

**Human-in-the-Loop (HITL) Gates**
Every action above a defined risk threshold must pass through a human approval gate before execution. HITL is not binary — it is a spectrum calibrated to the risk profile of each action type.

| Risk Level | HITL Requirement | Example |
|---|---|---|
| Critical | Mandatory human approval before any action | Medication order change; P1 incident response; material financial transaction |
| High | Human review of agent recommendation before execution | Discharge summary; threat classification with remediation step |
| Medium | Sampling review of agent outputs (e.g., 1 in 10) | Routine in-basket triage; low-severity alert classification |
| Low | Exception-only human review | Administrative routing; draft generation for internal documents |

**Bias and Fairness Monitoring**
Agentic systems trained on historical operational data inherit the biases embedded in that data. In clinical and financial environments, performance disparities across demographic groups are not just ethical failures — they are regulatory liabilities.

Minimum requirements:
- Baseline performance benchmarks by demographic subgroup at initial deployment
- Quarterly disparity analysis comparing subgroup performance against overall baseline
- Escalation protocol if subgroup performance diverges more than 5% from baseline
- Documented remediation path if disparity is confirmed

**Transparency and Explainability**
Users who cannot understand why an agent produced a specific output will not trust it. Explainability requirements should be scoped to the user's role:
- Clinicians: "This message was classified as urgent because it contains a medication refill request for a patient with a scheduled procedure in 48 hours."
- Analysts: "This alert was escalated because the CVE matches a pattern from 3 prior P1 incidents in this environment."
- Regulators: Full provenance log with model version, prompt template version, retrieved context, and output.

**Content Safety and Hallucination Controls**
For any agent producing outputs consumed by humans in high-stakes decisions:
- Retrieval-Augmented Generation (RAG) to ground outputs in verified source documents
- Citation requirements — outputs that reference clinical guidelines, policies, or regulations must cite the source
- Critic agent pass before any output reaches a human queue
- Explicit uncertainty signaling when agent confidence is below threshold

---

### I — Impact Alignment

Every deployed agent must map directly to a measurable business outcome. Impact Alignment prevents "agentic feature theater" — the deployment of technically impressive systems that deliver no measurable organizational value.

**Impact Alignment Framework:**

```
Business Outcome
    └── North Star Metric (what the business cares about)
         └── Agent Success Metric (what the agent directly influences)
              └── Proxy Metric (what we measure in the absence of direct data)
```

**Examples from Portfolio:**

| Project | Business Outcome | North Star Metric | Agent Success Metric |
|---|---|---|---|
| Clinical In-Basket Copilot | Reduce clinician burnout | Hours of administrative time per clinician per week | Override rate (proxy for draft quality) |
| Discharge Coordinator | Reduce 30-day readmissions | 30-day readmission rate | Medication reconciliation match rate + follow-up scheduling completion rate |
| Gravitas Surgical Ops | Increase OR throughput | Cases per OR per month | Schedule optimization rate + supply availability at case start |
| Polaris Document Intelligence | Reduce compliance review cycle time | Days from document receipt to compliance clearance | Classification accuracy + escalation false positive rate |
| Helios Financial Risk | Reduce regulatory reporting lag | Hours from risk event to filed report | Detection latency + report generation accuracy |

**Impact Review Cadence:**
- Monthly: Agent success metrics reviewed against targets
- Quarterly: North star metric progress reviewed with executive sponsor
- Annually: Full ROI calculation (labor hours saved, risk events prevented, revenue protected) vs. total system cost

---

### S — System Orchestration

System Orchestration governs the technical architecture of the agentic system itself — ensuring that the agent mesh is designed for safety, composability, and operational resilience.

**Orchestration Principles:**

**Separation of Concerns:** Each agent owns a narrow, well-defined workflow segment. Agents that do too many things fail in unpredictable ways. The Discharge Coordinator's reconciliation agent only reconciles medications. It does not schedule appointments. Scope is a governance control.

**Idempotency:** Agent actions should be idempotent wherever possible — if an agent runs twice on the same input, the outcome should be the same. This is critical for retry logic and prevents double-execution errors in clinical or financial workflows.

**Graceful Degradation:** When an agent fails (API timeout, model error, missing context), the system should fall back to a human-assisted mode rather than blocking the workflow entirely. A degraded state is always better than a failed state in clinical operations.

**Context Hygiene:** Agent prompts should contain the minimum necessary context to complete the task. Over-broad context windows introduce PHI exposure risk, increase cost, and reduce output quality. Every context window should be reviewed against data minimization principles.

**Tool Access Governance:**

| Tool Type | Access Principle | Example |
|---|---|---|
| Read-only data APIs | Scoped to specific data types; no write access in Stage 1–2 | EHR read for patient demographics; no write to clinical record |
| Write APIs | Require explicit HITL gate in Stages 1–3; scoped to agent role only | Appointment scheduling write; medication order write requires clinician approval |
| External APIs | Vendor assessment required; no PHI/PII in request payload without encryption | Threat intelligence feed; supply chain pricing API |
| Internal admin tools | Highest-privilege category; requires security review before any agent access | EHR admin APIs; financial system settlement APIs |

---

### M — Market Fit & ROI

Governance without business justification is a cost center. PRISM's Market Fit & ROI component ensures that every agentic system can defend its existence in financial and strategic terms.

**ROI Calculation Framework:**

```
Total Value = (Labor Hours Saved × Fully-Loaded Hour Cost)
            + (Risk Events Prevented × Average Cost Per Event)
            + (Revenue Protected or Generated)
            + (Strategic Option Value)

Total Cost  = (Build Cost)
            + (LLM API + Infrastructure Cost per month × 12)
            + (Governance & Compliance Overhead)
            + (Human Review Time in HITL Gates)

ROI         = (Total Value - Total Cost) / Total Cost
```

**Strategic Option Value** is the frequently under-counted component. An agentic system that builds organizational trust in AI, trains a governance-capable team, and establishes a reusable infrastructure layer generates option value for every subsequent agent deployment. The governance layer built for one clinical agent is the governance layer for the next five.

---

## Governance Operating Model

### Roles and Responsibilities

| Role | Responsibility |
|---|---|
| **Product Manager** | Owns impact alignment and adoption; defines HITL thresholds; leads quarterly autonomy expansion reviews |
| **AI/ML Engineer** | Owns model performance, drift monitoring, and retraining triggers |
| **Security / Compliance** | Owns audit trail standards, access controls, regulatory alignment |
| **Clinical / Domain Expert** | Owns ground-truth validation for quality calibration; champions adoption |
| **Executive Sponsor** | Owns ROI accountability; approves Stage 3/4 autonomy expansion |
| **Governance Board** | Annual review of bias audits, strategic alignment, regulatory fit |

### Governance Artifacts (Minimum Viable Set)

| Artifact | Purpose | Cadence |
|---|---|---|
| Agent Design Spec | Defines scope, HITL gates, tool access, and escalation logic | Before build |
| Risk Classification Decision | Documents Tier assignment and required controls | Before deployment |
| Performance Baseline Report | Establishes accuracy, latency, and cost benchmarks | Stage 1 → 2 gate |
| Stage Advancement Evidence Package | Documents performance evidence supporting autonomy expansion | Each stage gate |
| Audit Trail Archive | Complete log of agent actions, inputs, outputs, human overrides | Continuous; archived per regulatory retention schedule |
| Drift Alert Log | Record of drift detection events and remediation actions | Continuous |
| Annual Governance Report | Bias audit, ROI review, regulatory alignment assessment | Annual |

---

## PRISM in Practice: Portfolio Application

### AgentOps — PRISM as a Product

AgentOps is the AI Accelerate governance framework operationalized as a standalone product. It is the governance infrastructure layer used across all other agents in this repo. Its core modules map directly to PRISM:

| AgentOps Module | PRISM Component |
|---|---|
| Credential vault + access scoping | Platform Readiness |
| HITL gate engine + critic loop manager | Responsible AI |
| Outcome tracking dashboard | Impact Alignment |
| Agent registry + composition rules | System Orchestration |
| Cost tracking + ROI calculator | Market Fit & ROI |

### EmpowerCare — PRISM Forced Compliance Architecture

The EmpowerCare platform was built in a regulatory environment where HIPAA compliance was a deployment prerequisite, not an afterthought. Every architectural decision — API-first modularity, audit trail by default, nurse call and EHR integration with explicit write permission gates — was shaped by PRISM constraints. The result was a system that passed compliance review in the first submission, a rare outcome in large healthcare implementations.

### Polaris — Governance as the Moat

The core learning from the Polaris document intelligence engagement: agentic document work is 80% governance and 20% extraction. Clients were not paying for extraction speed — they had manual processes for that. They were paying for defensible, audit-ready classification that could be produced at scale without creating regulatory liability. PRISM compliance was the product.

---

## The Governance Maturity Ladder

```
Level 1: Ad Hoc          No formal governance; agents deployed without audit trail or HITL
Level 2: Reactive        Governance applied after incidents; basic logging in place
Level 3: Defined         PRISM controls documented and applied; standard HITL gates enforced
Level 4: Managed         Drift monitoring, bias audits, and autonomy expansion gates active
Level 5: Optimizing      Governance infrastructure as a reusable platform; agents earn autonomy
                         incrementally; governance is a competitive differentiator
```

Most enterprise AI deployments in regulated industries are operating at Level 1–2. The AI Accelerate portfolio targets Level 4–5. Getting to Level 4 is not about more compliance overhead — it is about building governance infrastructure that compounds value across every subsequent agent deployment.

---

*Built with ❤️ by David Lewis | Founder, AI Accelerate*
*PRISM Framework · AgentOps · 5-Layer Agentic Infrastructure Stack*
