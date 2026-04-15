// pages/auth/Login.jsx
import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import "./Auth.css";

const Login = () => {
  const navigate  = useNavigate();
  const { login } = useContext(AuthContext);

  const [role,     setRole]     = useState("student");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const url     = `http://localhost:5000/api/auth/login/${role}`;
      const payload = role === "student"
        ? { email: email.trim(), password }
        : { guardianId: email.trim(), password };
      const res = await axios.post(url, payload);
      login(res.data);
      navigate(role === "guardian" ? "/guardian" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>Inte<span>learn</span></h1>
          <p>Welcome back! Sign in to continue.</p>
        </div>
        <div className="auth-role-toggle">
          <button type="button" className={role === "student"  ? "role-active" : ""} onClick={() => setRole("student")}>🎓 Student</button>
          <button type="button" className={role === "guardian" ? "role-active" : ""} onClick={() => setRole("guardian")}>👤 Guardian</button>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>{role === "student" ? "Email" : "Guardian Email or Phone"}</label>
            <input
              type={role === "student" ? "email" : "text"}
              placeholder={role === "student" ? "student@example.com" : "guardian@example.com"}
              value={email} onChange={e => setEmail(e.target.value)}
              required autoComplete="username"
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password"
            />
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : "Sign In →"}
          </button>
        </form>
        <p className="auth-footer">Don't have an account? <Link to="/signup">Sign Up</Link></p>
      </div>
    </div>
  );
};

export default Login;