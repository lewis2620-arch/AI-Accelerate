# 03 — Agentic Workflow Design Patterns
**AI Accelerate | Product Edge | March 2026**

> *"The pattern is more durable than the model. Design the workflow first; the AI fills the role."*

## Purpose
This document catalogs the core design patterns used across the AI Accelerate portfolio. Each pattern addresses a recurring workflow architecture challenge in regulated environments.

Understanding these patterns at the design level is what separates a PM who can spec an agentic system from one who can only describe the idea.

## Pattern 1: Triage-and-Draft (Human-in-the-Loop Classification)
**Business Scenario**  
High-volume input streams where classification is learnable and human expert time is the bottleneck (e.g., clinical in-basket messages, compliance tickets).

**Architecture** (simplified)
```mermaid
flowchart TD
    A[Input Stream] --> B[Classifier Agent]
    B --> C[Draft Agent]
    C --> D[PRISM Critic]
    D --> E[Human Review Queue]
    E --> F[Outcome Logger]
