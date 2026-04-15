import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProblems } from "../services/problemApi";

const DIFFICULTY_ORDER = { easy: 1, medium: 2, hard: 3 };

const diffStyle = {
  easy:   { color: "#22c55e", background: "rgba(34,197,94,0.1)",   padding: "2px 10px", borderRadius: 6, fontWeight: 700, fontSize: 12 },
  medium: { color: "#f59e0b", background: "rgba(245,158,11,0.1)",  padding: "2px 10px", borderRadius: 6, fontWeight: 700, fontSize: 12 },
  hard:   { color: "#ef4444", background: "rgba(239,68,68,0.1)",   padding: "2px 10px", borderRadius: 6, fontWeight: 700, fontSize: 12 },
};

const Practice = () => {
  const [problems,    setProblems]    = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [difficulty,  setDifficulty]  = useState("all");
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) { navigate("/login"); return; }

    getProblems()
      .then(data => {
        // API returns { problems: [...], total, page, totalPages }
        const list = Array.isArray(data) ? data : (data?.problems ?? []);
        const sorted = [...list].sort(
          (a, b) => (DIFFICULTY_ORDER[a.difficulty] || 0) - (DIFFICULTY_ORDER[b.difficulty] || 0)
        );
        setProblems(sorted);
        setFiltered(sorted);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load problems. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Re-filter whenever search or difficulty changes
  useEffect(() => {
    let result = problems;
    if (difficulty !== "all") result = result.filter(p => p.difficulty === difficulty);
    if (search.trim())        result = result.filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [difficulty, search, problems]);

  const stats = {
    easy:   problems.filter(p => p.difficulty === "easy").length,
    medium: problems.filter(p => p.difficulty === "medium").length,
    hard:   problems.filter(p => p.difficulty === "hard").length,
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Practice Problems</h2>
        <p style={styles.subtitle}>
          {problems.length} problems &nbsp;·&nbsp;
          <span style={{ color: "#22c55e" }}>{stats.easy} Easy</span> &nbsp;·&nbsp;
          <span style={{ color: "#f59e0b" }}>{stats.medium} Medium</span> &nbsp;·&nbsp;
          <span style={{ color: "#ef4444" }}>{stats.hard} Hard</span>
        </p>
      </div>

      {/* ── Filters ── */}
      <div style={styles.filters}>
        <input
          style={styles.search}
          placeholder="🔍 Search problems…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={styles.diffBtns}>
          {["all", "easy", "medium", "hard"].map(d => (
            <button
              key={d}
              style={{
                ...styles.diffBtn,
                ...(difficulty === d ? styles.diffBtnActive : {}),
                ...(d !== "all" ? { color: diffStyle[d]?.color } : {})
              }}
              onClick={() => setDifficulty(d)}
            >
              {d === "all" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── States ── */}
      {loading && <div style={styles.center}>Loading problems…</div>}
      {error   && <div style={styles.error}>{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div style={styles.center}>No problems found.</div>
      )}

      {/* ── Table ── */}
      {!loading && filtered.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Difficulty</th>
                <th style={styles.th}>Acceptance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => {
                const acceptance = p.totalSubmissions > 0
                  ? ((p.acceptedSubmissions / p.totalSubmissions) * 100).toFixed(1) + "%"
                  : "—";
                return (
                  <tr
                    key={p._id}
                    style={styles.row}
                    onClick={() => navigate(`/practice/${p._id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = "#0e1729"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={styles.td}>{idx + 1}</td>
                    <td style={{ ...styles.td, color: "#4f8ef7", cursor: "pointer", fontWeight: 500 }}>
                      {p.title}
                    </td>
                    <td style={styles.td}>
                      <span style={diffStyle[p.difficulty] || {}}>
                        {p.difficulty?.charAt(0).toUpperCase() + p.difficulty?.slice(1)}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: "#7a8499" }}>{acceptance}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  page:      { maxWidth: 900, margin: "0 auto", padding: "28px 20px", fontFamily: "'DM Sans', sans-serif" },
  header:    { marginBottom: 24 },
  title:     { fontSize: 28, fontWeight: 800, color: "#e8eaf0", margin: 0 },
  subtitle:  { fontSize: 14, color: "#7a8499", marginTop: 6 },
  filters:   { display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" },
  search:    { flex: 1, minWidth: 200, background: "#0e1729", border: "1px solid rgba(255,255,255,.08)", borderRadius: 9, padding: "10px 14px", color: "#e8eaf0", fontSize: 14, outline: "none" },
  diffBtns:  { display: "flex", gap: 8 },
  diffBtn:   { padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,.08)", background: "none", color: "#7a8499", fontSize: 13, cursor: "pointer", fontWeight: 500, transition: "all .2s", textTransform: "capitalize" },
  diffBtnActive: { background: "#4f8ef7", color: "#fff", borderColor: "#4f8ef7" },
  tableWrap: { background: "#0a0f1e", borderRadius: 12, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" },
  table:     { width: "100%", borderCollapse: "collapse" },
  th:        { padding: "12px 16px", textAlign: "left", color: "#7a8499", fontSize: 12, fontWeight: 600, textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,.07)", letterSpacing: ".05em" },
  td:        { padding: "14px 16px", color: "#e8eaf0", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,.04)" },
  row:       { cursor: "pointer", transition: "background .15s" },
  center:    { textAlign: "center", padding: "60px 20px", color: "#7a8499" },
  error:     { background: "rgba(248,113,113,.12)", border: "1px solid rgba(248,113,113,.3)", color: "#f87171", padding: "12px 16px", borderRadius: 10, marginBottom: 16 },
};

export default Practice;