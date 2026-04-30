# Project Management Hub

A modern, full-stack project management application featuring role-based access control (Admin/Member), task tracking, dynamic dashboards, and a beautiful dark-mode glassmorphism aesthetic.

## Features
- **Authentication**: JWT-based Signup/Login.
- **Role-Based Access**: Admins can create projects and tasks, and add members. Members can only view their projects and update task statuses.
- **Dashboard**: High-level metrics for Total/Assigned Projects and Tasks, including Overdue Task tracking.
- **Project & Team Management**: Admins can invite registered users to specific projects.
- **Task Board**: Dynamic status board (To Do, In Progress, Review, Done).

## Tech Stack
- **Frontend**: React (Vite), React Router, Axios, Vanilla CSS (Glassmorphism design).
- **Backend**: Node.js, Express, Prisma ORM.
- **Database**: PostgreSQL.

---

## Local Development Setup

### 1. Database Setup
Ensure you have PostgreSQL running locally or use a cloud database (like Railway).
Create a `.env` file in the `backend` directory:
```
DATABASE_URL="postgresql://user:password@localhost:5432/project_manager?schema=public"
JWT_SECRET="your_super_secret_key"
PORT=5000
```

### 2. Backend
```bash
cd backend
npm install
npx prisma db push
npm run dev
```

### 3. Frontend
Create a `.env` file in the `frontend` directory:
```
VITE_API_URL=http://localhost:5000/api
```
```bash
cd frontend
npm install
npm run dev
```

---

## Deployment to Railway 🚀

This repository is structured as a monorepo containing both the frontend and backend. Follow these steps to deploy it live on Railway:

### Step 1: Provision the Database
1. Go to your Railway Dashboard.
2. Click **New Project** -> **Provision PostgreSQL**.

### Step 2: Deploy the Backend
1. In the same Railway project, click **New** -> **GitHub Repo** and select this repository.
2. After the service is created, go to its **Settings**.
3. Under **Root Directory**, type `/backend` and hit Enter.
4. Go to **Variables** and add:
   - `JWT_SECRET`: Any secure random string.
   - `DATABASE_URL`: Set this using the Reference feature to link to your PostgreSQL database's `DATABASE_URL`.
   - `PORT`: `5000` (Railway will automatically map this).
5. Railway will detect `package.json` in the `/backend` folder and start the server using `npm start`. Note: Make sure to run migrations or db push on Railway (you can add `"build": "prisma generate && prisma db push"` to backend scripts).

### Step 3: Deploy the Frontend
1. Click **New** -> **GitHub Repo** again and select the *same* repository.
2. Go to the new service's **Settings**.
3. Under **Root Directory**, type `/frontend` and hit Enter.
4. Go to **Variables** and add:
   - `VITE_API_URL`: Set this to the public domain URL of your backend service (e.g., `https://your-backend-production.up.railway.app/api`).
5. Railway will automatically detect Vite, build the static assets, and serve them. Ensure the backend domain is generated first so you can provide it to the frontend.

Enjoy your fully functional live Project Management Web App!
