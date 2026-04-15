// pages/Contest.jsx
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import ContestArena from "./ContestArena";
import Chatbot from "../components/Chatbot";
import "./Contest.css";

const API     = "http://localhost:5000/api";
const hdrs    = () => ({ Authorization: `Bearer ${localStorage.getItem("authToken")}` });
const diffColor = { easy:"#22c55e", medium:"#f59e0b", hard:"#ef4444", mixed:"#818cf8" };

// ── Countdown Hook ─────────────────────────────────────────────────────────────
const useCountdown = (endTime) => {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date(endTime) - new Date();
      if (d <= 0) { setT("Ended"); return; }
      const h = Math.floor(d/3600000), m = Math.floor((d%3600000)/60000), s = Math.floor((d%60000)/1000);
      setT(`${h}h ${m}m ${s}s`);
    };
    tick(); const id = setInterval(tick,1000); return () => clearInterval(id);
  }, [endTime]);
  return t;
};

// ── Friday MCQ Arena ───────────────────────────────────────────────────────────
const FridayMCQArena = ({ onExit }) => {
  const [data,      setData]      = useState(null);
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result,    setResult]    = useState(null);
  const [timeLeft,  setTimeLeft]  = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [activeQ,   setActiveQ]   = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/weekly-contest/friday/generate`, { headers: hdrs() })
      .then(r => { setData(r.data); setTimeLeft(r.data.duration); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); doSubmit(); return 0; } return t-1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [data, submitted]);

  const doSubmit = async () => {
    clearInterval(timerRef.current);
    setSubmitted(true);
    try {
      const res = await axios.post(`${API}/weekly-contest/friday/submit`, {
        answers: data.questions.map((_,i) => answers[i] ?? -1),
        correctAnswers: data.answers,
        difficulty: data.difficulty,
        timeTaken: data.duration - timeLeft
      }, { headers: hdrs() });
      setResult(res.data);
    } catch {}
  };

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const urgent = timeLeft < 300;
  const answered = Object.keys(answers).length;

  if (loading) return <div className="ct-loading"><div className="ct-spinner"/><p>Generating your personalized contest…</p></div>;
  if (!data)   return <div className="ct-loading"><p>Failed to load contest. Please try again.</p><button onClick={onExit}>← Back</button></div>;

  if (submitted && result) {
    const pct = Math.round(result.accuracy);
    return (
      <div className="ct-page">
        <div className="ct-topbar fri">
          <button className="ct-back" onClick={onExit}>← Exit</button>
          <span className="ct-topbar-title">⚡ Friday MCQ Contest — Results</span>
        </div>
        <div className="ct-result-wrap">
          <div className="ct-result-card">
            <div className="ct-result-emoji">{pct>=70?"🏆":pct>=50?"👍":"📚"}</div>
            <h2>{pct>=70?"Excellent!":pct>=50?"Good Job!":"Keep Practicing!"}</h2>
            <div className="ct-result-score" style={{color:"#4f8ef7"}}>{result.score}<span>/{result.total}</span></div>
            <p className="ct-result-pct">{pct}% accuracy · {result.wrong} wrong</p>
            <div className="ct-result-bar-wrap"><div className="ct-result-bar" style={{width:`${pct}%`,background:"#4f8ef7"}}/></div>
            <div className="ct-diff-badge" style={{background: diffColor[data.difficulty]+"22", color: diffColor[data.difficulty]}}>
              RF Predicted Difficulty: {data.difficulty.toUpperCase()}
            </div>
            <p className="ct-result-note">Your next contest difficulty will be adjusted based on this performance using Random Forest algorithm.</p>
          </div>
          <div className="ct-review-list">
            <h3>Answer Review</h3>
            {data.questions.map((q,i) => {
              const sel = answers[i]; const isRight = sel === data.answers[i];
              return (
                <div key={i} className={`ct-review-item ${isRight?"right":"wrong"}`}>
                  <div className="ct-review-num">{isRight?"✓":"✗"}</div>
                  <div className="ct-review-body">
                    <p className="ct-review-q"><strong>Q{i+1} [{q.topic}].</strong> {q.q}</p>
                    {!isRight && <p className="ct-review-wrong">Your answer: {sel!==-1&&sel!==undefined?q.opts[sel]:"Not answered"}</p>}
                    <p className="ct-review-correct">✓ {q.opts[data.answers[i]]}</p>
                    <a href={q.ref} target="_blank" rel="noreferrer" className="ct-review-ref">📖 Learn more →</a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const q = data.questions[activeQ];
  return (
    <div className="ct-page">
      <div className="ct-topbar fri">
        <button className="ct-back" onClick={onExit}>← Exit</button>
        <div className="ct-topbar-center">
          <span className="ct-topbar-title">⚡ Friday MCQ Contest</span>
          <span className="ct-diff-chip" style={{background:diffColor[data.difficulty]+"22",color:diffColor[data.difficulty]}}>{data.difficulty}</span>
        </div>
        <div className={`ct-timer ${urgent?"urgent":""}`}>⏱ {fmt(timeLeft)}</div>
      </div>

      <div className="ct-mcq-layout">
        {/* Sidebar */}
        <div className="ct-mcq-sidebar">
          <div className="ct-sb-progress">
            <p className="ct-sb-label">Progress</p>
            <div className="ct-sb-score" style={{color:"#4f8ef7"}}>{answered}<span>/40</span></div>
            <div className="ct-sb-bar-wrap"><div className="ct-sb-bar" style={{width:`${(answered/40)*100}%`}}/></div>
          </div>
          <div className="ct-sb-grid">
            {data.questions.map((_,i) => (
              <button key={i}
                className={`ct-sb-dot ${answers[i]!==undefined?"filled":""} ${activeQ===i?"current":""}`}
                onClick={() => setActiveQ(i)}>{i+1}</button>
            ))}
          </div>
          <button className="ct-submit-full" onClick={doSubmit}>
            Submit ({answered}/40)
          </button>
        </div>

        {/* Main question area */}
        <div className="ct-mcq-main">
          <div className="ct-qcard">
            <div className="ct-qcard-header">
              <span className="ct-qnum">Q{activeQ+1} <span className="ct-qtotal">/ 40</span></span>
              <span className="ct-qtopic">{q.topic}</span>
            </div>
            <p className="ct-qtext">{q.q}</p>
            <div className="ct-qopts">
              {q.opts.map((opt,oi) => (
                <button key={oi}
                  className={`ct-qopt ${answers[activeQ]===oi?"sel":""}`}
                  onClick={() => setAnswers(p => ({...p,[activeQ]:oi}))}>
                  <span className="ct-opt-lbl">{String.fromCharCode(65+oi)}</span>
                  {opt}
                </button>
              ))}
            </div>
            <a href={q.ref} target="_blank" rel="noreferrer" className="ct-ref-link">📖 Reference: {q.ref}</a>
            <div className="ct-qnav">
              <button className="ct-qnav-btn" onClick={() => setActiveQ(a => Math.max(0,a-1))} disabled={activeQ===0}>← Prev</button>
              <button className="ct-qnav-btn primary" onClick={() => setActiveQ(a => Math.min(39,a+1))} disabled={activeQ===39}>Next →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sunday Coding Arena ────────────────────────────────────────────────────────
const SundayArena = ({ onExit }) => {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activePIdx,setActivePIdx]= useState(0);
  const [timeLeft,  setTimeLeft]  = useState(0);
  const [language,  setLanguage]  = useState(54);
  const [code,      setCode]      = useState("");
  const [output,    setOutput]    = useState("");
  const [running,   setRunning]   = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [verdict,   setVerdict]   = useState(null);
  const [solved,    setSolved]    = useState({});
  const timerRef = useRef(null);

  const LANGS = {
    54:{ name:"C++",     editor:"cpp",        tmpl:`#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n    // code here\n    return 0;\n}` },
    71:{ name:"Python",  editor:"python",      tmpl:`# code here\n` },
    62:{ name:"Java",    editor:"java",        tmpl:`import java.util.*;\nclass Main{\n  public static void main(String[] args){\n    // code here\n  }\n}` },
    63:{ name:"JS",      editor:"javascript",  tmpl:`// code here\n` },
  };

  useEffect(() => {
    axios.get(`${API}/weekly-contest/sunday/generate`, { headers: hdrs() })
      .then(r => { setData(r.data); setTimeLeft(r.data.duration); setCode(LANGS[54].tmpl); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data) return;
    timerRef.current = setInterval(() => setTimeLeft(t => t > 0 ? t-1 : 0), 1000);
    return () => clearInterval(timerRef.current);
  }, [data]);

  const fmt = (s) => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const urgent = timeLeft < 600;

  const runCode = async () => {
    setRunning(true); setOutput("⏳ Running...");
    try {
      const res = await axios.post(`${API}/compiler/run`, { code, language, input:"" }, { headers: hdrs() });
      setOutput(res.data.stdout || res.data.stderr || res.data.compile_output || "No output");
    } catch { setOutput("❌ Execution failed."); }
    finally { setRunning(false); }
  };

  const submitCode = async () => {
    const prob = data.problems[activePIdx];
    setSubmitting(true); setVerdict({status:"judging",msg:"⏳ Judging..."});
    try {
      const res = await axios.post(`${API}/submissions/submit`,
        { problemId: prob._id, code, language: String(language), languageId: language },
        { headers: hdrs() });
      const v = res.data.verdict;
      setVerdict(v==="AC" ? {status:"ac",msg:"✅ Accepted!"} : {status:"wa",msg:`❌ ${v}`});
      if (v==="AC") setSolved(s => ({...s,[activePIdx]:true}));
    } catch { setVerdict({status:"wa",msg:"❌ Submission failed"}); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="ct-loading"><div className="ct-spinner"/><p>Generating Sunday coding contest based on your performance…</p></div>;
  if (!data)   return <div className="ct-loading"><p>Failed to load. Please try again.</p><button onClick={onExit}>← Back</button></div>;

  const prob = data.problems[activePIdx];
  return (
    <div className="ct-page">
      <div className="ct-topbar sun">
        <button className="ct-back" onClick={onExit}>← Exit</button>
        <div className="ct-prob-tabs">
          {data.problems.map((p,i) => (
            <button key={i} className={`ct-prob-tab ${activePIdx===i?"active":""} ${solved[i]?"solved":""}`}
              onClick={() => { setActivePIdx(i); setVerdict(null); setOutput(""); }}>
              {solved[i]?"✅":`P${i+1}`}
            </button>
          ))}
        </div>
        <div className="ct-topbar-center">
          <span className="ct-diff-chip" style={{background:diffColor[data.difficulty]+"22",color:diffColor[data.difficulty]}}>{data.difficulty}</span>
        </div>
        <div className={`ct-timer ${urgent?"urgent":""}`}>⏱ {fmt(timeLeft)}</div>
        <button className="ct-run-btn" onClick={runCode} disabled={running||submitting}>
          {running?<><span className="ct-mini-spin"/>Running…</>:"▶ Run"}
        </button>
        <button className="ct-submit-btn" onClick={submitCode} disabled={running||submitting}>
          {submitting?<><span className="ct-mini-spin"/>Judging…</>:"✔ Submit"}
        </button>
      </div>

      <div className="ct-coding-layout">
        <div className="ct-prob-panel">
          <div className="ct-prob-inner">
            <h2 className="ct-prob-title">{prob.title}</h2>
            <div className="ct-prob-meta">
              <span style={{color:diffColor[prob.difficulty],background:diffColor[prob.difficulty]+"18",padding:"2px 10px",borderRadius:6,fontWeight:700,fontSize:12}}>{prob.difficulty}</span>
              {prob.tags?.map(t=><span key={t} className="ct-tag">{t}</span>)}
            </div>
            <div className="ct-prob-stats">
              <span>⏱ {prob.timeLimit||2}s</span><span>💾 {prob.memoryLimit||256}MB</span>
              <span>📊 {prob.totalSubmissions||0} submissions</span>
            </div>
            <div className="ct-prob-section"><h4>Description</h4><p>{prob.description}</p></div>
            {prob.inputFormat&&<div className="ct-prob-section"><h4>Input Format</h4><p>{prob.inputFormat}</p></div>}
            {prob.outputFormat&&<div className="ct-prob-section"><h4>Output Format</h4><p>{prob.outputFormat}</p></div>}
            {prob.constraints&&<div className="ct-prob-section"><h4>Constraints</h4><div className="ct-constraints">{prob.constraints.split("\n").filter(Boolean).map((l,i)=><div key={i}><span className="ct-bullet">•</span>{l}</div>)}</div></div>}
            {prob.sampleTestCases?.length>0&&(
              <div className="ct-prob-section">
                <h4>Sample Test Cases</h4>
                {prob.sampleTestCases.map((tc,i)=>(
                  <div key={i} className="ct-sample">
                    <div className="ct-sample-hdr">Sample {i+1}</div>
                    <div className="ct-sample-grid">
                      <div><p className="ct-sample-lbl">Input</p><pre className="ct-code-block">{tc.input}</pre></div>
                      <div><p className="ct-sample-lbl">Output</p><pre className="ct-code-block">{tc.output}</pre></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ct-editor-panel">
          <div className="ct-editor-hdr">
            <select className="ct-lang-sel" value={language}
              onChange={e=>{ const id=Number(e.target.value); setLanguage(id); setCode(LANGS[id].tmpl); }}>
              {Object.entries(LANGS).map(([id,l])=><option key={id} value={id}>{l.name}</option>)}
            </select>
            <button className="ct-ghost-btn" onClick={()=>setCode(LANGS[language].tmpl)}>↺ Reset</button>
          </div>
          <div className="ct-editor-wrap">
            <Editor height="100%" language={LANGS[language].editor} theme="vs-dark" value={code}
              onChange={v=>setCode(v||"")}
              options={{fontSize:14,minimap:{enabled:false},lineNumbers:"on",automaticLayout:true,scrollBeyondLastLine:false,fontFamily:"'Fira Code',monospace",tabSize:4}}/>
          </div>
          {verdict&&(
            <div className={`ct-verdict ${verdict.status}`}>{verdict.msg}</div>
          )}
          <div className="ct-io-panel">
            <p className="ct-io-lbl">Custom Input</p>
            <textarea className="ct-io-input" rows={3} placeholder="Enter test input…"/>
            {output&&<><p className="ct-io-lbl">Output</p><pre className="ct-io-output">{output}</pre></>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Daily Contest Card ─────────────────────────────────────────────────────────
const DailyCard = ({ contest, onEnter }) => {
  const countdown = useCountdown(contest?.endTime);
  const now   = new Date();
  const active= contest && new Date(contest.startTime)<=now && now<=new Date(contest.endTime);
  const canEnter = contest && ["upcoming","ongoing"].includes(contest.status) && active;

  const STATUS_COLOR = { upcoming:"#4f8ef7", ongoing:"#22c55e", completed:"#a855f7", missed:"#f87171" };
  const STATUS_LABEL = { upcoming:"Not Started", ongoing:"In Progress", completed:"Completed", missed:"Missed" };

  if (!contest) return <div className="ccard ccard-empty"><span>📅</span><p>No daily contest yet.</p></div>;

  return (
    <div className="ccard ccard-daily">
      <div className="ccard-top">
        <span className="ccard-label">📅 DAILY PROBLEM</span>
        <span className="ccard-status" style={{background:STATUS_COLOR[contest.status]+"22",color:STATUS_COLOR[contest.status]}}>{STATUS_LABEL[contest.status]}</span>
      </div>
      <div className="ccard-meta">
        <span style={{color:diffColor[contest.difficulty],fontWeight:700}}>● {contest.difficulty?.toUpperCase()}</span>
        <span>📝 {contest.totalQuestions} problem</span>
        <span>⏱ {contest.durationMinutes} min</span>
        {contest.status==="completed"&&<span>🏆 Score: <strong>{contest.score}</strong></span>}
      </div>
      <div className="ccard-times">
        <span>🕐 {new Date(contest.startTime).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
        <span>🕑 {new Date(contest.endTime).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
        {active&&contest.status!=="completed"&&<span style={{color:"#f87171"}}>⏳ {countdown}</span>}
      </div>
      {contest.problems?.length>0&&(
        <div className="ccard-problems">{contest.problems.map((p,i)=><span key={i} className="ccard-chip">{p.title||`Problem ${i+1}`}</span>)}</div>
      )}
      <button className="ccard-btn" disabled={!canEnter&&contest.status!=="ongoing"} onClick={()=>canEnter&&onEnter(contest)}>
        {contest.status==="completed"?"✅ Completed":contest.status==="missed"?"❌ Missed":!active?"🔒 Not Open Yet":"Enter Contest →"}
      </button>
    </div>
  );
};

// ── Weekly Card ────────────────────────────────────────────────────────────────
const WeeklyCard = ({ type, onEnter }) => {
  const now     = new Date();
  const day     = now.getDay(); // 0=Sun,5=Fri
  const isFri   = type === "friday";
  const targetDay = isFri ? 5 : 0;
  const isToday   = day === targetDay;
  const accent    = isFri ? "#4f8ef7" : "#f59e0b";
  const icon      = isFri ? "⚡" : "🌟";
  const label     = isFri ? "FRIDAY CONTEST" : "SUNDAY CONTEST";
  const desc      = isFri ? "40 MCQs · 45 min · Programming, DSA, DB & CS Fundamentals" : "4 Coding Problems · 2 hours · Based on your skill level";

  return (
    <div className="ccard" style={{borderTop:`3px solid ${accent}`}}>
      <div className="ccard-top">
        <span className="ccard-label" style={{color:accent}}>{icon} {label}</span>
        <span className="ccard-status" style={{background:isToday?"rgba(34,197,94,.15)":"rgba(79,142,247,.15)",color:isToday?"#22c55e":"#4f8ef7"}}>
          {isToday?"Today":"Upcoming"}
        </span>
      </div>
      <p className="ccard-desc-text">{desc}</p>
      <div className="ccard-features">
        {isFri ? (
          <>
            <div className="ccard-feat">🤖 <span>RF-based difficulty adaptation</span></div>
            <div className="ccard-feat">📚 <span>Topic references included</span></div>
            <div className="ccard-feat">📊 <span>Performance tracked for next contest</span></div>
          </>
        ) : (
          <>
            <div className="ccard-feat">🌳 <span>Problems adapt to your skill</span></div>
            <div className="ccard-feat">💻 <span>C++, Python, Java, JavaScript</span></div>
            <div className="ccard-feat">📈 <span>Judge0 auto-grading</span></div>
          </>
        )}
      </div>
      <button className="ccard-btn" style={{background:accent}} onClick={() => onEnter(type)}>
        {isFri?"Start Friday MCQ Contest →":"Start Sunday Coding Contest →"}
      </button>
    </div>
  );
};

// ── Main Contest Page ──────────────────────────────────────────────────────────
const Contest = () => {
  const [daily,   setDaily]   = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [arena,   setArena]   = useState(null); // "daily" | "friday" | "sunday"
  const [dailyContest, setDailyContest] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [d, h] = await Promise.all([
          axios.get(`${API}/contest/today`, { headers: hdrs() }),
          axios.get(`${API}/contest/my`,    { headers: hdrs() }),
        ]);
        setDaily(d.data);
        setHistory(h.data.slice(0,8));
      } catch (e) { setError(e.response?.data?.message || "Failed to load contests."); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleDailyEnter = async (contest) => {
    try {
      const res = await axios.put(`${API}/contest/enter/${contest._id}`, {}, { headers: hdrs() });
      setDailyContest(res.data); setArena("daily");
    } catch (e) { alert(e.response?.data?.message || "Could not enter."); }
  };

  if (arena==="daily" && dailyContest) return <ContestArena contest={dailyContest} initialProblemIndex={0} onExit={() => { setArena(null); window.location.reload(); }}/>;
  if (arena==="friday") return <FridayMCQArena onExit={() => setArena(null)} />;
  if (arena==="sunday") return <SundayArena    onExit={() => setArena(null)} />;

  if (loading) return <div className="contest-loading"><span className="spinner"/><p>Loading contests…</p></div>;

  const diffC = { easy:"#22c55e", medium:"#f59e0b", hard:"#ef4444" };
  const stC   = { upcoming:"#4f8ef7", ongoing:"#22c55e", completed:"#a855f7", missed:"#f87171" };
  const stL   = { upcoming:"Not Started", ongoing:"In Progress", completed:"Completed", missed:"Missed" };

  return (
    <div className="contest-page">
      <div className="contest-hero">
        <h1>Contests</h1>
        <p>Daily problems refresh every midnight · Friday MCQ contest (40 questions) · Sunday coding contest (4 problems) · Difficulty adapts using Random Forest</p>
      </div>

      {error && <div className="contest-error">{error}</div>}

      {/* Daily */}
      <h2 className="contest-section-title">📅 Daily Challenge</h2>
      <div className="contest-grid contest-grid-1">
        <DailyCard contest={daily} onEnter={handleDailyEnter}/>
      </div>

      {/* Weekly */}
      <h2 className="contest-section-title">🏆 Weekly Contests</h2>
      <div className="contest-grid">
        <WeeklyCard type="friday" onEnter={setArena}/>
        <WeeklyCard type="sunday" onEnter={setArena}/>
      </div>

      {/* History */}
      {history.length>0&&(
        <section className="contest-history">
          <h2>Recent History</h2>
          <table className="hist-table">
            <thead><tr><th>Type</th><th>Date/Slot</th><th>Difficulty</th><th>Status</th><th>Score</th></tr></thead>
            <tbody>
              {history.map(c=>(
                <tr key={c._id}>
                  <td><span className="tag">{c.contestType}</span></td>
                  <td style={{color:"#9ca3af",fontSize:13}}>{c.contestDay}</td>
                  <td><span style={{color:diffC[c.difficulty]}}>{c.difficulty}</span></td>
                  <td><span className={`ccard-status`} style={{background:stC[c.status]+"22",color:stC[c.status]}}>{stL[c.status]}</span></td>
                  <td><strong>{c.score}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <Chatbot/>
    </div>
  );
};

export default Contest;