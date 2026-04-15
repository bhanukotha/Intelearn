// pages/ContestArena.jsx
// Full-screen contest arena: problem list on left tabs + Monaco compiler on right
import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import "./ContestArena.css";

const API = "http://localhost:5000/api";
const token = () => localStorage.getItem("authToken");

const languageMap = {
  71: { name: "Python",     editor: "python",     template: `# your code here\n` },
  54: { name: "C++",        editor: "cpp",        template: `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // your code here\n    return 0;\n}` },
  62: { name: "Java",       editor: "java",       template: `import java.util.*;\nclass Main {\n  public static void main(String[] args) {\n    // your code here\n  }\n}` },
  50: { name: "C",          editor: "c",          template: `#include <stdio.h>\nint main() {\n    // your code here\n    return 0;\n}` },
  63: { name: "JavaScript", editor: "javascript", template: `// your code here\n` },
};

const diffColor = { easy: "#22c55e", medium: "#f59e0b", hard: "#ef4444" };
const diffBg    = { easy: "rgba(34,197,94,.12)", medium: "rgba(245,158,11,.12)", hard: "rgba(239,68,68,.12)" };

const ContestArena = ({ contest, initialProblemIndex = 0, onExit }) => {
  const problems = contest.problems || [];
  const [activeProbIdx, setActiveProbIdx] = useState(initialProblemIndex);
  const [language,  setLanguage]  = useState(54);
  const [code,      setCode]      = useState(languageMap[54].template);
  const [input,     setInput]     = useState("");
  const [output,    setOutput]    = useState("");
  const [running,   setRunning]   = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [verdict,   setVerdict]   = useState(null);
  const [solved,    setSolved]    = useState({}); // { problemId: true/false }
  const [timeLeft,  setTimeLeft]  = useState("");
  const [theme,     setTheme]     = useState("vs-dark");
  const [tab,       setTab]       = useState("statement"); // statement | submissions

  const problem = problems[activeProbIdx];

  // Countdown
  useEffect(() => {
    const tick = () => {
      const diff = new Date(contest.endTime) - new Date();
      if (diff <= 0) { setTimeLeft("Time's up!"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [contest.endTime]);

  // Pre-fill stdin with first sample
  useEffect(() => {
    if (problem?.sampleTestCases?.[0]) {
      setInput(problem.sampleTestCases[0].input);
    } else {
      setInput("");
    }
    setOutput("");
    setVerdict(null);
  }, [activeProbIdx, problem]);

  const handleRun = async () => {
    setRunning(true);
    setOutput("⏳ Running…");
    setVerdict(null);
    try {
      const res = await axios.post(`${API}/compiler/run`,
        { code, language, input },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      setOutput(res.data.stdout || res.data.stderr || res.data.compile_output || "No output");
    } catch {
      setOutput("❌ Execution failed.");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem) return;
    setSubmitting(true);
    setVerdict({ status: "judging", message: "⏳ Judging against all test cases…" });
    try {
      const res = await axios.post(`${API}/submissions/submit`,
        { problemId: problem._id, code, language: String(language), languageId: Number(language) },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      const { verdict: v, passed, total } = res.data;
      const labels = { AC: "Accepted", WA: "Wrong Answer", TLE: "Time Limit Exceeded", CE: "Compilation Error", RE: "Runtime Error" };
      if (v === "AC") {
        setSolved(s => ({ ...s, [problem._id]: true }));
        setVerdict({ status: "ac", message: `✅ ${labels[v] || v}`, passed, total });
      } else {
        setVerdict({ status: "wa", message: `❌ ${labels[v] || v}`, passed, total });
      }
    } catch {
      setVerdict({ status: "error", message: "❌ Submission failed. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const acceptanceRate = (p) => p?.totalSubmissions > 0
    ? ((p.acceptedSubmissions / p.totalSubmissions) * 100).toFixed(1) + "%"
    : "0.0%";

  return (
    <div className="ca-root">
      {/* ── TOP BAR ── */}
      <div className="ca-topbar">
        <div className="ca-topbar-left">
          <button className="ca-back-btn" onClick={onExit}>← Exit Contest</button>
          <span className="ca-contest-name">
            {contest.contestType === "daily" ? "📅 Daily Challenge" : `🏆 ${contest.weekSlot === "WED" ? "Wednesday" : "Sunday"} Contest`}
          </span>
          <span className="ca-diff-badge"
            style={{ color: diffColor[contest.difficulty], background: diffBg[contest.difficulty] }}>
            {contest.difficulty}
          </span>
        </div>

        {/* Problem tabs (for weekly with multiple problems) */}
        <div className="ca-prob-tabs">
          {problems.map((p, i) => (
            <button key={i}
              className={`ca-prob-tab ${activeProbIdx === i ? "ca-prob-tab-active" : ""} ${solved[p._id] ? "ca-prob-tab-solved" : ""}`}
              onClick={() => { setActiveProbIdx(i); setVerdict(null); setOutput(""); }}>
              {solved[p._id] ? "✅" : `P${i + 1}`}
            </button>
          ))}
        </div>

        <div className="ca-topbar-right">
          <span className="ca-timer" style={{ color: timeLeft === "Time's up!" ? "#f87171" : "#22c55e" }}>
            ⏱ {timeLeft}
          </span>
          <button className="ca-icon-btn" onClick={() => setTheme(t => t === "vs-dark" ? "light" : "vs-dark")}>
            {theme === "vs-dark" ? "☀️" : "🌙"}
          </button>
          <button className="ca-run-btn" onClick={handleRun} disabled={running || submitting}>
            {running ? <span className="ca-spinner" /> : "▶"} Run
          </button>
          <button className="ca-submit-btn" onClick={handleSubmit} disabled={running || submitting}>
            {submitting ? <span className="ca-spinner" /> : "✔"} Submit
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="ca-body">
        {/* ── LEFT: Problem Statement ── */}
        <div className="ca-left">
          <div className="ca-left-tabs">
            <button className={`ca-ltab ${tab === "statement" ? "ca-ltab-active" : ""}`}
              onClick={() => setTab("statement")}>Statement</button>
            <button className={`ca-ltab ${tab === "submissions" ? "ca-ltab-active" : ""}`}
              onClick={() => setTab("submissions")}>Submissions</button>
          </div>

          <div className="ca-left-content">
            {tab === "statement" && problem && (
              <>
                <div className="ca-prob-header">
                  <h1 className="ca-prob-title">{problem.title}</h1>
                  <div className="ca-prob-meta">
                    {problem.tags?.map(t => <span key={t} className="ca-tag">{t}</span>)}
                    <span className="ca-diff-chip"
                      style={{ color: diffColor[problem.difficulty], background: diffBg[problem.difficulty] }}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <div className="ca-prob-stats">
                    <span>⏱ {problem.timeLimit || 2}s</span>
                    <span>💾 {problem.memoryLimit || 256}MB</span>
                    <span>📊 {problem.totalSubmissions || 0} submissions</span>
                    <span>✅ {acceptanceRate(problem)} accepted</span>
                  </div>
                </div>

                <div className="ca-section">
                  <h3 className="ca-section-title">Problem Description</h3>
                  <p className="ca-description">{problem.description}</p>
                </div>

                {problem.inputFormat && (
                  <div className="ca-section">
                    <h3 className="ca-section-title">Input Format</h3>
                    <p className="ca-description">{problem.inputFormat}</p>
                  </div>
                )}

                {problem.outputFormat && (
                  <div className="ca-section">
                    <h3 className="ca-section-title">Output Format</h3>
                    <p className="ca-description">{problem.outputFormat}</p>
                  </div>
                )}

                {problem.constraints && (
                  <div className="ca-section">
                    <h3 className="ca-section-title">Constraints</h3>
                    <div className="ca-constraints">
                      {problem.constraints.split("\n").filter(l => l.trim()).map((line, i) => (
                        <div key={i} className="ca-constraint-line">
                          <span className="ca-bullet">•</span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {problem.sampleTestCases?.length > 0 && (
                  <div className="ca-section">
                    <h3 className="ca-section-title">Sample Test Cases</h3>
                    {problem.sampleTestCases.map((tc, i) => (
                      <div key={i} className="ca-sample">
                        <div className="ca-sample-header">Sample {i + 1}</div>
                        <div className="ca-sample-grid">
                          <div className="ca-sample-half">
                            <div className="ca-sample-label">
                              Input
                              <button className="ca-copy-btn"
                                onClick={() => navigator.clipboard.writeText(tc.input)}>Copy</button>
                            </div>
                            <pre className="ca-code-block">{tc.input}</pre>
                          </div>
                          <div className="ca-sample-half">
                            <div className="ca-sample-label">
                              Output
                              <button className="ca-copy-btn"
                                onClick={() => navigator.clipboard.writeText(tc.output)}>Copy</button>
                            </div>
                            <pre className="ca-code-block">{tc.output}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "submissions" && (
              <div className="ca-section">
                <h3 className="ca-section-title">Your Submissions</h3>
                <p style={{ color: "#7a8499", fontSize: 14 }}>
                  Submit a solution to see your results here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Editor ── */}
        <div className="ca-right">
          {/* Language selector */}
          <div className="ca-editor-header">
            <select className="ca-lang-select" value={language}
              onChange={e => { const id = Number(e.target.value); setLanguage(id); setCode(languageMap[id].template); }}>
              {Object.entries(languageMap).map(([id, l]) => (
                <option key={id} value={id}>{l.name}</option>
              ))}
            </select>
            <button className="ca-icon-btn" title="Reset"
              onClick={() => setCode(languageMap[language].template)}>↺ Reset</button>
          </div>

          {/* Monaco Editor */}
          <div className="ca-editor-wrap">
            <Editor
              height="100%"
              language={languageMap[language].editor}
              theme={theme}
              value={code}
              onChange={v => setCode(v || "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                tabSize: 4,
                wordWrap: "on",
              }}
            />
          </div>

          {/* Verdict Banner */}
          {verdict && (
            <div className={`ca-verdict ${verdict.status}`}>
              <span>{verdict.message}</span>
              {verdict.passed !== undefined && (
                <span className="ca-verdict-score">{verdict.passed}/{verdict.total} test cases</span>
              )}
            </div>
          )}

          {/* Custom Input / Output */}
          <div className="ca-io">
            <div className="ca-io-label">Custom Input</div>
            <textarea className="ca-io-input" rows={3}
              placeholder="Enter test input…"
              value={input}
              onChange={e => setInput(e.target.value)} />
            {output && (
              <>
                <div className="ca-io-label">Output</div>
                <pre className="ca-io-output">{output}</pre>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestArena;