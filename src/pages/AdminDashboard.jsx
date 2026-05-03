import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  BarChart3,
  Users,
  Settings,
  Bell,
  ChevronDown,
  Search,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  MapPin,
  Clock,
  Filter,
  Building2,
  Globe,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
} from "lucide-react";
import OrbitLogo from "../OrbitLogo";
import "./AdminDashboard.css";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../useTheme";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

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
  e?.image_url || CAT_IMAGES[e?.category] || CAT_IMAGES.default;

// ── Notifications Panel ───────────────────────────────────────────────────────
const NotificationsPanel = ({
  notifications,
  onReadAll,
  onClose,
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
            You're all caught up! ✓
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
                  flexShrink: 0,
                  marginTop: "6px",
                  background: n.is_read ? "transparent" : "#4FC3F7",
                  boxShadow: n.is_read ? "none" : "0 0 6px #4FC3F7",
                }}
              />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: "0 0 .3rem",
                    color: n.is_read ? "#92898A" : "#BDD9BF",
                    fontSize: ".9rem",
                    lineHeight: 1.4,
                  }}
                >
                  {n.message}
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

// ── Event Detail Modal ────────────────────────────────────────────────────────
const EventDetailModal = ({ event, onClose, onApprove, onReject }) => {
  if (!event) return null;
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
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "180px",
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
              background: "rgba(0,0,0,.5)",
              color: "var(--theme-text-primary)",
              padding: ".3rem .9rem",
              borderRadius: "20px",
              fontSize: ".78rem",
              border: "1px solid rgba(var(--theme-accent-rgb), .35)",
            }}
          >
            {event.category}
          </span>
        </div>
        <div style={{ padding: "1.75rem" }}>
          <h2
            style={{
              margin: "0 0 .75rem",
              color: "#fff",
              fontSize: "1.3rem",
              fontFamily: "Aldrich,sans-serif",
            }}
          >
            {event.title}
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: ".75rem",
              marginBottom: "1rem",
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
              <Building2 size={13} /> {event.society_name}
            </span>
            {event.location && (
              <span
                style={{
                  color: "var(--theme-text-primary)",
                  fontSize: ".85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: ".35rem",
                }}
              >
                <MapPin size={13} /> {event.location}
              </span>
            )}
            <span
              style={{
                color: "var(--theme-text-primary)",
                fontSize: ".85rem",
                display: "flex",
                alignItems: "center",
                gap: ".35rem",
              }}
            >
              <Calendar size={13} /> {fmt(event.date)}{" "}
              {event.time && `· ${event.time}`}
            </span>
            {event.registration_deadline && (
              <span
                style={{
                  color: "var(--theme-text-primary)",
                  fontSize: ".85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: ".35rem",
                }}
              >
                <Clock size={13} /> Deadline: {fmt(event.registration_deadline)}
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
            {event.description || "No description provided."}
          </p>
          {event.status === "pending" && (
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                className="btn-reject"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: ".5rem",
                }}
                onClick={() => {
                  onReject(event.id);
                  onClose();
                }}
              >
                <XCircle size={16} /> Reject
              </button>
              <button
                className="btn-approve"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: ".5rem",
                }}
                onClick={() => {
                  onApprove(event.id);
                  onClose();
                }}
              >
                <CheckCircle2 size={16} /> Approve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const [societyRegs, setSocietyRegs] = useState([]);
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllEventStats, setShowAllEventStats] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [processingRegId, setProcessingRegId] = useState(null);
  const [processingRegAction, setProcessingRegAction] = useState(null);
  const [regError, setRegError] = useState(null);
  const [oppoForm, setOppoForm] = useState({
    title: "",
    type: "Internship",
    organization: "",
    description: "",
    deadline: "",
    link: "",
  });
  const [oppoMsg, setOppoMsg] = useState("");

  const [stats, setStats] = useState({
    active_students: 0,
    active_societies: 0,
    events_upcoming: 0,
    opportunities: 0,
  });

  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [allSocieties, setAllSocieties] = useState([]);
  const [allModerationEvents, setAllModerationEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [analytics, setAnalytics] = useState({
    categories: [],
    societies: [],
    weeks: [],
  });

  const [showNotifs, setShowNotifs] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);
  const [eventsFilter, setEventsFilter] = useState("all");
  const [settingsPwShow, setSettingsPwShow] = useState(false);
  const [adminAvatar, setAdminAvatar] = useState(
    JSON.parse(localStorage.getItem("user") || "{}").avatar_url || "",
  );
  const [avatarInput, setAvatarInput] = useState("");
  const [settingsForm, setSettingsForm] = useState({
    platform_name: "NUcleus",
    contact_email: "nucesadmin@gmail.com",
    maintenance_mode: false,
  });
  const [settingsMsg, setSettingsMsg] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [selectedSociety, setSelectedSociety] = useState(null);
  const [removingSocietyId, setRemovingSocietyId] = useState(null);
  const [selectedReg, setSelectedReg] = useState(null);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchData = useCallback(() => {
    Promise.all([
      fetch(`${API}/admin/stats`, { headers, cache: "no-store" }).then((r) =>
        r.json(),
      ),
      fetch(`${API}/admin/society-registrations`, { headers }).then((r) =>
        r.json(),
      ),
      fetch(`${API}/events/pending`, { headers, cache: "no-store" }).then((r) =>
        r.json(),
      ),
      fetch(`${API}/events`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`${API}/societies`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`${API}/notifications`, { headers, cache: "no-store" }).then((r) =>
        r.json(),
      ),
      fetch(`${API}/admin/analytics`, { headers, cache: "no-store" }).then(
        (r) => r.json(),
      ),
      fetch(`${API}/opportunities`).then((r) => r.json()),
      fetch(`${API}/admin/all-events`, { headers, cache: "no-store" }).then(
        (r) => r.json(),
      ),
    ])
      .then(
        ([
          s,
          socRegs,
          pending,
          evts,
          socs,
          notifs,
          analyticsData,
          opps,
          allEvts,
        ]) => {
          if (s && !s.message) setStats(s);
          if (Array.isArray(socRegs)) setSocietyRegs(socRegs);
          if (Array.isArray(pending)) setPendingEvents(pending);
          if (Array.isArray(evts)) setAllEvents(evts);
          if (Array.isArray(socs)) setAllSocieties(socs);
          if (Array.isArray(notifs)) setNotifications(notifs);
          if (analyticsData && !analyticsData.message)
            setAnalytics(analyticsData);
          if (Array.isArray(allEvts)) setAllModerationEvents(allEvts);
          if (Array.isArray(opps)) setOpportunities(opps);
          setLoading(false);
        },
      )
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    fetch(`${API}/settings`)
      .then((r) => r.json())
      .then((d) =>
        setSettingsForm((prev) => ({
          ...prev,
          platform_name: d.platform_name ?? "NUcleus",
          contact_email: d.contact_email || "nucesadmin@gmail.com",
        })),
      );
  }, []);
  const handleApprove = async (id) => {
    await fetch(`${API}/events/${id}/approve`, { method: "PATCH", headers });
    fetchData();
  };
  const handleRemoveSociety = async (soc) => {
    if (
      !window.confirm(
        `Remove "${soc.name}" from the platform? This cannot be undone.`,
      )
    )
      return;
    setRemovingSocietyId(soc.id);
    try {
      const res = await fetch(`${API}/admin/societies/${soc.id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error("Failed");
      setAllSocieties((prev) => prev.filter((s) => s.id !== soc.id));
      setSelectedSociety(null);
    } catch {
      alert("Failed to remove society.");
    } finally {
      setRemovingSocietyId(null);
    }
  };
  const handleReject = async (id) => {
    await fetch(`${API}/events/${id}/reject`, { method: "PATCH", headers });
    fetchData();
  };
  const dismissNotif = async (id) => {
    await fetch(`${API}/notifications/${id}`, { method: "DELETE", headers });
    setNotifications((p) => p.filter((n) => n.id !== id));
  };
  const markAllRead = async () => {
    await fetch(`${API}/notifications/read-all`, { method: "PATCH", headers });
    setNotifications((p) => p.map((n) => ({ ...n, is_read: 1 })));
    setShowNotifs(false);
  };
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const searchedPending = pendingEvents.filter(
    (e) =>
      !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.society_name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const searchedEvents = allEvents.filter(
    (e) =>
      !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.society_name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const searchedSocs = allSocieties.filter(
    (s) =>
      !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const navItems = [
    { name: "DASHBOARD", icon: <LayoutDashboard size={20} /> },
    { name: "MODERATION", icon: <ShieldCheck size={20} /> },
    { name: "ANALYTICS", icon: <BarChart3 size={20} /> },
    { name: "SOCIETIES", icon: <Users size={20} /> },
    { name: "EVENTS", icon: <Calendar size={20} /> },
    { name: "OPPORTUNITIES", icon: <Briefcase size={20} /> },
    { name: "SETTINGS", icon: <Settings size={20} /> },
  ];

  const statCards = [
    {
      label: "ACTIVE STUDENTS",
      value: stats.active_students,
      trend: "Registered on platform",
      icon: <Activity size={24} />,
      tab: null,
    },
    {
      label: "ACTIVE SOCIETIES",
      value: stats.active_societies,
      trend: "On platform",
      icon: <Users size={24} />,
      tab: "SOCIETIES",
    },
    {
      label: "UPCOMING EVENTS",
      value: stats.events_upcoming,
      trend: "Approved events",
      icon: <Calendar size={24} />,
      tab: "EVENTS",
    },
  ];

  const societyNames = [
    "all",
    ...new Set(allEvents.map((e) => e.society_name).filter(Boolean)),
  ];
  const filteredEvents =
    eventsFilter === "all"
      ? searchQuery
        ? searchedEvents
        : allEvents
      : allEvents.filter(
          (e) =>
            e.society_name === eventsFilter &&
            (!searchQuery ||
              e.title.toLowerCase().includes(searchQuery.toLowerCase())),
        );

  const pendingIds = new Set(pendingEvents.map((e) => e.id));
  const rejectedHistory = allModerationEvents.filter(
    (e) => e.status === "rejected" && !pendingIds.has(e.id),
  );
  const approvedHistoryList = allModerationEvents.filter(
    (e) => e.status === "approved",
  );

  // ── shared input style ──
  const inputSt = {
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(189,217,191,.2)",
    borderRadius: "8px",
    padding: ".65rem 1rem",
    color: "#fff",
    width: "100%",
    fontFamily: "Nova Square,sans-serif",
    fontSize: ".88rem",
    boxSizing: "border-box",
    outline: "none",
  };
  const labelSt = {
    color: "#BDD9BF",
    fontSize: ".78rem",
    display: "block",
    marginBottom: ".35rem",
    opacity: 0.8,
  };

  return (
    <div
      className={`dashboard-container ${isCollapsed ? "sidebar-collapsed" : ""}`}
    >
      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
      {showNotifs && (
        <NotificationsPanel
          notifications={notifications}
          onReadAll={markAllRead}
          onClose={() => setShowNotifs(false)}
          onDismiss={dismissNotif}
        />
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
          title={isCollapsed ? "Expand" : "Collapse"}
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

      {/* ── Main ── */}
      <main className="main-content">
        <header className="dashboard-header">
          {activeTab === "EVENTS" ||
          activeTab === "DASHBOARD" ||
          activeTab === "SOCIETIES" ? (
            <div className="header-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search events, societies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              onClick={() => setActiveTab("SETTINGS")}
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
                  {adminAvatar ? (
                    <img
                      src={adminAvatar}
                      alt="avatar"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    (user.full_name || "A").charAt(0).toUpperCase()
                  )}
                </div>
                <span className="user-name">{user.full_name || "Admin"}</span>
              </div>
              <div className="profile-row-bottom">
                <span className="user-role">Admin</span>
                <ChevronDown size={14} className="chevron-profile" />
              </div>
            </div>
          </div>
        </header>

        <section className="dashboard-body">
          <div className="body-header">
            <h1 className="welcome-text">{activeTab}</h1>
            <div className="status-badge">
              <span className="pulse-dot"></span>Live Monitoring Active
            </div>
          </div>

          {/* ════════ DASHBOARD ════════ */}
          {activeTab === "DASHBOARD" && (
            <div className="admin-overview">
              <div className="analytics-grid">
                {statCards.map((s, i) => (
                  <div
                    key={i}
                    className="stats-card"
                    style={{ cursor: s.tab ? "pointer" : "default" }}
                    onClick={() => s.tab && setActiveTab(s.tab)}
                  >
                    <div className="stats-header">
                      <span className="stats-label">{s.label}</span>
                      {s.icon}
                    </div>
                    <span className="stats-value">
                      {loading ? "..." : s.value}
                    </span>
                    <span className="stats-trend">
                      <TrendingUp size={14} /> {s.trend}
                    </span>
                  </div>
                ))}
              </div>
              <div className="moderation-section">
                <h2 className="section-title">
                  PENDING APPROVALS ({pendingEvents.length})
                </h2>
                {loading ? (
                  <p style={{ color: "#92898A" }}>Loading...</p>
                ) : pendingEvents.length === 0 ? (
                  <p className="empty-msg">No pending approvals. ✓</p>
                ) : (
                  pendingEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      className="moderation-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => setDetailEvent(ev)}
                    >
                      <div className="moderation-info">
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <h4>{ev.title}</h4>
                          <span className="moderation-tag">EVENT</span>
                        </div>
                        <p>
                          By <strong>{ev.society_name || "Unknown"}</strong> ·{" "}
                          {ev.category} · {fmt(ev.date)}
                        </p>
                      </div>
                      <div
                        className="moderation-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="btn-reject"
                          onClick={() => handleReject(ev.id)}
                        >
                          <XCircle size={16} />
                        </button>
                        <button
                          className="btn-approve"
                          onClick={() => handleApprove(ev.id)}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ════════ MODERATION ════════ */}
          {activeTab === "MODERATION" && (
            <div className="moderation-view">
              <h2 className="section-title">
                PENDING APPROVALS ({searchedPending.length})
              </h2>
              <div className="moderation-section">
                {loading ? (
                  <p style={{ color: "#92898A" }}>Loading...</p>
                ) : searchedPending.length === 0 ? (
                  <div className="stats-card">
                    <p>All clear — no pending items!</p>
                  </div>
                ) : (
                  searchedPending.map((ev) => (
                    <div
                      key={ev.id}
                      className="moderation-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => setDetailEvent(ev)}
                    >
                      <div className="moderation-info">
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <h4>{ev.title}</h4>
                          <span className="moderation-tag">EVENT</span>
                        </div>
                        <p>
                          By <strong>{ev.society_name || "Unknown"}</strong> ·{" "}
                          {ev.category} · {fmt(ev.date)} · {ev.location}
                        </p>
                        {ev.description && (
                          <p
                            style={{
                              color: "#92898A",
                              fontSize: ".85rem",
                              marginTop: ".3rem",
                            }}
                          >
                            {ev.description}
                          </p>
                        )}
                      </div>
                      <div
                        className="moderation-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="btn-reject"
                          onClick={() => handleReject(ev.id)}
                        >
                          <XCircle size={16} style={{ marginRight: "6px" }} />{" "}
                          Reject
                        </button>
                        <button
                          className="btn-approve"
                          onClick={() => handleApprove(ev.id)}
                        >
                          <CheckCircle2
                            size={16}
                            style={{ marginRight: "6px" }}
                          />{" "}
                          Approve
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <h2 className="section-title" style={{ marginTop: "3rem" }}>
                REJECTED EVENTS
              </h2>
              <div className="moderation-section">
                {rejectedHistory.length === 0 ? (
                  <p className="empty-msg">No rejected events.</p>
                ) : (
                  rejectedHistory.map((item) => (
                    <div
                      key={item.id}
                      className="moderation-card history-card rejected"
                    >
                      <div className="moderation-info">
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <h4>{item.title}</h4>
                          <span className="status-pill rejected">REJECTED</span>
                        </div>
                        <p>
                          By {item.society_name} · {fmt(item.date)}
                        </p>
                      </div>
                      <div className="moderation-actions">
                        <button
                          className="btn-approve btn-restore"
                          onClick={() => handleApprove(item.id)}
                        >
                          <CheckCircle2
                            size={16}
                            style={{ marginRight: "6px" }}
                          />{" "}
                          Re-Approve
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {approvedHistoryList.length > 0 && (
                <>
                  <h2 className="section-title" style={{ marginTop: "3rem" }}>
                    APPROVED EVENTS
                  </h2>
                  <div className="moderation-section">
                    {approvedHistoryList.map((item) => (
                      <div
                        key={item.id}
                        className="moderation-card history-card approved"
                      >
                        <div className="moderation-info">
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <h4>{item.title}</h4>
                            <span className="status-pill approved">
                              APPROVED
                            </span>
                          </div>
                          <p>
                            By {item.society_name} · {fmt(item.date)}
                          </p>
                        </div>
                        <div className="moderation-actions">
                          <span className="status-label-done">
                            Active on Platform
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════════ ANALYTICS ════════ */}
          {activeTab === "ANALYTICS" && (
            <div className="analytics-view">
              <p
                style={{
                  color: "#a89aab",
                  fontSize: "11px",
                  letterSpacing: "3px",
                  margin: "0 0 1.25rem",
                  fontFamily: "Aldrich,sans-serif",
                }}
              >
                PLATFORM OVERVIEW
              </p>

              {/* Top stat cards */}
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
                    label: "ACTIVE STUDENTS",
                    value: loading ? "..." : stats.active_students,
                    sub: "registered on platform",
                    color: "var(--theme-accent)",
                    bg: "rgba(var(--theme-accent-rgb), .18)",
                    border: "rgba(var(--theme-accent-rgb), .45)",
                  },
                  {
                    label: "ACTIVE SOCIETIES",
                    value: loading ? "..." : stats.active_societies,
                    sub: "on platform",
                    color: "#66BB6A",
                    bg: "rgba(102,187,106,.18)",
                    border: "rgba(102,187,106,.45)",
                  },
                  {
                    label: "UPCOMING EVENTS",
                    value: loading ? "..." : stats.events_upcoming,
                    sub: "approved events",
                    color: "#FFB74D",
                    bg: "rgba(255,183,77,.18)",
                    border: "rgba(255,183,77,.45)",
                  },
                  {
                    label: "OPPORTUNITIES",
                    value: loading ? "..." : stats.opportunities,
                    sub: "posted on platform",
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
                        background: s.color,
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
                      {s.value}
                    </p>
                    <p
                      style={{ margin: 0, fontSize: "11px", color: "#a89aab" }}
                    >
                      {s.sub}
                    </p>
                  </div>
                ))}
              </div>

              {/* Popular types + top societies */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "1.25rem",
                }}
              >
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
                    POPULAR EVENT TYPES
                  </p>
                  {analytics.categories.length === 0 ? (
                    <p style={{ color: "#a89aab", fontSize: ".85rem" }}>
                      No event data yet.
                    </p>
                  ) : (
                    analytics.categories.map((cat, i) => (
                      <div key={i} style={{ marginBottom: ".75rem" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: ".3rem",
                          }}
                        >
                          <span
                            style={{
                              color: "#BDD9BF",
                              fontSize: ".85rem",
                              fontFamily: "Nova Square,sans-serif",
                            }}
                          >
                            {cat.name}
                          </span>
                          <span
                            style={{
                              color: "#4FC3F7",
                              fontSize: ".82rem",
                              fontFamily: "Aldrich,sans-serif",
                            }}
                          >
                            {cat.pct}% ({cat.count})
                          </span>
                        </div>
                        <div
                          style={{
                            height: "6px",
                            borderRadius: "3px",
                            background: "rgba(189,217,191,.08)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${cat.pct}%`,
                              borderRadius: "3px",
                              background: `hsl(${160 + i * 30},60%,55%)`,
                              transition: "width .6s",
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

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
                    TOP PERFORMING SOCIETIES
                  </p>
                  {analytics.societies.length === 0 ? (
                    <p style={{ color: "#a89aab", fontSize: ".85rem" }}>
                      No society data yet.
                    </p>
                  ) : (
                    analytics.societies.map((soc, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: ".75rem",
                          padding: ".6rem 0",
                          borderBottom: "1px solid rgba(189,217,191,.06)",
                        }}
                      >
                        <span
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: "rgba(189,217,191,.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: ".72rem",
                            color: "#4FC3F7",
                            fontFamily: "Aldrich,sans-serif",
                          }}
                        >
                          {i + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: "0 0 .15rem",
                              color: "#BDD9BF",
                              fontSize: ".85rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {soc.name}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              color: "#a89aab",
                              fontSize: ".75rem",
                            }}
                          >
                            {soc.events} event{soc.events !== 1 ? "s" : ""} ·{" "}
                            {soc.registrations} registration
                            {soc.registrations !== 1 ? "s" : ""}
                          </p>
                        </div>
                        {i === 0 && (
                          <span
                            style={{
                              fontSize: ".85rem",
                              color: "#FFB74D",
                              fontFamily: "Aldrich,sans-serif",
                            }}
                          >
                            ★
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Weekly chart */}
              <div
                style={{
                  background: "rgba(12,24,33,.6)",
                  border: "1px solid rgba(189,217,191,.08)",
                  borderRadius: "14px",
                  padding: "1.25rem",
                  marginBottom: "1.25rem",
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
                {(() => {
                  const weeks = analytics.weeks || [];
                  const maxVal = Math.max(...weeks.map((w) => w.count), 1);
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "10px",
                        height: "120px",
                      }}
                    >
                      {weeks.map((w, i) => {
                        const pct = Math.max(
                          Math.round((w.count / maxVal) * 100),
                          w.count > 0 ? 8 : 2,
                        );
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
                                background:
                                  "linear-gradient(180deg, var(--theme-accent), #0a2e2e)",
                                minHeight: "4px",
                                transition: "height .5s",
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
                  );
                })()}
              </div>

              {/* Registrations per event */}
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
                {allEvents.filter((e) => e.status === "approved").length ===
                0 ? (
                  <p style={{ color: "#92898A", fontSize: ".88rem" }}>
                    No approved events yet.
                  </p>
                ) : (
                  (() => {
                    const approved = allEvents
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
                                      background:
                                        "linear-gradient(90deg, var(--theme-accent), #4FC3F7)",
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
                                fontFamily: "Nova Square,sans-serif",
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

          {/* ════════ SOCIETIES ════════ */}
          {activeTab === "SOCIETIES" && (
            <div>
              {regError && (
                <div
                  style={{
                    background: "rgba(239,83,80,.12)",
                    border: "1px solid rgba(239,83,80,.3)",
                    color: "#EF5350",
                    padding: ".75rem 1rem",
                    borderRadius: "10px",
                    marginBottom: "1rem",
                    fontSize: ".88rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>⚠️ {regError}</span>
                  <button
                    onClick={() => setRegError(null)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#EF5350",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <h2 className="section-title" style={{ marginBottom: "1rem" }}>
                PENDING SOCIETY REGISTRATIONS (
                {societyRegs.filter((r) => r.status === "pending").length})
              </h2>
              {societyRegs.filter((r) => r.status === "pending").length ===
              0 ? (
                <p className="empty-msg" style={{ marginBottom: "2rem" }}>
                  No pending registrations.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: ".75rem",
                    marginBottom: "2rem",
                  }}
                >
                  {societyRegs
                    .filter((r) => r.status === "pending")
                    .map((reg) => (
                      <div
                        key={reg.id}
                        className="moderation-card"
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedReg(reg)}
                      >
                        <div className="moderation-info" style={{ flex: 1 }}>
                          <h4 style={{ margin: "0 0 .25rem" }}>{reg.name}</h4>
                          <p style={{ margin: 0 }}>
                            By {reg.contact_name} · {reg.email}
                          </p>
                          {reg.description && (
                            <p
                              style={{
                                color: "#92898A",
                                fontSize: ".82rem",
                                margin: ".25rem 0 0",
                              }}
                            >
                              {reg.description}
                            </p>
                          )}
                        </div>
                        <div
                          style={{ display: "flex", gap: ".5rem" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="btn-reject"
                            disabled={processingRegId === reg.id}
                            onClick={async () => {
                              setProcessingRegId(reg.id);
                              setProcessingRegAction("reject");
                              try {
                                const res = await fetch(
                                  `${API}/admin/society-registrations/${reg.id}`,
                                  {
                                    method: "PATCH",
                                    headers,
                                    body: JSON.stringify({ action: "reject" }),
                                  },
                                );
                                const data = await res.json();
                                if (!res.ok)
                                  setRegError(
                                    `Rejection failed: ${data.message || "Unknown error"}`,
                                  );
                              } catch (e) {
                                setRegError(
                                  "Network error. Please check your connection and try again.",
                                );
                              }
                              setProcessingRegId(null);
                              setProcessingRegAction(null);
                              setRegError(null);
                              fetchData();
                            }}
                          >
                            <XCircle size={16} />{" "}
                            {processingRegId === reg.id &&
                            processingRegAction === "reject"
                              ? "Rejecting..."
                              : "Reject"}
                          </button>
                          <button
                            className="btn-approve"
                            disabled={processingRegId === reg.id}
                            onClick={async () => {
                              setProcessingRegId(reg.id);
                              setProcessingRegAction("approve");
                              try {
                                const res = await fetch(
                                  `${API}/admin/society-registrations/${reg.id}`,
                                  {
                                    method: "PATCH",
                                    headers,
                                    body: JSON.stringify({ action: "approve" }),
                                  },
                                );
                                const data = await res.json();
                                if (!res.ok)
                                  setRegError(
                                    `Approval failed: ${data.message || "Unknown error"}`,
                                  );
                              } catch (e) {
                                setRegError(
                                  "Network error. Please check your connection and try again.",
                                );
                              }
                              setProcessingRegId(null);
                              setProcessingRegAction(null);
                              setRegError(null);
                              fetchData();
                            }}
                          >
                            <CheckCircle2 size={16} />{" "}
                            {processingRegId === reg.id &&
                            processingRegAction === "approve"
                              ? "Approving..."
                              : "Approve"}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              <p
                style={{
                  color: "#92898A",
                  marginBottom: "1.5rem",
                  fontSize: ".9rem",
                }}
              >
                {searchedSocs.length} societ
                {searchedSocs.length !== 1 ? "ies" : "y"} on platform
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {searchedSocs.length === 0 ? (
                  <p className="empty-msg">No societies found.</p>
                ) : (
                  searchedSocs.map((soc) => (
                    <div
                      key={soc.id}
                      className="moderation-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedSociety(soc)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1.25rem",
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "12px",
                            background: "rgba(189,217,191,.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.4rem",
                            color: "#BDD9BF",
                            border: "1px solid rgba(189,217,191,.15)",
                            flexShrink: 0,
                            overflow: "hidden",
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
                        <div>
                          <h4
                            style={{
                              margin: "0 0 .25rem",
                              color: "#BDD9BF",
                              fontFamily: "Aldrich,sans-serif",
                            }}
                          >
                            {soc.name}
                          </h4>
                          <p
                            style={{
                              margin: 0,
                              color: "#92898A",
                              fontSize: ".85rem",
                            }}
                          >
                            {soc.description || "No description"}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              gap: ".4rem",
                              marginTop: ".4rem",
                              flexWrap: "wrap",
                            }}
                          >
                            {(soc.focus_areas || []).map((fa) => (
                              <span
                                key={fa}
                                style={{
                                  background:
                                    "rgba(var(--theme-accent-rgb), .1)",
                                  color: "var(--theme-accent)",
                                  padding: ".15rem .55rem",
                                  borderRadius: "10px",
                                  fontSize: ".72rem",
                                  border:
                                    "1px solid rgba(var(--theme-accent-rgb), .15)",
                                }}
                              >
                                {fa}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          background: "rgba(76,175,80,.1)",
                          color: "#4CAF50",
                          border: "1px solid rgba(76,175,80,.25)",
                          padding: ".25rem .75rem",
                          borderRadius: "20px",
                          fontSize: ".75rem",
                          fontFamily: "Aldrich,sans-serif",
                          flexShrink: 0,
                        }}
                      >
                        ACTIVE
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSociety(soc);
                        }}
                        disabled={removingSocietyId === soc.id}
                        style={{
                          background: "rgba(244,67,54,.1)",
                          color: "#F44336",
                          border: "1px solid rgba(244,67,54,.25)",
                          padding: ".25rem .75rem",
                          borderRadius: "20px",
                          fontSize: ".75rem",
                          fontFamily: "Aldrich,sans-serif",
                          cursor: "pointer",
                          flexShrink: 0,
                          marginLeft: ".5rem",
                        }}
                      >
                        {removingSocietyId === soc.id
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {/* ── Pending Registration Detail Modal ── */}
          {selectedReg && (
            <div
              onClick={() => setSelectedReg(null)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.6)",
                zIndex: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "var(--theme-panel-bg)",
                  border: "1px solid var(--theme-panel-border)",
                  borderRadius: "16px",
                  padding: "2rem",
                  width: "min(600px, 90vw)",
                  maxHeight: "80vh",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.5rem",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      color: "var(--theme-accent)",
                      fontFamily: "Aldrich,sans-serif",
                    }}
                  >
                    {selectedReg.name}
                  </h2>
                  <span
                    style={{
                      background: "rgba(255,183,77,.1)",
                      color: "#FFB74D",
                      border: "1px solid rgba(255,183,77,.25)",
                      padding: ".2rem .75rem",
                      borderRadius: "20px",
                      fontSize: ".75rem",
                      fontFamily: "Aldrich,sans-serif",
                    }}
                  >
                    PENDING
                  </span>
                </div>
                <p
                  style={{
                    color: "#92898A",
                    fontSize: ".82rem",
                    marginBottom: "1rem",
                  }}
                >
                  Submitted by{" "}
                  <strong style={{ color: "#BDD9BF" }}>
                    {selectedReg.contact_name}
                  </strong>{" "}
                  · {selectedReg.email}
                </p>
                {selectedReg.description && (
                  <p
                    style={{
                      color: "#ccc",
                      lineHeight: 1.7,
                      marginBottom: "1rem",
                    }}
                  >
                    {selectedReg.description}
                  </p>
                )}
                {selectedReg.mission && (
                  <p
                    style={{
                      color: "#92898A",
                      fontSize: ".9rem",
                      marginBottom: ".5rem",
                    }}
                  >
                    <strong style={{ color: "#BDD9BF" }}>Mission:</strong>{" "}
                    {selectedReg.mission}
                  </p>
                )}
                {selectedReg.vision && (
                  <p
                    style={{
                      color: "#92898A",
                      fontSize: ".9rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <strong style={{ color: "#BDD9BF" }}>Vision:</strong>{" "}
                    {selectedReg.vision}
                  </p>
                )}
                {selectedReg.focus_areas && (
                  <div
                    style={{
                      display: "flex",
                      gap: ".4rem",
                      flexWrap: "wrap",
                      marginBottom: "1.5rem",
                    }}
                  >
                    {(typeof selectedReg.focus_areas === "string"
                      ? JSON.parse(selectedReg.focus_areas)
                      : selectedReg.focus_areas
                    ).map((fa) => (
                      <span
                        key={fa}
                        style={{
                          background: "rgba(189,217,191,.08)",
                          color: "#BDD9BF",
                          padding: ".2rem .65rem",
                          borderRadius: "10px",
                          fontSize: ".75rem",
                          border: "1px solid rgba(189,217,191,.15)",
                        }}
                      >
                        {fa}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setSelectedReg(null)}
                  style={{
                    padding: ".5rem 1.25rem",
                    background: "rgba(189,217,191,.08)",
                    color: "#BDD9BF",
                    border: "1px solid rgba(189,217,191,.2)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontFamily: "Nova Square,sans-serif",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
          {/* ── Society Detail Modal ── */}
          {selectedSociety && (
            <div
              onClick={() => setSelectedSociety(null)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.6)",
                zIndex: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "var(--theme-panel-bg)",
                  border: "1px solid var(--theme-panel-border)",
                  borderRadius: "16px",
                  padding: "2rem",
                  width: "min(600px, 90vw)",
                  maxHeight: "80vh",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.25rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "12px",
                      background: "rgba(189,217,191,.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.8rem",
                      color: "#BDD9BF",
                      border: "1px solid rgba(189,217,191,.15)",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {selectedSociety.avatar_url ? (
                      <img
                        src={selectedSociety.avatar_url}
                        alt={selectedSociety.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      selectedSociety.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        // CHANGE TO:
                        color: "var(--theme-accent)",
                        fontFamily: "Aldrich,sans-serif",
                      }}
                    >
                      {selectedSociety.name}
                    </h2>
                  </div>
                </div>
                <p
                  style={{
                    color: "#ccc",
                    lineHeight: 1.7,
                    marginBottom: "1.25rem",
                  }}
                >
                  {selectedSociety.description || "No description."}
                </p>
                {selectedSociety.mission && (
                  <p
                    style={{
                      color: "#92898A",
                      fontSize: ".9rem",
                      marginBottom: ".5rem",
                    }}
                  >
                    <strong style={{ color: "#BDD9BF" }}>Mission:</strong>{" "}
                    {selectedSociety.mission}
                  </p>
                )}
                {selectedSociety.vision && (
                  <p
                    style={{
                      color: "#92898A",
                      fontSize: ".9rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <strong style={{ color: "#BDD9BF" }}>Vision:</strong>{" "}
                    {selectedSociety.vision}
                  </p>
                )}
                <div
                  style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}
                >
                  {(selectedSociety.focus_areas || []).map((fa) => (
                    <span
                      key={fa}
                      style={{
                        background: "rgba(189,217,191,.08)",
                        color: "#BDD9BF",
                        padding: ".2rem .65rem",
                        borderRadius: "10px",
                        fontSize: ".75rem",
                        border: "1px solid rgba(189,217,191,.15)",
                      }}
                    >
                      {fa}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedSociety(null)}
                  style={{
                    marginTop: "1.5rem",
                    padding: ".5rem 1.25rem",
                    background: "rgba(189,217,191,.08)",
                    color: "#BDD9BF",
                    border: "1px solid rgba(189,217,191,.2)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontFamily: "Nova Square,sans-serif",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
          {/* ════════ EVENTS ════════ */}
          {activeTab === "EVENTS" && (
            <div>
              <div
                style={{
                  display: "flex",
                  gap: ".5rem",
                  marginBottom: "1.25rem",
                  flexWrap: "wrap",
                }}
              >
                {societyNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => setEventsFilter(name)}
                    style={{
                      padding: ".4rem 1rem",
                      borderRadius: "20px",
                      border: "1px solid",
                      cursor: "pointer",
                      fontFamily: "Nova Square,sans-serif",
                      fontSize: ".8rem",
                      background:
                        eventsFilter === name
                          ? "rgba(189,217,191,.15)"
                          : "transparent",
                      borderColor:
                        eventsFilter === name
                          ? "rgba(189,217,191,.5)"
                          : "rgba(189,217,191,.15)",
                      color: eventsFilter === name ? "#BDD9BF" : "#92898A",
                    }}
                  >
                    {name === "all"
                      ? `All (${allEvents.length})`
                      : name
                          .replace("FAST ", "")
                          .replace(" Society", "")
                          .replace(" (FAIS)", "")
                          .replace("'26 — ", " ")}
                  </button>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {filteredEvents.length === 0 ? (
                  <p className="empty-msg">No events found.</p>
                ) : (
                  filteredEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="moderation-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => setDetailEvent(ev)}
                    >
                      <div className="moderation-info">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: ".75rem",
                          }}
                        >
                          <h4>{ev.title}</h4>
                          <span className="moderation-tag">{ev.category}</span>
                        </div>
                        <p>
                          By <strong>{ev.society_name}</strong> · {fmt(ev.date)}
                          {ev.location ? ` · ${ev.location}` : ""}
                        </p>
                        {ev.registration_count > 0 && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: ".3rem",
                              fontSize: ".78rem",
                              color: "#4FC3F7",
                              marginTop: "4px",
                            }}
                          >
                            <Users size={11} /> {ev.registration_count}{" "}
                            registered
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          background: "rgba(76,175,80,.1)",
                          color: "#4CAF50",
                          padding: ".25rem .75rem",
                          borderRadius: "20px",
                          fontSize: ".75rem",
                          flexShrink: 0,
                        }}
                      >
                        APPROVED
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ════════ OPPORTUNITIES ════════ */}
          {activeTab === "OPPORTUNITIES" && (
            <div>
              {/* Post form */}
              <div className="stats-card" style={{ marginBottom: "1.5rem" }}>
                <span
                  className="stats-label"
                  style={{ fontSize: ".8rem", letterSpacing: "1px" }}
                >
                  POST NEW OPPORTUNITY
                </span>
                {oppoMsg && (
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: ".75rem",
                      borderRadius: "8px",
                      fontSize: ".88rem",
                      background: oppoMsg.startsWith("✅")
                        ? "rgba(76,175,80,.15)"
                        : "rgba(255,80,80,.15)",
                      border: `1px solid ${oppoMsg.startsWith("✅") ? "rgba(76,175,80,.4)" : "rgba(255,80,80,.4)"}`,
                      color: oppoMsg.startsWith("✅") ? "#81c784" : "#ff6b6b",
                    }}
                  >
                    {oppoMsg}
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  <div>
                    <label style={labelSt}>TITLE *</label>
                    <input
                      value={oppoForm.title}
                      onChange={(e) =>
                        setOppoForm((p) => ({ ...p, title: e.target.value }))
                      }
                      placeholder="e.g. Software Engineering Intern"
                      style={inputSt}
                    />
                  </div>
                  <div>
                    <label style={labelSt}>TYPE *</label>
                    <select
                      value={oppoForm.type}
                      onChange={(e) =>
                        setOppoForm((p) => ({ ...p, type: e.target.value }))
                      }
                      style={{
                        ...inputSt,
                        background: "rgba(12,24,33,.9)",
                        color: "#BDD9BF",
                      }}
                    >
                      {[
                        "Internship",
                        "Scholarship",
                        "Research",
                        "TA Position",
                      ].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelSt}>ORGANIZATION *</label>
                    <input
                      value={oppoForm.organization}
                      onChange={(e) =>
                        setOppoForm((p) => ({
                          ...p,
                          organization: e.target.value,
                        }))
                      }
                      placeholder="e.g. Google, NUST, NU"
                      style={inputSt}
                    />
                  </div>
                  <div>
                    <label style={labelSt}>APPLICATION DEADLINE *</label>
                    <input
                      type="date"
                      value={oppoForm.deadline}
                      onChange={(e) =>
                        setOppoForm((p) => ({ ...p, deadline: e.target.value }))
                      }
                      style={{
                        ...inputSt,
                        background: "rgba(12,24,33,.9)",
                        color: "#BDD9BF",
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelSt}>DESCRIPTION</label>
                    <textarea
                      value={oppoForm.description}
                      onChange={(e) =>
                        setOppoForm((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Brief description of the opportunity, eligibility, benefits..."
                      rows={3}
                      style={{
                        ...inputSt,
                        resize: "vertical",
                        minHeight: "80px",
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelSt}>APPLICATION LINK *</label>{" "}
                    {/* Added * */}
                    <input
                      value={oppoForm.link}
                      onChange={(e) =>
                        setOppoForm((p) => ({ ...p, link: e.target.value }))
                      }
                      placeholder="https://..."
                      style={inputSt}
                    />
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (
                      !oppoForm.title ||
                      !oppoForm.type ||
                      !oppoForm.organization ||
                      !oppoForm.deadline ||
                      !oppoForm.link
                    ) {
                      setOppoMsg("❌ All fields are required.");
                      return;
                    }
                    const urlPattern =
                      /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)$/;
                    if (!urlPattern.test(oppoForm.link.trim())) {
                      setOppoMsg(
                        "❌ Invalid link. Must start with http:// or https:// and be a valid URL.",
                      );
                      return;
                    }
                    setOppoMsg("");
                    const res = await fetch(`${API}/opportunities`, {
                      method: "POST",
                      headers,
                      body: JSON.stringify(oppoForm),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setOppoMsg(`❌ ${data.message}`);
                      return;
                    }
                    setOppoMsg(
                      "✅ Opportunity posted! All students have been notified.",
                    );
                    setOppoForm({
                      title: "",
                      type: "Internship",
                      organization: "",
                      description: "",
                      deadline: "",
                      link: "",
                    });
                    fetchData();
                    setTimeout(() => setOppoMsg(""), 4000);
                  }}
                  style={{
                    marginTop: "1rem",
                    background: "rgba(189,217,191,.15)",
                    border: "1px solid rgba(189,217,191,.3)",
                    color: "#BDD9BF",
                    padding: ".75rem 2rem",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontFamily: "Aldrich,sans-serif",
                    fontSize: ".9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: ".5rem",
                  }}
                >
                  <Briefcase size={16} /> Post Opportunity
                </button>
              </div>

              {/* Existing list */}
              <h2 className="section-title">
                POSTED OPPORTUNITIES ({opportunities.length})
              </h2>
              {opportunities.length === 0 ? (
                <p className="empty-msg">No opportunities posted yet.</p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: ".75rem",
                  }}
                >
                  {opportunities.map((opp) => (
                    <div key={opp.id} className="moderation-card">
                      <div className="moderation-info" style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: ".6rem",
                            marginBottom: ".25rem",
                          }}
                        >
                          <h4 style={{ margin: 0 }}>{opp.title}</h4>
                          <span className="moderation-tag">{opp.type}</span>
                        </div>
                        <p style={{ margin: 0 }}>
                          {opp.organization && (
                            <>
                              <Building2
                                size={11}
                                style={{
                                  display: "inline",
                                  marginRight: "4px",
                                }}
                              />
                              {opp.organization} ·{" "}
                            </>
                          )}
                          {opp.deadline
                            ? `Deadline: ${new Date(opp.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                            : "No deadline"}
                        </p>
                        {opp.description && (
                          <p
                            style={{
                              color: "#92898A",
                              fontSize: ".82rem",
                              margin: ".25rem 0 0",
                            }}
                          >
                            {opp.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          await fetch(`${API}/opportunities/${opp.id}`, {
                            method: "DELETE",
                            headers,
                          });
                          fetchData();
                        }}
                        style={{
                          background: "rgba(239,83,80,.1)",
                          border: "1px solid rgba(239,83,80,.2)",
                          color: "#EF5350",
                          padding: ".4rem .85rem",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontFamily: "Nova Square,sans-serif",
                          fontSize: ".78rem",
                          flexShrink: 0,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════ SETTINGS ════════ */}
          {activeTab === "SETTINGS" && (
            <div>
              {settingsMsg && (
                <div
                  style={{
                    background: settingsMsg.startsWith("✅")
                      ? "rgba(76,175,80,.15)"
                      : "rgba(255,80,80,.15)",
                    border: `1px solid ${settingsMsg.startsWith("✅") ? "rgba(76,175,80,.4)" : "rgba(255,80,80,.4)"}`,
                    color: settingsMsg.startsWith("✅") ? "#81c784" : "#ff6b6b",
                    padding: ".75rem 1rem",
                    borderRadius: "8px",
                    marginBottom: "1.5rem",
                    fontSize: ".9rem",
                  }}
                >
                  {settingsMsg}
                </div>
              )}
              <div className="stats-card" style={{ marginBottom: "1.5rem" }}>
                <span
                  className="stats-label"
                  style={{ fontSize: ".8rem", letterSpacing: "1px" }}
                >
                  PLATFORM SETTINGS
                </span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  <div>
                    <label
                      style={{
                        color: "#BDD9BF",
                        fontSize: ".85rem",
                        display: "block",
                        marginBottom: ".4rem",
                        opacity: 0.8,
                      }}
                    >
                      Platform Name
                    </label>
                    <input
                      value={settingsForm.platform_name}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          platform_name: e.target.value,
                        }))
                      }
                      style={{
                        background: "rgba(255,255,255,.05)",
                        border: "1px solid rgba(189,217,191,.2)",
                        borderRadius: "8px",
                        padding: ".7rem 1rem",
                        color: "#fff",
                        width: "100%",
                        fontFamily: "Nova Square,sans-serif",
                        fontSize: ".9rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        color: "#BDD9BF",
                        fontSize: ".85rem",
                        display: "block",
                        marginBottom: ".4rem",
                        opacity: 0.8,
                      }}
                    >
                      Admin Contact Email
                    </label>
                    <div style={{ position: "relative" }}>
                      <Mail
                        size={15}
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#685369",
                        }}
                      />
                      <input
                        value={settingsForm.contact_email}
                        onChange={(e) =>
                          setSettingsForm((p) => ({
                            ...p,
                            contact_email: e.target.value,
                          }))
                        }
                        style={{
                          background: "rgba(255,255,255,.05)",
                          border: "1px solid rgba(189,217,191,.2)",
                          borderRadius: "8px",
                          padding: ".7rem 1rem .7rem 2.5rem",
                          color: "#fff",
                          width: "100%",
                          fontFamily: "Nova Square,sans-serif",
                          fontSize: ".9rem",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const email = settingsForm.contact_email.trim();
                    const emailRegex =
                      /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
                    if (!emailRegex.test(email)) {
                      setSettingsMsg(
                        "❌ Invalid email format. Please enter a valid email (e.g. nucesadmin@gmail.com).",
                      );
                      setTimeout(() => setSettingsMsg(""), 3500);
                      return;
                    }
                    try {
                      await fetch(`${API}/admin/settings`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                          platform_name: settingsForm.platform_name,
                        }),
                      });
                      await fetch(`${API}/admin/contact-email`, {
                        method: "PATCH",
                        headers,
                        body: JSON.stringify({ contact_email: email }),
                      });
                      setSettingsMsg("✅ Settings saved!");
                      setTimeout(() => setSettingsMsg(""), 2500);
                    } catch {
                      setSettingsMsg("❌ Failed to save.");
                    }
                  }}
                  style={{
                    marginTop: "1rem",
                    background: "rgba(189,217,191,.15)",
                    border: "1px solid rgba(189,217,191,.3)",
                    color: "#BDD9BF",
                    padding: ".75rem 2rem",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontFamily: "Aldrich,sans-serif",
                    fontSize: ".9rem",
                  }}
                >
                  Save Settings
                </button>
                <div className="stats-card" style={{ marginBottom: "1.5rem" }}>
                  <span
                    className="stats-label"
                    style={{ fontSize: ".8rem", letterSpacing: "1px" }}
                  >
                    PROFILE IMAGE
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      marginTop: "1rem",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "1px solid rgba(189,217,191,.2)",
                        background: "rgba(189,217,191,.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {adminAvatar ? (
                        <img
                          src={adminAvatar}
                          alt="avatar"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span style={{ color: "#BDD9BF", fontSize: "1.4rem" }}>
                          {(user.full_name || "A").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Paste image URL..."
                      value={avatarInput}
                      onChange={(e) => setAvatarInput(e.target.value)}
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,.05)",
                        border: "1px solid rgba(189,217,191,.2)",
                        borderRadius: "8px",
                        padding: ".7rem 1rem",
                        color: "#fff",
                        fontSize: ".85rem",
                      }}
                    />
                    <button
                      onClick={() => {
                        fetch(`${API}/admin/avatar`, {
                          method: "PATCH",
                          headers: {
                            ...headers,
                          },
                          body: JSON.stringify({ avatar_url: avatarInput }),
                        }).then(() => {
                          setAdminAvatar(avatarInput);
                          const u = JSON.parse(
                            localStorage.getItem("user") || "{}",
                          );
                          localStorage.setItem(
                            "user",
                            JSON.stringify({ ...u, avatar_url: avatarInput }),
                          );
                          setSettingsMsg("✅ Avatar updated!");
                          setTimeout(() => setSettingsMsg(""), 2500);
                        });
                      }}
                      style={{
                        padding: ".7rem 1.2rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                        background: "rgba(189,217,191,.15)",
                        border: "1px solid rgba(189,217,191,.3)",
                        color: "#BDD9BF",
                        fontFamily: "Aldrich,sans-serif",
                        fontSize: ".85rem",
                      }}
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>

              <div className="stats-card" style={{ marginBottom: "1.5rem" }}>
                <span
                  className="stats-label"
                  style={{ fontSize: ".8rem", letterSpacing: "1px" }}
                >
                  SECURITY
                </span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  <div>
                    <label
                      style={{
                        color: "#BDD9BF",
                        fontSize: ".85rem",
                        display: "block",
                        marginBottom: ".4rem",
                        opacity: 0.8,
                      }}
                    >
                      Change Admin Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <Lock
                        size={15}
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#685369",
                        }}
                      />
                      <input
                        type={settingsPwShow ? "text" : "password"}
                        placeholder="New password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        style={{
                          background: "rgba(255,255,255,.05)",
                          border: "1px solid rgba(189,217,191,.2)",
                          borderRadius: "8px",
                          padding: ".7rem 2.5rem",
                          color: "#fff",
                          width: "100%",
                          fontFamily: "Nova Square,sans-serif",
                          fontSize: ".9rem",
                          boxSizing: "border-box",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => setSettingsPwShow((p) => !p)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "#a89aab",
                          cursor: "pointer",
                        }}
                      >
                        {settingsPwShow ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                  {settingsMsg && (
                    <div
                      style={{
                        padding: ".65rem 1rem",
                        borderRadius: "8px",
                        fontSize: ".85rem",
                        background: settingsMsg.startsWith("✅")
                          ? "rgba(76,175,80,.15)"
                          : "rgba(255,80,80,.15)",
                        border: `1px solid ${settingsMsg.startsWith("✅") ? "rgba(76,175,80,.4)" : "rgba(255,80,80,.4)"}`,
                        color: settingsMsg.startsWith("✅")
                          ? "#81c784"
                          : "#ff6b6b",
                      }}
                    >
                      {settingsMsg}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newAdminPassword.trim()) {
                        setSettingsMsg("❌ Please enter a new password.");
                        setTimeout(() => setSettingsMsg(""), 2500);
                        return;
                      }
                      if (newAdminPassword.length < 6) {
                        setSettingsMsg(
                          "❌ Password must be at least 6 characters.",
                        );
                        setTimeout(() => setSettingsMsg(""), 2500);
                        return;
                      }
                      try {
                        const res = await fetch(
                          `${API}/admin/change-password`,
                          {
                            method: "POST",
                            headers,
                            body: JSON.stringify({
                              newPassword: newAdminPassword,
                            }),
                          },
                        );
                        const data = await res.json();
                        console.log(
                          "status:",
                          res.status,
                          "ok:",
                          res.ok,
                          "data:",
                          data,
                        );
                        if (res.ok) {
                          setSettingsMsg("✅ Password updated!");
                          setNewAdminPassword("");
                          setTimeout(() => setSettingsMsg(""), 3500);
                        } else {
                          setSettingsMsg(
                            `❌ ${data.message || "Failed to update password."}`,
                          );
                          setTimeout(() => setSettingsMsg(""), 3500);
                        }
                      } catch {
                        setSettingsMsg("❌ Server error.");
                        setTimeout(() => setSettingsMsg(""), 3500);
                      }
                    }}
                    style={{
                      background: "rgba(189,217,191,.15)",
                      border: "1px solid rgba(189,217,191,.3)",
                      color: "#BDD9BF",
                      padding: ".75rem 2rem",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontFamily: "Aldrich,sans-serif",
                      fontSize: ".9rem",
                      width: "fit-content",
                    }}
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          <p>
            © 2026 {settingsForm.platform_name} Platform • Admin Console &nbsp;
          </p>
          <div className="footer-links">
            <a href="#">System Integrity</a>
            <a href="#">Admin Logs</a>
            <a href="#">Security Policy</a>
            <img
              src="/src/assets/nucleus-logo.png"
              alt="NUcleus"
              style={{ height: "18px", verticalAlign: "middle", opacity: 0.7 }}
            />
          </div>
        </footer>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .status-badge { display:flex; align-items:center; gap:.75rem; background:rgba(189,217,191,.1); color:#BDD9BF; padding:.5rem 1rem; border-radius:20px; font-family:'Aldrich',sans-serif; font-size:.8rem; border:1px solid rgba(189,217,191,.2); }
        .pulse-dot { width:8px; height:8px; background:#4CAF50; border-radius:50%; box-shadow:0 0 10px #4CAF50; animation:pulse 2s infinite; }
        @keyframes pulse { 0%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:.5} 100%{transform:scale(1);opacity:1} }
        .stats-header { display:flex; justify-content:space-between; align-items:flex-start; color:#BDD9BF; }
        .bell-header { position:relative; }
        .stats-list { list-style:none; padding:0; margin:.75rem 0 0; color:#BDD9BF; font-family:'Nova Square',sans-serif; }
        .stats-list li { padding:.6rem 0; border-bottom:1px solid rgba(189,217,191,.05); font-size:.9rem; }
        .stats-list li:last-child { border-bottom:none; }
      `,
        }}
      />
    </div>
  );
};

export default AdminDashboard;
