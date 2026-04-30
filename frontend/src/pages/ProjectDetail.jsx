import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  
  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  
  // Form state
  const [newTask, setNewTask] = useState({ title: '', description: '', assigneeId: '', dueDate: '' });
  const [newMemberId, setNewMemberId] = useState('');

  const fetchProject = async () => {
    try {
      const res = await axios.get(`${API_URL}/projects/${id}`);
      setProject(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/projects/users/all`);
      setAllUsers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProject();
    if (user?.role === 'ADMIN') {
      fetchAllUsers();
    }
  }, [id, user]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/tasks`, { ...newTask, projectId: id });
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', assigneeId: '', dueDate: '' });
      fetchProject();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/projects/${id}/members`, { userId: newMemberId });
      setShowMemberModal(false);
      fetchProject();
    } catch (error) {
      console.error(error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/tasks/${taskId}/status`, { status: newStatus });
      fetchProject();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Project not found.</div>;

  const getTasksByStatus = (status) => project.tasks.filter(t => t.status === status);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>{project.name}</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{project.description}</p>
        </div>
        {user?.role === 'ADMIN' && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>+ Add Member</button>
            <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>+ New Task</button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem' }}>Team Members</h4>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {project.members.map(m => (
            <div key={m.id} className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
              {m.user.name} ({m.user.email})
            </div>
          ))}
          {project.members.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>No members added yet.</span>}
        </div>
      </div>

      <h3 style={{ marginBottom: '1.5rem' }}>Task Board</h3>
      <div className="grid grid-cols-4" style={{ alignItems: 'start' }}>
        {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map(status => (
          <div key={status} className="glass-panel" style={{ padding: '1rem', background: 'rgba(13,17,23,0.5)' }}>
            <h4 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              {status.replace('_', ' ')}
              <span className="badge" style={{ background: 'var(--glass-bg)' }}>{getTasksByStatus(status).length}</span>
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {getTasksByStatus(status).map(task => (
                <div key={task.id} className="glass-panel" style={{ padding: '1rem' }}>
                  <h5 style={{ marginBottom: '0.5rem' }}>{task.title}</h5>
                  {task.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{task.description}</p>}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    <span style={{ color: 'var(--primary-color)' }}>{task.assignee ? task.assignee.name : 'Unassigned'}</span>
                    {task.dueDate && <span style={{ color: 'var(--warning-color)' }}>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                  </div>

                  {(user.role === 'ADMIN' || user.id === task.assigneeId) && (
                    <select 
                      className="form-control" 
                      style={{ padding: '0.3rem', fontSize: '0.8rem' }}
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">Review</option>
                      <option value="DONE">Done</option>
                    </select>
                  )}
                </div>
              ))}
              {getTasksByStatus(status).length === 0 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Create New Task</h3>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input required className="form-control" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} rows="3"></textarea>
              </div>
              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select className="form-control" value={newTask.assigneeId} onChange={e => setNewTask({...newTask, assigneeId: e.target.value})}>
                    <option value="">Unassigned</option>
                    {project.members.map(m => (
                      <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-control" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Add Team Member</h3>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label className="form-label">Select User</label>
                <select required className="form-control" value={newMemberId} onChange={e => setNewMemberId(e.target.value)}>
                  <option value="">-- Choose User --</option>
                  {allUsers.filter(u => !project.members.find(m => m.user.id === u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
