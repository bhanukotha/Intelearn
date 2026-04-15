// pages/Compiler.jsx
import { useState } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import Chatbot from "../components/Chatbot";
import "./Compiler.css";

const LANGUAGES = {
  71:  { name: "Python",       editor: "python",      icon: "🐍", color: "#3776ab", template: `# Python 3\nprint("Hello, World!")` },
  54:  { name: "C++",          editor: "cpp",         icon: "⚡", color: "#00599c", template: `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}` },
  50:  { name: "C",            editor: "c",           icon: "🔧", color: "#5c6bc0", template: `#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}` },
  62:  { name: "Java",         editor: "java",        icon: "☕", color: "#f89820", template: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}` },
  63:  { name: "JavaScript",   editor: "javascript",  icon: "🟨", color: "#f7df1e", template: `// JavaScript (Node.js)\nconsole.log("Hello, World!");` },
  74:  { name: "TypeScript",   editor: "typescript",  icon: "🔷", color: "#3178c6", template: `// TypeScript\nconst msg: string = "Hello, World!";\nconsole.log(msg);` },
  78:  { name: "Kotlin",       editor: "kotlin",      icon: "🟣", color: "#7f52ff", template: `fun main() {\n    println("Hello, World!")\n}` },
  73:  { name: "Rust",         editor: "rust",        icon: "🦀", color: "#ce422b", template: `fn main() {\n    println!("Hello, World!");\n}` },
  60:  { name: "Go",           editor: "go",          icon: "🐹", color: "#00acd7", template: `package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, World!")\n}` },
  72:  { name: "Ruby",         editor: "ruby",        icon: "💎", color: "#cc342d", template: `puts "Hello, World!"` },
  68:  { name: "PHP",          editor: "php",         icon: "🐘", color: "#8892bf", template: `<?php\necho "Hello, World!\\n";` },
  79:  { name: "Objective-C",  editor: "objective-c", icon: "🍎", color: "#438eff", template: `#import <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}` },
  83:  { name: "Swift",        editor: "swift",       icon: "🕊️", color: "#f05138", template: `print("Hello, World!")` },
  85:  { name: "Perl",         editor: "perl",        icon: "🐪", color: "#39457e", template: `print "Hello, World!\\n";` },
};

const Compiler = ({ onSubmit = null, problemId = null }) => {
  const [langId,   setLangId]   = useState(71);
  const [code,     setCode]     = useState(LANGUAGES[71].template);
  const [input,    setInput]    = useState("");
  const [output,   setOutput]   = useState("");
  const [theme,    setTheme]    = useState("vs-dark");
  const [loading,  setLoading]  = useState(false);
  const [verdict,  setVerdict]  = useState(null);
  const [activeTab,setActiveTab]= useState("input"); // input | output
  const [dropOpen, setDropOpen] = useState(false);

  const token = localStorage.getItem("authToken");
  const lang  = LANGUAGES[langId];

  const runCode = async () => {
    setLoading(true);
    setOutput("");
    setVerdict(null);
    setActiveTab("output");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/compiler/run",
        { code, language: langId, input },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const out = res.data.stdout || res.data.stderr || res.data.compile_output || "No output produced.";
      setOutput(out);
    } catch {
      setOutput("❌ Execution failed. Check server/Judge0 config.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (onSubmit) { onSubmit(code, langId); return; }
    if (!problemId) { alert("Open a problem from Practice to submit."); return; }
    setVerdict({ type: "judging", text: "⏳ Judging…" });
    try {
      const res = await axios.post(
        "http://localhost:5000/api/submissions/submit",
        { problemId, code, language: String(langId), languageId: langId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVerdict(res.data.verdict === "AC"
        ? { type: "ac",  text: "✅ Accepted!" }
        : { type: "wa",  text: `❌ ${res.data.verdict}` }
      );
    } catch {
      setVerdict({ type: "wa", text: "❌ Submission failed." });
    }
  };

  const selectLang = (id) => {
    setLangId(id);
    setCode(LANGUAGES[id].template);
    setOutput("");
    setVerdict(null);
    setDropOpen(false);
  };

  const resetCode = () => { setCode(lang.template); setOutput(""); setVerdict(null); };

  return (
    <div className={`cmp-root ${theme === "vs-dark" ? "cmp-dark" : "cmp-light"}`}>

      {/* ── TOP BAR ── */}
      <div className="cmp-topbar">
        {/* Logo / Title */}
        <div className="cmp-topbar-left">
          <span className="cmp-title-icon">{"</>"}</span>
          <span className="cmp-title">Code Editor</span>
        </div>

        {/* Language Dropdown */}
        <div className="cmp-lang-wrapper">
          <button className="cmp-lang-btn" onClick={() => setDropOpen(d => !d)}>
            <span className="cmp-lang-icon">{lang.icon}</span>
            <span className="cmp-lang-name">{lang.name}</span>
            <svg className={`cmp-chevron ${dropOpen ? "open" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {dropOpen && (
            <div className="cmp-lang-dropdown">
              <div className="cmp-dropdown-grid">
                {Object.entries(LANGUAGES).map(([id, l]) => (
                  <button
                    key={id}
                    className={`cmp-dropdown-item ${Number(id) === langId ? "active" : ""}`}
                    onClick={() => selectLang(Number(id))}
                  >
                    <span className="cmp-di-icon">{l.icon}</span>
                    <span className="cmp-di-name">{l.name}</span>
                    {Number(id) === langId && <span className="cmp-di-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="cmp-topbar-right">
          <button className="cmp-btn-ghost" title="Reset code" onClick={resetCode}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
            </svg>
            Reset
          </button>
          <button className="cmp-btn-ghost" title="Toggle theme"
            onClick={() => setTheme(t => t === "vs-dark" ? "light" : "vs-dark")}>
            {theme === "vs-dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button className="cmp-btn-run" onClick={runCode} disabled={loading}>
            {loading
              ? <><span className="cmp-spinner"/> Running…</>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run</>
            }
          </button>
        </div>
      </div>

      {/* ── LANG COLOR BAR ── */}
      <div className="cmp-lang-bar" style={{ background: lang.color }} />

      {/* ── BODY ── */}
      <div className="cmp-body">
        {/* Editor */}
        <div className="cmp-editor-panel">
          <div className="cmp-editor-header">
            <span className="cmp-file-tab">
              <span className="cmp-file-dot" style={{ background: lang.color }}/>
              main{lang.editor === "python" ? ".py" : lang.editor === "java" ? ".java" : lang.editor === "cpp" ? ".cpp" : lang.editor === "c" ? ".c" : lang.editor === "javascript" ? ".js" : lang.editor === "typescript" ? ".ts" : lang.editor === "rust" ? ".rs" : lang.editor === "go" ? ".go" : lang.editor === "ruby" ? ".rb" : "." + lang.editor}
            </span>
          </div>
          <Editor
            height="calc(100vh - 200px)"
            language={lang.editor}
            theme={theme}
            value={code}
            onChange={v => setCode(v || "")}
            options={{
              fontSize: 14,
              fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              lineNumbers: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 4,
              wordWrap: "on",
              padding: { top: 16, bottom: 16 },
              renderLineHighlight: "line",
              smoothScrolling: true,
              cursorBlinking: "smooth",
            }}
          />
        </div>

        {/* Right Panel — Input / Output */}
        <div className="cmp-io-panel">
          {/* Tabs */}
          <div className="cmp-io-tabs">
            <button
              className={`cmp-io-tab ${activeTab === "input" ? "active" : ""}`}
              onClick={() => setActiveTab("input")}>
              📥 Input
            </button>
            <button
              className={`cmp-io-tab ${activeTab === "output" ? "active" : ""}`}
              onClick={() => setActiveTab("output")}>
              📤 Output
              {output && <span className="cmp-io-dot"/>}
            </button>
            <button className="cmp-clear-btn" onClick={() => { setOutput(""); setInput(""); setVerdict(null); }}>
              Clear
            </button>
          </div>

          {/* Verdict */}
          {verdict && (
            <div className={`cmp-verdict ${verdict.type}`}>
              {verdict.text}
            </div>
          )}

          {/* Input area */}
          {activeTab === "input" && (
            <div className="cmp-io-content">
              <textarea
                className="cmp-io-textarea"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Enter custom input here...&#10;&#10;Example:&#10;5&#10;1 2 3 4 5"
                spellCheck={false}
              />
            </div>
          )}

          {/* Output area */}
          {activeTab === "output" && (
            <div className="cmp-io-content">
              {loading ? (
                <div className="cmp-output-loading">
                  <span className="cmp-spinner-lg"/>
                  <p>Running your code…</p>
                </div>
              ) : output ? (
                <pre className="cmp-output-pre">{output}</pre>
              ) : (
                <div className="cmp-output-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  <p>Click <strong>Run</strong> to execute your code</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Chatbot />
    </div>
  );
};

export default Compiler;