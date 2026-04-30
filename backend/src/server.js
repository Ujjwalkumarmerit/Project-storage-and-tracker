const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up Prisma on req so routes can use it without multiple imports
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Dashboard stats endpoint
app.get('/api/dashboard', require('./middleware/auth').auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    
    let stats = {};
    
    if (role === 'ADMIN') {
       const totalProjects = await prisma.project.count();
       const totalTasks = await prisma.task.count();
       const overdueTasks = await prisma.task.count({
          where: { dueDate: { lt: new Date() }, status: { not: 'DONE' } }
       });
       stats = { totalProjects, totalTasks, overdueTasks };
    } else {
       const userProjects = await prisma.projectMember.count({ where: { userId } });
       const assignedTasks = await prisma.task.count({ where: { assigneeId: userId } });
       const overdueTasks = await prisma.task.count({
          where: { assigneeId: userId, dueDate: { lt: new Date() }, status: { not: 'DONE' } }
       });
       stats = { userProjects, assignedTasks, overdueTasks };
    }
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
