# ClinicOS — Full Practice Operating System
**AI Accelerate | David Lewis | 2026**

A 10-agent clinical practice operating system built for physicians and PAs running telemedicine practices. Practice Director commanding 9 specialized agents, governed by AQGP (Skill 53) + CVAP (Skill 52).

Built for real clinicians: an MD and PA running a full ambulatory telemedicine practice while traveling internationally, with zero administrative staff.

---

## The Clinical Fleet

| Agent | Callsign | Role | Handles |
|---|---|---|---|
| **Practice Director** | PD | Clinical Commander | Morning brief, live assessment, Morning Clinical Briefing |
| Chart | CHART-1 | Clinical Documentation | SOAP notes, EHR filing, note corrections, chart compliance |
| Auth | AUTH-2 | Prior Authorization | PA submissions, retroactive denials, appeal drafting, P2P requests |
| Rx | RX-3 | Prescription Management | Rejections, pharmacy callbacks, step therapy, formulary exceptions |
| Follow | FOLO-4 | Post-Visit Follow-Up | Labs, referrals, no-shows, post-visit check-ins |
| Billing | BILL-5 | Claims & Denials | Claim scrubbing, denial analysis, coding flags, corrections |
| Intake | INTK-6 | Scheduling & Triage | Multi-timezone scheduling, triage, insurance verification |
| Sentinel | SNTL-7 | Compliance Watchdog | HIPAA, cross-state telehealth, licensure, malpractice coverage |
| Inbox | INBX-8 | Patient Portal | Message triage, urgency classification, draft responses |
| Taskboard | TASK-9 | EHR Tickler System | Pending/urgent/overdue tasks, aging tracker, escalation |

---

## Governance: AQGP + CVAP

Every agent in ClinicOS operates under a two-layer governance stack:

**Skill 53 — AQGP (Agentic Quality & Governance Protocol)**
Universal floor for all multi-agent systems. Agent accountability, proof-before-status, inter-agent trust rules, escalation triggers, graceful degradation, conflict resolution, version governance.

**Skill 52 — CVAP (Clinical Verified Action Protocol)**
Clinical extension of AQGP. Adds clinical proof types, HITL gate requirements, and patient-safety-level failure classification.

> A false completion in a clinical system is not a bug. It is a patient safety event.

**Clinical proof types required per action:**
- Prior auth submission: PA tracking number from payer portal
- Prescription sent: pharmacy confirmation ID
- EHR note filed: EHR encounter ID + timestamp
- Patient message sent: portal delivery confirmation
- Task closed: EHR tickler closure ID + agent callsign
- Claim submitted: clearinghouse submission ID

**HITL gates — clinician sign-off required before execution:**
Prescriptions, patient messages, PA submissions, claim submissions, referrals, clinical task closures.

---

## Three-Phase Practice Director Flow

**Phase 1 — Practice Status Brief**
Practice Director assesses the clinical scenario, classifies urgency, issues specific CVAP-governed directives to all 9 agents before any agent fires.

**Phase 2 — Parallel Fleet Execution**
All 9 agents run simultaneously. Each receives the Practice Director brief + clinical scenario as context. Director drops live clinical assessments as each agent reports — flagging [PATIENT SAFETY FLAG] items immediately.

**Phase 3 — Morning Clinical Briefing**
Practice Director synthesizes all 9 reports: Practice Pulse, Patient Safety Flags, Key Findings (agent-cited), Items Pending Clinician Sign-Off, Administrative Wins, and the single most important first action for the clinician.

---

## The Problem This Solves

Physicians spend an average of 12 hours per week on prior authorizations alone. Only 1 in 10 PA denials gets appealed — despite 83% of appeals being overturned. Nearly 1 in 4 physicians report that prior authorization has led to a serious adverse event for a patient.

For solo or micro-practice clinicians running telemedicine with zero administrative staff, the burden is total. ClinicOS is the administrative staff they never had.

---

## Skills Demonstrated

- Skill 52 — CVAP: Clinical Verified Action Protocol, every agent, every status
- Skill 53 — AQGP: Universal governance floor, 9-agent fleet
- Skill 16 — Multi-Agent Orchestration: 10-agent parallel mesh
- Skill 10 — System Prompt Architecture: 10 distinct governed prompts, dual governance injection
- Skill 22 — Agentic UX: 3-phase UI, CVAP badge, patient safety flags rendered visually
- Skill 35 — Regulatory Landscape: HIPAA, telehealth cross-state, DEA in Sentinel
- Skill 37 — Audit Trail Design: every agent output attributed, timestamped, proof-required

---

## Oracle Health Interview Reference

> "I built ClinicOS for two real clinicians running a full telemedicine practice with no administrative staff. Nine specialized agents run in parallel under a Practice Director that delivers a Morning Clinical Briefing each session. Every agent operates under CVAP — a governance standard I designed specifically for clinical AI: a false completion here is not a bug, it is a patient safety event. The architecture directly maps to what Oracle Health's clinical AI agent team is building at scale."

---

*AI Accelerate | David Lewis | 2026*
