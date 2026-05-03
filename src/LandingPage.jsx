const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrbitLogo from "./OrbitLogo";
import TypewriterText from "./TypewriterText";
import "./LandingPage.css";

const INTERESTS = [
  { id: "tech", label: "Technical", icon: "💻" },
  { id: "comp", label: "Competitions", icon: "🏆" },
  { id: "career", label: "Career", icon: "💼" },
  { id: "arts", label: "Arts", icon: "🎨" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "social", label: "Social", icon: "🎉" },
  { id: "research", label: "Research", icon: "🔬" },
];

function LandingPage({ platformName = "NUcleus" }) {
  const navigate = useNavigate();

  // transition state
  const [transitioned, setTransitioned] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // login state
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  // Add these state variables at the top with the other login states:
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSecurityQuestion, setForgotSecurityQuestion] = useState("");
  const [forgotSecurityAnswer, setForgotSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  // signup state
  const [showSocietyReg, setShowSocietyReg] = useState(false);
  const [societyForm, setSocietyForm] = useState({
    name: "",
    description: "",
    contact_name: "",
    email: "",
    mission: "",
    vision: "",
    focus_areas: "",
  });
  const [societyMsg, setSocietyMsg] = useState("");
  const [societyLoading, setSocietyLoading] = useState(false);

  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSecurityQuestion, setSignupSecurityQuestion] = useState("");
  const [signupSecurityAnswer, setSignupSecurityAnswer] = useState("");

  // OTP state for signup
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [signupOtpVerified, setSignupOtpVerified] = useState(false);
  const [signupOtp, setSignupOtp] = useState("");
  const [signupOtpLoading, setSignupOtpLoading] = useState(false);

  // OTP state for society registration
  const [societyOtpSent, setSocietyOtpSent] = useState(false);
  const [societyOtpVerified, setSocietyOtpVerified] = useState(false);
  const [societyOtp, setSocietyOtp] = useState("");
  const [societyOtpLoading, setSocietyOtpLoading] = useState(false);

  const introText =
    "Your campus, fully explored. Discover events, follow societies, and never miss what matters.";

  const handleTypewriterComplete = () => {
    setTransitioned(true);
  };

  const toggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleLoginChange = (e) => {
    setLoginData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    setLoginError("");
  };

  const handleSignupChange = (e) => {
    setSignupData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    setSignupError("");
  };

  const handleInputFocus = (e) => {
    e.target.style.borderColor = "rgba(189,217,191,.4)";
  };
  const handleInputBlur = (e) => {
    e.target.style.borderColor = "rgba(189,217,191,.15)";
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.message || "Login failed");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.role === "admin") navigate("/admin");
      else if (data.user.role === "society_admin") navigate("/society");
      else navigate("/dashboard");
    } catch {
      setLoginError(
        "Cannot connect to server. Make sure the backend is running.",
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleForgotCheck = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.message);
        return;
      }
      setForgotSecurityQuestion(data.security_question);
      setForgotStep(2);
    } catch {
      setLoginError("Cannot connect to server.");
    } finally {
      setLoginLoading(false);
    }
  };
  const handleVerifyAnswer = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password/verify-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          security_answer: forgotSecurityAnswer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.message);
        return;
      }
      setForgotStep(3);
    } catch {
      setLoginError("Cannot connect to server.");
    } finally {
      setLoginLoading(false);
    }
  };
  const handleForgotReset = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (newPassword !== confirmPassword) {
      setLoginError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setLoginError("Password must be at least 6 characters");
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          newPassword,
          security_answer: forgotSecurityAnswer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.message);
        return;
      }
      setForgotSuccess(true);
    } catch {
      setLoginError("Cannot connect to server.");
    } finally {
      setLoginLoading(false);
    }
  };
  const handleSignupSendOtp = async () => {
    setSignupError("");
    if (!signupData.email.toLowerCase().endsWith("@isb.nu.edu.pk")) {
      setSignupError("Only @isb.nu.edu.pk email addresses are allowed.");
      return;
    }
    setSignupOtpLoading(true);
    try {
      const res = await fetch(`${API}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signupData.email, purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSignupError(data.message || "Failed to send OTP");
        return;
      }
      setSignupOtpSent(true);
      setSignupOtp("");
    } catch {
      setSignupError("Cannot connect to server.");
    } finally {
      setSignupOtpLoading(false);
    }
  };

  const handleSignupVerifyOtp = async () => {
    setSignupError("");
    setSignupOtpLoading(true);
    try {
      const res = await fetch(`${API}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupData.email,
          otp: signupOtp,
          purpose: "signup",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSignupError(data.message || "Verification failed");
        return;
      }
      setSignupOtpVerified(true);
    } catch {
      setSignupError("Cannot connect to server.");
    } finally {
      setSignupOtpLoading(false);
    }
  };

  const handleSocietySendOtp = async () => {
    setSocietyMsg("");
    const email = societyForm.email;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSocietyMsg("❌ Please enter a valid email address first.");
      return;
    }
    setSocietyOtpLoading(true);
    try {
      const res = await fetch(`${API}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "society_reg" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSocietyMsg(`❌ ${data.message || "Failed to send OTP"}`);
        return;
      }
      setSocietyOtpSent(true);
      setSocietyOtp("");
    } catch {
      setSocietyMsg("❌ Cannot connect to server.");
    } finally {
      setSocietyOtpLoading(false);
    }
  };

  const handleSocietyVerifyOtp = async () => {
    setSocietyMsg("");
    setSocietyOtpLoading(true);
    try {
      const res = await fetch(`${API}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: societyForm.email,
          otp: societyOtp,
          purpose: "society_reg",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSocietyMsg(`❌ ${data.message || "Verification failed"}`);
        return;
      }
      setSocietyOtpVerified(true);
      setSocietyMsg("✅ Email verified!");
    } catch {
      setSocietyMsg("❌ Cannot connect to server.");
    } finally {
      setSocietyOtpLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError("");
    if (!signupData.email.toLowerCase().endsWith("@isb.nu.edu.pk")) {
      setSignupError(
        "Only @isb.nu.edu.pk university email addresses are allowed.",
      );
      return;
    }
    if (!signupOtpVerified) {
      setSignupError(
        "Please verify your email with the OTP before creating an account.",
      );
      return;
    }
    if (signupData.password.length < 6) {
      setSignupError("Password must be at least 6 characters.");
      return;
    }
    setSignupLoading(true);
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: signupData.fullName,
          email: signupData.email,
          password: signupData.password,
          interests: selectedInterests,
          security_question: signupSecurityQuestion,
          security_answer: signupSecurityAnswer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSignupError(data.message || "Signup failed");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch {
      setSignupError(
        "Cannot connect to server. Make sure the backend is running.",
      );
    } finally {
      setSignupLoading(false);
    }
  };

  const inputStyle = {
    background: "rgba(12,24,33,.5)",
    border: "1px solid rgba(189,217,191,.15)",
    borderRadius: "8px",
    padding: ".75rem 1.05rem",
    color: "#fff",
    width: "100%",
    fontFamily: "Nova Square, sans-serif",
    fontSize: ".95rem",
    boxSizing: "border-box",
    outline: "none",
    transition: "border .2s",
  };

  const labelStyle = {
    color: "#BDD9BF",
    fontSize: ".8rem",
    display: "block",
    marginBottom: ".3rem",
    letterSpacing: "1px",
    opacity: 0.78,
  };

  return (
    <div
      className="landing-page"
      style={{ overflow: "hidden", position: "relative" }}
    >
      {/* Landing panel — shrinks to left half on transition */}
      <div
        className="landing-left-panel"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: transitioned ? "50%" : "100%",
          transition: "width .85s cubic-bezier(.4,0,.2,1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          zIndex: 2,
          overflow: "hidden",
        }}
      >
        <OrbitLogo />
        <div style={{ textAlign: "center", marginBottom: ".5rem" }}>
          <h1
            style={{
              fontFamily: "Aldrich, sans-serif",
              fontSize: "2.5rem",
              color: "#BDD9BF",
              letterSpacing: "6px",
              margin: "0 0 .25rem",
              textShadow: "2px 3px 8px rgba(0,0,0,.4)",
            }}
          >
            {platformName.toUpperCase()}
          </h1>
          <p
            style={{
              fontFamily: "Nova Square, sans-serif",
              fontSize: ".75rem",
              color: "rgba(189,217,191,.5)",
              letterSpacing: "3px",
              margin: 0,
            }}
          >
            CAMPUS DISCOVERY PLATFORM
          </p>
        </div>
        <div className="text-container">
          <TypewriterText
            text={introText}
            delay={35}
            onComplete={handleTypewriterComplete}
          />
        </div>
      </div>

      {/* Auth panel — slides in from right */}
      <div
        className="landing-auth-panel"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "50%",
          right: transitioned ? "0" : "-50%",
          transition: "right .85s cubic-bezier(.4,0,.2,1)",
          background:
            "linear-gradient(135deg, #1a1a2e 0%, #2E4052 50%, #3d2a3d 100%)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        {/* Scrollable form area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.75rem 2rem 1.5rem",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(189,217,191,.2) transparent",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              maxWidth: "420px",
              margin: "0 auto",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: "1rem" }}>
              <p
                style={{
                  margin: "0 0 .25rem",
                  color: "#92898A",
                  fontSize: "12px",
                  letterSpacing: "3px",
                  fontFamily: "Aldrich, sans-serif",
                  opacity: 0.6,
                }}
              >
                {platformName.toUpperCase()} PLATFORM
              </p>
              <h2
                style={{
                  margin: "0 0 .5rem",
                  fontFamily: "Aldrich, sans-serif",
                  color: "#BDD9BF",
                  fontSize: "1.85rem",
                  letterSpacing: "1px",
                }}
              >
                {activeTab === "login" ? "Welcome Back" : "Welcome"}
              </h2>
            </div>

            {/* Tab toggle */}
            <div
              style={{
                display: "flex",
                gap: 0,
                marginBottom: "1rem",
                background:
                  "linear-gradient(135deg, rgba(189,217,191,.18) 0%, rgba(189,217,191,.08) 100%)",
                borderRadius: "8px",
                padding: "5px",
                border: "1px solid rgba(189,217,191,.35)",
              }}
            >
              {["login", "signup"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: ".5rem",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Aldrich, sans-serif",
                    fontSize: ".82rem",
                    letterSpacing: "1px",
                    transition: "all .2s",
                    background:
                      activeTab === tab
                        ? "linear-gradient(135deg, rgba(189,217,191,.55) 0%, rgba(189,217,191,.32) 100%)"
                        : "transparent",
                    color:
                      activeTab === tab ? "#E9F7F0" : "rgba(189,217,191,.7)",
                  }}
                >
                  {tab === "login" ? "LOGIN" : "SIGN UP"}
                </button>
              ))}
            </div>

            {/* LOGIN FORM */}
            {activeTab === "login" &&
              (!showForgot ? (
                <form
                  onSubmit={handleLoginSubmit}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: ".85rem",
                  }}
                >
                  {loginError && (
                    <div
                      style={{
                        background: "rgba(255,80,80,.15)",
                        border: "1px solid rgba(255,80,80,.4)",
                        color: "#ff6b6b",
                        padding: ".7rem .9rem",
                        borderRadius: "8px",
                        fontSize: ".85rem",
                      }}
                    >
                      {loginError}
                    </div>
                  )}
                  <div>
                    <label htmlFor="email" style={labelStyle}>
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      id="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      required
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" style={labelStyle}>
                      PASSWORD
                    </label>
                    <input
                      type="password"
                      id="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      required
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </div>
                  <p style={{ textAlign: "right", margin: "-.4rem 0 .2rem" }}>
                    <span
                      onClick={() => {
                        setShowForgot(true);
                        setLoginError("");
                      }}
                      style={{
                        color: "rgba(189,217,191,.4)",
                        fontSize: ".72rem",
                        cursor: "pointer",
                        fontFamily: "Nova Square, sans-serif",
                      }}
                      onMouseEnter={(e) => (e.target.style.color = "#BDD9BF")}
                      onMouseLeave={(e) =>
                        (e.target.style.color = "rgba(189,217,191,.4)")
                      }
                    >
                      Forgot password?
                    </span>
                  </p>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, rgba(189,217,191,.7) 0%, rgba(189,217,191,.45) 100%)";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(135deg, rgba(189,217,191,.55) 0%, rgba(189,217,191,.32) 100%)";
                      e.currentTarget.style.color = "#F3FFF8";
                    }}
                    style={{
                      width: "100%",
                      background:
                        "linear-gradient(135deg, rgba(189,217,191,.55) 0%, rgba(189,217,191,.32) 100%)",
                      border: "1px solid rgba(189,217,191,.65)",
                      color: "#F3FFF8",
                      padding: ".85rem",
                      borderRadius: "10px",
                      cursor: loginLoading ? "not-allowed" : "pointer",
                      fontFamily: "Aldrich, sans-serif",
                      fontSize: ".98rem",
                      letterSpacing: "1px",
                      marginTop: ".25rem",
                      transition: "all .2s",
                    }}
                  >
                    {loginLoading ? "Signing in..." : "SIGN IN"}
                  </button>
                  <p
                    style={{
                      color: "rgba(189,217,191,.35)",
                      fontSize: ".78rem",
                      textAlign: "center",
                      margin: 0,
                    }}
                  >
                    No account?{" "}
                    <span
                      onClick={() => setActiveTab("signup")}
                      style={{
                        color: "#BDD9BF",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Sign up →
                    </span>
                  </p>
                </form>
              ) : forgotSuccess ? (
                <div style={{ textAlign: "center" }}>
                  {loginError && (
                    <div
                      style={{
                        background: "rgba(255,80,80,.15)",
                        border: "1px solid rgba(255,80,80,.4)",
                        color: "#ff6b6b",
                        padding: ".7rem .9rem",
                        borderRadius: "8px",
                        fontSize: ".85rem",
                        marginBottom: ".75rem",
                      }}
                    >
                      {loginError}
                    </div>
                  )}
                  <div
                    style={{
                      background: "rgba(189,217,191,.15)",
                      border: "1px solid rgba(189,217,191,.4)",
                      color: "#BDD9BF",
                      padding: ".75rem 1rem",
                      borderRadius: "8px",
                      marginBottom: "1.5rem",
                      fontSize: ".9rem",
                    }}
                  >
                    Password reset successfully!
                  </div>
                  <span
                    onClick={() => {
                      setShowForgot(false);
                      setForgotStep(1);
                      setForgotSuccess(false);
                      setLoginError("");
                    }}
                    style={{
                      color: "#BDD9BF",
                      cursor: "pointer",
                      fontSize: ".85rem",
                    }}
                  >
                    ← Back to Login
                  </span>
                </div>
              ) : forgotStep === 1 ? (
                <form
                  onSubmit={handleForgotCheck}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: ".85rem",
                  }}
                >
                  {loginError && (
                    <div
                      style={{
                        background: "rgba(255,80,80,.15)",
                        border: "1px solid rgba(255,80,80,.4)",
                        color: "#ff6b6b",
                        padding: ".7rem .9rem",
                        borderRadius: "8px",
                        fontSize: ".85rem",
                      }}
                    >
                      {loginError}
                    </div>
                  )}
                  <p
                    style={{ color: "#92898A", fontSize: ".85rem", margin: 0 }}
                  >
                    Enter your registered email address.
                  </p>
                  <div>
                    <label style={labelStyle}>EMAIL ADDRESS</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        setLoginError("");
                      }}
                      required
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    style={{
                      width: "100%",
                      background:
                        "linear-gradient(135deg, rgba(189,217,191,.55) 0%, rgba(189,217,191,.32) 100%)",
                      border: "1px solid rgba(189,217,191,.65)",
                      color: "#F3FFF8",
                      padding: ".85rem",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontFamily: "Aldrich, sans-serif",
                      fontSize: ".98rem",
                      letterSpacing: "1px",
                      transition: "all .2s",
                    }}
                  >
                    {loginLoading ? "Checking..." : "CONTINUE"}
                  </button>
                  <span
                    onClick={() => {
                      setShowForgot(false);
                      setLoginError("");
                    }}
                    style={{
                      color: "#BDD9BF",
                      cursor: "pointer",
                      fontSize: ".85rem",
                      textAlign: "center",
                    }}
                  >
                    ← Back to Login
                  </span>
                </form>
              ) : forgotStep === 2 ? (
                <form
                  onSubmit={handleVerifyAnswer}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: ".85rem",
                  }}
                >
                  {loginError && (
                    <div
                      style={{
                        background: "rgba(255,80,80,.15)",
                        border: "1px solid rgba(255,80,80,.4)",
                        color: "#ff6b6b",
                        padding: ".7rem .9rem",
                        borderRadius: "8px",
                        fontSize: ".85rem",
                      }}
                    >
                      {loginError}
                    </div>
                  )}
                  <p
                    style={{ color: "#92898A", fontSize: ".85rem", margin: 0 }}
                  >
                    {forgotSecurityQuestion}
                  </p>
                  <div>
                    <label style={labelStyle}>YOUR ANSWER</label>
                    <input
                      type="text"
                      placeholder="Enter your answer"
                      value={forgotSecurityAnswer}
                      onChange={(e) => {
                        setForgotSecurityAnswer(e.target.value);
                        setLoginError("");
                      }}
                      required
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    style={{
                      width: "100%",
                      background:
                        "linear-gradient(135deg, rgba(189,217,191,.55) 0%, rgba(189,217,191,.32) 100%)",
                      border: "1px solid rgba(189,217,191,.65)",
                      color: "#F3FFF8",
                      padding: ".85rem",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontFamily: "Aldrich, sans-serif",
                      fontSize: ".98rem",
                      letterSpacing: "1px",
                      transition: "all .2s",
                    }}
                  >
                    {loginLoading ? "Verifying..." : "VERIFY ANSWER"}
                  </button>
                  <span
                    onClick={() => {
                      setForgotStep(1);
                      setLoginError("");
                    }}
                    style={{
                      color: "#BDD9BF",
                      cursor: "pointer",
                      fontSize: ".85rem",
                      textAlign: "center",
                    }}
                  >
                    ← Back
                  </span>
                </form>
              ) : (
                <form
                  onSubmit={handleForgotReset}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: ".85rem",
                  }}
                >
                  {loginError && (
                    <div
                      style={{
                        background: "rgba(255,80,80,.15)",
                        border: "1px solid rgba(255,80,80,.4)",
                        color: "#ff6b6b",
                        padding: ".7rem .9rem",
                        borderRadius: "8px",
                        fontSize: ".85rem",
                      }}
                    >
                      {loginError}
                    </div>
                  )}
                  <p
                    style={{ color: "#92898A", fontSize: ".85rem", margin: 0 }}
                  >
                    Set a new password for{" "}
                    <strong style={{ color: "#BDD9BF" }}>{forgotEmail}</strong>
                  </p>
                  <div>
                    <label style={labelStyle}>NEW PASSWORD</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setLoginError("");
                      }}
                      required
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>CONFIRM PASSWORD</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setLoginError("");
                      }}
                      required
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    style={{
                      width: "100%",
                      background:
                        "linear-gradient(135deg, rgba(189,217,191,.55) 0%, rgba(189,217,191,.32) 100%)",
                      border: "1px solid rgba(189,217,191,.65)",
                      color: "#F3FFF8",
                      padding: ".85rem",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontFamily: "Aldrich, sans-serif",
                      fontSize: ".98rem",
                      letterSpacing: "1px",
                      transition: "all .2s",
                    }}
                  >
                    {loginLoading ? "Resetting..." : "RESET PASSWORD"}
                  </button>
                  <span
                    onClick={() => {
                      setShowForgot(false);
                      setForgotStep(1);
                      setLoginError("");
                    }}
                    style={{
                      color: "#BDD9BF",
                      cursor: "pointer",
                      fontSize: ".85rem",
                      textAlign: "center",
                    }}
                  >
                    ← Back to Login
                  </span>
                </form>
              ))}

            {/* SIGNUP FORM */}
            {activeTab === "signup" && (
              <form
                onSubmit={handleSignupSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: ".8rem",
                }}
              >
                {signupError && (
                  <div
                    style={{
                      background: "rgba(255,80,80,.15)",
                      border: "1px solid rgba(255,80,80,.4)",
                      color: "#ff6b6b",
                      padding: ".7rem .9rem",
                      borderRadius: "8px",
                      fontSize: ".85rem",
                    }}
                  >
                    {signupError}
                  </div>
                )}
                <div>
                  <label htmlFor="fullName" style={labelStyle}>
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    placeholder="Enter your full name"
                    value={signupData.fullName}
                    onChange={handleSignupChange}
                    required
                    style={inputStyle}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
                <div>
                  <label htmlFor="email" style={labelStyle}>
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="rollno@isb.nu.edu.pk"
                    value={signupData.email}
                    onChange={(e) => {
                      handleSignupChange(e);
                      // Reset OTP state if email changes
                      if (signupOtpSent) {
                        setSignupOtpSent(false);
                        setSignupOtpVerified(false);
                        setSignupOtp("");
                      }
                    }}
                    required
                    style={inputStyle}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                  {/* OTP verification UI */}
                  {!signupOtpVerified && (
                    <div style={{ marginTop: "0.5rem" }}>
                      {!signupOtpSent ? (
                        <button
                          type="button"
                          onClick={handleSignupSendOtp}
                          disabled={signupOtpLoading || !signupData.email}
                          style={{
                            background: "rgba(189,217,191,0.15)",
                            border: "1px solid rgba(189,217,191,0.4)",
                            color: "#BDD9BF",
                            padding: "0.4rem 0.9rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.78rem",
                            letterSpacing: "1px",
                          }}
                        >
                          {signupOtpLoading
                            ? "Sending…"
                            : "Send Verification Code"}
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
                            value={signupOtp}
                            onChange={(e) => {
                              setSignupOtp(e.target.value);
                              setSignupError("");
                            }}
                            style={{
                              ...inputStyle,
                              width: "140px",
                              fontSize: "0.9rem",
                              letterSpacing: "4px",
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleSignupVerifyOtp}
                            disabled={
                              signupOtpLoading || signupOtp.length !== 6
                            }
                            style={{
                              background: "rgba(189,217,191,0.25)",
                              border: "1px solid rgba(189,217,191,0.5)",
                              color: "#BDD9BF",
                              padding: "0.4rem 0.9rem",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                            }}
                          >
                            {signupOtpLoading ? "Verifying…" : "Verify"}
                          </button>
                          <button
                            type="button"
                            onClick={handleSignupSendOtp}
                            disabled={signupOtpLoading}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "rgba(189,217,191,0.5)",
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
                  {signupOtpVerified && (
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
                <div>
                  <label htmlFor="password" style={labelStyle}>
                    PASSWORD{" "}
                    <span
                      style={{
                        color: "rgba(189,217,191,.35)",
                        fontSize: ".65rem",
                      }}
                    >
                      (min. 6 characters)
                    </span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    placeholder="Create a password"
                    value={signupData.password}
                    onChange={handleSignupChange}
                    required
                    style={inputStyle}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
                <div>
                  <label style={labelStyle}>SECURITY QUESTION</label>
                  <select
                    value={signupSecurityQuestion}
                    onChange={(e) => {
                      setSignupSecurityQuestion(e.target.value);
                      setSignupError("");
                    }}
                    required
                    style={{ ...inputStyle, cursor: "pointer" }}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
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
                <div>
                  <label style={labelStyle}>SECURITY ANSWER</label>
                  <input
                    type="text"
                    placeholder="Your answer"
                    value={signupSecurityAnswer}
                    onChange={(e) => {
                      setSignupSecurityAnswer(e.target.value);
                      setSignupError("");
                    }}
                    required
                    style={inputStyle}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, marginBottom: ".5rem" }}>
                    YOUR INTERESTS{" "}
                    <span
                      style={{
                        color: "rgba(189,217,191,.35)",
                        fontSize: ".65rem",
                      }}
                    >
                      (select all that apply)
                    </span>
                  </label>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}
                  >
                    {INTERESTS.map((interest) => {
                      const active = selectedInterests.includes(interest.id);
                      return (
                        <button
                          key={interest.id}
                          type="button"
                          onClick={() => toggleInterest(interest.id)}
                          style={{
                            padding: ".2rem .55rem",
                            borderRadius: "20px",
                            cursor: "pointer",
                            fontFamily: "Nova Square, sans-serif",
                            fontSize: ".7rem",
                            transition: "all .2s",
                            background: active ? "#16425B" : "transparent",
                            border: `1px solid ${active ? "#BDD9BF" : "#2E4052"}`,
                            color: active ? "#BDD9BF" : "#92898A",
                            display: "flex",
                            alignItems: "center",
                            gap: ".35rem",
                          }}
                        >
                          <span>{interest.icon}</span>
                          {interest.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={signupLoading}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(189,217,191,.7) 0%, rgba(189,217,191,.45) 100%)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(189,217,191,.55) 0%, rgba(189,217,191,.32) 100%)";
                    e.currentTarget.style.color = "#F3FFF8";
                  }}
                  style={{
                    width: "100%",
                    background:
                      "linear-gradient(135deg, rgba(189,217,191,.55) 0%, rgba(189,217,191,.32) 100%)",
                    border: "1px solid rgba(189,217,191,.65)",
                    color: "#F3FFF8",
                    padding: ".85rem",
                    borderRadius: "10px",
                    cursor: signupLoading ? "not-allowed" : "pointer",
                    fontFamily: "Aldrich, sans-serif",
                    fontSize: ".98rem",
                    letterSpacing: "1px",
                    transition: "all .2s",
                  }}
                >
                  {signupLoading ? "Creating account..." : "CREATE ACCOUNT"}
                </button>
                <p
                  style={{
                    color: "rgba(189,217,191,.35)",
                    fontSize: ".78rem",
                    textAlign: "center",
                    margin: 0,
                  }}
                >
                  Have an account?{" "}
                  <span
                    onClick={() => setActiveTab("login")}
                    style={{
                      color: "#BDD9BF",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Sign in →
                  </span>
                </p>
              </form>
            )}
            <p
              style={{
                textAlign: "center",
                marginTop: "1rem",
                color: "#92898A",
                fontSize: ".85rem",
              }}
            >
              Want to start a society?{" "}
              <span
                onClick={() => setShowSocietyReg(true)}
                style={{
                  color: "#BDD9BF",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Register your society →
              </span>
            </p>
          </div>
        </div>
      </div>
      {showSocietyReg && (
        <div
          onClick={() => setShowSocietyReg(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="society-modal"
            style={{
              background: "linear-gradient(135deg,#0c1821,#16425B)",
              border: "1px solid rgba(189,217,191,.2)",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
            }}
          >
            <h2
              style={{
                margin: "0 0 1.5rem",
                fontFamily: "Aldrich,sans-serif",
                color: "#BDD9BF",
                fontSize: "1.1rem",
              }}
            >
              REGISTER YOUR SOCIETY
            </h2>
            {societyMsg && (
              <div
                style={{
                  background: societyMsg.startsWith("✅")
                    ? "rgba(76,175,80,.15)"
                    : "rgba(255,80,80,.15)",
                  border: `1px solid ${societyMsg.startsWith("✅") ? "rgba(76,175,80,.4)" : "rgba(255,80,80,.4)"}`,
                  color: societyMsg.startsWith("✅") ? "#81c784" : "#ff6b6b",
                  padding: ".75rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  fontSize: ".88rem",
                }}
              >
                {societyMsg}
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: ".85rem",
              }}
            >
              {[
                ["Society Name", "name", "e.g. FAST Computing Society"],
                ["Your Full Name", "contact_name", "Society representative"],
                ["Mission", "mission", "What drives your society?"],
                [
                  "Vision",
                  "vision",
                  "Where do you see your society in 5 years?",
                ],
                [
                  "Focus Areas",
                  "focus_areas",
                  "e.g. AI, Robotics, Web Dev (comma separated)",
                ],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <label
                    style={{
                      color: "#BDD9BF",
                      fontSize: ".75rem",
                      display: "block",
                      marginBottom: ".35rem",
                      letterSpacing: "1px",
                      opacity: 0.8,
                    }}
                  >
                    {label.toUpperCase()}
                  </label>
                  <input
                    value={societyForm[key]}
                    onChange={(e) =>
                      setSocietyForm((p) => ({ ...p, [key]: e.target.value }))
                    }
                    placeholder={placeholder}
                    required
                    style={{
                      background: "rgba(5,15,25,.6)",
                      border: "1px solid rgba(189,217,191,.2)",
                      borderRadius: "8px",
                      padding: ".65rem .9rem",
                      color: "#fff",
                      width: "100%",
                      fontFamily: "Nova Square,sans-serif",
                      fontSize: ".85rem",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>
              ))}
              {/* Contact Email with OTP verification */}
              <div>
                <label
                  style={{
                    color: "#BDD9BF",
                    fontSize: ".75rem",
                    display: "block",
                    marginBottom: ".35rem",
                    letterSpacing: "1px",
                    opacity: 0.8,
                  }}
                >
                  CONTACT EMAIL
                </label>
                <input
                  type="email"
                  value={societyForm.email}
                  onChange={(e) => {
                    setSocietyForm((p) => ({ ...p, email: e.target.value }));
                    // Reset OTP if email changes
                    if (societyOtpSent) {
                      setSocietyOtpSent(false);
                      setSocietyOtpVerified(false);
                      setSocietyOtp("");
                    }
                  }}
                  placeholder="Your contact email (will be used as login)"
                  required
                  style={{
                    background: "rgba(5,15,25,.6)",
                    border: "1px solid rgba(189,217,191,.2)",
                    borderRadius: "8px",
                    padding: ".65rem .9rem",
                    color: "#fff",
                    width: "100%",
                    fontFamily: "Nova Square,sans-serif",
                    fontSize: ".85rem",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
                {!societyOtpVerified && (
                  <div style={{ marginTop: "0.5rem" }}>
                    {!societyOtpSent ? (
                      <button
                        type="button"
                        onClick={handleSocietySendOtp}
                        disabled={societyOtpLoading || !societyForm.email}
                        style={{
                          background: "rgba(189,217,191,0.12)",
                          border: "1px solid rgba(189,217,191,0.35)",
                          color: "#BDD9BF",
                          padding: "0.4rem 0.9rem",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          letterSpacing: "1px",
                        }}
                      >
                        {societyOtpLoading
                          ? "Sending…"
                          : "Send Verification Code"}
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
                          value={societyOtp}
                          onChange={(e) => {
                            setSocietyOtp(e.target.value);
                            setSocietyMsg("");
                          }}
                          style={{
                            background: "rgba(5,15,25,.6)",
                            border: "1px solid rgba(189,217,191,.3)",
                            borderRadius: "6px",
                            padding: ".5rem .7rem",
                            color: "#fff",
                            width: "140px",
                            fontSize: ".88rem",
                            letterSpacing: "4px",
                            boxSizing: "border-box",
                            outline: "none",
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleSocietyVerifyOtp}
                          disabled={
                            societyOtpLoading || societyOtp.length !== 6
                          }
                          style={{
                            background: "rgba(189,217,191,0.2)",
                            border: "1px solid rgba(189,217,191,0.45)",
                            color: "#BDD9BF",
                            padding: "0.4rem 0.9rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                          }}
                        >
                          {societyOtpLoading ? "Verifying…" : "Verify"}
                        </button>
                        <button
                          type="button"
                          onClick={handleSocietySendOtp}
                          disabled={societyOtpLoading}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "rgba(189,217,191,0.45)",
                            cursor: "pointer",
                            fontSize: "0.7rem",
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
                {societyOtpVerified && (
                  <div
                    style={{
                      marginTop: "0.4rem",
                      color: "#4caf82",
                      fontSize: "0.78rem",
                    }}
                  >
                    ✓ Email verified
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{
                    color: "#BDD9BF",
                    fontSize: ".75rem",
                    display: "block",
                    marginBottom: ".35rem",
                    letterSpacing: "1px",
                    opacity: 0.8,
                  }}
                >
                  DESCRIPTION
                </label>
                <textarea
                  value={societyForm.description}
                  onChange={(e) =>
                    setSocietyForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of your society..."
                  rows={3}
                  required
                  style={{
                    background: "rgba(5,15,25,.6)",
                    border: "1px solid rgba(189,217,191,.2)",
                    borderRadius: "8px",
                    padding: ".65rem .9rem",
                    color: "#fff",
                    width: "100%",
                    fontFamily: "Nova Square,sans-serif",
                    fontSize: ".85rem",
                    boxSizing: "border-box",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    color: "#BDD9BF",
                    fontSize: ".75rem",
                    display: "block",
                    marginBottom: ".35rem",
                    letterSpacing: "1px",
                    opacity: 0.8,
                  }}
                >
                  SECURITY QUESTION
                </label>
                <select
                  value={societyForm.security_question}
                  onChange={(e) =>
                    setSocietyForm((p) => ({
                      ...p,
                      security_question: e.target.value,
                    }))
                  }
                  required
                  style={{
                    background: "rgba(5,15,25,.6)",
                    border: "1px solid rgba(189,217,191,.2)",
                    borderRadius: "8px",
                    padding: ".65rem .9rem",
                    color: "#fff",
                    width: "100%",
                    fontSize: ".85rem",
                    boxSizing: "border-box",
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
              <div>
                <label
                  style={{
                    color: "#BDD9BF",
                    fontSize: ".75rem",
                    display: "block",
                    marginBottom: ".35rem",
                    letterSpacing: "1px",
                    opacity: 0.8,
                  }}
                >
                  SECURITY ANSWER
                </label>
                <input
                  value={societyForm.security_answer}
                  onChange={(e) =>
                    setSocietyForm((p) => ({
                      ...p,
                      security_answer: e.target.value,
                    }))
                  }
                  placeholder="Your answer"
                  required
                  style={{
                    background: "rgba(5,15,25,.6)",
                    border: "1px solid rgba(189,217,191,.2)",
                    borderRadius: "8px",
                    padding: ".65rem .9rem",
                    color: "#fff",
                    width: "100%",
                    fontSize: ".85rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <button
                onClick={async () => {
                  const {
                    name,
                    contact_name,
                    email,
                    mission,
                    vision,
                    focus_areas,
                    description,
                  } = societyForm;
                  if (
                    !name ||
                    !contact_name ||
                    !email ||
                    !mission ||
                    !vision ||
                    !focus_areas ||
                    !description ||
                    !societyForm.security_question ||
                    !societyForm.security_answer
                  ) {
                    setSocietyMsg("❌ All fields are required.");
                    return;
                  }
                  // Basic email format check on the client side
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    setSocietyMsg("❌ Please enter a valid email address.");
                    return;
                  }
                  if (!societyOtpVerified) {
                    setSocietyMsg(
                      "❌ Please verify your email with the OTP before submitting.",
                    );
                    return;
                  }
                  setSocietyLoading(true);
                  try {
                    const res = await fetch(`${API}/society-registrations`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        ...societyForm,
                        focus_areas: societyForm.focus_areas
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setSocietyMsg(`❌ ${data.message}`);
                      return;
                    }
                    setSocietyMsg(
                      "✅ Registration submitted! The admin will review and contact you via email.",
                    );
                    setSocietyForm({
                      name: "",
                      description: "",
                      contact_name: "",
                      email: "",
                      mission: "",
                      vision: "",
                      focus_areas: "",
                      security_question: "",
                      security_answer: "",
                    });
                    setSocietyOtpSent(false);
                    setSocietyOtpVerified(false);
                    setSocietyOtp("");
                  } catch {
                    setSocietyMsg("❌ Cannot connect to server.");
                  } finally {
                    setSocietyLoading(false);
                  }
                }}
                disabled={societyLoading}
                style={{
                  width: "100%",
                  background:
                    "linear-gradient(135deg,rgba(189,217,191,.55),rgba(189,217,191,.32))",
                  border: "1px solid rgba(189,217,191,.65)",
                  color: "#F3FFF8",
                  padding: ".85rem",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontFamily: "Aldrich,sans-serif",
                  fontSize: ".98rem",
                  letterSpacing: "1px",
                }}
              >
                {societyLoading ? "Submitting..." : "SUBMIT FOR APPROVAL"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
