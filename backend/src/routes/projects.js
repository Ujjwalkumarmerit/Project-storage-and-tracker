const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// Get all projects (Admins see all, members see their assigned)
router.get('/', async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'ADMIN') {
      projects = await req.prisma.project.findMany({ include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } } });
    } else {
      const memberships = await req.prisma.projectMember.findMany({
        where: { userId: req.user.id },
        include: { project: { include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } } } }
      });
      projects = memberships.map(m => m.project);
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create project
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await req.prisma.project.create({
      data: { name, description }
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await req.prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        tasks: { include: { assignee: { select: { id: true, name: true } } } }
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Add member
router.post('/:id/members', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    const membership = await req.prisma.projectMember.create({
      data: { projectId: req.params.id, userId }
    });
    res.status(201).json(membership);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Get users for adding to project
router.get('/users/all', requireAdmin, async (req, res) => {
    try {
        const users = await req.prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true }
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

module.exports = router;
