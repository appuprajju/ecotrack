import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/Login';
import { UserDashboard } from './pages/Dashboard';
import { CarbonCalculator } from './pages/Calculator';
import { GoalsTracker } from './pages/Goals';
import { ChallengesPortal } from './pages/Challenges';
import { LearningHub } from './pages/LearningHub';
import { AdminConsole } from './pages/AdminConsole';
import { UserProfile } from './pages/Profile';

type Tab = 'dashboard' | 'calculator' | 'goals' | 'challenges' | 'learning' | 'admin' | 'profile';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <UserDashboard />;
      case 'calculator':
        return <CarbonCalculator />;
      case 'goals':
        return <GoalsTracker />;
      case 'challenges':
        return <ChallengesPortal />;
      case 'learning':
        return <LearningHub />;
      case 'admin':
        return <AdminConsole />;
      case 'profile':
        return <UserProfile />;
      default:
        return <UserDashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', height: '28px', filter: 'drop-shadow(0 0 6px var(--primary-glow))' }} className="animated-icon">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8A7 7 0 0 1 11 20z" />
            <path d="M19 2v10" />
          </svg>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(135deg, #ffffff 40%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EcoTrack AI</span>
        </div>

        <ul className="sidebar-menu">
          <li>
            <div onClick={() => setActiveTab('dashboard')} className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}>
              <svg style={{ width: '18px', height: '18px', marginRight: '4px', stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animated-icon">
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
              Dashboard
            </div>
          </li>
          <li>
            <div onClick={() => setActiveTab('calculator')} className={`sidebar-link ${activeTab === 'calculator' ? 'active' : ''}`}>
              <svg style={{ width: '18px', height: '18px', marginRight: '4px', stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animated-icon">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                <line x1="9" y1="22" x2="9" y2="16" />
                <line x1="8" y1="6" x2="16" y2="6" />
                <line x1="16" y1="22" x2="16" y2="16" />
                <line x1="4" y1="16" x2="20" y2="16" />
              </svg>
              Calculator
            </div>
          </li>
          <li>
            <div onClick={() => setActiveTab('goals')} className={`sidebar-link ${activeTab === 'goals' ? 'active' : ''}`}>
              <svg style={{ width: '18px', height: '18px', marginRight: '4px', stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animated-icon">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              Goals
            </div>
          </li>
          <li>
            <div onClick={() => setActiveTab('challenges')} className={`sidebar-link ${activeTab === 'challenges' ? 'active' : ''}`}>
              <svg style={{ width: '18px', height: '18px', marginRight: '4px', stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animated-icon">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                <path d="M12 2a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" />
              </svg>
              Challenges
            </div>
          </li>
          <li>
            <div onClick={() => setActiveTab('learning')} className={`sidebar-link ${activeTab === 'learning' ? 'active' : ''}`}>
              <svg style={{ width: '18px', height: '18px', marginRight: '4px', stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animated-icon">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z" />
              </svg>
              Learning Hub
            </div>
          </li>
          <li>
            <div onClick={() => setActiveTab('profile')} className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}>
              <svg style={{ width: '18px', height: '18px', marginRight: '4px', stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animated-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profile Settings
            </div>
          </li>
          {user?.role === 'ADMIN' && (
            <li>
              <div onClick={() => setActiveTab('admin')} className={`sidebar-link ${activeTab === 'admin' ? 'active' : ''}`} style={{ borderLeft: '2px solid var(--danger)' }}>
                <svg style={{ width: '18px', height: '18px', marginRight: '4px', stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animated-icon">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Admin Console
              </div>
            </li>
          )}
        </ul>

        {/* User Card footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}>
            🚪 Sign Out
          </button>
        </div>
      </div>

      {/* Main Viewport Content */}
      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  );
};

const AuthBarrier: React.FC = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Restoring secure sessions...</p>
      </div>
    );
  }

  if (!token) {
    return <LoginPage />;
  }

  return <MainLayout />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthBarrier />
    </AuthProvider>
  );
};

export default App;
