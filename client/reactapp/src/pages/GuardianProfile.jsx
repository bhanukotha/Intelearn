// pages/GuardianProfile.jsx
// BUG FIX #7: file was empty – full implementation below
import { useEffect, useState } from "react";
import axios from "axios";
import "./GuardianProfile.css";

const API     = "http://localhost:5000/api";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("authToken")}` });

const GuardianProfile = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    axios.get(`${API}/profile/me`, { headers: headers() })
      .then(r => setStats(r.data))
      .catch(e => setError(e.response?.data?.message || "Failed to load guardian info."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="gp-loading"><span className="spinner" /> Loading…</div>;
  if (error)   return <div className="gp-error">{error}</div>;

  return (
    <div className="gp-page">
      <div className="gp-header">
        <div className="gp-avatar">{stats.name?.[0]?.toUpperCase()}</div>
        <div>
          <h1>{stats.name}</h1>
          <p className="gp-email">{stats.email}</p>
        </div>
      </div>

      <div className="gp-cards">
        <div className="gp-card">
          <span className="gp-card-icon">🏅</span>
          <div>
            <p className="gp-card-label">Rating</p>
            <p className="gp-card-value">{stats.rating}</p>
          </div>
        </div>
        <div className="gp-card">
          <span className="gp-card-icon">🥇</span>
          <div>
            <p className="gp-card-label">Global Rank</p>
            <p className="gp-card-value">#{stats.rank}</p>
          </div>
        </div>
        <div className="gp-card">
          <span className="gp-card-icon">✅</span>
          <div>
            <p className="gp-card-label">Problems Solved</p>
            <p className="gp-card-value">{stats.problemsSolved}</p>
          </div>
        </div>
        <div className="gp-card">
          <span className="gp-card-icon">🏆</span>
          <div>
            <p className="gp-card-label">Contests Participated</p>
            <p className="gp-card-value">{stats.contestsParticipated}</p>
          </div>
        </div>
        <div className="gp-card">
          <span className="gp-card-icon">🔥</span>
          <div>
            <p className="gp-card-label">Daily Streak</p>
            <p className="gp-card-value">{stats.dailyStreak} days</p>
          </div>
        </div>
        <div className="gp-card">
          <span className="gp-card-icon">📤</span>
          <div>
            <p className="gp-card-label">Total Submissions</p>
            <p className="gp-card-value">{stats.totalSubmissions}</p>
          </div>
        </div>
      </div>

      <div className="gp-section">
        <h2>Language Breakdown</h2>
        {stats.languageStats?.length > 0 ? (
          <div className="gp-langs">
            {stats.languageStats.map(l => (
              <div key={l._id} className="gp-lang-row">
                <span className="gp-lang-name">{l._id || "Unknown"}</span>
                <div className="gp-lang-bar-wrap">
                  <div
                    className="gp-lang-bar"
                    style={{ width: `${Math.min((l.count / stats.problemsSolved) * 100, 100)}%` }}
                  />
                </div>
                <span className="gp-lang-count">{l.count}</span>
              </div>
            ))}
          </div>
        ) : <p className="gp-empty">No AC submissions yet.</p>}
      </div>

      <div className="gp-section">
        <h2>Recent Submissions</h2>
        {stats.recentSubmissions?.length > 0 ? (
          <table className="gp-table">
            <thead><tr><th>Problem</th><th>Difficulty</th><th>Verdict</th><th>Date</th></tr></thead>
            <tbody>
              {stats.recentSubmissions.map(s => (
                <tr key={s._id}>
                  <td>{s.problemId?.title || "–"}</td>
                  <td>{s.problemId?.difficulty || "–"}</td>
                  <td>
                    <span className={`verdict-chip v-${s.verdict?.toLowerCase()}`}>{s.verdict}</span>
                  </td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="gp-empty">No submissions yet.</p>}
      </div>
    </div>
  );
};

export default GuardianProfile;