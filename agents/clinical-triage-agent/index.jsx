import { useState, useRef, useEffect } from "react";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

// ── System Prompts ────────────────────────────────────────────────────────────

const CLASSIFIER_PROMPT = `You are a clinical message classifier for an ambulatory physician inbox triage system.

Your role is to analyze incoming patient and staff messages and produce a structured classification.

Classify EVERY message across these dimensions:

MESSAGE_TYPE: One of:
- CLINICAL_QUESTION (patient asking about symptoms, conditions, or care)
- MEDICATION_REFILL (request to refill or adjust a prescription)
- TEST_RESULT (lab result, imaging result, or diagnostic inquiry)
- REFERRAL_REQUEST (request for specialist referral)
- APPOINTMENT_REQUEST (scheduling or rescheduling)
- URGENT_CONCERN (any message with immediate safety implications)
- ADMINISTRATIVE (billing, forms, records requests)
- CARE_COORDINATION (post-discharge, care plan questions)
- OTHER (does not fit above categories)

URGENCY: One of:
- URGENT (requires physician response within 2 hours — safety concern, acute symptom, medication emergency)
- SAME_DAY (should be addressed today — new symptom, concerning result, time-sensitive)
- ROUTINE (standard response window 24-48 hours)
- ADMINISTRATIVE (non-clinical, can be routed to staff)

RISK_FLAGS: Array of specific risk indicators found. Examples:
- "Chest pain mentioned"
- "Medication dosing question"
- "Lab value outside reference range"
- "Suicidal ideation language"
- "Drug interaction concern"
- "Post-surgical symptom"
Return empty array [] if none found.

CONFIDENCE: 0.0 to 1.0 — your confidence in this classification.

ROUTING: One of:
- PHYSICIAN_IMMEDIATE (urgent — physician must see now)
- PHYSICIAN_REVIEW (physician review before response sent)
- NURSE_TRIAGE (can be triaged by clinical staff first)
- STAFF_HANDLE (administrative staff can handle)

SUMMARY: One sentence summarizing what this message is about and why it matters.

Respond ONLY with valid JSON in exactly this format:
{
  "message_type": "...",
  "urgency": "...",
  "risk_flags": ["...", "..."],
  "confidence": 0.0,
  "routing": "...",
  "summary": "..."
}

CRITICAL SAFETY RULES:
- When in doubt between urgency tiers, always classify HIGHER urgency
- Any mention of chest pain, difficulty breathing, altered mental status = URGENT minimum
- Any suicidal or self-harm language = URGENT + PHYSICIAN_IMMEDIATE
- Never downgrade urgency based on message tone — a calm message about chest pain is still URGENT`;

const DRAFTER_PROMPT = `You are a clinical response drafter for an ambulatory physician inbox system.

You receive a patient or staff message along with its triage classification, and you draft an appropriate response.

DRAFTING RULES:
1. Match tone to urgency — urgent messages get immediate, action-oriented responses
2. NEVER provide specific clinical diagnosis
3. NEVER recommend specific medication doses
4. NEVER provide definitive reassurance about serious symptoms
5. ALWAYS recommend appropriate escalation when warranted
6. Be warm but professional — this is a clinical communication
7. Keep responses concise — physicians will review and personalize
8. For URGENT messages: draft a response that directs immediate action
9. For ROUTINE messages: acknowledge, address the concern, provide next steps
10. Always end with an appropriate call to action

RESPONSE FORMAT:
- Opening: Brief acknowledgment
- Body: Address the specific concern (2-4 sentences)
- Next Steps: Clear action for the patient
- Close: Professional sign-off placeholder

Flag phrases that require physician personalization with [PHYSICIAN: note what needs review].

Respond with JSON:
{
  "draft": "full draft text here",
  "requires_physician_review": true/false,
  "review_reason": "specific reason if review required, null otherwise",
  "personalization_flags": ["list of things physician should personalize"],
  "estimated_response_time": "e.g. Within 2 hours / Within 24 hours"
}`;

const CRITIC_PROMPT = `You are a clinical safety critic for an ambulatory physician inbox response system.

You review drafted responses before they are presented to physicians for approval.

Your job is to catch:
1. SAFETY ISSUES: Any clinical guidance that could harm a patient
2. SCOPE VIOLATIONS: Diagnosis, specific dosing advice, definitive reassurance on serious symptoms
3. COMPLIANCE ISSUES: HIPAA concerns, inappropriate information disclosure
4. QUALITY ISSUES: Tone mismatch, missing critical next steps, unclear instructions
5. ACCURACY ISSUES: Response doesn't address what the patient actually asked

SCORING:
- APPROVED: Response is safe and appropriate for physician review
- NEEDS_REVISION: Specific issues that must be fixed before physician sees it
- ESCALATE: Safety concern serious enough to flag immediately regardless of draft quality

For each issue found, provide:
- Issue type (SAFETY / SCOPE / COMPLIANCE / QUALITY / ACCURACY)
- Severity (HIGH / MEDIUM / LOW)
- Specific problem
- Suggested fix

Respond with JSON:
{
  "verdict": "APPROVED" | "NEEDS_REVISION" | "ESCALATE",
  "safety_score": 0.0-1.0,
  "issues": [
    {
      "type": "...",
      "severity": "...",
      "problem": "...",
      "fix": "..."
    }
  ],
  "critic_notes": "Overall assessment in one sentence",
  "approved_for_physician": true/false
}`;

// ── API Call ──────────────────────────────────────────────────────────────────

async function callClaude(systemPrompt, userMessage) {
  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.content[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}

// ── Sample Messages ───────────────────────────────────────────────────────────

const SAMPLES = [
  {
    label: "Urgent — Chest Pain",
    text: "Hi, this is Mary Chen, patient of Dr. Patel. I've been having chest tightness and shortness of breath since this morning. It gets worse when I walk up stairs. I took my blood pressure and it was 158/94. I'm a little worried. Should I come in?",
  },
  {
    label: "Routine — Med Refill",
    text: "Hello, I need a refill on my lisinopril 10mg. I have about 5 days left. I've been taking it regularly and haven't had any side effects. Can you send it to CVS on Oak Street? Thanks, Robert Nguyen",
  },
  {
    label: "Lab Result Concern",
    text: "I got a notification that my lab results are ready and it says one of my values is flagged. My TSH came back at 8.2. I looked it up and it seems high? I've been feeling really tired and cold all the time lately. What does this mean?",
  },
  {
    label: "Post-Surgical Follow-up",
    text: "I had my appendectomy 4 days ago. The incision on the right side looks a little red and there's some swelling around it. There's no fever but it's more sore today than yesterday. Is this normal healing or should I be concerned?",
  },
];

// ── Urgency Config ────────────────────────────────────────────────────────────

const URGENCY_CONFIG = {
  URGENT: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "URGENT" },
  SAME_DAY: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "SAME DAY" },
  ROUTINE: { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "ROUTINE" },
  ADMINISTRATIVE: { color: "#6b7280", bg: "rgba(107,114,128,0.12)", label: "ADMIN" },
};

const VERDICT_CONFIG = {
  APPROVED: { color: "#10b981", icon: "✓" },
  NEEDS_REVISION: { color: "#f59e0b", icon: "⚠" },
  ESCALATE: { color: "#ef4444", icon: "🚨" },
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function ClinicalTriageAgent() {
  const [message, setMessage] = useState("");
  const [stage, setStage] = useState("idle"); // idle | classifying | drafting | reviewing | done | error
  const [classification, setClassification] = useState(null);
  const [draft, setDraft] = useState(null);
  const [critique, setCritique] = useState(null);
  const [editedDraft, setEditedDraft] = useState("");
  const [error, setError] = useState(null);
  const [approved, setApproved] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (stage === "done" && resultsRef.current) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [stage]);

  const reset = () => {
    setMessage(""); setStage("idle"); setClassification(null);
    setDraft(null); setCritique(null); setEditedDraft(""); setError(null); setApproved(false);
  };

  const runPipeline = async () => {
    if (!message.trim()) return;
    setError(null); setClassification(null); setDraft(null); setCritique(null); setApproved(false);

    try {
      // Stage 1 — Classify
      setStage("classifying");
      const cls = await callClaude(CLASSIFIER_PROMPT, `Classify this inbox message:\n\n${message}`);
      setClassification(cls);

      // Stage 2 — Draft
      setStage("drafting");
      const draftInput = `MESSAGE:\n${message}\n\nCLASSIFICATION:\n${JSON.stringify(cls, null, 2)}\n\nDraft an appropriate response.`;
      const dft = await callClaude(DRAFTER_PROMPT, draftInput);
      setDraft(dft);
      setEditedDraft(dft.draft);

      // Stage 3 — Critique
      setStage("reviewing");
      const criticInput = `ORIGINAL MESSAGE:\n${message}\n\nCLASSIFICATION:\n${JSON.stringify(cls, null, 2)}\n\nDRAFTED RESPONSE:\n${dft.draft}\n\nReview this draft for safety and quality.`;
      const crit = await callClaude(CRITIC_PROMPT, criticInput);
      setCritique(crit);
      setStage("done");
    } catch (e) {
      setError(e.message);
      setStage("error");
    }
  };

  const urgency = classification ? URGENCY_CONFIG[classification.urgency] || URGENCY_CONFIG.ROUTINE : null;
  const verdict = critique ? VERDICT_CONFIG[critique.verdict] || VERDICT_CONFIG.APPROVED : null;

  return (
    <div style={styles.root}>
      {/* ── Background ── */}
      <div style={styles.bgGrid} />
      <div style={styles.bgGlow} />

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoMark}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 6v4c0 4.4 3 8.5 7 9.5 4-1 7-5.1 7-9.5V6L10 2z" stroke="#34d399" strokeWidth="1.5" fill="none"/>
              <path d="M7 10l2 2 4-4" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={styles.logoTitle}>ClinicalTriage</div>
            <div style={styles.logoSub}>Ambulatory Inbox Intelligence</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.badge}>3-Agent Pipeline</span>
          <span style={styles.badge}>Claude Sonnet</span>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={styles.main}>

        {/* Input Panel */}
        <section style={styles.inputPanel}>
          <div style={styles.sectionHeader}>
            <div style={styles.stepDot}>01</div>
            <span style={styles.sectionTitle}>Incoming Message</span>
          </div>

          {/* Sample Buttons */}
          <div style={styles.samplesRow}>
            <span style={styles.samplesLabel}>Quick load:</span>
            {SAMPLES.map((s) => (
              <button key={s.label} style={styles.sampleBtn} onClick={() => setMessage(s.text)}>
                {s.label}
              </button>
            ))}
          </div>

          <textarea
            style={styles.textarea}
            placeholder="Paste or type the inbox message here…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <div style={styles.inputFooter}>
            <span style={styles.charCount}>{message.length} characters</span>
            <div style={styles.btnRow}>
              {stage !== "idle" && (
                <button style={styles.resetBtn} onClick={reset}>Reset</button>
              )}
              <button
                style={{ ...styles.runBtn, opacity: !message.trim() || (stage !== "idle" && stage !== "error" && stage !== "done") ? 0.5 : 1 }}
                onClick={runPipeline}
                disabled={!message.trim() || (stage !== "idle" && stage !== "error" && stage !== "done")}
              >
                {stage === "classifying" ? "Classifying…" :
                 stage === "drafting" ? "Drafting…" :
                 stage === "reviewing" ? "Reviewing…" :
                 stage === "done" ? "Re-run Pipeline" : "Run Triage Pipeline →"}
              </button>
            </div>
          </div>
        </section>

        {/* Pipeline Status */}
        {stage !== "idle" && (
          <section style={styles.pipelineBar}>
            {[
              { id: "classifying", label: "Classifier Agent", icon: "⬡" },
              { id: "drafting",    label: "Drafter Agent",    icon: "⬡" },
              { id: "reviewing",   label: "Critic Agent",     icon: "⬡" },
            ].map((step, i) => {
              const isActive = stage === step.id;
              const isDone = (
                (step.id === "classifying" && ["drafting","reviewing","done","error"].includes(stage) && classification) ||
                (step.id === "drafting" && ["reviewing","done","error"].includes(stage) && draft) ||
                (step.id === "reviewing" && ["done"].includes(stage) && critique)
              );
              return (
                <div key={step.id} style={styles.pipelineStep}>
                  <div style={{
                    ...styles.pipelineDot,
                    background: isDone ? "#10b981" : isActive ? "#34d399" : "#374151",
                    boxShadow: isActive ? "0 0 12px rgba(52,211,153,0.6)" : "none",
                  }}>
                    {isDone ? "✓" : isActive ? <span style={styles.spinner} /> : i + 1}
                  </div>
                  <span style={{ ...styles.pipelineLabel, color: isDone || isActive ? "#e5e7eb" : "#6b7280" }}>
                    {step.label}
                  </span>
                  {i < 2 && <div style={styles.pipelineConnector} />}
                </div>
              );
            })}
          </section>
        )}

        {/* Error */}
        {stage === "error" && (
          <div style={styles.errorBox}>
            <strong>Pipeline error:</strong> {error}
            <br/><small>Check your API key is configured correctly.</small>
          </div>
        )}

        {/* Results */}
        {(classification || draft || critique) && (
          <div ref={resultsRef} style={styles.resultsGrid}>

            {/* ── Classification Card ── */}
            {classification && (
              <section style={styles.card}>
                <div style={styles.sectionHeader}>
                  <div style={styles.stepDot}>02</div>
                  <span style={styles.sectionTitle}>Classification</span>
                  <div style={{ ...styles.urgencyBadge, background: urgency.bg, color: urgency.color, borderColor: urgency.color + "44" }}>
                    {urgency.label}
                  </div>
                </div>

                <div style={styles.classGrid}>
                  <div style={styles.classItem}>
                    <div style={styles.classLabel}>Message Type</div>
                    <div style={styles.classValue}>{classification.message_type?.replace(/_/g, " ")}</div>
                  </div>
                  <div style={styles.classItem}>
                    <div style={styles.classLabel}>Routing</div>
                    <div style={styles.classValue}>{classification.routing?.replace(/_/g, " ")}</div>
                  </div>
                  <div style={styles.classItem}>
                    <div style={styles.classLabel}>Confidence</div>
                    <div style={styles.classValue}>
                      <div style={styles.confBar}>
                        <div style={{ ...styles.confFill, width: `${(classification.confidence || 0) * 100}%` }} />
                      </div>
                      <span style={styles.confNum}>{Math.round((classification.confidence || 0) * 100)}%</span>
                    </div>
                  </div>
                </div>

                {classification.summary && (
                  <div style={styles.summary}>{classification.summary}</div>
                )}

                {classification.risk_flags?.length > 0 && (
                  <div style={styles.flagsRow}>
                    <span style={styles.flagsLabel}>Risk Flags:</span>
                    {classification.risk_flags.map((f, i) => (
                      <span key={i} style={styles.flag}>{f}</span>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ── Draft Card ── */}
            {draft && (
              <section style={styles.card}>
                <div style={styles.sectionHeader}>
                  <div style={styles.stepDot}>03</div>
                  <span style={styles.sectionTitle}>Draft Response</span>
                  {draft.requires_physician_review && (
                    <span style={styles.reviewBadge}>Physician Review Required</span>
                  )}
                </div>

                <textarea
                  style={styles.draftEdit}
                  value={editedDraft}
                  onChange={(e) => setEditedDraft(e.target.value)}
                />

                <div style={styles.draftMeta}>
                  <span style={styles.metaItem}>⏱ {draft.estimated_response_time}</span>
                  {draft.personalization_flags?.length > 0 && (
                    <span style={styles.metaItem}>✎ {draft.personalization_flags.length} personalization note{draft.personalization_flags.length > 1 ? "s" : ""}</span>
                  )}
                </div>

                {draft.personalization_flags?.length > 0 && (
                  <div style={styles.personalizeList}>
                    {draft.personalization_flags.map((f, i) => (
                      <div key={i} style={styles.personalizeItem}>→ {f}</div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ── Critic Card ── */}
            {critique && (
              <section style={styles.card}>
                <div style={styles.sectionHeader}>
                  <div style={styles.stepDot}>04</div>
                  <span style={styles.sectionTitle}>Safety Review</span>
                  <div style={{ ...styles.verdictBadge, color: verdict.color, borderColor: verdict.color + "44", background: verdict.color + "18" }}>
                    {verdict.icon} {critique.verdict?.replace(/_/g, " ")}
                  </div>
                </div>

                <div style={styles.safetyScoreRow}>
                  <span style={styles.classLabel}>Safety Score</span>
                  <div style={styles.confBar}>
                    <div style={{
                      ...styles.confFill,
                      width: `${(critique.safety_score || 0) * 100}%`,
                      background: critique.safety_score > 0.8 ? "#10b981" : critique.safety_score > 0.5 ? "#f59e0b" : "#ef4444"
                    }} />
                  </div>
                  <span style={styles.confNum}>{Math.round((critique.safety_score || 0) * 100)}%</span>
                </div>

                {critique.critic_notes && (
                  <div style={styles.criticNotes}>{critique.critic_notes}</div>
                )}

                {critique.issues?.length > 0 && (
                  <div style={styles.issuesList}>
                    {critique.issues.map((issue, i) => (
                      <div key={i} style={{ ...styles.issueItem, borderLeftColor: issue.severity === "HIGH" ? "#ef4444" : issue.severity === "MEDIUM" ? "#f59e0b" : "#6b7280" }}>
                        <div style={styles.issueHeader}>
                          <span style={styles.issueType}>{issue.type}</span>
                          <span style={{ ...styles.issueSeverity, color: issue.severity === "HIGH" ? "#ef4444" : issue.severity === "MEDIUM" ? "#f59e0b" : "#9ca3af" }}>
                            {issue.severity}
                          </span>
                        </div>
                        <div style={styles.issueProblem}>{issue.problem}</div>
                        {issue.fix && <div style={styles.issueFix}>Fix: {issue.fix}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {critique.issues?.length === 0 && (
                  <div style={styles.noIssues}>No safety or quality issues found.</div>
                )}

                {/* Approve Button */}
                {!approved ? (
                  <button
                    style={{ ...styles.approveBtn, opacity: critique.verdict === "ESCALATE" ? 0.5 : 1 }}
                    disabled={critique.verdict === "ESCALATE"}
                    onClick={() => setApproved(true)}
                  >
                    {critique.verdict === "ESCALATE" ? "Cannot approve — escalate immediately" : "✓ Approve & Send Response"}
                  </button>
                ) : (
                  <div style={styles.approvedConfirm}>
                    ✓ Response approved and queued for delivery
                  </div>
                )}
              </section>
            )}

          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <span>ClinicalTriage Agent · Ambulatory Inbox Intelligence</span>
        <span>Built by David Lewis · AI Accelerate · 2026</span>
        <span>AI drafts require physician review before delivery</span>
      </footer>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0f1a",
    color: "#e5e7eb",
    fontFamily: "'DM Sans', 'IBM Plex Sans', system-ui, sans-serif",
    position: "relative",
    overflowX: "hidden",
  },
  bgGrid: {
    position: "fixed", inset: 0, pointerEvents: "none",
    backgroundImage: "linear-gradient(rgba(52,211,153,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.03) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    zIndex: 0,
  },
  bgGlow: {
    position: "fixed", top: "-20%", right: "-10%", width: "600px", height: "600px",
    background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  header: {
    position: "relative", zIndex: 10,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 32px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(10,15,26,0.8)", backdropFilter: "blur(12px)",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  logoMark: {
    width: "36px", height: "36px", borderRadius: "8px",
    background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  logoTitle: { fontSize: "16px", fontWeight: "700", color: "#f9fafb", letterSpacing: "-0.02em" },
  logoSub: { fontSize: "11px", color: "#6b7280", letterSpacing: "0.04em", marginTop: "1px" },
  headerRight: { display: "flex", gap: "8px" },
  badge: {
    fontSize: "11px", padding: "4px 10px", borderRadius: "20px",
    background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
    color: "#34d399", fontWeight: "500", letterSpacing: "0.02em",
  },
  main: {
    position: "relative", zIndex: 10,
    maxWidth: "900px", margin: "0 auto",
    padding: "32px 24px 80px",
    display: "flex", flexDirection: "column", gap: "24px",
  },
  inputPanel: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "12px", padding: "24px",
  },
  sectionHeader: {
    display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px",
  },
  stepDot: {
    width: "26px", height: "26px", borderRadius: "50%",
    background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)",
    color: "#34d399", fontSize: "10px", fontWeight: "700",
    display: "flex", alignItems: "center", justifyContent: "center",
    letterSpacing: "0.02em",
  },
  sectionTitle: { fontSize: "14px", fontWeight: "600", color: "#f3f4f6", letterSpacing: "-0.01em" },
  samplesRow: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" },
  samplesLabel: { fontSize: "11px", color: "#6b7280" },
  sampleBtn: {
    fontSize: "11px", padding: "4px 10px", borderRadius: "6px",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#9ca3af", cursor: "pointer",
    transition: "all 0.15s",
  },
  textarea: {
    width: "100%", minHeight: "120px", padding: "14px 16px",
    background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px", color: "#e5e7eb", fontSize: "14px", lineHeight: "1.6",
    resize: "vertical", outline: "none", fontFamily: "inherit",
    boxSizing: "border-box",
  },
  inputFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px" },
  charCount: { fontSize: "11px", color: "#4b5563" },
  btnRow: { display: "flex", gap: "10px", alignItems: "center" },
  resetBtn: {
    padding: "9px 18px", borderRadius: "7px",
    background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
    color: "#9ca3af", fontSize: "13px", cursor: "pointer",
  },
  runBtn: {
    padding: "9px 20px", borderRadius: "7px",
    background: "linear-gradient(135deg, #059669, #34d399)",
    border: "none", color: "#fff", fontSize: "13px",
    fontWeight: "600", cursor: "pointer", letterSpacing: "-0.01em",
    transition: "opacity 0.2s",
  },
  pipelineBar: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "0", padding: "20px 24px",
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "10px",
  },
  pipelineStep: { display: "flex", alignItems: "center", gap: "10px" },
  pipelineDot: {
    width: "28px", height: "28px", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "11px", fontWeight: "700", color: "#fff",
    transition: "all 0.3s", flexShrink: 0,
  },
  spinner: {
    display: "inline-block", width: "10px", height: "10px",
    border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  },
  pipelineLabel: { fontSize: "12px", fontWeight: "500", whiteSpace: "nowrap" },
  pipelineConnector: {
    width: "40px", height: "1px", background: "rgba(255,255,255,0.1)", margin: "0 8px",
  },
  errorBox: {
    padding: "16px 20px", borderRadius: "8px",
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
    color: "#fca5a5", fontSize: "13px",
  },
  resultsGrid: { display: "flex", flexDirection: "column", gap: "16px" },
  card: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "12px", padding: "24px",
  },
  urgencyBadge: {
    marginLeft: "auto", padding: "4px 12px", borderRadius: "20px",
    fontSize: "11px", fontWeight: "700", border: "1px solid",
    letterSpacing: "0.06em",
  },
  reviewBadge: {
    marginLeft: "auto", padding: "4px 12px", borderRadius: "20px",
    fontSize: "11px", fontWeight: "600", letterSpacing: "0.03em",
    background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
    color: "#fbbf24",
  },
  verdictBadge: {
    marginLeft: "auto", padding: "4px 12px", borderRadius: "20px",
    fontSize: "11px", fontWeight: "700", border: "1px solid", letterSpacing: "0.03em",
  },
  classGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" },
  classItem: {},
  classLabel: { fontSize: "10px", fontWeight: "600", color: "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" },
  classValue: { fontSize: "13px", fontWeight: "600", color: "#f3f4f6", display: "flex", alignItems: "center", gap: "8px" },
  confBar: { flex: 1, height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" },
  confFill: { height: "100%", background: "linear-gradient(90deg, #059669, #34d399)", borderRadius: "2px", transition: "width 0.5s ease" },
  confNum: { fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" },
  summary: {
    fontSize: "13px", color: "#9ca3af", lineHeight: "1.6",
    padding: "12px 14px", background: "rgba(0,0,0,0.2)", borderRadius: "6px",
    borderLeft: "2px solid rgba(52,211,153,0.3)", marginBottom: "12px",
  },
  flagsRow: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  flagsLabel: { fontSize: "11px", color: "#6b7280" },
  flag: {
    fontSize: "11px", padding: "3px 9px", borderRadius: "4px",
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
    color: "#fca5a5",
  },
  draftEdit: {
    width: "100%", minHeight: "140px", padding: "14px 16px",
    background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px", color: "#e5e7eb", fontSize: "13px", lineHeight: "1.7",
    resize: "vertical", outline: "none", fontFamily: "inherit",
    boxSizing: "border-box", marginBottom: "12px",
  },
  draftMeta: { display: "flex", gap: "16px", marginBottom: "10px" },
  metaItem: { fontSize: "11px", color: "#6b7280" },
  personalizeList: { display: "flex", flexDirection: "column", gap: "4px" },
  personalizeItem: {
    fontSize: "11px", color: "#9ca3af",
    padding: "5px 10px", background: "rgba(245,158,11,0.05)",
    borderRadius: "4px", borderLeft: "2px solid rgba(245,158,11,0.3)",
  },
  safetyScoreRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" },
  criticNotes: {
    fontSize: "13px", color: "#9ca3af", lineHeight: "1.6",
    padding: "10px 14px", background: "rgba(0,0,0,0.2)",
    borderRadius: "6px", marginBottom: "14px",
    borderLeft: "2px solid rgba(255,255,255,0.1)",
  },
  issuesList: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" },
  issueItem: {
    padding: "10px 14px", background: "rgba(0,0,0,0.2)",
    borderRadius: "6px", borderLeft: "3px solid",
  },
  issueHeader: { display: "flex", justifyContent: "space-between", marginBottom: "4px" },
  issueType: { fontSize: "10px", fontWeight: "700", color: "#9ca3af", letterSpacing: "0.08em" },
  issueSeverity: { fontSize: "10px", fontWeight: "700", letterSpacing: "0.06em" },
  issueProblem: { fontSize: "12px", color: "#d1d5db", marginBottom: "4px" },
  issueFix: { fontSize: "11px", color: "#6b7280", fontStyle: "italic" },
  noIssues: {
    fontSize: "13px", color: "#34d399",
    padding: "10px 14px", background: "rgba(52,211,153,0.05)",
    borderRadius: "6px", borderLeft: "2px solid rgba(52,211,153,0.3)",
    marginBottom: "16px",
  },
  approveBtn: {
    width: "100%", padding: "12px",
    background: "linear-gradient(135deg, #059669, #34d399)",
    border: "none", borderRadius: "8px", color: "#fff",
    fontSize: "14px", fontWeight: "600", cursor: "pointer",
    letterSpacing: "-0.01em", transition: "opacity 0.2s",
  },
  approvedConfirm: {
    width: "100%", padding: "12px", textAlign: "center",
    background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
    borderRadius: "8px", color: "#34d399", fontSize: "14px", fontWeight: "600",
  },
  footer: {
    position: "relative", zIndex: 10,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 32px", borderTop: "1px solid rgba(255,255,255,0.06)",
    fontSize: "11px", color: "#374151",
  },
};
