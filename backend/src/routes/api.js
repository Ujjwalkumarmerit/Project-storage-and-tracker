const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');
const router = express.Router();

// --- Auth Routes ---
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, dept, color } = req.body;
    
    const existing = await req.prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await req.prisma.user.create({
      data: {
        name, email, password: hashedPassword, role: role || 'member', dept, color,
        online: true, lastActive: new Date()
      }
    });
    
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Log activity
    await req.prisma.activityLog.create({
      data: { userId: user.id, action: 'register', entityType: 'user', entityId: user.id, entityName: user.name, detail: 'Registered' }
    });

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await req.prisma.user.findUnique({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    await req.prisma.user.update({ where: { id: user.id }, data: { online: true, lastActive: new Date() } });
    
    await req.prisma.activityLog.create({
      data: { userId: user.id, action: 'login', entityType: 'user', entityId: user.id, entityName: user.name, detail: 'Signed in' }
    });
    
    req.io.emit('user_status_change', { userId: user.id, online: true });
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

router.use(auth); // Require auth for all subsequent routes

// --- Bootstrap Route ---
// Fetches all the data needed for the frontend in one go (simulating the loadDB behavior)
router.get('/bootstrap', async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const isAdmin = role === 'admin';

    const users = await req.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, dept: true, color: true, bio: true, joinedAt: true, lastActive: true, online: true }
    });

    let projects = [];
    if (isAdmin) {
      projects = await req.prisma.project.findMany({ include: { members: true } });
    } else {
      const pm = await req.prisma.projectMember.findMany({ where: { userId }, include: { project: { include: { members: true } } } });
      projects = pm.map(p => p.project);
    }
    
    const formattedProjects = projects.map(p => ({
      ...p, memberIds: p.members.map(m => m.userId)
    }));

    const projectIds = formattedProjects.map(p => p.id);

    const tasks = await req.prisma.task.findMany({
      where: isAdmin ? {} : { projectId: { in: projectIds } },
      include: { subtasks: true }
    });

    const taskIds = tasks.map(t => t.id);

    const comments = await req.prisma.comment.findMany({ where: { taskId: { in: taskIds } } });
    const timeLogs = await req.prisma.timeLog.findMany({ where: { taskId: { in: taskIds } } });
    const activityLog = await req.prisma.activityLog.findMany({
      orderBy: { timestamp: 'desc' }, take: 200
    });
    const notifications = await req.prisma.notification.findMany({ where: { userId } });

    res.json({ users, projects: formattedProjects, tasks, comments, timeLogs, activityLog, notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bootstrap failed' });
  }
});

// --- Mutation Routes ---

// Projects
router.post('/projects', async (req, res) => {
  const { name, description, color, tags, budget, memberIds } = req.body;
  const project = await req.prisma.project.create({
    data: {
      name, description, color, tags: tags || [], budget: budget ? parseFloat(budget) : null,
      ownerId: req.user.id,
      members: { create: [req.user.id, ...(memberIds || [])].map(id => ({ userId: id })) }
    },
    include: { members: true }
  });
  
  const formatted = { ...project, memberIds: project.members.map(m => m.userId) };
  
  const log = await req.prisma.activityLog.create({
    data: { userId: req.user.id, action: 'project_created', entityType: 'project', entityId: project.id, entityName: project.name, detail: 'Created new project' }
  });
  
  req.io.emit('db_update', { type: 'project', action: 'create', data: formatted });
  req.io.emit('db_update', { type: 'activity', action: 'create', data: log });
  res.json(formatted);
});

router.put('/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, color, tags, budget, status } = req.body;
  const project = await req.prisma.project.update({
    where: { id },
    data: { name, description, color, tags, status, budget: budget ? parseFloat(budget) : null },
    include: { members: true }
  });
  const formatted = { ...project, memberIds: project.members.map(m => m.userId) };
  const log = await req.prisma.activityLog.create({
    data: { userId: req.user.id, action: 'project_updated', entityType: 'project', entityId: project.id, entityName: project.name, detail: 'Updated project details' }
  });
  req.io.emit('db_update', { type: 'project', action: 'update', data: formatted });
  req.io.emit('db_update', { type: 'activity', action: 'create', data: log });
  res.json(formatted);
});

router.delete('/projects/:id', async (req, res) => {
  const { id } = req.params;
  const p = await req.prisma.project.findUnique({where: {id}});
  await req.prisma.project.delete({ where: { id } });
  const log = await req.prisma.activityLog.create({
    data: { userId: req.user.id, action: 'project_deleted', entityType: 'project', entityId: id, entityName: p?.name, detail: 'Deleted project' }
  });
  req.io.emit('db_update', { type: 'project', action: 'delete', id });
  req.io.emit('db_update', { type: 'activity', action: 'create', data: log });
  res.json({ success: true });
});

// Tasks
router.post('/tasks', async (req, res) => {
  const { title, description, status, priority, projectId, assigneeId, dueDate, estimatedHours, tags, subtasks } = req.body;
  const task = await req.prisma.task.create({
    data: {
      title, description, status, priority, projectId, assigneeId, reporterId: req.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
      tags: tags || [],
      subtasks: { create: (subtasks || []).map(s => ({ title: s.title, done: s.done })) }
    },
    include: { subtasks: true }
  });
  const log = await req.prisma.activityLog.create({
    data: { userId: req.user.id, action: 'task_created', entityType: 'task', entityId: task.id, entityName: task.title, detail: 'Created new task' }
  });
  if (assigneeId && assigneeId !== req.user.id) {
    const notif = await req.prisma.notification.create({
      data: { userId: assigneeId, type: 'assigned', message: `You were assigned to "${task.title}"`, entityId: task.id }
    });
    req.io.emit('db_update', { type: 'notification', action: 'create', data: notif });
  }
  req.io.emit('db_update', { type: 'task', action: 'create', data: task });
  req.io.emit('db_update', { type: 'activity', action: 'create', data: log });
  res.json(task);
});

router.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const old = await req.prisma.task.findUnique({where:{id}});
  
  if (data.status === 'done' && old.status !== 'done') data.completedAt = new Date();
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  if (data.estimatedHours) data.estimatedHours = parseFloat(data.estimatedHours);
  
  // Handle subtasks
  let subtasksOps = undefined;
  if (data.subtasks) {
     await req.prisma.subtask.deleteMany({where: {taskId: id}});
     subtasksOps = { create: data.subtasks.map(s => ({ title: s.title, done: s.done })) };
  }

  const cleanData = { ...data };
  delete cleanData.subtasks; delete cleanData.id; delete cleanData.createdAt; delete cleanData.updatedAt;

  const task = await req.prisma.task.update({
    where: { id },
    data: { ...cleanData, subtasks: subtasksOps },
    include: { subtasks: true }
  });

  const action = old.status !== task.status ? 'status_change' : 'task_updated';
  const detail = old.status !== task.status ? `${old.status} → ${task.status}` : 'Updated task';
  
  const log = await req.prisma.activityLog.create({
    data: { userId: req.user.id, action, entityType: 'task', entityId: task.id, entityName: task.title, detail }
  });
  
  if (old.status !== task.status && task.assigneeId && task.assigneeId !== req.user.id) {
    const notif = await req.prisma.notification.create({
      data: { userId: task.assigneeId, type: 'status_change', message: `Task "${task.title}" moved to ${task.status}`, entityId: task.id }
    });
    req.io.emit('db_update', { type: 'notification', action: 'create', data: notif });
  }

  req.io.emit('db_update', { type: 'task', action: 'update', data: task });
  req.io.emit('db_update', { type: 'activity', action: 'create', data: log });
  res.json(task);
});

router.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const t = await req.prisma.task.findUnique({where: {id}});
  await req.prisma.task.delete({ where: { id } });
  const log = await req.prisma.activityLog.create({
    data: { userId: req.user.id, action: 'task_deleted', entityType: 'task', entityId: id, entityName: t?.title, detail: 'Deleted task' }
  });
  req.io.emit('db_update', { type: 'task', action: 'delete', id });
  req.io.emit('db_update', { type: 'activity', action: 'create', data: log });
  res.json({ success: true });
});

// Interactions
router.post('/comments', async (req, res) => {
  const { taskId, text } = req.body;
  const task = await req.prisma.task.findUnique({where: {id: taskId}});
  const comment = await req.prisma.comment.create({
    data: { taskId, text, userId: req.user.id }
  });
  const log = await req.prisma.activityLog.create({
    data: { userId: req.user.id, action: 'comment', entityType: 'task', entityId: taskId, entityName: task?.title, detail: 'Left a comment' }
  });
  if (task?.assigneeId && task.assigneeId !== req.user.id) {
    const notif = await req.prisma.notification.create({
      data: { userId: task.assigneeId, type: 'comment', message: `New comment on "${task?.title}"`, entityId: taskId }
    });
    req.io.emit('db_update', { type: 'notification', action: 'create', data: notif });
  }
  req.io.emit('db_update', { type: 'comment', action: 'create', data: comment });
  req.io.emit('db_update', { type: 'activity', action: 'create', data: log });
  res.json(comment);
});

router.post('/timelogs', async (req, res) => {
  const { taskId, hours, note } = req.body;
  const task = await req.prisma.task.findUnique({where: {id: taskId}});
  const timeLog = await req.prisma.timeLog.create({
    data: { taskId, hours: parseFloat(hours), note, userId: req.user.id }
  });
  const updatedTask = await req.prisma.task.update({
    where: {id: taskId}, data: { loggedHours: { increment: parseFloat(hours) } }, include: {subtasks:true}
  });
  const log = await req.prisma.activityLog.create({
    data: { userId: req.user.id, action: 'logged_time', entityType: 'task', entityId: taskId, entityName: task?.title, detail: `Logged ${hours}h` }
  });
  
  req.io.emit('db_update', { type: 'timelog', action: 'create', data: timeLog });
  req.io.emit('db_update', { type: 'task', action: 'update', data: updatedTask });
  req.io.emit('db_update', { type: 'activity', action: 'create', data: log });
  res.json(timeLog);
});

router.post('/projects/:id/members', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const p = await req.prisma.project.findUnique({where: {id}});
  const u = await req.prisma.user.findUnique({where: {id: userId}});
  await req.prisma.projectMember.create({ data: { projectId: id, userId } });
  
  const log = await req.prisma.activityLog.create({
    data: { userId: req.user.id, action: 'member_added', entityType: 'project', entityId: id, entityName: p?.name, detail: `Added ${u?.name}` }
  });
  const notif = await req.prisma.notification.create({
    data: { userId, type: 'added_to_project', message: `You were added to "${p?.name}"`, entityId: id }
  });
  
  req.io.emit('db_update', { type: 'project_member', action: 'create', projectId: id, userId });
  req.io.emit('db_update', { type: 'notification', action: 'create', data: notif });
  req.io.emit('db_update', { type: 'activity', action: 'create', data: log });
  res.json({ success: true });
});

router.delete('/projects/:id/members/:userId', async (req, res) => {
  const { id, userId } = req.params;
  const p = await req.prisma.project.findUnique({where: {id}});
  const u = await req.prisma.user.findUnique({where: {id: userId}});
  await req.prisma.projectMember.delete({ where: { userId_projectId: { projectId: id, userId } } });
  
  const log = await req.prisma.activityLog.create({
    data: { userId: req.user.id, action: 'member_removed', entityType: 'project', entityId: id, entityName: p?.name, detail: `Removed ${u?.name}` }
  });
  req.io.emit('db_update', { type: 'project_member', action: 'delete', projectId: id, userId });
  req.io.emit('db_update', { type: 'activity', action: 'create', data: log });
  res.json({ success: true });
});

// Notifications
router.put('/notifications/read-all', async (req, res) => {
  await req.prisma.notification.updateMany({ where: { userId: req.user.id }, data: { read: true } });
  res.json({ success: true });
});

// Users
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, role, dept, bio, color } = req.body;
  const user = await req.prisma.user.update({
    where: { id }, data: { name, role, dept, bio, color },
    select: { id: true, name: true, email: true, role: true, dept: true, color: true, bio: true, joinedAt: true, lastActive: true, online: true }
  });
  req.io.emit('db_update', { type: 'user', action: 'update', data: user });
  res.json(user);
});

router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  await req.prisma.user.delete({ where: { id } });
  req.io.emit('db_update', { type: 'user', action: 'delete', id });
  res.json({ success: true });
});

module.exports = router;
