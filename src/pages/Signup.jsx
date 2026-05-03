const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OrbitLogo from "../OrbitLogo";
import "./Signup.css";

const INTERESTS = [
  { id: "tech", label: "Technical", icon: "💻" },
  { id: "comp", label: "Competitions", icon: "🏆" },
  { id: "career", label: "Career", icon: "💼" },
  { id: "arts", label: "Arts", icon: "🎨" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "social", label: "Social", icon: "🎉" },
  { id: "research", label: "Research", icon: "🔬" },
];

const Signup = ({ platformName = "NUcleus" }) => {
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const toggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    setError("");
  };

  const handleSendOtp = async () => {
    setError("");
    if (!formData.email.toLowerCase().endsWith("@isb.nu.edu.pk")) {
      setError("Only @isb.nu.edu.pk university email addresses are allowed.");
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch(`${API}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to send OTP");
        return;
      }
      setOtpSent(true);
      setOtp("");
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setOtpLoading(true);
    try {
      const res = await fetch(`${API}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp, purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Verification failed");
        return;
      }
      setOtpVerified(true);
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.email.toLowerCase().endsWith("@isb.nu.edu.pk")) {
      setError("Only @isb.nu.edu.pk university email addresses are allowed.");
      return;
    }
    if (!otpVerified) {
      setError(
        "Please verify your email with the OTP before creating an account.",
      );
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          password: formData.password,
          interests: selectedInterests,
          security_question: securityQuestion,
          security_answer: securityAnswer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Signup failed");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
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
        <h1 className="auth-title">{platformName.toUpperCase()}</h1>
        <h2 className="auth-title">SIGN UP</h2>
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
            }}
          >
            {error}
          </div>
        )}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="rollno@isb.nu.edu.pk"
              value={formData.email}
              onChange={(e) => {
                handleChange(e);
                if (otpSent) {
                  setOtpSent(false);
                  setOtpVerified(false);
                  setOtp("");
                }
              }}
              required
            />
            {/* OTP verification */}
            {!otpVerified && (
              <div style={{ marginTop: "0.5rem" }}>
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading || !formData.email}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      color: "#ccc",
                      padding: "0.4rem 0.9rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {otpLoading ? "Sending…" : "Send Verification Code"}
                  </button>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value);
                        setError("");
                      }}
                      style={{
                        background: "#1e1e2e",
                        border: "1px solid #555",
                        borderRadius: "6px",
                        padding: "0.5rem 0.7rem",
                        color: "#fff",
                        width: "150px",
                        fontSize: "0.9rem",
                        letterSpacing: "4px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading || otp.length !== 6}
                      style={{
                        background: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        color: "#fff",
                        padding: "0.4rem 0.9rem",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.78rem",
                      }}
                    >
                      {otpLoading ? "Verifying…" : "Verify"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "rgba(255,255,255,0.4)",
                        cursor: "pointer",
                        fontSize: "0.72rem",
                        textDecoration: "underline",
                        padding: 0,
                      }}
                    >
                      Resend
                    </button>
                  </div>
                )}
              </div>
            )}
            {otpVerified && (
              <div
                style={{
                  marginTop: "0.4rem",
                  color: "#4caf82",
                  fontSize: "0.8rem",
                }}
              >
                ✓ Email verified
              </div>
            )}
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="securityQuestion">Security Question</label>
            <select
              id="securityQuestion"
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                background: "#1e1e2e",
                color: "#fff",
                border: "1px solid #444",
              }}
            >
              <option value="">Select a question</option>
              <option value="What was the name of your first pet?">
                What was the name of your first pet?
              </option>
              <option value="What is your mother's maiden name?">
                What is your mother's maiden name?
              </option>
              <option value="What was the name of your first school?">
                What was the name of your first school?
              </option>
              <option value="What is your favourite childhood movie?">
                What is your favourite childhood movie?
              </option>
              <option value="What city were you born in?">
                What city were you born in?
              </option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="securityAnswer">Answer</label>
            <input
              type="text"
              id="securityAnswer"
              placeholder="Your answer"
              value={securityAnswer}
              onChange={(e) => {
                setSecurityAnswer(e.target.value);
                setError("");
              }}
              required
            />
          </div>
          <div className="interests-section">
            <label>
              Your Interests{" "}
              <span className="sub-label">(select all that apply)</span>
            </label>
            <div className="pills-container">
              {INTERESTS.map((interest) => (
                <button
                  key={interest.id}
                  type="button"
                  className={`interest-pill ${selectedInterests.includes(interest.id) ? "active" : ""}`}
                  onClick={() => toggleInterest(interest.id)}
                >
                  <span className="pill-icon">{interest.icon}</span>
                  {interest.label}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in &rarr;
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
