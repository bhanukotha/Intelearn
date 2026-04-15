// components/Navbar.jsx
import { useContext, useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaUserCircle, FaBars, FaTimes } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout }        = useContext(AuthContext);
  const [dropOpen, setDropOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate                = useNavigate();
  const dropRef                 = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logout(); setDropOpen(false); navigate("/login"); };

  // Profile route depends on role:
  // student  → /profile
  // guardian → /guardian
  const profileRoute = user?.role === "guardian" ? "/guardian" : "/profile";
  const profileLabel = user?.role === "guardian" ? "👤 Guardian Profile" : "👤 My Profile";

  return (
    <nav className="navbar">
      <Link to="/" className="logo">Inte<span>learn</span></Link>

      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        <NavLink to="/"         end  onClick={() => setMenuOpen(false)}>Home</NavLink>
        <NavLink to="/courses"       onClick={() => setMenuOpen(false)}>Courses</NavLink>
        <NavLink to="/practice"      onClick={() => setMenuOpen(false)}>Practice</NavLink>
        <NavLink to="/compiler"      onClick={() => setMenuOpen(false)}>Compiler</NavLink>
        <NavLink to="/contest"       onClick={() => setMenuOpen(false)}>Contest</NavLink>
        <NavLink to="/discuss"       onClick={() => setMenuOpen(false)}>Discuss</NavLink>
        {user?.isAdmin && (
          <NavLink to="/admin" onClick={() => setMenuOpen(false)} style={{ color: "#f59e0b" }}>
            ⚙ Admin
          </NavLink>
        )}
      </div>

      <div className="nav-right">
        <button className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu" style={{ background: "none", border: "none" }}>
          {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>

        {!user ? (
          <>
            <Link to="/login"  className="auth-link">Login</Link>
            <Link to="/signup" className="auth-btn">Sign Up</Link>
          </>
        ) : (
          <div className="profile-wrapper" ref={dropRef}>
            <FaUserCircle size={28} className="profile-icon" onClick={() => setDropOpen(!dropOpen)} />

            {dropOpen && (
              <div className="dropdown">
                {/* Username + role badge */}
                <p className="username">
                  👋 {user.name}
                  {user.isAdmin && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: "#f59e0b", fontWeight: 700,
                      background: "rgba(245,158,11,.15)", padding: "2px 6px", borderRadius: 4 }}>
                      ADMIN
                    </span>
                  )}
                  {user.role === "guardian" && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: "#06b6d4", fontWeight: 700,
                      background: "rgba(6,182,212,.15)", padding: "2px 6px", borderRadius: 4 }}>
                      GUARDIAN
                    </span>
                  )}
                </p>

               

                {/* Profile — shows correct page based on role */}
                <Link to={profileRoute} onClick={() => setDropOpen(false)}>
                  {profileLabel}
                </Link>

               
                {/* Admin panel */}
                {user.isAdmin && (
                  <Link to="/admin" onClick={() => setDropOpen(false)} style={{ color: "#f59e0b" }}>
                    ⚙ Admin Panel
                  </Link>
                )}

                <button className="logout" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;