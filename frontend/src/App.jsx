import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const IS_PROD = import.meta.env.PROD;
const API = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + "/api" : IS_PROD ? "/api" : "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_API_URL || (IS_PROD ? "/" : "http://localhost:5000");

// ─── THEME ──────────────────────────────────────────────────────────────────
const C = {
  navy: "#FFFFFF", navyMid: "#E2E8F0", navyLight: "#94A3B8", // text colors
  slate: "#94A3B8", muted: "#64748B", border: "rgba(255, 255, 255, 0.1)", // borders
  bg: "transparent", white: "rgba(255, 255, 255, 0.04)", // panels
  accent: "#8B5CF6", accentLight: "rgba(139, 92, 246, 0.15)", accentDark: "#A78BFA",
  success: "#10B981", successLight: "rgba(16, 185, 129, 0.15)",
  warning: "#F59E0B", warningLight: "rgba(245, 158, 11, 0.15)",
  danger: "#EF4444", dangerLight: "rgba(239, 68, 68, 0.15)",
  info: "#3B82F6", infoLight: "rgba(59, 130, 246, 0.15)",
  purple: "#8B5CF6", purpleLight: "rgba(139, 92, 246, 0.15)",
  teal: "#14B8A6", tealLight: "rgba(20, 184, 166, 0.15)",
  pink: "#EC4899", pinkLight: "rgba(236, 72, 153, 0.15)",
  orange: "#F97316", orangeLight: "rgba(249, 115, 22, 0.15)",
};

const PRIORITY = {
  critical: { color: C.danger, bg: C.dangerLight, label: "Critical", order: 0 },
  high:     { color: C.orange, bg: C.orangeLight, label: "High", order: 1 },
  medium:   { color: C.warning, bg: C.warningLight, label: "Medium", order: 2 },
  low:      { color: C.success, bg: C.successLight, label: "Low", order: 3 },
};
const STATUS = {
  backlog:     { color: C.slate, bg: "#F3F4F6", label: "Backlog", icon: "⬜" },
  todo:        { color: C.muted, bg: "#F9FAFB", label: "To Do", icon: "○" },
  in_progress: { color: C.info, bg: C.infoLight, label: "In Progress", icon: "◑" },
  review:      { color: C.warning, bg: C.warningLight, label: "Review", icon: "◕" },
  done:        { color: C.success, bg: C.successLight, label: "Done", icon: "●" },
  blocked:     { color: C.danger, bg: C.dangerLight, label: "Blocked", icon: "✕" },
};
const ROLES = { admin: "Admin", manager: "Manager", member: "Member", viewer: "Viewer" };
const USER_COLORS = [C.accent, C.teal, C.purple, C.pink, C.orange, C.info, C.success, C.warning];

// ─── SEED DATA ───────────────────────────────────────────────────────────────
function createSeed() {
  const now = Date.now();
  const users = [
    { id: "u1", name: "Alex Morgan", email: "admin@projectflow.io", password: "admin123", role: "admin", dept: "Engineering", color: C.accent, joinedAt: new Date(now - 90*864e5).toISOString(), lastActive: new Date().toISOString(), online: true, bio: "Founder & CTO. Building the future of project management." },
    { id: "u2", name: "Jamie Lee", email: "jamie@projectflow.io", password: "jamie123", role: "manager", dept: "Design", color: C.teal, joinedAt: new Date(now - 60*864e5).toISOString(), lastActive: new Date(now - 2*3600e3).toISOString(), online: false, bio: "Lead Designer. Pixel-perfect is the only way." },
    { id: "u3", name: "Sam Rivera", email: "sam@projectflow.io", password: "sam123", role: "member", dept: "Engineering", color: C.purple, joinedAt: new Date(now - 45*864e5).toISOString(), lastActive: new Date(now - 15*60e3).toISOString(), online: true, bio: "Full-stack dev. Coffee-driven development." },
    { id: "u4", name: "Jordan Kim", email: "jordan@projectflow.io", password: "jordan123", role: "member", dept: "Marketing", color: C.pink, joinedAt: new Date(now - 30*864e5).toISOString(), lastActive: new Date(now - 1*3600e3).toISOString(), online: false, bio: "Growth & Marketing. Data-driven storyteller." },
    { id: "u5", name: "Taylor Chen", email: "taylor@projectflow.io", password: "taylor123", role: "manager", dept: "Product", color: C.orange, joinedAt: new Date(now - 20*864e5).toISOString(), lastActive: new Date(now - 30*60e3).toISOString(), online: true, bio: "Product Manager. Connecting dots and shipping features." },
  ];
  const projects = [
    { id: "p1", name: "Website Redesign", description: "Complete overhaul of company website with modern design system and improved UX", color: C.accent, ownerId: "u1", memberIds: ["u1","u2","u3","u4"], createdAt: new Date(now - 30*864e5).toISOString(), deadline: new Date(now + 30*864e5).toISOString(), status: "active", tags: ["design","frontend"], budget: 50000, spent: 18500 },
    { id: "p2", name: "Mobile App v2", description: "Next-generation mobile application with AI features and offline support", color: C.teal, ownerId: "u1", memberIds: ["u1","u3","u5"], createdAt: new Date(now - 20*864e5).toISOString(), deadline: new Date(now + 60*864e5).toISOString(), status: "active", tags: ["mobile","ai"], budget: 120000, spent: 34200 },
    { id: "p3", name: "Q4 Marketing Campaign", description: "End-of-year marketing push across all digital channels", color: C.pink, ownerId: "u5", memberIds: ["u4","u5","u2"], createdAt: new Date(now - 10*864e5).toISOString(), deadline: new Date(now + 45*864e5).toISOString(), status: "active", tags: ["marketing","campaign"], budget: 30000, spent: 8900 },
    { id: "p4", name: "Infrastructure Upgrade", description: "Cloud migration and infrastructure modernization", color: C.orange, ownerId: "u1", memberIds: ["u1","u3"], createdAt: new Date(now - 5*864e5).toISOString(), deadline: new Date(now + 90*864e5).toISOString(), status: "planning", tags: ["devops","cloud"], budget: 80000, spent: 2000 },
  ];
  const tasks = [
    { id: "t1", projectId: "p1", title: "Design new homepage mockups", description: "Create high-fidelity Figma mockups for homepage, about, and services pages", status: "done", priority: "high", assigneeId: "u2", reporterId: "u1", createdAt: new Date(now - 25*864e5).toISOString(), dueDate: new Date(now - 5*864e5).toISOString(), completedAt: new Date(now - 6*864e5).toISOString(), estimatedHours: 16, loggedHours: 18, tags: ["design","figma"], subtasks: [{id:"s1",title:"Desktop wireframes",done:true},{id:"s2",title:"Mobile wireframes",done:true},{id:"s3",title:"Dark mode variants",done:false}] },
    { id: "t2", projectId: "p1", title: "Set up component library", description: "Bootstrap Storybook with design tokens and core components", status: "in_progress", priority: "critical", assigneeId: "u3", reporterId: "u1", createdAt: new Date(now - 20*864e5).toISOString(), dueDate: new Date(now + 3*864e5).toISOString(), estimatedHours: 24, loggedHours: 14, tags: ["frontend","storybook"], subtasks: [{id:"s4",title:"Design tokens setup",done:true},{id:"s5",title:"Button components",done:true},{id:"s6",title:"Form components",done:false},{id:"s7",title:"Navigation components",done:false}] },
    { id: "t3", projectId: "p1", title: "Write copy for about page", description: "Draft compelling about page content highlighting company values and team", status: "todo", priority: "medium", assigneeId: "u4", reporterId: "u2", createdAt: new Date(now - 15*864e5).toISOString(), dueDate: new Date(now + 7*864e5).toISOString(), estimatedHours: 8, loggedHours: 0, tags: ["content"], subtasks: [] },
    { id: "t4", projectId: "p1", title: "SEO technical audit", description: "Audit current site SEO, create improvement roadmap", status: "review", priority: "medium", assigneeId: "u1", reporterId: "u5", createdAt: new Date(now - 10*864e5).toISOString(), dueDate: new Date(now - 1*864e5).toISOString(), estimatedHours: 12, loggedHours: 11, tags: ["seo"], subtasks: [] },
    { id: "t5", projectId: "p1", title: "Accessibility compliance audit", description: "WCAG 2.1 AA compliance check across all pages", status: "backlog", priority: "low", assigneeId: "u3", reporterId: "u1", createdAt: new Date(now - 8*864e5).toISOString(), dueDate: new Date(now + 14*864e5).toISOString(), estimatedHours: 10, loggedHours: 0, tags: ["a11y"], subtasks: [] },
    { id: "t6", projectId: "p2", title: "API integration planning", description: "Document all required API endpoints and data models", status: "done", priority: "high", assigneeId: "u3", reporterId: "u1", createdAt: new Date(now - 18*864e5).toISOString(), dueDate: new Date(now - 8*864e5).toISOString(), completedAt: new Date(now - 9*864e5).toISOString(), estimatedHours: 20, loggedHours: 22, tags: ["api","backend"], subtasks: [] },
    { id: "t7", projectId: "p2", title: "Authentication screens", description: "Build login, signup, password reset, and 2FA screens", status: "in_progress", priority: "critical", assigneeId: "u3", reporterId: "u1", createdAt: new Date(now - 12*864e5).toISOString(), dueDate: new Date(now + 2*864e5).toISOString(), estimatedHours: 32, loggedHours: 20, tags: ["mobile","auth"], subtasks: [{id:"s8",title:"Login screen",done:true},{id:"s9",title:"Signup flow",done:true},{id:"s10",title:"2FA integration",done:false}] },
    { id: "t8", projectId: "p2", title: "Push notification setup", description: "Integrate Firebase Cloud Messaging for push notifications", status: "blocked", priority: "high", assigneeId: "u1", reporterId: "u3", createdAt: new Date(now - 7*864e5).toISOString(), dueDate: new Date(now + 4*864e5).toISOString(), estimatedHours: 16, loggedHours: 4, tags: ["mobile","firebase"], subtasks: [] },
    { id: "t9", projectId: "p3", title: "Campaign strategy deck", description: "Create full Q4 marketing strategy presentation for leadership", status: "in_progress", priority: "high", assigneeId: "u4", reporterId: "u5", createdAt: new Date(now - 8*864e5).toISOString(), dueDate: new Date(now + 2*864e5).toISOString(), estimatedHours: 12, loggedHours: 7, tags: ["strategy"], subtasks: [] },
    { id: "t10", projectId: "p3", title: "Social media content calendar", description: "Plan 6-week social content for Instagram, LinkedIn, Twitter", status: "todo", priority: "medium", assigneeId: "u4", reporterId: "u5", createdAt: new Date(now - 5*864e5).toISOString(), dueDate: new Date(now + 10*864e5).toISOString(), estimatedHours: 20, loggedHours: 0, tags: ["social","content"], subtasks: [] },
  ];
  const comments = [
    { id: "c1", taskId: "t2", userId: "u3", text: "Completed design tokens. Moving to button components now.", createdAt: new Date(now - 3*864e5).toISOString(), type: "comment" },
    { id: "c2", taskId: "t2", userId: "u2", text: "Looks great! Make sure we follow the Figma variables for colors.", createdAt: new Date(now - 2*864e5).toISOString(), type: "comment" },
    { id: "c3", taskId: "t7", userId: "u1", text: "Great progress on auth! The 2FA needs to support both TOTP and SMS.", createdAt: new Date(now - 1*864e5).toISOString(), type: "comment" },
    { id: "c4", taskId: "t8", userId: "u3", text: "Blocked on Firebase credentials. Need admin access to the Firebase console.", createdAt: new Date(now - 4*864e5).toISOString(), type: "comment" },
    { id: "c5", taskId: "t4", userId: "u1", text: "Submitted for review. See Notion doc for full audit results.", createdAt: new Date(now - 2*864e5).toISOString(), type: "comment" },
  ];
  const activityLog = [
    { id: "a1", userId: "u3", action: "status_change", entityType: "task", entityId: "t2", entityName: "Set up component library", detail: "todo → in_progress", timestamp: new Date(now - 3*864e5).toISOString() },
    { id: "a2", userId: "u2", action: "comment", entityType: "task", entityId: "t2", entityName: "Set up component library", detail: "Left a comment", timestamp: new Date(now - 2*864e5 - 3600e3).toISOString() },
    { id: "a3", userId: "u1", action: "task_created", entityType: "task", entityId: "t5", entityName: "Accessibility compliance audit", detail: "New task created", timestamp: new Date(now - 8*864e5).toISOString() },
    { id: "a4", userId: "u3", action: "status_change", entityType: "task", entityId: "t6", entityName: "API integration planning", detail: "in_progress → done", timestamp: new Date(now - 9*864e5).toISOString() },
    { id: "a5", userId: "u4", action: "logged_time", entityType: "task", entityId: "t9", entityName: "Campaign strategy deck", detail: "Logged 3.5 hours", timestamp: new Date(now - 1*864e5).toISOString() },
    { id: "a6", userId: "u1", action: "member_added", entityType: "project", entityId: "p3", entityName: "Q4 Marketing Campaign", detail: "Added Jordan Kim", timestamp: new Date(now - 10*864e5).toISOString() },
  ];
  const notifications = [
    { id: "n1", userId: "u1", type: "overdue", message: "Task 'SEO technical audit' is overdue", entityId: "t4", read: false, createdAt: new Date(now - 86400e3).toISOString() },
    { id: "n2", userId: "u3", type: "mention", message: "Alex Morgan mentioned you in 'Authentication screens'", entityId: "t7", read: false, createdAt: new Date(now - 3600e3).toISOString() },
    { id: "n3", userId: "u3", type: "blocked", message: "Task 'Push notification setup' is blocked", entityId: "t8", read: false, createdAt: new Date(now - 2*3600e3).toISOString() },
    { id: "n4", userId: "u2", type: "comment", message: "Sam Rivera replied to your comment", entityId: "t2", read: true, createdAt: new Date(now - 4*3600e3).toISOString() },
  ];
  const timeLogs = [
    { id: "tl1", taskId: "t1", userId: "u2", hours: 8, note: "Initial wireframes", date: new Date(now - 20*864e5).toISOString() },
    { id: "tl2", taskId: "t1", userId: "u2", hours: 10, note: "High-fidelity mockups", date: new Date(now - 15*864e5).toISOString() },
    { id: "tl3", taskId: "t2", userId: "u3", hours: 8, note: "Design tokens and color system", date: new Date(now - 5*864e5).toISOString() },
    { id: "tl4", taskId: "t2", userId: "u3", hours: 6, note: "Button and input components", date: new Date(now - 3*864e5).toISOString() },
    { id: "tl5", taskId: "t7", userId: "u3", hours: 12, note: "Login and signup screens", date: new Date(now - 8*864e5).toISOString() },
    { id: "tl6", taskId: "t7", userId: "u3", hours: 8, note: "Password reset flow", date: new Date(now - 4*864e5).toISOString() },
    { id: "tl7", taskId: "t9", userId: "u4", hours: 7, note: "Research and competitor analysis", date: new Date(now - 2*864e5).toISOString() },
  ];
  return { users, projects, tasks, comments, activityLog, notifications, timeLogs };
}

const INIT = createSeed();

// ─── STORAGE (Removed localStorage, using Axios instead) ───────────

// ─── UTILS ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtTime = d => d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
const fmtAgo = d => {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return fmtDate(d);
};
const isOverdue = t => t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date();

// ─── BASE COMPONENTS ──────────────────────────────────────────────────────────
function Avatar({ name, color, size = 32, online }) {
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: color + "20", border: `2px solid ${color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color, flexShrink: 0 }}>{initials}</div>
      {online !== undefined && <div style={{ position: "absolute", bottom: 0, right: 0, width: size*0.28, height: size*0.28, borderRadius: "50%", background: online ? C.success : C.muted, border: `2px solid white` }} />}
    </div>
  );
}

function Badge({ label, color, bg, size = "sm", dot }) {
  return (
    <span style={{ background: bg, color, fontSize: size === "xs" ? 10 : 11, fontWeight: 700, padding: size === "xs" ? "2px 6px" : "3px 9px", borderRadius: 99, letterSpacing: 0.3, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block" }} />}{label}
    </span>
  );
}

function Pill({ children, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: 99, border: active ? `1.5px solid ${color || C.accent}` : `1.5px solid ${C.border}`, background: active ? (color || C.accent) + "12" : "transparent", color: active ? (color || C.accent) : C.muted, fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all .15s" }}>{children}</button>
  );
}

function Modal({ title, onClose, children, width = 560, subtitle }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,15,30,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ background: C.white, backdropFilter: "blur(16px)", borderRadius: 16, width, maxWidth: "100%", maxHeight: "92vh", overflow: "auto", boxShadow: "0 32px 64px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "22px 26px 18px", borderBottom: `1px solid ${C.border}`, gap: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.navy }}>{title}</h3>
            {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 22, color: C.muted, lineHeight: 1, padding: 2, flexShrink: 0 }}>×</button>
        </div>
        <div style={{ padding: 26 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.slate, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      {children}
      {hint && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.muted }}>{hint}</p>}
    </div>
  );
}

const inp = { width: "100%", padding: "10px 13px", border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 14, color: C.navy, outline: "none", boxSizing: "border-box", background: C.white, backdropFilter: "blur(16px)", fontFamily: "inherit" };
const btn = (v = "primary", size = "md") => ({
  padding: size === "sm" ? "7px 14px" : "10px 20px", borderRadius: 9, fontSize: size === "sm" ? 13 : 14, fontWeight: 600, cursor: "pointer", border: "none", transition: "all .15s", whiteSpace: "nowrap",
  background: v === "primary" ? C.accent : v === "danger" ? C.danger : v === "success" ? C.success : v === "warning" ? C.warning : C.bg,
  color: v === "ghost" ? C.slate : C.white,
  ...(v === "ghost" && { border: `1.5px solid ${C.border}`, background: C.white, backdropFilter: "blur(16px)" }),
});

function Spinner() {
  return <div style={{ width: 20, height: 20, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}

function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: t.type === "error" ? C.danger : t.type === "warning" ? C.warning : C.navy, color: C.white, padding: "12px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", maxWidth: 360, display: "flex", alignItems: "center", gap: 10 }}>
          <span>{t.type === "error" ? "✕" : t.type === "warning" ? "⚠" : "✓"}</span>{t.message}
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ value, max, color, height = 6 }) {
  const pct = max ? Math.min(100, Math.round(value / max * 100)) : 0;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ height, background: C.bg, borderRadius: 99, overflow: "hidden", border: `1px solid ${C.border}` }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? C.success : pct >= 60 ? color || C.accent : color || C.accent, borderRadius: 99, transition: "width .5s ease" }} />
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [db, setDb] = useState(null);
  const [session, setSession] = useState(null); // userId
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [activeProject, setActiveProject] = useState(null);
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [search, setSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

    const headers = { Authorization: `Bearer ${localStorage.getItem("pf_token")}` };
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("pf_token");
    if (!token) { setLoading(false); return; }
    
    axios.get(`${API}/bootstrap`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setDb(res.data);
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setSession(decoded.id);
        setLoading(false);
        
        socketRef.current = io(SOCKET_URL);
        socketRef.current.emit("authenticate", decoded.id);
        
        socketRef.current.on("user_status_change", ({ userId, online }) => {
           setDb(d => {
             if (!d) return d;
             return { ...d, users: d.users.map(u => u.id === userId ? { ...u, online, lastActive: new Date().toISOString() } : u) };
           });
        });
        
        socketRef.current.on("db_update", (msg) => {
           setDb(d => {
             if (!d) return d;
             const nd = { ...d };
             if (msg.type === "activity" && msg.action === "create") {
                nd.activityLog = [msg.data, ...(nd.activityLog || [])].slice(0, 200);
             } else if (msg.type === "task" && msg.action === "update") {
                nd.tasks = nd.tasks.map(t => t.id === msg.data.id ? msg.data : t);
             } else if (msg.type === "task" && msg.action === "create") {
                nd.tasks = [...nd.tasks, msg.data];
             } else if (msg.type === "task" && msg.action === "delete") {
                nd.tasks = nd.tasks.filter(t => t.id !== msg.id);
             } else if (msg.type === "project" && msg.action === "create") {
                nd.projects = [...nd.projects, msg.data];
             } else if (msg.type === "project" && msg.action === "update") {
                nd.projects = nd.projects.map(p => p.id === msg.data.id ? msg.data : p);
             } else if (msg.type === "project" && msg.action === "delete") {
                nd.projects = nd.projects.filter(p => p.id !== msg.id);
             } else if (msg.type === "comment" && msg.action === "create") {
                nd.comments = [...(nd.comments || []), msg.data];
             } else if (msg.type === "timelog" && msg.action === "create") {
                nd.timeLogs = [...(nd.timeLogs || []), msg.data];
             } else if (msg.type === "project_member" && msg.action === "create") {
                nd.projects = nd.projects.map(p => p.id === msg.projectId ? { ...p, memberIds: [...p.memberIds, msg.userId] } : p);
             } else if (msg.type === "project_member" && msg.action === "delete") {
                nd.projects = nd.projects.map(p => p.id === msg.projectId ? { ...p, memberIds: p.memberIds.filter(id => id !== msg.userId) } : p);
             } else if (msg.type === "user" && msg.action === "update") {
                nd.users = nd.users.map(u => u.id === msg.data.id ? msg.data : u);
             }
             return nd;
           });
        });
      })
      .catch(() => {
        localStorage.removeItem("pf_token");
        setLoading(false);
      });
      
    return () => socketRef.current?.disconnect();
  }, []);

  const toast = useCallback((message, type = "success") => {
    const id = uid();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.accent }}>⬡ ProjectFlow</div>
      <Spinner />
    </div>
  );

  if (!session || !db) return (
    <AuthScreen db={db} setDb={setDb} session={session} setSession={setSession} mode={authMode} setMode={setAuthMode} toast={toast} />
  );

  const me = db.users.find(u => u.id === session);
  if (!me) { setSession(null); return null; }

  const isAdmin = me.role === "admin";
  const isManagerOrAdmin = me.role === "admin" || me.role === "manager";
  const myProjects = db.projects.filter(p => isAdmin || p.memberIds.includes(session));
  const allTasks = db.tasks.filter(t => {
    const proj = db.projects.find(p => p.id === t.projectId);
    return isAdmin || (proj && proj.memberIds.includes(session));
  });
  const myNotifs = (db.notifications || []).filter(n => n.userId === session);
  const unreadCount = myNotifs.filter(n => !n.read).length;

  const markNotifsRead = async () => {
    setDb(d => ({ ...d, notifications: d.notifications.map(n => n.userId === session ? { ...n, read: true } : n) }));
    await axios.put(`${API}/notifications/read-all`, {}, { headers });
  };

  const logout = () => {
    localStorage.removeItem("pf_token");
    setSession(null); setDb(null); setView("dashboard"); setActiveProject(null);
    if (socketRef.current) socketRef.current.disconnect();
  };

  const upsertProject = async (data) => {
    if (data.id && data.id.length > 10) { 
      await axios.put(`${API}/projects/${data.id}`, data, { headers });
      toast("Project updated");
    } else {
      await axios.post(`${API}/projects`, data, { headers });
      toast("Project created!");
    }
    setModal(null);
  };

  const deleteProject = async (id) => {
    await axios.delete(`${API}/projects/${id}`, { headers });
    if (activeProject === id) { setActiveProject(null); setView("dashboard"); }
    toast("Project deleted", "warning");
    setModal(null);
  };

  const upsertTask = async (data) => {
    if (data.id && data.id.length > 10) {
      await axios.put(`${API}/tasks/${data.id}`, data, { headers });
      toast("Task updated");
    } else {
      await axios.post(`${API}/tasks`, data, { headers });
      toast("Task created!");
    }
    setModal(null);
  };

  const deleteTask = async (id) => {
    await axios.delete(`${API}/tasks/${id}`, { headers });
    toast("Task deleted", "warning");
    setModal(null);
  };

  const updateTaskStatus = async (id, status) => {
    const t = db.tasks.find(x => x.id === id);
    setDb(d => ({ ...d, tasks: d.tasks.map(x => x.id === id ? { ...x, status } : x) }));
    await axios.put(`${API}/tasks/${id}`, { ...t, status }, { headers });
    toast(`Moved to ${STATUS[status]?.label}`);
  };

  const addComment = async (taskId, text) => {
    await axios.post(`${API}/comments`, { taskId, text }, { headers });
  };

  const logTime = async (taskId, hours, note) => {
    await axios.post(`${API}/timelogs`, { taskId, hours, note }, { headers });
    toast(`Logged ${hours}h`);
  };

  const toggleSubtask = async (taskId, subtaskId) => {
    const t = db.tasks.find(x => x.id === taskId);
    const updatedSubtasks = t.subtasks.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s);
    setDb(d => ({ ...d, tasks: d.tasks.map(x => x.id === taskId ? { ...x, subtasks: updatedSubtasks } : x) }));
    await axios.put(`${API}/tasks/${taskId}`, { ...t, subtasks: updatedSubtasks }, { headers });
  };

  const addMember = async (projectId, userId) => {
    await axios.post(`${API}/projects/${projectId}/members`, { userId }, { headers });
    toast("Added member");
  };

  const removeMember = async (projectId, userId) => {
    await axios.delete(`${API}/projects/${projectId}/members/${userId}`, { headers });
    toast("Removed member");
  };

  const upsertUser = async (data) => {
    if (data.id && data.id.length > 10) {
      await axios.put(`${API}/users/${data.id}`, data, { headers });
      toast("User updated");
    }
    setModal(null);
  };

  const deleteUser = async (id) => {
    await axios.delete(`${API}/users/${id}`, { headers });
    toast("User removed", "warning");
    setModal(null);
  };

  const currentProject = db.projects.find(p => p.id === activeProject);
  const projectTasks = db.tasks.filter(t => t.projectId === activeProject);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "tasks", label: "My Tasks", icon: "✓" },
    { id: "activity", label: "Activity", icon: "⚡" },
    { id: "reports", label: "Reports", icon: "📊" },
    ...(isAdmin ? [{ id: "team", label: "Team", icon: "⊙" }] : []),
    ...(isAdmin ? [{ id: "settings", label: "Settings", icon: "⚙" }] : []),
  ];

  const globalSearch = search.trim().toLowerCase();
  const searchResults = globalSearch ? [
    ...db.tasks.filter(t => t.title.toLowerCase().includes(globalSearch) || t.description?.toLowerCase().includes(globalSearch)),
    ...db.projects.filter(p => p.name.toLowerCase().includes(globalSearch)),
  ] : [];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', -apple-system, sans-serif", background: C.bg, overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        input:focus, select:focus, textarea:focus { border-color: ${C.accent} !important; box-shadow: 0 0 0 3px ${C.accentLight}; outline: none; }
        button { font-family: inherit; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
        @keyframes slideIn { from { transform: translateX(-8px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .card-hover:hover { border-color: ${C.accent}66 !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(79,70,229,0.1) !important; transition: all .2s; }
        .row-hover:hover { background: ${C.accentLight} !important; }
        .btn-icon { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 7px; color: ${C.muted}; display: flex; align-items: center; }
        .btn-icon:hover { background: ${C.bg}; color: ${C.navy}; }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: sidebarOpen ? 240 : 64, background: C.navy, display: "flex", flexDirection: "column", flexShrink: 0, transition: "width .25s ease", overflow: "hidden" }}>
        {/* Logo */}
        <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.navyLight}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>⬡</div>
          {sidebarOpen && <span style={{ color: C.white, fontWeight: 800, fontSize: 15, whiteSpace: "nowrap" }}>ProjectFlow</span>}
          <button onClick={() => setSidebarOpen(s => !s)} className="btn-icon" style={{ marginLeft: "auto", color: C.muted, flexShrink: 0 }}>{sidebarOpen ? "←" : "→"}</button>
        </div>

        {/* Search */}
        {sidebarOpen && (
          <div style={{ padding: "12px 12px 4px" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }}>🔍</span>
              <input style={{ ...inp, paddingLeft: 30, background: C.navyLight, border: "none", color: C.white, fontSize: 13 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 8px", overflow: "auto" }}>
          {navItems.map(item => {
            const active = view === item.id && !activeProject;
            return (
              <button key={item.id} onClick={() => { setView(item.id); setActiveProject(null); setSearch(""); }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2, background: active ? C.navyLight : "transparent", color: active ? C.white : C.muted, fontSize: 14, fontWeight: active ? 600 : 400, textAlign: "left", transition: "all .15s", overflow: "hidden" }}>
                <span style={{ fontSize: 14, flexShrink: 0, width: 20, textAlign: "center" }}>{item.icon}</span>
                {sidebarOpen && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
              </button>
            );
          })}

          {/* Projects */}
          {sidebarOpen && (
            <>
              <div style={{ margin: "14px 12px 8px", fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: 1 }}>Projects</div>
              {myProjects.map(p => (
                <button key={p.id} onClick={() => { setActiveProject(p.id); setView("project"); setSearch(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2, background: activeProject === p.id ? C.navyLight : "transparent", color: activeProject === p.id ? C.white : C.muted, fontSize: 13, fontWeight: activeProject === p.id ? 600 : 400, textAlign: "left", overflow: "hidden" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0, animation: p.status === "active" ? "pulse 2s infinite" : "none" }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                </button>
              ))}
              {isManagerOrAdmin && (
                <button onClick={() => setModal({ type: "project" })}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px dashed ${C.slate}`, cursor: "pointer", color: C.muted, fontSize: 13, background: "transparent", marginTop: 4 }}>
                  + New Project
                </button>
              )}
            </>
          )}
        </nav>

        {/* User */}
        <div style={{ padding: "12px 12px", borderTop: `1px solid ${C.navyLight}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div onClick={() => setModal({ type: "profile", data: me })} style={{ cursor: "pointer", flexShrink: 0 }}>
              <Avatar name={me.name} color={me.color} size={32} online={true} />
            </div>
            {sidebarOpen && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{me.dept || me.role}</div>
                </div>
                <div style={{ position: "relative" }}>
                  <button className="btn-icon" onClick={() => { setNotifOpen(n => !n); }} style={{ position: "relative", color: unreadCount > 0 ? C.warning : C.muted }}>
                    🔔
                    {unreadCount > 0 && <span style={{ position: "absolute", top: -2, right: -2, width: 16, height: 16, borderRadius: "50%", background: C.danger, color: C.white, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
                  </button>
                </div>
                <button className="btn-icon" onClick={logout} style={{ color: C.muted }} title="Logout">⏻</button>
              </>
            )}
          </div>
          {/* Notif Panel */}
          {notifOpen && sidebarOpen && (
            <div style={{ position: "absolute", bottom: 70, left: 248, width: 320, background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,0.2)", zIndex: 500, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.navy }}>Notifications</span>
                <button onClick={markNotifsRead} style={{ ...btn("ghost", "sm"), padding: "3px 8px", fontSize: 11 }}>Mark all read</button>
              </div>
              <div style={{ maxHeight: 320, overflow: "auto" }}>
                {myNotifs.length === 0 ? (
                  <p style={{ padding: "20px 16px", color: C.muted, fontSize: 14, textAlign: "center" }}>All caught up! 🎉</p>
                ) : myNotifs.slice(0, 20).map(n => (
                  <div key={n.id} onClick={() => setNotifOpen(false)} style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: n.read ? C.white : C.accentLight, cursor: "pointer" }}>
                    <div style={{ fontSize: 13, color: C.navy, fontWeight: n.read ? 400 : 600 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{fmtAgo(n.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", animation: "fadeIn .2s ease" }}>
        {/* Global search results */}
        {globalSearch && searchResults.length > 0 && (
          <div style={{ padding: "16px 24px 0" }}>
            <div style={{ background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Search Results ({searchResults.length})</div>
              {searchResults.slice(0, 8).map(r => (
                <div key={r.id} className="row-hover" onClick={() => {
                  setSearch("");
                  if (r.memberIds) { setActiveProject(r.id); setView("project"); }
                  else setModal({ type: "task", data: r });
                }} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 18 }}>{r.memberIds ? "📁" : "✓"}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{r.name || r.title}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{r.memberIds ? "Project" : `Task · ${STATUS[r.status]?.label}`}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "dashboard" && !activeProject && <DashboardView me={me} isAdmin={isAdmin} projects={myProjects} tasks={allTasks} users={db.users} db={db} onOpenProject={id => { setActiveProject(id); setView("project"); }} onNewTask={() => setModal({ type: "task", data: { projectId: myProjects[0]?.id } })} />}
        {view === "tasks" && !activeProject && <TasksView tasks={allTasks} projects={db.projects} users={db.users} me={me} isAdmin={isAdmin} isManagerOrAdmin={isManagerOrAdmin} onEdit={t => setModal({ type: "task", data: t })} onStatusChange={updateTaskStatus} onNew={() => setModal({ type: "task", data: { projectId: myProjects[0]?.id } })} />}
        {view === "activity" && !activeProject && <ActivityView db={db} users={db.users} me={me} isAdmin={isAdmin} />}
        {view === "reports" && !activeProject && <ReportsView db={db} me={me} isAdmin={isAdmin} projects={myProjects} tasks={allTasks} users={db.users} />}
        {view === "team" && isAdmin && !activeProject && <TeamView users={db.users} projects={db.projects} tasks={db.tasks} onEdit={u => setModal({ type: "user", data: u })} onNew={() => setModal({ type: "user" })} />}
        {view === "settings" && isAdmin && !activeProject && <SettingsView db={db} me={me} setDb={setDb} toast={toast} />}
        {view === "project" && currentProject && (
          <ProjectView
            project={currentProject} tasks={projectTasks} users={db.users} me={me}
            isAdmin={isAdmin} isManagerOrAdmin={isManagerOrAdmin}
            comments={db.comments || []} timeLogs={db.timeLogs || []} activityLog={db.activityLog || []}
            onNewTask={() => setModal({ type: "task", data: { projectId: currentProject.id } })}
            onEditTask={t => setModal({ type: "task", data: t })}
            onStatusChange={updateTaskStatus}
            onEditProject={() => setModal({ type: "project", data: currentProject })}
            onManageTeam={() => setModal({ type: "team", data: currentProject })}
            onViewTask={t => setModal({ type: "task_detail", data: t })}
          />
        )}
      </main>

      {/* Modals */}
      {modal?.type === "project" && <ProjectModal data={modal.data} users={db.users} me={me} isManagerOrAdmin={isManagerOrAdmin} onSave={upsertProject} onDelete={isAdmin ? deleteProject : null} onClose={() => setModal(null)} />}
      {modal?.type === "task" && <TaskModal data={modal.data} projects={myProjects} users={db.users} me={me} isAdmin={isAdmin} isManagerOrAdmin={isManagerOrAdmin} onSave={upsertTask} onDelete={isAdmin ? deleteTask : null} onClose={() => setModal(null)} />}
      {modal?.type === "task_detail" && <TaskDetailModal task={modal.data} projects={db.projects} users={db.users} me={me} isAdmin={isAdmin} isManagerOrAdmin={isManagerOrAdmin} comments={(db.comments || []).filter(c => c.taskId === modal.data.id)} timeLogs={(db.timeLogs || []).filter(l => l.taskId === modal.data.id)} onEdit={() => setModal({ type: "task", data: modal.data })} onComment={addComment} onLogTime={logTime} onToggleSubtask={toggleSubtask} onStatusChange={(id, s) => { updateTaskStatus(id, s); setModal(m => ({ ...m, data: { ...m.data, status: s } })); }} onClose={() => setModal(null)} />}
      {modal?.type === "team" && <TeamManageModal project={modal.data} users={db.users} onAdd={addMember} onRemove={removeMember} onClose={() => setModal(null)} />}
      {modal?.type === "user" && <UserModal data={modal.data} isAdmin={isAdmin} onSave={upsertUser} onDelete={isAdmin ? deleteUser : null} onClose={() => setModal(null)} />}
      {modal?.type === "profile" && <ProfileModal data={modal.data} isMe={modal.data.id === session} onSave={upsertUser} onClose={() => setModal(null)} tasks={db.tasks} projects={db.projects} />}

      <Toast toasts={toasts} />
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ db, setDb, setSession, mode, setMode, toast }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", dept: "Engineering", role: "admin" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setErr("");
    try {
      const res = await axios.post(`${API}/auth/login`, { email: form.email, password: form.password });
      localStorage.setItem("pf_token", res.data.token);
      window.location.reload();
    } catch(e) {
      setErr("Invalid email or password.");
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { setErr("All fields required"); return; }
    if (form.password.length < 6) { setErr("Password must be at least 6 characters"); return; }
    setLoading(true); setErr("");
    try {
      const res = await axios.post(`${API}/auth/register`, form);
      localStorage.setItem("pf_token", res.data.token);
      window.location.reload();
    } catch(e) {
      setErr("Registration failed. Email might exist.");
    }
    setLoading(false);
  };

  const isLogin = mode === "login";

  const DEMO_ACCOUNTS = [
    { id: "u1", name: "Alex Morgan", email: "admin@projectflow.io", password: "admin123", role: "admin", color: "#4F46E5" },
    { id: "u2", name: "Jamie Lee", email: "jamie@projectflow.io", password: "jamie123", role: "manager", color: "#0D9488" },
    { id: "u3", name: "Sam Rivera", email: "sam@projectflow.io", password: "sam123", role: "member", color: "#7C3AED" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', sans-serif", background: `radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(20, 184, 166, 0.1), transparent 40%), ${C.navy}` }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}body{margin:0;color:#f8fafc;background-color:#020617;}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.2)}`}</style>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: 420, animation: "fadeIn .4s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⬡</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.navy }}>ProjectFlow</h1>
          </div>

          <h2 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800, color: C.navy }}>{isLogin ? "Welcome back" : "Create account"}</h2>
          <p style={{ margin: "0 0 32px", color: C.muted, fontSize: 14 }}>{isLogin ? "Sign in to your workspace" : "Join your team on ProjectFlow"}</p>

          {!isLogin && (
            <>
              <Field label="Full Name"><input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Department"><select style={inp} value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}>{["Engineering","Design","Product","Marketing","Sales","Operations","HR","Finance"].map(d => <option key={d}>{d}</option>)}</select></Field>
                <Field label="Role"><select style={inp} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}><option value="admin">Admin</option><option value="manager">Manager</option><option value="member">Member</option><option value="viewer">Viewer</option></select></Field>
              </div>
            </>
          )}
          <Field label="Email"><input style={inp} type="email" placeholder="you@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} onKeyDown={e => e.key === "Enter" && (isLogin ? handleLogin() : handleRegister())} /></Field>
          <Field label="Password"><input style={inp} type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && (isLogin ? handleLogin() : handleRegister())} /></Field>

          {err && <p style={{ color: C.danger, fontSize: 13, marginBottom: 14, padding: "10px 14px", background: C.dangerLight, borderRadius: 8 }}>{err}</p>}

          <button id="signin-btn" style={{ ...btn("primary"), width: "100%", padding: "13px", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={isLogin ? handleLogin : handleRegister} disabled={loading}>
            {loading ? <Spinner /> : (isLogin ? "Sign in →" : "Create Account →")}
          </button>

          <p style={{ textAlign: "center", marginTop: 20, color: C.muted, fontSize: 14 }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(isLogin ? "register" : "login"); setErr(""); }} style={{ background: "none", border: "none", color: C.accent, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
              {isLogin ? "Register" : "Sign in"}
            </button>
          </p>

          {isLogin && (
            <div style={{ marginTop: 28, padding: 16, background: C.accentLight, borderRadius: 12, border: `1px solid ${C.accent}22` }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: C.accentDark, textTransform: "uppercase", letterSpacing: 0.5 }}>Quick Access — Demo Accounts</p>
              {DEMO_ACCOUNTS.map(u => (
                <button key={u.id} onClick={() => {
                  setForm({ ...form, email: u.email, password: u.password });
                  setTimeout(() => {
                    document.getElementById("signin-btn").click();
                  }, 50);
                }}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 10px", marginBottom: 4, borderRadius: 8, border: `1px solid ${C.accent}30`, background: C.white, backdropFilter: "blur(16px)", cursor: "pointer", textAlign: "left" }}>
                  <Avatar name={u.name} color={u.color} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{u.email} · {u.role}</div>
                  </div>
                  <Badge label={u.role} color={u.role === "admin" ? C.accentDark : C.teal} bg={u.role === "admin" ? C.accentLight : C.tealLight} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ width: 440, background: "rgba(255,255,255,0.02)", borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, backdropFilter: "blur(20px)" }}>
        <div style={{ width: "100%", maxWidth: 340 }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>⬡</div>
          <h2 style={{ color: C.white, fontSize: 30, fontWeight: 800, margin: "0 0 14px", lineHeight: 1.2 }}>Built for teams that ship</h2>
          <p style={{ color: C.slate, fontSize: 14, lineHeight: 1.8, marginBottom: 36 }}>Role-based access, live activity tracking, time logging, comments, and full project analytics — all in one place.</p>
          {[
            ["⚡", "Live activity & status tracking"],
            ["📋", "Kanban boards & priority queues"],
            ["💬", "Inline comments & @mentions"],
            ["⏱", "Time logging & estimates"],
            ["📊", "Reports & team analytics"],
            ["🔔", "Smart notifications"],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 15 }}>{icon}</span>
              <span style={{ color: C.slate, fontSize: 14 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardView({ me, isAdmin, projects, tasks, users, db, onOpenProject, onNewTask }) {
  const done = tasks.filter(t => t.status === "done").length;
  const inProg = tasks.filter(t => t.status === "in_progress").length;
  const overdue = tasks.filter(t => isOverdue(t));
  const blocked = tasks.filter(t => t.status === "blocked");
  const myTasks = tasks.filter(t => t.assigneeId === me.id);
  const myDueSoon = myTasks.filter(t => t.status !== "done" && t.dueDate && new Date(t.dueDate) > new Date() && new Date(t.dueDate) < new Date(Date.now() + 7*864e5));
  const onlineUsers = users.filter(u => u.online && u.id !== me.id);
  const recentActivity = (db.activityLog || []).slice(0, 8);

  return (
    <div style={{ padding: 32, animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: C.navy }}>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {me.name.split(" ")[0]} 👋</h1>
          <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {me.dept} · {me.role}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {onlineUsers.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.successLight, borderRadius: 99, padding: "6px 12px 6px 8px" }}>
              <div style={{ display: "flex", gap: -4 }}>{onlineUsers.slice(0, 3).map((u, i) => <div key={u.id} style={{ marginLeft: i > 0 ? -6 : 0 }}><Avatar name={u.name} color={u.color} size={22} /></div>)}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.success }}>{onlineUsers.length} online</span>
            </div>
          )}
          <button style={btn("primary")} onClick={onNewTask}>+ New Task</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total Tasks", value: tasks.length, color: C.navy, sub: `${inProg} in progress`, icon: "📋" },
          { label: "Completed", value: done, color: C.success, sub: tasks.length ? `${Math.round(done/tasks.length*100)}% rate` : "—", icon: "✅" },
          { label: "Overdue", value: overdue.length, color: overdue.length ? C.danger : C.success, sub: overdue.length ? "Needs attention" : "All on track", icon: "⚠" },
          { label: "Blocked", value: blocked.length, color: blocked.length ? C.orange : C.success, sub: blocked.length ? "Unblock needed" : "None blocked", icon: "🚫" },
          { label: "My Tasks", value: myTasks.filter(t=>t.status!=="done").length, color: C.accent, sub: `${myDueSoon.length} due this week`, icon: "👤" },
        ].map(s => (
          <div key={s.label} style={{ background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${C.border}`, borderRadius: 13, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</span>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22 }}>
        {/* Projects */}
        <div style={{ gridColumn: "1 / 2" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.navy }}>Projects</h2>
            <span style={{ fontSize: 12, color: C.muted }}>{projects.length} total</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {projects.map(p => {
              const pts = tasks.filter(t => t.projectId === p.id);
              const pdone = pts.filter(t => t.status === "done").length;
              const ppct = pts.length ? Math.round(pdone / pts.length * 100) : 0;
              const members = users.filter(u => p.memberIds.includes(u.id));
              const povd = pts.filter(t => isOverdue(t));
              return (
                <div key={p.id} className="card-hover" onClick={() => onOpenProject(p.id)} style={{ background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", cursor: "pointer", transition: "all .2s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, display: "inline-block" }} />
                      <span style={{ fontWeight: 700, color: C.navy, fontSize: 14 }}>{p.name}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {povd.length > 0 && <Badge label={`${povd.length} overdue`} color={C.danger} bg={C.dangerLight} size="xs" />}
                      <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{ppct}%</span>
                    </div>
                  </div>
                  <ProgressBar value={pdone} max={pts.length} color={p.color} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                    <div style={{ display: "flex", gap: -4 }}>{members.slice(0, 4).map((u, i) => <div key={u.id} style={{ marginLeft: i > 0 ? -8 : 0 }}><Avatar name={u.name} color={u.color} size={22} /></div>)}</div>
                    <span style={{ fontSize: 12, color: C.muted }}>{pts.length} tasks</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* My Tasks */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.navy }}>My Tasks</h2>
            <span style={{ fontSize: 12, color: C.muted }}>{myTasks.filter(t => t.status !== "done").length} open</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myTasks.filter(t => t.status !== "done").slice(0, 6).map(t => {
              const proj = projects.find(p => p.id === t.projectId);
              const st = STATUS[t.status];
              const pr = PRIORITY[t.priority];
              const ovd = isOverdue(t);
              return (
                <div key={t.id} style={{ background: ovd ? C.dangerLight : C.white, border: `1px solid ${ovd ? C.danger + "44" : C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 6, lineHeight: 1.3 }}>{t.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Badge label={st.label} color={st.color} bg={st.bg} size="xs" />
                    <Badge label={pr.label} color={pr.color} bg={pr.bg} size="xs" />
                    {proj && <span style={{ fontSize: 11, color: C.muted }}>{proj.name}</span>}
                    {t.dueDate && <span style={{ fontSize: 11, color: ovd ? C.danger : C.muted, fontWeight: ovd ? 700 : 400 }}>Due {fmtDate(t.dueDate)}</span>}
                  </div>
                </div>
              );
            })}
            {myTasks.filter(t => t.status !== "done").length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 14, background: C.white, backdropFilter: "blur(16px)", borderRadius: 12, border: `1px solid ${C.border}` }}>
                🎉 All caught up!
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.navy }}>Live Activity</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.success, animation: "pulse 1.5s infinite" }} />
              <span style={{ fontSize: 12, color: C.success, fontWeight: 600 }}>Live</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentActivity.map(a => {
              const user = users.find(u => u.id === a.userId);
              return (
                <div key={a.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  {user && <Avatar name={user.name} color={user.color} size={28} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: C.navy, lineHeight: 1.5 }}>
                      <strong>{user?.name?.split(" ")[0]}</strong> {a.detail} <span style={{ color: C.muted, fontWeight: 400 }}>on</span> <strong style={{ color: C.accent }}>{a.entityName}</strong>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{fmtAgo(a.timestamp)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TASKS VIEW ───────────────────────────────────────────────────────────────
function TasksView({ tasks, projects, users, me, isAdmin, isManagerOrAdmin, onEdit, onStatusChange, onNew }) {
  const [filter, setFilter] = useState("all");
  const [priority, setPriority] = useState("all");
  const [search, setSearch] = useState("");
  const [assignee, setAssignee] = useState("mine");
  const [sort, setSort] = useState("dueDate");

  let filtered = tasks.filter(t => {
    if (assignee === "mine" && t.assigneeId !== me.id) return false;
    if (filter !== "all" && t.status !== filter) return false;
    if (priority !== "all" && t.priority !== priority) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  filtered = filtered.sort((a, b) => {
    if (sort === "dueDate") return new Date(a.dueDate || "9999") - new Date(b.dueDate || "9999");
    if (sort === "priority") return (PRIORITY[a.priority]?.order || 99) - (PRIORITY[b.priority]?.order || 99);
    if (sort === "created") return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  return (
    <div style={{ padding: 32, animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: C.navy }}>{isAdmin && assignee === "all" ? "All Tasks" : "My Tasks"}</h1>
          <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>{filtered.length} tasks · {filtered.filter(t => isOverdue(t)).length} overdue</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {isManagerOrAdmin && <button style={btn("primary")} onClick={onNew}>+ New Task</button>}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input style={{ ...inp, maxWidth: 240 }} placeholder="🔍 Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        {isAdmin && (
          <select style={{ ...inp, maxWidth: 130 }} value={assignee} onChange={e => setAssignee(e.target.value)}>
            <option value="mine">My Tasks</option>
            <option value="all">All Tasks</option>
          </select>
        )}
        <select style={{ ...inp, maxWidth: 140 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select style={{ ...inp, maxWidth: 130 }} value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="all">All Priority</option>
          {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select style={{ ...inp, maxWidth: 130 }} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="dueDate">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
          <option value="created">Sort: Newest</option>
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(t => {
          const proj = projects.find(p => p.id === t.projectId);
          const asgn = users.find(u => u.id === t.assigneeId);
          const st = STATUS[t.status];
          const pr = PRIORITY[t.priority];
          const ovd = isOverdue(t);
          const subtasksDone = t.subtasks?.filter(s => s.done).length || 0;
          const subtasksTotal = t.subtasks?.length || 0;
          return (
            <div key={t.id} className="row-hover" onClick={() => onEdit(t)} style={{ background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${ovd ? C.danger + "44" : C.border}`, borderRadius: 11, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "all .15s" }}>
              <select value={t.status} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); onStatusChange(t.id, e.target.value); }}
                style={{ border: `1.5px solid ${st.color}44`, borderRadius: 7, background: st.bg, color: st.color, fontSize: 12, fontWeight: 700, padding: "5px 8px", cursor: "pointer", outline: "none", flexShrink: 0 }}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ovd && <span style={{ color: C.danger, marginRight: 6 }}>⚠</span>}{t.title}</div>
                <div style={{ fontSize: 12, color: C.muted, display: "flex", gap: 10 }}>
                  {proj && <span>{proj.name}</span>}
                  {t.dueDate && <span style={{ color: ovd ? C.danger : C.muted, fontWeight: ovd ? 700 : 400 }}>Due {fmtDate(t.dueDate)}</span>}
                  {subtasksTotal > 0 && <span>{subtasksDone}/{subtasksTotal} subtasks</span>}
                  {(t.loggedHours || 0) > 0 && <span>⏱ {t.loggedHours}h logged</span>}
                </div>
              </div>
              <Badge label={pr.label} color={pr.color} bg={pr.bg} size="xs" />
              {t.tags?.slice(0, 2).map(tag => <span key={tag} style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: C.accentLight, color: C.accent, fontWeight: 600 }}>#{tag}</span>)}
              {asgn && <Avatar name={asgn.name} color={asgn.color} size={28} />}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 15, background: C.white, backdropFilter: "blur(16px)", borderRadius: 14, border: `1px solid ${C.border}` }}>
            No tasks match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PROJECT VIEW ─────────────────────────────────────────────────────────────
function ProjectView({ project, tasks, users, me, isAdmin, isManagerOrAdmin, comments, timeLogs, activityLog, onNewTask, onEditTask, onStatusChange, onEditProject, onManageTeam, onViewTask }) {
  const [subView, setSubView] = useState("board");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const members = users.filter(u => project.memberIds.includes(u.id));
  const done = tasks.filter(t => t.status === "done").length;
  const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const projectActivity = activityLog.filter(a => a.entityId === project.id || tasks.some(t => t.id === a.entityId));
  const totalLogged = (timeLogs || []).filter(l => tasks.some(t => t.id === l.taskId)).reduce((s, l) => s + l.hours, 0);
  const totalEstimated = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);

  const filteredTasks = filterAssignee === "all" ? tasks : tasks.filter(t => t.assigneeId === filterAssignee);

  return (
    <div style={{ padding: 28, flex: 1, display: "flex", flexDirection: "column", animation: "fadeIn .3s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <span style={{ width: 14, height: 14, borderRadius: "50%", background: project.color, display: "inline-block" }} />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.navy }}>{project.name}</h1>
            <Badge label={project.status || "active"} color={project.status === "active" ? C.success : C.muted} bg={project.status === "active" ? C.successLight : C.bg} />
          </div>
          <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>{project.description}</p>
          {project.tags?.length > 0 && <div style={{ display: "flex", gap: 6, marginTop: 8 }}>{project.tags.map(tag => <span key={tag} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: C.accentLight, color: C.accent, fontWeight: 600 }}>#{tag}</span>)}</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isManagerOrAdmin && <button style={btn("ghost", "sm")} onClick={onManageTeam}>👥 Team</button>}
          {isManagerOrAdmin && <button style={btn("ghost", "sm")} onClick={onEditProject}>✏ Edit</button>}
          {isManagerOrAdmin && <button style={btn("primary", "sm")} onClick={onNewTask}>+ Task</button>}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(5, 1fr)", gap: 12, marginBottom: 18, background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: C.muted }}>Progress</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: project.color }}>{pct}%</span>
          </div>
          <ProgressBar value={done} max={tasks.length} color={project.color} height={7} />
        </div>
        {Object.entries(STATUS).map(([k, v]) => (
          <div key={k} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: v.color }}>{tasks.filter(t => t.status === k).length}</div>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{v.label}</div>
          </div>
        ))}
      </div>

      {/* Sub-nav & member filter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["board", "list", "timeline", "activity"].map(v => (
            <Pill key={v} active={subView === v} onClick={() => setSubView(v)} color={project.color}>{v.charAt(0).toUpperCase() + v.slice(1)}</Pill>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: -4 }}>
            {members.slice(0, 6).map((u, i) => (
              <div key={u.id} onClick={() => setFilterAssignee(filterAssignee === u.id ? "all" : u.id)} style={{ marginLeft: i > 0 ? -8 : 0, cursor: "pointer", opacity: filterAssignee !== "all" && filterAssignee !== u.id ? 0.4 : 1, transition: "opacity .2s" }}>
                <Avatar name={u.name} color={u.color} size={28} online={u.online} />
              </div>
            ))}
          </div>
          <div>
            <span style={{ fontSize: 12, color: C.muted }}>⏱ {Math.round(totalLogged)}h / {totalEstimated}h estimated</span>
          </div>
        </div>
      </div>

      {subView === "board" && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Object.keys(STATUS).length}, minmax(180px, 1fr))`, gap: 12, flex: 1, overflow: "auto" }}>
          {Object.entries(STATUS).map(([status, info]) => {
            const col = filteredTasks.filter(t => t.status === status);
            return (
              <div key={status} style={{ background: info.bg + "60", borderRadius: 12, padding: "12px 10px", minHeight: 200, border: `1px solid ${info.color}20` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: info.color }}>{info.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 12, color: C.slate }}>{info.label}</span>
                  <span style={{ marginLeft: "auto", background: info.bg, color: info.color, border: `1px solid ${info.color}40`, fontSize: 11, fontWeight: 800, padding: "1px 7px", borderRadius: 99 }}>{col.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {col.map(t => {
                    const asgn = users.find(u => u.id === t.assigneeId);
                    const pr = PRIORITY[t.priority];
                    const ovd = isOverdue(t);
                    const subtasksDone = t.subtasks?.filter(s => s.done).length || 0;
                    const subtasksTotal = t.subtasks?.length || 0;
                    return (
                      <div key={t.id} onClick={() => onViewTask(t)} style={{ background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${ovd ? C.danger + "50" : C.border}`, borderRadius: 9, padding: "12px", cursor: "pointer", transition: "all .15s" }}
                        className="card-hover">
                        {ovd && <div style={{ fontSize: 10, color: C.danger, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>⚠ Overdue</div>}
                        {t.priority === "critical" && <div style={{ fontSize: 10, color: C.danger, fontWeight: 700, marginBottom: 4 }}>🔴 Critical</div>}
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 8, lineHeight: 1.4 }}>{t.title}</div>
                        {subtasksTotal > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <ProgressBar value={subtasksDone} max={subtasksTotal} color={project.color} height={3} />
                            <span style={{ fontSize: 10, color: C.muted }}>{subtasksDone}/{subtasksTotal} subtasks</span>
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Badge label={pr.label} color={pr.color} bg={pr.bg} size="xs" />
                          {asgn && <Avatar name={asgn.name} color={asgn.color} size={22} online={asgn.online} />}
                        </div>
                        {t.dueDate && <div style={{ fontSize: 11, color: ovd ? C.danger : C.muted, marginTop: 6, fontWeight: ovd ? 700 : 400 }}>Due {fmtDate(t.dueDate)}</div>}
                        {(t.loggedHours || 0) > 0 && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>⏱ {t.loggedHours}h logged</div>}
                      </div>
                    );
                  })}
                  {col.length === 0 && (
                    <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "16px 0", opacity: 0.6 }}>Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subView === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredTasks.sort((a, b) => (PRIORITY[a.priority]?.order || 99) - (PRIORITY[b.priority]?.order || 99)).map(t => {
            const asgn = users.find(u => u.id === t.assigneeId);
            const st = STATUS[t.status];
            const pr = PRIORITY[t.priority];
            const ovd = isOverdue(t);
            return (
              <div key={t.id} onClick={() => onViewTask(t)} style={{ background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${ovd ? C.danger + "44" : C.border}`, borderRadius: 10, padding: "13px 16px", display: "grid", gridTemplateColumns: "140px 1fr 100px 80px 32px", gap: 14, alignItems: "center", cursor: "pointer" }} className="row-hover">
                <select value={t.status} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); onStatusChange(t.id, e.target.value); }}
                  style={{ border: `1.5px solid ${st.color}44`, borderRadius: 7, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "4px 6px", cursor: "pointer", outline: "none" }}>
                  {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {t.dueDate && <span style={{ color: ovd ? C.danger : C.muted }}>Due {fmtDate(t.dueDate)}</span>}
                    {(t.loggedHours || 0) > 0 && <span style={{ marginLeft: 8 }}>⏱ {t.loggedHours}h</span>}
                  </div>
                </div>
                <Badge label={pr.label} color={pr.color} bg={pr.bg} size="xs" />
                {asgn ? <Avatar name={asgn.name} color={asgn.color} size={26} online={asgn.online} /> : <div />}
                <button onClick={e => { e.stopPropagation(); onEditTask(t); }} style={{ ...btn("ghost", "sm"), padding: "4px 8px", fontSize: 11 }}>Edit</button>
              </div>
            );
          })}
        </div>
      )}

      {subView === "timeline" && (
        <div style={{ background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "auto" }}>
          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.navy }}>Timeline / Gantt</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: C.muted }}>Tasks by due date — {project.deadline ? `Project deadline: ${fmtDate(project.deadline)}` : "No deadline set"}</p>
          </div>
          {filteredTasks.filter(t => t.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map(t => {
            const asgn = users.find(u => u.id === t.assigneeId);
            const st = STATUS[t.status];
            const daysLeft = Math.ceil((new Date(t.dueDate) - Date.now()) / 864e5);
            const ovd = isOverdue(t);
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 18px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: st.color, flexShrink: 0 }}>{st.icon}</div>
                <div style={{ width: 220, minWidth: 220 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{asgn?.name}</div>
                </div>
                <div style={{ flex: 1, height: 18, background: C.bg, borderRadius: 4, overflow: "hidden", position: "relative" }}>
                  <div style={{
                    position: "absolute", left: 0, top: 0, height: "100%",
                    width: t.status === "done" ? "100%" : `${Math.max(10, Math.min(90, 100 - daysLeft * 2))}%`,
                    background: ovd ? C.danger : project.color,
                    borderRadius: 4, opacity: 0.7
                  }} />
                </div>
                <div style={{ minWidth: 100, textAlign: "right", fontSize: 12, color: ovd ? C.danger : C.muted, fontWeight: ovd ? 700 : 400 }}>
                  {ovd ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subView === "activity" && (
        <div style={{ background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.navy }}>Project Activity</h3>
          </div>
          <div style={{ maxHeight: 480, overflow: "auto" }}>
            {projectActivity.length === 0 && <p style={{ padding: 24, color: C.muted, textAlign: "center" }}>No activity yet.</p>}
            {projectActivity.slice(0, 40).map(a => {
              const user = users.find(u => u.id === a.userId);
              const actionIcons = { status_change: "🔄", comment: "💬", task_created: "✅", task_updated: "✏", logged_time: "⏱", member_added: "👥", project_updated: "📝" };
              return (
                <div key={a.id} style={{ display: "flex", gap: 12, padding: "12px 18px", borderBottom: `1px solid ${C.border}`, alignItems: "flex-start" }}>
                  {user && <Avatar name={user.name} color={user.color} size={30} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: C.navy }}>
                      <strong>{user?.name}</strong> <span style={{ color: C.muted }}>{actionIcons[a.action] || "•"}</span> {a.detail}
                      {a.entityName && <> on <span style={{ color: C.accent, fontWeight: 600 }}>{a.entityName}</span></>}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{fmtAgo(a.timestamp)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ACTIVITY VIEW ────────────────────────────────────────────────────────────
function ActivityView({ db, users, me, isAdmin }) {
  const [userFilter, setUserFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const actTypes = ["status_change", "comment", "task_created", "task_updated", "logged_time", "member_added", "project_created", "login", "register"];
  const actIcons = { status_change: "🔄", comment: "💬", task_created: "✅", task_updated: "✏", logged_time: "⏱", member_added: "👥", project_created: "📁", login: "🔑", register: "🎉", task_deleted: "🗑", project_updated: "📝" };

  let logs = (db.activityLog || []);
  if (!isAdmin) logs = logs.filter(a => a.userId === me.id || db.projects.filter(p => p.memberIds.includes(me.id)).some(p => a.entityId === p.id || db.tasks.filter(t => t.projectId === p.id).some(t => t.id === a.entityId)));
  if (userFilter !== "all") logs = logs.filter(a => a.userId === userFilter);
  if (typeFilter !== "all") logs = logs.filter(a => a.action === typeFilter);

  return (
    <div style={{ padding: 32, animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: C.navy }}>Activity Feed</h1>
          <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>{logs.length} events · live tracking</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.success, animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 13, color: C.success, fontWeight: 700 }}>Live</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {isAdmin && (
          <select style={{ ...inp, maxWidth: 160 }} value={userFilter} onChange={e => setUserFilter(e.target.value)}>
            <option value="all">All Members</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
        <select style={{ ...inp, maxWidth: 180 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All Actions</option>
          {actTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div style={{ background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {logs.length === 0 && <p style={{ padding: 32, textAlign: "center", color: C.muted }}>No activity yet.</p>}
        {logs.slice(0, 100).map((a, i) => {
          const user = users.find(u => u.id === a.userId);
          return (
            <div key={a.id} style={{ display: "flex", gap: 14, padding: "14px 20px", borderBottom: i < logs.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "flex-start" }}>
              {user ? <Avatar name={user.name} color={user.color} size={36} online={user.online} /> : <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.bg }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: C.navy, lineHeight: 1.5 }}>
                  <strong style={{ color: user?.color }}>{user?.name || "Unknown"}</strong>
                  {" "}<span style={{ fontSize: 16 }}>{actIcons[a.action] || "•"}</span>{" "}
                  <span style={{ color: C.slate }}>{a.detail}</span>
                  {a.entityName && <><span style={{ color: C.muted }}> on </span><span style={{ color: C.accent, fontWeight: 600 }}>{a.entityName}</span></>}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4, display: "flex", gap: 14 }}>
                  <span>{fmtAgo(a.timestamp)}</span>
                  <span style={{ textTransform: "capitalize" }}>{a.entityType}</span>
                  {user?.dept && <span>{user.dept}</span>}
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.muted, whiteSpace: "nowrap" }}>{fmtDate(a.timestamp)} {fmtTime(a.timestamp)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── REPORTS VIEW ─────────────────────────────────────────────────────────────
function ReportsView({ db, me, isAdmin, projects, tasks, users }) {
  const totalHours = (db.timeLogs || []).reduce((s, l) => s + l.hours, 0);
  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const totalSpent = projects.reduce((s, p) => s + (p.spent || 0), 0);

  return (
    <div style={{ padding: 32, animation: "fadeIn .3s ease" }}>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: C.navy }}>Reports & Analytics</h1>
      <p style={{ margin: "0 0 28px", color: C.muted, fontSize: 14 }}>Team performance, budget, and project health</p>

      {/* Key metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total Hours Logged", value: `${Math.round(totalHours)}h`, color: C.accent, icon: "⏱" },
          { label: "Budget Used", value: `${Math.round(totalSpent / totalBudget * 100) || 0}%`, color: C.warning, icon: "💰" },
          { label: "Completion Rate", value: `${tasks.length ? Math.round(tasks.filter(t => t.status === "done").length / tasks.length * 100) : 0}%`, color: C.success, icon: "✅" },
          { label: "Active Members", value: users.filter(u => u.online).length, color: C.info, icon: "👥" },
        ].map(m => (
          <div key={m.label} style={{ background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${C.border}`, borderRadius: 13, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{m.label}</span>
              <span style={{ fontSize: 16 }}>{m.icon}</span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 22 }}>
        {/* Project health */}
        <div style={{ background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${C.border}`, borderRadius: 13, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.navy }}>Project Health</h3>
          </div>
          <div style={{ padding: "12px 18px" }}>
            {projects.map(p => {
              const pts = tasks.filter(t => t.projectId === p.id);
              const pdone = pts.filter(t => t.status === "done").length;
              const pct = pts.length ? Math.round(pdone / pts.length * 100) : 0;
              const overdue = pts.filter(t => isOverdue(t)).length;
              const blocked = pts.filter(t => t.status === "blocked").length;
              const budgetPct = p.budget ? Math.round(p.spent / p.budget * 100) : 0;
              return (
                <div key={p.id} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: C.navy }}>{p.name}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {overdue > 0 && <Badge label={`${overdue} overdue`} color={C.danger} bg={C.dangerLight} size="xs" />}
                      {blocked > 0 && <Badge label={`${blocked} blocked`} color={C.orange} bg={C.orangeLight} size="xs" />}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>Tasks: {pct}%</div>
                      <ProgressBar value={pdone} max={pts.length} color={p.color} height={5} />
                    </div>
                    {p.budget && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>Budget: {budgetPct}%</div>
                        <ProgressBar value={p.spent} max={p.budget} color={budgetPct > 80 ? C.danger : C.success} height={5} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Member performance */}
        <div style={{ background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${C.border}`, borderRadius: 13, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.navy }}>Member Performance</h3>
          </div>
          <div style={{ padding: "12px 18px" }}>
            {users.map(u => {
              const uTasks = tasks.filter(t => t.assigneeId === u.id);
              const uDone = uTasks.filter(t => t.status === "done").length;
              const uPct = uTasks.length ? Math.round(uDone / uTasks.length * 100) : 0;
              const uHours = (db.timeLogs || []).filter(l => l.userId === u.id).reduce((s, l) => s + l.hours, 0);
              const uOverdue = uTasks.filter(t => isOverdue(t)).length;
              return (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <Avatar name={u.name} color={u.color} size={34} online={u.online} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{u.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: u.color }}>{uPct}%</span>
                    </div>
                    <ProgressBar value={uDone} max={uTasks.length} color={u.color} height={4} />
                    <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11, color: C.muted }}>
                      <span>{uTasks.length} tasks</span>
                      <span>{uDone} done</span>
                      <span>⏱ {Math.round(uHours)}h</span>
                      {uOverdue > 0 && <span style={{ color: C.danger, fontWeight: 700 }}>{uOverdue} overdue</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Priority breakdown */}
      <div style={{ background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${C.border}`, borderRadius: 13, padding: "18px 22px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: C.navy }}>Tasks by Priority</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {Object.entries(PRIORITY).map(([key, pr]) => {
            const count = tasks.filter(t => t.priority === key).length;
            const done = tasks.filter(t => t.priority === key && t.status === "done").length;
            return (
              <div key={key} style={{ background: pr.bg, borderRadius: 10, padding: "14px 16px", border: `1px solid ${pr.color}20` }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: pr.color, marginBottom: 4 }}>{count}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: pr.color, marginBottom: 8 }}>{pr.label}</div>
                <div style={{ fontSize: 12, color: pr.color + "aa" }}>{done} completed · {count - done} open</div>
                <ProgressBar value={done} max={count} color={pr.color} height={4} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── TEAM VIEW ────────────────────────────────────────────────────────────────
function TeamView({ users, projects, tasks, onEdit, onNew }) {
  return (
    <div style={{ padding: 32, animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: C.navy }}>Team Members</h1>
          <p style={{ margin: 0, color: C.muted, fontSize: 14 }}>{users.length} members · {users.filter(u => u.online).length} online now</p>
        </div>
        <button style={btn("primary")} onClick={onNew}>+ Add Member</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {users.map(u => {
          const uTasks = tasks.filter(t => t.assigneeId === u.id);
          const done = uTasks.filter(t => t.status === "done").length;
          const pct = uTasks.length ? Math.round(done / uTasks.length * 100) : 0;
          const uProjects = projects.filter(p => p.memberIds.includes(u.id));
          const overdue = uTasks.filter(t => isOverdue(t)).length;
          const lastActive = u.lastActive ? fmtAgo(u.lastActive) : "Never";
          return (
            <div key={u.id} className="card-hover" style={{ background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, cursor: "pointer", transition: "all .2s" }} onClick={() => onEdit(u)}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={u.name} color={u.color} size={44} online={u.online} />
                  <div>
                    <div style={{ fontWeight: 800, color: C.navy, fontSize: 15 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{u.dept || "—"}</div>
                  </div>
                </div>
                <Badge label={u.role} color={u.role === "admin" ? C.accentDark : u.role === "manager" ? C.teal : C.muted} bg={u.role === "admin" ? C.accentLight : u.role === "manager" ? C.tealLight : C.bg} />
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: u.online ? C.success : C.muted, display: "inline-block" }} />
                {u.online ? "Online now" : `Last active ${lastActive}`}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[["Tasks", uTasks.length, C.navy], ["Done", done, C.success], ["Overdue", overdue, overdue > 0 ? C.danger : C.muted]].map(([l, v, c]) => (
                  <div key={l} style={{ background: C.bg, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: C.muted }}>Completion</span><span style={{ fontWeight: 800, color: u.color }}>{pct}%</span>
                </div>
                <ProgressBar value={done} max={uTasks.length} color={u.color} height={5} />
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>Projects: <span style={{ color: C.navy, fontWeight: 600 }}>{uProjects.map(p => p.name).join(", ") || "None"}</span></div>
              {u.bio && <div style={{ fontSize: 12, color: C.muted, marginTop: 8, fontStyle: "italic" }}>"{u.bio}"</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SETTINGS VIEW ────────────────────────────────────────────────────────────
function SettingsView({ db, me, setDb, toast }) {
  const handleReset = () => {
    if (window.confirm("Reset all data to defaults? This cannot be undone.")) {
      setDb(INIT);
      toast("Data reset to defaults", "warning");
    }
  };
  const handleExport = () => {
    const data = JSON.stringify(db, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "projectflow-export.json"; a.click();
    toast("Data exported!");
  };
  return (
    <div style={{ padding: 32, maxWidth: 640, animation: "fadeIn .3s ease" }}>
      <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: C.navy }}>Settings</h1>
      <p style={{ margin: "0 0 28px", color: C.muted, fontSize: 14 }}>System configuration and data management</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          { label: "Total Users", value: db.users.length },
          { label: "Total Projects", value: db.projects.length },
          { label: "Total Tasks", value: db.tasks.length },
          { label: "Comments", value: db.comments?.length || 0 },
          { label: "Activity Logs", value: db.activityLog?.length || 0 },
          { label: "Time Logs", value: db.timeLogs?.length || 0 },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: C.white, backdropFilter: "blur(16px)", border: `1px solid ${C.border}`, borderRadius: 10 }}>
            <span style={{ fontSize: 14, color: C.slate }}>{s.label}</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.navy }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        <button style={btn("ghost")} onClick={handleExport}>📤 Export Data</button>
        <button style={btn("danger", "sm")} onClick={handleReset}>🔄 Reset to Defaults</button>
      </div>
    </div>
  );
}

// ─── TASK DETAIL MODAL ────────────────────────────────────────────────────────
function TaskDetailModal({ task, projects, users, me, isAdmin, isManagerOrAdmin, comments, timeLogs, onEdit, onComment, onLogTime, onToggleSubtask, onStatusChange, onClose }) {
  const [comment, setComment] = useState("");
  const [hours, setHours] = useState("");
  const [timeNote, setTimeNote] = useState("");
  const [tab, setTab] = useState("details");

  const proj = projects.find(p => p.id === task.projectId);
  const assignee = users.find(u => u.id === task.assigneeId);
  const reporter = users.find(u => u.id === task.reporterId);
  const st = STATUS[task.status];
  const pr = PRIORITY[task.priority];
  const ovd = isOverdue(task);
  const subtasksDone = task.subtasks?.filter(s => s.done).length || 0;

  const handleComment = () => {
    if (!comment.trim()) return;
    onComment(task.id, comment.trim());
    setComment("");
  };
  const handleLogTime = () => {
    const h = parseFloat(hours);
    if (!h || h <= 0) return;
    onLogTime(task.id, h, timeNote);
    setHours(""); setTimeNote("");
  };

  return (
    <Modal title={task.title} subtitle={proj?.name} onClose={onClose} width={680}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <select value={task.status} onChange={e => onStatusChange(task.id, e.target.value)}
          style={{ border: `1.5px solid ${st.color}44`, borderRadius: 7, background: st.bg, color: st.color, fontSize: 12, fontWeight: 700, padding: "6px 10px", cursor: "pointer", outline: "none" }}>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <Badge label={pr.label} color={pr.color} bg={pr.bg} dot />
        {ovd && <Badge label="Overdue" color={C.danger} bg={C.dangerLight} />}
        <button style={{ ...btn("ghost", "sm"), marginLeft: "auto" }} onClick={onEdit}>✏ Edit Task</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
        {["details", "comments", "time", "subtasks"].map(t => (
          <Pill key={t} active={tab === t} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}{t === "comments" ? ` (${comments.length})` : t === "subtasks" && task.subtasks?.length ? ` (${subtasksDone}/${task.subtasks.length})` : t === "time" ? ` (${Math.round(task.loggedHours || 0)}h)` : ""}</Pill>
        ))}
      </div>

      {tab === "details" && (
        <div>
          {task.description && <p style={{ margin: "0 0 18px", fontSize: 14, color: C.slate, lineHeight: 1.7 }}>{task.description}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              ["Assignee", assignee ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar name={assignee.name} color={assignee.color} size={22} /><span style={{ fontSize: 13 }}>{assignee.name}</span></div> : "Unassigned"],
              ["Reporter", reporter ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar name={reporter.name} color={reporter.color} size={22} /><span style={{ fontSize: 13 }}>{reporter.name}</span></div> : "Unknown"],
              ["Due Date", <span style={{ color: ovd ? C.danger : C.slate, fontWeight: ovd ? 700 : 400 }}>{fmtDate(task.dueDate)}</span>],
              ["Created", fmtDate(task.createdAt)],
              ["Estimated", task.estimatedHours ? `${task.estimatedHours}h` : "Not set"],
              ["Logged", `${Math.round(task.loggedHours || 0)}h`],
              ...(task.completedAt ? [["Completed", fmtDate(task.completedAt)]] : []),
            ].map(([l, v]) => (
              <div key={l} style={{ padding: "10px 14px", background: C.bg, borderRadius: 9 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 }}>{l}</div>
                <div style={{ fontSize: 13, color: C.navy }}>{v}</div>
              </div>
            ))}
          </div>
          {task.tags?.length > 0 && (
            <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {task.tags.map(tag => <span key={tag} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 99, background: C.accentLight, color: C.accent, fontWeight: 600 }}>#{tag}</span>)}
            </div>
          )}
        </div>
      )}

      {tab === "subtasks" && (
        <div>
          {task.subtasks?.length === 0 && <p style={{ color: C.muted, fontSize: 14 }}>No subtasks yet.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {task.subtasks?.map(s => (
              <div key={s.id} onClick={() => onToggleSubtask(task.id, s.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: s.done ? C.successLight : C.bg, borderRadius: 9, cursor: "pointer", border: `1px solid ${s.done ? C.success + "30" : C.border}`, transition: "all .15s" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${s.done ? C.success : C.border}`, background: s.done ? C.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.done && <span style={{ color: C.white, fontSize: 12, fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontSize: 14, color: s.done ? C.muted : C.navy, textDecoration: s.done ? "line-through" : "none" }}>{s.title}</span>
              </div>
            ))}
          </div>
          {task.subtasks?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: C.muted }}>Progress</span>
                <span style={{ fontWeight: 700, color: C.success }}>{subtasksDone}/{task.subtasks.length}</span>
              </div>
              <ProgressBar value={subtasksDone} max={task.subtasks.length} color={C.success} height={8} />
            </div>
          )}
        </div>
      )}

      {tab === "comments" && (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18, maxHeight: 300, overflow: "auto" }}>
            {comments.length === 0 && <p style={{ color: C.muted, fontSize: 14 }}>No comments yet. Be the first!</p>}
            {comments.map(c => {
              const u = users.find(x => x.id === c.userId);
              return (
                <div key={c.id} style={{ display: "flex", gap: 10 }}>
                  {u && <Avatar name={u.name} color={u.color} size={32} />}
                  <div style={{ flex: 1, background: C.bg, borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: u?.color || C.navy }}>{u?.name}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>{fmtAgo(c.createdAt)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: C.slate, lineHeight: 1.6 }}>{c.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Avatar name={me.name} color={me.color} size={32} />
            <div style={{ flex: 1 }}>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 72 }} value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a comment..." onKeyDown={e => e.key === "Enter" && e.metaKey && handleComment()} />
              <button style={{ ...btn("primary", "sm"), marginTop: 8 }} onClick={handleComment}>Post Comment</button>
            </div>
          </div>
        </div>
      )}

      {tab === "time" && (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18, maxHeight: 200, overflow: "auto" }}>
            {timeLogs.length === 0 && <p style={{ color: C.muted, fontSize: 14 }}>No time logged yet.</p>}
            {timeLogs.map(l => {
              const u = users.find(x => x.id === l.userId);
              return (
                <div key={l.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", background: C.bg, borderRadius: 9 }}>
                  {u && <Avatar name={u.name} color={u.color} size={28} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{u?.name}</div>
                    {l.note && <div style={{ fontSize: 12, color: C.muted }}>{l.note}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.accent }}>{l.hours}h</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{fmtDate(l.date)}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10 }}>
            <Field label="Hours"><input style={inp} type="number" min="0.5" step="0.5" value={hours} onChange={e => setHours(e.target.value)} placeholder="2.5" /></Field>
            <Field label="Note (optional)"><input style={inp} value={timeNote} onChange={e => setTimeNote(e.target.value)} placeholder="What did you work on?" /></Field>
          </div>
          <button style={btn("primary", "sm")} onClick={handleLogTime}>Log Time</button>
          <div style={{ marginTop: 14, padding: "12px 16px", background: C.accentLight, borderRadius: 9, display: "flex", gap: 16 }}>
            <div><div style={{ fontSize: 11, color: C.muted }}>Logged</div><div style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>{Math.round(task.loggedHours || 0)}h</div></div>
            <div><div style={{ fontSize: 11, color: C.muted }}>Estimated</div><div style={{ fontSize: 18, fontWeight: 800, color: C.navy }}>{task.estimatedHours || "—"}h</div></div>
            {task.estimatedHours > 0 && <div><div style={{ fontSize: 11, color: C.muted }}>Remaining</div><div style={{ fontSize: 18, fontWeight: 800, color: (task.loggedHours || 0) > task.estimatedHours ? C.danger : C.success }}>{Math.max(0, task.estimatedHours - (task.loggedHours || 0))}h</div></div>}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── PROJECT MODAL ────────────────────────────────────────────────────────────
function ProjectModal({ data, users, me, isManagerOrAdmin, onSave, onDelete, onClose }) {
  const PCOLORS = [C.accent, C.teal, C.purple, C.pink, C.orange, C.info, C.success, C.warning, C.danger];
  const [form, setForm] = useState({ name: "", description: "", color: C.accent, tags: "", deadline: "", budget: "", status: "active", memberIds: [], ...data, tags: data?.tags?.join(", ") || "" });

  return (
    <Modal title={data?.id ? "Edit Project" : "New Project"} onClose={onClose}>
      <Field label="Project Name"><input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter project name" /></Field>
      <Field label="Description"><textarea style={{ ...inp, resize: "vertical", minHeight: 72 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Status">
          <select style={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="active">Active</option><option value="planning">Planning</option><option value="on_hold">On Hold</option><option value="completed">Completed</option>
          </select>
        </Field>
        <Field label="Deadline"><input type="date" style={inp} value={form.deadline ? form.deadline.split("T")[0] : ""} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} /></Field>
        <Field label="Budget ($)"><input type="number" style={inp} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="50000" /></Field>
        <Field label="Tags (comma-separated)"><input style={inp} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="design, frontend" /></Field>
      </div>
      <Field label="Color">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PCOLORS.map(c => <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: form.color === c ? `3px solid ${C.navy}` : "3px solid transparent", cursor: "pointer", transition: "border .15s" }} />)}
        </div>
      </Field>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button style={btn("primary")} onClick={() => form.name && onSave({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), budget: parseFloat(form.budget) || 0 })}>Save Project</button>
        <button style={btn("ghost")} onClick={onClose}>Cancel</button>
        {data?.id && onDelete && <button style={{ ...btn("danger"), marginLeft: "auto" }} onClick={() => onDelete(data.id)}>Delete</button>}
      </div>
    </Modal>
  );
}

// ─── TASK MODAL ───────────────────────────────────────────────────────────────
function TaskModal({ data, projects, users, me, isAdmin, isManagerOrAdmin, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    projectId: projects[0]?.id, status: "todo", priority: "medium", assigneeId: me.id,
    title: "", description: "", dueDate: "", estimatedHours: "", tags: "", subtasks: [],
    ...data, tags: data?.tags?.join(", ") || ""
  });
  const [newSubtask, setNewSubtask] = useState("");
  const projUsers = users.filter(u => { const proj = projects.find(p => p.id === form.projectId); return proj?.memberIds.includes(u.id); });

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setForm(f => ({ ...f, subtasks: [...(f.subtasks || []), { id: uid(), title: newSubtask.trim(), done: false }] }));
    setNewSubtask("");
  };
  const removeSubtask = (id) => setForm(f => ({ ...f, subtasks: f.subtasks.filter(s => s.id !== id) }));

  return (
    <Modal title={data?.id ? "Edit Task" : "New Task"} onClose={onClose} width={620}>
      <Field label="Task Title"><input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" /></Field>
      <Field label="Description"><textarea style={{ ...inp, resize: "vertical", minHeight: 72 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Add details, context, or acceptance criteria..." /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Project">
          <select style={inp} value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select style={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select style={inp} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
            {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="Assignee">
          <select style={inp} value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
            {(projUsers.length ? projUsers : users).map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </Field>
        <Field label="Due Date"><input type="date" style={inp} value={form.dueDate ? form.dueDate.split("T")[0] : ""} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></Field>
        <Field label="Estimated Hours"><input type="number" style={inp} value={form.estimatedHours} onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value }))} placeholder="8" min="0" step="0.5" /></Field>
      </div>
      <Field label="Tags (comma-separated)"><input style={inp} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="frontend, bug, design" /></Field>

      {/* Subtasks */}
      <Field label="Subtasks">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          {form.subtasks?.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: C.bg, borderRadius: 7 }}>
              <span style={{ fontSize: 13, flex: 1, color: C.navy }}>{s.title}</span>
              <button onClick={() => removeSubtask(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, fontSize: 14 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...inp, flex: 1 }} value={newSubtask} onChange={e => setNewSubtask(e.target.value)} placeholder="Add subtask..." onKeyDown={e => e.key === "Enter" && addSubtask()} />
          <button style={btn("ghost", "sm")} onClick={addSubtask}>Add</button>
        </div>
      </Field>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button style={btn("primary")} onClick={() => form.title && onSave({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), estimatedHours: parseFloat(form.estimatedHours) || 0 })}>Save Task</button>
        <button style={btn("ghost")} onClick={onClose}>Cancel</button>
        {data?.id && onDelete && <button style={{ ...btn("danger"), marginLeft: "auto" }} onClick={() => onDelete(data.id)}>Delete</button>}
      </div>
    </Modal>
  );
}

// ─── USER MODAL ───────────────────────────────────────────────────────────────
function UserModal({ data, isAdmin, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member", dept: "Engineering", bio: "", ...data });
  return (
    <Modal title={data?.id ? "Edit User" : "Add User"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Full Name"><input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" /></Field>
        <Field label="Email"><input type="email" style={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@company.com" /></Field>
        {!data?.id && <Field label="Password"><input type="password" style={inp} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" /></Field>}
        <Field label="Role">
          <select style={inp} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Department">
          <select style={inp} value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}>
            {["Engineering","Design","Product","Marketing","Sales","Operations","HR","Finance"].map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Bio / Note"><textarea style={{ ...inp, resize: "vertical", minHeight: 60 }} value={form.bio || ""} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Brief bio or role description" /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={btn("primary")} onClick={() => form.name && form.email && onSave(form)}>Save</button>
        <button style={btn("ghost")} onClick={onClose}>Cancel</button>
        {data?.id && onDelete && <button style={{ ...btn("danger"), marginLeft: "auto" }} onClick={() => onDelete(data.id)}>Remove User</button>}
      </div>
    </Modal>
  );
}

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────
function ProfileModal({ data, isMe, onSave, onClose, tasks, projects }) {
  const [form, setForm] = useState({ ...data });
  const uTasks = tasks.filter(t => t.assigneeId === data.id);
  const done = uTasks.filter(t => t.status === "done").length;
  const uProjects = projects.filter(p => p.memberIds.includes(data.id));
  return (
    <Modal title={isMe ? "My Profile" : data.name} onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22, padding: "16px 18px", background: C.bg, borderRadius: 12 }}>
        <Avatar name={data.name} color={data.color} size={56} online={data.online} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.navy }}>{data.name}</div>
          <div style={{ fontSize: 13, color: C.muted }}>{data.email} · {data.dept}</div>
          <Badge label={data.role} color={data.role === "admin" ? C.accentDark : C.teal} bg={data.role === "admin" ? C.accentLight : C.tealLight} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        {[["Tasks", uTasks.length, C.accent], ["Completed", done, C.success], ["Projects", uProjects.length, C.purple]].map(([l, v, c]) => (
          <div key={l} style={{ textAlign: "center", padding: 14, background: C.bg, borderRadius: 10 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{l}</div>
          </div>
        ))}
      </div>
      {isMe && (
        <>
          <Field label="Bio"><textarea style={{ ...inp, resize: "vertical", minHeight: 60 }} value={form.bio || ""} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell your team about yourself..." /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={btn("primary")} onClick={() => onSave(form)}>Save Profile</button>
            <button style={btn("ghost")} onClick={onClose}>Close</button>
          </div>
        </>
      )}
      {!isMe && <button style={btn("ghost")} onClick={onClose}>Close</button>}
    </Modal>
  );
}

// ─── TEAM MANAGE MODAL ────────────────────────────────────────────────────────
function TeamManageModal({ project, users, onAdd, onRemove, onClose }) {
  const members = users.filter(u => project.memberIds.includes(u.id));
  const nonMembers = users.filter(u => !project.memberIds.includes(u.id));
  return (
    <Modal title={`Manage Team · ${project.name}`} onClose={onClose}>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Current Members ({members.length})</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map(u => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.bg, borderRadius: 9 }}>
              <Avatar name={u.name} color={u.color} size={32} online={u.online} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{u.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{u.dept} · {u.role}</div>
              </div>
              <Badge label={u.role} color={u.role === "admin" ? C.accentDark : C.teal} bg={u.role === "admin" ? C.accentLight : C.tealLight} />
              {project.ownerId !== u.id && (
                <button onClick={() => onRemove(project.id, u.id)} style={{ background: C.dangerLight, color: C.danger, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Remove</button>
              )}
            </div>
          ))}
        </div>
      </div>
      {nonMembers.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Add Members</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {nonMembers.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.bg, borderRadius: 9 }}>
                <Avatar name={u.name} color={u.color} size={32} online={u.online} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{u.dept} · {u.email}</div>
                </div>
                <button onClick={() => onAdd(project.id, u.id)} style={{ background: C.accentLight, color: C.accent, border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>+ Add</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <button style={{ ...btn("ghost"), marginTop: 16 }} onClick={onClose}>Done</button>
    </Modal>
  );
}
