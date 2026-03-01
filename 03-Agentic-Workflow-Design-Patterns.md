# 03 — Agentic Workflow Design Patterns
**AI Accelerate | Product Edge | March 2026**

> *"The pattern is more durable than the model. Design the workflow first; the AI fills the role."*

## Pattern 1: Triage-and-Draft
**Architecture**
```mermaid
flowchart TD
    A[Input Stream] --> B[Classifier Agent]
    B --> C[Draft Agent]
    C --> D[PRISM Critic]
    D --> E[Human Review Queue]
    E --> F[Outcome Logger]
