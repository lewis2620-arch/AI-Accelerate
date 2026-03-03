from crewai import Agent, Task, Crew
import os

# Vibe-to-Ship Orchestrator
# Takes a short idea prompt and outputs a full PRD with PRISM guardrails
# Requires: pip install crewai langchain-openai
# Set OPENAI_API_KEY or ANTHROPIC_API_KEY in environment

researcher = Agent(
    role='Researcher',
    goal='Gather regulated-industry context and best practices for the given idea',
    backstory='Expert in healthcare, cybersecurity, and regulated enterprise workflows. '
              'Understands HIPAA, FDA SaMD, OCC SR 11-7, and EU AI Act requirements.',
    verbose=True
)

writer = Agent(
    role='PRD Writer',
    goal='Create clear, outcome-focused PRDs using the EDGE framework',
    backstory='Senior AI Product Manager following EDGE, PRISM, and Marty Cagan principles. '
              'Writes PRDs that engineers can build from and stakeholders can approve.',
    verbose=True
)

critic = Agent(
    role='PRISM Guardrail Critic',
    goal='Enforce responsible AI, compliance, and regulated-industry standards on every PRD',
    backstory='Senior governance and risk lead. Checks every PRD for HITL requirements, '
              'audit trail design, bias risks, regulatory exposure, and rollback planning.',
    verbose=True
)

task1 = Task(
    description="Take this idea: {idea}. Research the key workflow steps, "
                "regulated-industry considerations, and existing solutions. "
                "Output a bullet list of insights the PRD writer needs.",
    agent=researcher,
    expected_output="Bullet list of research insights including workflow steps, "
                    "regulatory requirements, and key risks"
)

task2 = Task(
    description="Using the research, write a full PRD following the EDGE framework. "
                "Include: Problem Statement, User Story, AI Opportunity Assessment, "
                "Proposed Solution, Agent Architecture, Success Metrics, HITL Design, "
                "Risk Classification, and Edge Cases. Apply PRISM guardrails throughout.",
    agent=writer,
    expected_output="Complete Markdown PRD with all EDGE sections"
)

task3 = Task(
    description="Review the PRD for PRISM compliance. Check: HITL gates placed correctly, "
                "audit trail requirements specified, bias risks addressed, "
                "regulatory exposure documented, rollback plan present. "
                "Output: APPROVED with notes, or NEEDS_REVISION with specific required changes.",
    agent=critic,
    expected_output="APPROVED or NEEDS_REVISION with specific feedback on each PRISM component"
)

crew = Crew(
    agents=[researcher, writer, critic],
    tasks=[task1, task2, task3],
    verbose=2
)

if __name__ == "__main__":
    idea = input("Enter your idea (e.g. 'Build an agentic discharge coordinator for large healthcare'): ")
    result = crew.kickoff(inputs={"idea": idea})
    print("\n" + "="*60)
    print("VIBE-TO-SHIP OUTPUT")
    print("="*60)
    print(result)
