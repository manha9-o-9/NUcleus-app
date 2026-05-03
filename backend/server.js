const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { initDb } = require("./db");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = "nucleus_secret_key_2026";

app.use(
  cors({
    origin: function (origin, callback) {
      const allowed = process.env.FRONTEND_URL || "http://localhost:5173";
      if (!origin || origin === allowed || origin === allowed + "/") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);
app.use(express.json());

let db;

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

function optionalAuth(req) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function generateCheckInCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function cleanupOldNotifications(userId) {
  db.run(
    `DELETE FROM notifications WHERE id IN (
    SELECT id FROM notifications 
    WHERE user_id=? 
    ORDER BY created_at DESC 
    LIMIT -1 OFFSET 10
  )`,
    [userId],
  );
}

function notify(
  userId,
  type,
  message,
  related_event_id = null,
  related_society_id = null,
) {
  db.insert(
    "INSERT INTO notifications (user_id,type,message,related_event_id,related_society_id,created_at) VALUES (?,?,?,?,?,?)",
    [
      userId,
      type,
      message,
      related_event_id,
      related_society_id,
      new Date(Date.now() + 5 * 60 * 60 * 1000)
        .toISOString()
        .replace("T", " ")
        .slice(0, 19),
    ],
  );
  cleanupOldNotifications(userId);
}

// ── OTP STORE (in-memory, expires in 10 min) ──────────────────────────────────
const otpStore = {};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/send-otp
app.post("/api/auth/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ message: "Invalid email format" });

  const otp = generateOtp();
  otpStore[email.toLowerCase()] = {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  };

  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      tls: { rejectUnauthorized: false },
    });
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "NUcleus — Your Verification Code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0c1821;color:#BDD9BF;padding:2rem;border-radius:12px;">
          <h2 style="color:#BDD9BF;margin:0 0 1rem;">NUcleus Email Verification</h2>
          <p style="color:#92898A;margin:0 0 1.5rem;">Use the code below to verify your email address. It expires in <strong style="color:#BDD9BF;">10 minutes</strong>.</p>
          <div style="background:#16425B;border-radius:10px;padding:1.5rem;text-align:center;letter-spacing:8px;font-size:2rem;font-weight:bold;color:#fff;margin-bottom:1.5rem;">
            ${otp}
          </div>
          <p style="color:#685369;font-size:.82rem;margin:0;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    res.json({ message: "OTP sent successfully" });
  } catch (e) {
    console.error("OTP email error:", e.message);
    // Remove from store so user can retry
    delete otpStore[email.toLowerCase()];
    res.status(500).json({
      message:
        "Failed to send OTP email. Please check the email address and try again.",
    });
  }
});

// POST /api/auth/verify-otp
app.post("/api/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP are required" });

  const record = otpStore[email.toLowerCase()];
  if (!record)
    return res.status(400).json({
      message: "No OTP found for this email. Please request a new one.",
    });

  if (Date.now() > record.expiresAt) {
    delete otpStore[email.toLowerCase()];
    return res
      .status(400)
      .json({ message: "OTP has expired. Please request a new one." });
  }

  if (record.otp !== otp.toString().trim())
    return res
      .status(400)
      .json({ message: "Incorrect OTP. Please try again." });

  // Valid — remove from store (single use)
  delete otpStore[email.toLowerCase()];
  res.json({ message: "Email verified successfully" });
});

app.post("/api/auth/signup", (req, res) => {
  const { full_name, email, password, interests } = req.body;
  if (!full_name || !email || !password)
    return res
      .status(400)
      .json({ message: "Name, email and password are required" });
  if (db.get("SELECT id FROM users WHERE email = ?", [email]))
    return res
      .status(409)
      .json({ message: "Account already exists with this email" });
  const hashed = bcrypt.hashSync(password, 10);
  const { security_question, security_answer } = req.body;
  if (!security_question || !security_answer)
    return res
      .status(400)
      .json({ message: "Security question and answer are required" });
  const hashedAnswer = bcrypt.hashSync(
    security_answer.toLowerCase().trim(),
    10,
  );
  const id = db.insert(
    "INSERT INTO users (full_name,email,password,role,interests,security_question,security_answer) VALUES (?,?,?,?,?,?,?)",
    [
      full_name,
      email,
      hashed,
      "student",
      JSON.stringify(interests || []),
      security_question,
      hashedAnswer,
    ],
  );
  const user = db.get(
    "SELECT id,full_name,email,role,interests FROM users WHERE id=?",
    [id],
  );
  user.interests = JSON.parse(user.interests || "[]");
  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
  res.status(201).json({ token, user });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });
  const user = db.get("SELECT * FROM users WHERE email=?", [email]);
  if (!user)
    return res
      .status(401)
      .json({ message: "No account found with this email" });
  if (!bcrypt.compareSync(password, user.password))
    return res.status(401).json({ message: "Incorrect password" });
  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
  const safe = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    interests: JSON.parse(user.interests || "[]"),
    avatar_url: user.avatar_url || "",
  };
  res.json({ token, user: safe });
});
app.post("/api/auth/forgot-password/check", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });
  const user = db.get("SELECT id, security_question FROM users WHERE email=?", [
    email,
  ]);
  if (!user)
    return res
      .status(404)
      .json({ message: "No account found with this email" });
  if (!user.security_question)
    return res
      .status(400)
      .json({ message: "No security question set for this account" });
  res.json({
    message: "Email found",
    security_question: user.security_question,
  });
});
app.post("/api/auth/forgot-password/verify-answer", (req, res) => {
  const { email, security_answer } = req.body;
  if (!email || !security_answer)
    return res.status(400).json({ message: "Email and answer are required" });
  const user = db.get("SELECT security_answer FROM users WHERE email=?", [
    email,
  ]);
  if (!user) return res.status(404).json({ message: "No account found" });
  const match = bcrypt.compareSync(
    security_answer.toLowerCase().trim(),
    user.security_answer,
  );
  if (!match) return res.status(400).json({ message: "Incorrect answer" });
  res.json({ message: "Answer verified" });
});
app.post("/api/auth/forgot-password/reset", (req, res) => {
  const { email, newPassword, security_answer } = req.body;
  if (!email || !newPassword || !security_answer)
    return res.status(400).json({ message: "All fields are required" });
  const user = db.get("SELECT id, security_answer FROM users WHERE email=?", [
    email,
  ]);
  if (!user) return res.status(404).json({ message: "No account found" });
  const match = bcrypt.compareSync(
    security_answer.toLowerCase().trim(),
    user.security_answer,
  );
  if (!match)
    return res.status(403).json({ message: "Security answer mismatch" });
  const hashed = bcrypt.hashSync(newPassword, 10);
  db.run("UPDATE users SET password=? WHERE email=?", [hashed, email]);
  res.json({ message: "Password reset successfully" });
});

app.post("/api/admin/change-password", auth, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword)
    return res.status(400).json({ message: "New password is required" });
  const hashed = bcrypt.hashSync(newPassword, 10);
  const adminEmail = req.user?.email;
  if (!adminEmail) return res.status(401).json({ message: "Unauthorized" });
  db.run("UPDATE users SET password=? WHERE email=?", [hashed, adminEmail]);
  res.json({ message: "Password updated" });
});
app.get("/api/auth/me", auth, (req, res) => {
  const user = db.get(
    "SELECT id,full_name,email,role,interests FROM users WHERE id=?",
    [req.user.id],
  );
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json({ ...user, interests: JSON.parse(user.interests || "[]") });
});

// â”€â”€ UPDATE PROFILE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.patch("/api/auth/profile", auth, (req, res) => {
  const { full_name, interests } = req.body;
  if (!full_name) return res.status(400).json({ message: "Name is required" });
  db.run("UPDATE users SET full_name=?, interests=? WHERE id=?", [
    full_name,
    JSON.stringify(interests || []),
    req.user.id,
  ]);
  const user = db.get(
    "SELECT id,full_name,email,role,interests FROM users WHERE id=?",
    [req.user.id],
  );
  res.json({ ...user, interests: JSON.parse(user.interests || "[]") });
});

// â”€â”€ EVENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Helper: combine a date string (YYYY-MM-DD) and 12-hour time string (e.g. "1:00 PM")
// into a SQLite-compatible datetime string ("YYYY-MM-DD HH:MM").
function buildDeadlineDatetime(dateStr, timeStr) {
  if (!dateStr) return null;
  if (!timeStr) return dateStr;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return dateStr;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  const hh = String(hours).padStart(2, "0");
  return `${dateStr} ${hh}:${minutes}`;
}

app.get("/api/events", (req, res) => {
  // Auto-close registrations if deadline has passed
  // Use datetime('now','+5 hours') to store in PKT so the frontend displays correctly
  db.run(`UPDATE events
    SET registration_open=0,
        registration_closed_at=COALESCE(registration_closed_at, datetime('now','+5 hours'))
    WHERE status='approved'
      AND registration_deadline IS NOT NULL
      AND datetime(registration_deadline, '+5 hours') < datetime('now', '+5 hours')
      AND (registration_open IS NULL OR registration_open != 0)`);
  db.run(`UPDATE events
    SET registration_closed_at=COALESCE(registration_closed_at, datetime('now','+5 hours'))
    WHERE status='approved'
      AND registration_deadline IS NOT NULL
      AND datetime(registration_deadline, '+5 hours') < datetime('now', '+5 hours')
      AND registration_closed_at IS NULL`);
  db.run(`UPDATE events
    SET registration_closed_at=COALESCE(registration_closed_at, datetime('now','+5 hours'))
    WHERE status='approved'
      AND registration_open=0
      AND registration_closed_at IS NULL`);

  const user = optionalAuth(req);
  const userId = user?.id || null;

  const baseSelect = `SELECT e.*, s.name as society_name, s.id as sid,
    COUNT(er.id) as registration_count,
    CASE 
      WHEN e.max_participants IS NULL THEN NULL 
      ELSE e.max_participants - COUNT(er.id) 
    END as spots_remaining,
    ur.attended as user_attended,
    ur.id as user_reg_id
    FROM events e
    LEFT JOIN societies s ON e.society_id=s.id
    LEFT JOIN event_registrations er ON er.event_id=e.id
    ${userId ? "LEFT JOIN event_registrations ur ON ur.event_id=e.id AND ur.user_id=?" : "LEFT JOIN event_registrations ur ON 1=0"}
    WHERE e.status='approved'`;

  const filters = [];
  const params = [];
  if (userId) params.push(userId);

  // Event date cutoff (hide events older than 3 days after event date)
  filters.push(`date(e.date) >= date('now','-3 days')`);

  if (userId) {
    // Registered users: keep visible until check-in, or until 3 days after event date if never checked in
    filters.push(`(
      (ur.id IS NULL AND (e.registration_closed_at IS NULL OR date(e.registration_closed_at) >= date('now','-3 days')))
      OR
      (ur.id IS NOT NULL AND ur.attended=0 AND date(e.date) >= date('now','-3 days'))
    )`);
  } else {
    // Unregistered users: hide if closed more than 3 days ago
    filters.push(
      `(e.registration_closed_at IS NULL OR date(e.registration_closed_at) >= date('now','-3 days'))`,
    );
  }

  const whereClause = filters.length ? ` AND ${filters.join(" AND ")}` : "";
  const events = db.all(
    `${baseSelect}${whereClause}
    GROUP BY e.id
    ORDER BY e.date ASC`,
    params,
  );

  // Never expose check-in code to public/student feed
  const sanitized = events.map((ev) => {
    const { check_in_code, user_attended, user_reg_id, ...rest } = ev;
    return rest;
  });
  res.json(sanitized);
});

app.get("/api/events/pending", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  res.json(
    db.all(`SELECT e.*,s.name as society_name FROM events e
    LEFT JOIN societies s ON e.society_id=s.id WHERE e.status='pending' ORDER BY e.created_at DESC`),
  );
});

app.post("/api/events", auth, (req, res) => {
  if (req.user.role !== "society_admin")
    return res
      .status(403)
      .json({ message: "Only society admins can create events" });
  const {
    title,
    description,
    category,
    date,
    time,
    location,
    registration_deadline,
    registration_deadline_time,
    max_participants,
  } = req.body;
  if (!title || !category || !date)
    return res
      .status(400)
      .json({ message: "Title, category and date are required" });
  const society = db.get("SELECT id, name FROM societies WHERE user_id=?", [
    req.user.id,
  ]);
  if (!society)
    return res
      .status(404)
      .json({ message: "Society not found for this admin" });

  const parseNullableInt = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : NaN;
  };
  const nextMax = parseNullableInt(max_participants);
  if (nextMax !== null && (Number.isNaN(nextMax) || nextMax < 1)) {
    return res.status(400).json({ message: "Invalid max participants value" });
  }

  // Auto-generate check-in code; not exposed to students any more
  const eventCode = generateCheckInCode();

  const id = db.insert(
    `INSERT INTO events (title,description,category,date,time,location,registration_deadline,society_id,status,max_participants,registration_open,check_in_code)
    VALUES (?,?,?,?,?,?,?,?,'pending',?,1,?)`,
    [
      title,
      description,
      category,
      date,
      time,
      location,
      buildDeadlineDatetime(registration_deadline, registration_deadline_time),
      society.id,
      nextMax,
      eventCode,
    ],
  );

  // Notify all admins about pending event
  const admins = db.all("SELECT id FROM users WHERE role='admin'");
  for (const admin of admins) {
    notify(
      admin.id,
      "event_pending",
      `New event "${title}" from ${society.name} requires approval`,
      id,
      society.id,
    );
  }

  res.status(201).json({ message: "Event submitted for approval!", id });
});

app.patch("/api/events/:id/approve", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  const event = db.get(
    "SELECT e.*, s.user_id as society_user_id FROM events e LEFT JOIN societies s ON e.society_id=s.id WHERE e.id=?",
    [req.params.id],
  );
  if (!event) return res.status(404).json({ message: "Not found" });

  let code = (event.check_in_code || "").toString().trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) code = generateCheckInCode();
  db.run("UPDATE events SET status='approved', check_in_code=? WHERE id=?", [
    code,
    req.params.id,
  ]);

  // Notify the society admin
  if (event.society_user_id) {
    notify(
      event.society_user_id,
      "event_approved",
      `Your event "${event.title}" has been approved!`,
      event.id,
    );
  }
  // Notify all followers of the society
  const society = db.get("SELECT id FROM societies WHERE user_id=?", [
    event.society_user_id,
  ]);
  if (society) {
    const followers = db.all(
      "SELECT user_id FROM society_follows WHERE society_id=?",
      [society.id],
    );
    for (const f of followers) {
      notify(
        f.user_id,
        "new_event",
        `New event approved: "${event.title}"`,
        event.id,
        society.id,
      );
    }
  }
  res.json({ message: "Approved", check_in_code: code });
});

app.patch("/api/events/:id/reject", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  const event = db.get(
    "SELECT e.*, s.user_id as society_user_id FROM events e LEFT JOIN societies s ON e.society_id=s.id WHERE e.id=?",
    [req.params.id],
  );
  db.run("UPDATE events SET status='rejected' WHERE id=?", [req.params.id]);
  // Notify society admin
  if (event && event.society_user_id) {
    notify(
      event.society_user_id,
      "event_rejected",
      `Your event "${event.title}" was not approved. Please review and resubmit.`,
      event.id,
    );
  }
  res.json({ message: "Rejected" });
});

// PATCH /api/events/:id/toggle-registration - Toggle registration open/closed
app.patch("/api/events/:id/toggle-registration", auth, (req, res) => {
  if (req.user.role !== "society_admin")
    return res.status(403).json({ message: "Forbidden" });

  const society = db.get("SELECT id, name FROM societies WHERE user_id=?", [
    req.user.id,
  ]);
  const event = db.get("SELECT * FROM events WHERE id=?", [req.params.id]);

  if (!event || !society || event.society_id !== society.id) {
    return res.status(403).json({ message: "Not your event" });
  }

  const now = new Date();
  const currentStatus = event.registration_open === 0 ? 0 : 1;

  // Reopen flow
  if (currentStatus === 0) {
    let closedAt = event.registration_closed_at
      ? new Date(event.registration_closed_at)
      : null;
    if (!closedAt || Number.isNaN(closedAt.getTime())) closedAt = now;
    const reopenBy = new Date(closedAt.getTime() + 3 * 24 * 60 * 60 * 1000);
    if (now > reopenBy) {
      return res.status(403).json({
        message: "Registrations are permanently closed and cannot be reopened.",
      });
    }

    let nextDeadline = event.registration_deadline || null;
    if (
      event.registration_deadline &&
      new Date(event.registration_deadline) < now
    ) {
      const nd = new Date();
      nd.setDate(nd.getDate() + 3);
      nextDeadline = nd.toISOString().slice(0, 10);
    }

    db.run(
      "UPDATE events SET registration_open=1, registration_closed_at=NULL, registration_deadline=? WHERE id=?",
      [nextDeadline, req.params.id],
    );

    return res.json({
      message:
        nextDeadline !== event.registration_deadline
          ? "Registrations reopened (deadline extended +3 days)"
          : "Registrations reopened",
      registration_open: 1,
    });
  }

  // Close flow
  const closeAtIso = event.registration_closed_at || now.toISOString();
  db.run(
    "UPDATE events SET registration_open=0, registration_closed_at=? WHERE id=?",
    [closeAtIso, req.params.id],
  );

  const registeredUsers = db.all(
    "SELECT user_id FROM event_registrations WHERE event_id=?",
    [req.params.id],
  );
  for (const user of registeredUsers) {
    notify(
      user.user_id,
      "registration_closed",
      `Registrations for "${event.title}" have been closed by the organizer.`,
      event.id,
    );
  }

  res.json({
    message: "Registrations closed",
    registration_open: 0,
  });
});

// â”€â”€ REGISTRATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// ── CONFLICT CHECK ─────────────────────────────────────────────────────────────

// GET /api/registrations/check-conflict?eventId=X
// Returns already-registered events sharing the same date AND time as the target event
app.get("/api/registrations/check-conflict", auth, (req, res) => {
  const { eventId } = req.query;
  if (!eventId) return res.status(400).json({ message: "eventId is required" });

  const target = db.get("SELECT id, date, time FROM events WHERE id=?", [
    eventId,
  ]);
  if (!target) return res.status(404).json({ message: "Event not found" });

  const alreadyRegistered = db.all(
    `SELECT e.id, e.title, e.date, e.time, e.location, s.name as society_name
     FROM event_registrations er
     JOIN events e ON er.event_id = e.id
     LEFT JOIN societies s ON e.society_id = s.id
     WHERE er.user_id = ?
       AND e.id != ?
       AND e.date = ?`,
    [req.user.id, eventId, target.date],
  );

  // Conflict = same date + same time (or both unspecified)
  const conflicts = alreadyRegistered.filter((ev) => {
    const t1 = (target.time || "").trim();
    const t2 = (ev.time || "").trim();
    if (!t1 && !t2) return true;
    if (!t1 || !t2) return true;
    return t1 === t2;
  });

  res.json({ conflicts });
});

app.get("/api/registrations", auth, (req, res) => {
  const rows = db.all(
    `SELECT e.*,s.name as society_name, r.attended, r.checked_in_at, r.registered_at
    FROM event_registrations r
    JOIN events e ON r.event_id=e.id
    LEFT JOIN societies s ON e.society_id=s.id
    WHERE r.user_id=? ORDER BY e.date ASC`,
    [req.user.id],
  );
  const sanitized = rows.map((r) => {
    const { check_in_code, ...rest } = r;
    return rest;
  });
  res.json(sanitized);
});

app.post("/api/registrations/:eventId", auth, (req, res) => {
  const event = db.get("SELECT * FROM events WHERE id=?", [req.params.eventId]);
  if (!event) return res.status(404).json({ message: "Event not found" });
  const now = new Date();

  // Check if registrations are manually closed
  if (event.registration_open === 0) {
    return res
      .status(403)
      .json({ message: "Registrations are closed for this event" });
  }

  // Check if deadline passed — compare date strings only so same-day registrations are allowed
  const todayDate = now.toISOString().slice(0, 10);
  if (
    event.registration_deadline &&
    event.registration_deadline.slice(0, 10) < todayDate
  ) {
    const closedAt =
      event.registration_closed_at ||
      new Date(event.registration_deadline).toISOString();
    db.run(
      "UPDATE events SET registration_open=0, registration_closed_at=? WHERE id=?",
      [closedAt, req.params.eventId],
    );
    return res
      .status(403)
      .json({ message: "Registration deadline has passed" });
  }

  // Check if max participants reached
  if (event.max_participants) {
    const currentCount = db.get(
      "SELECT COUNT(*) as c FROM event_registrations WHERE event_id=?",
      [req.params.eventId],
    ).c;
    if (currentCount >= event.max_participants) {
      return res
        .status(403)
        .json({ message: "Event is full. No more seats available." });
    }
  }

  try {
    db.insert(
      "INSERT INTO event_registrations (user_id,event_id) VALUES (?,?)",
      [req.user.id, req.params.eventId],
    );

    // Auto-close if max reached after this registration
    if (event.max_participants) {
      const newCount = db.get(
        "SELECT COUNT(*) as c FROM event_registrations WHERE event_id=?",
        [req.params.eventId],
      ).c;
      if (newCount >= event.max_participants) {
        db.run(
          "UPDATE events SET registration_open=0, registration_closed_at=? WHERE id=?",
          [new Date().toISOString(), req.params.eventId],
        );
      }
    }

    res.json({ registered: true });
  } catch {
    res.status(409).json({ message: "Already registered" });
  }
});

app.delete("/api/registrations/:eventId", auth, (req, res) => {
  db.run("DELETE FROM event_registrations WHERE user_id=? AND event_id=?", [
    req.user.id,
    req.params.eventId,
  ]);
  res.json({ registered: false });
});

// â”€â”€ BOOKMARKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get("/api/bookmarks", auth, (req, res) => {
  const rows = db.all(
    `SELECT e.*,s.name as society_name FROM bookmarks b
    JOIN events e ON b.event_id=e.id
    LEFT JOIN societies s ON e.society_id=s.id
    WHERE b.user_id=? ORDER BY b.saved_at DESC`,
    [req.user.id],
  );
  res.json(rows);
});

app.post("/api/bookmarks/:eventId", auth, (req, res) => {
  try {
    db.insert("INSERT INTO bookmarks (user_id,event_id) VALUES (?,?)", [
      req.user.id,
      req.params.eventId,
    ]);
    res.json({ bookmarked: true });
  } catch {
    res.status(409).json({ message: "Already bookmarked" });
  }
});

app.delete("/api/bookmarks/:eventId", auth, (req, res) => {
  db.run("DELETE FROM bookmarks WHERE user_id=? AND event_id=?", [
    req.user.id,
    req.params.eventId,
  ]);
  res.json({ bookmarked: false });
});

// ── OPPORTUNITY BOOKMARKS ─────────────────────────────────────────────────────

app.get("/api/opportunity-bookmarks", auth, (req, res) => {
  const rows = db.all(
    `SELECT o.* FROM opportunity_bookmarks ob
    JOIN opportunities o ON ob.opportunity_id=o.id
    WHERE ob.user_id=? ORDER BY ob.saved_at DESC`,
    [req.user.id],
  );
  res.json(rows);
});

app.post("/api/opportunity-bookmarks/:oppId", auth, (req, res) => {
  try {
    db.insert(
      "INSERT INTO opportunity_bookmarks (user_id,opportunity_id) VALUES (?,?)",
      [req.user.id, req.params.oppId],
    );
    res.json({ bookmarked: true });
  } catch {
    res.status(409).json({ message: "Already bookmarked" });
  }
});

app.delete("/api/opportunity-bookmarks/:oppId", auth, (req, res) => {
  db.run(
    "DELETE FROM opportunity_bookmarks WHERE user_id=? AND opportunity_id=?",
    [req.user.id, req.params.oppId],
  );
  res.json({ bookmarked: false });
});

app.get("/api/follows", auth, (req, res) => {
  const rows = db.all(
    `SELECT s.* FROM society_follows f
    JOIN societies s ON f.society_id=s.id WHERE f.user_id=?`,
    [req.user.id],
  );
  res.json(
    rows.map((s) => ({ ...s, focus_areas: JSON.parse(s.focus_areas || "[]") })),
  );
});

app.post("/api/follows/:societyId", auth, (req, res) => {
  const existing = db.get(
    "SELECT id FROM society_follows WHERE user_id=? AND society_id=?",
    [req.user.id, req.params.societyId],
  );
  if (existing) {
    db.run("DELETE FROM society_follows WHERE user_id=? AND society_id=?", [
      req.user.id,
      req.params.societyId,
    ]);
    return res.json({ following: false });
  }
  db.insert("INSERT INTO society_follows (user_id,society_id) VALUES (?,?)", [
    req.user.id,
    req.params.societyId,
  ]);
  res.json({ following: true });
});

// â”€â”€ NOTIFICATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get("/api/notifications", auth, (req, res) => {
  const rows = db.all(
    `SELECT n.*,e.title as event_title,s.name as society_name
    FROM notifications n
    LEFT JOIN events e ON n.related_event_id=e.id
    LEFT JOIN societies s ON n.related_society_id=s.id
    WHERE n.user_id=? 
    ORDER BY n.created_at DESC 
    LIMIT 10`,
    [req.user.id],
  );
  res.json(rows);
});

app.patch("/api/notifications/:id/read", auth, (req, res) => {
  db.run("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?", [
    req.params.id,
    req.user.id,
  ]);
  res.json({ ok: true });
});

app.patch("/api/notifications/read-all", auth, (req, res) => {
  db.run("UPDATE notifications SET is_read=1 WHERE user_id=?", [req.user.id]);
  res.json({ ok: true });
});

// DELETE a single notification (dismiss)
app.delete("/api/notifications/:id", auth, (req, res) => {
  db.run("DELETE FROM notifications WHERE id=? AND user_id=?", [
    req.params.id,
    req.user.id,
  ]);
  res.json({ ok: true });
});

// DELETE all read notifications (cleanup endpoint - called periodically)
app.delete("/api/notifications/read", auth, (req, res) => {
  // Only delete read notifications older than 3 days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  db.run(
    "DELETE FROM notifications WHERE user_id=? AND is_read=1 AND created_at < ?",
    [req.user.id, threeDaysAgo.toISOString()],
  );
  res.json({ ok: true });
});

// â”€â”€ SOCIETIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get("/api/societies", (req, res) => {
  const rows = db.all("SELECT * FROM societies");
  res.json(
    rows.map((s) => ({ ...s, focus_areas: JSON.parse(s.focus_areas || "[]") })),
  );
});

// â”€â”€ ADMIN STATS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get("/api/admin/stats", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  res.json({
    active_students: db.get(
      "SELECT COUNT(*) as c FROM users WHERE role='student'",
    ).c,
    active_societies: db.get("SELECT COUNT(*) as c FROM societies").c,
    events_upcoming: db.get(
      "SELECT COUNT(*) as c FROM events WHERE status='approved'",
    ).c,
    opportunities: db.get("SELECT COUNT(*) as c FROM opportunities").c,
  });
});

// â”€â”€ ADMIN ALL EVENTS (for moderation history) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get("/api/admin/all-events", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  const events = db.all(`SELECT e.*, s.name as society_name FROM events e
    LEFT JOIN societies s ON e.society_id=s.id
    ORDER BY e.created_at DESC`);
  res.json(events);
});

// â”€â”€ ADMIN ANALYTICS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get("/api/admin/analytics", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });

  // Category breakdown from real events
  const catRows = db.all(
    `SELECT category, COUNT(*) as count FROM events WHERE status='approved' GROUP BY category ORDER BY count DESC`,
  );
  const totalCatEvents = catRows.reduce((s, r) => s + r.count, 0);
  const categories = catRows.map((r) => ({
    name: r.category,
    count: r.count,
    pct: totalCatEvents > 0 ? Math.round((r.count / totalCatEvents) * 100) : 0,
  }));

  // Top societies by number of approved events
  const socRows = db.all(`
    SELECT s.name, COUNT(e.id) as events, COUNT(DISTINCT er.user_id) as registrations
    FROM societies s
    LEFT JOIN events e ON e.society_id=s.id AND e.status='approved'
    LEFT JOIN event_registrations er ON er.event_id=e.id
    GROUP BY s.id ORDER BY registrations DESC, events DESC LIMIT 5
  `);

  // Weekly registrations (last 6 weeks, Monâ€“Sun)
  const weeks = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const fmt = (dt) => dt.toISOString().slice(0, 10);
    const count = db.get(
      `SELECT COUNT(*) as c FROM event_registrations WHERE date(registered_at) BETWEEN ? AND ?`,
      [fmt(weekStart), fmt(weekEnd)],
    ).c;
    weeks.push({ label: `W${6 - i}`, count });
  }

  res.json({ categories, societies: socRows, weeks });
});

// â”€â”€ SOCIETY EVENTS (own events, all statuses) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get("/api/society/events", auth, (req, res) => {
  if (req.user.role !== "society_admin")
    return res.status(403).json({ message: "Forbidden" });
  const society = db.get("SELECT id FROM societies WHERE user_id=?", [
    req.user.id,
  ]);
  if (!society) return res.json([]);
  const events = db.all(
    `SELECT e.*, s.name as society_name,
    COUNT(er.id) as registration_count
    FROM events e
    LEFT JOIN societies s ON e.society_id=s.id
    LEFT JOIN event_registrations er ON er.event_id=e.id
    WHERE e.society_id=?
    GROUP BY e.id
    ORDER BY e.created_at DESC`,
    [society.id],
  );
  res.json(events);
});

// PATCH /api/events/:id  (society admin edits their own event)
app.patch("/api/events/:id", auth, (req, res) => {
  if (req.user.role !== "society_admin")
    return res.status(403).json({ message: "Forbidden" });
  const society = db.get("SELECT id FROM societies WHERE user_id=?", [
    req.user.id,
  ]);
  const event = db.get("SELECT * FROM events WHERE id=?", [req.params.id]);
  if (!event || !society || event.society_id !== society.id)
    return res.status(403).json({ message: "Not your event" });

  const {
    title,
    description,
    category,
    date,
    time,
    location,
    registration_deadline,
    registration_deadline_time,
    image_url,
    max_participants,
  } = req.body;

  const parseNullableInt = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : NaN;
  };
  const nextMax =
    max_participants === undefined
      ? event.max_participants
      : parseNullableInt(max_participants);
  if (nextMax !== null && Number.isNaN(nextMax)) {
    return res.status(400).json({ message: "Invalid max participants value" });
  }
  const currentCount = db.get(
    "SELECT COUNT(*) as c FROM event_registrations WHERE event_id=?",
    [req.params.id],
  ).c;
  if (nextMax !== null && nextMax < currentCount) {
    return res.status(400).json({
      message: `Max participants cannot be less than current registrations (${currentCount})`,
    });
  }
  const shouldClose = nextMax !== null && currentCount >= nextMax;

  if (event.status === "approved") {
    const disallowedChanges = [];
    if (title !== undefined && title !== event.title)
      disallowedChanges.push("title");
    if (category !== undefined && category !== event.category)
      disallowedChanges.push("category");
    if (date !== undefined && date !== event.date)
      disallowedChanges.push("date");
    if (time !== undefined && time !== event.time)
      disallowedChanges.push("time");
    if (disallowedChanges.length > 0) {
      return res.status(403).json({
        message:
          "Approved events can only update description, location, registration_deadline, image_url, and max_participants.",
      });
    }
    const nextRegDeadline =
      registration_deadline === undefined
        ? event.registration_deadline
        : buildDeadlineDatetime(
            registration_deadline,
            registration_deadline_time,
          ) || null;
    const nextImageUrl =
      image_url === undefined ? event.image_url : image_url || null;

    // If admin sets a new future deadline, reopen registrations and clear the old closed timestamp
    const deadlineIsInFuture =
      nextRegDeadline && new Date(nextRegDeadline) > new Date();
    const deadlineChanged = nextRegDeadline !== event.registration_deadline;

    const nextRegOpen = shouldClose
      ? 0
      : deadlineChanged && deadlineIsInFuture
        ? 1
        : event.registration_open;
    const nextClosedAt = shouldClose
      ? event.registration_closed_at || new Date().toISOString()
      : deadlineChanged && deadlineIsInFuture
        ? null
        : event.registration_closed_at;
    db.run(
      `UPDATE events SET description=?,location=?,registration_deadline=?,image_url=?,max_participants=?,registration_open=?,registration_closed_at=? WHERE id=?`,
      [
        description === undefined ? event.description : description,
        location === undefined ? event.location : location,
        nextRegDeadline,
        nextImageUrl,
        nextMax,
        nextRegOpen,
        nextClosedAt,
        req.params.id,
      ],
    );
    return res.json({ message: "Event updated" });
  }

  const nextRegOpen = shouldClose ? 0 : event.registration_open;
  const nextClosedAt = shouldClose
    ? event.registration_closed_at || new Date().toISOString()
    : event.registration_closed_at;
  db.run(
    `UPDATE events SET title=?,description=?,category=?,date=?,time=?,location=?,
    registration_deadline=?,image_url=?,max_participants=?,registration_open=?,registration_closed_at=?,status='pending' WHERE id=?`,
    [
      title || event.title,
      description || event.description,
      category || event.category,
      date || event.date,
      time || event.time,
      location || event.location,
      buildDeadlineDatetime(
        registration_deadline,
        registration_deadline_time,
      ) || event.registration_deadline,
      image_url || event.image_url,
      nextMax,
      nextRegOpen,
      nextClosedAt,
      req.params.id,
    ],
  );
  const admins = db.all("SELECT id FROM users WHERE role='admin'");
  const soc = db.get("SELECT name FROM societies WHERE id=?", [
    event.society_id,
  ]);
  for (const admin of admins) {
    notify(
      admin.id,
      "event_resubmitted",
      `Event "${title || event.title}" from ${soc?.name || "a society"} was resubmitted for approval`,
      req.params.id,
      event.society_id,
    );
  }
  res.json({ message: "Event updated and resubmitted for approval" });
});

app.delete("/api/events/:id", auth, (req, res) => {
  if (req.user.role !== "society_admin")
    return res.status(403).json({ message: "Forbidden" });

  const event = db.get("SELECT * FROM events WHERE id=?", [req.params.id]);
  const society = db.get("SELECT id FROM societies WHERE user_id=?", [
    req.user.id,
  ]);

  if (!event || !society || event.society_id !== society.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (event.status === "approved") {
    return res.status(403).json({ message: "Cannot delete an approved event" });
  }

  db.run("DELETE FROM events WHERE id=?", [req.params.id]);
  res.json({ message: "Event deleted" });
});

// â”€â”€ SOCIETY PROFILE UPDATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.patch("/api/society/profile", auth, (req, res) => {
  if (req.user.role !== "society_admin")
    return res.status(403).json({ message: "Forbidden" });
  const { name, description, focus_areas, avatar_url, banner_url } = req.body;
  const society = db.get("SELECT id FROM societies WHERE user_id=?", [
    req.user.id,
  ]);
  if (!society) return res.status(404).json({ message: "Society not found" });
  db.run(
    "UPDATE societies SET name=?,description=?,focus_areas=?,avatar_url=?,banner_url=? WHERE id=?",
    [
      name,
      description,
      JSON.stringify(focus_areas || []),
      avatar_url || null,
      banner_url || null,
      society.id,
    ],
  );
  res.json({ message: "Profile updated" });
});

app.patch("/api/society/dna", auth, (req, res) => {
  if (req.user.role !== "society_admin")
    return res.status(403).json({ message: "Forbidden" });
  const { mission, vision, values, tags } = req.body;
  const society = db.get("SELECT id FROM societies WHERE user_id=?", [
    req.user.id,
  ]);
  if (!society) return res.status(404).json({ message: "Society not found" });
  db.run(
    "UPDATE societies SET mission=?,vision=?,values_text=?,focus_areas=? WHERE id=?",
    [mission, vision, values, JSON.stringify(tags || []), society.id],
  );
  res.json({ message: "DNA updated" });
});

// â”€â”€ SOCIETY ANALYTICS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get("/api/society/analytics", auth, (req, res) => {
  if (req.user.role !== "society_admin")
    return res.status(403).json({ message: "Forbidden" });
  const society = db.get("SELECT id FROM societies WHERE user_id=?", [
    req.user.id,
  ]);
  if (!society) return res.json({});
  const totalEvents = db.get(
    "SELECT COUNT(*) as c FROM events WHERE society_id=?",
    [society.id],
  ).c;
  const approvedEvents = db.get(
    "SELECT COUNT(*) as c FROM events WHERE society_id=? AND status='approved'",
    [society.id],
  ).c;
  const pendingEvents = db.get(
    "SELECT COUNT(*) as c FROM events WHERE society_id=? AND status='pending'",
    [society.id],
  ).c;
  const followers = db.get(
    "SELECT COUNT(*) as c FROM society_follows WHERE society_id=?",
    [society.id],
  ).c;
  const totalRegs = db.get(
    `SELECT COUNT(*) as c FROM event_registrations r
    JOIN events e ON r.event_id=e.id WHERE e.society_id=?`,
    [society.id],
  ).c;
  const totalBookmarks = db.get(
    `SELECT COUNT(*) as c FROM bookmarks b
    JOIN events e ON b.event_id=e.id WHERE e.society_id=?`,
    [society.id],
  ).c;

  // Weekly registration breakdown (last 6 weeks)
  const weeks = [];
  for (let i = 5; i >= 0; i--) {
    const from = new Date();
    from.setDate(from.getDate() - (i + 1) * 7);
    const to = new Date();
    to.setDate(to.getDate() - i * 7);
    const count = db.get(
      `SELECT COUNT(*) as c FROM event_registrations r
      JOIN events e ON r.event_id=e.id
      WHERE e.society_id=? AND r.registered_at>=? AND r.registered_at<?`,
      [society.id, from.toISOString(), to.toISOString()],
    ).c;
    weeks.push({ label: `W${6 - i}`, count });
  }

  res.json({
    totalEvents,
    approvedEvents,
    pendingEvents,
    followers,
    totalRegs,
    totalBookmarks,
    weeks,
  });
});

// â”€â”€ ATTENDANCE TRACKING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Get attendance for an event (society admin only)
app.get("/api/events/:id/attendance", auth, (req, res) => {
  if (req.user.role !== "society_admin")
    return res.status(403).json({ message: "Forbidden" });

  const society = db.get("SELECT id FROM societies WHERE user_id=?", [
    req.user.id,
  ]);
  const event = db.get("SELECT * FROM events WHERE id=?", [req.params.id]);

  if (!event || event.society_id !== society.id) {
    return res.status(403).json({ message: "Not your event" });
  }

  // Include user_id so admin can mark attendance per student
  const attendees = db.all(
    `SELECT u.id as user_id, u.full_name, u.email, er.attended, er.checked_in_at, er.registered_at
    FROM event_registrations er
    JOIN users u ON er.user_id=u.id
    WHERE er.event_id=?`,
    [req.params.id],
  );

  const stats = {
    registered: attendees.length,
    attended: attendees.filter((a) => a.attended).length,
    attendance_rate:
      attendees.length > 0
        ? Math.round(
            (attendees.filter((a) => a.attended).length / attendees.length) *
              100,
          )
        : 0,
  };

  res.json({ attendees, stats });
});

// Society admin marks attendance for a specific student
app.post("/api/events/:id/mark-attendance", auth, (req, res) => {
  if (req.user.role !== "society_admin")
    return res.status(403).json({ message: "Forbidden" });

  const society = db.get("SELECT id FROM societies WHERE user_id=?", [
    req.user.id,
  ]);
  const event = db.get("SELECT * FROM events WHERE id=?", [req.params.id]);

  if (!event || event.society_id !== society.id) {
    return res.status(403).json({ message: "Not your event" });
  }

  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ message: "user_id is required" });

  const registration = db.get(
    "SELECT * FROM event_registrations WHERE user_id=? AND event_id=?",
    [user_id, req.params.id],
  );
  if (!registration)
    return res
      .status(404)
      .json({ message: "Student not registered for this event" });

  // Toggle: if already attended, unmark; if not, mark
  const newAttended = registration.attended === 1 ? 0 : 1;
  const nowIso = new Date().toISOString();
  db.run(
    "UPDATE event_registrations SET attended=?, checked_in_at=? WHERE id=?",
    [newAttended, newAttended === 1 ? nowIso : null, registration.id],
  );

  // Notify the student when marked as attended
  if (newAttended === 1) {
    notify(
      user_id,
      "attendance_marked",
      `Your attendance for "${event.title}" has been marked as attended.`,
      event.id,
    );
  }

  res.json({
    attended: newAttended,
    message: newAttended === 1 ? "Marked as attended" : "Attendance removed",
  });
});

// â”€â”€ START â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// ── OPPORTUNITIES ─────────────────────────────────────────────────────────────

app.get("/api/opportunities", (req, res) => {
  const rows = db.all("SELECT * FROM opportunities ORDER BY created_at DESC");
  res.json(rows);
});

app.post("/api/opportunities", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res
      .status(403)
      .json({ message: "Only admins can post opportunities" });

  const { title, type, organization, description, deadline, link } = req.body;

  if (!title || !type)
    return res.status(400).json({ message: "Title and type are required" });

  const id = db.insert(
    "INSERT INTO opportunities (title,type,organization,description,deadline,link,posted_by) VALUES (?,?,?,?,?,?,?)",
    [
      title,
      type,
      organization || "",
      description || "",
      deadline || null,
      link || "",
      req.user.id,
    ],
  );

  // --- NEW: Notify all students ---
  const students = db.all("SELECT id FROM users WHERE role='student'");
  for (const st of students) {
    notify(
      st.id,
      "new_opportunity",
      `New Opportunity: "${title}" (${type}) at ${organization || "NUcleus"}`,
    );
  }
  // ---------------------------------

  res.status(201).json({ id, message: "Opportunity posted!" });
});

app.delete("/api/opportunities/:id", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  db.run("DELETE FROM opportunities WHERE id=?", [req.params.id]);
  res.json({ ok: true });
});

// ── REMINDER SCHEDULER ────────────────────────────────────────────────────────
function runReminderJob() {
  if (!db) return;

  const nowMs = Date.now() + 5 * 60 * 60 * 1000; // PKT offset matches notify()
  const now = new Date(nowMs);

  // 23h–25h window so hourly polling never misses a target
  const windowStart = new Date(nowMs + 23 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const windowEnd = new Date(nowMs + 25 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // 1. event_reminder — student registered for an event happening tomorrow
  const upcomingEvents = db.all(
    `SELECT e.id, e.title, e.date, e.time FROM events e
     WHERE e.status = 'approved' AND date(e.date) >= ? AND date(e.date) <= ?`,
    [windowStart, windowEnd],
  );
  for (const event of upcomingEvents) {
    const students = db.all(
      `SELECT er.user_id FROM event_registrations er
       JOIN users u ON u.id = er.user_id
       WHERE er.event_id = ? AND u.role = 'student'`,
      [event.id],
    );
    for (const s of students) {
      const already = db.get(
        `SELECT id FROM notifications WHERE user_id=? AND type='event_reminder' AND related_event_id=?`,
        [s.user_id, event.id],
      );
      if (already) continue;
      const timeStr = event.time ? ` at ${event.time}` : "";
      notify(
        s.user_id,
        "event_reminder",
        `Reminder: "${event.title}" is happening tomorrow${timeStr}. Don't forget!`,
        event.id,
      );
    }
  }

  // 2. deadline_reminder — follower hasn't registered, deadline is tomorrow
  const deadlineEvents = db.all(
    `SELECT e.id, e.title, e.society_id FROM events e
     WHERE e.status = 'approved' AND e.registration_open = 1
       AND e.registration_deadline IS NOT NULL
       AND date(e.registration_deadline) >= ? AND date(e.registration_deadline) <= ?`,
    [windowStart, windowEnd],
  );
  for (const event of deadlineEvents) {
    const followers = db.all(
      `SELECT sf.user_id FROM society_follows sf
       JOIN users u ON u.id = sf.user_id
       WHERE sf.society_id = ? AND u.role = 'student'`,
      [event.society_id],
    );
    for (const f of followers) {
      const registered = db.get(
        `SELECT id FROM event_registrations WHERE user_id=? AND event_id=?`,
        [f.user_id, event.id],
      );
      if (registered) continue;
      const already = db.get(
        `SELECT id FROM notifications WHERE user_id=? AND type='deadline_reminder' AND related_event_id=?`,
        [f.user_id, event.id],
      );
      if (already) continue;
      notify(
        f.user_id,
        "deadline_reminder",
        `Registration for "${event.title}" closes tomorrow! Register before it's too late.`,
        event.id,
        event.society_id,
      );
    }
  }

  console.log(
    `[Reminder Job] ${now.toISOString()} — ${upcomingEvents.length} event(s), ${deadlineEvents.length} deadline(s)`,
  );
  // 3. overloaded_day — student registered for 3+ events on the same day tomorrow
  const registeredStudents = db.all(
    `SELECT DISTINCT er.user_id FROM event_registrations er
   JOIN events e ON er.event_id = e.id
   JOIN users u ON u.id = er.user_id
   WHERE e.status = 'approved' AND u.role = 'student'
     AND date(e.date) >= ? AND date(e.date) <= ?`,
    [windowStart, windowEnd],
  );
  for (const s of registeredStudents) {
    const dayEvents = db.all(
      `SELECT e.id, e.title, e.date FROM event_registrations er
     JOIN events e ON er.event_id = e.id
     WHERE er.user_id = ? AND e.status = 'approved'
       AND date(e.date) >= ? AND date(e.date) <= ?`,
      [s.user_id, windowStart, windowEnd],
    );
    // Group by date
    const byDate = {};
    for (const ev of dayEvents) {
      byDate[ev.date] = byDate[ev.date] || [];
      byDate[ev.date].push(ev);
    }
    for (const [date, eventsOnDay] of Object.entries(byDate)) {
      if (eventsOnDay.length < 3) continue;
      const already = db.get(
        `SELECT id FROM notifications WHERE user_id=? AND type='overloaded_day' AND message LIKE ?`,
        [s.user_id, `%${date}%`],
      );
      if (already) continue;
      notify(
        s.user_id,
        "overloaded_day",
        `📅 Heads up! You have ${eventsOnDay.length} events on ${date} tomorrow. It's going to be a packed day!`,
        null,
        null,
      );
    }
  }
}
// In-memory settings store
app.get("/api/settings", (req, res) => {
  const row = db.get(
    "SELECT platform_name,  contact_email FROM platform_settings WHERE id=1",
  );

  if (row) {
    res.json({
      platform_name: row.platform_name || "NUcleus",

      contact_email: row.contact_email || "nucesadmin@gmail.com",
    });
  } else {
    res.json({
      platform_name: "NUcleus",

      contact_email: "nucesadmin@gmail.com",
    });
  }
});

app.post("/api/admin/settings", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  const { platform_name, contact_email } = req.body;
  db.run(
    "INSERT INTO platform_settings (id, platform_name, contact_email) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET platform_name=excluded.platform_name, contact_email=excluded.contact_email",
    [platform_name ?? "NUcleus", contact_email ?? "nucesadmin@gmail.com"],
  );
  res.json({ message: "Saved", platform_name, contact_email });
});
app.patch("/api/admin/avatar", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  const { avatar_url } = req.body;
  db.run("UPDATE users SET avatar_url=? WHERE id=?", [avatar_url, req.user.id]);
  res.json({ message: "Updated", avatar_url });
});
app.patch("/api/admin/contact-email", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  const { contact_email } = req.body;
  if (!contact_email)
    return res.status(400).json({ message: "Email required" });
  db.run(
    "INSERT INTO platform_settings (id, contact_email) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET contact_email=excluded.contact_email",
    [contact_email],
  );
  res.json({ message: "Updated", contact_email });
});

// Society registration submission (public)
app.post("/api/society-registrations", (req, res) => {
  const {
    name,
    description,
    focus_areas,
    mission,
    vision,
    email,
    contact_name,
    security_question,
    security_answer,
  } = req.body;
  if (
    !name ||
    !email ||
    !contact_name ||
    !mission ||
    !vision ||
    !focus_areas ||
    !description
  )
    return res.status(400).json({ message: "All fields are required." });

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ message: "Invalid email address format." });

  // Check if this email is already a registered user
  if (db.get("SELECT id FROM users WHERE email=?", [email]))
    return res
      .status(409)
      .json({ message: "This email is already registered on the platform." });

  // Save the registration
  db.run(
    "INSERT INTO society_registrations (name, description, focus_areas, mission, vision, email, contact_name, security_question, security_answer) VALUES (?,?,?,?,?,?,?,?,?)",
    [
      name,
      description || "",
      JSON.stringify(focus_areas || []),
      mission || "",
      vision || "",
      email,
      contact_name,
      security_question || "",
      security_answer || "",
    ],
  );
  const admins = db.all("SELECT id FROM users WHERE role='admin'");
  const now = new Date().toISOString();
  admins.forEach((admin) => {
    db.run(
      "INSERT INTO notifications (user_id, type, message, created_at) VALUES (?,?,?,?)",
      [
        admin.id,
        "society_registration",
        `New society registration: "${name}" by ${contact_name} is pending approval.`,
        now,
      ],
    );
  });
  res.json({ message: "Registration submitted for admin approval." });
});

// Admin: get all society registration requests
app.get("/api/admin/society-registrations", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  const rows = db.all(
    "SELECT * FROM society_registrations ORDER BY created_at DESC",
  );
  res.json(rows);
});

// Admin: approve or reject
app.patch("/api/admin/society-registrations/:id", auth, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });
  const { action } = req.body; // "approve" or "reject"
  const reg = db.get("SELECT * FROM society_registrations WHERE id=?", [
    req.params.id,
  ]);
  if (!reg) return res.status(404).json({ message: "Not found" });

  if (action === "approve") {
    // Use the contact email the registrant provided as their login email
    const finalEmail = reg.email;

    // Safety check — shouldn't happen due to submit-time validation, but guard anyway
    if (db.get("SELECT id FROM users WHERE email=?", [finalEmail])) {
      return res.status(409).json({
        message:
          "A user with this email already exists. Please contact the registrant to use a different email.",
      });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashed = bcrypt.hashSync(tempPassword, 10);
    const newUserId = db.insert(
      "INSERT INTO users (full_name, email, password, role, security_question, security_answer) VALUES (?,?,?,?,?,?)",
      [
        reg.name, // full_name is the society name
        finalEmail, // contact email as login
        hashed,
        "society_admin",
        reg.security_question || "",
        reg.security_answer || "",
      ],
    );
    const newSocietyId = db.insert(
      "INSERT INTO societies (name, description, focus_areas, mission, vision, user_id) VALUES (?,?,?,?,?,?)",
      [
        reg.name,
        reg.description,
        reg.focus_areas,
        reg.mission,
        reg.vision,
        newUserId,
      ],
    );
    db.run("UPDATE society_registrations SET status='approved' WHERE id=?", [
      req.params.id,
    ]);

    // Notify all students about the new society
    const students = db.all("SELECT id FROM users WHERE role='student'");
    for (const st of students) {
      notify(
        st.id,
        "new_society",
        `🎉 A new society has joined NUcleus: "${reg.name}"! Check them out and follow to stay updated.`,
        null,
        newSocietyId,
      );
    }

    // Send approval email with credentials
    const settings = db.get(
      "SELECT contact_email FROM platform_settings WHERE id=1",
    );
    const adminEmail = settings?.contact_email || "nucesadmin@gmail.com";
    try {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
        tls: { rejectUnauthorized: false },
      });
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: reg.email, // personal email of the registrant, for delivery
        subject: "Your Society Registration is Approved!",
        html: `<h2>Congratulations, ${reg.contact_name}!</h2>
    <p>Your society <strong>${reg.name}</strong> has been approved on NUcleus.</p>
    <p><strong>Your society login credentials:</strong><br>
    Email: <strong>${finalEmail}</strong><br>
    Password: <strong>${tempPassword}</strong></p>
    <p>Please <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}">log in here</a> and change your password after your first login.</p>`,
      });
    } catch (e) {
      console.error("Email error:", e.message);
    }

    res.json({ message: "Approved and credentials sent." });
  } else if (action === "reject") {
    db.run("UPDATE society_registrations SET status='rejected' WHERE id=?", [
      req.params.id,
    ]);
    try {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
        tls: { rejectUnauthorized: false },
      });
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: reg.email,
        subject: "Society Registration Update",
        html: `<p>We're sorry, your society registration for <strong>${reg.name}</strong> was not approved at this time. Please contact the admin for more information.</p>`,
      });
    } catch (e) {
      console.error("Email error:", e.message);
    }
    res.json({ message: "Rejected and notified." });
  } else {
    res.status(400).json({ message: "Invalid action." });
  }
});
app.delete("/api/admin/societies/:id", auth, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });

  const soc = db.get("SELECT * FROM societies WHERE id=?", [req.params.id]);
  if (!soc) return res.status(404).json({ message: "Society not found" });

  db.run("DELETE FROM society_follows WHERE society_id=?", [req.params.id]);
  db.run("DELETE FROM events WHERE society_id=?", [req.params.id]);
  db.run("DELETE FROM users WHERE id=?", [soc.user_id]);
  db.run("DELETE FROM societies WHERE id=?", [req.params.id]);

  res.json({ message: "Society removed successfully" });
});
initDb()
  .then((dbMethods) => {
    db = dbMethods;
    app.listen(PORT, () =>
      console.log(` NUcleus backend ’ http://localhost:${PORT}`),
    );

    runReminderJob(); // ADD — runs once on boot
    setInterval(runReminderJob, 60 * 60 * 1000);
  })
  .catch((err) => {
    console.error("DB init failed:", err);
    process.exit(1);
  });
