// pages/ProblemDetail.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { getProblemById } from "../services/problemApi";
import { submitSolution } from "../services/submissionApi";
import axios from "axios";
import Editor from "@monaco-editor/react";
import "./ProblemDetail.css";

const diffColor = { easy: "#22c55e", medium: "#f59e0b", hard: "#ef4444" };
const diffBg    = { easy: "rgba(34,197,94,.12)", medium: "rgba(245,158,11,.12)", hard: "rgba(239,68,68,.12)" };

const languageMap = {
  62: { name: "Java",       editor: "java",        template: `import java.util.*;\nimport java.lang.*;\nimport java.io.*;\n\nclass Codechef {\n  public static void main(String[] args) throws java.lang.Exception {\n    // your code here\n  }\n}` },
  71: { name: "Python",     editor: "python",       template: `# your code here\n` },
  54: { name: "C++",        editor: "cpp",          template: `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // your code here\n    return 0;\n}` },
  50: { name: "C",          editor: "c",            template: `#include <stdio.h>\nint main() {\n    // your code here\n    return 0;\n}` },
  63: { name: "JavaScript", editor: "javascript",   template: `// your code here\n` },
};

const TABS = ["Statement", "Submissions", "Solution"];

const ProblemDetail = () => {
  const { id } = useParams();
  const [problem,     setProblem]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("Statement");
  const [language,    setLanguage]    = useState(54);
  const [code,        setCode]        = useState(languageMap[54].template);
  const [customInput, setCustomInput] = useState("");
  const [output,      setOutput]      = useState("");
  const [running,     setRunning]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [verdict,     setVerdict]     = useState(null); // { status, message, passed, total }
  const [mySubmissions, setMySubmissions] = useState([]);
  const [theme,       setTheme]       = useState("vs-dark");
  const [expanded,    setExpanded]    = useState(false);
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    getProblemById(id)
      .then(p => { setProblem(p); setCustomInput(p.sampleTestCases?.[0]?.input || ""); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab === "Submissions") fetchMySubmissions();
  }, [activeTab]);

  const fetchMySubmissions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/submissions/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMySubmissions(res.data.filter(s => s.problemId?._id === id || s.problemId === id));
    } catch (e) { console.error(e); }
  };

  const handleRun = async () => {
    setRunning(true);
    setOutput("⏳ Running...");
    setVerdict(null);
    try {
      const res = await axios.post("http://localhost:5000/api/compiler/run",
        { code, language, input: customInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOutput(res.data.stdout || res.data.stderr || res.data.compile_output || "No output");
    } catch {
      setOutput("❌ Execution failed.");
    } finally { setRunning(false); }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setVerdict({ status: "judging", message: "⏳ Judging your solution against all test cases..." });
    try {
      const data = await submitSolution({
        problemId: id,
        code,
        language: String(language),
        languageId: Number(language)
      });
      const verdictLabels = {
        AC:  "Accepted",
        WA:  "Wrong Answer",
        TLE: "Time Limit Exceeded",
        CE:  "Compilation Error",
        RE:  "Runtime Error",
      };
      const label = verdictLabels[data.verdict] || data.verdict;
      if (data.verdict === "AC") {
        setVerdict({ status: "ac", message: `✅ ${label}`, passed: data.passed, total: data.total });
      } else {
        setVerdict({ status: "wa", message: `❌ ${label}`, passed: data.passed, total: data.total, details: data.details });
      }
    } catch (err) {
      setVerdict({ status: "error", message: "❌ Submission error. Please try again." });
    } finally { setSubmitting(false); }
  };

  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  if (loading) return (
    <div className="pd-loading-screen">
      <div className="pd-loading-spinner" />
      <p>Loading problem...</p>
    </div>
  );
  if (!problem) return <div className="pd-loading-screen"><p>Problem not found.</p></div>;

  const acceptanceRate = problem.totalSubmissions > 0
    ? ((problem.acceptedSubmissions / problem.totalSubmissions) * 100).toFixed(1)
    : "0.0";

  return (
    <div className={`pd-root ${expanded ? "pd-expanded" : ""}`}>
      {/* ── TOP BAR ── */}
      <div className="pd-topbar">
        <div className="pd-topbar-left">
          <button className="pd-back-btn" onClick={() => window.history.back()}>← Back</button>
          <span className="pd-difficulty-badge"
            style={{ color: diffColor[problem.difficulty], background: diffBg[problem.difficulty] }}>
            Difficulty: {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
          </span>
          <button className="pd-icon-btn" title="Toggle theme" onClick={() => setTheme(t => t === "vs-dark" ? "light" : "vs-dark")}>
            {theme === "vs-dark" ? "☀️" : "🌙"}
          </button>
          <button className="pd-icon-btn" title="Expand" onClick={() => setExpanded(e => !e)}>
            {expanded ? "⊡" : "⊞"}
          </button>
        </div>
        <div className="pd-topbar-right">
          <button className="pd-run-btn" onClick={handleRun} disabled={running || submitting}>
            {running ? <span className="pd-mini-spinner" /> : "▶"} Run
          </button>
          <button className="pd-submit-btn" onClick={handleSubmit} disabled={running || submitting}>
            {submitting ? <span className="pd-mini-spinner" /> : "✔"} Submit
          </button>
        </div>
      </div>

      <div className="pd-body">
        {/* ── LEFT PANEL ── */}
        <div className="pd-left">
          {/* Tabs */}
          <div className="pd-tabs">
            {TABS.map(t => (
              <button key={t}
                className={`pd-tab ${activeTab === t ? "pd-tab-active" : ""}`}
                onClick={() => setActiveTab(t)}>
                {t}
              </button>
            ))}
          </div>

          <div className="pd-left-content">

            {/* STATEMENT TAB */}
            {activeTab === "Statement" && (
              <>
                <div className="pd-problem-header">
                  <h1 className="pd-title">{problem.title}</h1>
                  <div className="pd-meta-row">
                    {problem.tags?.map(t => <span key={t} className="pd-tag">{t}</span>)}
                  </div>
                  <div className="pd-stats-row">
                    <span>⏱ Time: {problem.timeLimit || 2}s</span>
                    <span>💾 Memory: {problem.memoryLimit || 256}MB</span>
                    <span>📊 {problem.totalSubmissions} submissions</span>
                    <span>✅ {acceptanceRate}% accepted</span>
                  </div>
                </div>

                {/* Description */}
                <div className="pd-section">
                  <h3 className="pd-section-title">Problem Description</h3>
                  <p className="pd-description">{problem.description}</p>
                </div>

                {/* Input Format */}
                {problem.inputFormat && (
                  <div className="pd-section">
                    <h3 className="pd-section-title">Input Format</h3>
                    <p className="pd-description">{problem.inputFormat}</p>
                  </div>
                )}

                {/* Output Format */}
                {problem.outputFormat && (
                  <div className="pd-section">
                    <h3 className="pd-section-title">Output Format</h3>
                    <p className="pd-description">{problem.outputFormat}</p>
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && (
                  <div className="pd-section">
                    <h3 className="pd-section-title">Constraints</h3>
                    <div className="pd-constraints-box">
                      {problem.constraints.split("\n").filter(l => l.trim()).map((line, i) => (
                        <div key={i} className="pd-constraint-line">
                          <span className="pd-constraint-bullet">•</span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pd-section">
                  <h3 className="pd-section-title">Sample Test Cases</h3>
                  {problem.sampleTestCases?.length > 0 ? (
                    problem.sampleTestCases.map((tc, i) => (
                      <div key={i} className="pd-sample-block">
                        <div className="pd-sample-header">Sample {i + 1}</div>
                        <div className="pd-sample-io">
                          <div className="pd-sample-half">
                            <div className="pd-sample-label">
                              Input
                              <button className="pd-copy-btn" onClick={() => copyToClipboard(tc.input)}>Copy</button>
                            </div>
                            <pre className="pd-code-block">{tc.input}</pre>
                          </div>
                          <div className="pd-sample-half">
                            <div className="pd-sample-label">
                              Output
                              <button className="pd-copy-btn" onClick={() => copyToClipboard(tc.output)}>Copy</button>
                            </div>
                            <pre className="pd-code-block">{tc.output}</pre>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#7a8499", fontSize: 14, padding: "12px 0" }}>
                      No sample test cases available for this problem. Please add them via the admin panel.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* SUBMISSIONS TAB */}
            {activeTab === "Submissions" && (
              <div className="pd-submissions">
                <h3 className="pd-section-title">My Submissions</h3>
                {mySubmissions.length === 0 ? (
                  <div className="pd-empty">No submissions yet for this problem.</div>
                ) : (
                  <table className="pd-sub-table">
                    <thead>
                      <tr><th>Verdict</th><th>Language</th><th>Time</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {mySubmissions.map(s => (
                        <tr key={s._id}>
                          <td><span className={`pd-verdict-chip v-${s.verdict?.toLowerCase()}`}>{s.verdict}</span></td>
                          <td>{s.language}</td>
                          <td>{s.timeTaken || 0}ms</td>
                          <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* SOLUTION TAB */}
            {activeTab === "Solution" && (
              <div className="pd-solution">
                <div className="pd-empty">
                  <span style={{ fontSize: 32 }}>🔒</span>
                  <p>Solutions are unlocked after solving or getting 3 wrong answers.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL (Editor) ── */}
        <div className="pd-right">
          {/* Language selector */}
          <div className="pd-editor-header">
            <select className="pd-lang-select" value={language}
              onChange={e => { const id = Number(e.target.value); setLanguage(id); setCode(languageMap[id].template); }}>
              {Object.entries(languageMap).map(([id, l]) => (
                <option key={id} value={id}>{l.name}</option>
              ))}
            </select>
            <button className="pd-icon-btn" title="Reset code"
              onClick={() => setCode(languageMap[language].template)}>↺ Reset</button>
          </div>

          {/* Monaco Editor */}
          <div className="pd-editor-wrap">
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
            <div className={`pd-verdict-banner ${verdict.status}`}>
              <span className="pd-verdict-msg">{verdict.message}</span>
              {(verdict.passed !== undefined) && (
                <span className="pd-verdict-score">{verdict.passed}/{verdict.total} test cases passed</span>
              )}
              {verdict.details && <span className="pd-verdict-detail">{verdict.details}</span>}
            </div>
          )}

          {/* Custom Input / Output */}
          <div className="pd-io-panel">
            <div className="pd-io-tabs">
              <span className="pd-io-label">Custom Input</span>
            </div>
            <textarea className="pd-custom-input" rows={4}
              placeholder="Enter test input..."
              value={customInput}
              onChange={e => setCustomInput(e.target.value)} />
            {output && (
              <div className="pd-output-box">
                <div className="pd-output-label">Output</div>
                <pre className="pd-output-pre">{output}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetail;