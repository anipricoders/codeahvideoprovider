import React, { useState } from 'react';
import { ShieldAlert, Award } from 'lucide-react';

interface LoginProps {
  onStudentLogin: (studentData: any) => void;
  onAdminLogin: (token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onStudentLogin, onAdminLogin }) => {
  const isAdmin = window.location.pathname === '/admin';
  const activeTab: 'student' | 'admin' = isAdmin ? 'admin' : 'student';
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentUsername.trim() || !studentPassword.trim()) {
      setError('Both username and password are required');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/students/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: studentUsername.trim(), password: studentPassword.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Validation failed');
      }

      onStudentLogin({
        studentId: data.student.id,
        token: data.token,
        username: data.student.username,
        name: data.student.name,
        assignedCourses: data.student.assignedCourses || []
      });
    } catch (err: any) {
      setError(err.message || 'Server error. Please verify the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Both username and password are required');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      onAdminLogin(data.token);
    } catch (err: any) {
      setError(err.message || 'Server error. Please verify the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="glass-card login-card">
        <div className="login-header">
          <div className="logo" style={{ justifyContent: 'center', fontSize: '2rem' }}>
            <Award size={32} style={{ color: '#06b6d4' }} />
            CodeAH Player
          </div>
          <h2>{activeTab === 'student' ? 'Student Workspace' : 'Admin Operations Control'}</h2>
          <p>
            {activeTab === 'student'
              ? 'Enter your credentials to resume your assigned course curriculum.'
              : 'Admin authentication required.'}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {activeTab === 'student' ? (
          <form onSubmit={handleStudentSubmit}>
            <div className="form-group">
              <label htmlFor="studentUsername">Username</label>
              <input
                id="studentUsername"
                type="text"
                placeholder="Student username"
                value={studentUsername}
                onChange={(e) => setStudentUsername(e.target.value)}
                className="input-control"
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="studentPassword">Password</label>
              <input
                id="studentPassword"
                type="password"
                placeholder="••••••••"
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                className="input-control"
                disabled={isLoading}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Loading workspace...' : 'Unlock Classroom'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-control"
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-control"
                disabled={isLoading}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Authorizing...' : 'Admin Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
