# Polaris Document Intelligence Agent

**Problem**  
Manual document review and classification at enterprise scale in regulated environments.

**Solution**  
Simple LangChain + LLM agent that ingests PDFs/text, extracts structured data, applies PRISM guardrails, and outputs classified insights.

**Tradeoffs**  
Chose lightweight LangChain for PM accessibility (no heavy infra). Added mock tools for regulated compliance checks.

**What I Learned**  
Agentic document work is 80% governance, 20% extraction — exactly why PRISM is non-negotiable.

**How to Run**  
See README.md in this folder.
