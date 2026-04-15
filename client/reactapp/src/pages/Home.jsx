// pages/Home.jsx
import { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Home.css";

// ── Chatbot ────────────────────────────────────────────────────────────────────
const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello 👋 Welcome to Intelearn! I'm Eve, your AI assistant. How may I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show the real error from server
        throw new Error(data.message || `Server error ${res.status}`);
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error("Chat error:", err.message);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `❌ ${err.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK = [
    "Tell me about contests",
    "How do I practice?",
    "What courses are available?",
    "Help me get started"
  ];

  return (
    <>
      <button className="cb-fab" onClick={() => setOpen(o => !o)} aria-label="Open chat">
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/>
            <circle cx="8"  cy="11" r="1.2" fill="#fff"/>
            <circle cx="12" cy="11" r="1.2" fill="#fff"/>
            <circle cx="16" cy="11" r="1.2" fill="#fff"/>
          </svg>
        )}
      </button>

      {open && (
        <div className="cb-window">
          <div className="cb-header">
            <div className="cb-header-avatar">
              <span>AI</span>
              <span className="cb-online-dot"/>
            </div>
            <div>
              <p className="cb-header-name">Eve</p>
              <p className="cb-header-status">Online · AI Assistant</p>
            </div>
            <button className="cb-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="cb-messages">
            {messages.map((m, i) => (
              <div key={i} className={`cb-msg-row ${m.role === "user" ? "cb-user" : "cb-bot"}`}>
                {m.role === "assistant" && <div className="cb-bot-avatar">AI</div>}
                <div className={`cb-bubble ${m.role === "user" ? "cb-bubble-user" : "cb-bubble-bot"}`}>
                  <p>{m.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="cb-msg-row cb-bot">
                <div className="cb-bot-avatar">AI</div>
                <div className="cb-bubble cb-bubble-bot cb-typing">
                  <span/><span/><span/>
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && (
              <div className="cb-quick-replies">
                {QUICK.map(q => (
                  <button key={q} className="cb-quick-btn" onClick={() => setInput(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div className="cb-input-row">
            <input
              className="cb-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
            />
            <button className="cb-send" onClick={sendMessage} disabled={loading || !input.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
              </svg>
            </button>
          </div>
          <p className="cb-footer">AI Agent powered by <span>Intelearn</span></p>
        </div>
      )}
    </>
  );
};

// ── Featured Courses ───────────────────────────────────────────────────────────
const FEATURED_COURSES = [
  { id: "java",   icon: "☕",  title: "Java",   color: "#f89820", desc: "Object-oriented, platform-independent, enterprise-grade programming." },
  { id: "c",      icon: "C",   title: "C",      color: "#5c6bc0", desc: "Low-level systems programming, memory management and OS fundamentals." },
  { id: "python", icon: "🐍",  title: "Python", color: "#3776ab", desc: "AI, ML, automation and rapid prototyping made simple." },
  { id: "cpp",    icon: "C++", title: "C++",    color: "#00599c", desc: "High-performance competitive programming and system development." },
];

// ── Home Page ──────────────────────────────────────────────────────────────────
const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="home-hero-eyebrow">
            <span className="home-eyebrow-line"/>
            YOUR CODING JOURNEY STARTS HERE
          </p>
          <h1 className="home-hero-title">
            Welcome back, <span className="home-hero-name">{user?.name || "Coder"}</span> 👋
          </h1>
          <p className="home-hero-sub">
            Learn programming languages, solve real problems, and level up your skills — all in one place.
          </p>
          <div className="home-hero-stats">
            <div className="home-stat">
              <span className="home-stat-val">5+</span>
              <span className="home-stat-label">LANGUAGES</span>
            </div>
            <div className="home-stat-divider"/>
            <div className="home-stat">
              <span className="home-stat-val">500+</span>
              <span className="home-stat-label">PROBLEMS</span>
            </div>
            <div className="home-stat-divider"/>
            <div className="home-stat">
              <span className="home-stat-val">AI</span>
              <span className="home-stat-label">POWERED Learning</span>
            </div>
          </div>
          <div className="home-hero-actions">
            <button className="home-cta-primary"   onClick={() => navigate("/practice")}>Start Practicing →</button>
            <button className="home-cta-secondary" onClick={() => navigate("/contest")}>View Contests</button>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-inner">
          <div className="home-section-header">
            <span className="home-section-badge">📘</span>
            <h2 className="home-section-title">Start Learning</h2>
            <button className="home-view-all" onClick={() => navigate("/courses")}>
              View all courses →
            </button>
          </div>
          <div className="home-courses-grid">
            {FEATURED_COURSES.map(c => (
              <div key={c.id} className="home-course-card" onClick={() => navigate("/courses")}>
                <div className="home-course-top">
                  <span className="home-course-icon" style={{ color: c.color, background: c.color + "22" }}>
                    {c.icon}
                  </span>
                </div>
                <h3 className="home-course-title">{c.title}</h3>
                <p className="home-course-desc">{c.desc}</p>
                <span className="home-course-cta" style={{ color: c.color }}>Explore →</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Chatbot/>
    </div>
  );
};

export default Home;