import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token   = localStorage.getItem("authToken");
    const role    = localStorage.getItem("role");
    const name    = localStorage.getItem("name");
    const email   = localStorage.getItem("email");
    const isAdmin = localStorage.getItem("isAdmin") === "true";

    if (token && role) {
      setUser({ token, role, name, email, isAdmin });
    }
  }, []);

  const login = (data) => {
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("role",      data.role);
    localStorage.setItem("name",      data.name);
    localStorage.setItem("email",     data.email   || "");
    localStorage.setItem("isAdmin",   data.isAdmin ? "true" : "false");

    setUser({
      token:   data.token,
      role:    data.role,
      name:    data.name,
      email:   data.email   || "",
      isAdmin: data.isAdmin || false,
    });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};