import { useState, useEffect, useRef, useCallback } from "react";
import {
  Home,
  Calendar,
  Users,
  User,
  Bell,
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  MapPin,
  Clock,
  Building2,
  Zap,
  LogOut,
  X,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Briefcase,
  GraduationCap,
  FlaskConical,
  BookOpen,
  ExternalLink,
  Filter,
  AlertTriangle,
} from "lucide-react";
import OrbitLogo from "../OrbitLogo";
import "./StudentHome.css";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../useTheme";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

// ── helpers ──────────────────────────────────────────────────────────────────
const tok = () => localStorage.getItem("token");
const authH = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${tok()}`,
});
// ── LinkedIn Post Generator ───────────────────────────────────────────────────
const LINKEDIN_TEMPLATES = {
  Technical: [
    (e) =>
      `🚀 Thrilled to have attended "${e.title}" organized by ${e.society_name} at FAST-NUCES!\n\nThis hands-on session gave me practical exposure to cutting-edge concepts and tools. The experience of learning alongside passionate peers is something truly invaluable.\n\nGrateful to the organizers for putting together such an impactful event. Can't wait to apply what I've learned! 💡\n\n#FASTNUCES #${e.category.replace(/ /g, "")} #NUcleus #StudentLife #LearningAndDevelopment`,
    (e) =>
      `💻 Just wrapped up "${e.title}" by ${e.society_name} — and what an experience!\n\nFrom theory to hands-on practice, every moment was packed with learning. Events like these remind me why I chose this field.\n\nBig thanks to everyone who made it happen. Excited for what's next! 🔥\n\n#FASTNUCES #TechCommunity #NUcleus #${e.society_name.replace(/ /g, "")}`,
  ],
  Competitions: [
    (e) =>
      `🏆 Proud to have participated in "${e.title}" hosted by ${e.society_name}!\n\nCompeting alongside some of the brightest minds at FAST-NUCES was both challenging and inspiring. Win or lose, the experience and growth are unmatched.\n\nThank you ${e.society_name} for organizing such a fantastic event! 🎯\n\n#FASTNUCES #Competition #NUcleus #GrowthMindset #StudentLife`,
    (e) =>
      `⚡ What a rush! Just competed in "${e.title}" by ${e.society_name}.\n\nEvery competition teaches you something new — about your skills, your limits, and your potential. Grateful for the opportunity and the incredible community here at FAST.\n\n#FASTNUCES #${e.category.replace(/ /g, "")} #NUcleus #KeepGrowing`,
  ],
  Career: [
    (e) =>
      `💼 Attended "${e.title}" organized by ${e.society_name} at FAST-NUCES — truly a career-defining experience!\n\nThe insights shared by industry professionals were eye-opening. Networking with like-minded individuals and learning about real-world opportunities has given me a clearer vision for my future.\n\n#FASTNUCES #CareerDevelopment #NUcleus #Networking #Opportunities`,
    (e) =>
      `🌟 "${e.title}" by ${e.society_name} was everything I hoped for and more.\n\nBridging the gap between academia and industry is so important, and events like this do exactly that. Came away with new connections and a sharper career roadmap. 🚀\n\n#FASTNUCES #CareerGrowth #NUcleus #${e.society_name.replace(/ /g, "")}`,
  ],
  Social: [
    (e) =>
      `🎉 Had an amazing time at "${e.title}" organized by ${e.society_name}!\n\nBeyond academics, it's the community and connections that make university life truly memorable. Grateful for events that bring students together and create lasting memories.\n\nCheers to more such moments! ✨\n\n#FASTNUCES #CampusLife #NUcleus #Community #StudentLife`,
    (e) =>
      `😄 "${e.title}" by ${e.society_name} was an absolute blast!\n\nUniversity is not just about grades — it's about experiences, friendships, and moments that shape who you are. So glad to be part of such a vibrant community at FAST.\n\n#FASTNUCES #NUcleus #StudentLife #GoodVibes`,
  ],
  default: [
    (e) =>
      `✨ Attended "${e.title}" organized by ${e.society_name} at FAST-NUCES!\n\nEvery event I attend here adds something new to my journey — new skills, new perspectives, and new connections. Truly grateful to be part of this community.\n\n#FASTNUCES #NUcleus #StudentLife #${e.category.replace(/ /g, "")}`,
    (e) =>
      `🌱 "${e.title}" by ${e.society_name} was a wonderful experience.\n\nGrowth happens when you step outside the classroom. Thankful for the opportunity and the incredible organizers who made this happen!\n\n#FASTNUCES #NUcleus #GrowthMindset #StudentLife`,
  ],
};

const generateLinkedInPost = (event, variant = 0) => {
  const templates =
    LINKEDIN_TEMPLATES[event.category] || LINKEDIN_TEMPLATES.default;
  return templates[variant % templates.length](event);
};
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

// Compares full datetime (date + time) for deadline labels
const deadlineLbl = (d) => {
  if (!d) return "No deadline";
  const diff = (new Date(d) - new Date()) / 86400000;
  if (diff < 0) return "Closed";
  if (diff < 1) return "Closes today!";
  return `${Math.ceil(diff)}d left`;
};

// Returns true if the registration deadline (with time) has passed
const isDeadlinePassed = (deadline) => {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
};

// ── Notification emoji map ────────────────────────────────────────────────────
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
  new_opportunity: "💼",
  default: "🔔",
};

// ── Opportunity type config ───────────────────────────────────────────────────
const OPP_TYPES = [
  "All",
  "Internship",
  "Scholarship",
  "Research",
  "TA Position",
];
const OPP_TYPE_ICONS = {
  Internship: <Briefcase size={14} />,
  Scholarship: <GraduationCap size={14} />,
  Research: <FlaskConical size={14} />,
  "TA Position": <BookOpen size={14} />,
};
const OPP_TYPE_COLORS = {
  Internship: {
    bg: "rgba(79,195,247,.15)",
    color: "#4FC3F7",
    border: "rgba(79,195,247,.3)",
  },
  Scholarship: {
    bg: "rgba(102,187,106,.15)",
    color: "#66BB6A",
    border: "rgba(102,187,106,.3)",
  },
  Research: {
    bg: "rgba(186,104,200,.15)",
    color: "#BA68C8",
    border: "rgba(186,104,200,.3)",
  },
  "TA Position": {
    bg: "rgba(255,183,77,.15)",
    color: "#FFB74D",
    border: "rgba(255,183,77,.3)",
  },
};
const oppTypeStyle = (type) =>
  OPP_TYPE_COLORS[type] || {
    bg: "rgba(189,217,191,.15)",
    color: "#BDD9BF",
    border: "rgba(189,217,191,.3)",
  };

const notifEmoji = (type) => NOTIF_EMOJI[type] || NOTIF_EMOJI.default;

// Ensures a notification message always starts with its emoji
const notifWithEmoji = (n) => {
  const emoji = notifEmoji(n.type);
  const msg = n.message || "";
  // If the message already starts with an emoji char, don't double-add
  const startsWithEmoji = /^\p{Emoji}/u.test(msg);
  return startsWithEmoji ? msg : `${emoji} ${msg}`;
};

const CATEGORIES = [
  "All",
  "Technical",
  "Competitions",
  "Career",
  "Social",
  "Arts",
  "Sports",
];
const INTEREST_TO_CATEGORIES = {
  tech: ["Technical"],
  comp: ["Competitions"],
  career: ["Career"],
  arts: ["Arts"],
  sports: ["Sports"],
  social: ["Social"],
  research: ["Technical"],
};
const CAT_ICONS = {
  All: "🔷",
  Technical: "🖥️",
  Competitions: "🏆",
  Career: "💼",
  Social: "🎉",
  Arts: "🎨",
  Sports: "⚽",
};
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
  e.image_url || CAT_IMAGES[e.category] || CAT_IMAGES.default;
const TAG_CLR = {
  Technical: { bg: "rgba(79,195,247,.18)", color: "#4FC3F7" },
  Competitions: { bg: "rgba(186,104,200,.18)", color: "#BA68C8" },
  Career: { bg: "rgba(102,187,106,.18)", color: "#66BB6A" },
  Social: { bg: "rgba(255,183,77,.18)", color: "#FFB74D" },
  Arts: { bg: "rgba(240,98,146,.18)", color: "#F06292" },
  Sports: { bg: "rgba(239,83,80,.18)", color: "#EF5350" },
};
const tagStyle = (cat) =>
  TAG_CLR[cat] || { bg: "rgba(189,217,191,.18)", color: "#BDD9BF" };

// ── Registration status helper ────────────────────────────────────────────────
// Returns one of: 'open' | 'deadline_passed' | 'organizer_closed' | 'full'
const regStatus = (event) => {
  if (event.max_participants && event.spots_remaining <= 0) return "full";
  if (
    event.closed_by_organizer === 1 ||
    (event.registration_open === 0 && event.closed_by_organizer !== 0)
  )
    return "organizer_closed";
  if (isDeadlinePassed(event.registration_deadline)) return "deadline_passed";
  if (event.registration_open === 0) return "deadline_passed"; // fallback
  return "open";
};

// ── EventDetailModal ──────────────────────────────────────────────────────────
const EventDetailModal = ({
  event,
  registered,
  saved,
  onClose,
  onRegister,
  onSave,
}) => {
  if (!event) return null;
  const ts = tagStyle(event.category);
  const status = regStatus(event);

  const closedBtn = (label) => (
    <button
      disabled
      style={{
        flex: 1,
        background: "rgba(239,83,80,.1)",
        border: "1px solid rgba(239,83,80,.2)",
        color: "#EF5350",
        padding: ".6rem 1rem",
        borderRadius: "8px",
        fontFamily: "Nova Square,sans-serif",
        fontSize: ".85rem",
        display: "flex",
        alignItems: "center",
        gap: ".4rem",
        cursor: "not-allowed",
      }}
    >
      <X size={14} /> {label}
    </button>
  );

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
          maxWidth: "580px",
          maxHeight: "88vh",
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(var(--theme-accent-rgb), .3) transparent",
        }}
      >
        {/* Image banner */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "200px",
            borderRadius: "18px 18px 0 0",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <img
            src={eventImg(event)}
            alt={event.title}
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
              background: ts.bg,
              color: ts.color,
              padding: ".3rem .9rem",
              borderRadius: "20px",
              fontSize: ".8rem",
              border: `1px solid ${ts.color}40`,
            }}
          >
            {event.category}
          </span>
        </div>

        <div style={{ padding: "1.75rem" }}>
          <h2
            style={{
              margin: "0 0 .75rem",
              fontSize: "1.4rem",
              color: "#fff",
              lineHeight: 1.3,
              fontFamily: "Aldrich,sans-serif",
            }}
          >
            {event.title}
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            <span
              style={{
                color: "var(--theme-text-primary)",
                fontSize: ".85rem",
                display: "flex",
                alignItems: "center",
                gap: ".35rem",
              }}
            >
              <Building2 size={14} /> {event.society_name}
            </span>
            <span
              style={{
                color: "var(--theme-text-primary)",
                fontSize: ".85rem",
                display: "flex",
                alignItems: "center",
                gap: ".35rem",
              }}
            >
              <MapPin size={14} /> {event.location}
            </span>
            <span
              style={{
                color: "var(--theme-text-primary)",
                fontSize: ".85rem",
                display: "flex",
                alignItems: "center",
                gap: ".35rem",
              }}
            >
              <Calendar size={14} /> {fmt(event.date)}
              {event.time && ` · ${event.time}`}
            </span>
            <span
              style={{
                color: "var(--theme-text-primary)",
                fontSize: ".85rem",
                display: "flex",
                alignItems: "center",
                gap: ".35rem",
              }}
            >
              <Clock size={14} /> {deadlineLbl(event.registration_deadline)}
              {event.registration_deadline && (
                <span style={{ color: "#685369", fontSize: ".78rem" }}>
                  &nbsp;(
                  {new Date(event.registration_deadline).toLocaleString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    },
                  )}
                  )
                </span>
              )}
            </span>
            {event.registration_count > 0 && (
              <span
                style={{
                  color: "var(--theme-accent)",
                  fontSize: ".85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: ".35rem",
                }}
              >
                <Users size={14} /> {event.registration_count} registered
              </span>
            )}
          </div>
          <p
            style={{
              color: "var(--theme-text-primary)",
              lineHeight: 1.7,
              marginBottom: "2rem",
              fontSize: ".95rem",
              opacity: 0.85,
            }}
          >
            {event.description || "No description provided."}
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            {registered ? (
              <button className="btn-registered" disabled style={{ flex: 1 }}>
                <CheckCircle size={14} /> Registered
              </button>
            ) : status === "full" ? (
              closedBtn("Event Full")
            ) : status === "organizer_closed" ? (
              closedBtn("Closed by Organizer")
            ) : status === "deadline_passed" ? (
              closedBtn("Registration Closed")
            ) : (
              <button
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
                onClick={() => onRegister(event.id)}
                style={{
                  flex: 1,
                  background:
                    "linear-gradient(90deg,rgba(var(--theme-accent-rgb), .25),rgba(var(--theme-accent-rgb), .15))",
                  border: "1px solid rgba(var(--theme-accent-rgb), .4)",
                  color: "var(--theme-text-primary)",
                  padding: ".6rem 1rem",
                  borderRadius: "8px",
                  fontFamily: "Aldrich,sans-serif",
                  fontSize: ".88rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: ".4rem",
                  cursor: "pointer",
                  transition: "all .2s",
                }}
              >
                <Zap size={14} /> Register
              </button>
            )}
            <button
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,183,77,.2)";
                e.currentTarget.style.borderColor = "rgba(255,183,77,.55)";
                e.currentTarget.style.color = "#ffd080";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = saved
                  ? "rgba(255,183,77,.15)"
                  : "rgba(255,183,77,.08)";
                e.currentTarget.style.borderColor = saved
                  ? "rgba(255,183,77,.4)"
                  : "rgba(255,183,77,.25)";
                e.currentTarget.style.color = "#FFB74D";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              onClick={() => onSave(event.id)}
              style={{
                background: saved
                  ? "rgba(255,183,77,.15)"
                  : "rgba(255,183,77,.08)",
                border: `1px solid ${saved ? "rgba(255,183,77,.4)" : "rgba(255,183,77,.25)"}`,
                color: "#FFB74D",
                padding: ".6rem 1rem",
                borderRadius: "8px",
                cursor: "pointer",
                fontFamily: "Nova Square,sans-serif",
                fontSize: ".82rem",
                display: "flex",
                alignItems: "center",
                gap: ".4rem",
                transition: "all .2s",
              }}
            >
              {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}{" "}
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── EventCard ─────────────────────────────────────────────────────────────────
const EventCard = ({
  event,
  registered,
  saved,
  onRegister,
  onSave,
  onViewDetail,
}) => {
  const status = regStatus(event);

  const closedCardBtn = (label) => (
    <button
      disabled
      style={{
        background: "rgba(239,83,80,.1)",
        border: "1px solid rgba(239,83,80,.2)",
        color: "#EF5350",
        padding: ".4rem .8rem",
        borderRadius: "8px",
        fontFamily: "Nova Square,sans-serif",
        fontSize: ".8rem",
        cursor: "not-allowed",
        display: "flex",
        alignItems: "center",
        gap: ".3rem",
      }}
    >
      <X size={12} /> {label}
    </button>
  );

  return (
    <div
      className="carousel-card"
      style={{
        marginBottom: "1rem",
        height: "190px",
        minHeight: "190px",
        maxHeight: "190px",
        overflow: "hidden",
      }}
    >
      <div
        className="card-image"
        style={{
          flexShrink: 0,
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          height: "100%",
        }}
        onClick={() => onViewDetail(event)}
      >
        <img
          src={eventImg(event)}
          alt={event.title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = CAT_IMAGES.default;
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
        />
        <span className="card-tag">{event.category}</span>
      </div>
      <div
        className="card-content"
        style={{ width: "68%", padding: "1.25rem 1.5rem" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <h3
            style={{
              margin: "0 0 .5rem",
              fontSize: "1.05rem",
              cursor: "pointer",
              color: "#fff",
            }}
            onClick={() => onViewDetail(event)}
          >
            {event.title}
          </h3>
          <span
            style={{
              fontSize: ".78rem",
              color: "#92898A",
              display: "flex",
              alignItems: "center",
              gap: ".3rem",
              flexShrink: 0,
              marginLeft: ".5rem",
            }}
          >
            <MapPin size={11} /> {event.location}
          </span>
        </div>
        <p
          className="organizer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".4rem",
            margin: "0 0 .5rem",
          }}
        >
          <Building2 size={12} /> {event.society_name}
        </p>
        <p
          className="date"
          style={{
            marginBottom: ".5rem",
            display: "flex",
            alignItems: "center",
            gap: ".4rem",
          }}
        >
          <Calendar size={12} /> {fmt(event.date)} &nbsp;·&nbsp;{" "}
          <Clock size={12} /> {deadlineLbl(event.registration_deadline)}
        </p>
        <p
          style={{
            fontSize: ".82rem",
            color: "#92898A",
            marginBottom: "1rem",
            lineHeight: 1.4,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {event.description}
        </p>

        {event.max_participants && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".5rem",
              marginBottom: ".75rem",
              fontSize: ".78rem",
            }}
          >
            <Users
              size={12}
              style={{
                color: event.spots_remaining < 5 ? "#EF5350" : "#4FC3F7",
              }}
            />
            <span
              style={{
                color: event.spots_remaining < 5 ? "#EF5350" : "#4FC3F7",
              }}
            >
              {event.spots_remaining > 0
                ? `${event.registration_count || 0}/${event.max_participants} registered · ${event.spots_remaining} spots left`
                : "FULL"}
            </span>
          </div>
        )}

        {/* Show correct closed reason */}
        {status === "organizer_closed" && !registered && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".5rem",
              marginBottom: ".75rem",
              fontSize: ".78rem",
              color: "#EF5350",
            }}
          >
            <XCircle size={12} />
            <span>Closed by organizer</span>
          </div>
        )}
        {status === "deadline_passed" && !registered && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".5rem",
              marginBottom: ".75rem",
              fontSize: ".78rem",
              color: "#EF5350",
            }}
          >
            <XCircle size={12} />
            <span>Registration closed</span>
          </div>
        )}

        <div className="card-actions" style={{ marginTop: "auto", padding: 0 }}>
          {registered ? (
            <button className="btn-registered" disabled>
              <CheckCircle size={14} /> Registered
            </button>
          ) : status === "full" ? (
            closedCardBtn("Full")
          ) : status === "organizer_closed" ? (
            closedCardBtn("Closed by Organizer")
          ) : status === "deadline_passed" ? (
            closedCardBtn("Closed")
          ) : (
            <button
              className="btn-register"
              onClick={() => onRegister(event.id)}
            >
              <Zap size={14} /> Register
            </button>
          )}
          <button
            className={`btn-save ${saved ? "saved" : ""}`}
            onClick={() => onSave(event.id)}
            style={{ marginLeft: "auto" }}
          >
            {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}{" "}
            {saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={() => onViewDetail(event)}
            style={{
              background: "none",
              border: "1px solid rgba(189,217,191,.2)",
              color: "#92898A",
              padding: ".4rem .8rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: ".78rem",
              marginLeft: ".5rem",
              fontFamily: "Nova Square,sans-serif",
            }}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

// ── NotificationsPanel ────────────────────────────────────────────────────────
const NotificationsPanel = ({
  notifications,
  onReadAll,
  onClose,
  onClickNotif,
  onDismiss,
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
            onClick={onReadAll}
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
        className="notif-scroll"
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
                transition: "background .2s",
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
                  flexShrink: 0,
                  marginTop: "6px",
                  background: n.is_read ? "transparent" : "#4FC3F7",
                  boxShadow: n.is_read ? "none" : "0 0 6px #4FC3F7",
                }}
              />
              <div
                style={{ flex: 1, cursor: "pointer", minWidth: 0 }}
                onClick={() => onClickNotif(n)}
              >
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
                {n.society_name && (
                  <p
                    style={{ margin: 0, color: "#685369", fontSize: ".78rem" }}
                  >
                    by {n.society_name}
                  </p>
                )}
                <p
                  style={{
                    margin: ".25rem 0 0",
                    color: "#685369",
                    fontSize: ".75rem",
                  }}
                >
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
                title="Dismiss"
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

// ── ConflictWarningDialog ────────────────────────────────────────────────────
const ConflictWarningDialog = ({ conflicts, onProceed, onCancel }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 4000,
      padding: "1rem",
    }}
  >
    <div
      style={{
        background:
          "linear-gradient(135deg,var(--theme-bg-from),var(--theme-bg-mid),var(--theme-bg-to))",
        border: "1px solid rgba(239,83,80,.35)",
        borderRadius: "18px",
        width: "100%",
        maxWidth: "460px",
        padding: "2rem",
        boxShadow: "0 8px 40px rgba(239,83,80,.18)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: ".75rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "rgba(239,83,80,.15)",
            border: "1px solid rgba(239,83,80,.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={20} color="#EF5350" />
        </div>
        <div>
          <h3
            style={{
              margin: 0,
              color: "#EF5350",
              fontFamily: "Aldrich,sans-serif",
              fontSize: "1.05rem",
              letterSpacing: ".5px",
            }}
          >
            Schedule Conflict Detected
          </h3>
          <p
            style={{ margin: ".2rem 0 0", color: "#92898A", fontSize: ".8rem" }}
          >
            You are already registered for an event at this time
          </p>
        </div>
      </div>

      {/* Conflicting events list (US-15b) */}
      <div
        style={{
          background: "rgba(239,83,80,.06)",
          border: "1px solid rgba(239,83,80,.15)",
          borderRadius: "12px",
          padding: "1rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: ".6rem",
        }}
      >
        {conflicts.map((ev) => (
          <div
            key={ev.id}
            style={{ display: "flex", alignItems: "flex-start", gap: ".6rem" }}
          >
            <XCircle
              size={14}
              color="#EF5350"
              style={{ flexShrink: 0, marginTop: "2px" }}
            />
            <div>
              <p
                style={{
                  margin: 0,
                  color: "#fff",
                  fontSize: ".88rem",
                  fontFamily: "Aldrich,sans-serif",
                }}
              >
                {ev.title}
              </p>
              <p
                style={{
                  margin: ".15rem 0 0",
                  color: "#92898A",
                  fontSize: ".76rem",
                }}
              >
                {ev.society_name}
                {ev.time ? ` · ${ev.time}` : ""}
                {ev.location ? ` · ${ev.location}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions (US-15c — can still proceed) */}
      <div style={{ display: "flex", gap: ".75rem" }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            background: "rgba(189,217,191,.08)",
            border: "1px solid rgba(189,217,191,.2)",
            color: "#BDD9BF",
            padding: ".65rem 1rem",
            borderRadius: "10px",
            cursor: "pointer",
            fontFamily: "Nova Square,sans-serif",
            fontSize: ".85rem",
            transition: "all .2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(189,217,191,.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(189,217,191,.08)";
          }}
        >
          Cancel
        </button>
        <button
          onClick={onProceed}
          style={{
            flex: 1,
            background: "rgba(239,83,80,.15)",
            border: "1px solid rgba(239,83,80,.4)",
            color: "#EF5350",
            padding: ".65rem 1rem",
            borderRadius: "10px",
            cursor: "pointer",
            fontFamily: "Aldrich,sans-serif",
            fontSize: ".85rem",
            transition: "all .2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,83,80,.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239,83,80,.15)";
          }}
        >
          Register Anyway
        </button>
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const StudentHome = () => {
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [calDayModal, setCalDayModal] = useState(null); // { date, events }
  const navigate = useNavigate();
  const [platformName, setPlatformName] = useState("NUcleus");
  const { theme, setTheme } = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [oppView, setOppView] = useState("all"); // "all" or "bookmarked"
  const [activeTab, setActiveTab] = useState("HOME");
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [recIndex, setRecIndex] = useState(0);
  const [adminEmail, setAdminEmail] = useState("");
  const [events, setEvents] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [registered, setRegistered] = useState({});
  const [saved, setSaved] = useState({});
  const [follows, setFollows] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [eventSearch, setEventSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("All");
  const [selectedSociety, setSelectedSociety] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);

  const [eventsView, setEventsView] = useState("all");
  const [bookmarkTab, setBookmarkTab] = useState("all");
  const [calView, setCalView] = useState("month");
  const [calDate, setCalDate] = useState(new Date());
  const [highlightEventId, setHighlightEventId] = useState(null);
  const [societyView, setSocietyView] = useState("all");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [conflictWarning, setConflictWarning] = useState(null); // { conflicts: [], pendingId }
  const [editForm, setEditForm] = useState({
    full_name: user.full_name || "",
    interests: user.interests || [],
    avatar_url: user.avatar_url || "",
  });
  const [editMsg, setEditMsg] = useState("");
  // Password change state
  const [editTab, setEditTab] = useState("profile"); // "profile" | "password"
  const [pwStep, setPwStep] = useState(1); // 1 = fetch question, 2 = answer+new password
  const [pwSecurityQuestion, setPwSecurityQuestion] = useState("");
  const [pwSecurityAnswer, setPwSecurityAnswer] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  // Opportunities state
  const [opportunities, setOpportunities] = useState([]);
  const [oppFilter, setOppFilter] = useState("All");
  const [oppSearch, setOppSearch] = useState("");
  const [savedOpps, setSavedOpps] = useState({});
  const [linkedInEvent, setLinkedInEvent] = useState(null);
  const [linkedInPost, setLinkedInPost] = useState("");
  const [linkedInVariant, setLinkedInVariant] = useState(0);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [evts, socs, regs, bkms, fols, notifs, opps, oppBkms] =
        await Promise.all([
          fetch(`${API}/events`, { headers: authH() }).then((r) => r.json()),
          fetch(`${API}/societies`).then((r) => r.json()),
          fetch(`${API}/registrations`, { headers: authH() }).then((r) =>
            r.json(),
          ),
          fetch(`${API}/bookmarks`, { headers: authH() }).then((r) => r.json()),
          fetch(`${API}/follows`, { headers: authH() }).then((r) => r.json()),
          fetch(`${API}/notifications`, { headers: authH() }).then((r) =>
            r.json(),
          ),
          fetch(`${API}/opportunities`).then((r) => r.json()),
          fetch(`${API}/opportunity-bookmarks`, { headers: authH() }).then(
            (r) => r.json(),
          ),
        ]);
      setEvents(Array.isArray(evts) ? evts : []);
      setSocieties(Array.isArray(socs) ? socs : []);
      setRegistrations(Array.isArray(regs) ? regs : []);
      const regMap = {};
      (Array.isArray(regs) ? regs : []).forEach((e) => {
        regMap[e.id] = true;
      });
      setRegistered(regMap);
      const bmkMap = {};
      (Array.isArray(bkms) ? bkms : []).forEach((e) => {
        bmkMap[e.id] = true;
      });
      setSaved(bmkMap);
      const folMap = {};
      (Array.isArray(fols) ? fols : []).forEach((s) => {
        folMap[s.id] = true;
      });
      setFollows(folMap);
      setNotifications(Array.isArray(notifs) ? notifs : []);
      setOpportunities(Array.isArray(opps) ? opps : []);
      const oppBkmMap = {};
      (Array.isArray(oppBkms) ? oppBkms : []).forEach((o) => {
        oppBkmMap[o.id] = true;
      });
      setSavedOpps(oppBkmMap);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    fetch(`${API}/settings`)
      .then((r) => r.json())
      .then((d) => {
        setPlatformName(d.platform_name || "NUcleus");
        setAdminEmail(d.contact_email || "admin@isb.nu.edu.pk");
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

  useEffect(() => {
    if (events.length < 2) return;
    const t = setInterval(
      () => setRecIndex((p) => (p + 1) % Math.min(4, events.length)),
      4500,
    );
    return () => clearInterval(t);
  }, [events]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const toggleRegister = async (id) => {
    // If already registered, just unregister (no conflict check needed)
    if (registered[id]) {
      const res = await fetch(`${API}/registrations/${id}`, {
        method: "DELETE",
        headers: authH(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Unable to update registration.");
        return;
      }
      setRegistered((p) => ({ ...p, [id]: false }));
      fetchAll();
      return;
    }

    // Check for conflicts before registering (US-15a)
    try {
      const checkRes = await fetch(
        `${API}/registrations/check-conflict?eventId=${id}`,
        {
          headers: authH(),
        },
      );
      if (checkRes.ok) {
        const { conflicts } = await checkRes.json();
        if (conflicts && conflicts.length > 0) {
          // Show warning dialog — registration paused until student decides (US-15b, 15c)
          setConflictWarning({ conflicts, pendingId: id });
          return;
        }
      }
    } catch {
      // If conflict check fails, proceed without warning
    }

    await doRegister(id);
  };

  const doRegister = async (id) => {
    const res = await fetch(`${API}/registrations/${id}`, {
      method: "POST",
      headers: authH(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.message || "Unable to update registration.");
      return;
    }
    setRegistered((p) => ({ ...p, [id]: true }));
    fetchAll();
  };

  const toggleSave = async (id) => {
    const method = saved[id] ? "DELETE" : "POST";
    await fetch(`${API}/bookmarks/${id}`, { method, headers: authH() });
    setSaved((p) => ({ ...p, [id]: !p[id] }));
  };

  const toggleSaveOpp = async (id) => {
    const method = savedOpps[id] ? "DELETE" : "POST";
    await fetch(`${API}/opportunity-bookmarks/${id}`, {
      method,
      headers: authH(),
    });
    setSavedOpps((p) => ({ ...p, [id]: !p[id] }));
  };

  const toggleFollow = async (societyId) => {
    const res = await fetch(`${API}/follows/${societyId}`, {
      method: "POST",
      headers: authH(),
    });
    const data = await res.json();
    setFollows((p) => ({ ...p, [societyId]: data.following }));
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

  const handleClickNotif = async (notif) => {
    if (!notif.is_read) {
      await fetch(`${API}/notifications/${notif.id}/read`, {
        method: "PATCH",
        headers: authH(),
      });
      setNotifications((p) =>
        p.map((n) => (n.id === notif.id ? { ...n, is_read: 1 } : n)),
      );
    }
    setShowNotifs(false);
    if (notif.type === "new_opportunity") {
      setActiveTab("OPPORTUNITIES");
      return;
    }
    if (notif.type === "overloaded_day") {
      setActiveTab("CALENDAR");
      return;
    }
    if (notif.type === "new_society") {
      setActiveTab("SOCIETIES");
      setSocietyView("all");
      setSelectedSociety(null);
      if (notif.related_society_id) {
        const soc = societies.find(
          (s) =>
            s.id === notif.related_society_id ||
            String(s.id) === String(notif.related_society_id),
        );
        if (soc) setSelectedSociety(soc);
      }
      return;
    }
    if (notif.related_event_id) {
      const ev = events.find(
        (e) =>
          e.id === notif.related_event_id ||
          String(e.id) === String(notif.related_event_id),
      );
      if (ev) {
        setHighlightEventId(notif.related_event_id);
        setActiveTab("EVENTS");
        setEventsView("all");
        setEventFilter("All");
        setEventSearch("");
        setDetailEvent(ev);
      } else {
        setActiveTab("EVENTS");
        setEventsView("all");
      }
    } else {
      setActiveTab("EVENTS");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // ── Filter helpers ───────────────────────────────────────────────────────────
  const registeredEvents = events.filter((e) => registered[e.id]);
  const bookmarkedEvents = events.filter((e) => saved[e.id]);
  const followedCount = Object.values(follows).filter(Boolean).length;
  const completedRegs = registrations.filter((r) => Number(r.attended) === 1);
  // Active = registered but NOT yet marked as attended (regardless of event date)
  const activeRegs = registrations.filter((r) => Number(r.attended) !== 1);
  const matchedCategories = [
    ...new Set(
      (user.interests || []).flatMap((id) => INTEREST_TO_CATEGORIES[id] || []),
    ),
  ];
  const today = new Date().toISOString().slice(0, 10);
  const recommendedEvents = events.filter(
    (e) => matchedCategories.includes(e.category) && regStatus(e) === "open",
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const bookmarkFiltered =
    bookmarkTab === "upcoming"
      ? bookmarkedEvents.filter(
          (e) => !e.date || e.date.slice(0, 10) >= todayStr,
        )
      : bookmarkTab === "past"
        ? bookmarkedEvents.filter(
            (e) => e.date && e.date.slice(0, 10) < todayStr,
          )
        : bookmarkedEvents;

  const displayedEvents = (() => {
    let base =
      eventsView === "registered"
        ? registeredEvents
        : eventsView === "bookmarked"
          ? bookmarkFiltered
          : eventsView === "recommended"
            ? recommendedEvents
            : events;
    if (eventFilter !== "All")
      base = base.filter((e) => e.category === eventFilter);
    if (eventSearch)
      base = base.filter((e) =>
        e.title.toLowerCase().includes(eventSearch.toLowerCase()),
      );
    return base;
  })();

  const goToEvents = (view = "all") => {
    setActiveTab("EVENTS");
    setEventsView(view);
    setEventFilter("All");
    setEventSearch("");
  };

  const navItems = [
    { name: "HOME", icon: <Home size={20} /> },
    { name: "EVENTS", icon: <Calendar size={20} /> },
    { name: "CALENDAR", icon: <CalendarDays size={20} /> },
    { name: "SOCIETIES", icon: <Users size={20} /> },
    { name: "OPPORTUNITIES", icon: <Briefcase size={20} /> },
    { name: "PROFILE", icon: <User size={20} /> },
  ];

  // ── RENDER HOME ──────────────────────────────────────────────────────────────
  const renderHome = () => {
    const recEvents = [...events]
      .sort((a, b) => (b.registration_count || 0) - (a.registration_count || 0))
      .slice(0, 4);
    return (
      <div className="home-content">
        <div className="body-header">
          <h1 className="welcome-text">HOME</h1>
        </div>
        <div className="stat-cards-row">
          {[
            {
              label: "Registered",
              value: activeRegs.length,
              color: "#4FC3F7",
              view: "registered",
            },
            {
              label: "Bookmarked",
              value: bookmarkedEvents.length,
              color: "#FFB74D",
              view: "bookmarked",
            },
            {
              label: "Following",
              value: followedCount,
              color: "#66BB6A",
              view: "societies",
            },
            {
              label: "Opportunities",
              value: opportunities.length,
              color: "#BA68C8",
              view: "opportunities",
            },
          ].map((s) => (
            <div
              className="stat-card"
              key={s.label}
              onClick={() => {
                if (s.view === "societies") {
                  setActiveTab("SOCIETIES");
                  setSocietyView("followed");
                  setSelectedSociety(null);
                } else if (s.view === "opportunities") {
                  setActiveTab("OPPORTUNITIES");
                } else goToEvents(s.view);
              }}
              style={{ cursor: "pointer" }}
            >
              <span className="stat-number" style={{ color: s.color }}>
                {s.value}
              </span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="section-block">
          <div className="section-heading-row">
            <h2 className="section-heading">📌 Upcoming Events</h2>
            <button className="view-all-btn" onClick={() => goToEvents("all")}>
              View All →
            </button>
          </div>
          {loading ? (
            <p style={{ color: "#92898A" }}>Loading...</p>
          ) : (
            <div className="upcoming-list">
              {events
                .filter(
                  (e) =>
                    !e.registration_deadline ||
                    !isDeadlinePassed(e.registration_deadline),
                )
                .slice(0, 5)
                .map((ev) => (
                  <div
                    className="upcoming-row"
                    key={ev.id}
                    onClick={() => setDetailEvent(ev)}
                    style={{ cursor: "pointer", transition: "background .2s" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(189,217,191,.06)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div>
                      <p className="upcoming-title">{ev.title}</p>
                      <p className="upcoming-venue">
                        {ev.society_name} · {ev.location}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="upcoming-date">{fmt(ev.date)}</span>
                      <p
                        style={{
                          margin: ".2rem 0 0",
                          fontSize: ".75rem",
                          color:
                            deadlineLbl(ev.registration_deadline) === "Closed"
                              ? "#EF5350"
                              : "#FFB74D",
                        }}
                      >
                        {deadlineLbl(ev.registration_deadline)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="section-block">
          <div className="section-heading-row">
            <h2 className="section-heading">✨ Recommended for You</h2>
            <button
              className="view-all-btn"
              onClick={() => goToEvents("recommended")}
            >
              View All →
            </button>
          </div>
          {loading ? (
            <p style={{ color: "#92898A" }}>Loading...</p>
          ) : (
            (() => {
              if (matchedCategories.length === 0) {
                return (
                  <div
                    style={{
                      background: "rgba(79,195,247,.06)",
                      border: "1px solid rgba(79,195,247,.2)",
                      borderRadius: "14px",
                      padding: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      gap: ".75rem",
                    }}
                  >
                    <span style={{ fontSize: "2rem" }}>🎯</span>
                    <p
                      style={{
                        margin: 0,
                        color: "#BDD9BF",
                        fontSize: ".95rem",
                        fontFamily: "Aldrich,sans-serif",
                      }}
                    >
                      No interests set yet
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: "#92898A",
                        fontSize: ".84rem",
                        lineHeight: 1.6,
                      }}
                    >
                      Go to your Profile and add your interests to get
                      personalized event recommendations right here.
                    </p>
                    <button
                      onClick={() => setActiveTab("PROFILE")}
                      style={{
                        padding: ".45rem 1.1rem",
                        borderRadius: "20px",
                        background: "rgba(79,195,247,.15)",
                        border: "1px solid rgba(79,195,247,.35)",
                        color: "#4FC3F7",
                        cursor: "pointer",
                        fontFamily: "Nova Square,sans-serif",
                        fontSize: ".82rem",
                        marginTop: ".25rem",
                      }}
                    >
                      Set Interests →
                    </button>
                  </div>
                );
              }
              const preview = recommendedEvents.slice(0, 5);
              if (preview.length === 0) {
                return (
                  <div
                    style={{
                      background: "rgba(102,187,106,.05)",
                      border: "1px solid rgba(102,187,106,.15)",
                      borderRadius: "14px",
                      padding: "1.5rem",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 .4rem",
                        color: "#66BB6A",
                        fontSize: ".95rem",
                      }}
                    >
                      🎉 You're all caught up!
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: "#92898A",
                        fontSize: ".84rem",
                      }}
                    >
                      No upcoming events match your interests (
                      {matchedCategories.join(", ") || "none set"}) right now.
                      Check back soon!
                    </p>
                  </div>
                );
              }
              return (
                <>
                  <p
                    style={{
                      margin: "0 0 1rem",
                      color: "#92898A",
                      fontSize: ".82rem",
                    }}
                  >
                    Based on your interests:{" "}
                    {matchedCategories.map((cat) => (
                      <span
                        key={cat}
                        style={{
                          background: "rgba(189,217,191,.1)",
                          color: "#BDD9BF",
                          padding: ".15rem .55rem",
                          borderRadius: "12px",
                          fontSize: ".76rem",
                          marginLeft: ".35rem",
                          border: "1px solid rgba(189,217,191,.25)",
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    {preview.map((ev) => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        registered={!!registered[ev.id]}
                        saved={!!saved[ev.id]}
                        onRegister={toggleRegister}
                        onSave={toggleSave}
                        onViewDetail={setDetailEvent}
                      />
                    ))}
                  </div>
                </>
              );
            })()
          )}
        </div>

        <div className="section-block">
          <div className="section-heading-row">
            <h2 className="section-heading">🔥 Trending Events</h2>
            <button className="view-all-btn" onClick={() => goToEvents("all")}>
              View All →
            </button>
          </div>
          {loading ? (
            <p style={{ color: "#92898A" }}>Loading...</p>
          ) : recEvents.length > 0 ? (
            <>
              <div className="rec-carousel-wrapper">
                <button
                  className="rec-arrow left"
                  onClick={() =>
                    setRecIndex(
                      (p) => (p - 1 + recEvents.length) % recEvents.length,
                    )
                  }
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="rec-track-clip">
                  <div
                    className="rec-track"
                    style={{ transform: `translateX(-${recIndex * 100}%)` }}
                  >
                    {recEvents.map((ev) => (
                      <div className="rec-slide" key={ev.id}>
                        <EventCard
                          event={ev}
                          registered={!!registered[ev.id]}
                          saved={!!saved[ev.id]}
                          onRegister={toggleRegister}
                          onSave={toggleSave}
                          onViewDetail={setDetailEvent}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  className="rec-arrow right"
                  onClick={() => setRecIndex((p) => (p + 1) % recEvents.length)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="rec-dots">
                {recEvents.map((_, i) => (
                  <span
                    key={i}
                    className={`rec-dot ${i === recIndex ? "active" : ""}`}
                    onClick={() => setRecIndex(i)}
                  />
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: "#92898A" }}>No events yet.</p>
          )}
        </div>
      </div>
    );
  };

  // ── RENDER EVENTS ────────────────────────────────────────────────────────────
  const renderEvents = () => (
    <div className="discover-content">
      <div className="body-header">
        <h1 className="welcome-text">
          {eventsView === "registered"
            ? "REGISTERED EVENTS"
            : eventsView === "bookmarked"
              ? "BOOKMARKED EVENTS"
              : eventsView === "recommended"
                ? "RECOMMENDED FOR YOU"
                : "ALL EVENTS"}
        </h1>
      </div>
      <div
        style={{
          display: "flex",
          gap: ".5rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        {[
          ["all", "All Events", events.length],
          ["registered", "Registered", registeredEvents.length],
          ["bookmarked", "Bookmarked", bookmarkedEvents.length],
          ["recommended", "Recommended", recommendedEvents.length],
        ].map(([v, lbl, cnt]) => (
          <button
            key={v}
            onClick={() => {
              setEventsView(v);
              setEventFilter("All");
            }}
            style={{
              padding: ".4rem 1rem",
              borderRadius: "20px",
              border: "1px solid",
              cursor: "pointer",
              fontFamily: "Nova Square,sans-serif",
              fontSize: ".82rem",
              background:
                eventsView === v
                  ? v === "recommended"
                    ? "rgba(186,104,200,.2)"
                    : "rgba(189,217,191,.15)"
                  : "transparent",
              borderColor:
                eventsView === v
                  ? v === "recommended"
                    ? "rgba(186,104,200,.6)"
                    : "rgba(189,217,191,.5)"
                  : "rgba(189,217,191,.15)",
              color:
                eventsView === v
                  ? v === "recommended"
                    ? "#BA68C8"
                    : "#BDD9BF"
                  : "#92898A",
            }}
          >
            {lbl} ({cnt})
          </button>
        ))}
      </div>

      {eventsView !== "recommended" && (
        <div className="search-filter-bar" style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div
              className="filter-tags"
              style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`filter-tag ${eventFilter === cat ? "active" : ""}`}
                  onClick={() => setEventFilter(cat)}
                >
                  {CAT_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
            {eventsView === "bookmarked" && (
              <div
                style={{
                  display: "flex",
                  gap: ".4rem",
                  marginLeft: "auto",
                  whiteSpace: "nowrap",
                }}
              >
                {[
                  ["all", "All"],
                  ["upcoming", "Upcoming"],
                  ["past", "Past"],
                ].map(([v, lbl]) => (
                  <button
                    key={v}
                    onClick={() => setBookmarkTab(v)}
                    style={{
                      padding: ".3rem .85rem",
                      borderRadius: "20px",
                      border: "1px solid",
                      cursor: "pointer",
                      fontFamily: "Nova Square,sans-serif",
                      fontSize: ".78rem",
                      background:
                        bookmarkTab === v
                          ? "rgba(255,183,77,.15)"
                          : "transparent",
                      borderColor:
                        bookmarkTab === v
                          ? "rgba(255,183,77,.5)"
                          : "rgba(189,217,191,.15)",
                      color: bookmarkTab === v ? "#FFB74D" : "#92898A",
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {eventsView === "recommended" && matchedCategories.length > 0 && (
        <p style={{ margin: "0 0 1rem", color: "#92898A", fontSize: ".82rem" }}>
          Showing upcoming events matching your interests:{" "}
          {matchedCategories.map((cat) => (
            <span
              key={cat}
              style={{
                background: "rgba(189,217,191,.1)",
                color: "#BDD9BF",
                padding: ".15rem .55rem",
                borderRadius: "12px",
                fontSize: ".76rem",
                marginLeft: ".35rem",
                border: "1px solid rgba(189,217,191,.25)",
              }}
            >
              {cat}
            </span>
          ))}
        </p>
      )}

      <p className="results-count">
        {displayedEvents.length} event{displayedEvents.length !== 1 ? "s" : ""}{" "}
        found
      </p>

      {loading ? (
        <p style={{ color: "#92898A" }}>Loading events...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {displayedEvents.length === 0 ? (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "#92898A",
                border: "1px solid rgba(189,217,191,.08)",
                borderRadius: "16px",
              }}
            >
              {eventsView === "registered"
                ? "🎫 You haven't registered for any events yet."
                : eventsView === "bookmarked"
                  ? "🔖 You haven't bookmarked any events yet."
                  : eventsView === "recommended"
                    ? "✨ No upcoming events match your interests right now."
                    : "No events match your filter."}
            </div>
          ) : (
            displayedEvents.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                registered={!!registered[ev.id]}
                saved={!!saved[ev.id]}
                onRegister={toggleRegister}
                onSave={toggleSave}
                onViewDetail={setDetailEvent}
              />
            ))
          )}
        </div>
      )}
    </div>
  );

  // ── RENDER SOCIETIES ─────────────────────────────────────────────────────────
  const renderSocieties = () => {
    if (selectedSociety) {
      const socEvents = events.filter(
        (e) => e.society_name === selectedSociety.name,
      );
      const isFollowing = !!follows[selectedSociety.id];
      return (
        <div className="discover-content">
          <div
            className="body-header"
            style={{ display: "flex", alignItems: "center", gap: "1rem" }}
          >
            <button
              onClick={() => setSelectedSociety(null)}
              className="icon-btn"
              style={{
                background: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.1)",
                color: "#fff",
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="welcome-text" style={{ margin: 0 }}>
              {selectedSociety.name}
            </h1>
          </div>
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              gap: "2rem",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "16px",
                background: "rgba(189,217,191,.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.5rem",
                border: "1px solid rgba(189,217,191,.2)",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {selectedSociety.avatar_url ? (
                <img
                  src={selectedSociety.avatar_url}
                  alt={selectedSociety.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                selectedSociety.name.charAt(0)
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: "0 0 .5rem", color: "#fff" }}>
                {selectedSociety.name}
              </h2>
              <p
                style={{
                  color: "#BDD9BF",
                  lineHeight: 1.6,
                  marginBottom: "1rem",
                }}
              >
                {selectedSociety.description}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: ".4rem",
                  flexWrap: "wrap",
                  marginBottom: "1.25rem",
                }}
              >
                {(selectedSociety.focus_areas || []).map((fa) => (
                  <span
                    key={fa}
                    style={{
                      background: "rgba(189,217,191,.08)",
                      color: "#92898A",
                      padding: ".25rem .7rem",
                      borderRadius: "12px",
                      fontSize: ".78rem",
                    }}
                  >
                    {fa}
                  </span>
                ))}
              </div>
              <button
                onClick={() => toggleFollow(selectedSociety.id)}
                className={isFollowing ? "btn-registered" : "btn-register"}
                style={{ display: "flex", alignItems: "center", gap: ".5rem" }}
              >
                {isFollowing ? (
                  <>
                    <CheckCircle2 size={15} /> Following
                  </>
                ) : (
                  "+ Follow Society"
                )}
              </button>
            </div>
          </div>
          <div style={{ marginTop: "2.5rem" }}>
            <h3
              style={{
                color: "#BDD9BF",
                marginBottom: "1rem",
                fontFamily: "Aldrich,sans-serif",
                fontSize: "1rem",
                letterSpacing: "1px",
              }}
            >
              EVENTS BY THIS SOCIETY ({socEvents.length})
            </h3>
            {socEvents.length === 0 ? (
              <p style={{ color: "#92898A" }}>No events posted yet.</p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {socEvents.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    registered={!!registered[ev.id]}
                    saved={!!saved[ev.id]}
                    onRegister={toggleRegister}
                    onSave={toggleSave}
                    onViewDetail={setDetailEvent}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="discover-content">
        <div className="body-header">
          <h1 className="welcome-text">SOCIETIES</h1>
        </div>
        <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.25rem" }}>
          {[
            ["all", "All Societies", societies.length],
            ["followed", "Following", followedCount],
          ].map(([v, lbl, cnt]) => (
            <button
              key={v}
              onClick={() => setSocietyView(v)}
              style={{
                padding: ".4rem 1.1rem",
                borderRadius: "20px",
                border: "1px solid",
                cursor: "pointer",
                fontFamily: "Nova Square,sans-serif",
                fontSize: ".82rem",
                background:
                  societyView === v ? "rgba(189,217,191,.15)" : "transparent",
                borderColor:
                  societyView === v
                    ? "rgba(189,217,191,.5)"
                    : "rgba(189,217,191,.15)",
                color: societyView === v ? "#BDD9BF" : "#92898A",
              }}
            >
              {lbl} ({cnt})
            </button>
          ))}
        </div>
        {loading ? (
          <p style={{ color: "#92898A" }}>Loading...</p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {societies.filter((soc) =>
              societyView === "followed" ? !!follows[soc.id] : true,
            ).length === 0 ? (
              <div
                style={{
                  padding: "3rem",
                  textAlign: "center",
                  color: "#92898A",
                  border: "1px solid rgba(189,217,191,.08)",
                  borderRadius: "16px",
                }}
              >
                You're not following any societies yet. Explore and click "+
                Follow"!
              </div>
            ) : null}
            {societies
              .filter((soc) =>
                societyView === "followed" ? !!follows[soc.id] : true,
              )
              .map((soc) => {
                const isFollowing = !!follows[soc.id];
                const socEvCount = events.filter(
                  (e) => e.society_name === soc.name,
                ).length;
                return (
                  <div
                    key={soc.id}
                    className="carousel-card"
                    style={{
                      height: "auto",
                      minHeight: "140px",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedSociety(soc)}
                  >
                    <div
                      className="card-image"
                      style={{
                        width: "22%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(189,217,191,.04)",
                        fontSize: "2.2rem",
                        color: "#BDD9BF",
                        overflow: "hidden",
                        flexShrink: 0,
                        aspectRatio: "1",
                        maxHeight: "140px",
                      }}
                    >
                      {soc.avatar_url ? (
                        <img
                          src={soc.avatar_url}
                          alt={soc.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        soc.name.charAt(0)
                      )}
                    </div>
                    <div
                      className="card-content"
                      style={{ width: "78%", padding: "1.1rem 1.4rem" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: ".4rem",
                        }}
                      >
                        <h3 style={{ margin: 0, fontSize: "1rem" }}>
                          {soc.name}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollow(soc.id);
                          }}
                          style={{
                            background: isFollowing
                              ? "rgba(76,175,80,.15)"
                              : "rgba(189,217,191,.08)",
                            border: `1px solid ${isFollowing ? "rgba(76,175,80,.3)" : "rgba(189,217,191,.2)"}`,
                            color: isFollowing ? "#66BB6A" : "#BDD9BF",
                            padding: ".3rem .8rem",
                            borderRadius: "20px",
                            cursor: "pointer",
                            fontSize: ".78rem",
                            fontFamily: "Nova Square,sans-serif",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {isFollowing ? "✓ Following" : "+ Follow"}
                        </button>
                      </div>
                      <p
                        style={{
                          color: "#92898A",
                          fontSize: ".85rem",
                          lineHeight: 1.5,
                          margin: "0 0 .6rem",
                        }}
                      >
                        {soc.description}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: ".4rem",
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        {(soc.focus_areas || []).slice(0, 3).map((fa) => (
                          <span
                            key={fa}
                            style={{
                              background: "rgba(189,217,191,.06)",
                              color: "#685369",
                              padding: ".2rem .55rem",
                              borderRadius: "10px",
                              fontSize: ".72rem",
                            }}
                          >
                            {fa}
                          </span>
                        ))}
                        <span
                          style={{
                            color: "#685369",
                            fontSize: ".78rem",
                            marginLeft: "auto",
                          }}
                        >
                          {socEvCount} event{socEvCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  };

  // ── RENDER PROFILE ───────────────────────────────────────────────────────────
  const renderProfile = () => {
    const totalReg = activeRegs.length;
    const totalBkm = bookmarkedEvents.length;
    const totalFol = followedCount;

    const completed = completedRegs.length;
    const upcoming = activeRegs.filter(
      (r) => new Date(r.date) >= new Date(),
    ).length;
    const interests = user.interests || [];

    return (
      <div className="discover-content">
        <div className="body-header">
          <h1 className="welcome-text">PROFILE</h1>
        </div>
        <div
          style={{
            background: "rgba(12,24,33,.6)",
            border: "1px solid rgba(189,217,191,.1)",
            borderRadius: "20px",
            padding: "2rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "rgba(189,217,191,.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                color: "#BDD9BF",
                border: "2px solid rgba(189,217,191,.3)",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                (user.full_name || "S").charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2
                style={{
                  margin: "0 0 .25rem",
                  fontSize: "1.4rem",
                  color: "#fff",
                }}
              >
                {user.full_name}
              </h2>
              <p
                style={{
                  margin: "0 0 .5rem",
                  color: "#92898A",
                  fontSize: ".9rem",
                }}
              >
                {user.email}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: ".75rem",
                  alignItems: "center",
                  marginTop: ".5rem",
                }}
              >
                <span
                  style={{
                    background: "rgba(79,195,247,.12)",
                    color: "#4FC3F7",
                    padding: ".25rem .75rem",
                    borderRadius: "20px",
                    fontSize: ".78rem",
                  }}
                >
                  Student
                </span>
                <button
                  onClick={() => {
                    setEditForm({
                      full_name: user.full_name || "",
                      interests: user.interests || [],
                      avatar_url: user.avatar_url || "",
                    });
                    setEditMsg("");
                    setShowEditProfile(true);
                  }}
                  style={{
                    background: "rgba(189,217,191,.08)",
                    border: "1px solid rgba(189,217,191,.2)",
                    color: "#BDD9BF",
                    padding: ".3rem .85rem",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontSize: ".78rem",
                    fontFamily: "Nova Square,sans-serif",
                  }}
                >
                  ✏️ Edit Profile
                </button>
              </div>
            </div>
          </div>
          {interests.length > 0 && (
            <div>
              <p
                style={{
                  color: "#685369",
                  fontSize: ".8rem",
                  marginBottom: ".5rem",
                  fontFamily: "Aldrich,sans-serif",
                  letterSpacing: "1px",
                }}
              >
                INTERESTS
              </p>
              <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                {interests.map((i) => (
                  <span
                    key={i}
                    style={{
                      background: "rgba(189,217,191,.08)",
                      color: "#BDD9BF",
                      padding: ".3rem .8rem",
                      borderRadius: "20px",
                      fontSize: ".8rem",
                    }}
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <p
          style={{
            color: "#BDD9BF",
            fontSize: ".8rem",
            marginBottom: ".75rem",
            fontFamily: "Aldrich,sans-serif",
            letterSpacing: "1px",
            opacity: 0.7,
          }}
        >
          ACTIVITY STATS
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          {[
            { label: "Registered", value: totalReg, color: "#4FC3F7" },
            { label: "Bookmarked", value: totalBkm, color: "#FFB74D" },
            { label: "Following", value: totalFol, color: "#66BB6A" },
            { label: "Completed", value: completed, color: "#BA68C8" },
            { label: "Upcoming", value: upcoming, color: "#4DB6AC" },
            { label: "All Events", value: events.length, color: "#F06292" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "rgba(12,24,33,.5)",
                border: "1px solid rgba(189,217,191,.08)",
                borderRadius: "14px",
                padding: "1.25rem",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: s.color,
                  fontFamily: "Aldrich,sans-serif",
                }}
              >
                {s.value}
              </span>
              <span style={{ fontSize: ".8rem", color: "#92898A" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {registrations.length > 0 &&
          (() => {
            const barTotal = registrations.length;
            const barPct = Math.round((completed / barTotal) * 100);
            return (
              <div
                onClick={() => setShowCompletedModal(true)}
                style={{
                  background: "rgba(12,24,33,.5)",
                  border: "1px solid rgba(189,217,191,.08)",
                  borderRadius: "14px",
                  padding: "1.5rem",
                  marginBottom: "1.5rem",
                  cursor: "pointer",
                  transition: "border-color .2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(189,217,191,.25)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(189,217,191,.08)")
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: ".75rem",
                  }}
                >
                  <span style={{ color: "#BDD9BF", fontSize: ".9rem" }}>
                    Events Completed
                  </span>
                  <span style={{ color: "#BA68C8", fontSize: ".9rem" }}>
                    {completed}/{barTotal}
                  </span>
                </div>
                <div
                  style={{
                    background: "rgba(189,217,191,.08)",
                    borderRadius: "99px",
                    height: "8px",
                  }}
                >
                  <div
                    style={{
                      width: `${barPct}%`,
                      height: "100%",
                      background: "linear-gradient(90deg,#BA68C8,#4FC3F7)",
                      borderRadius: "99px",
                      transition: "width .5s ease",
                    }}
                  />
                </div>
              </div>
            );
          })()}
      </div>
    );
  };

  // ── RENDER CALENDAR ──────────────────────────────────────────────────────────
  const renderCalendar = () => {
    const CAL_COLORS = {
      Technical: {
        bg: "rgba(79,195,247,.22)",
        border: "#4FC3F7",
        text: "#4FC3F7",
      },
      Competitions: {
        bg: "rgba(186,104,200,.22)",
        border: "#BA68C8",
        text: "#BA68C8",
      },
      Career: {
        bg: "rgba(102,187,106,.22)",
        border: "#66BB6A",
        text: "#66BB6A",
      },
      Social: {
        bg: "rgba(255,183,77,.22)",
        border: "#FFB74D",
        text: "#FFB74D",
      },
      Arts: { bg: "rgba(240,98,146,.22)", border: "#F06292", text: "#F06292" },
      Sports: { bg: "rgba(239,83,80,.22)", border: "#EF5350", text: "#EF5350" },
      default: {
        bg: "rgba(189,217,191,.15)",
        border: "#BDD9BF",
        text: "#BDD9BF",
      },
    };

    const calColor = (cat) => CAL_COLORS[cat] || CAL_COLORS.default;
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const MONTHS = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const evByDate = {};
    registeredEvents.forEach((ev) => {
      if (!ev.date) return;
      const key = ev.date.slice(0, 10);
      if (!evByDate[key]) evByDate[key] = [];
      evByDate[key].push(ev);
    });

    // US-15d: Compute which registered event IDs are in a time conflict
    const conflictingEventIds = new Set();
    Object.values(evByDate).forEach((dayEvs) => {
      if (dayEvs.length < 2) return;
      for (let a = 0; a < dayEvs.length; a++) {
        for (let b = a + 1; b < dayEvs.length; b++) {
          const t1 = (dayEvs[a].time || "").trim();
          const t2 = (dayEvs[b].time || "").trim();
          const clash = (!t1 && !t2) || !t1 || !t2 || t1 === t2;
          if (clash) {
            conflictingEventIds.add(dayEvs[a].id);
            conflictingEventIds.add(dayEvs[b].id);
          }
        }
      }
    });
    const toKey = (y, m, d) =>
      `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const todayKey = new Date().toISOString().slice(0, 10);
    const startOfWeek = new Date(calDate);
    startOfWeek.setDate(calDate.getDate() - calDate.getDay());
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
    const navMonth = (dir) => setCalDate(new Date(year, month + dir, 1));
    const navWeek = (dir) => {
      const d = new Date(calDate);
      d.setDate(d.getDate() + dir * 7);
      setCalDate(d);
    };

    return (
      <div className="discover-content">
        <style>{`@keyframes calFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <div className="body-header">
          <h1 className="welcome-text">CALENDAR</h1>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", gap: ".5rem" }}>
            {[
              ["month", "Month"],
              ["week", "Week"],
            ].map(([v, lbl]) => (
              <button
                key={v}
                onClick={() => setCalView(v)}
                style={{
                  padding: ".4rem 1.1rem",
                  borderRadius: "20px",
                  border: "1px solid",
                  cursor: "pointer",
                  fontFamily: "Nova Square,sans-serif",
                  fontSize: ".82rem",
                  background:
                    calView === v ? "rgba(189,217,191,.15)" : "transparent",
                  borderColor:
                    calView === v
                      ? "rgba(189,217,191,.5)"
                      : "rgba(189,217,191,.15)",
                  color: calView === v ? "#BDD9BF" : "#92898A",
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => (calView === "month" ? navMonth(-1) : navWeek(-1))}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(189,217,191,.18)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(189,217,191,.08)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              style={{
                background: "rgba(189,217,191,.08)",
                border: "1px solid rgba(189,217,191,.15)",
                color: "#BDD9BF",
                borderRadius: "8px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all .18s",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span
              style={{
                fontFamily: "Aldrich,sans-serif",
                fontSize: "1rem",
                color: "#BDD9BF",
                minWidth: "180px",
                textAlign: "center",
              }}
            >
              {calView === "month"
                ? `${MONTHS[month]} ${year}`
                : `${weekDays[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
            </span>
            <button
              onClick={() => (calView === "month" ? navMonth(1) : navWeek(1))}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(189,217,191,.18)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(189,217,191,.08)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              style={{
                background: "rgba(189,217,191,.08)",
                border: "1px solid rgba(189,217,191,.15)",
                color: "#BDD9BF",
                borderRadius: "8px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all .18s",
              }}
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCalDate(new Date())}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(79,195,247,.22)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(79,195,247,.1)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              style={{
                padding: ".35rem .9rem",
                borderRadius: "20px",
                background: "rgba(79,195,247,.1)",
                border: "1px solid rgba(79,195,247,.3)",
                color: "#4FC3F7",
                cursor: "pointer",
                fontFamily: "Nova Square,sans-serif",
                fontSize: ".78rem",
                transition: "all .18s",
              }}
            >
              Today
            </button>
          </div>
        </div>

        {calView === "month" && (
          <div
            style={{
              background: "rgba(12,24,33,.4)",
              border: "1px solid rgba(189,217,191,.12)",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 4px 32px rgba(0,0,0,.25)",
              animation: "calFadeIn .3s ease",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                borderBottom: "1px solid rgba(189,217,191,.1)",
              }}
            >
              {DAYS.map((d) => (
                <div
                  key={d}
                  style={{
                    padding: ".65rem",
                    textAlign: "center",
                    fontFamily: "Aldrich,sans-serif",
                    fontSize: ".75rem",
                    color: "#92898A",
                    letterSpacing: "1px",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}
            >
              {Array.from({ length: totalCells }, (_, i) => {
                let day, inMonth;
                if (i < firstDay) {
                  day = prevDays - firstDay + i + 1;
                  inMonth = false;
                } else if (i < firstDay + daysInMonth) {
                  day = i - firstDay + 1;
                  inMonth = true;
                } else {
                  day = i - firstDay - daysInMonth + 1;
                  inMonth = false;
                }
                const key = inMonth ? toKey(year, month, day) : null;
                const cellEvs = key ? evByDate[key] || [] : [];
                const isToday = key === todayKey;
                const col = i % 7;
                const hasEvents = cellEvs.length > 0;
                return (
                  <div
                    key={i}
                    onMouseEnter={(e) => {
                      if (inMonth && !isToday) {
                        e.currentTarget.style.background = hasEvents
                          ? "rgba(189,217,191,.07)"
                          : "rgba(189,217,191,.04)";
                        e.currentTarget.style.transform = "scale(1.02)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isToday
                        ? "rgba(79,195,247,.06)"
                        : "transparent";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    style={{
                      minHeight: "100px",
                      padding: ".5rem .4rem",
                      borderRight:
                        col < 6 ? "1px solid rgba(189,217,191,.06)" : "none",
                      borderBottom:
                        i < totalCells - 7
                          ? "1px solid rgba(189,217,191,.06)"
                          : "none",
                      background: isToday
                        ? "rgba(79,195,247,.06)"
                        : "transparent",
                      opacity: inMonth ? 1 : 0.3,
                      transition: "background .2s, transform .15s",
                      position: "relative",
                      cursor: inMonth && hasEvents ? "pointer" : "default",
                    }}
                  >
                    {isToday && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          pointerEvents: "none",
                          boxShadow: "inset 0 0 0 1.5px rgba(79,195,247,.35)",
                        }}
                      />
                    )}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        fontSize: ".82rem",
                        fontFamily: "Aldrich,sans-serif",
                        marginBottom: ".3rem",
                        background: isToday ? "#4FC3F7" : "transparent",
                        color: isToday
                          ? "#0C1821"
                          : inMonth
                            ? "#BDD9BF"
                            : "#685369",
                        fontWeight: isToday ? "bold" : "normal",
                      }}
                    >
                      {day}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      {cellEvs.slice(0, 3).map((ev) => {
                        const c = calColor(ev.category);
                        return (
                          <div
                            key={ev.id}
                            onClick={() => setDetailEvent(ev)}
                            title={
                              conflictingEventIds.has(ev.id)
                                ? `⚠ Schedule conflict: ${ev.title}`
                                : ev.title
                            }
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform =
                                "translateX(2px)";
                              e.currentTarget.style.filter = "brightness(1.25)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateX(0)";
                              e.currentTarget.style.filter = "brightness(1)";
                            }}
                            style={{
                              background: conflictingEventIds.has(ev.id)
                                ? "rgba(239,83,80,.18)"
                                : c.bg,
                              border: conflictingEventIds.has(ev.id)
                                ? "1px solid rgba(239,83,80,.55)"
                                : `1px solid ${c.border}40`,
                              borderLeft: conflictingEventIds.has(ev.id)
                                ? "3px solid #EF5350"
                                : `3px solid ${c.border}`,
                              borderRadius: "3px",
                              padding: "2px 5px",
                              fontSize: ".68rem",
                              color: conflictingEventIds.has(ev.id)
                                ? "#EF5350"
                                : c.text,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontFamily: "Nova Square,sans-serif",
                              transition: "transform .15s, filter .15s",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            {conflictingEventIds.has(ev.id) && (
                              <span
                                style={{ fontSize: ".6rem", flexShrink: 0 }}
                              >
                                ⚠
                              </span>
                            )}
                            <span
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {ev.title}
                            </span>
                          </div>
                        );
                      })}
                      {cellEvs.length > 3 && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setCalDayModal({ date: key, events: cellEvs });
                          }}
                          style={{
                            fontSize: ".65rem",
                            color: "#4FC3F7",
                            paddingLeft: "4px",
                            fontStyle: "italic",
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          +{cellEvs.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {calView === "week" && (
          <div
            style={{
              background: "rgba(12,24,33,.4)",
              border: "1px solid rgba(189,217,191,.12)",
              borderRadius: "16px",
              overflow: "hidden",
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              boxShadow: "0 4px 32px rgba(0,0,0,.25)",
              animation: "calFadeIn .3s ease",
            }}
          >
            {weekDays.map((d, i) => {
              const key = d.toISOString().slice(0, 10);
              const isToday = key === todayKey;
              const cellEvs = evByDate[key] || [];
              return (
                <div
                  key={i}
                  onMouseEnter={(e) => {
                    if (!isToday)
                      e.currentTarget.style.background =
                        "rgba(189,217,191,.03)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isToday)
                      e.currentTarget.style.background = "transparent";
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    borderRight:
                      i < 6 ? "1px solid rgba(189,217,191,.08)" : "none",
                    background: isToday
                      ? "rgba(79,195,247,.04)"
                      : "transparent",
                    transition: "background .2s",
                  }}
                >
                  <div
                    style={{
                      padding: ".75rem .5rem",
                      textAlign: "center",
                      borderBottom: "1px solid rgba(189,217,191,.1)",
                      background: isToday
                        ? "rgba(79,195,247,.07)"
                        : "transparent",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 .3rem",
                        fontFamily: "Aldrich,sans-serif",
                        fontSize: ".72rem",
                        color: "#92898A",
                        letterSpacing: "1px",
                      }}
                    >
                      {DAYS[d.getDay()]}
                    </p>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: isToday ? "#4FC3F7" : "transparent",
                        color: isToday ? "#0C1821" : "#BDD9BF",
                        fontFamily: "Aldrich,sans-serif",
                        fontSize: ".95rem",
                        fontWeight: isToday ? "bold" : "normal",
                      }}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      minHeight: "320px",
                      padding: ".6rem .4rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                    }}
                  >
                    {cellEvs.map((ev) => {
                      const c = calColor(ev.category);
                      const isConflict = conflictingEventIds.has(ev.id);
                      return (
                        <div
                          key={ev.id}
                          onClick={() => setDetailEvent(ev)}
                          title={
                            isConflict
                              ? `⚠ Schedule conflict: ${ev.title}`
                              : ev.title
                          }
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(-2px) scale(1.02)";
                            e.currentTarget.style.boxShadow = isConflict
                              ? "0 6px 18px rgba(239,83,80,.35)"
                              : `0 6px 18px ${c.border}35`;
                            e.currentTarget.style.filter = "brightness(1.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(0) scale(1)";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.filter = "brightness(1)";
                          }}
                          style={{
                            background: isConflict
                              ? "rgba(239,83,80,.15)"
                              : c.bg,
                            border: isConflict
                              ? "1px solid rgba(239,83,80,.5)"
                              : `1px solid ${c.border}50`,
                            borderLeft: isConflict
                              ? "3px solid #EF5350"
                              : `3px solid ${c.border}`,
                            borderRadius: "6px",
                            padding: ".4rem .55rem",
                            cursor: "pointer",
                            transition:
                              "transform .18s, box-shadow .18s, filter .18s",
                          }}
                        >
                          <p
                            style={{
                              margin: "0 0 2px",
                              fontSize: ".75rem",
                              color: isConflict ? "#EF5350" : c.text,
                              fontFamily: "Nova Square,sans-serif",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            {isConflict && (
                              <span
                                style={{ fontSize: ".65rem", flexShrink: 0 }}
                              >
                                ⚠
                              </span>
                            )}
                            <span
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {ev.title}
                            </span>
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: ".68rem",
                              color: isConflict
                                ? "rgba(239,83,80,.7)"
                                : "#92898A",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ev.time || ev.society_name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {registeredEvents.length === 0 && (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "#92898A",
              border: "1px solid rgba(189,217,191,.08)",
              borderRadius: "16px",
              marginTop: "1rem",
            }}
          >
            <p style={{ fontSize: "1.5rem", margin: "0 0 .5rem" }}>📅</p>
            <p style={{ margin: 0 }}>
              You have no registered events yet. Register for events to see them
              here!
            </p>
          </div>
        )}

        {calDayModal && (
          <div
            onClick={() => setCalDayModal(null)}
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
              style={{
                background:
                  "linear-gradient(135deg,var(--theme-bg-from),var(--theme-bg-mid),var(--theme-bg-to))",
                border: "1px solid rgba(var(--theme-accent-rgb),.2)",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "420px",
                maxHeight: "80vh",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "1.25rem 1.5rem",
                  borderBottom: "1px solid rgba(189,217,191,.1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "Aldrich,sans-serif",
                    color: "#BDD9BF",
                    fontSize: "1rem",
                  }}
                >
                  📅{" "}
                  {new Date(calDayModal.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <button
                  onClick={() => setCalDayModal(null)}
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

              {/* Events list */}
              <div
                style={{
                  overflowY: "auto",
                  padding: ".75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: ".5rem",
                }}
              >
                {calDayModal.events.map((ev) => {
                  const c = (() => {
                    const CAL_COLORS = {
                      Technical: {
                        bg: "rgba(79,195,247,.22)",
                        border: "#4FC3F7",
                        text: "#4FC3F7",
                      },
                      Competitions: {
                        bg: "rgba(186,104,200,.22)",
                        border: "#BA68C8",
                        text: "#BA68C8",
                      },
                      Career: {
                        bg: "rgba(102,187,106,.22)",
                        border: "#66BB6A",
                        text: "#66BB6A",
                      },
                      Social: {
                        bg: "rgba(255,183,77,.22)",
                        border: "#FFB74D",
                        text: "#FFB74D",
                      },
                      Arts: {
                        bg: "rgba(240,98,146,.22)",
                        border: "#F06292",
                        text: "#F06292",
                      },
                      Sports: {
                        bg: "rgba(239,83,80,.22)",
                        border: "#EF5350",
                        text: "#EF5350",
                      },
                      default: {
                        bg: "rgba(189,217,191,.15)",
                        border: "#BDD9BF",
                        text: "#BDD9BF",
                      },
                    };
                    return CAL_COLORS[ev.category] || CAL_COLORS.default;
                  })();
                  const isConflict = conflictingEventIds.has(ev.id);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setCalDayModal(null);
                        setDetailEvent(ev);
                      }}
                      style={{
                        padding: ".85rem 1rem",
                        borderRadius: "10px",
                        background: isConflict ? "rgba(239,83,80,.12)" : c.bg,
                        border: isConflict
                          ? "1px solid rgba(239,83,80,.4)"
                          : `1px solid ${c.border}40`,
                        borderLeft: isConflict
                          ? "3px solid #EF5350"
                          : `3px solid ${c.border}`,
                        cursor: "pointer",
                        transition: "opacity .2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = ".8")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = "1")
                      }
                    >
                      <p
                        style={{
                          margin: "0 0 .25rem",
                          color: isConflict ? "#EF5350" : c.text,
                          fontSize: ".9rem",
                          fontFamily: "Aldrich,sans-serif",
                        }}
                      >
                        {isConflict && "⚠ "}
                        {ev.title}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          color: "#92898A",
                          fontSize: ".78rem",
                        }}
                      >
                        {ev.society_name}
                        {ev.time && ` · ${ev.time}`}
                        {ev.location && ` · ${ev.location}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTab = () => {
    if (activeTab === "HOME") return renderHome();
    if (activeTab === "EVENTS") return renderEvents();
    if (activeTab === "CALENDAR") return renderCalendar();
    if (activeTab === "SOCIETIES") return renderSocieties();
    if (activeTab === "OPPORTUNITIES") return renderOpportunities();
    if (activeTab === "PROFILE") return renderProfile();
    return null;
  };

  // ── RENDER OPPORTUNITIES ──────────────────────────────────────────────────────
  const renderOpportunities = () => {
    const baseOpps =
      oppView === "bookmarked"
        ? opportunities.filter((o) => savedOpps[o.id])
        : opportunities;
    const filtered = baseOpps.filter((o) => {
      const matchType = oppFilter === "All" || o.type === oppFilter;
      const matchSearch =
        !oppSearch ||
        o.title.toLowerCase().includes(oppSearch.toLowerCase()) ||
        (o.organization || "")
          .toLowerCase()
          .includes(oppSearch.toLowerCase()) ||
        (o.description || "").toLowerCase().includes(oppSearch.toLowerCase());
      return matchType && matchSearch;
    });

    const deadlineBadge = (d) => {
      if (!d) return { label: "No deadline", color: "#92898A" };
      const diff = (new Date(d) - new Date()) / 86400000;
      if (diff < 0) return { label: "Expired", color: "#EF5350" };
      if (diff < 3)
        return { label: `${Math.ceil(diff)}d left`, color: "#EF5350" };
      if (diff < 7)
        return { label: `${Math.ceil(diff)}d left`, color: "#FFB74D" };
      return { label: `${Math.ceil(diff)}d left`, color: "#66BB6A" };
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Header */}
        <div className="body-header" style={{ marginBottom: 0 }}>
          <h1 className="welcome-text">OPPORTUNITY CORNER</h1>
        </div>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          {[
            ["all", "All Opportunities", opportunities.length],
            [
              "bookmarked",
              "Bookmarked",
              Object.values(savedOpps).filter(Boolean).length,
            ],
          ].map(([v, lbl, cnt]) => (
            <button
              key={v}
              onClick={() => setOppView(v)}
              style={{
                padding: ".4rem 1rem",
                borderRadius: "20px",
                border: "1px solid",
                cursor: "pointer",
                fontFamily: "Nova Square,sans-serif",
                fontSize: ".82rem",
                background:
                  oppView === v
                    ? v === "bookmarked"
                      ? "rgba(255,183,77,.15)"
                      : "rgba(189,217,191,.15)"
                    : "transparent",
                borderColor:
                  oppView === v
                    ? v === "bookmarked"
                      ? "rgba(255,183,77,.5)"
                      : "rgba(189,217,191,.5)"
                    : "rgba(189,217,191,.15)",
                color:
                  oppView === v
                    ? v === "bookmarked"
                      ? "#FFB74D"
                      : "#BDD9BF"
                    : "#92898A",
              }}
            >
              {v === "bookmarked" && "🔖 "}
              {lbl} ({cnt})
            </button>
          ))}
        </div>
        {/* Search + Filter bar */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: "200px",
              display: "flex",
              alignItems: "center",
              gap: ".6rem",
              background: "rgba(189,217,191,.06)",
              border: "1px solid rgba(189,217,191,.15)",
              borderRadius: "10px",
              padding: ".55rem 1rem",
            }}
          >
            <Search size={16} style={{ color: "#92898A", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search opportunities…"
              value={oppSearch}
              onChange={(e) => setOppSearch(e.target.value)}
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--theme-text-primary)",
                fontFamily: "Nova Square,sans-serif",
                fontSize: ".88rem",
                width: "100%",
              }}
            />
            {oppSearch && (
              <button
                onClick={() => setOppSearch("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#92898A",
                  cursor: "pointer",
                  lineHeight: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type filter pills */}
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            {OPP_TYPES.map((t) => {
              const active = oppFilter === t;
              const style = t !== "All" ? oppTypeStyle(t) : null;
              return (
                <button
                  key={t}
                  onClick={() => setOppFilter(t)}
                  style={{
                    padding: ".38rem .9rem",
                    borderRadius: "20px",
                    border: active
                      ? `1px solid ${style ? style.color : "var(--theme-accent)"}`
                      : "1px solid rgba(189,217,191,.2)",
                    background: active
                      ? style
                        ? style.bg
                        : "rgba(var(--theme-accent-rgb),.15)"
                      : "transparent",
                    color: active
                      ? style
                        ? style.color
                        : "var(--theme-accent)"
                      : "#92898A",
                    cursor: "pointer",
                    fontFamily: "Nova Square,sans-serif",
                    fontSize: ".8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: ".35rem",
                    transition: "all .2s",
                  }}
                >
                  {t !== "All" && OPP_TYPE_ICONS[t]}
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary row */}
        <p style={{ margin: 0, color: "#92898A", fontSize: ".82rem" }}>
          {filtered.length === 0
            ? "No opportunities match your filters."
            : `${filtered.length} opportunit${filtered.length === 1 ? "y" : "ies"} found`}
          {Object.values(savedOpps).filter(Boolean).length > 0 && (
            <span style={{ marginLeft: "1rem", color: "#FFB74D" }}>
              · {Object.values(savedOpps).filter(Boolean).length} bookmarked
            </span>
          )}
        </p>

        {/* Opportunity cards */}
        {loading ? (
          <p style={{ color: "#92898A" }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              border: "1px solid rgba(189,217,191,.08)",
              borderRadius: "16px",
              color: "#92898A",
            }}
          >
            <p style={{ fontSize: "2rem", margin: "0 0 .5rem" }}>💼</p>
            <p style={{ margin: 0 }}>
              No opportunities found. Check back soon!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1rem",
            }}
          >
            {filtered.map((opp) => {
              const ts = oppTypeStyle(opp.type);
              const dl = deadlineBadge(opp.deadline);
              const isSaved = !!savedOpps[opp.id];
              return (
                <div
                  key={opp.id}
                  style={{
                    background:
                      "linear-gradient(135deg,var(--theme-bg-from),var(--theme-bg-mid))",
                    border: `1px solid ${ts.border}`,
                    borderRadius: "16px",
                    padding: "1.25rem 1.4rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: ".75rem",
                    transition: "transform .2s, box-shadow .2s",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = `0 8px 24px ${ts.color}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* top accent line */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "3px",
                      background: `linear-gradient(90deg,${ts.color},transparent)`,
                      borderRadius: "16px 16px 0 0",
                    }}
                  />

                  {/* Type badge + bookmark */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: ".35rem",
                        background: ts.bg,
                        color: ts.color,
                        border: `1px solid ${ts.border}`,
                        padding: ".25rem .75rem",
                        borderRadius: "20px",
                        fontSize: ".78rem",
                        fontFamily: "Nova Square,sans-serif",
                      }}
                    >
                      {OPP_TYPE_ICONS[opp.type] || <Briefcase size={12} />}
                      {opp.type}
                    </span>
                    <button
                      onClick={() => toggleSaveOpp(opp.id)}
                      title={isSaved ? "Remove bookmark" : "Save opportunity"}
                      style={{
                        background: isSaved
                          ? "rgba(255,183,77,.15)"
                          : "transparent",
                        border: `1px solid ${isSaved ? "rgba(255,183,77,.4)" : "rgba(255,183,77,.2)"}`,
                        color: "#FFB74D",
                        borderRadius: "8px",
                        padding: ".3rem .5rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: ".3rem",
                        fontSize: ".78rem",
                        fontFamily: "Nova Square,sans-serif",
                        transition: "all .2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255,183,77,.25)";
                        e.currentTarget.style.borderColor =
                          "rgba(255,183,77,.6)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isSaved
                          ? "rgba(255,183,77,.15)"
                          : "transparent";
                        e.currentTarget.style.borderColor = isSaved
                          ? "rgba(255,183,77,.4)"
                          : "rgba(255,183,77,.2)";
                      }}
                    >
                      {isSaved ? (
                        <BookmarkCheck size={14} />
                      ) : (
                        <Bookmark size={14} />
                      )}
                      {isSaved ? "Saved" : "Save"}
                    </button>
                  </div>

                  {/* Title */}
                  <div>
                    <h3
                      style={{
                        margin: "0 0 .3rem",
                        fontSize: "1.05rem",
                        color: "#fff",
                        fontFamily: "Aldrich,sans-serif",
                        lineHeight: 1.35,
                      }}
                    >
                      {opp.title}
                    </h3>
                    {opp.organization && (
                      <p
                        style={{
                          margin: 0,
                          color: "var(--theme-accent)",
                          fontSize: ".82rem",
                          display: "flex",
                          alignItems: "center",
                          gap: ".35rem",
                        }}
                      >
                        <Building2 size={12} /> {opp.organization}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  {opp.description && (
                    <p
                      style={{
                        margin: 0,
                        color: "#92898A",
                        fontSize: ".84rem",
                        lineHeight: 1.6,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {opp.description}
                    </p>
                  )}

                  {/* Deadline + link */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "auto",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: ".35rem",
                        fontSize: ".8rem",
                        color: dl.color,
                      }}
                    >
                      <Clock size={13} />
                      {opp.deadline
                        ? `${new Date(opp.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · ${dl.label}`
                        : "No deadline"}
                    </span>
                    {opp.link && (
                      <a
                        href={opp.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: ".35rem",
                          color: ts.color,
                          fontSize: ".8rem",
                          textDecoration: "none",
                          fontFamily: "Nova Square,sans-serif",
                          padding: ".3rem .7rem",
                          borderRadius: "8px",
                          border: `1px solid ${ts.border}`,
                          background: ts.bg,
                          transition: "opacity .2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.opacity = ".75")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.opacity = "1")
                        }
                      >
                        Apply <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`dashboard-container ${isCollapsed ? "sidebar-collapsed" : ""}`}
    >
      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          registered={!!registered[detailEvent.id]}
          saved={!!saved[detailEvent.id]}
          onClose={() => setDetailEvent(null)}
          onRegister={(id) => {
            toggleRegister(id);
            setDetailEvent((e) => ({ ...e }));
          }}
          onSave={(id) => {
            toggleSave(id);
            setDetailEvent((e) => ({ ...e }));
          }}
        />
      )}

      {showCompletedModal && (
        <div
          onClick={() => setShowCompletedModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2500,
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background:
                "linear-gradient(135deg,var(--theme-bg-from),var(--theme-bg-mid),var(--theme-bg-to))",
              border: "1px solid rgba(var(--theme-accent-rgb),.15)",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid rgba(189,217,191,.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontFamily: "Aldrich,sans-serif",
                  color: "#BDD9BF",
                  fontSize: "1rem",
                }}
              >
                ✅ Completed Events ({completedRegs.length})
              </h3>
              <button
                onClick={() => setShowCompletedModal(false)}
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

            {/* List */}
            <div
              style={{
                overflowY: "auto",
                padding: ".75rem",
                display: "flex",
                flexDirection: "column",
                gap: ".5rem",
              }}
            >
              {completedRegs.length === 0 ? (
                <p
                  style={{
                    color: "#92898A",
                    textAlign: "center",
                    padding: "2rem 0",
                  }}
                >
                  No completed events yet.
                </p>
              ) : (
                completedRegs.map((reg) => {
                  return (
                    <div
                      key={reg.id}
                      onClick={() => {
                        setShowCompletedModal(false);
                        setDetailEvent(reg);
                      }}
                      style={{
                        padding: ".85rem 1rem",
                        borderRadius: "10px",
                        background: "rgba(102,187,106,.08)",
                        border: "1px solid rgba(102,187,106,.2)",
                        borderLeft: "3px solid #66BB6A",
                        cursor: "pointer",
                        transition: "opacity .2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = ".8")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = "1")
                      }
                    >
                      <p
                        style={{
                          margin: "0 0 .25rem",
                          color: "#66BB6A",
                          fontSize: ".9rem",
                          fontFamily: "Aldrich,sans-serif",
                        }}
                      >
                        ✓ {reg.title}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          color: "#92898A",
                          fontSize: ".78rem",
                        }}
                      >
                        {reg.society_name} · {fmt(reg.date)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLinkedInVariant(0);
                          setLinkedInPost(generateLinkedInPost(reg, 0));
                          setLinkedInEvent(reg);
                        }}
                        style={{
                          marginTop: ".5rem",
                          background: "rgba(10,102,194,.15)",
                          border: "1px solid rgba(10,102,194,.3)",
                          color: "#4FC3F7",
                          padding: ".3rem .85rem",
                          borderRadius: "20px",
                          fontSize: ".73rem",
                          fontFamily: "Aldrich,sans-serif",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: ".35rem",
                        }}
                      >
                        🔗 Generate LinkedIn Post
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      {linkedInEvent && (
        <div
          onClick={() => setLinkedInEvent(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.75)",
            zIndex: 3000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background:
                "linear-gradient(135deg,var(--theme-bg-from),var(--theme-bg-mid),var(--theme-bg-to))",
              border: "1px solid rgba(var(--theme-accent-rgb),.2)",
              borderRadius: "18px",
              padding: "2rem",
              width: "min(560px,95vw)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "#BDD9BF",
                  fontFamily: "Aldrich,sans-serif",
                  fontSize: "1rem",
                }}
              >
                🔗 LinkedIn Post Generator
              </h3>
              <button
                onClick={() => setLinkedInEvent(null)}
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
            <p style={{ margin: 0, color: "#92898A", fontSize: ".82rem" }}>
              Generated for:{" "}
              <strong style={{ color: "#BDD9BF" }}>
                {linkedInEvent.title}
              </strong>
            </p>
            <textarea
              value={linkedInPost}
              onChange={(e) => setLinkedInPost(e.target.value)}
              rows={10}
              style={{
                background: "rgba(255,255,255,.05)",
                border: "1px solid rgba(189,217,191,.2)",
                borderRadius: "10px",
                padding: "1rem",
                color: "#fff",
                fontFamily: "Nova Square,sans-serif",
                fontSize: ".85rem",
                lineHeight: 1.7,
                resize: "vertical",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(189,217,191,0.18) rgba(12,24,33,0.4)",
              }}
            />
            <div style={{ display: "flex", gap: ".75rem" }}>
              <button
                onClick={() => {
                  const next = linkedInVariant + 1;
                  setLinkedInVariant(next);
                  setLinkedInPost(generateLinkedInPost(linkedInEvent, next));
                }}
                style={{
                  flex: 1,
                  padding: ".65rem",
                  borderRadius: "10px",
                  cursor: "pointer",
                  background: "rgba(189,217,191,.08)",
                  border: "1px solid rgba(189,217,191,.2)",
                  color: "#BDD9BF",
                  fontFamily: "Aldrich,sans-serif",
                  fontSize: ".82rem",
                }}
              >
                🔄 Regenerate
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(linkedInPost);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                style={{
                  flex: 1,
                  padding: ".65rem",
                  borderRadius: "10px",
                  cursor: "pointer",
                  background: "rgba(var(--theme-accent-rgb),.15)",
                  border: "1px solid rgba(var(--theme-accent-rgb),.3)",
                  color: "var(--theme-accent)",
                  fontFamily: "Aldrich,sans-serif",
                  fontSize: ".82rem",
                }}
              >
                {copySuccess ? "✅ Copied!" : "📋 Copy Post"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showEditProfile &&
        (() => {
          const INTEREST_OPTS = [
            { id: "tech", label: "Technical", icon: "💻" },
            { id: "comp", label: "Competitions", icon: "🏆" },
            { id: "career", label: "Career", icon: "💼" },
            { id: "arts", label: "Arts", icon: "🎨" },
            { id: "sports", label: "Sports", icon: "⚽" },
            { id: "social", label: "Social", icon: "🎉" },
            { id: "research", label: "Research", icon: "🔬" },
          ];
          const toggleInterest = (id) =>
            setEditForm((p) => ({
              ...p,
              interests: p.interests.includes(id)
                ? p.interests.filter((i) => i !== id)
                : [...p.interests, id],
            }));
          const handleSave = async () => {
            setEditMsg("");
            const res = await fetch(`${API}/auth/profile`, {
              method: "PATCH",
              headers: authH(),
              body: JSON.stringify({
                full_name: editForm.full_name,
                interests: editForm.interests,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              setEditMsg(data.message || "Update failed");
              return;
            }
            if (editForm.avatar_url !== (user.avatar_url || "")) {
              await fetch(`${API}/admin/avatar`, {
                method: "PATCH",
                headers: authH(),
                body: JSON.stringify({ avatar_url: editForm.avatar_url }),
              });
            }
            const updated = {
              ...user,
              full_name: editForm.full_name,
              interests: editForm.interests,
              avatar_url: editForm.avatar_url,
            };
            localStorage.setItem("user", JSON.stringify(updated));
            setEditMsg("✅ Profile updated!");
            setTimeout(() => {
              setShowEditProfile(false);
              window.location.reload();
            }, 1000);
          };
          const handleFetchSecurityQuestion = async () => {
            setPwMsg("");
            try {
              const res = await fetch(`${API}/auth/security-question`, {
                headers: authH(),
              });
              const data = await res.json();
              if (!res.ok) {
                setPwMsg(data.message || "Failed to load security question");
                return;
              }
              setPwSecurityQuestion(data.security_question);
              setPwStep(2);
            } catch {
              setPwMsg("Network error");
            }
          };
          const handleChangePassword = async () => {
            setPwMsg("");
            if (!pwSecurityAnswer.trim()) {
              setPwMsg("Please enter your security answer");
              return;
            }
            if (!pwNew || pwNew.length < 6) {
              setPwMsg("New password must be at least 6 characters");
              return;
            }
            if (pwNew !== pwConfirm) {
              setPwMsg("Passwords do not match");
              return;
            }
            try {
              const res = await fetch(`${API}/auth/change-password`, {
                method: "POST",
                headers: authH(),
                body: JSON.stringify({
                  security_answer: pwSecurityAnswer,
                  newPassword: pwNew,
                }),
              });
              const data = await res.json();
              if (!res.ok) {
                setPwMsg(data.message || "Failed to change password");
                return;
              }
              setPwMsg("✅ Password changed successfully!");
              setPwSecurityAnswer("");
              setPwNew("");
              setPwConfirm("");
              setTimeout(() => {
                setShowEditProfile(false);
                setPwStep(1);
                setPwMsg("");
                setEditTab("profile");
              }, 1500);
            } catch {
              setPwMsg("Network error");
            }
          };
          const inputStyle = {
            background: "rgba(5,15,25,.6)",
            border: "1px solid rgba(var(--theme-accent-rgb), .2)",
            borderRadius: "8px",
            padding: ".7rem 1rem",
            color: "#fff",
            width: "100%",
            fontFamily: "Nova Square,sans-serif",
            fontSize: ".9rem",
            boxSizing: "border-box",
            outline: "none",
          };
          const labelStyle = {
            color: "var(--theme-text-primary)",
            fontSize: ".75rem",
            display: "block",
            marginBottom: ".4rem",
            letterSpacing: "1px",
            opacity: 0.8,
          };
          return (
            <div
              onClick={() => {
                setShowEditProfile(false);
                setEditTab("profile");
                setPwStep(1);
                setPwMsg("");
              }}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2500,
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
                  maxWidth: "500px",
                  maxHeight: "88vh",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* ── Modal Header ── */}
                <div
                  style={{
                    position: "relative",
                    padding: "1.5rem 1.75rem 1.1rem",
                    borderBottom:
                      "1px solid rgba(var(--theme-accent-rgb), .08)",
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
                        STUDENT
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
                        Edit Profile
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        setShowEditProfile(false);
                        setEditTab("profile");
                        setPwStep(1);
                        setPwMsg("");
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
                  <div
                    style={{ display: "flex", gap: ".5rem", marginTop: "1rem" }}
                  >
                    {[
                      { key: "profile", label: "✏️ Profile" },
                      { key: "password", label: "🔒 Change Password" },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => {
                          setEditTab(t.key);
                          setEditMsg("");
                          setPwMsg("");
                          setPwStep(1);
                          setPwSecurityAnswer("");
                          setPwNew("");
                          setPwConfirm("");
                        }}
                        style={{
                          padding: ".35rem .9rem",
                          borderRadius: "20px",
                          cursor: "pointer",
                          fontFamily: "Nova Square,sans-serif",
                          fontSize: ".78rem",
                          transition: "all .2s",
                          background:
                            editTab === t.key
                              ? "rgba(var(--theme-accent-rgb), .2)"
                              : "rgba(5,15,25,.5)",
                          border: `1px solid ${editTab === t.key ? "rgba(var(--theme-accent-rgb), .4)" : "rgba(var(--theme-accent-rgb), .12)"}`,
                          color:
                            editTab === t.key
                              ? "var(--theme-accent)"
                              : "rgba(168,216,216,.45)",
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Modal Body ── */}
                <div
                  style={{
                    overflowY: "auto",
                    padding: "1.25rem 1.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.1rem",
                    scrollbarWidth: "thin",
                  }}
                >
                  {editTab === "profile" ? (
                    <>
                      {/* Avatar */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: ".5rem",
                        }}
                      >
                        <div
                          style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "50%",
                            background: "rgba(var(--theme-accent-rgb), .15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "2rem",
                            color: "var(--theme-text-primary)",
                            border:
                              "2px solid rgba(var(--theme-accent-rgb), .3)",
                            overflow: "hidden",
                          }}
                        >
                          {editForm.avatar_url ? (
                            <img
                              src={editForm.avatar_url}
                              alt="avatar"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            (editForm.full_name || "S").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            gap: ".5rem",
                            marginTop: ".25rem",
                          }}
                        >
                          <input
                            type="url"
                            placeholder="Profile picture URL"
                            value={editForm.avatar_url}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                avatar_url: e.target.value,
                              }))
                            }
                            style={{
                              ...inputStyle,
                              flex: 1,
                              fontSize: ".78rem",
                              padding: ".6rem .8rem",
                            }}
                          />
                        </div>
                      </div>

                      {/* Edit message */}
                      {editMsg && (
                        <div
                          style={{
                            background: editMsg.startsWith("✅")
                              ? "rgba(76,175,80,.15)"
                              : "rgba(255,80,80,.15)",
                            border: `1px solid ${editMsg.startsWith("✅") ? "rgba(76,175,80,.4)" : "rgba(255,80,80,.4)"}`,
                            color: editMsg.startsWith("✅")
                              ? "#81c784"
                              : "#ff6b6b",
                            padding: ".75rem",
                            borderRadius: "8px",
                            fontSize: ".88rem",
                          }}
                        >
                          {editMsg}
                        </div>
                      )}

                      {/* Full Name */}
                      <div>
                        <label style={labelStyle}>FULL NAME</label>
                        <input
                          value={editForm.full_name}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              full_name: e.target.value,
                            }))
                          }
                          style={inputStyle}
                        />
                      </div>

                      {/* Interests */}
                      <div>
                        <label style={{ ...labelStyle, marginBottom: ".6rem" }}>
                          INTERESTS{" "}
                          <span
                            style={{
                              color: "rgba(168,216,216,.35)",
                              fontSize: ".72rem",
                            }}
                          >
                            (select all that apply)
                          </span>
                        </label>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: ".5rem",
                          }}
                        >
                          {INTEREST_OPTS.map((opt) => {
                            const active = editForm.interests.includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleInterest(opt.id)}
                                style={{
                                  padding: ".4rem .9rem",
                                  borderRadius: "20px",
                                  cursor: "pointer",
                                  fontFamily: "Nova Square,sans-serif",
                                  fontSize: ".82rem",
                                  transition: "all .2s",
                                  background: active
                                    ? "rgba(var(--theme-accent-rgb), .2)"
                                    : "rgba(5,15,25,.5)",
                                  border: `1px solid ${active ? "rgba(var(--theme-accent-rgb), .4)" : "rgba(var(--theme-accent-rgb), .15)"}`,
                                  color: active
                                    ? "var(--theme-accent)"
                                    : "rgba(168,216,216,.5)",
                                }}
                              >
                                {opt.icon} {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Save Button */}
                      <button
                        onClick={handleSave}
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
                          fontSize: ".95rem",
                          letterSpacing: "1px",
                          transition: "all .2s",
                        }}
                      >
                        Save Changes
                      </button>
                    </>
                  ) : (
                    /* ── Change Password Tab ── */
                    <>
                      {pwMsg && (
                        <div
                          style={{
                            background: pwMsg.startsWith("✅")
                              ? "rgba(76,175,80,.15)"
                              : "rgba(255,80,80,.15)",
                            border: `1px solid ${pwMsg.startsWith("✅") ? "rgba(76,175,80,.4)" : "rgba(255,80,80,.4)"}`,
                            color: pwMsg.startsWith("✅")
                              ? "#81c784"
                              : "#ff6b6b",
                            padding: ".75rem",
                            borderRadius: "8px",
                            fontSize: ".88rem",
                          }}
                        >
                          {pwMsg}
                        </div>
                      )}

                      {pwStep === 1 ? (
                        <>
                          <div
                            style={{
                              textAlign: "center",
                              padding: "1rem 0 .5rem",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "2rem",
                                marginBottom: ".5rem",
                              }}
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
                              To protect your account, you must verify your
                              security question before changing your password.
                            </p>
                          </div>
                          <button
                            onClick={handleFetchSecurityQuestion}
                            style={{
                              width: "100%",
                              background:
                                "linear-gradient(90deg,rgba(var(--theme-accent-rgb), .25),rgba(var(--theme-accent-rgb), .15))",
                              border:
                                "1px solid rgba(var(--theme-accent-rgb), .4)",
                              color: "var(--theme-text-primary)",
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
                          {/* Security Question */}
                          <div>
                            <label style={labelStyle}>SECURITY QUESTION</label>
                            <div
                              style={{
                                background: "rgba(5,15,25,.4)",
                                border:
                                  "1px solid rgba(var(--theme-accent-rgb), .15)",
                                borderRadius: "8px",
                                padding: ".75rem 1rem",
                                color: "var(--theme-accent)",
                                fontSize: ".9rem",
                                fontFamily: "Nova Square,sans-serif",
                              }}
                            >
                              {pwSecurityQuestion}
                            </div>
                          </div>
                          <div>
                            <label style={labelStyle}>YOUR ANSWER</label>
                            <input
                              type="text"
                              placeholder="Enter your answer"
                              value={pwSecurityAnswer}
                              onChange={(e) =>
                                setPwSecurityAnswer(e.target.value)
                              }
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>NEW PASSWORD</label>
                            <input
                              type="password"
                              placeholder="At least 6 characters"
                              value={pwNew}
                              onChange={(e) => setPwNew(e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>
                              CONFIRM NEW PASSWORD
                            </label>
                            <input
                              type="password"
                              placeholder="Repeat new password"
                              value={pwConfirm}
                              onChange={(e) => setPwConfirm(e.target.value)}
                              style={inputStyle}
                            />
                          </div>
                          <button
                            onClick={handleChangePassword}
                            style={{
                              width: "100%",
                              background:
                                "linear-gradient(90deg,rgba(var(--theme-accent-rgb), .25),rgba(var(--theme-accent-rgb), .15))",
                              border:
                                "1px solid rgba(var(--theme-accent-rgb), .4)",
                              color: "var(--theme-text-primary)",
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
                              setPwStep(1);
                              setPwMsg("");
                              setPwSecurityAnswer("");
                              setPwNew("");
                              setPwConfirm("");
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
          );
        })()}

      {/* US-15a/b/c: Conflict Warning Dialog */}
      {conflictWarning && (
        <ConflictWarningDialog
          conflicts={conflictWarning.conflicts}
          onCancel={() => setConflictWarning(null)}
          onProceed={async () => {
            const id = conflictWarning.pendingId;
            setConflictWarning(null);
            await doRegister(id);
          }}
        />
      )}

      {showNotifs && (
        <NotificationsPanel
          notifications={notifications}
          onReadAll={markAllRead}
          onClose={() => setShowNotifs(false)}
          onClickNotif={handleClickNotif}
          onDismiss={dismissNotif}
        />
      )}

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
              onClick={() => {
                setActiveTab(item.name);
                if (item.name !== "SOCIETIES") {
                  setSelectedSociety(null);
                } else {
                  setSocietyView("all");
                }
              }}
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
                          : "2px solid rgba(189,217,191,.2)",
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

      <main className="main-content">
        <header className="dashboard-header">
          {activeTab === "EVENTS" ? (
            <div className="header-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search events..."
                value={eventSearch}
                onChange={(e) => {
                  setEventSearch(e.target.value);
                  if (activeTab !== "EVENTS") {
                    setActiveTab("EVENTS");
                    setEventsView("all");
                  }
                }}
              />
            </div>
          ) : (
            <div />
          )}

          <div className="header-profile">
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
            <div
              className="user-info-stack"
              style={{ cursor: "pointer" }}
              onClick={() => {
                setActiveTab("PROFILE");
                setSelectedSociety(null);
              }}
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
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
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
                <span className="user-name">{user.full_name || "Student"}</span>
              </div>
              <div className="profile-row-bottom">
                <span className="user-role">Student</span>
                <ChevronDown size={14} className="chevron-profile" />
              </div>
            </div>
          </div>
        </header>
        <section className="dashboard-body">{renderTab()}</section>
        <footer className="dashboard-footer">
          <p>© 2026 {platformName} Platform. All rights reserved.</p>
          <div className="footer-links">
            <button
              onClick={() =>
                window.open(
                  `https://mail.google.com/mail/?view=cm&to=${adminEmail || "mairasohail46@gmail.com"}`,
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

export default StudentHome;
