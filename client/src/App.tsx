import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { Shield, LogOut, Award } from 'lucide-react';
import './App.css';

type UserRole = 'guest' | 'student' | 'admin';

interface StudentSessionData {
  studentId: string;
  token: string;
  username: string;
  name: string;
  assignedCourses: string[];
}

function App() {
  const [role, setRole] = useState<UserRole>('guest');
  const [, setAdminToken] = useState<string | null>(null);
  const [studentSession, setStudentSession] = useState<StudentSessionData | null>(null);

  // Restore session from localStorage if available based on URL route path
  useEffect(() => {
    const isAdminPath = window.location.pathname === '/admin';
    const savedRole = localStorage.getItem('codeah_role') as UserRole;
    
    if (isAdminPath) {
      if (savedRole === 'admin') {
        const savedToken = localStorage.getItem('codeah_admin_token');
        if (savedToken) {
          setRole('admin');
          setAdminToken(savedToken);
        }
      } else {
        setRole('guest');
      }
    } else {
      if (savedRole === 'student') {
        const savedSession = localStorage.getItem('codeah_student_session');
        if (savedSession) {
          setRole('student');
          setStudentSession(JSON.parse(savedSession));
        }
      } else {
        setRole('guest');
      }
    }
  }, []);

  // Global right-click and inspect shortcut blocker for student role
  useEffect(() => {
    if (role !== 'student') return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isF12 = e.key === 'F12';
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      if (
        isF12 ||
        (isCmdOrCtrl && isShift && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (isCmdOrCtrl && (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's'))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [role]);

  const handleStudentLogin = (data: StudentSessionData) => {
    setRole('student');
    setStudentSession(data);
    localStorage.setItem('codeah_role', 'student');
    localStorage.setItem('codeah_student_session', JSON.stringify(data));
  };

  const handleAdminLogin = (token: string) => {
    setRole('admin');
    setAdminToken(token);
    localStorage.setItem('codeah_role', 'admin');
    localStorage.setItem('codeah_admin_token', token);
  };

  const handleLogout = () => {
    const isAdminPath = window.location.pathname === '/admin';
    setRole('guest');
    setAdminToken(null);
    setStudentSession(null);
    localStorage.removeItem('codeah_role');
    localStorage.removeItem('codeah_admin_token');
    localStorage.removeItem('codeah_student_session');
    
    if (isAdminPath) {
      window.location.href = '/';
    }
  };

  return (
    <div className="app-container">
      {role === 'guest' && (
        <>
          <header className="navbar">
            <div className="logo">
              <Award size={24} style={{ color: '#7c3aed' }} />
              CodeAH Player
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Secure Video Preview Sandbox
            </div>
          </header>
          <Login onStudentLogin={handleStudentLogin} onAdminLogin={handleAdminLogin} />
        </>
      )}

      {role === 'admin' && (
        <>
          <header className="navbar">
            <div className="logo">
              <Shield size={24} style={{ color: '#7c3aed' }} />
              CodeAH Operations Center
            </div>
            <div className="nav-user">
              <span className="badge badge-admin">Super Admin</span>
              <button className="btn-logout" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LogOut size={14} /> Exit Admin
              </button>
            </div>
          </header>
          <AdminDashboard />
        </>
      )}

      {role === 'student' && studentSession && (
        <StudentDashboard studentData={studentSession} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
