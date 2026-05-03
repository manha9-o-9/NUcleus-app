import { useState, useEffect, useCallback, useRef } from "react";
import {
  Home,
  UserCircle,
  Calendar,
  BarChart3,
  Bell,
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Bookmark,
  TrendingUp,
  Users,
  Edit3,
  PlusCircle,
  LogOut,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Trash2,
} from "lucide-react";
import OrbitLogo from "../OrbitLogo";
import "./StudentHome.css";
import "./SocietyDashboard.css";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../useTheme";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;
const tok = () => localStorage.getItem("token");
const authH = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${tok()}`,
});

// ── CHANGE 1: Notification emoji helpers ─────────────────────────────────────
const NOTIF_EMOJI = {
  new_event: "📢",
  event_approved: "✅",
  event_rejected: "❌",
  event_pending: "📋",
  event_resubmitted: "📋",
  deadline_reminder: "⏰",
  event_reminder: "🔔",
  registration_closed: "🔒",
  attendance_marked: "✅",
  default: "🔔",
};
const notifEmoji = (type) => NOTIF_EMOJI[type] || NOTIF_EMOJI.default;
const notifWithEmoji = (n) => {
  const emoji = notifEmoji(n.type);
  const msg = n.message || "";
  const startsWithEmoji = /^\p{Emoji}/u.test(msg);
  return startsWithEmoji ? msg : `${emoji} ${msg}`;
};

// ── Notifications Panel ──────────────────────────────────────────────────────
const NotificationsPanel = ({
  notifications,
  onReadAll,
  onClose,
  onDismiss,
  onMarkAllAndClose,
}) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.6)",
      zIndex: 3000,
      display: "flex",
      justifyContent: "flex-end",
    }}
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "380px",
        height: "100vh",
        background: "#1a1a2e",
        borderLeft: "1px solid rgba(189,217,191,.15)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "1.5rem",
          borderBottom: "1px solid rgba(189,217,191,.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: "Aldrich,sans-serif",
            color: "#BDD9BF",
            fontSize: "1.1rem",
          }}
        >
          NOTIFICATIONS
        </h2>
        <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
          <button
            onClick={onMarkAllAndClose}
            style={{
              background: "none",
              border: "none",
              color: "#92898A",
              cursor: "pointer",
              fontSize: ".8rem",
              fontFamily: "Nova Square,sans-serif",
            }}
          >
            Mark all read
          </button>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#92898A",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(189,217,191,0.18) rgba(12,24,33,0.4)",
        }}
      >
        {notifications.length === 0 ? (
          <div
            style={{ padding: "3rem", textAlign: "center", color: "#92898A" }}
          >
            You're all caught up! 🎉
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              style={{
                padding: "1rem 1.5rem",
                borderBottom: "1px solid rgba(189,217,191,.05)",
                background: n.is_read ? "transparent" : "rgba(189,217,191,.04)",
                display: "flex",
                alignItems: "flex-start",
                gap: ".75rem",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  marginTop: "6px",
                  flexShrink: 0,
                  background: n.is_read ? "transparent" : "#4FC3F7",
                  boxShadow: n.is_read ? "none" : "0 0 6px #4FC3F7",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* CHANGE 1: use notifWithEmoji */}
                <p
                  style={{
                    margin: "0 0 .3rem",
                    color: n.is_read ? "#92898A" : "#BDD9BF",
                    fontSize: ".9rem",
                    lineHeight: 1.4,
                  }}
                >
                  {notifWithEmoji(n)}
                </p>
                <p style={{ margin: 0, color: "#685369", fontSize: ".75rem" }}>
                  {new Date(n.created_at).toLocaleString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => onDismiss(n.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#685369",
                  cursor: "pointer",
                  padding: ".2rem",
                  flexShrink: 0,
                  lineHeight: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

// ── Image helpers ────────────────────────────────────────────────────────────
const CAT_IMAGES = {
  Technical:
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
  Competitions:
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
  Career:
    "https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&w=800&q=80",
  Social:
    "https://images.unsplash.com/photo-1540575861501-7c93b707ffea?auto=format&fit=crop&w=800&q=80",
  Arts: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80",
  Sports:
    "https://images.unsplash.com/photo-1461896756970-f0939d79a575?auto=format&fit=crop&w=800&q=80",
  default:
    "https://images.unsplash.com/photo-1540575861501-7c93b707ffea?auto=format&fit=crop&w=800&q=80",
};
const eventImg = (e) =>
  e.image_url || e.image || CAT_IMAGES[e.category] || CAT_IMAGES.default;

// ── Edit Event Modal ──────────────────────────────────────────────────────────
const EditEventModal = ({ event, onClose, onSave }) => {
  const CATEGORIES = [
    "Technical",
    "Competitions",
    "Career",
    "Social",
    "Arts",
    "Sports",
  ];
  const isApproved = event.status === "approved";
  const lockedFields = new Set(["title", "category", "date", "time"]);
  const isLocked = (field) => isApproved && lockedFields.has(field);

  // CHANGE 2: expanded form state with deadline time fields
  const [form, setForm] = useState({
    title: event.title || "",
    description: event.description || "",
    category: event.category || "Technical",
    date: event.date || "",
    time: event.time || "",
    timeHour: (() => {
      const t = (event.time || "").match(/^(\d{1,2}):/);
      return t ? t[1] : "12";
    })(),
    timeMin: (() => {
      const t = (event.time || "").match(/:(\d{2})/);
      return t ? t[1] : "00";
    })(),
    timeAmpm: (() => {
      return (event.time || "").includes("PM") ? "PM" : "AM";
    })(),
    location: event.location || "",
    registration_deadline: event.registration_deadline
      ? event.registration_deadline.slice(0, 10)
      : "",
    registration_deadline_hour: (() => {
      const dl = event.registration_deadline || "";
      // Stored as 24h "YYYY-MM-DD HH:MM"
      const m24 = dl.match(/\d{4}-\d{2}-\d{2} (\d{2}):(\d{2})/);
      if (m24) {
        let h = parseInt(m24[1], 10);
        if (h === 0) h = 12;
        else if (h > 12) h -= 12;
        return String(h);
      }
      // Legacy 12h format
      const m12 = dl.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      return m12 ? m12[1] : "11";
    })(),
    registration_deadline_min: (() => {
      const MINS = [
        "00",
        "05",
        "10",
        "15",
        "20",
        "25",
        "30",
        "35",
        "40",
        "45",
        "50",
        "55",
      ];
      const dl = event.registration_deadline || "";
      const m24 = dl.match(/\d{4}-\d{2}-\d{2} \d{2}:(\d{2})/);
      const raw = m24
        ? m24[1]
        : (() => {
            const m12 = dl.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            return m12 ? m12[2] : "00";
          })();
      // Snap to nearest valid option
      const n = parseInt(raw, 10);
      return MINS.reduce(
        (best, opt) =>
          Math.abs(parseInt(opt, 10) - n) < Math.abs(parseInt(best, 10) - n)
            ? opt
            : best,
        "00",
      );
    })(),
    registration_deadline_ampm: (() => {
      const dl = event.registration_deadline || "";
      const m24 = dl.match(/\d{4}-\d{2}-\d{2} (\d{2}):\d{2}/);
      if (m24) return parseInt(m24[1], 10) >= 12 ? "PM" : "AM";
      return /PM/i.test(dl) ? "PM" : "AM";
    })(),
    image_url: event.image_url || "",
    max_participants: event.max_participants ?? "",
  });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setMsg("");

    // CHANGE 4: validate using full datetime
    const deadlineFull = form.registration_deadline
      ? new Date(
          `${form.registration_deadline} ${form.registration_deadline_hour}:${form.registration_deadline_min} ${form.registration_deadline_ampm}`,
        )
      : null;
    const eventFull = form.date
      ? new Date(
          `${form.date} ${form.timeHour}:${form.timeMin} ${form.timeAmpm}`,
        )
      : null;
    if (deadlineFull && eventFull && deadlineFull >= eventFull) {
      setMsg("⚠️ Registration deadline must be before the event time.");
      setSaving(false);
      return;
    }

    if (
      form.max_participants !== "" &&
      (!Number.isInteger(Number(form.max_participants)) ||
        Number(form.max_participants) < 1)
    ) {
      setMsg("⚠️ Headcount must be a positive whole number.");
      setSaving(false);
      return;
    }
    if (
      form.max_participants !== "" &&
      Number(form.max_participants) < (event.registration_count || 0)
    ) {
      setMsg(
        `⚠️ Headcount cannot be less than current registrations (${event.registration_count || 0}).`,
      );
      setSaving(false);
      return;
    }

    // CHANGE 2: include registration_deadline_time in the PATCH body
    const res = await fetch(`${API}/events/${event.id}`, {
      method: "PATCH",
      headers: authH(),
      body: JSON.stringify({
        ...form,
        time: `${form.timeHour}:${form.timeMin} ${form.timeAmpm}`,
        registration_deadline_time: `${form.registration_deadline_hour}:${form.registration_deadline_min} ${form.registration_deadline_ampm}`,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.message || "Update failed");
      setSaving(false);
      return;
    }
    setMsg(
      event.status === "approved"
        ? "✅ Updated!"
        : "✅ Updated! Resubmitted for approval.",
    );
    setTimeout(() => {
      onSave();
      onClose();
    }, 1500);
    setSaving(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background:
            "linear-gradient(135deg,var(--theme-bg-from),var(--theme-bg-mid),var(--theme-bg-to))",
          border: "1px solid rgba(var(--theme-accent-rgb), .15)",
          borderRadius: "18px",
          overflow: "hidden",
          width: "100%",
          maxWidth: "560px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            position: "relative",
            padding: "1.5rem 1.75rem 1.1rem",
            borderBottom: "1px solid rgba(var(--theme-accent-rgb), .08)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background:
                "linear-gradient(90deg,var(--theme-accent),rgba(var(--theme-accent-rgb), .6),transparent)",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 .15rem",
                  color: "var(--theme-accent)",
                  fontSize: "8px",
                  letterSpacing: "3px",
                  fontFamily: "Aldrich,sans-serif",
                }}
              >
                SOCIETY EVENT
              </p>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "Aldrich,sans-serif",
                  color: "var(--theme-text-primary)",
                  fontSize: "1.1rem",
                  letterSpacing: "1px",
                }}
              >
                Edit Event
              </h2>
            </div>
            <button
              onClick={onClose}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,83,80,.15)";
                e.currentTarget.style.borderColor = "rgba(239,83,80,.35)";
                e.currentTarget.style.color = "#EF5350";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,.08)";
                e.currentTarget.style.color = "#92898A";
              }}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.08)",
                color: "#92898A",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                transition: "all .2s",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            overflowY: "auto",
            padding: "1.25rem 1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: ".9rem",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(var(--theme-accent-rgb), .3) transparent",
          }}
        >
          {isApproved && (
            <div
              style={{
                background: "rgba(255,183,77,.12)",
                border: "1px solid rgba(255,183,77,.35)",
                color: "#FFB74D",
                padding: ".7rem",
                borderRadius: "8px",
                fontSize: ".85rem",
              }}
            >
              Approved events can only edit description, venue, registration
              deadline, image, and headcount.
            </div>
          )}
          {msg && (
            <div
              style={{
                background: msg.startsWith("✅")
                  ? "rgba(76,175,80,.15)"
                  : "rgba(255,80,80,.15)",
                border: `1px solid ${msg.startsWith("✅") ? "rgba(76,175,80,.4)" : "rgba(255,80,80,.4)"}`,
                color: msg.startsWith("✅") ? "#81c784" : "#ff6b6b",
                padding: ".75rem",
                borderRadius: "8px",
                fontSize: ".88rem",
              }}
            >
              {msg}
            </div>
          )}

          <div>
            <label
              style={{
                color: "var(--theme-text-primary)",
                fontSize: ".75rem",
                display: "block",
                marginBottom: ".35rem",
                letterSpacing: "1px",
                opacity: 0.8,
              }}
            >
              TITLE <span style={{ color: "var(--theme-accent)" }}>*</span>
            </label>
            <input
              value={form.title}
              disabled={isLocked("title")}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              onFocus={(e) =>
                (e.target.style.borderColor =
                  "rgba(var(--theme-accent-rgb), .45)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor =
                  "rgba(var(--theme-accent-rgb), .2)")
              }
              style={{
                background: "rgba(5,15,25,.6)",
                border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                borderRadius: "8px",
                padding: ".65rem .9rem",
                color: "#fff",
                width: "100%",
                fontFamily: "Nova Square,sans-serif",
                fontSize: ".88rem",
                boxSizing: "border-box",
                outline: "none",
                transition: "border .2s",
                opacity: isLocked("title") ? 0.5 : 1,
                cursor: isLocked("title") ? "not-allowed" : "text",
              }}
            />
          </div>

          <div>
            <label
              style={{
                color: "var(--theme-text-primary)",
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
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              onFocus={(e) =>
                (e.target.style.borderColor =
                  "rgba(var(--theme-accent-rgb), .45)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor =
                  "rgba(var(--theme-accent-rgb), .2)")
              }
              style={{
                background: "rgba(5,15,25,.6)",
                border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                borderRadius: "8px",
                padding: ".65rem .9rem",
                color: "#fff",
                width: "100%",
                fontFamily: "Nova Square,sans-serif",
                fontSize: ".88rem",
                boxSizing: "border-box",
                outline: "none",
                resize: "vertical",
                transition: "border .2s",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div style={{ position: "relative" }}>
              <label
                style={{
                  color: "var(--theme-text-primary)",
                  fontSize: ".75rem",
                  display: "block",
                  marginBottom: ".35rem",
                  letterSpacing: "1px",
                  opacity: 0.8,
                }}
              >
                CATEGORY
              </label>
              <div
                onClick={() => {
                  if (!isLocked("category"))
                    setForm((p) => ({ ...p, _ddOpen: !p._ddOpen }));
                }}
                style={{
                  background: "rgba(5,15,25,.6)",
                  border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                  borderRadius: "8px",
                  padding: ".65rem .9rem",
                  color: "#fff",
                  fontFamily: "Nova Square,sans-serif",
                  fontSize: ".88rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: isLocked("category") ? "not-allowed" : "pointer",
                  opacity: isLocked("category") ? 0.5 : 1,
                }}
              >
                <span>{form.category}</span>
                <span
                  style={{
                    color: "var(--theme-accent)",
                    fontSize: ".7rem",
                    transform: form._ddOpen ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform .2s",
                  }}
                >
                  ▼
                </span>
              </div>
              {form._ddOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 300,
                    marginTop: "4px",
                    background: "#0d1a2e",
                    border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0,0,0,.5)",
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <div
                      key={c}
                      onClick={() =>
                        setForm((p) => ({ ...p, category: c, _ddOpen: false }))
                      }
                      onMouseEnter={(e) => {
                        if (form.category !== c)
                          e.currentTarget.style.background =
                            "rgba(var(--theme-accent-rgb), .06)";
                      }}
                      onMouseLeave={(e) => {
                        if (form.category !== c)
                          e.currentTarget.style.background = "transparent";
                      }}
                      style={{
                        padding: ".6rem 1rem",
                        fontSize: ".85rem",
                        cursor: "pointer",
                        borderLeft: `2px solid ${form.category === c ? "var(--theme-accent)" : "transparent"}`,
                        background:
                          form.category === c
                            ? "rgba(var(--theme-accent-rgb), .12)"
                            : "transparent",
                        color: form.category === c ? "#fff" : "#92898A",
                      }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label
                style={{
                  color: "var(--theme-text-primary)",
                  fontSize: ".75rem",
                  display: "block",
                  marginBottom: ".35rem",
                  letterSpacing: "1px",
                  opacity: 0.8,
                }}
              >
                DATE
              </label>
              <input
                type="date"
                value={form.date}
                disabled={isLocked("date")}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
                onFocus={(e) =>
                  (e.target.style.borderColor =
                    "rgba(var(--theme-accent-rgb), .45)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor =
                    "rgba(var(--theme-accent-rgb), .2)")
                }
                style={{
                  background: "rgba(5,15,25,.6)",
                  border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                  borderRadius: "8px",
                  padding: ".65rem .9rem",
                  color: "#fff",
                  width: "100%",
                  fontFamily: "Nova Square,sans-serif",
                  fontSize: ".88rem",
                  boxSizing: "border-box",
                  outline: "none",
                  colorScheme: "dark",
                  transition: "border .2s",
                  opacity: isLocked("date") ? 0.5 : 1,
                  cursor: isLocked("date") ? "not-allowed" : "text",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div
              style={{
                opacity: isLocked("time") ? 0.5 : 1,
                pointerEvents: isLocked("time") ? "none" : "auto",
              }}
            >
              <label
                style={{
                  color: "var(--theme-text-primary)",
                  fontSize: ".75rem",
                  display: "block",
                  marginBottom: ".35rem",
                  letterSpacing: "1px",
                  opacity: 0.8,
                }}
              >
                TIME <span style={{ color: "var(--theme-accent)" }}>*</span>
              </label>
              <div
                style={{ display: "flex", gap: ".4rem", alignItems: "center" }}
              >
                <select
                  value={form.timeHour}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, timeHour: e.target.value }))
                  }
                  style={{
                    flex: 1,
                    background: "rgba(5,15,25,.6)",
                    border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                    borderRadius: "8px",
                    padding: ".65rem .4rem",
                    color: "#fff",
                    fontFamily: "Nova Square,sans-serif",
                    fontSize: ".85rem",
                    outline: "none",
                    cursor: "pointer",
                    colorScheme: "dark",
                  }}
                >
                  {[
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    "10",
                    "11",
                    "12",
                  ].map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span
                  style={{
                    color: "var(--theme-text-primary)",
                    fontFamily: "Aldrich,sans-serif",
                    fontSize: "1rem",
                    opacity: 0.5,
                    flexShrink: 0,
                  }}
                >
                  :
                </span>
                <select
                  value={form.timeMin}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, timeMin: e.target.value }))
                  }
                  style={{
                    flex: 1,
                    background: "rgba(5,15,25,.6)",
                    border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                    borderRadius: "8px",
                    padding: ".65rem .4rem",
                    color: "#fff",
                    fontFamily: "Nova Square,sans-serif",
                    fontSize: ".85rem",
                    outline: "none",
                    cursor: "pointer",
                    colorScheme: "dark",
                  }}
                >
                  {[
                    "00",
                    "05",
                    "10",
                    "15",
                    "20",
                    "25",
                    "30",
                    "35",
                    "40",
                    "45",
                    "50",
                    "55",
                  ].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    display: "flex",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                    flexShrink: 0,
                  }}
                >
                  {["AM", "PM"].map((ap) => (
                    <button
                      key={ap}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, timeAmpm: ap }))}
                      style={{
                        padding: ".65rem .6rem",
                        background:
                          form.timeAmpm === ap
                            ? "rgba(var(--theme-accent-rgb), .25)"
                            : "rgba(5,15,25,.6)",
                        color:
                          form.timeAmpm === ap
                            ? "var(--theme-accent)"
                            : "#92898A",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "Aldrich,sans-serif",
                        fontSize: ".78rem",
                        letterSpacing: "1px",
                        transition: "all .2s",
                      }}
                    >
                      {ap}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label
                style={{
                  color: "var(--theme-text-primary)",
                  fontSize: ".75rem",
                  display: "block",
                  marginBottom: ".35rem",
                  letterSpacing: "1px",
                  opacity: 0.8,
                }}
              >
                LOCATION
              </label>
              <input
                value={form.location}
                onChange={(e) =>
                  setForm((p) => ({ ...p, location: e.target.value }))
                }
                placeholder="e.g. D-301"
                onFocus={(e) =>
                  (e.target.style.borderColor =
                    "rgba(var(--theme-accent-rgb), .45)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor =
                    "rgba(var(--theme-accent-rgb), .2)")
                }
                style={{
                  background: "rgba(5,15,25,.6)",
                  border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                  borderRadius: "8px",
                  padding: ".65rem .9rem",
                  color: "#fff",
                  width: "100%",
                  fontFamily: "Nova Square,sans-serif",
                  fontSize: ".88rem",
                  boxSizing: "border-box",
                  outline: "none",
                  transition: "border .2s",
                }}
              />
            </div>
          </div>

          {/* CHANGE 2: Registration Deadline with date + time picker */}
          <div>
            <label
              style={{
                color: "var(--theme-text-primary)",
                fontSize: ".75rem",
                display: "block",
                marginBottom: ".35rem",
                letterSpacing: "1px",
                opacity: 0.8,
              }}
            >
              REGISTRATION DEADLINE
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: ".6rem",
                alignItems: "flex-start",
              }}
            >
              <input
                type="date"
                value={form.registration_deadline}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    registration_deadline: e.target.value,
                  }))
                }
                onFocus={(e) =>
                  (e.target.style.borderColor =
                    "rgba(var(--theme-accent-rgb), .45)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor =
                    "rgba(var(--theme-accent-rgb), .2)")
                }
                style={{
                  background: "rgba(5,15,25,.6)",
                  border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                  borderRadius: "8px",
                  padding: ".65rem .9rem",
                  color: "#fff",
                  width: "100%",
                  fontFamily: "Nova Square,sans-serif",
                  fontSize: ".88rem",
                  boxSizing: "border-box",
                  outline: "none",
                  colorScheme: "dark",
                  transition: "border .2s",
                }}
              />
              {/* Time picker for deadline */}
              <div
                style={{ display: "flex", gap: ".35rem", alignItems: "center" }}
              >
                <select
                  value={form.registration_deadline_hour}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      registration_deadline_hour: e.target.value,
                    }))
                  }
                  style={{
                    background: "rgba(5,15,25,.6)",
                    border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                    borderRadius: "8px",
                    padding: ".65rem .4rem",
                    color: "#fff",
                    fontFamily: "Nova Square,sans-serif",
                    fontSize: ".85rem",
                    outline: "none",
                    cursor: "pointer",
                    colorScheme: "dark",
                  }}
                >
                  {[
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    "10",
                    "11",
                    "12",
                  ].map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span
                  style={{
                    color: "var(--theme-text-primary)",
                    opacity: 0.5,
                    fontFamily: "Aldrich,sans-serif",
                  }}
                >
                  :
                </span>
                <select
                  value={form.registration_deadline_min}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      registration_deadline_min: e.target.value,
                    }))
                  }
                  style={{
                    background: "rgba(5,15,25,.6)",
                    border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                    borderRadius: "8px",
                    padding: ".65rem .4rem",
                    color: "#fff",
                    fontFamily: "Nova Square,sans-serif",
                    fontSize: ".85rem",
                    outline: "none",
                    cursor: "pointer",
                    colorScheme: "dark",
                  }}
                >
                  {[
                    "00",
                    "05",
                    "10",
                    "15",
                    "20",
                    "25",
                    "30",
                    "35",
                    "40",
                    "45",
                    "50",
                    "55",
                  ].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    display: "flex",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                  }}
                >
                  {["AM", "PM"].map((ap) => (
                    <button
                      key={ap}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          registration_deadline_ampm: ap,
                        }))
                      }
                      style={{
                        padding: ".65rem .5rem",
                        background:
                          form.registration_deadline_ampm === ap
                            ? "rgba(var(--theme-accent-rgb), .25)"
                            : "rgba(5,15,25,.6)",
                        color:
                          form.registration_deadline_ampm === ap
                            ? "var(--theme-accent)"
                            : "#92898A",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "Aldrich,sans-serif",
                        fontSize: ".78rem",
                        letterSpacing: "1px",
                        transition: "all .2s",
                      }}
                    >
                      {ap}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label
              style={{
                color: "var(--theme-text-primary)",
                fontSize: ".75rem",
                display: "block",
                marginBottom: ".35rem",
                letterSpacing: "1px",
                opacity: 0.8,
              }}
            >
              HEADCOUNT (MAX)
            </label>
            <input
              type="number"
              min="1"
              value={form.max_participants}
              onChange={(e) =>
                setForm((p) => ({ ...p, max_participants: e.target.value }))
              }
              placeholder="e.g. 50"
              onFocus={(e) =>
                (e.target.style.borderColor =
                  "rgba(var(--theme-accent-rgb), .45)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor =
                  "rgba(var(--theme-accent-rgb), .2)")
              }
              style={{
                background: "rgba(5,15,25,.6)",
                border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                borderRadius: "8px",
                padding: ".65rem .9rem",
                color: "#fff",
                width: "100%",
                fontFamily: "Nova Square,sans-serif",
                fontSize: ".88rem",
                boxSizing: "border-box",
                outline: "none",
                transition: "border .2s",
              }}
            />
          </div>

          <div>
            <label
              style={{
                color: "var(--theme-text-primary)",
                fontSize: ".75rem",
                display: "block",
                marginBottom: ".35rem",
                letterSpacing: "1px",
                opacity: 0.8,
              }}
            >
              EVENT IMAGE URL{" "}
              <span
                style={{ color: "rgba(168,216,216,.35)", fontSize: ".72rem" }}
              >
                (optional)
              </span>
            </label>
            <input
              value={form.image_url}
              onChange={(e) =>
                setForm((p) => ({ ...p, image_url: e.target.value }))
              }
              placeholder="https://images.unsplash.com/..."
              onFocus={(e) =>
                (e.target.style.borderColor =
                  "rgba(var(--theme-accent-rgb), .45)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor =
                  "rgba(var(--theme-accent-rgb), .2)")
              }
              style={{
                background: "rgba(5,15,25,.6)",
                border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                borderRadius: "8px",
                padding: ".65rem .9rem",
                color: "#fff",
                width: "100%",
                fontFamily: "Nova Square,sans-serif",
                fontSize: ".88rem",
                boxSizing: "border-box",
                outline: "none",
                transition: "border .2s",
              }}
            />
            {form.image_url && (
              <img
                src={form.image_url}
                alt="preview"
                onError={(e) => (e.target.style.display = "none")}
                style={{
                  marginTop: ".5rem",
                  width: "100%",
                  height: "110px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  display: "block",
                }}
              />
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.background =
                  "linear-gradient(90deg,rgba(var(--theme-accent-rgb), .4),rgba(var(--theme-accent-rgb), .28))";
                e.currentTarget.style.borderColor =
                  "rgba(var(--theme-accent-rgb), .7)";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(90deg,rgba(var(--theme-accent-rgb), .25),rgba(var(--theme-accent-rgb), .15))";
              e.currentTarget.style.borderColor =
                "rgba(var(--theme-accent-rgb), .4)";
              e.currentTarget.style.color = "var(--theme-text-primary)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            style={{
              width: "100%",
              background:
                "linear-gradient(90deg,rgba(var(--theme-accent-rgb), .25),rgba(var(--theme-accent-rgb), .15))",
              border: "1px solid rgba(var(--theme-accent-rgb), .4)",
              color: "var(--theme-text-primary)",
              padding: ".85rem",
              borderRadius: "10px",
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "Aldrich,sans-serif",
              fontSize: ".9rem",
              letterSpacing: "1px",
              transition: "all .2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: ".5rem",
            }}
          >
            <Save size={15} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── View Details Modal ────────────────────────────────────────────────────────
const ViewDetailsModal = ({ item, type, onClose, onEdit }) => {
  if (!item) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background:
            "linear-gradient(135deg,var(--theme-bg-from),var(--theme-bg-mid),var(--theme-bg-to))",
          border: "1px solid rgba(var(--theme-accent-rgb), .15)",
          borderRadius: "18px",
          width: "100%",
          maxWidth: "560px",
          maxHeight: "88vh",
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(var(--theme-accent-rgb), .3) transparent",
        }}
      >
        {/* Image header */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "180px",
            overflow: "hidden",
            borderRadius: "18px 18px 0 0",
            flexShrink: 0,
          }}
        >
          <img
            src={eventImg(item)}
            alt={item.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = CAT_IMAGES.default;
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top,rgba(10,22,40,.95) 0%,rgba(10,22,40,.2) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background:
                "linear-gradient(90deg,var(--theme-accent),rgba(var(--theme-accent-rgb), .6),transparent)",
            }}
          />
          <button
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,83,80,.3)";
              e.currentTarget.style.borderColor = "rgba(239,83,80,.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,.4)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,.1)";
            }}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "rgba(0,0,0,.4)",
              border: "1px solid rgba(255,255,255,.1)",
              color: "#fff",
              cursor: "pointer",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              transition: "all .2s",
            }}
          >
            ✕
          </button>
          <span
            style={{
              position: "absolute",
              bottom: "1rem",
              left: "1.5rem",
              background: "rgba(0,0,0,.5)",
              color: "var(--theme-text-primary)",
              padding: ".25rem .75rem",
              borderRadius: "20px",
              fontSize: ".78rem",
              border: "1px solid rgba(var(--theme-accent-rgb), .35)",
            }}
          >
            {item.tag || item.category}
          </span>
        </div>

        <div style={{ padding: "1.75rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1rem",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "1.3rem",
                color: "#fff",
                lineHeight: 1.3,
                flex: 1,
                fontFamily: "Aldrich,sans-serif",
              }}
            >
              {item.title}
            </h2>
            {item.status && (
              <span
                style={{
                  padding: ".25rem .75rem",
                  borderRadius: "12px",
                  fontSize: ".75rem",
                  marginLeft: "1rem",
                  flexShrink: 0,
                  background:
                    item.status === "approved"
                      ? "rgba(76,175,80,.15)"
                      : item.status === "rejected"
                        ? "rgba(239,83,80,.15)"
                        : "rgba(255,183,77,.15)",
                  color:
                    item.status === "approved"
                      ? "#66BB6A"
                      : item.status === "rejected"
                        ? "#EF5350"
                        : "#FFB74D",
                }}
              >
                {item.status.toUpperCase()}
              </span>
            )}
          </div>

          {/* Meta fields */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: ".75rem",
              marginBottom: "1.25rem",
            }}
          >
            {item.date && (
              <span
                style={{
                  color: "var(--theme-text-primary)",
                  fontSize: ".85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: ".35rem",
                }}
              >
                📅 {item.date}
              </span>
            )}
            {item.time && (
              <span
                style={{
                  color: "var(--theme-text-primary)",
                  fontSize: ".85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: ".35rem",
                }}
              >
                🕐 {item.time}
              </span>
            )}
            {item.location && (
              <span
                style={{
                  color: "var(--theme-text-primary)",
                  fontSize: ".85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: ".35rem",
                }}
              >
                📍 {item.location}
              </span>
            )}
            {item.registration_deadline && (
              <span
                style={{
                  color: "var(--theme-text-primary)",
                  fontSize: ".85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: ".35rem",
                }}
              >
                ⏰ Deadline:{" "}
                {new Date(item.registration_deadline).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            {item.max_participants && (
              <span
                style={{
                  color: "var(--theme-text-primary)",
                  fontSize: ".85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: ".35rem",
                }}
              >
                🎯 Headcount: {item.registration_count || 0}/
                {item.max_participants}
              </span>
            )}
          </div>

          <p
            style={{
              color: "var(--theme-text-primary)",
              lineHeight: 1.7,
              marginBottom: "1.5rem",
              fontSize: ".95rem",
              opacity: 0.85,
            }}
          >
            {item.description || "No description provided for this event."}
          </p>

          <button
            onClick={() => {
              onClose();
              onEdit(item);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(90deg,rgba(var(--theme-accent-rgb), .4),rgba(var(--theme-accent-rgb), .28))";
              e.currentTarget.style.borderColor =
                "rgba(var(--theme-accent-rgb), .7)";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(90deg,rgba(var(--theme-accent-rgb), .25),rgba(var(--theme-accent-rgb), .15))";
              e.currentTarget.style.borderColor =
                "rgba(var(--theme-accent-rgb), .4)";
              e.currentTarget.style.color = "var(--theme-text-primary)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            style={{
              width: "100%",
              background:
                "linear-gradient(90deg,rgba(var(--theme-accent-rgb), .25),rgba(var(--theme-accent-rgb), .15))",
              border: "1px solid rgba(var(--theme-accent-rgb), .4)",
              color: "var(--theme-text-primary)",
              padding: ".85rem",
              borderRadius: "10px",
              cursor: "pointer",
              fontFamily: "Aldrich,sans-serif",
              fontSize: ".9rem",
              letterSpacing: "1px",
              transition: "all .2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: ".5rem",
            }}
          >
            <Edit3 size={15} />{" "}
            {item.status === "approved" ? "Edit" : "Edit This Event"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Attendance Modal ──────────────────────────────────────────────────────────
const AttendanceModal = ({ event, data, onClose, onRefresh }) => {
  const [attendees, setAttendees] = useState(
    Array.isArray(data?.attendees) ? data.attendees : [],
  );
  const [stats, setStats] = useState(data?.stats || {});
  const [marking, setMarking] = useState({});
  const markAll = async () => {
    const unmarked = attendees.filter((a) => !a.attended);
    for (const a of unmarked) {
      await markAttendance(a.user_id);
    }
  };
  const markAttendance = async (userId) => {
    setMarking((p) => ({ ...p, [userId]: true }));
    try {
      const res = await fetch(`${API}/events/${event.id}/mark-attendance`, {
        method: "POST",
        headers: authH(),
        body: JSON.stringify({ user_id: userId }),
      });
      const resData = await res.json();
      if (res.ok) {
        setAttendees((prev) =>
          prev.map((a) =>
            a.user_id === userId ? { ...a, attended: resData.attended } : a,
          ),
        );
        setStats((prev) => {
          const newAttended =
            attendees.filter((a) =>
              a.user_id === userId ? resData.attended === 1 : a.attended === 1,
            ).length + (resData.attended === 1 ? 0 : 0);
          return prev;
        });
        setAttendees((prev) => {
          const updated = prev.map((a) =>
            a.user_id === userId ? { ...a, attended: resData.attended } : a,
          );
          const attended = updated.filter((a) => a.attended === 1).length;
          setStats({
            registered: updated.length,
            attended,
            attendance_rate:
              updated.length > 0
                ? Math.round((attended / updated.length) * 100)
                : 0,
          });
          return updated;
        });
        if (onRefresh) onRefresh();
      } else {
        alert(resData.message || "Failed to mark attendance");
      }
    } catch {
      alert("Cannot connect to server.");
    } finally {
      setMarking((p) => ({ ...p, [userId]: false }));
    }
  };

  if (!event || !data) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2200,
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background:
            "linear-gradient(135deg,var(--theme-bg-from),var(--theme-bg-mid),var(--theme-bg-to))",
          border: "1px solid rgba(var(--theme-accent-rgb), .15)",
          borderRadius: "18px",
          width: "100%",
          maxWidth: "720px",
          maxHeight: "88vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            position: "relative",
            padding: "1.5rem 1.75rem 1.1rem",
            borderBottom: "1px solid rgba(var(--theme-accent-rgb), .08)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background:
                "linear-gradient(90deg,var(--theme-accent),rgba(var(--theme-accent-rgb), .6),transparent)",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 .2rem",
                  color: "var(--theme-accent)",
                  fontSize: "8px",
                  letterSpacing: "3px",
                  fontFamily: "Aldrich,sans-serif",
                }}
              >
                ATTENDANCE
              </p>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "Aldrich,sans-serif",
                  color: "var(--theme-text-primary)",
                  fontSize: "1.1rem",
                  letterSpacing: "1px",
                }}
              >
                {event.title}
              </h2>
              <p
                style={{
                  margin: ".35rem 0 0",
                  color: "#92898A",
                  fontSize: ".8rem",
                }}
              >
                {event.date}
                {event.time ? ` · ${event.time}` : ""}
              </p>
            </div>

            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#92898A",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: "1.25rem 1.75rem", overflowY: "auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "10px",
              marginBottom: "1.25rem",
            }}
          >
            {[
              {
                label: "REGISTERED",
                value: stats.registered ?? 0,
                color: "#4FC3F7",
              },
              {
                label: "ATTENDED",
                value: stats.attended ?? 0,
                color: "#66BB6A",
              },
              {
                label: "RATE",
                value: `${stats.attendance_rate ?? 0}%`,
                color: "#FFB74D",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "rgba(12,24,33,.5)",
                  border: "1px solid rgba(189,217,191,.08)",
                  borderRadius: "12px",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: "0 0 .4rem",
                    fontSize: "10px",
                    letterSpacing: "2px",
                    color: "#92898A",
                    fontFamily: "Aldrich,sans-serif",
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "1.6rem",
                    color: s.color,
                    fontFamily: "Aldrich,sans-serif",
                  }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              border: "1px solid rgba(189,217,191,.08)",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1fr 1.8fr",
                gap: "8px",
                padding: "1.25rem 1rem .75rem",
                background: "rgba(189,217,191,.06)",
                color: "#92898A",
                fontSize: ".75rem",
                letterSpacing: "1px",
              }}
            >
              <span>STUDENT</span>
              <span>EMAIL</span>
              <span>STATUS</span>
              <span
                style={{
                  textAlign: "right",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                {" "}
                ACTION
                <button
                  onClick={markAll}
                  style={{
                    padding: ".25rem .7rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: ".7rem",
                    fontFamily: "Nova Square,sans-serif",
                    background: "rgba(102,187,106,.12)",
                    border: "1px solid rgba(102,187,106,.3)",
                    color: "#66BB6A",
                    whiteSpace: "nowrap",
                  }}
                >
                  ✓ Mark All
                </button>
              </span>
            </div>
            {attendees.length === 0 ? (
              <div
                style={{
                  padding: "1.25rem",
                  color: "#92898A",
                  textAlign: "center",
                }}
              >
                No registrations yet.
              </div>
            ) : (
              attendees.map((a, i) => (
                <div
                  key={`${a.user_id || a.email}-${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 2fr 1fr 1.8fr",
                    gap: "8px",
                    padding: ".75rem 1rem",
                    borderTop: "1px solid rgba(189,217,191,.06)",
                    fontSize: ".85rem",
                    color: "#BDD9BF",
                    alignItems: "center",
                  }}
                >
                  <span>{a.full_name}</span>
                  <span
                    style={{
                      color: "#92898A",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.email}
                  </span>
                  <span style={{ color: a.attended ? "#66BB6A" : "#FFB74D" }}>
                    {a.attended ? "✓ Attended" : "○ Pending"}
                  </span>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => markAttendance(a.user_id)}
                      disabled={marking[a.user_id]}
                      style={{
                        padding: ".35rem .75rem",
                        borderRadius: "8px",
                        cursor: marking[a.user_id] ? "not-allowed" : "pointer",
                        fontSize: ".75rem",
                        fontFamily: "Nova Square,sans-serif",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        background: a.attended
                          ? "rgba(239,83,80,.12)"
                          : "rgba(102,187,106,.12)",
                        border: `1px solid ${a.attended ? "rgba(239,83,80,.3)" : "rgba(102,187,106,.3)"}`,
                        color: a.attended ? "#EF5350" : "#66BB6A",
                        opacity: marking[a.user_id] ? 0.6 : 1,
                      }}
                    >
                      {marking[a.user_id]
                        ? "..."
                        : a.attended
                          ? "Unmark"
                          : "Mark Attended"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const SocietyDashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [activeTab, setActiveTab] = useState("HOME");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllEventStats, setShowAllEventStats] = useState(false);
  const [carouselIndex1, setCarouselIndex1] = useState(0);

  // Data
  const [myEvents, setMyEvents] = useState([]);
  const [mySociety, setMySociety] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // UI state
  const [showNotifs, setShowNotifs] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditDna, setShowEditDna] = useState(false);
  const [viewDetail, setViewDetail] = useState(null);
  const [attendanceView, setAttendanceView] = useState(null);
  const [eventsFilter, setEventsFilter] = useState("all");

  // CHANGE 3: New event form with deadline time fields
  const [newEventForm, setNewEventForm] = useState({
    title: "",
    description: "",
    category: "Technical",
    date: "",
    time: "",
    timeHour: "12",
    timeMin: "00",
    timeAmpm: "AM",
    location: "",
    registration_deadline: "",
    registration_deadline_hour: "11",
    registration_deadline_min: "00",
    registration_deadline_ampm: "AM",
    image_url: "",
    max_participants: "",
    _ddOpen: false,
  });
  const [newEventMsg, setNewEventMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit profile form
  const [profileForm, setProfileForm] = useState({
    name: "",
    description: "",
    focus_areas: "",
    avatar_url: "",
    banner_url: "",
  });
  const [profileMsg, setProfileMsg] = useState("");
  // Password change state
  const [socEditTab, setSocEditTab] = useState("profile"); // "profile" | "password"
  const [socPwStep, setSocPwStep] = useState(1);
  const [socPwSecurityQuestion, setSocPwSecurityQuestion] = useState("");
  const [socPwSecurityAnswer, setSocPwSecurityAnswer] = useState("");
  const [socPwNew, setSocPwNew] = useState("");
  const [socPwConfirm, setSocPwConfirm] = useState("");
  const [socPwMsg, setSocPwMsg] = useState("");

  // Edit DNA form
  const [dnaForm, setDnaForm] = useState({
    mission: "",
    vision: "",
    values: "",
    tags: [],
  });
  const [dnaMsg, setDnaMsg] = useState("");

  const [platformName, setPlatformName] = useState("NUcleus");
  const [adminEmail, setAdminEmail] = useState("nucesadmin@gmail.com");
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchingRef = useRef(false);
  const fetchAll = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const [evts, socs, notifs, analyticsData] = await Promise.all([
        fetch(`${API}/society/events`, { headers: authH(), cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null),
        fetch(`${API}/societies`, { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null),
        fetch(`${API}/notifications`, { headers: authH(), cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null),
        fetch(`${API}/society/analytics`, {
          headers: authH(),
          cache: "no-store",
        })
          .then((r) => r.json())
          .catch(() => null),
      ]);
      if (Array.isArray(evts)) setMyEvents(evts);
      if (Array.isArray(socs)) {
        const mine = socs.find((s) => s.user_id === user.id);
        if (mine) {
          setMySociety(mine);
          setProfileForm({
            name: mine.name || "",
            description: mine.description || "",
            focus_areas: Array.isArray(mine.focus_areas)
              ? mine.focus_areas.join(", ")
              : mine.focus_areas || "",
            avatar_url: mine.avatar_url || "",
            banner_url: mine.banner_url || "",
          });
          setDnaForm({
            mission: mine.mission || "",
            vision: mine.vision || "",
            values: mine.values_text || "",
            tags: mine.focus_areas || [],
          });
        }
      }
      if (Array.isArray(notifs)) setNotifications(notifs);
      if (analyticsData && !analyticsData.message) setAnalytics(analyticsData);
    } finally {
      fetchingRef.current = false;
    }
  }, [user.full_name]);

  useEffect(() => {
    fetchAll();
    fetch(`${API}/settings`)
      .then((r) => r.json())
      .then((d) => {
        setPlatformName(d.platform_name || "NUcleus");
        setAdminEmail(d.contact_email || "nucesadmin@gmail.com");
      })
      .catch(() => {});
  }, [fetchAll]);
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchAll();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchAll]);

  // Carousel timers
  const homeCarousel = myEvents;
  useEffect(() => {
    if (homeCarousel.length < 2) return;
    const t = setInterval(
      () => setCarouselIndex1((p) => (p + 1) % homeCarousel.length),
      4000,
    );
    return () => clearInterval(t);
  }, [homeCarousel.length]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const dismissNotif = async (id) => {
    await fetch(`${API}/notifications/${id}`, {
      method: "DELETE",
      headers: authH(),
    });
    setNotifications((p) => p.filter((n) => n.id !== id));
  };
  const markAllRead = async () => {
    await fetch(`${API}/notifications/read-all`, {
      method: "PATCH",
      headers: authH(),
    });
    setNotifications((p) => p.map((n) => ({ ...n, is_read: 1 })));
    setShowNotifs(false);
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    setNewEventMsg("");
    setSubmitting(true);
    const f = newEventForm;
    if (!f.title.trim()) {
      setNewEventMsg("⚠️ Title is required.");
      setSubmitting(false);
      return;
    }
    if (!f.description.trim()) {
      setNewEventMsg("⚠️ Description is required.");
      setSubmitting(false);
      return;
    }
    if (!f.date) {
      setNewEventMsg("⚠️ Event date is required.");
      setSubmitting(false);
      return;
    }
    if (!f.location.trim()) {
      setNewEventMsg("⚠️ Location is required.");
      setSubmitting(false);
      return;
    }
    if (!f.registration_deadline) {
      setNewEventMsg("⚠️ Registration deadline is required.");
      setSubmitting(false);
      return;
    }

    // CHANGE 4: validate using full datetime for new event form
    const deadlineFull = new Date(
      `${f.registration_deadline} ${f.registration_deadline_hour}:${f.registration_deadline_min} ${f.registration_deadline_ampm}`,
    );
    const eventFull = new Date(
      `${f.date} ${f.timeHour}:${f.timeMin} ${f.timeAmpm}`,
    );
    if (deadlineFull >= eventFull) {
      setNewEventMsg("⚠️ Registration deadline must be before the event time.");
      setSubmitting(false);
      return;
    }

    if (
      f.max_participants !== "" &&
      (!Number.isInteger(Number(f.max_participants)) ||
        Number(f.max_participants) < 1)
    ) {
      setNewEventMsg("⚠️ Headcount must be a positive whole number.");
      setSubmitting(false);
      return;
    }
    try {
      const composedTime = `${f.timeHour}:${f.timeMin} ${f.timeAmpm}`;
      // CHANGE 3: include registration_deadline_time in POST body
      const res = await fetch(`${API}/events`, {
        method: "POST",
        headers: authH(),
        body: JSON.stringify({
          ...newEventForm,
          time: composedTime,
          registration_deadline_time: `${f.registration_deadline_hour}:${f.registration_deadline_min} ${f.registration_deadline_ampm}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNewEventMsg(data.message || "Failed");
        return;
      }
      setNewEventMsg("✅ Event submitted for admin approval!");
      // CHANGE 3: reset includes new deadline time fields
      setNewEventForm({
        title: "",
        description: "",
        category: "Technical",
        date: "",
        time: "",
        timeHour: "12",
        timeMin: "00",
        timeAmpm: "AM",
        location: "",
        registration_deadline: "",
        registration_deadline_hour: "11",
        registration_deadline_min: "00",
        registration_deadline_ampm: "AM",
        image_url: "",
        max_participants: "",
        _ddOpen: false,
      });
      fetchAll();
      setTimeout(() => {
        setShowNewEvent(false);
        setNewEventMsg("");
      }, 2000);
    } catch {
      setNewEventMsg("Cannot connect to server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileMsg("");
    const res = await fetch(`${API}/society/profile`, {
      method: "PATCH",
      headers: authH(),
      body: JSON.stringify({
        name: profileForm.name,
        description: profileForm.description,
        focus_areas: profileForm.focus_areas
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        avatar_url: profileForm.avatar_url || null,
        banner_url: profileForm.banner_url || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setProfileMsg(data.message || "Failed");
      return;
    }
    setProfileMsg("✅ Profile updated!");
    fetchAll();
    setTimeout(() => {
      setShowEditProfile(false);
      setProfileMsg("");
    }, 1500);
  };

  const handleSaveDna = async () => {
    setDnaMsg("");
    const res = await fetch(`${API}/society/dna`, {
      method: "PATCH",
      headers: authH(),
      body: JSON.stringify({
        mission: dnaForm.mission,
        vision: dnaForm.vision,
        values: dnaForm.values,
        tags: dnaForm.tags,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setDnaMsg(data.message || "Failed");
      return;
    }
    setDnaMsg("✅ DNA updated!");
    fetchAll();
    setTimeout(() => {
      setShowEditDna(false);
      setDnaMsg("");
    }, 1500);
  };

  const toggleRegistration = async (eventId, currentStatus) => {
    const res = await fetch(`${API}/events/${eventId}/toggle-registration`, {
      method: "PATCH",
      headers: authH(),
    });
    if (res.ok) {
      fetchAll();
      const data = await res.json();
      alert(data.message);
    } else {
      const data = await res.json();
      alert(data.message || "Failed to toggle registration");
    }
  };

  const viewAttendance = async (event) => {
    try {
      const res = await fetch(`${API}/events/${event.id}/attendance`, {
        headers: authH(),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to load attendance");
        return;
      }
      setAttendanceView({ event, data });
    } catch {
      alert("Cannot connect to server.");
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    const res = await fetch(`${API}/events/${eventId}`, {
      method: "DELETE",
      headers: authH(),
    });
    if (res.ok) {
      fetchAll();
    } else {
      const data = await res.json();
      alert(data.message || "Failed to delete event");
    }
  };

  // ── Filtered events ───────────────────────────────────────────────────────
  const filteredEvents = myEvents.filter((e) => {
    const matchStatus = eventsFilter === "all" || e.status === eventsFilter;
    const matchSearch =
      !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const searchedCarousel = homeCarousel.filter(
    (e) =>
      !searchQuery ||
      (e.title || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  const statusBadge = (status) => ({
    color:
      status === "approved"
        ? "#66BB6A"
        : status === "rejected"
          ? "#EF5350"
          : "#FFB74D",
    bg:
      status === "approved"
        ? "rgba(76,175,80,.15)"
        : status === "rejected"
          ? "rgba(239,83,80,.15)"
          : "rgba(255,183,77,.15)",
    icon:
      status === "approved" ? (
        <CheckCircle2 size={12} />
      ) : status === "rejected" ? (
        <XCircle size={12} />
      ) : (
        <Clock size={12} />
      ),
  });

  const CATEGORIES = [
    "Technical",
    "Competitions",
    "Career",
    "Social",
    "Arts",
    "Sports",
  ];

  const navItems = [
    { name: "HOME", icon: <Home size={20} /> },

    { name: "EVENTS", icon: <Calendar size={20} /> },
    { name: "ANALYTICS", icon: <BarChart3 size={20} /> },
    { name: "PROFILE", icon: <UserCircle size={20} /> },
  ];

  // ── Analytics data ────────────────────────────────────────────────────────
  const analyticsStats = [
    {
      label: "FOLLOWERS",
      value: analytics?.followers ?? "—",
      trend: "Students following you",
      icon: <Eye size={22} />,
    },
    {
      label: "EVENT SAVES",
      value: analytics?.totalBookmarks ?? "—",
      trend: "Bookmarked by students",
      icon: <Bookmark size={22} />,
    },
    {
      label: "REGISTRATIONS",
      value: analytics?.totalRegs ?? "—",
      trend: "Across all your events",
      icon: <Users size={22} />,
    },
    {
      label: "APPROVED EVENTS",
      value: analytics?.approvedEvents ?? "—",
      trend: `of ${analytics?.totalEvents ?? 0} total`,
      icon: <TrendingUp size={22} />,
    },
  ];

  const weeklyMax = analytics?.weeks
    ? Math.max(...analytics.weeks.map((w) => w.count), 1)
    : 1;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={`dashboard-container ${isCollapsed ? "sidebar-collapsed" : ""}`}
    >
      {/* ── Edit Event Modal ── */}
      {editEvent && (
        <EditEventModal
          event={editEvent}
          onClose={() => setEditEvent(null)}
          onSave={fetchAll}
        />
      )}

      {/* ── View Details Modal ── */}
      {viewDetail && (
        <ViewDetailsModal
          item={viewDetail.item}
          type={viewDetail.type}
          onClose={() => setViewDetail(null)}
          onEdit={(item) => setEditEvent(item)}
        />
      )}

      {attendanceView && (
        <AttendanceModal
          event={attendanceView.event}
          data={attendanceView.data}
          onClose={() => setAttendanceView(null)}
          onRefresh={fetchAll}
        />
      )}

      {/* ── Notifications Panel ── */}
      {showNotifs && (
        <NotificationsPanel
          notifications={notifications}
          onMarkAllAndClose={markAllRead}
          onClose={() => setShowNotifs(false)}
          onDismiss={dismissNotif}
        />
      )}

      {/* ── New Event Modal ── */}
      {showNewEvent && (
        <div
          onClick={() => setShowNewEvent(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background:
                "linear-gradient(135deg,var(--theme-bg-from),var(--theme-bg-mid),var(--theme-bg-to))",
              border: "1px solid rgba(var(--theme-accent-rgb), .15)",
              borderRadius: "18px",
              overflow: "hidden",
              width: "100%",
              maxWidth: "560px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                position: "relative",
                padding: "1.5rem 1.75rem 1.1rem",
                borderBottom: "1px solid rgba(var(--theme-accent-rgb), .08)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background:
                    "linear-gradient(90deg,var(--theme-accent),rgba(var(--theme-accent-rgb), .6),transparent)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 .15rem",
                      color: "var(--theme-accent)",
                      fontSize: "8px",
                      letterSpacing: "3px",
                      fontFamily: "Aldrich,sans-serif",
                    }}
                  >
                    SOCIETY EVENT
                  </p>
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: "Aldrich,sans-serif",
                      color: "var(--theme-text-primary)",
                      fontSize: "1.1rem",
                      letterSpacing: "1px",
                    }}
                  >
                    New Event
                  </h2>
                </div>
                <button
                  onClick={() => setShowNewEvent(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239,83,80,.15)";
                    e.currentTarget.style.borderColor = "rgba(239,83,80,.35)";
                    e.currentTarget.style.color = "#EF5350";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,.05)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,.08)";
                    e.currentTarget.style.color = "#92898A";
                  }}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,.05)",
                    border: "1px solid rgba(255,255,255,.08)",
                    color: "#92898A",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    transition: "all .2s",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmitEvent}
              style={{
                overflowY: "auto",
                padding: "1.25rem 1.75rem",
                display: "flex",
                flexDirection: "column",
                gap: ".9rem",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(var(--theme-accent-rgb), .3) transparent",
              }}
            >
              {newEventMsg && (
                <div
                  style={{
                    background: newEventMsg.startsWith("✅")
                      ? "rgba(76,175,80,.15)"
                      : "rgba(255,80,80,.15)",
                    border: `1px solid ${newEventMsg.startsWith("✅") ? "rgba(76,175,80,.4)" : "rgba(255,80,80,.4)"}`,
                    color: newEventMsg.startsWith("✅") ? "#81c784" : "#ff6b6b",
                    padding: ".75rem",
                    borderRadius: "8px",
                    fontSize: ".9rem",
                  }}
                >
                  {newEventMsg}
                </div>
              )}

              <div>
                <label
                  style={{
                    color: "var(--theme-text-primary)",
                    fontSize: ".75rem",
                    display: "block",
                    marginBottom: ".35rem",
                    letterSpacing: "1px",
                    opacity: 0.8,
                  }}
                >
                  TITLE <span style={{ color: "var(--theme-accent)" }}>*</span>
                </label>
                <input
                  name="title"
                  value={newEventForm.title}
                  onChange={(e) =>
                    setNewEventForm((p) => ({ ...p, title: e.target.value }))
                  }
                  required
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      "rgba(var(--theme-accent-rgb), .45)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor =
                      "rgba(var(--theme-accent-rgb), .2)")
                  }
                  style={{
                    background: "rgba(5,15,25,.6)",
                    border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                    borderRadius: "8px",
                    padding: ".65rem .9rem",
                    color: "#fff",
                    width: "100%",
                    fontFamily: "Nova Square,sans-serif",
                    fontSize: ".88rem",
                    boxSizing: "border-box",
                    outline: "none",
                    transition: "border .2s",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    color: "var(--theme-text-primary)",
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
                  value={newEventForm.description}
                  onChange={(e) =>
                    setNewEventForm((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      "rgba(var(--theme-accent-rgb), .45)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor =
                      "rgba(var(--theme-accent-rgb), .2)")
                  }
                  style={{
                    background: "rgba(5,15,25,.6)",
                    border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                    borderRadius: "8px",
                    padding: ".65rem .9rem",
                    color: "#fff",
                    width: "100%",
                    fontFamily: "Nova Square,sans-serif",
                    fontSize: ".88rem",
                    boxSizing: "border-box",
                    outline: "none",
                    resize: "vertical",
                    transition: "border .2s",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div style={{ position: "relative" }}>
                  <label
                    style={{
                      color: "var(--theme-text-primary)",
                      fontSize: ".75rem",
                      display: "block",
                      marginBottom: ".35rem",
                      letterSpacing: "1px",
                      opacity: 0.8,
                    }}
                  >
                    CATEGORY{" "}
                    <span style={{ color: "var(--theme-accent)" }}>*</span>
                  </label>
                  <div
                    onClick={() =>
                      setNewEventForm((p) => ({ ...p, _ddOpen: !p._ddOpen }))
                    }
                    style={{
                      background: "rgba(5,15,25,.6)",
                      border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                      borderRadius: "8px",
                      padding: ".65rem .9rem",
                      color: "#fff",
                      fontFamily: "Nova Square,sans-serif",
                      fontSize: ".88rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <span>{newEventForm.category}</span>
                    <span
                      style={{
                        color: "var(--theme-accent)",
                        fontSize: ".7rem",
                        transform: newEventForm._ddOpen
                          ? "rotate(180deg)"
                          : "rotate(0)",
                        transition: "transform .2s",
                      }}
                    >
                      ▼
                    </span>
                  </div>
                  {newEventForm._ddOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 300,
                        marginTop: "4px",
                        background: "#0d1a2e",
                        border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                        borderRadius: "8px",
                        overflow: "hidden",
                        boxShadow: "0 8px 24px rgba(0,0,0,.5)",
                      }}
                    >
                      {CATEGORIES.map((c) => (
                        <div
                          key={c}
                          onClick={() =>
                            setNewEventForm((p) => ({
                              ...p,
                              category: c,
                              _ddOpen: false,
                            }))
                          }
                          onMouseEnter={(e) => {
                            if (newEventForm.category !== c)
                              e.currentTarget.style.background =
                                "rgba(var(--theme-accent-rgb), .06)";
                          }}
                          onMouseLeave={(e) => {
                            if (newEventForm.category !== c)
                              e.currentTarget.style.background = "transparent";
                          }}
                          style={{
                            padding: ".6rem 1rem",
                            fontSize: ".85rem",
                            cursor: "pointer",
                            borderLeft: `2px solid ${newEventForm.category === c ? "var(--theme-accent)" : "transparent"}`,
                            background:
                              newEventForm.category === c
                                ? "rgba(var(--theme-accent-rgb), .12)"
                                : "transparent",
                            color:
                              newEventForm.category === c ? "#fff" : "#92898A",
                          }}
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label
                    style={{
                      color: "var(--theme-text-primary)",
                      fontSize: ".75rem",
                      display: "block",
                      marginBottom: ".35rem",
                      letterSpacing: "1px",
                      opacity: 0.8,
                    }}
                  >
                    DATE <span style={{ color: "var(--theme-accent)" }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={newEventForm.date}
                    onChange={(e) =>
                      setNewEventForm((p) => ({ ...p, date: e.target.value }))
                    }
                    required
                    onFocus={(e) =>
                      (e.target.style.borderColor =
                        "rgba(var(--theme-accent-rgb), .45)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor =
                        "rgba(var(--theme-accent-rgb), .2)")
                    }
                    style={{
                      background: "rgba(5,15,25,.6)",
                      border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                      borderRadius: "8px",
                      padding: ".65rem .9rem",
                      color: "#fff",
                      width: "100%",
                      fontFamily: "Nova Square,sans-serif",
                      fontSize: ".88rem",
                      boxSizing: "border-box",
                      outline: "none",
                      colorScheme: "dark",
                      transition: "border .2s",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    style={{
                      color: "var(--theme-text-primary)",
                      fontSize: ".75rem",
                      display: "block",
                      marginBottom: ".35rem",
                      letterSpacing: "1px",
                      opacity: 0.8,
                    }}
                  >
                    TIME <span style={{ color: "var(--theme-accent)" }}>*</span>
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: ".4rem",
                      alignItems: "center",
                    }}
                  >
                    <select
                      value={newEventForm.timeHour}
                      onChange={(e) =>
                        setNewEventForm((p) => ({
                          ...p,
                          timeHour: e.target.value,
                        }))
                      }
                      style={{
                        flex: 1,
                        background: "rgba(5,15,25,.6)",
                        border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                        borderRadius: "8px",
                        padding: ".65rem .4rem",
                        color: "#fff",
                        fontFamily: "Nova Square,sans-serif",
                        fontSize: ".85rem",
                        outline: "none",
                        cursor: "pointer",
                        colorScheme: "dark",
                      }}
                    >
                      {[
                        "1",
                        "2",
                        "3",
                        "4",
                        "5",
                        "6",
                        "7",
                        "8",
                        "9",
                        "10",
                        "11",
                        "12",
                      ].map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <span
                      style={{
                        color: "var(--theme-text-primary)",
                        fontFamily: "Aldrich,sans-serif",
                        fontSize: "1rem",
                        opacity: 0.5,
                        flexShrink: 0,
                      }}
                    >
                      :
                    </span>
                    <select
                      value={newEventForm.timeMin}
                      onChange={(e) =>
                        setNewEventForm((p) => ({
                          ...p,
                          timeMin: e.target.value,
                        }))
                      }
                      style={{
                        flex: 1,
                        background: "rgba(5,15,25,.6)",
                        border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                        borderRadius: "8px",
                        padding: ".65rem .4rem",
                        color: "#fff",
                        fontFamily: "Nova Square,sans-serif",
                        fontSize: ".85rem",
                        outline: "none",
                        cursor: "pointer",
                        colorScheme: "dark",
                      }}
                    >
                      {[
                        "00",
                        "05",
                        "10",
                        "15",
                        "20",
                        "25",
                        "30",
                        "35",
                        "40",
                        "45",
                        "50",
                        "55",
                      ].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <div
                      style={{
                        display: "flex",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                        flexShrink: 0,
                      }}
                    >
                      {["AM", "PM"].map((ap) => (
                        <button
                          key={ap}
                          type="button"
                          onClick={() =>
                            setNewEventForm((p) => ({ ...p, timeAmpm: ap }))
                          }
                          style={{
                            padding: ".65rem .6rem",
                            background:
                              newEventForm.timeAmpm === ap
                                ? "rgba(var(--theme-accent-rgb), .25)"
                                : "rgba(5,15,25,.6)",
                            color:
                              newEventForm.timeAmpm === ap
                                ? "var(--theme-accent)"
                                : "#92898A",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "Aldrich,sans-serif",
                            fontSize: ".78rem",
                            letterSpacing: "1px",
                            transition: "all .2s",
                          }}
                        >
                          {ap}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      color: "var(--theme-text-primary)",
                      fontSize: ".75rem",
                      display: "block",
                      marginBottom: ".35rem",
                      letterSpacing: "1px",
                      opacity: 0.8,
                    }}
                  >
                    LOCATION
                  </label>
                  <input
                    value={newEventForm.location}
                    onChange={(e) =>
                      setNewEventForm((p) => ({
                        ...p,
                        location: e.target.value,
                      }))
                    }
                    placeholder="e.g. D-301"
                    onFocus={(e) =>
                      (e.target.style.borderColor =
                        "rgba(var(--theme-accent-rgb), .45)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor =
                        "rgba(var(--theme-accent-rgb), .2)")
                    }
                    style={{
                      background: "rgba(5,15,25,.6)",
                      border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                      borderRadius: "8px",
                      padding: ".65rem .9rem",
                      color: "#fff",
                      width: "100%",
                      fontFamily: "Nova Square,sans-serif",
                      fontSize: ".88rem",
                      boxSizing: "border-box",
                      outline: "none",
                      transition: "border .2s",
                    }}
                  />
                </div>
              </div>

              {/* CHANGE 3: Registration Deadline with date + time picker for New Event form */}
              <div>
                <label
                  style={{
                    color: "var(--theme-text-primary)",
                    fontSize: ".75rem",
                    display: "block",
                    marginBottom: ".35rem",
                    letterSpacing: "1px",
                    opacity: 0.8,
                  }}
                >
                  REGISTRATION DEADLINE{" "}
                  <span style={{ color: "var(--theme-accent)" }}>*</span>
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: ".6rem",
                    alignItems: "flex-start",
                  }}
                >
                  <input
                    type="date"
                    value={newEventForm.registration_deadline}
                    onChange={(e) =>
                      setNewEventForm((p) => ({
                        ...p,
                        registration_deadline: e.target.value,
                      }))
                    }
                    onFocus={(e) =>
                      (e.target.style.borderColor =
                        "rgba(var(--theme-accent-rgb), .45)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor =
                        "rgba(var(--theme-accent-rgb), .2)")
                    }
                    style={{
                      background: "rgba(5,15,25,.6)",
                      border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                      borderRadius: "8px",
                      padding: ".65rem .9rem",
                      color: "#fff",
                      width: "100%",
                      fontFamily: "Nova Square,sans-serif",
                      fontSize: ".88rem",
                      boxSizing: "border-box",
                      outline: "none",
                      colorScheme: "dark",
                      transition: "border .2s",
                    }}
                  />
                  {/* Time picker for deadline */}
                  <div
                    style={{
                      display: "flex",
                      gap: ".35rem",
                      alignItems: "center",
                    }}
                  >
                    <select
                      value={newEventForm.registration_deadline_hour}
                      onChange={(e) =>
                        setNewEventForm((p) => ({
                          ...p,
                          registration_deadline_hour: e.target.value,
                        }))
                      }
                      style={{
                        background: "rgba(5,15,25,.6)",
                        border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                        borderRadius: "8px",
                        padding: ".65rem .4rem",
                        color: "#fff",
                        fontFamily: "Nova Square,sans-serif",
                        fontSize: ".85rem",
                        outline: "none",
                        cursor: "pointer",
                        colorScheme: "dark",
                      }}
                    >
                      {[
                        "1",
                        "2",
                        "3",
                        "4",
                        "5",
                        "6",
                        "7",
                        "8",
                        "9",
                        "10",
                        "11",
                        "12",
                      ].map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <span
                      style={{
                        color: "var(--theme-text-primary)",
                        opacity: 0.5,
                        fontFamily: "Aldrich,sans-serif",
                      }}
                    >
                      :
                    </span>
                    <select
                      value={newEventForm.registration_deadline_min}
                      onChange={(e) =>
                        setNewEventForm((p) => ({
                          ...p,
                          registration_deadline_min: e.target.value,
                        }))
                      }
                      style={{
                        background: "rgba(5,15,25,.6)",
                        border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                        borderRadius: "8px",
                        padding: ".65rem .4rem",
                        color: "#fff",
                        fontFamily: "Nova Square,sans-serif",
                        fontSize: ".85rem",
                        outline: "none",
                        cursor: "pointer",
                        colorScheme: "dark",
                      }}
                    >
                      {[
                        "00",
                        "05",
                        "10",
                        "15",
                        "20",
                        "25",
                        "30",
                        "35",
                        "40",
                        "45",
                        "50",
                        "55",
                      ].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <div
                      style={{
                        display: "flex",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                      }}
                    >
                      {["AM", "PM"].map((ap) => (
                        <button
                          key={ap}
                          type="button"
                          onClick={() =>
                            setNewEventForm((p) => ({
                              ...p,
                              registration_deadline_ampm: ap,
                            }))
                          }
                          style={{
                            padding: ".65rem .5rem",
                            background:
                              newEventForm.registration_deadline_ampm === ap
                                ? "rgba(var(--theme-accent-rgb), .25)"
                                : "rgba(5,15,25,.6)",
                            color:
                              newEventForm.registration_deadline_ampm === ap
                                ? "var(--theme-accent)"
                                : "#92898A",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "Aldrich,sans-serif",
                            fontSize: ".78rem",
                            letterSpacing: "1px",
                            transition: "all .2s",
                          }}
                        >
                          {ap}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label
                  style={{
                    color: "var(--theme-text-primary)",
                    fontSize: ".75rem",
                    display: "block",
                    marginBottom: ".35rem",
                    letterSpacing: "1px",
                    opacity: 0.8,
                  }}
                >
                  HEADCOUNT (MAX)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newEventForm.max_participants}
                  onChange={(e) =>
                    setNewEventForm((p) => ({
                      ...p,
                      max_participants: e.target.value,
                    }))
                  }
                  placeholder="e.g. 50"
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      "rgba(var(--theme-accent-rgb), .45)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor =
                      "rgba(var(--theme-accent-rgb), .2)")
                  }
                  style={{
                    background: "rgba(5,15,25,.6)",
                    border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                    borderRadius: "8px",
                    padding: ".65rem .9rem",
                    color: "#fff",
                    width: "100%",
                    fontFamily: "Nova Square,sans-serif",
                    fontSize: ".88rem",
                    boxSizing: "border-box",
                    outline: "none",
                    transition: "border .2s",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    color: "var(--theme-text-primary)",
                    fontSize: ".75rem",
                    display: "block",
                    marginBottom: ".35rem",
                    letterSpacing: "1px",
                    opacity: 0.8,
                  }}
                >
                  EVENT IMAGE URL{" "}
                  <span
                    style={{
                      color: "rgba(168,216,216,.35)",
                      fontSize: ".72rem",
                    }}
                  >
                    (optional)
                  </span>
                </label>
                <input
                  value={newEventForm.image_url}
                  onChange={(e) =>
                    setNewEventForm((p) => ({
                      ...p,
                      image_url: e.target.value,
                    }))
                  }
                  placeholder="https://images.unsplash.com/..."
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      "rgba(var(--theme-accent-rgb), .45)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor =
                      "rgba(var(--theme-accent-rgb), .2)")
                  }
                  style={{
                    background: "rgba(5,15,25,.6)",
                    border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                    borderRadius: "8px",
                    padding: ".65rem .9rem",
                    color: "#fff",
                    width: "100%",
                    fontFamily: "Nova Square,sans-serif",
                    fontSize: ".88rem",
                    boxSizing: "border-box",
                    outline: "none",
                    transition: "border .2s",
                  }}
                />
                {newEventForm.image_url && (
                  <img
                    src={newEventForm.image_url}
                    alt="preview"
                    onError={(e) => (e.target.style.display = "none")}
                    style={{
                      marginTop: ".5rem",
                      width: "100%",
                      height: "110px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background =
                      "linear-gradient(90deg,rgba(var(--theme-accent-rgb), .4),rgba(var(--theme-accent-rgb), .28))";
                    e.currentTarget.style.borderColor =
                      "rgba(var(--theme-accent-rgb), .7)";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(90deg,rgba(var(--theme-accent-rgb), .25),rgba(var(--theme-accent-rgb), .15))";
                  e.currentTarget.style.borderColor =
                    "rgba(var(--theme-accent-rgb), .4)";
                  e.currentTarget.style.color = "var(--theme-text-primary)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                style={{
                  width: "100%",
                  background:
                    "linear-gradient(90deg,rgba(var(--theme-accent-rgb), .25),rgba(var(--theme-accent-rgb), .15))",
                  border: "1px solid rgba(var(--theme-accent-rgb), .4)",
                  color: "var(--theme-text-primary)",
                  padding: ".85rem",
                  borderRadius: "10px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "Aldrich,sans-serif",
                  fontSize: ".9rem",
                  letterSpacing: "1px",
                  marginTop: ".25rem",
                  transition: "all .2s",
                }}
              >
                {submitting ? "Submitting..." : "Submit for Approval"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {showEditProfile && (
        <div
          onClick={() => {
            setShowEditProfile(false);
            setSocEditTab("profile");
            setSocPwStep(1);
            setSocPwMsg("");
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(135deg,#0c1821,#0d1f2d,#0c1821)",
              border: "1px solid rgba(189,217,191,.1)",
              borderRadius: "18px",
              overflow: "hidden",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                position: "relative",
                padding: "1.5rem 1.75rem 1rem",
                borderBottom: "1px solid rgba(189,217,191,.08)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background:
                    "linear-gradient(90deg,#BDD9BF,rgba(189,217,191,.6),transparent)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 .15rem",
                      color: "#BDD9BF",
                      fontSize: "8px",
                      letterSpacing: "3px",
                      fontFamily: "Aldrich,sans-serif",
                    }}
                  >
                    SOCIETY ADMIN
                  </p>
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: "Aldrich,sans-serif",
                      color: "#fff",
                      fontSize: "1.1rem",
                      letterSpacing: "1px",
                    }}
                  >
                    Edit Profile
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowEditProfile(false);
                    setSocEditTab("profile");
                    setSocPwStep(1);
                    setSocPwMsg("");
                  }}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,.05)",
                    border: "1px solid rgba(255,255,255,.08)",
                    color: "#92898A",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                  }}
                >
                  ✕
                </button>
              </div>
              {/* Tabs */}
              <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem" }}>
                {[
                  { key: "profile", label: "✏️ Profile" },
                  { key: "password", label: "🔒 Change Password" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => {
                      setSocEditTab(t.key);
                      setProfileMsg("");
                      setSocPwMsg("");
                      setSocPwStep(1);
                      setSocPwSecurityAnswer("");
                      setSocPwNew("");
                      setSocPwConfirm("");
                    }}
                    style={{
                      padding: ".35rem .9rem",
                      borderRadius: "20px",
                      cursor: "pointer",
                      fontFamily: "Nova Square,sans-serif",
                      fontSize: ".78rem",
                      transition: "all .2s",
                      background:
                        socEditTab === t.key
                          ? "rgba(189,217,191,.15)"
                          : "rgba(5,15,25,.5)",
                      border: `1px solid ${socEditTab === t.key ? "rgba(189,217,191,.35)" : "rgba(189,217,191,.1)"}`,
                      color:
                        socEditTab === t.key
                          ? "#BDD9BF"
                          : "rgba(189,217,191,.35)",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div
              style={{
                overflowY: "auto",
                padding: "1.25rem 1.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                scrollbarWidth: "thin",
              }}
            >
              {socEditTab === "profile" ? (
                <>
                  {profileMsg && (
                    <div
                      style={{
                        background: profileMsg.startsWith("✅")
                          ? "rgba(76,175,80,.15)"
                          : "rgba(255,80,80,.15)",
                        border: `1px solid ${profileMsg.startsWith("✅") ? "rgba(76,175,80,.4)" : "rgba(255,80,80,.4)"}`,
                        color: profileMsg.startsWith("✅")
                          ? "#81c784"
                          : "#ff6b6b",
                        padding: ".75rem",
                        borderRadius: "8px",
                        fontSize: ".88rem",
                      }}
                    >
                      {profileMsg}
                    </div>
                  )}
                  {[
                    {
                      label: "SOCIETY NAME",
                      field: "name",
                      type: "text",
                      placeholder: "Society name",
                    },
                    {
                      label: "DESCRIPTION",
                      field: "description",
                      type: "textarea",
                      placeholder: "Brief description",
                    },
                    {
                      label: "FOCUS AREAS",
                      field: "focus_areas",
                      type: "text",
                      placeholder: "e.g. Tech, Arts",
                    },
                    {
                      label: "AVATAR URL",
                      field: "avatar_url",
                      type: "url",
                      placeholder: "https://...",
                    },
                    {
                      label: "BANNER URL",
                      field: "banner_url",
                      type: "url",
                      placeholder: "https://...",
                    },
                  ].map(({ label, field, type, placeholder }) => (
                    <div key={field}>
                      <label
                        style={{
                          color: "#BDD9BF",
                          fontSize: ".75rem",
                          display: "block",
                          marginBottom: ".4rem",
                          letterSpacing: "1px",
                          opacity: 0.8,
                        }}
                      >
                        {label}
                      </label>
                      {type === "textarea" ? (
                        <textarea
                          rows={3}
                          placeholder={placeholder}
                          value={profileForm[field]}
                          onChange={(e) =>
                            setProfileForm((p) => ({
                              ...p,
                              [field]: e.target.value,
                            }))
                          }
                          style={{
                            background: "rgba(5,15,25,.6)",
                            border: "1px solid rgba(189,217,191,.2)",
                            borderRadius: "8px",
                            padding: ".7rem 1rem",
                            color: "#fff",
                            width: "100%",
                            fontFamily: "Nova Square,sans-serif",
                            fontSize: ".9rem",
                            boxSizing: "border-box",
                            outline: "none",
                            resize: "vertical",
                          }}
                        />
                      ) : (
                        <input
                          type={type}
                          placeholder={placeholder}
                          value={profileForm[field]}
                          onChange={(e) =>
                            setProfileForm((p) => ({
                              ...p,
                              [field]: e.target.value,
                            }))
                          }
                          style={{
                            background: "rgba(5,15,25,.6)",
                            border: "1px solid rgba(189,217,191,.2)",
                            borderRadius: "8px",
                            padding: ".7rem 1rem",
                            color: "#fff",
                            width: "100%",
                            fontFamily: "Nova Square,sans-serif",
                            fontSize: ".9rem",
                            boxSizing: "border-box",
                            outline: "none",
                          }}
                        />
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleSaveProfile}
                    style={{
                      width: "100%",
                      background:
                        "linear-gradient(90deg,rgba(189,217,191,.2),rgba(189,217,191,.1))",
                      border: "1px solid rgba(189,217,191,.35)",
                      color: "#BDD9BF",
                      padding: ".85rem",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontFamily: "Aldrich,sans-serif",
                      fontSize: ".95rem",
                      letterSpacing: "1px",
                    }}
                  >
                    Save Profile
                  </button>
                </>
              ) : (
                /* ── Change Password Tab ── */
                <>
                  {socPwMsg && (
                    <div
                      style={{
                        background: socPwMsg.startsWith("✅")
                          ? "rgba(76,175,80,.15)"
                          : "rgba(255,80,80,.15)",
                        border: `1px solid ${socPwMsg.startsWith("✅") ? "rgba(76,175,80,.4)" : "rgba(255,80,80,.4)"}`,
                        color: socPwMsg.startsWith("✅")
                          ? "#81c784"
                          : "#ff6b6b",
                        padding: ".75rem",
                        borderRadius: "8px",
                        fontSize: ".88rem",
                      }}
                    >
                      {socPwMsg}
                    </div>
                  )}
                  {socPwStep === 1 ? (
                    <>
                      <div
                        style={{ textAlign: "center", padding: "1rem 0 .5rem" }}
                      >
                        <div
                          style={{ fontSize: "2rem", marginBottom: ".5rem" }}
                        >
                          🔒
                        </div>
                        <p
                          style={{
                            color: "#92898A",
                            fontSize: ".88rem",
                            margin: 0,
                          }}
                        >
                          To protect your account, you must verify your security
                          question before changing your password.
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          setSocPwMsg("");
                          try {
                            const res = await fetch(
                              `${API}/auth/security-question`,
                              { headers: authH() },
                            );
                            const data = await res.json();
                            if (!res.ok) {
                              setSocPwMsg(
                                data.message ||
                                  "Failed to load security question",
                              );
                              return;
                            }
                            setSocPwSecurityQuestion(data.security_question);
                            setSocPwStep(2);
                          } catch {
                            setSocPwMsg("Network error");
                          }
                        }}
                        style={{
                          width: "100%",
                          background:
                            "linear-gradient(90deg,rgba(189,217,191,.2),rgba(189,217,191,.1))",
                          border: "1px solid rgba(189,217,191,.35)",
                          color: "#BDD9BF",
                          padding: ".85rem",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontFamily: "Aldrich,sans-serif",
                          fontSize: ".95rem",
                          letterSpacing: "1px",
                        }}
                      >
                        Continue →
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <label
                          style={{
                            color: "#BDD9BF",
                            fontSize: ".75rem",
                            display: "block",
                            marginBottom: ".4rem",
                            letterSpacing: "1px",
                            opacity: 0.8,
                          }}
                        >
                          SECURITY QUESTION
                        </label>
                        <div
                          style={{
                            background: "rgba(5,15,25,.4)",
                            border: "1px solid rgba(189,217,191,.15)",
                            borderRadius: "8px",
                            padding: ".75rem 1rem",
                            color: "#BDD9BF",
                            fontSize: ".9rem",
                            fontFamily: "Nova Square,sans-serif",
                          }}
                        >
                          {socPwSecurityQuestion}
                        </div>
                      </div>
                      {[
                        {
                          label: "YOUR ANSWER",
                          val: socPwSecurityAnswer,
                          set: setSocPwSecurityAnswer,
                          type: "text",
                          ph: "Enter your answer",
                        },
                        {
                          label: "NEW PASSWORD",
                          val: socPwNew,
                          set: setSocPwNew,
                          type: "password",
                          ph: "At least 6 characters",
                        },
                        {
                          label: "CONFIRM NEW PASSWORD",
                          val: socPwConfirm,
                          set: setSocPwConfirm,
                          type: "password",
                          ph: "Repeat new password",
                        },
                      ].map(({ label, val, set, type, ph }) => (
                        <div key={label}>
                          <label
                            style={{
                              color: "#BDD9BF",
                              fontSize: ".75rem",
                              display: "block",
                              marginBottom: ".4rem",
                              letterSpacing: "1px",
                              opacity: 0.8,
                            }}
                          >
                            {label}
                          </label>
                          <input
                            type={type}
                            placeholder={ph}
                            value={val}
                            onChange={(e) => set(e.target.value)}
                            style={{
                              background: "rgba(5,15,25,.6)",
                              border: "1px solid rgba(189,217,191,.2)",
                              borderRadius: "8px",
                              padding: ".7rem 1rem",
                              color: "#fff",
                              width: "100%",
                              fontFamily: "Nova Square,sans-serif",
                              fontSize: ".9rem",
                              boxSizing: "border-box",
                              outline: "none",
                            }}
                          />
                        </div>
                      ))}
                      <button
                        onClick={async () => {
                          setSocPwMsg("");
                          if (!socPwSecurityAnswer.trim()) {
                            setSocPwMsg("Please enter your security answer");
                            return;
                          }
                          if (!socPwNew || socPwNew.length < 6) {
                            setSocPwMsg(
                              "New password must be at least 6 characters",
                            );
                            return;
                          }
                          if (socPwNew !== socPwConfirm) {
                            setSocPwMsg("Passwords do not match");
                            return;
                          }
                          try {
                            const res = await fetch(
                              `${API}/auth/change-password`,
                              {
                                method: "POST",
                                headers: authH(),
                                body: JSON.stringify({
                                  security_answer: socPwSecurityAnswer,
                                  newPassword: socPwNew,
                                }),
                              },
                            );
                            const data = await res.json();
                            if (!res.ok) {
                              setSocPwMsg(
                                data.message || "Failed to change password",
                              );
                              return;
                            }
                            setSocPwMsg("✅ Password changed successfully!");
                            setSocPwSecurityAnswer("");
                            setSocPwNew("");
                            setSocPwConfirm("");
                            setTimeout(() => {
                              setShowEditProfile(false);
                              setSocPwStep(1);
                              setSocPwMsg("");
                              setSocEditTab("profile");
                            }, 1500);
                          } catch {
                            setSocPwMsg("Network error");
                          }
                        }}
                        style={{
                          width: "100%",
                          background:
                            "linear-gradient(90deg,rgba(189,217,191,.2),rgba(189,217,191,.1))",
                          border: "1px solid rgba(189,217,191,.35)",
                          color: "#BDD9BF",
                          padding: ".85rem",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontFamily: "Aldrich,sans-serif",
                          fontSize: ".95rem",
                          letterSpacing: "1px",
                        }}
                      >
                        Change Password
                      </button>
                      <button
                        onClick={() => {
                          setSocPwStep(1);
                          setSocPwMsg("");
                          setSocPwSecurityAnswer("");
                          setSocPwNew("");
                          setSocPwConfirm("");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#92898A",
                          cursor: "pointer",
                          fontFamily: "Nova Square,sans-serif",
                          fontSize: ".8rem",
                          textAlign: "center",
                        }}
                      >
                        ← Back
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit DNA Modal ── */}
      {showEditDna && (
        <div
          onClick={() => setShowEditDna(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background:
                "linear-gradient(135deg,var(--theme-bg-from),var(--theme-bg-mid),var(--theme-bg-to))",
              border: "1px solid rgba(var(--theme-accent-rgb), .15)",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "540px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(var(--theme-accent-rgb), .3) transparent",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-2rem",
                  left: "-2rem",
                  right: "-2rem",
                  height: "3px",
                  background:
                    "linear-gradient(90deg,var(--theme-accent),rgba(var(--theme-accent-rgb), .6),transparent)",
                }}
              />
              <div>
                <p
                  style={{
                    margin: "0 0 .15rem",
                    color: "var(--theme-accent)",
                    fontSize: "8px",
                    letterSpacing: "3px",
                    fontFamily: "Aldrich,sans-serif",
                  }}
                >
                  SOCIETY DNA
                </p>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "Aldrich,sans-serif",
                    color: "var(--theme-text-primary)",
                    fontSize: "1.1rem",
                  }}
                >
                  EDIT SOCIETY DNA
                </h2>
              </div>
              <button
                onClick={() => setShowEditDna(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239,83,80,.15)";
                  e.currentTarget.style.borderColor = "rgba(239,83,80,.35)";
                  e.currentTarget.style.color = "#EF5350";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,.05)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,.08)";
                  e.currentTarget.style.color = "#92898A";
                }}
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.08)",
                  color: "#92898A",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  transition: "all .2s",
                }}
              >
                ✕
              </button>
            </div>
            {dnaMsg && (
              <div
                style={{
                  background: dnaMsg.startsWith("✅")
                    ? "rgba(76,175,80,.15)"
                    : "rgba(255,80,80,.15)",
                  border: `1px solid ${dnaMsg.startsWith("✅") ? "rgba(76,175,80,.4)" : "rgba(255,80,80,.4)"}`,
                  color: dnaMsg.startsWith("✅") ? "#81c784" : "#ff6b6b",
                  padding: ".75rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  fontSize: ".88rem",
                }}
              >
                {dnaMsg}
              </div>
            )}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {[
                ["Mission 🎯", "mission"],
                ["Vision 🌍", "vision"],
              ].map(([lbl, key]) => (
                <div key={key}>
                  <label
                    style={{
                      color: "var(--theme-text-primary)",
                      fontSize: ".75rem",
                      display: "block",
                      marginBottom: ".4rem",
                      opacity: 0.8,
                      letterSpacing: "1px",
                    }}
                  >
                    {lbl}
                  </label>
                  <textarea
                    value={dnaForm[key]}
                    onChange={(e) =>
                      setDnaForm((p) => ({ ...p, [key]: e.target.value }))
                    }
                    rows={3}
                    onFocus={(e) =>
                      (e.target.style.borderColor =
                        "rgba(var(--theme-accent-rgb), .45)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor =
                        "rgba(var(--theme-accent-rgb), .2)")
                    }
                    style={{
                      background: "rgba(5,15,25,.6)",
                      border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                      borderRadius: "8px",
                      padding: ".65rem .9rem",
                      color: "#fff",
                      width: "100%",
                      fontFamily: "Nova Square,sans-serif",
                      fontSize: ".88rem",
                      boxSizing: "border-box",
                      outline: "none",
                      resize: "vertical",
                      transition: "border .2s",
                    }}
                  />
                </div>
              ))}
              <div>
                <label
                  style={{
                    color: "var(--theme-text-primary)",
                    fontSize: ".75rem",
                    display: "block",
                    marginBottom: ".4rem",
                    opacity: 0.8,
                    letterSpacing: "1px",
                  }}
                >
                  Values 💡{" "}
                  <span style={{ color: "#685369", fontSize: ".78rem" }}>
                    (one per line)
                  </span>
                </label>
                <textarea
                  value={dnaForm.values}
                  onChange={(e) =>
                    setDnaForm((p) => ({ ...p, values: e.target.value }))
                  }
                  rows={4}
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      "rgba(var(--theme-accent-rgb), .45)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor =
                      "rgba(var(--theme-accent-rgb), .2)")
                  }
                  style={{
                    background: "rgba(5,15,25,.6)",
                    border: "1px solid rgba(var(--theme-accent-rgb), .2)",
                    borderRadius: "8px",
                    padding: ".65rem .9rem",
                    color: "#fff",
                    width: "100%",
                    fontFamily: "Nova Square,sans-serif",
                    fontSize: ".88rem",
                    boxSizing: "border-box",
                    outline: "none",
                    resize: "vertical",
                    transition: "border .2s",
                  }}
                />
              </div>

              <button
                onClick={handleSaveDna}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(90deg,rgba(var(--theme-accent-rgb), .4),rgba(var(--theme-accent-rgb), .28))";
                  e.currentTarget.style.borderColor =
                    "rgba(var(--theme-accent-rgb), .7)";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(90deg,rgba(var(--theme-accent-rgb), .25),rgba(var(--theme-accent-rgb), .15))";
                  e.currentTarget.style.borderColor =
                    "rgba(var(--theme-accent-rgb), .4)";
                  e.currentTarget.style.color = "var(--theme-text-primary)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                style={{
                  background:
                    "linear-gradient(90deg,rgba(var(--theme-accent-rgb), .25),rgba(var(--theme-accent-rgb), .15))",
                  border: "1px solid rgba(var(--theme-accent-rgb), .4)",
                  color: "var(--theme-text-primary)",
                  padding: ".85rem",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontFamily: "Aldrich,sans-serif",
                  fontSize: ".9rem",
                  letterSpacing: "1px",
                  transition: "all .2s",
                  width: "100%",
                }}
              >
                Save DNA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-logo">
          {!isCollapsed && <OrbitLogo />}
          {isCollapsed && <div className="collapsed-logo">NU</div>}
        </div>
        <button
          className="sidebar-toggle-boundary"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activeTab === item.name ? "active" : ""}`}
              onClick={() => setActiveTab(item.name)}
              title={isCollapsed ? item.name : ""}
            >
              {item.icon}
              {!isCollapsed && <span>{item.name}</span>}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: "auto", paddingBottom: ".5rem" }}>
          {!isCollapsed && (
            <div
              style={{
                padding: ".75rem .75rem .5rem",
                borderTop: "1px solid rgba(255,255,255,.05)",
              }}
            >
              <p
                style={{
                  margin: "0 0 .5rem",
                  color: "#92898A",
                  fontSize: "9px",
                  letterSpacing: "2px",
                  fontFamily: "Aldrich,sans-serif",
                }}
              >
                THEME
              </p>
              <div
                style={{ display: "flex", gap: "6px", alignItems: "center" }}
              >
                {[
                  {
                    id: "ocean",
                    from: "#0c1821",
                    to: "#16425B",
                    accent: "#4FC3F7",
                  },
                  {
                    id: "dusk",
                    from: "#1a0f1a",
                    to: "#3d2440",
                    accent: "#f0a0c8",
                  },
                  {
                    id: "ember",
                    from: "#150e08",
                    to: "#2e2010",
                    accent: "#ffb347",
                  },
                ].map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      background: `linear-gradient(135deg,${t.from},${t.to})`,
                      border:
                        theme === t.id
                          ? `2px solid ${t.accent}`
                          : t.id === "ocean"
                            ? "2px solid rgba(79,195,247,.4)"
                            : t.id === "dusk"
                              ? "2px solid rgba(240,160,200,.4)"
                              : t.id === "ember"
                                ? "2px solid rgba(255,179,71,.4)"
                                : "2px solid transparent",
                      opacity: theme === t.id ? 1 : 0.7,
                      transform: theme === t.id ? "scale(1.2)" : "scale(1)",
                      transition: "all .2s",
                      flexShrink: 0,
                    }}
                  />
                ))}
                <span
                  style={{
                    color: "var(--theme-accent)",
                    fontSize: "9px",
                    marginLeft: "2px",
                    letterSpacing: "1px",
                    textTransform: "capitalize",
                  }}
                >
                  {theme}
                </span>
              </div>
            </div>
          )}
          <button
            className="nav-item"
            onClick={handleLogout}
            style={{
              color: "#EF5350",
              borderTop: "1px solid rgba(255,255,255,.05)",
              width: "100%",
            }}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>LOGOUT</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          {activeTab === "EVENTS" ? (
            <div className="header-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          ) : (
            <div />
          )}
          <div className="header-profile">
            {/* Bell with badge */}
            <button
              className="icon-btn bell-header"
              style={{ position: "relative" }}
              onClick={() => setShowNotifs(true)}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "#EF5350",
                    color: "#fff",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    fontSize: ".65rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {/* User icon → profile */}
            <div
              className="user-info-stack"
              style={{ cursor: "pointer" }}
              onClick={() => setActiveTab("PROFILE")}
            >
              <div className="profile-row-top">
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(189,217,191,.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    color: "#BDD9BF",
                    border: "1px solid rgba(189,217,191,.2)",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {mySociety?.avatar_url ? (
                    <img
                      src={mySociety.avatar_url}
                      alt="avatar"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    (user.full_name || "S").charAt(0).toUpperCase()
                  )}
                </div>
                <span className="user-name">
                  {mySociety?.name || user.full_name}
                </span>
              </div>
              <div className="profile-row-bottom">
                <span className="user-role">Society Admin</span>
                <ChevronDown size={14} className="chevron-profile" />
              </div>
            </div>
          </div>
        </header>

        <section className="dashboard-body">
          {/* ════════ HOME ════════ */}
          {activeTab === "HOME" && (
            <>
              <div className="body-header">
                <h1 className="welcome-text">HOME</h1>
                <button
                  className="filter-btn soc-add-btn"
                  onClick={() => setShowNewEvent(true)}
                >
                  <PlusCircle size={16} />
                  <span>Post Event</span>
                </button>
              </div>

              {/* Posted Events carousel */}
              <div className="carousel-section">
                <h2 className="section-title">YOUR POSTED EVENTS</h2>
                {homeCarousel.length === 0 ? (
                  <p style={{ color: "#92898A" }}>No events posted yet.</p>
                ) : (
                  <div className="carousel-container">
                    <div
                      className="carousel-track"
                      style={{
                        transform: `translateX(-${carouselIndex1 * 100}%)`,
                      }}
                    >
                      {(searchQuery ? searchedCarousel : homeCarousel).map(
                        (ev) => (
                          <div key={ev.id} className="carousel-card">
                            <div className="card-image">
                              <img
                                src={eventImg(ev)}
                                alt={ev.title}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = CAT_IMAGES.default;
                                }}
                              />
                              <span className="card-tag">
                                {ev.tag || ev.category}
                              </span>
                            </div>
                            <div className="card-content">
                              <h3
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                  setViewDetail({ item: ev, type: "event" })
                                }
                              >
                                {ev.title}
                              </h3>
                              <p className="organizer">
                                {ev.organizer || mySociety?.name}
                              </p>
                              <p className="date">{ev.date}</p>
                              {ev.status && (
                                <p
                                  style={{
                                    fontSize: ".78rem",
                                    marginTop: ".2rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: ".3rem",
                                    color: statusBadge(ev.status).color,
                                  }}
                                >
                                  {statusBadge(ev.status).icon}{" "}
                                  {ev.status.toUpperCase()}
                                </p>
                              )}
                              <div className="card-actions">
                                {ev.id && !String(ev.id).startsWith("s") ? (
                                  <button
                                    className="action-btn save"
                                    onClick={() => setEditEvent(ev)}
                                  >
                                    <Edit3 size={16} />
                                    <span>Edit</span>
                                  </button>
                                ) : (
                                  <button
                                    className="action-btn save"
                                    onClick={() => setShowNewEvent(true)}
                                  >
                                    <PlusCircle size={16} />
                                    <span>Post New</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════════ PROFILE ════════ */}
          {activeTab === "PROFILE" && (
            <div className="soc-tab-view">
              <div className="body-header">
                <h1 className="welcome-text">PROFILE</h1>
              </div>
              <div className="soc-profile-card">
                <div
                  className="soc-profile-banner"
                  style={
                    mySociety?.banner_url
                      ? {
                          backgroundImage: `url(${mySociety.banner_url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : {}
                  }
                ></div>
                <div className="soc-profile-body">
                  {mySociety?.avatar_url ? (
                    <img
                      src={mySociety.avatar_url}
                      alt="Society"
                      className="soc-profile-avatar"
                    />
                  ) : (
                    <div
                      className="soc-profile-avatar"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(189,217,191,.15)",
                        color: "#BDD9BF",
                        fontSize: "2rem",
                        fontFamily: "Aldrich,sans-serif",
                      }}
                    >
                      {(mySociety?.name || user.full_name || "S")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="soc-profile-info">
                    <h2>{mySociety?.name || user.full_name}</h2>
                    <p>FAST National University, Islamabad</p>
                    <div className="soc-profile-badges">
                      {(mySociety?.focus_areas || []).map((fa) => (
                        <span key={fa} className="soc-badge">
                          {fa}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="filter-btn"
                    style={{ marginLeft: "auto" }}
                    onClick={() => setShowEditProfile(true)}
                  >
                    <Edit3 size={16} />
                    <span>Edit Profile</span>
                  </button>
                </div>
                <div className="soc-profile-stats">
                  <div className="soc-stat-item">
                    <span className="soc-stat-value">
                      {analytics?.followers ?? "—"}
                    </span>
                    <span className="soc-stat-label">Followers</span>
                  </div>
                  <div className="soc-stat-item">
                    <span className="soc-stat-value">
                      {analytics?.approvedEvents ?? myEvents.length}
                    </span>
                    <span className="soc-stat-label">Events Hosted</span>
                  </div>
                  <div className="soc-stat-item">
                    <span className="soc-stat-value">
                      {analytics?.totalRegs ?? "—"}
                    </span>
                    <span className="soc-stat-label">Registrations</span>
                  </div>
                </div>
                <div className="soc-bio-section">
                  <h3 className="soc-section-subtitle">ABOUT</h3>
                  <p>{mySociety?.description || "No description yet."}</p>
                </div>
              </div>

              {/* DNA */}
              <div className="soc-tab-view" style={{ marginTop: "2rem" }}>
                <div
                  className="body-header"
                  style={{ marginBottom: "1.25rem" }}
                >
                  <h1
                    className="welcome-text"
                    style={{ fontSize: "1.2rem", letterSpacing: "2px" }}
                  >
                    SOCIETY DNA
                  </h1>
                  <button
                    className="filter-btn"
                    onClick={() => setShowEditDna(true)}
                  >
                    <Edit3 size={16} />
                    <span>Edit DNA</span>
                  </button>
                </div>
                <div className="soc-dna-grid">
                  <div className="soc-dna-card">
                    <h3 className="soc-dna-label">🎯 MISSION</h3>
                    <p>{mySociety?.mission || dnaForm.mission}</p>
                  </div>
                  <div className="soc-dna-card">
                    <h3 className="soc-dna-label">🌍 VISION</h3>
                    <p>{mySociety?.vision || dnaForm.vision}</p>
                  </div>
                  <div className="soc-dna-card">
                    <h3 className="soc-dna-label">💡 VALUES</h3>
                    <ul className="soc-dna-list">
                      {(mySociety?.values_text || dnaForm.values)
                        .split("\n")
                        .filter(Boolean)
                        .map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ EVENTS ════════ */}
          {activeTab === "EVENTS" && (
            <div className="soc-tab-view">
              <div className="body-header">
                <h1 className="welcome-text">EVENTS</h1>
                <button
                  className="filter-btn soc-add-btn"
                  onClick={() => setShowNewEvent(true)}
                >
                  <PlusCircle size={16} />
                  <span>New Event</span>
                </button>
              </div>

              {/* Status filter pills */}
              <div
                style={{
                  display: "flex",
                  gap: ".5rem",
                  marginBottom: "1.25rem",
                  flexWrap: "wrap",
                }}
              >
                {[
                  ["all", "All"],
                  ["approved", "Approved"],
                  ["pending", "Pending"],
                  ["rejected", "Rejected"],
                ].map(([v, lbl]) => {
                  const cnt =
                    v === "all"
                      ? myEvents.length
                      : myEvents.filter((e) => e.status === v).length;
                  return (
                    <button
                      key={v}
                      onClick={() => setEventsFilter(v)}
                      style={{
                        padding: ".4rem 1rem",
                        borderRadius: "20px",
                        border: "1px solid",
                        cursor: "pointer",
                        fontFamily: "Nova Square,sans-serif",
                        fontSize: ".82rem",
                        background:
                          eventsFilter === v
                            ? "rgba(189,217,191,.15)"
                            : "transparent",
                        borderColor:
                          eventsFilter === v
                            ? "rgba(189,217,191,.5)"
                            : "rgba(189,217,191,.15)",
                        color: eventsFilter === v ? "#BDD9BF" : "#92898A",
                      }}
                    >
                      {lbl} ({cnt})
                    </button>
                  );
                })}
              </div>

              <div className="soc-list">
                {filteredEvents.length === 0 ? (
                  <p
                    style={{
                      color: "#92898A",
                      padding: "2rem",
                      textAlign: "center",
                      border: "1px solid rgba(189,217,191,.08)",
                      borderRadius: "12px",
                    }}
                  >
                    No events in this category.
                  </p>
                ) : (
                  filteredEvents.map((ev) => {
                    const sb = statusBadge(ev.status);
                    return (
                      <div
                        key={ev.id}
                        className="soc-list-item"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setViewDetail({ item: ev, type: "event" })
                        }
                      >
                        <img
                          src={eventImg(ev)}
                          alt={ev.title}
                          className="soc-list-thumb"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = CAT_IMAGES.default;
                          }}
                        />
                        <div className="soc-list-info">
                          <h4>{ev.title}</h4>
                          <p>
                            {ev.date}
                            {ev.time ? ` · ${ev.time}` : ""}
                            {ev.location ? ` · ${ev.location}` : ""}
                          </p>
                          {ev.status === "approved" && (
                            <p
                              style={{
                                margin: "4px 0 0",
                                display: "flex",
                                alignItems: "center",
                                gap: ".3rem",
                                fontSize: ".78rem",
                                color: "#4FC3F7",
                              }}
                            >
                              <Users size={11} /> {ev.registration_count || 0}{" "}
                              registered
                            </p>
                          )}
                        </div>
                        <span
                          style={{
                            padding: ".3rem .8rem",
                            borderRadius: "12px",
                            fontSize: ".78rem",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: ".3rem",
                            background: sb.bg,
                            color: sb.color,
                          }}
                        >
                          {sb.icon} {ev.status?.toUpperCase()}
                        </span>
                        <div
                          style={{
                            marginLeft: "auto",
                            display: "flex",
                            gap: ".5rem",
                            alignItems: "center",
                          }}
                        >
                          {ev.status === "approved" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRegistration(ev.id, ev.registration_open);
                              }}
                              style={{
                                padding: ".5rem 1rem",
                                borderRadius: "8px",
                                background:
                                  ev.registration_open !== 0
                                    ? "rgba(239,83,80,.12)"
                                    : "rgba(76,175,80,.12)",
                                border: `1px solid ${ev.registration_open !== 0 ? "rgba(239,83,80,.3)" : "rgba(76,175,80,.3)"}`,
                                color:
                                  ev.registration_open !== 0
                                    ? "#EF5350"
                                    : "#66BB6A",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontFamily: "Nova Square,sans-serif",
                                fontSize: ".82rem",
                                flexShrink: 0,
                              }}
                            >
                              {ev.registration_open !== 0 ? (
                                <>
                                  <XCircle size={14} /> Close
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={14} /> Reopen
                                </>
                              )}
                            </button>
                          )}
                          {ev.status === "approved" && (
                            <button
                              style={{
                                padding: ".5rem 1rem",
                                borderRadius: "8px",
                                background: "rgba(186,104,200,.12)",
                                border: "1px solid rgba(186,104,200,.3)",
                                color: "#BA68C8",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontFamily: "Nova Square,sans-serif",
                                fontSize: ".82rem",
                                flexShrink: 0,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                viewAttendance(ev);
                              }}
                            >
                              <Eye size={14} /> Attendance
                            </button>
                          )}
                          {(ev.status === "pending" ||
                            ev.status === "rejected" ||
                            ev.status === "approved") && (
                            <button
                              style={{
                                padding: ".5rem 1rem",
                                borderRadius: "8px",
                                background: "rgba(79,195,247,.12)",
                                border: "1px solid rgba(79,195,247,.3)",
                                color: "#4FC3F7",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontFamily: "Nova Square,sans-serif",
                                fontSize: ".82rem",
                                flexShrink: 0,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditEvent(ev);
                              }}
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                          )}
                          {ev.status === "pending" && (
                            <button
                              style={{
                                padding: ".5rem 1rem",
                                borderRadius: "8px",
                                background: "rgba(239,83,80,.12)",
                                border: "1px solid rgba(239,83,80,.3)",
                                color: "#EF5350",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontFamily: "Nova Square,sans-serif",
                                fontSize: ".82rem",
                                flexShrink: 0,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteEvent(ev.id);
                              }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ════════ ANALYTICS ════════ */}
          {activeTab === "ANALYTICS" && (
            <div className="soc-tab-view">
              <div className="body-header">
                <h1 className="welcome-text">ANALYTICS</h1>
              </div>

              {/* ── Top 4 stat cards ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: "12px",
                  marginBottom: "1.25rem",
                }}
              >
                {[
                  {
                    label: "FOLLOWERS",
                    value: analytics?.followers ?? "—",
                    sub: "students following",
                    color: "var(--theme-accent)",
                    bg: "rgba(var(--theme-accent-rgb), .18)",
                    border: "rgba(var(--theme-accent-rgb), .45)",
                  },
                  {
                    label: "EVENT SAVES",
                    value: analytics?.totalBookmarks ?? "—",
                    sub: "bookmarked",
                    color: "#FFB74D",
                    bg: "rgba(255,183,77,.18)",
                    border: "rgba(255,183,77,.45)",
                  },
                  {
                    label: "REGISTRATIONS",
                    value: analytics?.totalRegs ?? "—",
                    sub: "across all events",
                    color: "#66BB6A",
                    bg: "rgba(102,187,106,.18)",
                    border: "rgba(102,187,106,.45)",
                  },
                  {
                    label: "APPROVED",
                    value: analytics?.approvedEvents ?? "—",
                    sub: `of ${analytics?.totalEvents ?? 0} total`,
                    color: "#BA68C8",
                    bg: "rgba(186,104,200,.18)",
                    border: "rgba(186,104,200,.45)",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: s.bg,
                      border: `1px solid ${s.border}`,
                      borderRadius: "14px",
                      padding: "1.1rem",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "-10px",
                        right: "-10px",
                        width: "60px",
                        height: "60px",
                        background:
                          s.label === "FOLLOWERS"
                            ? "rgba(var(--theme-accent-rgb), .15)"
                            : s.color,
                        opacity: 0.15,
                        borderRadius: "50%",
                      }}
                    />
                    <p
                      style={{
                        margin: "0 0 .5rem",
                        color: s.color,
                        fontSize: "10px",
                        letterSpacing: "2px",
                        fontFamily: "Aldrich,sans-serif",
                      }}
                    >
                      {s.label}
                    </p>
                    <p
                      style={{
                        margin: "0 0 .25rem",
                        fontSize: "2rem",
                        fontWeight: "700",
                        color: "#fff",
                        fontFamily: "Aldrich,sans-serif",
                      }}
                    >
                      {analytics ? s.value : "..."}
                    </p>
                    <p
                      style={{ margin: 0, fontSize: "11px", color: "#a89aab" }}
                    >
                      {s.sub}
                    </p>
                  </div>
                ))}
              </div>

              {/* ── Middle row: event status + weekly chart ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr",
                  gap: "12px",
                  marginBottom: "1.25rem",
                }}
              >
                {/* Event status breakdown */}
                <div
                  style={{
                    background: "rgba(12,24,33,.6)",
                    border: "1px solid rgba(189,217,191,.08)",
                    borderRadius: "14px",
                    padding: "1.25rem",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 1rem",
                      color: "#a89aab",
                      fontSize: "10px",
                      letterSpacing: "2px",
                      fontFamily: "Aldrich,sans-serif",
                    }}
                  >
                    EVENT STATUS
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: ".75rem",
                    }}
                  >
                    {[
                      {
                        lbl: "Approved",
                        val: analytics?.approvedEvents ?? 0,
                        total: analytics?.totalEvents ?? 1,
                        clr: "#66BB6A",
                      },
                      {
                        lbl: "Pending",
                        val: analytics?.pendingEvents ?? 0,
                        total: analytics?.totalEvents ?? 1,
                        clr: "#FFB74D",
                      },
                      {
                        lbl: "Rejected",
                        val:
                          (analytics?.totalEvents ?? 0) -
                          (analytics?.approvedEvents ?? 0) -
                          (analytics?.pendingEvents ?? 0),
                        total: analytics?.totalEvents ?? 1,
                        clr: "#EF5350",
                      },
                    ].map((s) => (
                      <div key={s.lbl}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "4px",
                          }}
                        >
                          <span style={{ color: s.clr, fontSize: "12px" }}>
                            {s.lbl}
                          </span>
                          <span
                            style={{
                              color: s.clr,
                              fontSize: "12px",
                              fontWeight: "700",
                            }}
                          >
                            {s.val}
                          </span>
                        </div>
                        <div
                          style={{
                            background: "rgba(189,217,191,.08)",
                            borderRadius: "99px",
                            height: "6px",
                          }}
                        >
                          <div
                            style={{
                              width: `${s.total > 0 ? Math.round((s.val / s.total) * 100) : 0}%`,
                              height: "100%",
                              borderRadius: "99px",
                              background: s.clr,
                              transition: "width .6s ease",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly registrations bar chart */}
                <div
                  style={{
                    background: "rgba(12,24,33,.6)",
                    border: "1px solid rgba(189,217,191,.08)",
                    borderRadius: "14px",
                    padding: "1.25rem",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 1rem",
                      color: "#a89aab",
                      fontSize: "10px",
                      letterSpacing: "2px",
                      fontFamily: "Aldrich,sans-serif",
                    }}
                  >
                    REGISTRATIONS — LAST 6 WEEKS
                  </p>
                  {analytics?.weeks ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "10px",
                        height: "100px",
                      }}
                    >
                      {analytics.weeks.map((w, i) => {
                        const pct =
                          weeklyMax > 0
                            ? Math.max(
                                Math.round((w.count / weeklyMax) * 100),
                                w.count > 0 ? 8 : 2,
                              )
                            : 2;
                        return (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "4px",
                              height: "100%",
                              justifyContent: "flex-end",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#BDD9BF",
                                fontFamily: "Aldrich,sans-serif",
                              }}
                            >
                              {w.count}
                            </span>
                            <div
                              style={{
                                width: "100%",
                                height: `${pct}%`,
                                borderRadius: "4px 4px 0 0",
                                background: `linear-gradient(180deg, var(--theme-accent), #0a2e2e)`,
                                minHeight: "4px",
                              }}
                            />
                            <span
                              style={{
                                fontSize: "10px",
                                color: "#a89aab",
                                fontFamily: "Nova Square,sans-serif",
                              }}
                            >
                              {w.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ color: "#92898A", fontSize: ".85rem" }}>
                      No data yet.
                    </p>
                  )}
                </div>
              </div>

              {/* ── Registrations per event ── */}
              <div
                style={{
                  background: "rgba(12,24,33,.6)",
                  border: "1px solid rgba(189,217,191,.08)",
                  borderRadius: "14px",
                  padding: "1.25rem",
                }}
              >
                <p
                  style={{
                    margin: "0 0 1rem",
                    color: "#a89aab",
                    fontSize: "10px",
                    letterSpacing: "2px",
                    fontFamily: "Aldrich,sans-serif",
                  }}
                >
                  REGISTRATIONS PER EVENT
                </p>
                {myEvents.filter((e) => e.status === "approved").length ===
                0 ? (
                  <p style={{ color: "#92898A", fontSize: ".88rem" }}>
                    No approved events yet.
                  </p>
                ) : (
                  (() => {
                    const approved = myEvents
                      .filter((e) => e.status === "approved")
                      .sort(
                        (a, b) =>
                          (b.registration_count || 0) -
                          (a.registration_count || 0),
                      );
                    const max = Math.max(
                      ...approved.map((e) => e.registration_count || 0),
                      1,
                    );
                    const visible = showAllEventStats
                      ? approved
                      : approved.slice(0, 4);
                    return (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: ".6rem",
                          }}
                        >
                          {visible.map((ev) => {
                            const count = ev.registration_count || 0;
                            const pct = Math.round((count / max) * 100);
                            return (
                              <div
                                key={ev.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "1rem",
                                }}
                              >
                                <span
                                  style={{
                                    color: "#BDD9BF",
                                    fontSize: ".82rem",
                                    width: "180px",
                                    flexShrink: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {ev.title}
                                </span>
                                <div
                                  style={{
                                    flex: 1,
                                    background: "rgba(189,217,191,.08)",
                                    borderRadius: "99px",
                                    height: "7px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${pct}%`,
                                      height: "100%",
                                      borderRadius: "99px",
                                      background: `linear-gradient(90deg, var(--theme-accent), #4FC3F7)`,
                                      transition: "width .6s ease",
                                      minWidth: count > 0 ? "6px" : "0",
                                    }}
                                  />
                                </div>
                                <span
                                  style={{
                                    color: "var(--theme-accent)",
                                    fontFamily: "Aldrich,sans-serif",
                                    fontSize: ".88rem",
                                    width: "28px",
                                    textAlign: "right",
                                    flexShrink: 0,
                                  }}
                                >
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {approved.length > 4 && (
                          <div
                            style={{
                              marginTop: "1.25rem",
                              display: "flex",
                              alignItems: "center",
                              gap: ".75rem",
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                height: "1px",
                                background: "rgba(189,217,191,.08)",
                              }}
                            />
                            <button
                              onClick={() => setShowAllEventStats((p) => !p)}
                              style={{
                                background: "rgba(189,217,191,.06)",
                                border: "1px solid rgba(189,217,191,.15)",
                                color: "#92898A",
                                cursor: "pointer",
                                fontSize: "11px",
                                padding: ".35rem .9rem",
                                borderRadius: "20px",
                                letterSpacing: ".5px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {showAllEventStats
                                ? "↑ show less"
                                : `↓ ${approved.length - 4} more events`}
                            </button>
                            <div
                              style={{
                                flex: 1,
                                height: "1px",
                                background: "rgba(189,217,191,.08)",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          <p>© 2026 {platformName} Platform. All rights reserved.</p>
          <div className="footer-links">
            <button
              onClick={() =>
                window.open(
                  `https://mail.google.com/mail/?view=cm&to=${adminEmail}`,
                  "_blank",
                )
              }
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "inherit",
              }}
            >
              Contact Admin
            </button>
            <span style={{ color: "#685369" }}>NU Islamabad Campus</span>
            <img
              src="/src/assets/nucleus-logo.png"
              alt="NUcleus"
              style={{ height: "18px", verticalAlign: "middle", opacity: 0.7 }}
            />
          </div>
        </footer>
      </main>
    </div>
  );
};

// ── Static fallback data ──────────────────────────────────────────────────────
const postedEventsStatic = [
  {
    id: "s1",
    title: "Tech Innovation Summit 2026",
    organizer: "FAST Tech Society",
    date: "Oct 15, 2026",
    tag: "Event",
    image:
      "https://images.unsplash.com/photo-1540575861501-7c93b707ffea?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "s2",
    title: "Web Dev Bootcamp",
    organizer: "FAST Tech Society",
    date: "Oct 25, 2026",
    tag: "Workshop",
    image:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "s3",
    title: "Annual Hackathon 2026",
    organizer: "FAST Tech Society",
    date: "Nov 10, 2026",
    tag: "Competition",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
  },
];

export default SocietyDashboard;
