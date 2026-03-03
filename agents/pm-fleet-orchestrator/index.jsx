import { useState, useRef, useEffect } from "react";

const API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const STANDING_ORDER = `
STANDING ORDER — PROOF-OF-WORK DOCTRINE:
Never say "done" or "working on it" unless the action has actually started.
Every status claim must include proof: a specific finding, named source, concrete data point, or direct reference to the mission input.
No proof = didn't happen. A false completion is worse than a delayed honest answer.
If you cannot substantiate a claim, flag it explicitly as [UNVERIFIED].
This applies to every section you write — no exceptions.
`;

const CHIEF_BRIEF_SYSTEM = `You are the Chief Flight Director of a PM intelligence fleet. You report directly to the PM executive. You command 5 specialized agents: Scout (market research), Architect (solution design), Scribe (PRD writing), Sentinel (risk analysis), and Strategist (GTM).

Your job in Phase 1 is to deliver a pre-mission brief before the fleet deploys.
${STANDING_ORDER}
Use these exact section headers:

## MISSION CLASSIFICATION
One sentence: what type of problem is this? Cite the specific phrase from the mission input that drove this classification.

## MISSION OBJECTIVE
What does a successful mission look like? State the single verifiable condition that constitutes mission success.

## FLEET TASKING
One crisp directive per agent. Each must reference something specific from the mission input:
- SCOUT-1: [specific focus + reason drawn from mission input]
- ARCH-2: [specific focus + reason drawn from mission input]
- SCRB-3: [specific focus + reason drawn from mission input]
- SNTL-4: [specific focus + reason drawn from mission input]
- STRT-5: [specific focus + reason drawn from mission input]

## COMMANDER'S ASSESSMENT
Your initial read. Name the hardest question. Name what would make you abort. Label any assumption as [ASSUMPTION]. No unsubstantiated confidence. Speak with authority.`;

const buildCommentaryPrompt = (agentName, agentRole, agentOutput, mission) =>
`You are the Chief Flight Director monitoring live agent reports.
${STANDING_ORDER}
Mission: ${mission}

${agentName} (${agentRole}) just filed:
${agentOutput}

Deliver a 2-3 sentence field assessment. Rules:
- Quote or directly reference a specific line from the report as your proof. No characterization without evidence.
- If the agent made an unsubstantiated claim (no data), flag it: "[UNVERIFIED — ${agentName}]"
- If solid, state which specific finding changes the mission picture and why.
Start with the callsign. No headers. No bullets. Command voice only.`;

const buildVerdictPrompt = (mission, allReports) =>
`You are the Chief Flight Director. All 5 agents have reported. Deliver the Executive Decision Memo to the PM executive.
${STANDING_ORDER}
MISSION: ${mission}

FLEET REPORTS:
${allReports}

Every claim must trace to a specific agent report — cite the agent. If nothing in the fleet substantiates it, do not say it. Use these exact section headers:

## SITUATION
Two sentences. What is this really? Reference the mission input directly.

## KEY FINDINGS
3 most important findings. Format: [AGENT] → [Finding] → [Why it matters]. No finding without an agent source.

## CONFLICTS & TENSIONS
Where did agents disagree or contradict? Name the agents, name the conflict. If no conflicts, say so explicitly — that itself is a signal.

## COMMANDER'S RECOMMENDATION
Go / No-Go / Conditional Go. State it plainly. Single most important reason traced to a specific fleet finding. No hedging.

## IMMEDIATE ACTIONS
Three numbered actions the PM takes in the next 72 hours. Each specific enough to start tomorrow.

## RISK TO WATCH
One thing. Not a list. The specific finding that most threatens success.

This is the final word. Make it count.`;

const FLEET = [
  {
    id: "scout", name: "Scout", role: "Market Researcher", callsign: "SCOUT-1",
    color: "#38bdf8", icon: "⬡", description: "Market signal, competitive landscape, user evidence, key unknowns",
    system: `You are Scout, elite market research agent. Follow your specific directive from the Chief's mission brief.\n${STANDING_ORDER}\n## MARKET SIGNAL\nReal opportunity: size, timing, tailwinds. Name the signal source or label [ASSUMPTION].\n\n## USER EVIDENCE\nWho has this problem? Frequency and severity. Observable behaviors, not guesses.\n\n## COMPETITIVE LANDSCAPE\nNamed competitors, named gaps. What has failed and why.\n\n## KEY UNKNOWNS\nCritical unanswered questions that would change strategy.`
  },
  {
    id: "architect", name: "Architect", role: "Solution Designer", callsign: "ARCH-2",
    color: "#a78bfa", icon: "◈", description: "Solution architecture, user flow, technical approach, build vs buy",
    system: `You are Architect, solution design agent. Follow your specific directive from the Chief's mission brief.\n${STANDING_ORDER}\n## PROPOSED SOLUTION\nWhat we're building. 2-3 sentences. Crisp.\n\n## CORE USER FLOW\nStep-by-step: user action → system response. Concrete.\n\n## TECHNICAL APPROACH\nNamed stack, named pattern, named AI architecture. No hedging.\n\n## BUILD VS BUY\nWhat you build. What you integrate. What you don't touch. And why each.\n\n## BIGGEST TECHNICAL RISK\nThe one thing that could make this unviable. Not a list.`
  },
  {
    id: "scribe", name: "Scribe", role: "PRD Writer", callsign: "SCRB-3",
    color: "#34d399", icon: "◇", description: "Problem statement, solution scope, success metrics, core requirements",
    system: `You are Scribe, PRD writing agent. Follow your specific directive from the Chief's mission brief.\n${STANDING_ORDER}\n## PROBLEM STATEMENT\nCustomer, pain, frequency, cost of inaction. One paragraph. Every metric must be measurable.\n\n## PROPOSED SOLUTION\nWhat we're building AND explicitly what we are NOT building.\n\n## SUCCESS METRICS\nNorth Star + quality + guardrail metric. Each with a target number or observable state.\n\n## CORE REQUIREMENTS\nMust-have for v1. Numbered. Each item testable — if it can't be tested, rewrite it.\n\n## OUT OF SCOPE (V1)\nWhat we're deferring and the explicit reason for each deferral.`
  },
  {
    id: "sentinel", name: "Sentinel", role: "Risk Analyst", callsign: "SNTL-4",
    color: "#fb923c", icon: "◬", description: "Risk classification, governance gaps, regulatory flags, launch blockers",
    system: `You are Sentinel, risk analysis agent. Follow your specific directive from the Chief's mission brief.\n${STANDING_ORDER}\n## RISK TIER\nCritical / High / Medium / Low. Two sentences justifying the classification based on the mission input directly.\n\n## TOP 3 RISKS\nRisk name | Likelihood (1-5) | Impact (1-5) | Specific mitigation. No generic mitigations.\n\n## GOVERNANCE GAPS\nMissing HITL gates, audit trails, or compliance controls — specific to this solution.\n\n## REGULATED INDUSTRY FLAGS\nHIPAA / FDA SaMD / GDPR / EU AI Act / OCC — name only those that apply and the specific obligation.\n\n## LAUNCH BLOCKERS\nBinary conditions: resolved or not. Each blocker must be specific and testable.`
  },
  {
    id: "strategist", name: "Strategist", role: "GTM Strategist", callsign: "STRT-5",
    color: "#f472b6", icon: "◎", description: "Positioning, wedge entry, trust ladder, moat, first 90 days",
    system: `You are Strategist, GTM agent. Follow your specific directive from the Chief's mission brief.\n${STANDING_ORDER}\n## POSITIONING\nCompleted sentence: For [specific role], [product] is the [category] that [measurable benefit] unlike [named alternative].\n\n## WEDGE ENTRY\nThe single workflow we win first. Named. With the specific reason we can win it.\n\n## TRUST LADDER\nStage 1 (read-only) → Stage 2 (suggest) → Stage 3 (act). Each stage names the unlock condition.\n\n## MOAT\nWhat makes this hard to copy in 18 months. Name which: data / workflow depth / regulatory cert / network effects. And why.\n\n## FIRST 90 DAYS\nThree concrete milestones. Each has a number or binary state that marks completion.`
  }
];

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

function renderMd(text, color, small = false) {
  if (!text) return "";
  const fs = small ? "11px" : "12px";
  return text
    .replace(/^## (.+)$/gm, `<div style="font-size:9px;font-weight:700;color:${color};letter-spacing:0.12em;text-transform:uppercase;margin:14px 0 5px;padding-bottom:3px;border-bottom:1px solid ${color}22">$1</div>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="color:#f1f5f9">$1</strong>`)
    .replace(/\[UNVERIFIED[^\]]*\]/g, `<span style="background:#7c1d1d;color:#fca5a5;font-size:9px;font-weight:700;font-family:monospace;padding:1px 5px;border-radius:3px;margin:0 2px">[UNVERIFIED]</span>`)
    .replace(/\[ASSUMPTION\]/g, `<span style="background:#4a1942;color:#f9a8d4;font-size:9px;font-weight:700;font-family:monospace;padding:1px 5px;border-radius:3px;margin:0 2px">[ASSUMPTION]</span>`)
    .replace(/^\d+\. (.+)$/gm, `<div style="display:flex;gap:6px;margin:3px 0"><span style="color:${color};font-size:9px;font-weight:700;margin-top:3px;flex-shrink:0">▸</span><span style="color:#94a3b8;font-size:${fs};line-height:1.6">$1</span></div>`)
    .replace(/^- (.+)$/gm, `<div style="display:flex;gap:6px;margin:2px 0"><span style="color:${color};font-size:8px;margin-top:4px;flex-shrink:0">●</span><span style="color:#94a3b8;font-size:${fs};line-height:1.6">$1</span></div>`)
    .replace(/^(?!<)(.*\S.*)$/gm, `<p style="color:#94a3b8;font-size:${fs};line-height:1.7;margin:3px 0">$1</p>`);
}

const GOLD = "#e2c87a";

function ChiefPanel({ phase, brief, commentary, verdict, loading }) {
  const label = { idle:"STANDING BY", briefing:"TRANSMITTING MISSION BRIEF", monitoring:"MONITORING FLEET", verdict:"COMPILING EXECUTIVE MEMO", done:"EXECUTIVE DECISION MEMO FILED" }[phase];
  const active = ["briefing","monitoring","verdict"].includes(phase);
  const showBrief = ["briefing","monitoring"].includes(phase) && brief;
  const showVerdict = phase === "done" && verdict;

  return (
    <div style={{ background:"#08111f", border:`1px solid ${phase==="idle"?"#1e293b":GOLD+"38"}`, borderRadius:"10px", overflow:"hidden", boxShadow:phase!=="idle"?`0 0 40px ${GOLD}08`:"none", transition:"all 0.4s" }}>
      <div style={{ padding:"13px 20px", borderBottom:`1px solid ${GOLD}18`, background:"#060d18", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
          <div style={{ width:"38px", height:"38px", borderRadius:"50%", border:`1px solid ${GOLD}30`, display:"flex", alignItems:"center", justifyContent:"center", background:`${GOLD}08`, flexShrink:0 }}>
            <span style={{ color:GOLD, fontSize:"16px" }}>✦</span>
          </div>
          <div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"14px", fontWeight:"700", color:"#f8f0d8", letterSpacing:"0.02em" }}>CHIEF FLIGHT DIRECTOR</div>
            <div style={{ fontSize:"9px", color:GOLD, letterSpacing:"0.14em", opacity:0.65, marginTop:"1px" }}>MISSION CONTROL — REPORTS TO PM EXECUTIVE</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"6px", padding:"4px 10px", borderRadius:"4px", background:phase==="idle"?"#1e293b":`${GOLD}10`, border:`1px solid ${phase==="idle"?"#334155":GOLD+"28"}` }}>
          <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:phase==="idle"?"#475569":GOLD, boxShadow:active?`0 0 8px ${GOLD}`:"none", animation:active?"pulse 1.5s infinite":"none" }} />
          <span style={{ fontSize:"9px", fontWeight:"700", color:phase==="idle"?"#475569":GOLD, letterSpacing:"0.1em", fontFamily:"monospace" }}>{label}</span>
        </div>
      </div>

      {phase !== "idle" && (
        <div style={{ padding:"6px 20px", background:`${GOLD}06`, borderBottom:`1px solid ${GOLD}12`, display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ fontSize:"9px", color:GOLD, fontFamily:"monospace", fontWeight:"700", opacity:0.5 }}>STANDING ORDER</span>
          <span style={{ fontSize:"9px", color:"#334155", fontFamily:"monospace" }}>No claim without proof · [UNVERIFIED] flags unsubstantiated findings · A false completion is worse than a delayed honest answer</span>
        </div>
      )}

      <div style={{ padding:"16px 20px", minHeight:"100px" }}>
        {phase==="idle" && <p style={{ fontSize:"11px", color:"#1e3a5f", fontFamily:"monospace", margin:0 }}>// Standing by. Enter mission input — Chief will brief the fleet before deployment.</p>}
        {loading && !brief && !verdict && (
          <div style={{ display:"flex", gap:"6px" }}>
            {[90,68,82,55,76].map((w,i)=><div key={i} style={{ height:"7px", borderRadius:"3px", background:`${GOLD}15`, width:`${w}px`, animation:`shimmer 1.2s ${i*0.1}s infinite` }}/>)}
          </div>
        )}

        {showBrief && (
          <div style={{ display:"grid", gridTemplateColumns:commentary.length>0?"1fr 1fr":"1fr", gap:"20px" }}>
            <div dangerouslySetInnerHTML={{ __html: renderMd(brief, GOLD, true) }} />
            {commentary.length > 0 && (
              <div style={{ borderLeft:`1px solid ${GOLD}18`, paddingLeft:"20px" }}>
                <div style={{ fontSize:"9px", color:GOLD, letterSpacing:"0.12em", fontWeight:"700", marginBottom:"10px", fontFamily:"monospace", opacity:0.7 }}>LIVE FIELD ASSESSMENT</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {commentary.map((c,i)=>(
                    <div key={i} style={{ padding:"8px 10px", background:`${GOLD}06`, border:`1px solid ${GOLD}14`, borderRadius:"5px", animation:"fadein 0.4s ease" }}>
                      <p style={{ color:"#cbd5e1", fontSize:"11px", lineHeight:"1.65", margin:0 }}>{c}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showVerdict && <div dangerouslySetInnerHTML={{ __html: renderMd(verdict, GOLD) }} />}

        {phase==="done" && brief && (
          <details style={{ marginTop:"16px" }}>
            <summary style={{ fontSize:"9px", color:"#334155", fontFamily:"monospace", cursor:"pointer", userSelect:"none", letterSpacing:"0.1em" }}>▸ VIEW MISSION BRIEF + FIELD ASSESSMENTS</summary>
            <div style={{ marginTop:"12px", paddingTop:"12px", borderTop:`1px solid ${GOLD}12` }}>
              <div style={{ display:"grid", gridTemplateColumns:commentary.length>0?"1fr 1fr":"1fr", gap:"20px" }}>
                <div dangerouslySetInnerHTML={{ __html: renderMd(brief, GOLD, true) }} />
                {commentary.length > 0 && (
                  <div style={{ borderLeft:`1px solid ${GOLD}18`, paddingLeft:"20px" }}>
                    <div style={{ fontSize:"9px", color:GOLD, letterSpacing:"0.12em", fontWeight:"700", marginBottom:"10px", fontFamily:"monospace", opacity:0.7 }}>FIELD ASSESSMENTS</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                      {commentary.map((c,i)=><div key={i} style={{ padding:"8px 10px", background:`${GOLD}06`, border:`1px solid ${GOLD}14`, borderRadius:"5px" }}><p style={{ color:"#cbd5e1", fontSize:"11px", lineHeight:"1.65", margin:0 }}>{c}</p></div>)}
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

function AgentPanel({ agent, status, output, elapsed }) {
  const ref = useRef(null);
  useEffect(() => { if (output && ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [output]);
  const cfg = {
    idle:    { label:"STANDBY",  bg:"#1e293b",         dot:"#475569",   border:"#1e293b" },
    running: { label:"ACTIVE",   bg:agent.color+"14",  dot:agent.color, border:agent.color+"50" },
    done:    { label:"COMPLETE", bg:"#052e16",         dot:"#4ade80",   border:agent.color+"22" },
    error:   { label:"ERROR",    bg:"#2d0a0a",         dot:"#ef4444",   border:"#ef444430" }
  }[status] || { label:"STANDBY", bg:"#1e293b", dot:"#475569", border:"#1e293b" };

  return (
    <div style={{ background:"#0b1220", border:`1px solid ${cfg.border}`, borderRadius:"8px", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:status==="running"?`0 0 14px ${agent.color}0e`:"none", transition:"border-color 0.3s", minHeight:"280px" }}>
      <div style={{ padding:"10px 12px", borderBottom:"1px solid #1e293b", background:"#0d1526", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <div style={{ width:"28px", height:"28px", borderRadius:"5px", background:agent.color+"10", border:`1px solid ${agent.color}28`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", color:agent.color }}>{agent.icon}</div>
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
          {elapsed && status==="done" && <span style={{ fontSize:"8px", color:"#334155", fontFamily:"monospace" }}>{elapsed}s</span>}
        </div>
      </div>
      <div ref={ref} style={{ flex:1, padding:"12px", overflowY:"auto" }}>
        {status==="idle" && <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"5px", opacity:0.18 }}><span style={{ fontSize:"20px", color:agent.color }}>{agent.icon}</span><span style={{ fontSize:"10px", color:"#475569", textAlign:"center" }}>{agent.description}</span></div>}
        {status==="running" && !output && <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>{[100,70,85,60].map((w,i)=><div key={i} style={{ height:"7px", borderRadius:"3px", background:`${agent.color}14`, width:`${w}%`, animation:`shimmer 1.4s ${i*0.18}s infinite` }}/>)}</div>}
        {output && <div dangerouslySetInnerHTML={{ __html: renderMd(output, agent.color) }}/>}
        {status==="error" && <p style={{ color:"#ef4444", fontSize:"11px" }}>⚠ Agent error — retry mission.</p>}
      </div>
    </div>
  );
}

export default function MissionControl() {
  const [idea, setIdea] = useState("");
  const [phase, setPhase] = useState("idle");
  const [brief, setBrief] = useState("");
  const [commentary, setCommentary] = useState([]);
  const [verdict, setVerdict] = useState("");
  const [chiefLoading, setChiefLoading] = useState(false);
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
    if (!idea.trim() || running) return;
    setRunning(true); setMissionActive(true); setMissionTime(0);
    setBrief(""); setVerdict(""); setCommentary([]);
    const init = {}; FLEET.forEach(a=>{init[a.id]="idle";});
    setStatuses(init); setOutputs({}); setElapsed({});

    // Phase 1 — Chief briefs
    setPhase("briefing"); setChiefLoading(true);
    let briefText = "";
    try {
      briefText = await callClaude(CHIEF_BRIEF_SYSTEM, `Mission input:\n\n${idea}`);
      setBrief(briefText);
    } catch {
      briefText = "[UNVERIFIED] Brief generation failed — deploying fleet on raw input.";
      setBrief(briefText);
    }
    setChiefLoading(false); setPhase("monitoring");

    // Phase 2 — Fleet deploys in parallel
    FLEET.forEach(a=>setStatuses(prev=>({...prev,[a.id]:"running"})));
    const t0 = Date.now();
    const results = {};

    await Promise.all(FLEET.map(async agent => {
      try {
        const ctx = `Chief Flight Director Mission Brief:\n${briefText}\n\nMission Input:\n${idea}`;
        const out = await callClaude(agent.system, ctx);
        const secs = ((Date.now()-t0)/1000).toFixed(1);
        results[agent.id] = out;
        setOutputs(prev=>({...prev,[agent.id]:out}));
        setStatuses(prev=>({...prev,[agent.id]:"done"}));
        setElapsed(prev=>({...prev,[agent.id]:secs}));
        try {
          const note = await callClaude(
            `You are the Chief Flight Director. ${STANDING_ORDER} Field assessment: 2-3 sentences. Start with callsign. No headers. No bullets. Command voice.`,
            buildCommentaryPrompt(agent.name, agent.role, out, idea)
          );
          setCommentary(prev=>[...prev, note]);
        } catch {
          setCommentary(prev=>[...prev, `${agent.callsign} report received. [Commentary unavailable — no proof to cite]`]);
        }
      } catch {
        setStatuses(prev=>({...prev,[agent.id]:"error"}));
      }
    }));

    // Phase 3 — Executive Decision Memo
    setPhase("verdict"); setChiefLoading(true);
    try {
      const all = FLEET.map(a=>`=== ${a.name} (${a.callsign}) ===\n${results[a.id]||"No report filed."}`).join("\n\n");
      const v = await callClaude(
        `You are the Chief Flight Director delivering the Executive Decision Memo. ${STANDING_ORDER}`,
        buildVerdictPrompt(idea, all)
      );
      setVerdict(v);
    } catch {
      setVerdict("[UNVERIFIED] Verdict generation failed. Review fleet reports directly.");
    }
    setPhase("done"); setChiefLoading(false);
    setMissionActive(false); setRunning(false);
  };

  const reset = () => {
    setIdea(""); setPhase("idle"); setBrief(""); setVerdict(""); setCommentary([]);
    setStatuses({}); setOutputs({}); setElapsed({});
    setMissionTime(0); setMissionActive(false); setRunning(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#060d18", color:"#e2e8f0", fontFamily:"'Space Grotesk',system-ui,sans-serif", display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.4)}}
        @keyframes shimmer{0%{opacity:0.2}50%{opacity:0.6}100%{opacity:0.2}}
        @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
        @keyframes fadein{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:#0b1220}
        ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
        textarea{color-scheme:dark}
        details summary::-webkit-details-marker{display:none}
      `}</style>

      <div style={{ position:"fixed", inset:0, pointerEvents:"none", backgroundImage:"linear-gradient(rgba(56,189,248,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.018) 1px,transparent 1px)", backgroundSize:"48px 48px" }}/>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:50, overflow:"hidden", opacity:0.018 }}>
        <div style={{ position:"absolute", width:"100%", height:"2px", background:"rgba(226,200,122,1)", animation:"scanline 14s linear infinite" }}/>
      </div>

      <header style={{ position:"relative", zIndex:10, padding:"0 24px", height:"50px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #0f1e33", background:"rgba(6,13,24,0.98)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"12px", fontWeight:"700", color:GOLD, letterSpacing:"0.06em" }}>MISSION CONTROL</span>
          <div style={{ width:"1px", height:"18px", background:"#1e293b" }}/>
          <span style={{ fontSize:"9px", color:"#1e3a5f", fontFamily:"monospace", letterSpacing:"0.1em" }}>PM FLEET ORCHESTRATOR // AI ACCELERATE // DAVID LEWIS</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
          <div style={{ display:"flex", gap:"5px" }}>
            {FLEET.map(a=><div key={a.id} title={a.callsign} style={{ width:"7px", height:"7px", borderRadius:"50%", background:statuses[a.id]==="done"?a.color:statuses[a.id]==="running"?a.color:"#1e293b", opacity:statuses[a.id]==="running"?1:0.7, boxShadow:statuses[a.id]==="running"?`0 0 6px ${a.color}`:"none", animation:statuses[a.id]==="running"?"pulse 1s infinite":"none", transition:"all 0.3s" }}/>)}
          </div>
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:"14px", color:missionActive?GOLD:"#1e3a5f", letterSpacing:"0.05em" }}>{fmt(missionTime)}</span>
          <span style={{ fontSize:"9px", color:"#334155", fontFamily:"monospace" }}>{doneCount}/{FLEET.length} AGENTS</span>
        </div>
      </header>

      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"14px", padding:"16px 24px 24px", position:"relative", zIndex:10, overflowY:"auto" }}>

        <div style={{ background:"#0b1220", border:`1px solid ${running?GOLD+"28":"#1e293b"}`, borderRadius:"10px", overflow:"hidden", transition:"border-color 0.3s", flexShrink:0 }}>
          <div style={{ padding:"9px 16px", borderBottom:"1px solid #1e293b", background:"#060d18", display:"flex", alignItems:"center", gap:"8px" }}>
            <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:GOLD, animation:running?"pulse 1s infinite":"none" }}/>
            <span style={{ fontSize:"9px", fontWeight:"700", color:GOLD, letterSpacing:"0.12em", fontFamily:"'Space Mono',monospace" }}>MISSION INPUT</span>
            <span style={{ fontSize:"9px", color:"#1e3a5f", marginLeft:"auto", fontFamily:"monospace" }}>Chief briefs before deployment · ⌘↵ to launch</span>
          </div>
          <div style={{ display:"flex" }}>
            <textarea
              value={idea}
              onChange={e=>setIdea(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)launch();}}
              placeholder="Describe the product idea or problem. Chief Flight Director will classify the mission, task each agent with proof-of-work standards, monitor live with field assessments, then deliver an Executive Decision Memo..."
              disabled={running}
              style={{ flex:1, background:"transparent", border:"none", outline:"none", padding:"13px 16px", color:"#e2e8f0", fontSize:"13px", lineHeight:"1.7", resize:"none", minHeight:"76px", fontFamily:"inherit", opacity:running?0.5:1 }}
            />
            <div style={{ display:"flex", flexDirection:"column", padding:"10px 12px", gap:"6px", borderLeft:"1px solid #1e293b", justifyContent:"center", flexShrink:0 }}>
              <button onClick={launch} disabled={!idea.trim()||running} style={{ padding:"9px 18px", borderRadius:"6px", border:"none", background:!idea.trim()||running?"#1e293b":`linear-gradient(135deg,#c9a227,${GOLD})`, color:!idea.trim()||running?"#475569":"#060d18", fontSize:"11px", fontWeight:"700", cursor:!idea.trim()||running?"not-allowed":"pointer", letterSpacing:"0.05em", fontFamily:"'Space Mono',monospace", whiteSpace:"nowrap" }}>
                {running?"▶ ACTIVE":"▶ LAUNCH"}
              </button>
              {phase!=="idle"&&!running&&<button onClick={reset} style={{ padding:"7px 18px", borderRadius:"6px", border:"1px solid #1e293b", background:"transparent", color:"#475569", fontSize:"10px", cursor:"pointer", fontFamily:"monospace" }}>↺ RESET</button>}
            </div>
          </div>
        </div>

        <ChiefPanel phase={phase} brief={brief} commentary={commentary} verdict={verdict} loading={chiefLoading}/>

        {phase!=="idle"&&(
          <>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", animation:"fadein 0.4s ease" }}>
              <span style={{ fontSize:"9px", color:"#1e3a5f", letterSpacing:"0.14em", fontFamily:"monospace", fontWeight:"700" }}>DEPLOYED FLEET — 5 AGENTS — PARALLEL EXECUTION</span>
              <div style={{ flex:1, height:"1px", background:"#0f1e33" }}/>
              {FLEET.some(a=>statuses[a.id]==="running")&&<span style={{ fontSize:"9px", color:"#38bdf8", fontFamily:"monospace" }}>● PROCESSING</span>}
              {allDone&&<span style={{ fontSize:"9px", color:GOLD, fontFamily:"monospace" }}>✦ ALL STATIONS REPORTED</span>}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px", animation:"fadein 0.5s ease" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px" }}>
                {FLEET.slice(0,3).map(a=><AgentPanel key={a.id} agent={a} status={statuses[a.id]||"idle"} output={outputs[a.id]||""} elapsed={elapsed[a.id]}/>)}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"12px", maxWidth:"calc(66.66% + 12px)" }}>
                {FLEET.slice(3).map(a=><AgentPanel key={a.id} agent={a} status={statuses[a.id]||"idle"} output={outputs[a.id]||""} elapsed={elapsed[a.id]}/>)}
              </div>
            </div>
          </>
        )}
      </div>

      <footer style={{ position:"relative", zIndex:10, padding:"9px 24px", borderTop:"1px solid #0f1e33", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <span style={{ fontSize:"9px", color:"#1e3a5f", fontFamily:"monospace" }}>MISSION CONTROL // AI ACCELERATE // DAVID LEWIS // 2026</span>
        <div style={{ display:"flex", gap:"12px" }}>
          {FLEET.map(a=><div key={a.id} style={{ display:"flex", alignItems:"center", gap:"3px" }}><span style={{ color:a.color, fontSize:"9px" }}>{a.icon}</span><span style={{ fontSize:"8px", color:"#1e3a5f", fontFamily:"monospace" }}>{a.callsign}</span></div>)}
        </div>
      </footer>
    </div>
  );
}
