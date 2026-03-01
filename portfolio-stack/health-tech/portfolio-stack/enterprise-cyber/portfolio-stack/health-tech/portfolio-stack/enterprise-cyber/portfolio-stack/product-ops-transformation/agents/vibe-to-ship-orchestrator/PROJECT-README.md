# Vibe-to-Ship Orchestrator

**Problem**  
Non-engineering PMs have great ideas but hit friction turning a 3-sentence “vibe” into a full PRD, user stories, and prioritized backlog — especially in regulated environments.

**Solution**  
A multi-agent CrewAI crew that takes a short prompt, runs research + drafting + critic loops, applies Product Edge + PRISM guardrails, and outputs ready-to-use artifacts.

**Tradeoffs**  
Used CrewAI for rapid role-based orchestration (easy for PMs to understand). Chose lightweight tools over full LangGraph for first version (will upgrade later). Added strict PRISM checks for regulated use.

**What I Learned**  
Agentic systems amplify PM strengths (framing, prioritization, judgment) when the orchestration itself follows Product Edge principles. This is the exact workflow I now use daily.

**How to Run**  
See README.md in this folder.
**How Others Can Use**  
Fork and swap the tools for your own APIs or internal systems.
