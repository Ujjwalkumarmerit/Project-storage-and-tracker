<div align="center">
  <img src="./frontend/public/favicon.svg" width="80" alt="ProjectFlow Logo" />
  <h1>ProjectFlow 🚀</h1>
  <p><b>A modern, full-stack project management hub built for teams that ship.</b></p>
  <p>
    <img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
    <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
    <img alt="Prisma" src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" />
    <img alt="Socket.io" src="https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101" />
  </p>
</div>

---

## ✨ Features

ProjectFlow is a fully-featured, production-ready application designed with a premium **Dark Mode Glassmorphism** aesthetic. 

- **Live Real-Time Syncing:** Powered by `Socket.io`, all updates to tasks, comments, and project statuses are instantly synced across all connected team members without refreshing the page.
- **Role-Based Access Control (RBAC):** Granular permissions supporting `Admin`, `Manager`, `Member`, and `Viewer` roles. Control exactly who can create projects, assign tasks, or just view progress.
- **Dynamic Kanban Boards:** Drag-and-drop enabled status boards (Backlog, To Do, In Progress, Review, Done) to visualize team velocity.
- **Activity Feeds & Comments:** Every action (status changes, task assignments) is automatically logged to a chronological project activity feed. Inline commenting enables rapid team communication.
- **Time Logging & Estimates:** Track estimated vs actual hours on every task to improve future sprint planning.
- **Interactive Demo Mode:** Comes with a built-in pre-seeded database, including fully populated users, projects, and an active task board for instant testing.

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 (Vite)
- Custom Vanilla CSS (Glassmorphism & CSS Modules)
- Axios (API Integration)

**Backend:**
- Node.js & Express.js
- Prisma ORM
- Socket.io (Real-time events)
- JSON Web Tokens (JWT) & bcrypt (Authentication)

**Database:**
- PostgreSQL (Neon.tech recommended)

---

## 🚀 Deployment Guide (Render)

ProjectFlow is designed to be deployed as a **single, unified Web Service** to drastically simplify CI/CD pipelines. The repository contains a custom `build.sh` script that compiles the React frontend, installs backend dependencies, generates the Prisma client, and synchronizes the database schema all in one step!

### Step 1: Prepare your Database
1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech) or a similar provider.
2. Copy your Connection String (`DATABASE_URL`).

### Step 2: Deploy to Render
1. Go to your [Render Dashboard](https://dashboard.render.com/) and click **New** -> **Web Service**.
2. Connect this GitHub repository.
3. Use the following configuration:
   - **Root Directory:** *(leave completely blank)*
   - **Environment:** `Node`
   - **Build Command:** `bash build.sh`
   - **Start Command:** `cd backend && npm start`
4. Expand **Environment Variables** and add:
   - `DATABASE_URL` : *(Your PostgreSQL Connection String)*
   - `JWT_SECRET` : *(A secure random string, e.g., `super_secret_key_123`)*
   - `NODE_ENV` : `production`
   - `NODE_VERSION` : `20.x`
5. Click **Deploy Web Service**! Render will automatically build the React app, push the database schema, and launch the server.

---

## 💻 Local Development

Want to run the app locally? It's incredibly simple:

1. Clone the repository and setup your `DATABASE_URL` inside `backend/.env`.
2. Run the `build.sh` script from the root directory to install all dependencies for both frontend and backend simultaneously.
   ```bash
   bash build.sh
   ```
3. Seed the database with demo users and projects:
   ```bash
   cd backend
   node prisma/seed.js
   ```
4. Start the backend server (which will also serve the frontend locally):
   ```bash
   npm start
   ```
5. Open your browser to `http://localhost:5000`

---

## 🎨 UI Showcase

The application utilizes advanced CSS techniques to achieve a modern aesthetic:
- **Radial Gradients:** Deep space backgrounds (`#020617`) with vibrant Teal and Purple glows.
- **Backdrop Filters:** Semi-transparent glass panels utilizing `backdrop-filter: blur(20px)` for high-end UI elevation.
- **Neon Accents:** Primary actions and active states glow with soft box shadows to intuitively guide user interactions.

<br>
<div align="center">
  <i>Built with ❤️ using React, Prisma, and PostgreSQL</i>
</div>
