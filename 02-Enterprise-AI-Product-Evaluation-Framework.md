# 02 — Enterprise AI Product Evaluation Framework
**AI Accelerate | Product Edge | March 2026**

> *"You can't govern what you can't measure. You can't scale what you can't trust."*

## Purpose
This framework gives product leaders a structured lens for evaluating agentic AI systems before deployment, during operation, and at every expansion decision. It is purpose-built for regulated environments where the cost of failure is asymmetric and auditability is non-negotiable.

It answers four foundational questions:
1. **Is the agent doing the right things?** (Quality)  
2. **Is the agent operating reliably?** (Operational)  
3. **Is the agent introducing unacceptable risk?** (Risk & Compliance)  
4. **Is the agent earning adoption at the right pace?** (Adoption & Trust)

## The Four Evaluation Dimensions

### Dimension 1: Quality Metrics
*Is the agent producing outputs that are accurate, relevant, and safe?*

| Metric                  | Definition                                      | Healthcare Example                          | Cyber Example                          | Target Threshold          |
|-------------------------|-------------------------------------------------|---------------------------------------------|----------------------------------------|---------------------------|
| Task Completion Rate    | % of triggered tasks completed without override | % of in-basket messages triaged without clinician correction | % of alerts classified without analyst rejection | >85% at full autonomy    |
| Output Accuracy         | % verified correct against ground truth         | Medication reconciliation match rate        | Threat classification match rate       | >92% for high-stakes tasks |
| Hallucination Rate      | % of unsupported assertions                     | Clinical drafts citing nonexistent orders   | Summaries referencing non-existent CVEs | <1% for clinical/legal   |
| Precision vs Recall     | False positive / false negative balance        | Favor recall on readmission risk            | Favor precision on threat alerts       | Tuned per use case        |

**Tradeoff Note:** In clinical settings, recall bias is generally safer. In cybersecurity, precision bias prevents alert fatigue.

### Dimension 2: Operational Metrics
*Is the agent reliable, scalable, and cost-efficient?*

| Metric                  | Definition                                      | Target                  | Red Flag                     |
|-------------------------|-------------------------------------------------|-------------------------|------------------------------|
| Agent Uptime            | Availability during operational hours           | >99.5%                  | Any downtime in care hours   |
| Cost per Task           | Fully-loaded cost per completed task            | Trending down QoQ       | Exceeds human equivalent     |
| Escalation Rate         | % requiring human intervention                  | Decreasing trend        | Flat or rising               |
| Memory Retrieval Accuracy | Correctness of prior context                  | >95% for continuity     | Patient/case misidentification |

**Operational Maturity Stages:** Shadow → Draft → Supervised Auto → Full Autonomy. No agent advances to Stage 3 without documented Stage 1–2 evidence.

### Dimension 3: Risk & Compliance Metrics
*Is the agent operating safely within regulatory boundaries?*

| Metric                    | Definition                          | Healthcare (HIPAA) | Cyber (SOC2) | Target      |
|---------------------------|-------------------------------------|--------------------|--------------|-------------|
| Audit Trail Completeness  | % of actions with full provenance   | 100%               | 100%         | Non-negotiable |
| PII/PHI Exposure Events   | Unauthorized data incidents         | Zero tolerance     | Zero tolerance | Zero      |
| Policy Violation Rate     | % flagged by compliance engine      | <0.1%              | <0.5%        | <0.1%       |
| Model Drift Score         | Divergence from baseline            | Alert >2σ          | Alert >2σ    | Immediate review |

**PRISM Risk Tiers** (Tier 1–4) with required controls are defined in the full framework.

### Dimension 4: Adoption & Trust Metrics
*Is the agent earning sustained human trust?*

| Metric             | Definition                              | Leading Indicator          | Lagging Indicator          |
|--------------------|-----------------------------------------|----------------------------|----------------------------|
| Override Rate      | % of suggestions rejected               | High early = calibration   | Persistently high = breakdown |
| Adoption Velocity  | Week-over-week active users             | Steady growth              | Plateau                    |
| NPS (Internal)     | Willingness to recommend                | Trending positive          | Flat or declining          |

**The Trust Paradox:** In regulated environments, forced usage creates workarounds. Earned trust creates advocates for expanded autonomy.

## Evaluation Cadence & Portfolio Examples
(Weekly operational checks, monthly risk/trust reviews, quarterly autonomy gates.)

**Clinical In-Basket Copilot** → Focus on override rate + accuracy.  
**Polaris Document Intelligence** → Focus on audit completeness + throughput.  
**Sentra Cyber Co-Pilot** → Focus on precision + escalation rate.

## How to Use This Framework
1. Before build → Define success criteria and Tier classification.  
2. During Shadow/Draft → Measure Quality + Adoption.  
3. At autonomy gates → Require evidence across all four dimensions.  
4. In production → Monitor Operational + Risk as primary dashboards.

*Built with ❤️ by David Lewis | Founder, AI Accelerate*  
*See [How to Navigate This Repo](#how-to-navigate-this-repo) below*
