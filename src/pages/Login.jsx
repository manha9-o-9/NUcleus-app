const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OrbitLogo from "../OrbitLogo";
import "./Signup.css";

const Login = ({ platformName = "NUcleus" }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  useEffect(() => {
    fetch(`${API}/api/settings`)
      .then((r) => r.json())
      .then((d) => setAdminEmail(d.contact_email || "nucesadmin@gmail.com"));
  }, []);
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.role === "admin") navigate("/admin");
      else if (data.user.role === "society_admin") navigate("/society");
      else navigate("/dashboard");
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };
  const handleForgotCheck = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      setSecurityQuestion(data.security_question);
      setForgotStep(2);
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyAnswer = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password/verify-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          security_answer: securityAnswer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      setForgotStep(3);
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };
  const handleForgotReset = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      setForgotSuccess(true);
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-logo-wrapper">
          <OrbitLogo />
        </div>
        <h1 className="platform-title">{platformName.toUpperCase()}</h1>
        <h2 className="auth-title">
          {showForgot ? "RESET PASSWORD" : "LOGIN"}
        </h2>
        {error && (
          <div
            style={{
              background: "rgba(255,80,80,0.15)",
              border: "1px solid rgba(255,80,80,0.4)",
              color: "#ff6b6b",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              fontSize: "0.9rem",
              width: "100%",
            }}
          >
            {error}
          </div>
        )}

        {!showForgot ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <button
              type="submit"
              className="submit-btn"
              style={{ marginTop: "2rem" }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <p className="auth-footer">
              <span
                className="auth-link"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setShowForgot(true);
                  setError("");
                }}
              >
                Forgot Password?
              </span>
            </p>
            <p className="auth-footer">
              Don't have an account?{" "}
              <Link to="/signup" className="auth-link">
                Sign up &rarr;
              </Link>
            </p>
          </form>
        ) : forgotSuccess ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                background: "rgba(189,217,191,0.15)",
                border: "1px solid rgba(189,217,191,0.4)",
                color: "#BDD9BF",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
              }}
            >
              Password reset successfully!
            </div>
            <span
              className="auth-link"
              style={{ cursor: "pointer" }}
              onClick={() => {
                setShowForgot(false);
                setForgotStep(1);
                setForgotSuccess(false);
                setError("");
              }}
            >
              ← Back to Login
            </span>
          </div>
        ) : forgotStep === 1 ? (
          <form className="auth-form" onSubmit={handleForgotCheck}>
            <p
              style={{
                color: "#92898A",
                fontSize: "0.9rem",
                marginBottom: "1.5rem",
              }}
            >
              Enter your registered email address.
            </p>
            <div className="input-group">
              <label htmlFor="forgotEmail">Email Address</label>
              <input
                type="email"
                id="forgotEmail"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => {
                  setForgotEmail(e.target.value);
                  setError("");
                }}
                required
              />
            </div>
            <button
              type="submit"
              className="submit-btn"
              style={{ marginTop: "2rem" }}
              disabled={loading}
            >
              {loading ? "Checking..." : "Continue"}
            </button>
            <p className="auth-footer">
              <span
                className="auth-link"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setShowForgot(false);
                  setError("");
                }}
              >
                ← Back to Login
              </span>
            </p>
          </form>
        ) : forgotStep === 2 ? (
          <form className="auth-form" onSubmit={handleVerifyAnswer}>
            <p
              style={{
                color: "#92898A",
                fontSize: "0.9rem",
                marginBottom: "1.5rem",
              }}
            >
              {securityQuestion}
            </p>
            <div className="input-group">
              <label htmlFor="securityAnswer">Your Answer</label>
              <input
                type="text"
                id="securityAnswer"
                placeholder="Enter your answer"
                value={securityAnswer}
                onChange={(e) => {
                  setSecurityAnswer(e.target.value);
                  setError("");
                }}
                required
              />
            </div>
            <button
              type="submit"
              className="submit-btn"
              style={{ marginTop: "2rem" }}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify Answer"}
            </button>
            <p className="auth-footer">
              <span
                className="auth-link"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setForgotStep(1);
                  setError("");
                }}
              >
                ← Back
              </span>
            </p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleForgotReset}>
            <p
              style={{
                color: "#92898A",
                fontSize: "0.9rem",
                marginBottom: "1.5rem",
              }}
            >
              Set a new password for{" "}
              <strong style={{ color: "#BDD9BF" }}>{forgotEmail}</strong>
            </p>
            <div className="input-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                required
              />
            </div>
            <button
              type="submit"
              className="submit-btn"
              style={{ marginTop: "2rem" }}
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <p className="auth-footer">
              <span
                className="auth-link"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setShowForgot(false);
                  setForgotStep(1);
                  setError("");
                }}
              >
                ← Back to Login
              </span>
            </p>
          </form>
        )}
        <p
          style={{
            textAlign: "center",
            color: "#685369",
            fontSize: ".78rem",
            marginTop: "1rem",
          }}
        >
          Need help? Contact admin at{" "}
          <a href={`mailto:${adminEmail}`} style={{ color: "#BDD9BF" }}>
            {adminEmail || "nucesadmin@gmail.com"}
          </a>
        </p>
      </div>
    </div>
  );
};
export default Login;
