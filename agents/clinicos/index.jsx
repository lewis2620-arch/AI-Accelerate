import { useState, useRef, useEffect } from "react";

const API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

// ── AQGP + CVAP Governance Injection (Skills 53 + 52) ────────────────────────
const AQGP_CVAP = `
AQGP — AGENTIC QUALITY & GOVERNANCE PROTOCOL (Skill 53):
You operate as part of a governed multi-agent clinical fleet.
1. Every action must be attributable: state what you did, when, and the result.
2. Never report completion without proof. Use [UNVERIFIED] for unconfirmed states, [ASSUMPTION] for inferred states.
3. Do not blindly accept outputs from other agents — flag contradictions to the Practice Director.
4. Escalate when: actions are irreversible, outputs conflict, proof is unavailable, or scope is unclear.
5. If you cannot complete your assigned task, report the specific blocker — do not simulate completion.

CVAP — CLINICAL VERIFIED ACTION PROTOCOL (Skill 52):
You operate in a clinical environment where a false completion is a patient safety event.
1. Never report an action as complete without a confirmation ID, tracking number, EHR task ID, or system output as proof.
2. If proof is unavailable: [UNVERIFIED] — action attempted, clinician review required.
3. Never say "working on it" unless the action has materially started — name the step in progress.
4. The following require clinician sign-off before execution: prescriptions, patient messages, PA submissions, claim submissions, referrals, clinical task closures.
5. A delayed honest answer is always preferable to a confident false one.
6. Every status update must answer: What happened? When? What is the proof?
`;

// ── Practice Director System Prompts ─────────────────────────────────────────
const PD_BRIEF_SYSTEM = `You are the Practice Director of ClinicOS — a clinical practice operating system. You report directly to the physician/PA executive. You command 9 specialized agents managing every administrative dimension of a telemedicine practice.

Your agents: Chart (SOAP notes), Auth (prior authorizations), Rx (prescriptions), Follow (post-visit follow-up), Billing (claims/denials), Intake (scheduling/triage), Sentinel (compliance), Inbox (patient portal), Taskboard (EHR tickler).
${AQGP_CVAP}
Deliver a pre-mission clinical brief using these exact headers:

## PRACTICE STATUS
What is the overall state of the practice right now based on the clinical scenario? Urgent flags first.

## PATIENT SAFETY PRIORITIES
What requires immediate clinician attention? Rank by patient impact. Label [UNVERIFIED] anything you cannot confirm from the input.

## AGENT TASKING
Specific directive for each agent based on the clinical scenario:
- CHART-1: [directive]
- AUTH-2: [directive]
- RX-3: [directive]
- FOLO-4: [directive]
- BILL-5: [directive]
- INTK-6: [directive]
- SNTL-7: [directive]
- INBX-8: [directive]
- TASK-9: [directive]

## DIRECTOR'S ASSESSMENT
What is the highest-risk item in this scenario? What would cause you to halt agent execution and escalate to the clinician immediately? No unsubstantiated confidence.`;

const PD_COMMENTARY = (agentName, callsign, output, scenario) =>
`You are the Practice Director monitoring live agent reports in a clinical fleet.
${AQGP_CVAP}
Scenario: ${scenario}
${agentName} (${callsign}) just filed: ${output}

2-3 sentence clinical field assessment. Rules:
- Reference a specific finding from the report as proof — no characterization without evidence.
- Flag [UNVERIFIED] claims that lack a confirmation ID or system output.
- If a patient safety issue is present, flag it immediately with [PATIENT SAFETY FLAG].
- Start with callsign. Command voice. No headers. No bullets.`;

const PD_VERDICT = (scenario, reports) =>
`You are the Practice Director. All 9 agents have reported. Deliver the Morning Clinical Briefing to the physician/PA executive.
${AQGP_CVAP}
SCENARIO: ${scenario}
FLEET REPORTS: ${reports}

Every claim must cite the agent that sourced it. Use these exact headers:

## PRACTICE PULSE
One paragraph. Current state of the practice. What's controlled, what's at risk.

## PATIENT SAFETY FLAGS
Any items requiring immediate clinician attention — cited from agent reports. If none: state that explicitly.

## KEY FINDINGS
Top 3 findings across the fleet. Format: [AGENT] → [Finding] → [Patient/Practice Impact].

## PENDING CLINICIAN SIGN-OFF
Items agents have drafted but cannot execute without physician/PA approval. Each item: what it is, which agent drafted it, what happens if delayed.

## ADMINISTRATIVE WINS
What did the fleet handle overnight/autonomously that the clinician does NOT need to touch?

## DIRECTOR'S RECOMMENDATION
One clear directive for the clinician's first 30 minutes. Specific. Actionable. Cited from fleet findings.

This is the clinician's morning briefing. Make every word count.`;

// ── Clinical Agent Fleet (9 agents) ─────────────────────────────────────────
const FLEET = [
  {
    id: "chart", name: "Chart", role: "Clinical Documentation", callsign: "CHART-1",
    color: "#38bdf8", icon: "📋",
    description: "SOAP note generation, EHR filing, note-bloat prevention, chart corrections",
    system: `You are Chart, clinical documentation agent in ClinicOS. You handle all SOAP note generation, EHR documentation, and chart management.
${AQGP_CVAP}
## DOCUMENTATION STATUS
What notes are pending, in-progress, or overdue? Every item needs an EHR encounter ID or [UNVERIFIED].

## SOAP DRAFT (if applicable)
Draft the SOAP note from the visit information provided. Flag every section that requires clinician review before filing.

## CHART CORRECTIONS NEEDED
Any coding errors, incomplete fields, or compliance flags in existing documentation.

## FILING CONFIRMATION
For any notes filed: EHR task ID + timestamp as proof. No ID = not filed.

## CLINICIAN SIGN-OFF REQUIRED
List every note that cannot be filed without physician/PA signature.`
  },
  {
    id: "auth", name: "Auth", role: "Prior Authorization", callsign: "AUTH-2",
    color: "#a78bfa", icon: "🔐",
    description: "PA submissions, approval tracking, retroactive denial detection, appeal drafting",
    system: `You are Auth, prior authorization agent in ClinicOS. You manage the full PA lifecycle — submission, tracking, denials, and appeals.
${AQGP_CVAP}
## ACTIVE AUTHORIZATIONS
Status of all pending PAs. Each must have a payer tracking number or [UNVERIFIED].

## RETROACTIVE DENIALS
Any previously approved services now denied after delivery? Flag each with: service, payer, denial date, appeal deadline.

## APPEAL QUEUE
PAs denied and eligible for appeal. For each: denial reason, overturn probability, draft appeal status, deadline.

## PEER-TO-PEER REQUESTS
Any P2P reviews scheduled or needed? Note: >50% of P2P reviews overturn denials.

## SUBMISSIONS REQUIRING SIGN-OFF
PAs drafted but not yet submitted — require clinician authorization before sending.`
  },
  {
    id: "rx", name: "Rx", role: "Prescription Management", callsign: "RX-3",
    color: "#34d399", icon: "💊",
    description: "Prescription rejections, pharmacy callbacks, step therapy challenges, formulary exceptions",
    system: `You are Rx, prescription management agent in ClinicOS. You handle all prescription rejections, pharmacy issues, and medication access challenges.
${AQGP_CVAP}
## REJECTED PRESCRIPTIONS
Any prescriptions rejected by pharmacy or PBM? For each: drug, rejection reason, pharmacy reference number or [UNVERIFIED], recommended action.

## STEP THERAPY CHALLENGES
Insurer requiring alternative medications first? Draft challenge letters for clinician review.

## FORMULARY EXCEPTIONS
Non-formulary medications needing exception requests. Status and proof of submission for each.

## PHARMACY CALLBACKS PENDING
Outstanding communications with pharmacies requiring response.

## MEDICATIONS REQUIRING SIGN-OFF
Any prescription changes or new prescriptions requiring clinician authorization before transmission.`
  },
  {
    id: "follow", name: "Follow", role: "Post-Visit Follow-Up", callsign: "FOLO-4",
    color: "#fb923c", icon: "🔄",
    description: "Lab results, referral status, no-show outreach, post-visit check-ins",
    system: `You are Follow, post-visit follow-up agent in ClinicOS. You ensure nothing falls through the cracks after a patient visit.
${AQGP_CVAP}
## OUTSTANDING LAB RESULTS
Labs ordered but results not yet reviewed. Each must have: order ID, ordered date, expected return, current status.

## REFERRAL STATUS
Referrals made — has the specialist confirmed receipt? Patient scheduled? Confirmation ID or [UNVERIFIED] for each.

## NO-SHOW OUTREACH
Patients who missed appointments. Outreach attempted: method, date, response. No outreach claimed without contact log reference.

## POST-VISIT CHECK-INS
Scheduled check-ins due or overdue. Status with timestamps.

## FLAGS FOR CLINICIAN
Any follow-up findings that require clinical decision — do not act on these without sign-off.`
  },
  {
    id: "billing", name: "Billing", role: "Claims & Denials", callsign: "BILL-5",
    color: "#f472b6", icon: "💳",
    description: "Claim scrubbing, denial detection, billing corrections, coding compliance",
    system: `You are Billing, claims and revenue cycle agent in ClinicOS. You manage claim integrity, denial detection, and billing corrections.
${AQGP_CVAP}
## CLAIM STATUS
Recent claims: submitted, pending, denied, paid. Each with clearinghouse submission ID or [UNVERIFIED].

## DENIAL ANALYSIS
Denied claims: denial code, reason, correction needed, resubmission deadline. No denial without a specific reason code.

## CODING FLAGS
Any CPT/ICD coding issues detected that could trigger denial or audit risk.

## BILLING CORRECTIONS DRAFTED
Corrections prepared for clinician review — must not be submitted without sign-off.

## REVENUE IMPACT SUMMARY
Approximate revenue at risk from pending denials and outstanding claims.`
  },
  {
    id: "intake", name: "Intake", role: "Scheduling & Triage", callsign: "INTK-6",
    color: "#fbbf24", icon: "📅",
    description: "Scheduling across time zones, patient triage, intake forms, insurance verification",
    system: `You are Intake, scheduling and triage agent in ClinicOS. You manage patient flow for a telemedicine practice operating across time zones.
${AQGP_CVAP}
## UPCOMING SCHEDULE
Next 48 hours of appointments with time zones converted to clinician's local time. Confirmation status for each.

## TRIAGE QUEUE
New patient requests pending triage. Urgency classification for each: Urgent / Routine / Can wait. Label [ASSUMPTION] on urgency assessments without clinical data.

## INSURANCE VERIFICATION
Patients with unverified or lapsed insurance. Each item needs verification status and reference.

## INTAKE FORMS INCOMPLETE
Patients with missing intake information before scheduled visit.

## SCHEDULING CONFLICTS
Any double-bookings, timezone errors, or coverage gaps to flag.`
  },
  {
    id: "sentinel", name: "Sentinel", role: "Compliance Watchdog", callsign: "SNTL-7",
    color: "#ef4444", icon: "🛡️",
    description: "HIPAA compliance, cross-state telehealth rules, licensure monitoring, malpractice flags",
    system: `You are Sentinel, compliance watchdog agent in ClinicOS. You monitor regulatory, licensure, and patient safety compliance for a multi-state telemedicine practice.
${AQGP_CVAP}
## LICENSURE STATUS
Active licenses by state — any expiring within 90 days? Cross-state telehealth prescribing compliance for each patient's state.

## HIPAA FLAGS
Any potential HIPAA exposure in current workflows. Specific regulation cited for each flag.

## TELEHEALTH COMPLIANCE
State-specific telehealth requirements for scheduled patients. Any states requiring in-person visit before telehealth?

## MALPRACTICE COVERAGE
Coverage current for all states of practice? Any gaps flagged.

## REGULATORY ALERTS
Any new CMS rules, state telehealth law changes, or DEA regulations affecting this practice in the last 30 days.`
  },
  {
    id: "inbox", name: "Inbox", role: "Patient Portal", callsign: "INBX-8",
    color: "#06b6d4", icon: "📬",
    description: "Patient portal message triage, urgency classification, draft responses, escalation",
    system: `You are Inbox, patient portal management agent in ClinicOS. You triage all patient messages and ensure nothing urgent is missed.
${AQGP_CVAP}
## MESSAGE TRIAGE
All unread/pending patient messages classified by urgency:
- 🔴 URGENT: Symptoms, medication issues, safety concerns — flag immediately for clinician
- 🟡 SAME-DAY: Questions needing clinical input today
- 🟢 ROUTINE: Administrative, scheduling, refill requests

For each message: patient identifier (anonymized), message summary, urgency level, recommended action.

## DRAFT RESPONSES
Routine messages where a draft response has been prepared for clinician review and approval.
⚠️ No response is sent without clinician sign-off. Draft only.

## ESCALATIONS
Any message that requires immediate clinician attention — do not queue, surface now.

## RESPONSE BACKLOG
Messages awaiting clinician response beyond 24 hours — flag aging items.`
  },
  {
    id: "taskboard", name: "Taskboard", role: "EHR Tickler System", callsign: "TASK-9",
    color: "#8b5cf6", icon: "✅",
    description: "Pending, urgent, and overdue EHR tasks — aging tracker, escalation before compliance issues",
    system: `You are Taskboard, EHR tickler and task management agent in ClinicOS. You surface every pending, urgent, and overdue task before it becomes a compliance or patient safety issue.
${AQGP_CVAP}
## OVERDUE TASKS 🔴
Tasks past their due date. For each: task type, patient, due date, days overdue, EHR task ID. No overdue task without a task ID.

## URGENT TASKS 🟡
Tasks due today or flagged urgent. Prioritized list with deadlines.

## PENDING TASKS 🟢
Upcoming tasks within 7 days. Sorted by due date.

## TASK AGING ANALYSIS
Any task category with systemic backlog? Flag the pattern, not just individual items.

## COMPLETED TODAY
Tasks closed in the last 24 hours — with closing agent/clinician identifier as proof.

## ESCALATION REQUIRED
Tasks that have aged beyond acceptable thresholds and require clinician intervention — do not wait for routine review.`
  }
];

// ── API Call ──────────────────────────────────────────────────────────────────
async function callClaude(system, userMsg) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 1000, system, messages: [{ role: "user", content: userMsg }] })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
}

// ── Markdown Renderer ─────────────────────────────────────────────────────────
function renderMd(text, color, small = false) {
  if (!text) return "";
  const fs = small ? "11px" : "12px";
  return text
    .replace(/^## (.+)$/gm, `<div style="font-size:9px;font-weight:700;color:${color};letter-spacing:0.12em;text-transform:uppercase;margin:14px 0 5px;padding-bottom:3px;border-bottom:1px solid ${color}22">$1</div>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="color:#f1f5f9">$1</strong>`)
    .replace(/\[PATIENT SAFETY FLAG[^\]]*\]/g, `<span style="background:#7f1d1d;color:#fca5a5;font-size:9px;font-weight:700;font-family:monospace;padding:2px 6px;border-radius:3px;margin:0 2px">⚠ PATIENT SAFETY FLAG</span>`)
    .replace(/\[UNVERIFIED[^\]]*\]/g, `<span style="background:#7c2d12;color:#fed7aa;font-size:9px;font-weight:700;font-family:monospace;padding:1px 5px;border-radius:3px;margin:0 2px">[UNVERIFIED]</span>`)
    .replace(/\[ASSUMPTION[^\]]*\]/g, `<span style="background:#4a1d96;color:#ddd6fe;font-size:9px;font-weight:700;font-family:monospace;padding:1px 5px;border-radius:3px;margin:0 2px">[ASSUMPTION]</span>`)
    .replace(/🔴/g, `<span style="color:#ef4444">🔴</span>`)
    .replace(/🟡/g, `<span style="color:#fbbf24">🟡</span>`)
    .replace(/🟢/g, `<span style="color:#34d399">🟢</span>`)
    .replace(/^\d+\. (.+)$/gm, `<div style="display:flex;gap:6px;margin:3px 0"><span style="color:${color};font-size:9px;font-weight:700;margin-top:3px;flex-shrink:0">▸</span><span style="color:#94a3b8;font-size:${fs};line-height:1.6">$1</span></div>`)
    .replace(/^- (.+)$/gm, `<div style="display:flex;gap:6px;margin:2px 0"><span style="color:${color};font-size:8px;margin-top:4px;flex-shrink:0">●</span><span style="color:#94a3b8;font-size:${fs};line-height:1.6">$1</span></div>`)
    .replace(/^(?!<)(.*\S.*)$/gm, `<p style="color:#94a3b8;font-size:${fs};line-height:1.7;margin:3px 0">$1</p>`);
}

const TEAL = "#14b8a6";

// ── Practice Director Panel ───────────────────────────────────────────────────
function PracticeDirectorPanel({ phase, brief, commentary, verdict, loading }) {
  const label = {
    idle: "STANDING BY",
    briefing: "ASSESSING PRACTICE STATUS",
    monitoring: "MONITORING CLINICAL FLEET",
    verdict: "COMPILING MORNING BRIEFING",
    done: "MORNING BRIEFING READY"
  }[phase];
  const active = ["briefing","monitoring","verdict"].includes(phase);
  const showBrief = ["briefing","monitoring"].includes(phase) && brief;
  const showVerdict = phase === "done" && verdict;

  return (
    <div style={{ background:"#071210", border:`1px solid ${phase==="idle"?"#1e293b":TEAL+"40"}`, borderRadius:"10px", overflow:"hidden", boxShadow:phase!=="idle"?`0 0 40px ${TEAL}10`:"none", transition:"all 0.4s" }}>
      {/* Header */}
      <div style={{ padding:"13px 20px", borderBottom:`1px solid ${TEAL}20`, background:"#050e0d", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
          <div style={{ width:"40px", height:"40px", borderRadius:"8px", border:`1px solid ${TEAL}40`, background:`${TEAL}10`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>🏥</div>
          <div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"14px", fontWeight:"700", color:"#ccfbf1", letterSpacing:"0.02em" }}>PRACTICE DIRECTOR</div>
            <div style={{ fontSize:"9px", color:TEAL, letterSpacing:"0.14em", opacity:0.7, marginTop:"1px" }}>CLINICOS — REPORTS TO PHYSICIAN / PA EXECUTIVE</div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"6px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", padding:"4px 10px", borderRadius:"4px", background:phase==="idle"?"#1e293b":`${TEAL}12`, border:`1px solid ${phase==="idle"?"#334155":TEAL+"30"}` }}>
            <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:phase==="idle"?"#475569":TEAL, boxShadow:active?`0 0 8px ${TEAL}`:"none", animation:active?"pulse 1.5s infinite":"none" }}/>
            <span style={{ fontSize:"9px", fontWeight:"700", color:phase==="idle"?"#475569":TEAL, letterSpacing:"0.1em", fontFamily:"monospace" }}>{label}</span>
          </div>
          <div style={{ display:"flex", gap:"6px" }}>
            <span style={{ fontSize:"8px", color:"#0f766e", fontFamily:"monospace", padding:"1px 5px", border:"1px solid #0f766e33", borderRadius:"3px" }}>AQGP-53</span>
            <span style={{ fontSize:"8px", color:"#0f766e", fontFamily:"monospace", padding:"1px 5px", border:"1px solid #0f766e33", borderRadius:"3px" }}>CVAP-52</span>
          </div>
        </div>
      </div>

      {/* CVAP Banner */}
      {phase !== "idle" && (
        <div style={{ padding:"5px 20px", background:`${TEAL}06`, borderBottom:`1px solid ${TEAL}12`, display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ fontSize:"9px", color:TEAL, fontFamily:"monospace", fontWeight:"700", opacity:0.5 }}>CVAP ACTIVE</span>
          <span style={{ fontSize:"9px", color:"#1e3a5f", fontFamily:"monospace" }}>No status without proof · [UNVERIFIED] flags unconfirmed actions · Patient safety events escalated immediately · Clinician sign-off required before execution</span>
        </div>
      )}

      <div style={{ padding:"16px 20px", minHeight:"100px" }}>
        {phase==="idle" && <p style={{ fontSize:"11px", color:"#0f766e", fontFamily:"monospace", margin:0 }}>// Practice Director standing by. Describe a clinical scenario or morning status — fleet will deploy under AQGP + CVAP governance.</p>}
        {loading && !brief && !verdict && (
          <div style={{ display:"flex", gap:"6px" }}>{[90,68,82,55,76].map((w,i)=><div key={i} style={{ height:"7px", borderRadius:"3px", background:`${TEAL}18`, width:`${w}px`, animation:`shimmer 1.2s ${i*0.1}s infinite` }}/>)}</div>
        )}

        {showBrief && (
          <div style={{ display:"grid", gridTemplateColumns:commentary.length>0?"1fr 1fr":"1fr", gap:"20px" }}>
            <div dangerouslySetInnerHTML={{ __html: renderMd(brief, TEAL, true) }}/>
            {commentary.length > 0 && (
              <div style={{ borderLeft:`1px solid ${TEAL}18`, paddingLeft:"20px" }}>
                <div style={{ fontSize:"9px", color:TEAL, letterSpacing:"0.12em", fontWeight:"700", marginBottom:"10px", fontFamily:"monospace", opacity:0.7 }}>LIVE CLINICAL ASSESSMENT</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {commentary.map((c,i)=>(
                    <div key={i} style={{ padding:"8px 10px", background:`${TEAL}06`, border:`1px solid ${TEAL}15`, borderRadius:"5px", animation:"fadein 0.4s ease" }}>
                      <p style={{ color:"#cbd5e1", fontSize:"11px", lineHeight:"1.65", margin:0 }}>{c}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showVerdict && <div dangerouslySetInnerHTML={{ __html: renderMd(verdict, TEAL) }}/>}

        {phase==="done" && brief && (
          <details style={{ marginTop:"16px" }}>
            <summary style={{ fontSize:"9px", color:"#334155", fontFamily:"monospace", cursor:"pointer", userSelect:"none", letterSpacing:"0.1em" }}>▸ VIEW PRACTICE BRIEF + CLINICAL ASSESSMENTS</summary>
            <div style={{ marginTop:"12px", paddingTop:"12px", borderTop:`1px solid ${TEAL}12` }}>
              <div style={{ display:"grid", gridTemplateColumns:commentary.length>0?"1fr 1fr":"1fr", gap:"20px" }}>
                <div dangerouslySetInnerHTML={{ __html: renderMd(brief, TEAL, true) }}/>
                {commentary.length > 0 && (
                  <div style={{ borderLeft:`1px solid ${TEAL}18`, paddingLeft:"20px" }}>
                    <div style={{ fontSize:"9px", color:TEAL, letterSpacing:"0.12em", fontWeight:"700", marginBottom:"10px", fontFamily:"monospace", opacity:0.7 }}>CLINICAL ASSESSMENTS</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                      {commentary.map((c,i)=><div key={i} style={{ padding:"8px 10px", background:`${TEAL}06`, border:`1px solid ${TEAL}14`, borderRadius:"5px" }}><p style={{ color:"#cbd5e1", fontSize:"11px", lineHeight:"1.65", margin:0 }}>{c}</p></div>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

// ── Agent Panel ───────────────────────────────────────────────────────────────
function AgentPanel({ agent, status, output, elapsed }) {
  const ref = useRef(null);
  useEffect(() => { if (output && ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [output]);
  const cfg = {
    idle:    { label:"STANDBY",  bg:"#1e293b",         dot:"#475569",    border:"#1e293b" },
    running: { label:"ACTIVE",   bg:agent.color+"14",  dot:agent.color,  border:agent.color+"50" },
    done:    { label:"REPORTED", bg:"#052e16",         dot:"#4ade80",    border:agent.color+"22" },
    error:   { label:"ERROR",    bg:"#2d0a0a",         dot:"#ef4444",    border:"#ef444430" }
  }[status] || { label:"STANDBY", bg:"#1e293b", dot:"#475569", border:"#1e293b" };

  return (
    <div style={{ background:"#071210", border:`1px solid ${cfg.border}`, borderRadius:"8px", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:status==="running"?`0 0 14px ${agent.color}0e`:"none", transition:"border-color 0.3s", minHeight:"260px" }}>
      <div style={{ padding:"9px 12px", borderBottom:`1px solid ${TEAL}12`, background:"#050e0d", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <div style={{ width:"28px", height:"28px", borderRadius:"5px", background:agent.color+"10", border:`1px solid ${agent.color}28`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px" }}>{agent.icon}</div>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
              <span style={{ fontSize:"12px", fontWeight:"700", color:"#f1f5f9" }}>{agent.name}</span>
              <span style={{ fontSize:"8px", color:agent.color, fontFamily:"monospace", opacity:0.6 }}>{agent.callsign}</span>
            </div>
            <div style={{ fontSize:"9px", color:"#475569" }}>{agent.role}</div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"3px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"4px", padding:"2px 7px", borderRadius:"3px", background:cfg.bg, border:`1px solid ${cfg.dot}28` }}>
            <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:cfg.dot, animation:status==="running"?"pulse 1s infinite":"none", boxShadow:status==="running"?`0 0 5px ${agent.color}`:"none" }}/>
            <span style={{ fontSize:"8px", fontWeight:"700", color:cfg.dot, fontFamily:"monospace", letterSpacing:"0.08em" }}>{cfg.label}</span>
          </div>
          {elapsed && status==="done" && <span style={{ fontSize:"8px", color:"#1e3a5f", fontFamily:"monospace" }}>{elapsed}s</span>}
        </div>
      </div>
      <div ref={ref} style={{ flex:1, padding:"12px", overflowY:"auto" }}>
        {status==="idle" && <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"5px", opacity:0.2 }}><span style={{ fontSize:"22px" }}>{agent.icon}</span><span style={{ fontSize:"10px", color:"#475569", textAlign:"center" }}>{agent.description}</span></div>}
        {status==="running" && !output && <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>{[100,72,85,60].map((w,i)=><div key={i} style={{ height:"7px", borderRadius:"3px", background:`${agent.color}14`, width:`${w}%`, animation:`shimmer 1.4s ${i*0.18}s infinite` }}/>)}</div>}
        {output && <div dangerouslySetInnerHTML={{ __html: renderMd(output, agent.color) }}/>}
        {status==="error" && <p style={{ color:"#ef4444", fontSize:"11px" }}>⚠ Agent error — retry.</p>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ClinicOS() {
  const [scenario, setScenario] = useState("");
  const [phase, setPhase] = useState("idle");
  const [brief, setBrief] = useState("");
  const [commentary, setCommentary] = useState([]);
  const [verdict, setVerdict] = useState("");
  const [pdLoading, setPdLoading] = useState(false);
  const [statuses, setStatuses] = useState({});
  const [outputs, setOutputs] = useState({});
  const [elapsed, setElapsed] = useState({});
  const [missionTime, setMissionTime] = useState(0);
  const [missionActive, setMissionActive] = useState(false);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  const doneCount = FLEET.filter(a => statuses[a.id]==="done").length;
  const allDone = FLEET.every(a => statuses[a.id]==="done" || statuses[a.id]==="error");
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  useEffect(() => {
    if (missionActive) { timerRef.current = setInterval(()=>setMissionTime(t=>t+1),1000); }
    else clearInterval(timerRef.current);
    return ()=>clearInterval(timerRef.current);
  }, [missionActive]);

  const launch = async () => {
    if (!scenario.trim() || running) return;
    setRunning(true); setMissionActive(true); setMissionTime(0);
    setBrief(""); setVerdict(""); setCommentary([]);
    const init = {}; FLEET.forEach(a=>{init[a.id]="idle";});
    setStatuses(init); setOutputs({}); setElapsed({});

    // Phase 1 — Practice Director briefs
    setPhase("briefing"); setPdLoading(true);
    let briefText = "";
    try {
      briefText = await callClaude(PD_BRIEF_SYSTEM, `Clinical scenario:\n\n${scenario}`);
      setBrief(briefText);
    } catch {
      briefText = "[UNVERIFIED] Practice Director brief failed — deploying fleet on raw scenario input.";
      setBrief(briefText);
    }
    setPdLoading(false); setPhase("monitoring");

    // Phase 2 — All 9 agents deploy in parallel
    FLEET.forEach(a=>setStatuses(prev=>({...prev,[a.id]:"running"})));
    const t0 = Date.now();
    const results = {};

    await Promise.all(FLEET.map(async agent => {
      try {
        const ctx = `Practice Director Clinical Brief:\n${briefText}\n\nClinical Scenario:\n${scenario}`;
        const out = await callClaude(agent.system, ctx);
        const secs = ((Date.now()-t0)/1000).toFixed(1);
        results[agent.id] = out;
        setOutputs(prev=>({...prev,[agent.id]:out}));
        setStatuses(prev=>({...prev,[agent.id]:"done"}));
        setElapsed(prev=>({...prev,[agent.id]:secs}));
        try {
          const note = await callClaude(
            `You are the Practice Director monitoring clinical agents. ${AQGP_CVAP} Field assessment: 2-3 sentences. Start with callsign. Flag [PATIENT SAFETY FLAG] if present. Command voice. No headers.`,
            PD_COMMENTARY(agent.name, agent.callsign, out, scenario)
          );
          setCommentary(prev=>[...prev, note]);
        } catch {
          setCommentary(prev=>[...prev, `${agent.callsign} filed report. [Commentary unavailable — CVAP: no proof to cite]`]);
        }
      } catch {
        setStatuses(prev=>({...prev,[agent.id]:"error"}));
      }
    }));

    // Phase 3 — Morning Clinical Briefing
    setPhase("verdict"); setPdLoading(true);
    try {
      const all = FLEET.map(a=>`=== ${a.name} (${a.callsign}) ===\n${results[a.id]||"No report filed."}`).join("\n\n");
      const v = await callClaude(
        `You are the Practice Director delivering the Morning Clinical Briefing. ${AQGP_CVAP}`,
        PD_VERDICT(scenario, all)
      );
      setVerdict(v);
    } catch {
      setVerdict("[UNVERIFIED] Morning briefing generation failed. Review agent reports directly.");
    }
    setPhase("done"); setPdLoading(false);
    setMissionActive(false); setRunning(false);
  };

  const reset = () => {
    setScenario(""); setPhase("idle"); setBrief(""); setVerdict(""); setCommentary([]);
    setStatuses({}); setOutputs({}); setElapsed({});
    setMissionTime(0); setMissionActive(false); setRunning(false);
  };

  // Layout: 3-3-3 grid
  const row1 = FLEET.slice(0, 3);
  const row2 = FLEET.slice(3, 6);
  const row3 = FLEET.slice(6, 9);

  return (
    <div style={{ minHeight:"100vh", background:"#040d0c", color:"#e2e8f0", fontFamily:"'Space Grotesk',system-ui,sans-serif", display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.4)}}
        @keyframes shimmer{0%{opacity:0.2}50%{opacity:0.6}100%{opacity:0.2}}
        @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
        @keyframes fadein{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:#071210}
        ::-webkit-scrollbar-thumb{background:#0f3d38;border-radius:2px}
        textarea{color-scheme:dark}
        details summary::-webkit-details-marker{display:none}
      `}</style>

      <div style={{ position:"fixed", inset:0, pointerEvents:"none", backgroundImage:`linear-gradient(${TEAL}12 1px,transparent 1px),linear-gradient(90deg,${TEAL}12 1px,transparent 1px)`, backgroundSize:"48px 48px", opacity:0.3 }}/>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:50, overflow:"hidden", opacity:0.015 }}>
        <div style={{ position:"absolute", width:"100%", height:"2px", background:`rgba(20,184,166,1)`, animation:"scanline 16s linear infinite" }}/>
      </div>

      {/* Header */}
      <header style={{ position:"relative", zIndex:10, padding:"0 24px", height:"52px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${TEAL}18`, background:"rgba(4,13,12,0.98)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <span style={{ fontSize:"18px" }}>🏥</span>
          <div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"13px", fontWeight:"700", color:"#ccfbf1", letterSpacing:"0.04em" }}>ClinicOS</div>
            <div style={{ fontSize:"8px", color:TEAL, letterSpacing:"0.12em", opacity:0.6, marginTop:"-1px" }}>FULL PRACTICE OPERATING SYSTEM</div>
          </div>
          <div style={{ width:"1px", height:"20px", background:`${TEAL}20` }}/>
          <span style={{ fontSize:"9px", color:"#0f3d38", fontFamily:"monospace", letterSpacing:"0.08em" }}>AI ACCELERATE // DAVID LEWIS // AQGP-53 + CVAP-52</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
          <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", maxWidth:"160px" }}>
            {FLEET.map(a=><div key={a.id} title={a.callsign} style={{ width:"6px", height:"6px", borderRadius:"50%", background:statuses[a.id]==="done"?a.color:statuses[a.id]==="running"?a.color:"#1e293b", opacity:statuses[a.id]==="running"?1:0.7, boxShadow:statuses[a.id]==="running"?`0 0 5px ${a.color}`:"none", animation:statuses[a.id]==="running"?"pulse 1s infinite":"none", transition:"all 0.3s" }}/>)}
          </div>
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"14px", color:missionActive?TEAL:"#1e3a5f", letterSpacing:"0.05em" }}>{fmt(missionTime)}</span>
          <span style={{ fontSize:"9px", color:"#1e3a5f", fontFamily:"monospace" }}>{doneCount}/9 AGENTS</span>
        </div>
      </header>

      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"14px", padding:"16px 24px 24px", position:"relative", zIndex:10, overflowY:"auto" }}>

        {/* Clinical Scenario Input */}
        <div style={{ background:"#071210", border:`1px solid ${running?TEAL+"30":"#1e293b"}`, borderRadius:"10px", overflow:"hidden", transition:"border-color 0.3s", flexShrink:0 }}>
          <div style={{ padding:"9px 16px", borderBottom:`1px solid ${TEAL}15`, background:"#040d0c", display:"flex", alignItems:"center", gap:"8px" }}>
            <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:TEAL, animation:running?"pulse 1s infinite":"none" }}/>
            <span style={{ fontSize:"9px", fontWeight:"700", color:TEAL, letterSpacing:"0.12em", fontFamily:"'Space Mono',monospace" }}>CLINICAL SCENARIO</span>
            <span style={{ fontSize:"9px", color:"#0f3d38", marginLeft:"auto", fontFamily:"monospace" }}>Practice Director briefs under CVAP before fleet deploys · ⌘↵ to run</span>
          </div>
          <div style={{ display:"flex" }}>
            <textarea
              value={scenario}
              onChange={e=>setScenario(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)launch();}}
              placeholder="Describe a clinical scenario or morning status. Examples: 'Patient had knee surgery approved by insurance — now denied retroactively. 3 prescriptions rejected by pharmacy. 12 unread portal messages. 5 overdue EHR tasks. Prior auth for MRI still pending 8 days...' Practice Director will assess, task all 9 agents under CVAP, and deliver a Morning Clinical Briefing."
              disabled={running}
              style={{ flex:1, background:"transparent", border:"none", outline:"none", padding:"13px 16px", color:"#e2e8f0", fontSize:"13px", lineHeight:"1.7", resize:"none", minHeight:"90px", fontFamily:"inherit", opacity:running?0.5:1 }}
            />
            <div style={{ display:"flex", flexDirection:"column", padding:"10px 12px", gap:"6px", borderLeft:`1px solid ${TEAL}15`, justifyContent:"center", flexShrink:0 }}>
              <button onClick={launch} disabled={!scenario.trim()||running} style={{ padding:"9px 18px", borderRadius:"6px", border:"none", background:!scenario.trim()||running?"#1e293b":`linear-gradient(135deg,#0d9488,${TEAL})`, color:!scenario.trim()||running?"#475569":"#040d0c", fontSize:"11px", fontWeight:"700", cursor:!scenario.trim()||running?"not-allowed":"pointer", letterSpacing:"0.05em", fontFamily:"'Space Mono',monospace", whiteSpace:"nowrap" }}>
                {running?"▶ RUNNING":"▶ RUN CLINICOS"}
              </button>
              {phase!=="idle"&&!running&&<button onClick={reset} style={{ padding:"7px 18px", borderRadius:"6px", border:`1px solid ${TEAL}20`, background:"transparent", color:"#0f766e", fontSize:"10px", cursor:"pointer", fontFamily:"monospace" }}>↺ NEW SCENARIO</button>}
            </div>
          </div>
        </div>

        {/* Practice Director */}
        <PracticeDirectorPanel phase={phase} brief={brief} commentary={commentary} verdict={verdict} loading={pdLoading}/>

        {/* Fleet */}
        {phase!=="idle"&&(
          <>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", animation:"fadein 0.4s ease" }}>
              <span style={{ fontSize:"9px", color:"#0f3d38", letterSpacing:"0.14em", fontFamily:"monospace", fontWeight:"700" }}>CLINICAL FLEET — 9 AGENTS — PARALLEL EXECUTION — AQGP + CVAP GOVERNED</span>
              <div style={{ flex:1, height:"1px", background:`${TEAL}12` }}/>
              {FLEET.some(a=>statuses[a.id]==="running")&&<span style={{ fontSize:"9px", color:TEAL, fontFamily:"monospace" }}>● PROCESSING</span>}
              {allDone&&<span style={{ fontSize:"9px", color:TEAL, fontFamily:"monospace" }}>✦ ALL STATIONS REPORTED</span>}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px", animation:"fadein 0.5s ease" }}>
              {[row1, row2, row3].map((row, ri) => (
                <div key={ri} style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px" }}>
                  {row.map(a=><AgentPanel key={a.id} agent={a} status={statuses[a.id]||"idle"} output={outputs[a.id]||""} elapsed={elapsed[a.id]}/>)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer style={{ position:"relative", zIndex:10, padding:"9px 24px", borderTop:`1px solid ${TEAL}12`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <span style={{ fontSize:"9px", color:"#0f3d38", fontFamily:"monospace" }}>CLINICOS // AI ACCELERATE // DAVID LEWIS // 2026 // AQGP-53 + CVAP-52</span>
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
          {FLEET.map(a=><div key={a.id} style={{ display:"flex", alignItems:"center", gap:"3px" }}><span style={{ fontSize:"10px" }}>{a.icon}</span><span style={{ fontSize:"8px", color:"#0f3d38", fontFamily:"monospace" }}>{a.callsign}</span></div>)}
        </div>
      </footer>
    </div>
  );
}
