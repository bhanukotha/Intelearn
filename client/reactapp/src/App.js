import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider }    from "./context/AuthContext";
import Navbar              from "./components/Navbar";
import PrivateRoute        from "./routes/PrivateRoute";
import Home                from "./pages/Home";
import Login               from "./pages/auth/Login";
import Signup              from "./pages/auth/Signup";
import Practice            from "./pages/Practice";
import ProblemDetail       from "./pages/ProblemDetail";
import Contest             from "./pages/Contest";
import Compiler            from "./pages/Compiler";
import Courses             from "./pages/Courses";
import CourseDetail        from "./pages/CourseDetail";
import Discuss             from "./pages/Discuss";
import Profile             from "./pages/profile";
import GuardianProfile     from "./pages/GuardianProfile";
import AdminPanel          from "./pages/AdminPanel";

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Home */}
        <Route path="/"     element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />

        {/* Student routes */}
        <Route path="/practice"          element={<PrivateRoute roles={["student"]}><Practice /></PrivateRoute>} />
        <Route path="/practice/:id"      element={<PrivateRoute roles={["student"]}><ProblemDetail /></PrivateRoute>} />
        <Route path="/contest"           element={<PrivateRoute roles={["student"]}><Contest /></PrivateRoute>} />
        <Route path="/compiler"          element={<PrivateRoute roles={["student"]}><Compiler /></PrivateRoute>} />
        <Route path="/courses"           element={<PrivateRoute roles={["student"]}><Courses /></PrivateRoute>} />
        <Route path="/courses/:courseId" element={<PrivateRoute roles={["student"]}><CourseDetail /></PrivateRoute>} />
        <Route path="/discuss"           element={<PrivateRoute roles={["student"]}><Discuss /></PrivateRoute>} />

        {/* Student profile */}
        <Route path="/profile" element={<PrivateRoute roles={["student"]}><Profile /></PrivateRoute>} />

        {/* Guardian profile — only for guardian role */}
        <Route path="/guardian" element={<PrivateRoute roles={["guardian"]}><GuardianProfile /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;