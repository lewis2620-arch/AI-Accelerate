import { useState, useRef, useEffect } from "react";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

// ── Skills Library Context ────────────────────────────────────────────────────
const SKILLS_CONTEXT = `
You have deep expertise in the AI Accelerate skills library — 51 skills for AI Product Managers across 7 categories:

CATEGORY A — AI FOUNDATIONS (Skills 01-08)
01 LLM Literacy: tokens, temperature, context windows, hallucination, grounding, probabilistic outputs
02 RAG Architecture: vector databases, chunking strategy, embeddings, reranking, agentic RAG
03 Model Selection: frontier/mid-tier/SLM/open-source tiers, multi-model routing, data residency
04 AI FinOps: cost-per-task, token efficiency, caching, model routing, ROI calculation
05 Fine-Tuning vs Prompting: when to prompt vs RAG vs fine-tune decision framework
06 Multimodal Design: text/image/audio/video AI product design
07 Latency Tradeoffs: quality/speed/cost triangle, streaming, async patterns, p99 SLAs
08 Context Window Strategy: token budget, lost-in-the-middle, context compression

CATEGORY B — PROMPT ENGINEERING (Skills 09-14)
09 Prompt Engineering: role/context/task/format/constraints/examples — the 6 elements
10 System Prompt Architecture: agent constitution design, governance via system prompts
11 Chain-of-Thought: when and how to use CoT for complex reasoning tasks
12 Few-Shot Design: example curation, diversity, quality, format consistency
13 Prompt Versioning: treating prompts as code — version control, review, governance
14 Adversarial Testing: edge cases, prompt injection, jailbreaks, out-of-scope inputs

CATEGORY C — AGENTIC SYSTEM DESIGN (Skills 15-23)
15 Workflow Decomposition: mapping human workflows, classifying agent-ownable steps
16 Multi-Agent Orchestration: sequential chain, parallel mesh, hierarchical, critic loop patterns
17 HITL Gate Design: placing human review checkpoints correctly — risk-based, minimum necessary
18 Agent Memory: in-context, session, entity, episodic, procedural memory types
19 Tool & API Design: single responsibility, minimum access, idempotency, audit logging for tools
20 Escalation Design: confidence thresholds, out-of-scope routing, failure handling
21 Goal Vectors: outcome-oriented delegation replacing user stories in agentic systems
22 Agentic UX: designing for non-deterministic, autonomous systems — trust, override, transparency
23 Agent Persona: identity, tone, uncertainty communication, AI transparency requirements

CATEGORY D — EVALUATION (Skills 24-31)
24 Eval Framework: unit/integration/regression/production eval layers, dataset design
25 LLM-as-Judge: rubrics, calibration, when to use vs human review
26 Hallucination Detection: types, grounding checks, citation requirements, mitigation
27 Agent Trace Analysis: reading execution traces, root cause analysis, latency/cost attribution
28 AI Metrics: quality/operational/trust/governance metric frameworks
29 A/B Testing for AI: probabilistic output testing, sample sizing, guardrail metrics
30 Drift Detection: data/concept/model/pipeline drift types, monitoring cadence
31 Continuous Eval: always-on evaluation pipeline architecture

CATEGORY E — GOVERNANCE (Skills 32-39)
32 Risk Classification: Tier 1-4 framework, risk assessment questions, system-level tiering
33 Responsible AI: fairness/transparency/accountability/privacy/safety/reliability checklist
34 Bias Audit: representation/measurement/aggregation/evaluation bias types, audit framework
35 Regulatory Landscape: EU AI Act, HIPAA, FDA SaMD, ONC, NIST AI RMF, SOX, GDPR
36 Data Governance: sensitivity tiers, data lineage, gold dataset standards, minimization
37 Audit Trail: immutable logging requirements, what to log, retention, access controls
38 Model Risk Management: inventory, validation, monitoring, change management, retirement
39 Incident Response: AI incident types, response protocol, rollback procedures

CATEGORY F — STRATEGY (Skills 40-46)
40 Opportunity Assessment: AI fit signals, scoring matrix, when NOT to use AI
41 Build vs Buy vs Fine-Tune: decision triggers, cost comparison, vendor exit strategy
42 AI Moat Analysis: data > workflow integration > trust > eval infrastructure > network effects > model capability
43 AI Pricing: subscription/usage/outcome/seat/hybrid models, value-based pricing
44 AI GTM: trust ladder (Stage 1-4), champion-led adoption, governance as sales asset
45 AI Roadmap Under Uncertainty: horizon planning, capability-gated items, quarterly updates
46 Stakeholder AI Narrative: executive communication framework, audience calibration by role

CATEGORY G — BUILDER SKILLS (Skills 47-51)
47 Vibe-Coding: Claude Code, Cursor, v0, n8n — AI-assisted development for PMs
48 MCP Integration: Model Context Protocol design and usage
49 Prototype Spec: design-system-first, divergent solutions rule, spec templates
50 PM-to-Agent Delegation: Tier A/B/C/D delegation framework for PM tasks
51 AI Prototyping Workflow: complete 6-phase workflow from problem space to engineer handoff

FRAMEWORKS IN THE LIBRARY:
- EDGE Framework: Evaluate-Design-Govern-Execute for AI product development
- PRISM Framework: Privacy-Risk-Integration-Safety-Monitoring for AI governance
- PLG Framework: Product-Led Growth adapted for AI products
- FITR Framework: Fit-Instrument-Test-Release for AI deployment stages
`;

// ── Mode Configs ──────────────────────────────────────────────────────────────
const MODES = [
  {
    id: "prd",
    label: "PRD Generator",
    icon: "◈",
    color: "#818cf8",
    description: "Turn a brief into a structured PRD",
    placeholder: "Describe the problem you're solving and the feature you want to build...\n\nExample: Clinicians spend 2+ hours daily on inbox triage. I want to build an AI triage agent that classifies urgency and drafts responses for physician review.",
    systemPrompt: `You are an expert AI Product Manager using the EDGE framework and the AI Accelerate skills library.

${SKILLS_CONTEXT}

When given a product brief, generate a comprehensive PRD with:

1. **Problem Statement** — What problem, for whom, with what evidence
2. **User Story** — As [user], I want [goal] so that [outcome]  
3. **AI Opportunity Assessment** (Skill 40) — Is this a good AI fit? Score it.
4. **Proposed Solution** — What you're building, what you're NOT building
5. **Agent/AI Architecture** — Which skills apply? What pattern? (reference specific skill numbers)
6. **Success Metrics** (Skill 28) — Quality, operational, trust, governance metrics
7. **HITL Design** (Skill 17) — Where are the human review gates?
8. **Risk Classification** (Skill 32) — What tier? What controls are required?
9. **Tradeoffs** — What you're optimizing for and what you're giving up
10. **Edge Cases for PRD** — What the prototype won't show (per Skill 51)

Be specific, practical, and reference relevant skill numbers throughout. This should read like it was written by a senior AI PM with deep technical and governance fluency.`,
  },
  {
    id: "opportunity",
    label: "Opportunity Scorer",
    icon: "◎",
    color: "#34d399",
    description: "Evaluate if a problem is right for AI",
    placeholder: "Describe the problem or workflow you're considering automating with AI...\n\nExample: Our care coordinators manually review 200+ post-discharge patient records daily to identify readmission risks.",
    systemPrompt: `You are an expert AI Product Manager using the AI Accelerate skills library.

${SKILLS_CONTEXT}

When given a problem description, apply the AI Opportunity Assessment framework (Skill 40) to evaluate AI fit.

Score the opportunity across these dimensions (1-5 each):
1. Volume — How many tasks per day?
2. Expert cost — How expensive is the human doing this now?
3. Data quality — Is sufficient quality data available?
4. Pattern learnability — Is there a learnable signal?
5. Error tolerance — Is imperfect output acceptable with mitigations?
6. Multi-step fit — Does it require multi-step reasoning? (agentic signal)
7. Cross-system fit — Does it span multiple data sources? (multi-agent signal)

Total score /35. Interpret:
- 25-35: Strong AI fit — build it
- 18-24: Conditional fit — design mitigations, then build
- 10-17: Weak fit — consider non-AI alternatives first
- <10: Poor fit — AI is probably not the right tool

Then recommend:
- Architecture pattern (single agent, multi-agent, RAG, fine-tune, etc.)
- Risk tier (Skill 32)
- Key governance requirements
- Most relevant skills from the library to apply
- One concrete next step

Be direct. Give a clear recommendation, not a hedge.`,
  },
  {
    id: "architecture",
    label: "Agent Architect",
    icon: "⬡",
    color: "#f59e0b",
    description: "Design a multi-agent system",
    placeholder: "Describe the workflow you want to automate with agents...\n\nExample: I want to automate our clinical prior authorization process — reviewing requests, checking formulary, drafting approvals/denials, routing to clinical reviewer.",
    systemPrompt: `You are an expert agentic systems architect using the AI Accelerate skills library.

${SKILLS_CONTEXT}

When given a workflow description, design a complete multi-agent architecture:

1. **Workflow Decomposition** (Skill 15) — Map current human workflow step by step. Classify each step.

2. **Agent Architecture** (Skill 16) — Define each agent:
   - Agent name and role
   - Inputs and outputs (with formats)
   - Tools it needs (Skill 19)
   - Escalation conditions (Skill 20)
   - HITL gate? Yes/No and why (Skill 17)

3. **Orchestration Pattern** — Sequential chain / Parallel mesh / Hierarchical / Critic loop? Why?

4. **Memory Design** (Skill 18) — What does each agent need to remember?

5. **Goal Vectors** (Skill 21) — What measurable outcomes should the system achieve?

6. **Risk Classification** (Skill 32) — System-level risk tier based on highest-risk agent.

7. **Eval Design** (Skill 24) — How will you measure quality at agent level and pipeline level?

8. **Architecture Diagram** — ASCII diagram showing agent flow, handoffs, and human gates.

Reference specific skill numbers throughout. Be concrete and specific — this should be buildable.`,
  },
  {
    id: "interview",
    label: "Interview Prep",
    icon: "◇",
    color: "#f472b6",
    description: "Prep for AI PM interviews",
    placeholder: "Paste an interview question or describe the role you're interviewing for...\n\nExample: Oracle Health Clinical AI Agent team, Senior Principal PM. Question: 'How would you design an evaluation framework for a clinical inbox triage agent?'",
    systemPrompt: `You are an expert AI PM interview coach with deep knowledge of the AI Accelerate skills library.

${SKILLS_CONTEXT}

When given an interview question or role description:

1. **Identify the skill(s) being tested** — Which skills from the library does this question probe?

2. **Structure the answer** — Use a clear framework appropriate to the question type:
   - Design questions: Problem → Architecture → Metrics → Risks → Tradeoffs
   - Metrics questions: What to measure → How to measure → Baselines → Guardrails
   - Strategy questions: Assessment → Options → Recommendation → Execution
   - Behavioral questions: Situation → Decision → Action → Outcome → What I'd do differently

3. **Draft a strong answer** — Specific, technical, shows genuine PM + AI depth. Reference frameworks and approaches from the skills library naturally (don't say "Skill 32" in an interview — use the concepts).

4. **Signal boosters** — 2-3 things to add that demonstrate senior-level thinking beyond the obvious answer.

5. **Watch-outs** — What traps do interviewers set in this question? What weak answers look like.

For Oracle Health specifically: weave in clinical workflow knowledge, HIPAA/regulatory fluency, and HITL design — these are table stakes for the role.`,
  },
  {
    id: "risks",
    label: "Risk Analyzer",
    icon: "◬",
    color: "#ef4444",
    description: "Identify risks in a feature or spec",
    placeholder: "Paste a feature spec, agent design, or product idea to analyze for risks...",
    systemPrompt: `You are an expert AI risk analyst using the AI Accelerate skills library.

${SKILLS_CONTEXT}

When given a feature spec or product idea, perform a comprehensive risk analysis:

1. **Risk Classification** (Skill 32) — What tier is this? What does that require?

2. **Technical Risks** — Model failure modes, hallucination exposure, latency risks, cost risks

3. **Governance Risks** — Regulatory exposure (Skill 35), audit trail gaps, bias risks (Skill 34)

4. **UX/Trust Risks** (Skill 22) — What happens when the agent is wrong? Is override easy? Is trust being earned correctly?

5. **Agentic-Specific Risks** — Escalation gaps, HITL gate placement issues, memory/privacy risks, prompt injection vectors

6. **Risk Matrix**:
| Risk | Likelihood (1-5) | Impact (1-5) | Score | Mitigation |
|---|---|---|---|---|

7. **Top 3 Risks to Address Before Launch** — The ones that could kill the product or cause harm

8. **Recommended Controls** — Specific mitigations from the skills library

Be direct about serious risks. Don't soften findings. A risk you miss here is a production incident later.`,
  },
];

// ── API Call ──────────────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userMessage, onChunk) {
  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      stream: false,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

// ── Markdown Renderer ─────────────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/^### (.*$)/gm, '<h3 style="font-size:13px;font-weight:700;color:#f3f4f6;margin:20px 0 8px;letter-spacing:-0.01em">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 style="font-size:14px;font-weight:700;color:#f9fafb;margin:24px 0 10px;letter-spacing:-0.02em;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:6px">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 style="font-size:16px;font-weight:800;color:#f9fafb;margin:0 0 16px;letter-spacing:-0.02em">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f3f4f6;font-weight:600">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:#9ca3af">$1</em>')
    .replace(/`(.*?)`/g, '<code style="font-family:monospace;font-size:11px;background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:3px;color:#a5b4fc">$1</code>')
    .replace(/^\| (.*) \|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      const isHeader = cells.some(c => c.trim().startsWith('---'));
      if (isHeader) return '';
      return `<tr>${cells.map(c => `<td style="padding:6px 10px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;color:#d1d5db;vertical-align:top">${c.trim()}</td>`).join('')}</tr>`;
    })
    .replace(/(<tr>[\s\S]*?<\/tr>)/g, '<table style="width:100%;border-collapse:collapse;margin:12px 0;background:rgba(0,0,0,0.2);border-radius:6px;overflow:hidden">$1</table>')
    .replace(/^- (.*$)/gm, '<li style="font-size:13px;color:#d1d5db;margin:4px 0;padding-left:4px">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul style="margin:8px 0;padding-left:20px;list-style:disc">$&</ul>')
    .replace(/^\d+\. (.*$)/gm, '<li style="font-size:13px;color:#d1d5db;margin:6px 0">$1</li>')
    .replace(/^(?!<[h|t|u|l|c])(.*$)/gm, (m) => m.trim() ? `<p style="font-size:13px;color:#9ca3af;line-height:1.7;margin:6px 0">${m}</p>` : '')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:14px;margin:12px 0;overflow-x:auto;font-size:11px;color:#a5b4fc;font-family:monospace;line-height:1.6">$1</pre>');
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PMCopilot() {
  const [activeMode, setActiveMode] = useState(MODES[0]);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const outputRef = useRef(null);

  useEffect(() => {
    if (output && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [output]);

  const run = async () => {
    if (!input.trim() || loading) return;
    setError(null);
    setOutput("");
    setLoading(true);
    try {
      const result = await callClaude(activeMode.systemPrompt, input);
      setOutput(result);
      setHistory(h => [{ mode: activeMode.label, input: input.slice(0, 80) + (input.length > 80 ? "…" : ""), output: result, ts: new Date() }, ...h.slice(0, 4)]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const modeColor = activeMode.color;

  return (
    <div style={s.root}>
      <div style={s.bgNoise} />
      <div style={{ ...s.bgAccent, background: `radial-gradient(ellipse at 70% 0%, ${modeColor}12 0%, transparent 60%)` }} />

      {/* Header */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={{ ...s.logoIcon, borderColor: modeColor + "44", background: modeColor + "12" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" stroke={modeColor} strokeWidth="1.5"/>
              <rect x="10" y="2" width="6" height="6" rx="1.5" stroke={modeColor} strokeWidth="1.5" opacity="0.6"/>
              <rect x="2" y="10" width="6" height="6" rx="1.5" stroke={modeColor} strokeWidth="1.5" opacity="0.6"/>
              <rect x="10" y="10" width="6" height="6" rx="1.5" stroke={modeColor} strokeWidth="1.5" opacity="0.4"/>
            </svg>
          </div>
          <div>
            <div style={s.logoTitle}>PM Copilot</div>
            <div style={s.logoSub}>AI Accelerate · 51 Skills Loaded</div>
          </div>
        </div>
        <div style={s.skillCount}>
          {["A","B","C","D","E","F","G"].map((cat, i) => (
            <div key={cat} style={{ ...s.catDot, background: modeColor + (20 + i * 12).toString(16) }} title={`Category ${cat}`}>{cat}</div>
          ))}
        </div>
      </header>

      <div style={s.layout}>
        {/* Sidebar */}
        <aside style={s.sidebar}>
          <div style={s.sidebarLabel}>Mode</div>
          {MODES.map(mode => (
            <button
              key={mode.id}
              style={{ ...s.modeBtn, ...(activeMode.id === mode.id ? { ...s.modeBtnActive, borderColor: mode.color + "44", background: mode.color + "10", color: mode.color } : {}) }}
              onClick={() => { setActiveMode(mode); setOutput(""); setError(null); }}
            >
              <span style={{ ...s.modeIcon, color: activeMode.id === mode.id ? mode.color : "#6b7280" }}>{mode.icon}</span>
              <div>
                <div style={s.modeName}>{mode.label}</div>
                <div style={s.modeDesc}>{mode.description}</div>
              </div>
            </button>
          ))}

          {/* History */}
          {history.length > 0 && (
            <>
              <div style={{ ...s.sidebarLabel, marginTop: "24px" }}>Recent</div>
              {history.map((h, i) => (
                <button key={i} style={s.historyItem} onClick={() => { setOutput(h.output); setInput(h.input); }}>
                  <div style={s.historyMode}>{h.mode}</div>
                  <div style={s.historyInput}>{h.input}</div>
                </button>
              ))}
            </>
          )}
        </aside>

        {/* Main */}
        <main style={s.main}>
          {/* Mode Header */}
          <div style={s.modeHeader}>
            <span style={{ ...s.modeHeaderIcon, color: modeColor }}>{activeMode.icon}</span>
            <div>
              <div style={s.modeHeaderTitle}>{activeMode.label}</div>
              <div style={s.modeHeaderDesc}>{activeMode.description}</div>
            </div>
          </div>

          {/* Input */}
          <div style={s.inputWrap}>
            <textarea
              style={{ ...s.textarea, borderColor: loading ? modeColor + "44" : "rgba(255,255,255,0.08)" }}
              placeholder={activeMode.placeholder}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}
            />
            <div style={s.inputFooter}>
              <span style={s.hint}>⌘↵ to run</span>
              <button
                style={{ ...s.runBtn, background: `linear-gradient(135deg, ${modeColor}cc, ${modeColor})`, opacity: !input.trim() || loading ? 0.5 : 1 }}
                onClick={run}
                disabled={!input.trim() || loading}
              >
                {loading ? (
                  <span style={s.loadingDots}>
                    <span>●</span><span>●</span><span>●</span>
                  </span>
                ) : `Run ${activeMode.label} →`}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={s.errorBox}>⚠ {error}</div>
          )}

          {/* Output */}
          {output && (
            <div ref={outputRef} style={s.outputWrap}>
              <div style={s.outputHeader}>
                <div style={{ ...s.outputBadge, color: modeColor, background: modeColor + "12", borderColor: modeColor + "33" }}>
                  {activeMode.icon} {activeMode.label} Output
                </div>
                <button style={s.copyBtn} onClick={() => navigator.clipboard.writeText(output)}>
                  Copy
                </button>
              </div>
              <div
                style={s.outputBody}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(output) }}
              />
            </div>
          )}

          {/* Empty state */}
          {!output && !loading && !error && (
            <div style={s.emptyState}>
              <div style={{ ...s.emptyIcon, color: modeColor }}>{activeMode.icon}</div>
              <div style={s.emptyTitle}>Ready to run {activeMode.label}</div>
              <div style={s.emptyDesc}>Paste your input above and hit Run, or use ⌘↵</div>
              <div style={s.skillsPreview}>
                <div style={s.skillsPreviewLabel}>Skills loaded for this mode:</div>
                <div style={s.skillsTags}>
                  {activeMode.id === "prd" && ["Skill 40 — Opportunity", "Skill 17 — HITL", "Skill 28 — Metrics", "Skill 32 — Risk", "Skill 51 — Prototyping"].map(s2 => <span key={s2} style={{ ...s.skillTag, borderColor: modeColor + "33", color: modeColor + "cc" }}>{s2}</span>)}
                  {activeMode.id === "opportunity" && ["Skill 40 — AI Fit", "Skill 32 — Risk Tier", "Skill 15 — Decomposition", "Skill 16 — Architecture"].map(s2 => <span key={s2} style={{ ...s.skillTag, borderColor: modeColor + "33", color: modeColor + "cc" }}>{s2}</span>)}
                  {activeMode.id === "architecture" && ["Skill 15 — Decomposition", "Skill 16 — Orchestration", "Skill 17 — HITL", "Skill 19 — Tools", "Skill 21 — Goal Vectors"].map(s2 => <span key={s2} style={{ ...s.skillTag, borderColor: modeColor + "33", color: modeColor + "cc" }}>{s2}</span>)}
                  {activeMode.id === "interview" && ["Skill 32 — Risk", "Skill 28 — Metrics", "Skill 24 — Evals", "Skill 44 — GTM", "Skill 46 — Narrative"].map(s2 => <span key={s2} style={{ ...s.skillTag, borderColor: modeColor + "33", color: modeColor + "cc" }}>{s2}</span>)}
                  {activeMode.id === "risks" && ["Skill 32 — Classification", "Skill 33 — Responsible AI", "Skill 34 — Bias", "Skill 35 — Regulatory", "Skill 39 — Incident"].map(s2 => <span key={s2} style={{ ...s.skillTag, borderColor: modeColor + "33", color: modeColor + "cc" }}>{s2}</span>)}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <span>PM Copilot · AI Accelerate</span>
        <span>Built by David Lewis · 51 Skills · March 2026</span>
        <span>Powered by Claude Sonnet</span>
      </footer>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  root: { minHeight: "100vh", background: "#080c14", color: "#e5e7eb", fontFamily: "'DM Sans', system-ui, sans-serif", display: "flex", flexDirection: "column", position: "relative", overflowX: "hidden" },
  bgNoise: { position: "fixed", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E\")", pointerEvents: "none", zIndex: 0 },
  bgAccent: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, transition: "background 0.5s" },
  header: { position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,12,20,0.9)", backdropFilter: "blur(12px)" },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  logoIcon: { width: "34px", height: "34px", borderRadius: "8px", border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" },
  logoTitle: { fontSize: "15px", fontWeight: "700", color: "#f9fafb", letterSpacing: "-0.02em" },
  logoSub: { fontSize: "10px", color: "#4b5563", letterSpacing: "0.04em", marginTop: "1px" },
  skillCount: { display: "flex", gap: "4px" },
  catDot: { width: "22px", height: "22px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "700", color: "rgba(255,255,255,0.7)" },
  layout: { display: "flex", flex: 1, position: "relative", zIndex: 10, minHeight: 0 },
  sidebar: { width: "220px", flexShrink: 0, padding: "20px 16px", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" },
  sidebarLabel: { fontSize: "9px", fontWeight: "700", color: "#374151", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 8px", marginBottom: "4px", marginTop: "4px" },
  modeBtn: { display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 10px", borderRadius: "8px", border: "1px solid transparent", background: "transparent", color: "#6b7280", cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%" },
  modeBtnActive: { color: "#f3f4f6" },
  modeIcon: { fontSize: "16px", lineHeight: 1, marginTop: "1px", flexShrink: 0 },
  modeName: { fontSize: "12px", fontWeight: "600", color: "inherit", letterSpacing: "-0.01em" },
  modeDesc: { fontSize: "10px", color: "#4b5563", marginTop: "2px", lineHeight: "1.4" },
  historyItem: { padding: "8px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)", background: "transparent", cursor: "pointer", textAlign: "left", marginBottom: "2px" },
  historyMode: { fontSize: "9px", color: "#4b5563", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" },
  historyInput: { fontSize: "11px", color: "#6b7280", lineHeight: "1.4" },
  main: { flex: 1, padding: "28px 32px", display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto", maxWidth: "800px" },
  modeHeader: { display: "flex", alignItems: "center", gap: "12px" },
  modeHeaderIcon: { fontSize: "28px", lineHeight: 1 },
  modeHeaderTitle: { fontSize: "20px", fontWeight: "800", color: "#f9fafb", letterSpacing: "-0.03em" },
  modeHeaderDesc: { fontSize: "13px", color: "#6b7280", marginTop: "2px" },
  inputWrap: { display: "flex", flexDirection: "column", gap: "0" },
  textarea: { width: "100%", minHeight: "140px", padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid", borderRadius: "10px 10px 0 0", color: "#e5e7eb", fontSize: "13px", lineHeight: "1.7", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.2s" },
  inputFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderTop: "none", borderRadius: "0 0 10px 10px" },
  hint: { fontSize: "11px", color: "#374151" },
  runBtn: { padding: "8px 18px", borderRadius: "6px", border: "none", color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer", letterSpacing: "-0.01em", transition: "opacity 0.2s" },
  loadingDots: { display: "flex", gap: "3px", alignItems: "center", fontSize: "8px" },
  errorBox: { padding: "14px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", color: "#fca5a5", fontSize: "13px" },
  outputWrap: { display: "flex", flexDirection: "column", gap: "0", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", overflow: "hidden" },
  outputHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  outputBadge: { fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px", border: "1px solid", letterSpacing: "0.02em" },
  copyBtn: { fontSize: "11px", padding: "4px 12px", borderRadius: "5px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", cursor: "pointer" },
  outputBody: { padding: "24px", background: "rgba(0,0,0,0.2)", lineHeight: "1.7" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: "12px", textAlign: "center" },
  emptyIcon: { fontSize: "40px", lineHeight: 1, opacity: 0.6 },
  emptyTitle: { fontSize: "16px", fontWeight: "700", color: "#4b5563" },
  emptyDesc: { fontSize: "13px", color: "#374151" },
  skillsPreview: { marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" },
  skillsPreviewLabel: { fontSize: "10px", color: "#374151", letterSpacing: "0.06em", textTransform: "uppercase" },
  skillsTags: { display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" },
  skillTag: { fontSize: "10px", padding: "3px 8px", borderRadius: "4px", border: "1px solid" },
  footer: { position: "relative", zIndex: 10, display: "flex", justifyContent: "space-between", padding: "14px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "10px", color: "#1f2937" },
};
