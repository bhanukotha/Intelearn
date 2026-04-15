// components/Chatbot.jsx
import { useState, useEffect, useRef } from "react";
import "./Chatbot.css";

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
      if (!res.ok) throw new Error(data.message || `Server error ${res.status}`);
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: `❌ ${err.message}` }]);
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
      {/* FAB */}
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

      {/* Window */}
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
                  <button key={q} className="cb-quick-btn" onClick={() => setInput(q)}>{q}</button>
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

export default Chatbot;