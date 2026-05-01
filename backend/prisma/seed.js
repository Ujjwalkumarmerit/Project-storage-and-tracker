const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const C = {
  navy: "#0A0F1E", navyMid: "#111827", navyLight: "#1F2937",
  slate: "#374151", muted: "#6B7280", border: "#E5E7EB",
  bg: "#F9FAFB", white: "#FFFFFF",
  accent: "#4F46E5", accentLight: "#EEF2FF", accentDark: "#3730A3",
  success: "#059669", successLight: "#D1FAE5",
  warning: "#D97706", warningLight: "#FEF3C7",
  danger: "#DC2626", dangerLight: "#FEE2E2",
  info: "#2563EB", infoLight: "#DBEAFE",
  purple: "#7C3AED", purpleLight: "#EDE9FE",
  teal: "#0D9488", tealLight: "#CCFBF1",
  pink: "#DB2777", pinkLight: "#FCE7F3",
  orange: "#EA580C", orangeLight: "#FFEDD5",
};

async function main() {
  const now = Date.now();
  
  console.log("Cleaning existing database...");
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.timeLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding Users...");
  const users = [
    { id: "u1", name: "Alex Morgan", email: "admin@projectflow.io", password: "admin123", role: "admin", dept: "Engineering", color: C.accent, joinedAt: new Date(now - 90*864e5), lastActive: new Date(), online: true, bio: "Founder & CTO. Building the future of project management." },
    { id: "u2", name: "Jamie Lee", email: "jamie@projectflow.io", password: "jamie123", role: "manager", dept: "Design", color: C.teal, joinedAt: new Date(now - 60*864e5), lastActive: new Date(now - 2*3600e3), online: false, bio: "Lead Designer. Pixel-perfect is the only way." },
    { id: "u3", name: "Sam Rivera", email: "sam@projectflow.io", password: "sam123", role: "member", dept: "Engineering", color: C.purple, joinedAt: new Date(now - 45*864e5), lastActive: new Date(now - 15*60e3), online: true, bio: "Full-stack dev. Coffee-driven development." },
    { id: "u4", name: "Jordan Kim", email: "jordan@projectflow.io", password: "jordan123", role: "member", dept: "Marketing", color: C.pink, joinedAt: new Date(now - 30*864e5), lastActive: new Date(now - 1*3600e3), online: false, bio: "Growth & Marketing. Data-driven storyteller." },
    { id: "u5", name: "Taylor Chen", email: "taylor@projectflow.io", password: "taylor123", role: "manager", dept: "Product", color: C.orange, joinedAt: new Date(now - 20*864e5), lastActive: new Date(now - 30*60e3), online: true, bio: "Product Manager. Connecting dots and shipping features." },
  ];
  
  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    await prisma.user.create({ data: { ...u, password: hashedPassword } });
  }

  console.log("Seeding Projects...");
  const projects = [
    { id: "p1", name: "Website Redesign", description: "Complete overhaul of company website with modern design system and improved UX", color: C.accent, ownerId: "u1", memberIds: ["u1","u2","u3","u4"], createdAt: new Date(now - 30*864e5), deadline: new Date(now + 30*864e5), status: "active", tags: ["design","frontend"], budget: 50000, spent: 18500 },
    { id: "p2", name: "Mobile App v2", description: "Next-generation mobile application with AI features and offline support", color: C.teal, ownerId: "u1", memberIds: ["u1","u3","u5"], createdAt: new Date(now - 20*864e5), deadline: new Date(now + 60*864e5), status: "active", tags: ["mobile","ai"], budget: 120000, spent: 34200 },
    { id: "p3", name: "Q4 Marketing Campaign", description: "End-of-year marketing push across all digital channels", color: C.pink, ownerId: "u5", memberIds: ["u4","u5","u2"], createdAt: new Date(now - 10*864e5), deadline: new Date(now + 45*864e5), status: "active", tags: ["marketing","campaign"], budget: 30000, spent: 8900 },
    { id: "p4", name: "Infrastructure Upgrade", description: "Cloud migration and infrastructure modernization", color: C.orange, ownerId: "u1", memberIds: ["u1","u3"], createdAt: new Date(now - 5*864e5), deadline: new Date(now + 90*864e5), status: "planning", tags: ["devops","cloud"], budget: 80000, spent: 2000 },
    { id: "p5", name: "Interactive Demo Project", description: "This is a playground project. Try changing task statuses, adding comments, and exploring the dashboard!", color: C.info, ownerId: "u1", memberIds: ["u1","u2","u3"], createdAt: new Date(now - 2*864e5), deadline: new Date(now + 10*864e5), status: "active", tags: ["demo","onboarding"], budget: 5000, spent: 0 },
  ];

  for (const p of projects) {
    const { memberIds, ...pData } = p;
    await prisma.project.create({ data: pData });
    for (const mId of memberIds) {
      await prisma.projectMember.create({ data: { projectId: p.id, userId: mId } });
    }
  }

  console.log("Seeding Tasks...");
  const tasks = [
    { id: "t1", projectId: "p1", title: "Design new homepage mockups", description: "Create high-fidelity Figma mockups for homepage, about, and services pages", status: "done", priority: "high", assigneeId: "u2", reporterId: "u1", createdAt: new Date(now - 25*864e5), dueDate: new Date(now - 5*864e5), completedAt: new Date(now - 6*864e5), estimatedHours: 16, loggedHours: 18, tags: ["design","figma"], subtasks: [{id:"s1",title:"Desktop wireframes",done:true},{id:"s2",title:"Mobile wireframes",done:true},{id:"s3",title:"Dark mode variants",done:false}] },
    { id: "t2", projectId: "p1", title: "Set up component library", description: "Bootstrap Storybook with design tokens and core components", status: "in_progress", priority: "critical", assigneeId: "u3", reporterId: "u1", createdAt: new Date(now - 20*864e5), dueDate: new Date(now + 3*864e5), estimatedHours: 24, loggedHours: 14, tags: ["frontend","storybook"], subtasks: [{id:"s4",title:"Design tokens setup",done:true},{id:"s5",title:"Button components",done:true},{id:"s6",title:"Form components",done:false},{id:"s7",title:"Navigation components",done:false}] },
    { id: "t3", projectId: "p1", title: "Write copy for about page", description: "Draft compelling about page content highlighting company values and team", status: "todo", priority: "medium", assigneeId: "u4", reporterId: "u2", createdAt: new Date(now - 15*864e5), dueDate: new Date(now + 7*864e5), estimatedHours: 8, loggedHours: 0, tags: ["content"], subtasks: [] },
    { id: "t4", projectId: "p1", title: "SEO technical audit", description: "Audit current site SEO, create improvement roadmap", status: "review", priority: "medium", assigneeId: "u1", reporterId: "u5", createdAt: new Date(now - 10*864e5), dueDate: new Date(now - 1*864e5), estimatedHours: 12, loggedHours: 11, tags: ["seo"], subtasks: [] },
    { id: "t5", projectId: "p1", title: "Accessibility compliance audit", description: "WCAG 2.1 AA compliance check across all pages", status: "backlog", priority: "low", assigneeId: "u3", reporterId: "u1", createdAt: new Date(now - 8*864e5), dueDate: new Date(now + 14*864e5), estimatedHours: 10, loggedHours: 0, tags: ["a11y"], subtasks: [] },
    { id: "t6", projectId: "p2", title: "API integration planning", description: "Document all required API endpoints and data models", status: "done", priority: "high", assigneeId: "u3", reporterId: "u1", createdAt: new Date(now - 18*864e5), dueDate: new Date(now - 8*864e5), completedAt: new Date(now - 9*864e5), estimatedHours: 20, loggedHours: 22, tags: ["api","backend"], subtasks: [] },
    { id: "t7", projectId: "p2", title: "Authentication screens", description: "Build login, signup, password reset, and 2FA screens", status: "in_progress", priority: "critical", assigneeId: "u3", reporterId: "u1", createdAt: new Date(now - 12*864e5), dueDate: new Date(now + 2*864e5), estimatedHours: 32, loggedHours: 20, tags: ["mobile","auth"], subtasks: [{id:"s8",title:"Login screen",done:true},{id:"s9",title:"Signup flow",done:true},{id:"s10",title:"2FA integration",done:false}] },
    { id: "t8", projectId: "p2", title: "Push notification setup", description: "Integrate Firebase Cloud Messaging for push notifications", status: "blocked", priority: "high", assigneeId: "u1", reporterId: "u3", createdAt: new Date(now - 7*864e5), dueDate: new Date(now + 4*864e5), estimatedHours: 16, loggedHours: 4, tags: ["mobile","firebase"], subtasks: [] },
    { id: "t9", projectId: "p3", title: "Campaign strategy deck", description: "Create full Q4 marketing strategy presentation for leadership", status: "in_progress", priority: "high", assigneeId: "u4", reporterId: "u5", createdAt: new Date(now - 8*864e5), dueDate: new Date(now + 2*864e5), estimatedHours: 12, loggedHours: 7, tags: ["strategy"], subtasks: [] },
    { id: "t10", projectId: "p3", title: "Social media content calendar", description: "Plan 6-week social content for Instagram, LinkedIn, Twitter", status: "todo", priority: "medium", assigneeId: "u4", reporterId: "u5", createdAt: new Date(now - 5*864e5), dueDate: new Date(now + 10*864e5), estimatedHours: 20, loggedHours: 0, tags: ["social","content"], subtasks: [] },
    { id: "t11", projectId: "p5", title: "Try changing my status!", description: "Click on this task in the Kanban board and move it to 'In Progress'.", status: "todo", priority: "critical", assigneeId: "u1", reporterId: "u1", createdAt: new Date(now - 1*864e5), dueDate: new Date(now + 5*864e5), estimatedHours: 2, loggedHours: 0, tags: ["demo"], subtasks: [] },
    { id: "t12", projectId: "p5", title: "Leave a comment", description: "Open this task and type a comment in the Activity feed.", status: "in_progress", priority: "medium", assigneeId: "u1", reporterId: "u1", createdAt: new Date(now - 1*864e5), dueDate: new Date(now + 5*864e5), estimatedHours: 1, loggedHours: 0, tags: ["demo"], subtasks: [] },
    { id: "t13", projectId: "p5", title: "Log some time", description: "Open this task and log 5 hours of work.", status: "todo", priority: "low", assigneeId: "u1", reporterId: "u1", createdAt: new Date(now - 1*864e5), dueDate: new Date(now + 5*864e5), estimatedHours: 10, loggedHours: 0, tags: ["demo"], subtasks: [] },
  ];

  for (const t of tasks) {
    const { subtasks, ...tData } = t;
    const task = await prisma.task.create({ data: tData });
    for (const s of subtasks) {
      await prisma.subtask.create({ data: { ...s, taskId: task.id } });
    }
  }

  console.log("Seeding Comments & Logs...");
  const comments = [
    { id: "c1", taskId: "t2", userId: "u3", text: "Completed design tokens. Moving to button components now.", createdAt: new Date(now - 3*864e5), type: "comment" },
    { id: "c2", taskId: "t2", userId: "u2", text: "Looks great! Make sure we follow the Figma variables for colors.", createdAt: new Date(now - 2*864e5), type: "comment" },
    { id: "c3", taskId: "t7", userId: "u1", text: "Great progress on auth! The 2FA needs to support both TOTP and SMS.", createdAt: new Date(now - 1*864e5), type: "comment" },
    { id: "c4", taskId: "t8", userId: "u3", text: "Blocked on Firebase credentials. Need admin access to the Firebase console.", createdAt: new Date(now - 4*864e5), type: "comment" },
    { id: "c5", taskId: "t4", userId: "u1", text: "Submitted for review. See Notion doc for full audit results.", createdAt: new Date(now - 2*864e5), type: "comment" },
  ];
  for (const c of comments) await prisma.comment.create({ data: c });

  const activityLog = [
    { id: "a1", userId: "u3", action: "status_change", entityType: "task", entityId: "t2", entityName: "Set up component library", detail: "todo → in_progress", timestamp: new Date(now - 3*864e5) },
    { id: "a2", userId: "u2", action: "comment", entityType: "task", entityId: "t2", entityName: "Set up component library", detail: "Left a comment", timestamp: new Date(now - 2*864e5 - 3600e3) },
    { id: "a3", userId: "u1", action: "task_created", entityType: "task", entityId: "t5", entityName: "Accessibility compliance audit", detail: "New task created", timestamp: new Date(now - 8*864e5) },
    { id: "a4", userId: "u3", action: "status_change", entityType: "task", entityId: "t6", entityName: "API integration planning", detail: "in_progress → done", timestamp: new Date(now - 9*864e5) },
    { id: "a5", userId: "u4", action: "logged_time", entityType: "task", entityId: "t9", entityName: "Campaign strategy deck", detail: "Logged 3.5 hours", timestamp: new Date(now - 1*864e5) },
    { id: "a6", userId: "u1", action: "member_added", entityType: "project", entityId: "p3", entityName: "Q4 Marketing Campaign", detail: "Added Jordan Kim", timestamp: new Date(now - 10*864e5) },
  ];
  for (const a of activityLog) await prisma.activityLog.create({ data: a });

  const notifications = [
    { id: "n1", userId: "u1", type: "overdue", message: "Task 'SEO technical audit' is overdue", entityId: "t4", read: false, createdAt: new Date(now - 86400e3) },
    { id: "n2", userId: "u3", type: "mention", message: "Alex Morgan mentioned you in 'Authentication screens'", entityId: "t7", read: false, createdAt: new Date(now - 3600e3) },
    { id: "n3", userId: "u3", type: "blocked", message: "Task 'Push notification setup' is blocked", entityId: "t8", read: false, createdAt: new Date(now - 2*3600e3) },
    { id: "n4", userId: "u2", type: "comment", message: "Sam Rivera replied to your comment", entityId: "t2", read: true, createdAt: new Date(now - 4*3600e3) },
  ];
  for (const n of notifications) await prisma.notification.create({ data: n });

  const timeLogs = [
    { id: "tl1", taskId: "t1", userId: "u2", hours: 8, note: "Initial wireframes", date: new Date(now - 20*864e5) },
    { id: "tl2", taskId: "t1", userId: "u2", hours: 10, note: "High-fidelity mockups", date: new Date(now - 15*864e5) },
    { id: "tl3", taskId: "t2", userId: "u3", hours: 8, note: "Design tokens and color system", date: new Date(now - 5*864e5) },
    { id: "tl4", taskId: "t2", userId: "u3", hours: 6, note: "Button and input components", date: new Date(now - 3*864e5) },
    { id: "tl5", taskId: "t7", userId: "u3", hours: 12, note: "Login and signup screens", date: new Date(now - 8*864e5) },
    { id: "tl6", taskId: "t7", userId: "u3", hours: 8, note: "Password reset flow", date: new Date(now - 4*864e5) },
    { id: "tl7", taskId: "t9", userId: "u4", hours: 7, note: "Research and competitor analysis", date: new Date(now - 2*864e5) },
  ];
  for (const tl of timeLogs) await prisma.timeLog.create({ data: tl });

  console.log("Database seeded successfully!");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
