const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// Get all tasks (Admins get all, members get their assigned)
router.get('/', async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'ADMIN') {
      tasks = await req.prisma.task.findMany({ include: { project: true, assignee: { select: { id: true, name: true } } } });
    } else {
      tasks = await req.prisma.task.findMany({
        where: { assigneeId: req.user.id },
        include: { project: true, assignee: { select: { id: true, name: true } } }
      });
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task (Admins only)
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin required' });
    const { title, description, projectId, assigneeId, dueDate } = req.body;
    const task = await req.prisma.task.create({
      data: {
        title, description, projectId, assigneeId, dueDate: dueDate ? new Date(dueDate) : null
      }
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task status (Assignee or Admin)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const taskId = req.params.id;
    
    const task = await req.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    if (req.user.role !== 'ADMIN' && task.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }
    
    const updatedTask = await req.prisma.task.update({
      where: { id: taskId },
      data: { status }
    });
    
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task (Admins only)
router.delete('/:id', async (req, res) => {
  try {
     if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin required' });
     await req.prisma.task.delete({ where: { id: req.params.id } });
     res.json({ message: 'Task deleted' });
  } catch (error) {
     res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
