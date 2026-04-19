import { useState, useRef } from "react";

const STATES = [
  { id: "overthinking", label: "Overthinking", desc: "Analyzing instead of executing" },
  { id: "hesitating", label: "Hesitating", desc: "Delayed start — task is clear" },
  { id: "avoiding", label: "Avoiding", desc: "Redirecting away from the task" },
  { id: "fake_productive", label: "Fake productive", desc: "Busy but not executing" },
  { id: "reset", label: "Wasted time", desc: "Need to recover and restart" },
];

const RULES = [
  "Action creates clarity — not the other way around",
  "Start before ready",
  "Discomfort is the entry point, not the obstacle",
  "Planning without executing is avoidance",
  "Response latency is the only metric that matters now",
];

const SYSTEM_PROMPT = `You are the Agency Operating System (AOS) — a real-time execution system. You exist for one purpose: to interrupt hesitation patterns and force action.

Your operating logic is grounded in behavioural science: procrastination is a self-regulation failure driven by task aversiveness and present bias. Discomfort is a normal signal of growth-directed action, not danger. Action produces feedback. Feedback produces clarity. Clarity produces more action. You accelerate this loop.

Rules you operate by:
— Never give advice. Give commands.
— Never explain or motivate. Diagnose and direct.
— Never validate hesitation. Interrupt it.
— Every response ends with a time constraint.
— Maximum 4 sections. Nothing more.

Respond in EXACTLY this format (all caps labels, colon, then content):

DIAGNOSIS: [state in 4–6 words — what is actually happening psychologically]
ACTION: [the exact next behavioral step — specific, physical, immediate — what the person does with their hands in the next 60 seconds]
TIMEFRAME: [precise constraint — "Start now. Do this for X minutes only."]
SIGNAL: [one sentence reframing the discomfort they feel as a growth signal, not a threat — brief, direct, no fluff]

State-specific protocols:
— OVERTHINKING: The task is clear enough. Identify the first physical action. Box it to 5 minutes. No further thinking authorised.
— HESITATING: Name what they're protecting from (failure, embarrassment, imperfection). Force the lowest-friction entry point. 2-minute box.
— AVOIDING: Name the real task being substituted. Give the entry point only — not the whole task. One step. Now.
— FAKE_PRODUCTIVE: Explicitly name what they're substituting (re-reading, planning, research) and cut to the real execution task.
— RESET: One sentence that removes guilt (wasted time is data, not failure). Then one specific re-entry action. 5-minute commitment only.

Never use bullet points. Never exceed 4 labelled lines. Never say "I understand." You are a system, not a therapist.`;

export default function AgencyOS() {
  const [selectedState, setSelectedState] = useState(null);
  const [task, setTask] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [latencies, setLatencies] = useState([]);
  const [phase, setPhase] = useState("detect");
  const resistanceStart = useRef(Date.now());

  const handleStateSelect = (state) => {
    setSelectedState(state);
  };

  const handleActivate = async () => {
    if (!selectedState || !task.trim() || loading) return;

    const now = Date.now();
    const responseLatency = Math.round((now - resistanceStart.current) / 1000);
    setLatency(responseLatency);
    setLoading(true);
    setResponse("");
    setPhase("processing");

    const userMessage = `Detected state: ${selectedState.id.toUpperCase()}
Task being avoided: ${task.trim()}
Seconds elapsed since resistance detected: ${responseLatency}s

Activate protocol.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || "SYSTEM ERROR. Close this. Open your task. Work for 2 minutes.";
      setResponse(text);
      setPhase("directive");

      const newLatencies = [...latencies, responseLatency];
      setLatencies(newLatencies);
      setSessionCount((c) => c + 1);
    } catch {
      setResponse("NETWORK FAILURE.\n\nDIAGNOSIS: System unavailable\nACTION: Close this. Open the task directly. Do not wait.\nTIMEFRAME: Start now. 5 minutes only.\nSIGNAL: The resistance you feel is the work trying to happen.");
      setPhase("directive");
    }

    setLoading(false);
    resistanceStart.current = Date.now();
  };

  const handleReset = () => {
    setSelectedState(null);
    setTask("");
    setResponse("");
    setPhase("detect");
    resistanceStart.current = Date.now();
  };

  const parseResponse = (text) => {
    if (!text) return null;
    const sections = {};
    text.split("\n").forEach((line) => {
      const match = line.match(/^(DIAGNOSIS|ACTION|TIMEFRAME|SIGNAL):\s*(.+)/i);
      if (match) sections[match[1].toUpperCase()] = match[2].trim();
    });
    return Object.keys(sections).length >= 2 ? sections : { RAW: text };
  };

  const avgLatency =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;

  const parsed = parseResponse(response);

  const latencyColor =
    latency === null
      ? "var(--color-text-tertiary)"
      : latency < 45
        ? "var(--color-text-success)"
        : latency < 120
          ? "var(--color-text-warning)"
          : "var(--color-text-danger)";

  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        padding: "1.25rem 0 0.5rem",
        maxWidth: "640px",
      }}
    >
      <h2 className="sr-only">Agency Operating System — real-time execution system for interrupting hesitation</h2>

      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingBottom: "1rem",
          borderBottom: "0.5px solid var(--color-border-primary)",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "10px",
              color: "var(--color-text-tertiary)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Agency Operating System
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "500",
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            AOS v1.0
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "10px",
              color: "var(--color-text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "2px",
            }}
          >
            Response latency
          </div>
          <div style={{ fontSize: "22px", fontWeight: "500", color: latencyColor }}>
            {latency !== null ? `${latency}s` : "—"}
          </div>
          {avgLatency !== null && (
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "2px" }}>
              avg {avgLatency}s · {sessionCount} rep{sessionCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Phase 1: Detect + Input */}
      {phase !== "directive" && (
        <>
          {/* State detection */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div
              style={{
                fontSize: "10px",
                color: "var(--color-text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "10px",
              }}
            >
              01 — Detect state
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {STATES.map((state) => {
                const active = selectedState?.id === state.id;
                return (
                  <button
                    key={state.id}
                    onClick={() => handleStateSelect(state)}
                    style={{
                      padding: "7px 14px",
                      fontSize: "13px",
                      fontFamily: "var(--font-mono)",
                      border: active
                        ? "1px solid var(--color-border-primary)"
                        : "0.5px solid var(--color-border-tertiary)",
                      borderRadius: "var(--border-radius-md)",
                      background: active ? "var(--color-background-secondary)" : "transparent",
                      color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                      cursor: "pointer",
                      fontWeight: active ? "500" : "400",
                      transition: "none",
                    }}
                  >
                    {state.label}
                  </button>
                );
              })}
            </div>
            {selectedState && (
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-warning)",
                  marginTop: "8px",
                  letterSpacing: "0.02em",
                }}
              >
                ↳ {selectedState.desc}
              </div>
            )}
          </div>

          {/* Task input */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div
              style={{
                fontSize: "10px",
                color: "var(--color-text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "10px",
              }}
            >
              02 — Task being avoided
            </div>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleActivate()}
              placeholder="Name the exact task — be specific"
              style={{
                width: "100%",
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Activate */}
          <button
            onClick={handleActivate}
            disabled={!selectedState || !task.trim() || loading}
            style={{
              width: "100%",
              padding: "13px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              border:
                !selectedState || !task.trim()
                  ? "0.5px solid var(--color-border-tertiary)"
                  : "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-md)",
              background: "transparent",
              color:
                !selectedState || !task.trim()
                  ? "var(--color-text-tertiary)"
                  : loading
                    ? "var(--color-text-secondary)"
                    : "var(--color-text-primary)",
              cursor: !selectedState || !task.trim() || loading ? "default" : "pointer",
              marginBottom: "1.5rem",
            }}
          >
            {loading ? "Activating protocol..." : "Activate execution protocol →"}
          </button>
        </>
      )}

      {/* Phase 2: Directive output */}
      {phase === "directive" && parsed && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              fontSize: "10px",
              color: "var(--color-text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "14px",
            }}
          >
            03 — Directive
          </div>

          {parsed.RAW ? (
            <div
              style={{
                fontSize: "14px",
                color: "var(--color-text-primary)",
                lineHeight: "1.8",
                padding: "14px",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-md)",
                background: "var(--color-background-secondary)",
              }}
            >
              {parsed.RAW}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {parsed.DIAGNOSIS && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "var(--color-background-danger)",
                    borderRadius: "var(--border-radius-md)",
                    borderLeft: "2px solid var(--color-border-danger)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--color-text-danger)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "5px",
                    }}
                  >
                    Diagnosis
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      color: "var(--color-text-primary)",
                      fontWeight: "500",
                      lineHeight: "1.5",
                    }}
                  >
                    {parsed.DIAGNOSIS}
                  </div>
                </div>
              )}

              {parsed.ACTION && (
                <div
                  style={{
                    padding: "14px 16px",
                    background: "var(--color-background-secondary)",
                    borderRadius: "var(--border-radius-md)",
                    border: "1px solid var(--color-border-secondary)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--color-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "6px",
                    }}
                  >
                    Action
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      color: "var(--color-text-primary)",
                      fontWeight: "500",
                      lineHeight: "1.55",
                    }}
                  >
                    {parsed.ACTION}
                  </div>
                </div>
              )}

              {parsed.TIMEFRAME && (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "var(--color-background-warning)",
                    borderRadius: "var(--border-radius-md)",
                    borderLeft: "2px solid var(--color-border-warning)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--color-text-warning)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "5px",
                    }}
                  >
                    Timeframe
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "var(--color-text-primary)",
                      fontWeight: "500",
                    }}
                  >
                    {parsed.TIMEFRAME}
                  </div>
                </div>
              )}

              {parsed.SIGNAL && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "var(--border-radius-md)",
                    border: "0.5px solid var(--color-border-tertiary)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--color-text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "5px",
                    }}
                  >
                    Signal reframe
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--color-text-secondary)",
                      lineHeight: "1.7",
                      fontStyle: "italic",
                    }}
                  >
                    {parsed.SIGNAL}
                  </div>
                </div>
              )}
            </div>
          )}

          <div
            style={{
              marginTop: "14px",
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <button
              onClick={handleReset}
              style={{
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-tertiary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                letterSpacing: "0.04em",
              }}
            >
              ← New resistance event
            </button>
            {latency !== null && (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--color-text-tertiary)",
                  marginLeft: "auto",
                }}
              >
                Latency recorded: {latency}s
              </span>
            )}
          </div>
        </div>
      )}

      {/* Rules */}
      <div
        style={{
          borderTop: "0.5px solid var(--color-border-tertiary)",
          paddingTop: "1rem",
          marginTop: phase === "directive" ? 0 : "0.25rem",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            color: "var(--color-text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "10px",
          }}
        >
          Internal commandments
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {RULES.map((rule, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "baseline" }}>
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--color-text-tertiary)",
                  minWidth: "18px",
                  letterSpacing: "0.04em",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                  lineHeight: "1.6",
                }}
              >
                {rule}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
