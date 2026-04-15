import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children, roles }) => {
  const { user } = useContext(AuthContext);

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Role not allowed
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Allowed
  return children;
};

export default PrivateRoute;