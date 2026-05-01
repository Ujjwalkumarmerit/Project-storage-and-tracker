const fs = require('fs');

let content = fs.readFileSync('frontend/src/App.jsx', 'utf-8');

// 1. Update the C object
content = content.replace(/const C = \{[\s\S]*?\};/, `const C = {
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
};`);

// 2. Global background and body styles
content = content.replace(
  /<style>\{`@import url\('https:\/\/fonts.googleapis.com\/css2\?family=DM\+Sans:wght@400;500;600;700;800&display=swap'\);\*\{box-sizing:border-box\}@keyframes fadeIn\{from\{opacity:0;transform:translateY\(10px\)\}to\{opacity:1;transform:translateY\(0\)\}\}`\}<\/style>/g,
  `<style>{\`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box}body{margin:0;color:#FFFFFF;background-color:#020617;background-image:radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(20, 184, 166, 0.1), transparent 40%);min-height:100vh;font-family:'Inter',sans-serif;}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.2)}\`}</style>`
);

// Remove the inline styles that break the dark background
content = content.replace(/fontFamily: "'DM Sans', sans-serif", background: C.bg/g, `background: "transparent"`);

// 3. Update the inputs and buttons to look glassy
content = content.replace(
  /const inp = \{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid \$\{C.border\}`, fontSize: 14, outline: "none", transition: "all .2s" \};/,
  `const inp = { width: "100%", padding: "10px 14px", borderRadius: 8, border: \`1px solid \${C.border}\`, fontSize: 14, outline: "none", background: "rgba(0,0,0,0.2)", color: C.navy, transition: "all .2s" };`
);

content = content.replace(
  /const btn = \(type = "secondary"\) => \(\{ padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "none", transition: "all .2s", \.\.\.\(type === "primary" \? \{ background: C\.accent, color: "#fff" \} : type === "danger" \? \{ background: C\.dangerLight, color: C\.danger \} : \{ background: C\.white, color: C\.navy, border: `1px solid \$\{C\.border\}` \}\) \}\);/g,
  `const btn = (type = "secondary") => ({ padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "none", transition: "all .2s", ...(type === "primary" ? { background: C.accent, color: "#fff", boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)" } : type === "danger" ? { background: C.dangerLight, color: C.danger } : { background: C.white, color: C.navy, border: \`1px solid \${C.border}\` }) });`
);

// 4. Auth Screen fixes
// Remove the C.navy background on the right side of AuthScreen
content = content.replace(
  /<div style=\{\{ width: 440, background: C\.navy, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60 \}\}>/g,
  `<div style={{ width: 440, background: "rgba(255,255,255,0.02)", borderLeft: \`1px solid \${C.border}\`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, backdropFilter: "blur(20px)" }}>`
);
content = content.replace(/color: "#94A3B8"/g, `color: C.slate`);

// 5. App wrapper & sidebar fixes
// Inside `return (` in the main component:
content = content.replace(
  /<div style=\{\{ minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', sans-serif", background: C\.bg \}\}>/g,
  `<div style={{ minHeight: "100vh", display: "flex" }}>`
);

// Sidebar background
content = content.replace(
  /<nav style=\{\{ width: 260, background: C\.navy, color: C\.white, display: "flex", flexDirection: "column" \}\}>/g,
  `<nav style={{ width: 260, background: "rgba(255,255,255,0.02)", borderRight: \`1px solid \${C.border}\`, color: C.navy, display: "flex", flexDirection: "column", backdropFilter: "blur(20px)" }}>`
);

// Main content background
content = content.replace(
  /<main style=\{\{ flex: 1, display: "flex", flexDirection: "column", background: C\.bg, height: "100vh", overflow: "hidden" \}\}>/g,
  `<main style={{ flex: 1, display: "flex", flexDirection: "column", background: "transparent", height: "100vh", overflow: "hidden" }}>`
);

// Top header background
content = content.replace(
  /<header style=\{\{ height: 64, background: C\.white, borderBottom: `1px solid \$\{C\.border\}`, display: "flex", alignItems: "center", padding: "0 32px", justifyContent: "space-between" \}\}>/g,
  `<header style={{ height: 64, background: "rgba(255,255,255,0.02)", borderBottom: \`1px solid \${C.border}\`, display: "flex", alignItems: "center", padding: "0 32px", justifyContent: "space-between", backdropFilter: "blur(10px)" }}>`
);

// Global glass effect
content = content.replace(
  /background: C\.white/g,
  `background: C.white, backdropFilter: "blur(16px)"`
);

fs.writeFileSync('frontend/src/App.jsx', content);
console.log("Done");
