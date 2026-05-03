import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import LandingPage from "./LandingPage";
import StudentHome from "./pages/StudentHome";
import AdminDashboard from "./pages/AdminDashboard";
import SocietyDashboard from "./pages/SocietyDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

function App() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch(`${API}/settings`)
      .then((r) => r.json())
      .then((d) => setSettings(d))
      .catch(() =>
        setSettings({ platform_name: "NUcleus", maintenance_mode: false }),
      );
  }, []);

  if (!settings) return null;

  const role = JSON.parse(localStorage.getItem("nucleus_user") || "{}").role;
  const isMaintenance = settings.maintenance_mode && role !== "admin";

  if (isMaintenance)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#0a1628,#0d2137)",
          color: "#BDD9BF",
          fontFamily: "Aldrich,sans-serif",
          textAlign: "center",
          gap: "1rem",
        }}
      >
        <span style={{ fontSize: "3rem" }}>🔧</span>
        <h1 style={{ fontSize: "2rem", margin: 0 }}>
          {settings.platform_name}
        </h1>
        <p style={{ color: "#92898A", fontSize: "1rem" }}>
          Platform is currently under maintenance.
        </p>
        <p style={{ color: "#685369", fontSize: ".85rem" }}>
          Please check back later.
        </p>
      </div>
    );

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<LandingPage platformName={settings.platform_name} />}
        />
        <Route
          path="/login"
          element={<Login platformName={settings.platform_name} />}
        />
        <Route
          path="/signup"
          element={<Signup platformName={settings.platform_name} />}
        />
        <Route path="/dashboard" element={<StudentHome />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/society" element={<SocietyDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
