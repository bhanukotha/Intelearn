// pages/profile.jsx
import { useEffect, useState } from "react";
import { getProfileStats } from "../services/profileApi";

const diffColor = { easy: "#22c55e", medium: "#f59e0b", hard: "#ef4444" };

const verdictColor = {
  AC:  { bg: "rgba(34,197,94,.15)",   color: "#22c55e" },
  WA:  { bg: "rgba(248,113,113,.15)", color: "#f87171" },
  TLE: { bg: "rgba(245,158,11,.15)",  color: "#f59e0b" },
  RE:  { bg: "rgba(168,85,247,.15)",  color: "#a855f7" },
  CE:  { bg: "rgba(99,102,241,.15)",  color: "#818cf8" },
};

const StatCard = ({ icon, label, value, accent }) => (
  <div style={s.card}>
    <span style={{ fontSize: 28 }}>{icon}</span>
    <div>
      <p style={s.cardLabel}>{label}</p>
      <p style={{ ...s.cardValue, color: accent || "#e8eaf0" }}>{value}</p>
    </div>
  </div>
);

const Profile = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getProfileStats()
      .then(setStats)
      .catch(() => setError("Failed to load profile. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={s.center}>
      <div style={s.spinner} />
      <p style={{ color: "#7a8499", marginTop: 12 }}>Loading profile…</p>
    </div>
  );

  if (error) return (
    <div style={s.center}>
      <p style={{ color: "#f87171" }}>{error}</p>
    </div>
  );

  if (!stats) return null;

  const maxLang = Math.max(...(stats.languageStats?.map(l => l.count) || [1]), 1);

  return (
    <div style={s.page}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.avatar}>{stats.name?.[0]?.toUpperCase()}</div>
        <div>
          <h1 style={s.name}>{stats.name}</h1>
          <p style={s.email}>{stats.email}</p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={s.cards}>
        <StatCard icon="⭐" label="Rating"               value={stats.rating}                accent="#f59e0b" />
        <StatCard icon="🥇" label="Global Rank"          value={`#${stats.rank}`}            accent="#4f8ef7" />
        <StatCard icon="✅" label="Problems Solved"      value={stats.problemsSolved}        accent="#22c55e" />
        <StatCard icon="🏆" label="Contests"             value={stats.contestsParticipated}  accent="#a855f7" />
        <StatCard icon="🔥" label="Daily Streak"         value={`${stats.dailyStreak} days`} accent="#ef4444" />
        <StatCard icon="📤" label="Total Submissions"    value={stats.totalSubmissions}      accent="#7a8499" />
      </div>

      <div style={s.cols}>

        {/* ── Language Breakdown ── */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Language Breakdown</h2>
          {stats.languageStats?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {stats.languageStats.map(l => (
                <div key={l._id} style={s.langRow}>
                  <span style={s.langName}>{l._id || "Unknown"}</span>
                  <div style={s.barWrap}>
                    <div style={{
                      ...s.bar,
                      width: `${Math.min((l.count / maxLang) * 100, 100)}%`
                    }} />
                  </div>
                  <span style={s.langCount}>{l.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={s.empty}>No accepted submissions yet.</p>
          )}
        </div>

        {/* ── Verdict Breakdown ── */}
        {stats.verdictStats?.length > 0 && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>Verdict Breakdown</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {stats.verdictStats.map(v => {
                const vc = verdictColor[v._id] || { bg: "rgba(255,255,255,.08)", color: "#7a8499" };
                return (
                  <div key={v._id} style={{ ...s.verdictChip, background: vc.bg, color: vc.color }}>
                    <span style={{ fontWeight: 800, fontSize: 18 }}>{v.count}</span>
                    <span style={{ fontSize: 12, marginTop: 2 }}>{v._id}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Recent Submissions ── */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Recent Submissions</h2>
        {stats.recentSubmissions?.length > 0 ? (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Problem</th>
                  <th style={s.th}>Difficulty</th>
                  <th style={s.th}>Verdict</th>
                  <th style={s.th}>Language</th>
                  <th style={s.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSubmissions.map(sub => {
                  const vc = verdictColor[sub.verdict] || { bg: "rgba(255,255,255,.08)", color: "#7a8499" };
                  const diff = sub.problemId?.difficulty;
                  return (
                    <tr key={sub._id}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={s.td}>{sub.problemId?.title || "—"}</td>
                      <td style={s.td}>
                        {diff ? (
                          <span style={{
                            color: diffColor[diff],
                            background: diffColor[diff] + "22",
                            padding: "2px 8px",
                            borderRadius: 5,
                            fontSize: 12,
                            fontWeight: 700,
                            textTransform: "capitalize"
                          }}>{diff}</span>
                        ) : "—"}
                      </td>
                      <td style={s.td}>
                        <span style={{
                          background: vc.bg, color: vc.color,
                          padding: "3px 9px", borderRadius: 5,
                          fontSize: 12, fontWeight: 700
                        }}>{sub.verdict}</span>
                      </td>
                      <td style={{ ...s.td, color: "#7a8499" }}>{sub.language}</td>
                      <td style={{ ...s.td, color: "#7a8499" }}>
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={s.empty}>No submissions yet. Start solving problems!</p>
        )}
      </div>
    </div>
  );
};

const s = {
  page:        { maxWidth: 960, margin: "0 auto", padding: "32px 20px 60px", fontFamily: "'DM Sans', sans-serif", color: "#e8eaf0" },
  center:      { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" },
  spinner:     { width: 36, height: 36, border: "3px solid rgba(79,142,247,.2)", borderTopColor: "#4f8ef7", borderRadius: "50%", animation: "spin .7s linear infinite" },

  header:      { display: "flex", alignItems: "center", gap: 20, marginBottom: 32, padding: "24px", background: "#0e1729", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)" },
  avatar:      { width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#4f8ef7,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", flexShrink: 0 },
  name:        { fontSize: 24, fontWeight: 800, color: "#e8eaf0", margin: "0 0 4px" },
  email:       { fontSize: 13, color: "#7a8499", margin: 0 },

  cards:       { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14, marginBottom: 28 },
  card:        { background: "#0e1729", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 },
  cardLabel:   { fontSize: 11, color: "#7a8499", textTransform: "uppercase", letterSpacing: ".04em", margin: "0 0 4px" },
  cardValue:   { fontSize: 22, fontWeight: 800, margin: 0 },

  cols:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 },
  section:     { background: "#0e1729", border: "1px solid rgba(255,255,255,.07)", borderRadius: 14, padding: "20px 22px", marginBottom: 20 },
  sectionTitle:{ fontSize: 16, fontWeight: 700, color: "#e8eaf0", margin: "0 0 16px", paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,.07)" },

  langRow:     { display: "flex", alignItems: "center", gap: 10 },
  langName:    { width: 90, fontSize: 13, color: "#e8eaf0", flexShrink: 0 },
  barWrap:     { flex: 1, background: "rgba(255,255,255,.06)", borderRadius: 4, height: 8 },
  bar:         { height: 8, borderRadius: 4, background: "linear-gradient(90deg,#4f8ef7,#a855f7)", transition: "width .4s ease" },
  langCount:   { width: 28, textAlign: "right", fontSize: 12, color: "#7a8499" },

  verdictChip: { display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 16px", borderRadius: 10, minWidth: 60 },

  tableWrap:   { borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,.06)" },
  table:       { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th:          { padding: "10px 14px", textAlign: "left", color: "#7a8499", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid rgba(255,255,255,.07)", background: "#0a0f1e" },
  td:          { padding: "12px 14px", color: "#e8eaf0", borderBottom: "1px solid rgba(255,255,255,.04)" },
  empty:       { color: "#7a8499", fontSize: 14, margin: 0 },
};

export default Profile;