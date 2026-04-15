// pages/AdminPanel.jsx
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./AdminPanel.css";

const API = "http://localhost:5000/api/problems";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("authToken")}` });

const EMPTY_FORM = {
  title: "",
  description: "",
  inputFormat: "",
  outputFormat: "",
  constraints: "",
  difficulty: "easy",
  tags: "",
  timeLimit: 2,
  memoryLimit: 256,
  sampleTestCases: [{ input: "", output: "" }],
  hiddenTestCases: [{ input: "", output: "" }],
};

const AdminPanel = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [problems, setProblems] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState({ text: "", type: "" });
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (!user.isAdmin) { navigate("/practice"); return; }
    fetchProblems();
  }, [user]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}?limit=100`, { headers: headers() });
      const list = Array.isArray(res.data) ? res.data : (res.data?.problems ?? []);
      setProblems(list);
    } catch {
      showMsg("Failed to load problems", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const setTC = (kind, idx, field, val) => {
    setForm(f => {
      const arr = [...f[kind]];
      arr[idx] = { ...arr[idx], [field]: val };
      return { ...f, [kind]: arr };
    });
  };

  const addTC    = (kind) => setForm(f => ({ ...f, [kind]: [...f[kind], { input: "", output: "" }] }));
  const removeTC = (kind, idx) => setForm(f => ({ ...f, [kind]: f[kind].filter((_, i) => i !== idx) }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim())       { showMsg("Title is required.", "error"); return; }
    if (!form.description.trim()) { showMsg("Description is required.", "error"); return; }
    if (!form.inputFormat.trim()) { showMsg("Input Format is required.", "error"); return; }
    if (!form.outputFormat.trim()){ showMsg("Output Format is required.", "error"); return; }
    if (!form.constraints.trim()) { showMsg("Constraints are required.", "error"); return; }
    if (form.sampleTestCases.some(tc => !tc.input.trim() || !tc.output.trim())) {
      showMsg("All sample test cases need both input and output.", "error"); return;
    }
    if (form.hiddenTestCases.some(tc => !tc.input.trim() || !tc.output.trim())) {
      showMsg("All hidden test cases need both input and output.", "error"); return;
    }

    setSaving(true);

    // Combine inputFormat + outputFormat into description for display
    const fullDescription =
      form.description.trim() +
      "\n\n**Input Format**\n" + form.inputFormat.trim() +
      "\n\n**Output Format**\n" + form.outputFormat.trim();

    const payload = {
      title:           form.title.trim(),
      description:     fullDescription,
      constraints:     form.constraints.trim(),
      difficulty:      form.difficulty,
      tags:            form.tags.split(",").map(t => t.trim()).filter(Boolean),
      timeLimit:       Number(form.timeLimit),
      memoryLimit:     Number(form.memoryLimit),
      sampleTestCases: form.sampleTestCases,
      hiddenTestCases: form.hiddenTestCases,
    };

    try {
      if (editId) {
        await axios.put(`${API}/${editId}`, payload, { headers: headers() });
        showMsg("✅ Problem updated successfully!");
      } else {
        await axios.post(`${API}/add`, payload, { headers: headers() });
        showMsg("✅ Problem added! It is now live on the Practice page.");
      }
      setForm(EMPTY_FORM);
      setEditId(null);
      setShowForm(false);
      fetchProblems();
    } catch (err) {
      showMsg(err.response?.data?.message || "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (p) => {
    try {
      const res  = await axios.get(`${API}/${p._id}`, { headers: headers() });
      const full = res.data;

      // Try to parse back inputFormat/outputFormat from combined description
      let desc = full.description || "";
      let inputFormat = "", outputFormat = "";
      const inputMatch  = desc.match(/\*\*Input Format\*\*\n([\s\S]*?)(\n\n\*\*Output Format\*\*|$)/);
      const outputMatch = desc.match(/\*\*Output Format\*\*\n([\s\S]*?)$/);
      if (inputMatch)  { inputFormat  = inputMatch[1].trim();  desc = desc.split("\n\n**Input Format**")[0].trim(); }
      if (outputMatch) { outputFormat = outputMatch[1].trim(); }

      setForm({
        title:           full.title,
        description:     desc,
        inputFormat,
        outputFormat,
        constraints:     full.constraints || "",
        difficulty:      full.difficulty,
        tags:            (full.tags || []).join(", "),
        timeLimit:       full.timeLimit || 2,
        memoryLimit:     full.memoryLimit || 256,
        sampleTestCases: full.sampleTestCases?.length ? full.sampleTestCases.map(tc => ({ input: tc.input, output: tc.output })) : [{ input: "", output: "" }],
        hiddenTestCases: full.hiddenTestCases?.length ? full.hiddenTestCases.map(tc => ({ input: tc.input, output: tc.output })) : [{ input: "", output: "" }],
      });
      setEditId(p._id);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      showMsg("Failed to load problem for editing.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this problem permanently?")) return;
    setDeleting(id);
    try {
      await axios.delete(`${API}/${id}`, { headers: headers() });
      showMsg("Problem deleted.");
      fetchProblems();
    } catch {
      showMsg("Delete failed.", "error");
    } finally {
      setDeleting(null);
    }
  };

  const cancelForm = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(false); };

  return (
    <div className="ap-page">
      {/* ── Header ── */}
      <div className="ap-header">
        <div>
          <h1 className="ap-title">⚙ Admin Panel</h1>
          <p className="ap-sub">Add, edit or delete practice problems. Changes appear instantly on the Practice page.</p>
        </div>
        {!showForm && (
          <button className="ap-btn-primary" onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }}>
            + Add New Problem
          </button>
        )}
      </div>

      {/* ── Message ── */}
      {msg.text && (
        <div className={`ap-msg ${msg.type === "error" ? "ap-msg-error" : "ap-msg-success"}`}>
          {msg.text}
        </div>
      )}

      {/* ── FORM ── */}
      {showForm && (
        <form className="ap-form" onSubmit={handleSave}>
          <h2 className="ap-form-title">
            {editId ? "✏️ Edit Problem" : "➕ Add New Problem"}
          </h2>

          {/* Title + Difficulty */}
          <div className="ap-row2">
            <div className="ap-field">
              <label>Problem Title *</label>
              <input
                value={form.title}
                onChange={e => setField("title", e.target.value)}
                placeholder="e.g. Two Sum, Reverse Linked List"
                required
              />
            </div>
            <div className="ap-field">
              <label>Difficulty *</label>
              <select value={form.difficulty} onChange={e => setField("difficulty", e.target.value)}>
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>
            </div>
          </div>

          {/* Tags + Time + Memory */}
          <div className="ap-row3">
            <div className="ap-field">
              <label>Tags (comma separated)</label>
              <input
                value={form.tags}
                onChange={e => setField("tags", e.target.value)}
                placeholder="array, dp, greedy"
              />
            </div>
            <div className="ap-field">
              <label>Time Limit (seconds)</label>
              <input type="number" min="1" max="10" value={form.timeLimit}
                onChange={e => setField("timeLimit", e.target.value)} />
            </div>
            <div className="ap-field">
              <label>Memory Limit (MB)</label>
              <input type="number" min="32" max="512" value={form.memoryLimit}
                onChange={e => setField("memoryLimit", e.target.value)} />
            </div>
          </div>

          <div className="ap-divider">Problem Statement</div>

          {/* Description */}
          <div className="ap-field">
            <label>Problem Description *</label>
            <textarea
              rows={6}
              value={form.description}
              onChange={e => setField("description", e.target.value)}
              placeholder="Describe the problem clearly. What is the task? What should the solution compute? Explain with context."
              required
            />
          </div>

          {/* Input Format + Output Format side by side */}
          <div className="ap-row2">
            <div className="ap-field">
              <label>Input Format *</label>
              <textarea
                rows={4}
                value={form.inputFormat}
                onChange={e => setField("inputFormat", e.target.value)}
                placeholder={"First line: integer N\nSecond line: N space-separated integers"}
                required
              />
            </div>
            <div className="ap-field">
              <label>Output Format *</label>
              <textarea
                rows={4}
                value={form.outputFormat}
                onChange={e => setField("outputFormat", e.target.value)}
                placeholder={"Print a single integer — the answer."}
                required
              />
            </div>
          </div>

          {/* Constraints */}
          <div className="ap-field">
            <label>Constraints *</label>
            <textarea
              rows={4}
              value={form.constraints}
              onChange={e => setField("constraints", e.target.value)}
              placeholder={"1 <= N <= 10^5\n-10^9 <= arr[i] <= 10^9\nTime: O(N log N)"}
              required
            />
          </div>

          <div className="ap-divider">Test Cases</div>

          {/* Sample Test Cases */}
          <div className="ap-tc-section">
            <div className="ap-tc-header">
              <div>
                <h3>Sample Test Cases</h3>
                <p className="ap-tc-hint">Shown to students in the problem statement</p>
              </div>
              <button type="button" className="ap-btn-add-tc" onClick={() => addTC("sampleTestCases")}>
                + Add Sample
              </button>
            </div>
            {form.sampleTestCases.map((tc, i) => (
              <div key={i} className="ap-tc-block">
                <div className="ap-tc-label">Sample {i + 1}</div>
                <div className="ap-tc-grid">
                  <div className="ap-field">
                    <label>Input</label>
                    <textarea
                      rows={4}
                      value={tc.input}
                      onChange={e => setTC("sampleTestCases", i, "input", e.target.value)}
                      placeholder={"5\n1 2 3 4 5"}
                    />
                  </div>
                  <div className="ap-field">
                    <label>Expected Output</label>
                    <textarea
                      rows={4}
                      value={tc.output}
                      onChange={e => setTC("sampleTestCases", i, "output", e.target.value)}
                      placeholder={"15"}
                    />
                  </div>
                </div>
                {form.sampleTestCases.length > 1 && (
                  <button type="button" className="ap-btn-remove-tc"
                    onClick={() => removeTC("sampleTestCases", i)}>
                    ✕ Remove Sample {i + 1}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Hidden Test Cases */}
          <div className="ap-tc-section">
            <div className="ap-tc-header">
              <div>
                <h3>Hidden Test Cases</h3>
                <p className="ap-tc-hint">Used for judging — NOT shown to students. Add edge cases here.</p>
              </div>
              <button type="button" className="ap-btn-add-tc" onClick={() => addTC("hiddenTestCases")}>
                + Add Hidden
              </button>
            </div>
            {form.hiddenTestCases.map((tc, i) => (
              <div key={i} className="ap-tc-block">
                <div className="ap-tc-label">Hidden {i + 1}</div>
                <div className="ap-tc-grid">
                  <div className="ap-field">
                    <label>Input</label>
                    <textarea
                      rows={4}
                      value={tc.input}
                      onChange={e => setTC("hiddenTestCases", i, "input", e.target.value)}
                      placeholder={"Large input / edge case"}
                    />
                  </div>
                  <div className="ap-field">
                    <label>Expected Output</label>
                    <textarea
                      rows={4}
                      value={tc.output}
                      onChange={e => setTC("hiddenTestCases", i, "output", e.target.value)}
                      placeholder={"Correct output for above input"}
                    />
                  </div>
                </div>
                {form.hiddenTestCases.length > 1 && (
                  <button type="button" className="ap-btn-remove-tc"
                    onClick={() => removeTC("hiddenTestCases", i)}>
                    ✕ Remove Hidden {i + 1}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Form Actions */}
          <div className="ap-form-actions">
            <button type="button" className="ap-btn-cancel" onClick={cancelForm}>
              Cancel
            </button>
            <button type="submit" className="ap-btn-primary" disabled={saving}>
              {saving
                ? (editId ? "Updating…" : "Adding…")
                : (editId ? "✔ Update Problem" : "✔ Add Problem to Practice")}
            </button>
          </div>
        </form>
      )}

      {/* ── Problem List ── */}
      <div className="ap-list-header">
        <h2>All Problems <span style={{ color: "#7a8499", fontWeight: 400 }}>({problems.length})</span></h2>
      </div>

      {loading ? (
        <div className="ap-loading">
          <div className="ap-spinner" />
          <p>Loading problems…</p>
        </div>
      ) : problems.length === 0 ? (
        <div className="ap-empty">
          <p style={{ fontSize: 32, margin: "0 0 12px" }}>📭</p>
          <p>No problems yet. Click <strong>+ Add New Problem</strong> to get started.</p>
        </div>
      ) : (
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Submissions</th>
                <th>Acceptance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p, idx) => {
                const acc = p.totalSubmissions > 0
                  ? ((p.acceptedSubmissions / p.totalSubmissions) * 100).toFixed(1) + "%"
                  : "–";
                return (
                  <tr key={p._id}>
                    <td className="ap-td-num">{idx + 1}</td>
                    <td className="ap-td-title">{p.title}</td>
                    <td><span className={`ap-diff ap-diff-${p.difficulty}`}>{p.difficulty}</span></td>
                    <td style={{ color: "#7a8499" }}>{p.totalSubmissions ?? 0}</td>
                    <td style={{ color: "#7a8499" }}>{acc}</td>
                    <td className="ap-td-actions">
                      <button className="ap-btn-edit" onClick={() => handleEdit(p)}>✏ Edit</button>
                      <button className="ap-btn-delete"
                        disabled={deleting === p._id}
                        onClick={() => handleDelete(p._id)}>
                        {deleting === p._id ? "…" : "🗑 Delete"}
                      </button>
                    </td>
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

export default AdminPanel;