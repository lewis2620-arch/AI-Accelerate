from crewai import Agent, Task, Crew
import os

# Simple starter crew — you can expand this later with more agents/tools
researcher = Agent(
    role='Researcher',
    goal='Gather regulated-industry context and best practices',
    backstory='Expert in healthcare, cyber, and regulated workflows',
    verbose=True
)

writer = Agent(
    role='PRD Writer',
    goal='Create clear, outcome-focused PRDs using Product Edge frameworks',
    backstory='Follows EDGE, PRISM, and Marty Cagan principles'
)

critic = Agent(
    role='PRISM Guardrail Critic',
    goal='Enforce responsible AI, compliance, and regulated-industry standards',
    backstory='Senior governance and risk lead'
)

task1 = Task(
    description="Take this idea: {idea}. Research key workflow steps and regulated considerations.",
    agent=researcher,
    expected_output="Bullet list of insights"
)

task2 = Task(
    description="Write a full PRD using the EDGE framework and PRISM guardrails.",
    agent=writer,
    expected_output="Complete Markdown PRD"
)

task3 = Task(
    description="Review the PRD for PRISM guardrails, compliance risks, and regulated-industry tradeoffs.",
    agent=critic,
    expected_output="Approved or list of required revisions"
)

crew = Crew(
    agents=[researcher, writer, critic],
    tasks=[task1, task2, task3],
    verbose=2
)

# Run it
idea = input("Enter your vibe/idea (e.g. 'Build an agentic discharge coordinator for large healthcare'): ")
result = crew.kickoff(inputs={"idea": idea})
print(result)
