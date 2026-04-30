import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/dashboard`);
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Welcome back, {user?.name}</h2>
      
      <div className="grid grid-cols-3">
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1rem' }}>
            {user?.role === 'ADMIN' ? 'Total Projects' : 'My Projects'}
          </h3>
          <div style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--primary-color)' }}>
            {user?.role === 'ADMIN' ? stats?.totalProjects : stats?.userProjects}
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1rem' }}>
            {user?.role === 'ADMIN' ? 'Total Tasks' : 'Assigned Tasks'}
          </h3>
          <div style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--accent-color)' }}>
            {user?.role === 'ADMIN' ? stats?.totalTasks : stats?.assignedTasks}
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(248, 81, 73, 0.3)' }}>
          <h3 style={{ color: 'var(--danger-color)', fontSize: '1rem', marginBottom: '1rem' }}>
            Overdue Tasks
          </h3>
          <div style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--danger-color)' }}>
            {stats?.overdueTasks}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
