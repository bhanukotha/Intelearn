// pages/auth/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    guardianEmail: "", guardianPhone: ""
  });
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Name, email and password are required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        name:          form.name.trim(),
        email:         form.email.trim(),
        password:      form.password,
        guardianEmail: form.guardianEmail.trim(),
        guardianPhone: form.guardianPhone.trim()
      });
      setSuccess("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-brand">
          <h1>Inte<span>learn</span></h1>
          <p>Create your student account.</p>
        </div>

        {error   && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-grid-2">
            <div className="auth-field">
              <label>Full Name *</label>
              <input name="name" placeholder="Jane Doe" onChange={handleChange} required />
            </div>
            <div className="auth-field">
              <label>Email *</label>
              <input name="email" type="email" placeholder="student@example.com" onChange={handleChange} required />
            </div>
            <div className="auth-field">
              <label>Password *</label>
              <input name="password" type="password" placeholder="Min 6 characters" onChange={handleChange} required />
            </div>
            <div className="auth-field">
              <label>Confirm Password *</label>
              <input name="confirmPassword" type="password" placeholder="Repeat password" onChange={handleChange} required />
            </div>
          </div>

          <div className="auth-divider"><span>Guardian Info (optional)</span></div>

          <div className="auth-grid-2">
            <div className="auth-field">
              <label>Guardian Email</label>
              <input name="guardianEmail" type="email" placeholder="guardian@example.com" onChange={handleChange} />
            </div>
            <div className="auth-field">
              <label>Guardian Phone</label>
              <input name="guardianPhone" type="tel" placeholder="9XXXXXXXXX" onChange={handleChange} />
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : "Create Account →"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;