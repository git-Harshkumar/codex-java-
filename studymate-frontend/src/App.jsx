import React, { useState } from 'react';
import { Settings, LogOut } from 'lucide-react';

import AuthView from './views/AuthView';
import AITutorView from './views/AITutorView';
import TopicExplainerView from './views/TopicExplainerView';
import CodeExplainerView from './views/CodeExplainerView';
import VisualizerView from './views/VisualizerView';
import QuizView from './views/QuizView';
import NotesView from './views/NotesView';
import ProgressView from './views/ProgressView';
import ProfileSettingsView from './views/ProfileSettingsView';
import DashboardView from './views/DashboardView';
import { api } from './api';
import { auth, signOut } from './firebase';

// --- App ---
function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [dashSearch, setDashSearch] = useState('');
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  // Lift AI messages state so chat history is preserved across tabs
  const [aiMessages, setAiMessages] = useState([
    { sender: 'STUDYMATE AI', text: "Hello! I'm StudyMate AI. How can I help you today?", color: '#C9B8F5' }
  ]);

  const navItems = ['Dashboard', 'AI Tutor', 'Topics', 'Code', 'Visualize', 'Quizzes', 'Notes', 'Progress'];

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveTab('Dashboard');
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (_) { /* already signed out */ }
    setUser(null);
    setActiveTab('Dashboard');
  };

  const handleNavigateFromDash = (tab, payload) => {
    if (payload) {
      if (tab === 'AI Tutor') {
        setDashSearch(payload);
        setAiMessages(prev => [...prev, { sender: 'YOU', text: payload }]);
        api.ask(payload)
          .then(data => {
            setAiMessages(prev => [...prev, { sender: 'STUDYMATE AI', text: data, color: '#C9B8F5' }]);
          })
          .catch(() => {});
      } else if (tab === 'Topics') {
        localStorage.setItem('sm_topic_text', payload);
      }
    }
    setActiveTab(tab);
  };

  // Called by QuizView when a quiz finishes — refreshes dashboard stat cards
  const handleQuizComplete = () => {
    setStatsRefreshKey(k => k + 1);
  };

  if (!user) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px 40px', overflow: 'hidden' }}>
      {/* Navbar */}
      <nav className="neo-shadow" style={{
        display: 'flex', alignItems: 'center', backgroundColor: '#1A1A1A', color: 'white',
        padding: '12px 24px', borderRadius: '100px', marginBottom: '32px', flexShrink: 0
      }}>
        <div style={{ fontWeight: 900, fontSize: '18px', marginRight: '32px', whiteSpace: 'nowrap' }}>STUDYMATE AI</div>

        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '10px', paddingTop: '4px', paddingLeft: '4px' }}>
          {navItems.map(item => (
            <button key={item} onClick={() => setActiveTab(item)} className={activeTab === item ? 'neo-shadow-sm' : ''} style={{
              backgroundColor: activeTab === item ? '#8FD6B0' : 'transparent',
              color: activeTab === item ? '#1A1A1A' : 'white',
              border: activeTab === item ? '3px solid #1A1A1A' : 'none',
              padding: '8px 12px', borderRadius: '100px', fontWeight: 'bold',
              cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px', whiteSpace: 'nowrap'
            }}>
              {item}
            </button>
          ))}
        </div>

        <div style={{ flexGrow: 1 }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px' }}>
          {user?.photoUrl && (
            <img
              src={user.photoUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
              style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid #8FD6B0', objectFit: 'cover', flexShrink: 0 }}
            />
          )}
          <span style={{ fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap' }}>
            {user?.name || 'Student'}
          </span>
          <Settings size={18} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('Settings')} />
          <LogOut size={18} style={{ cursor: 'pointer' }} onClick={handleLogout} title="Logout" />
        </div>
      </nav>

      {/* Main Content - Persistent tab panels to preserve inputs, analysis and scroll positions */}
      <main style={{ flexGrow: 1, overflowY: 'auto', padding: '10px 10px 40px 10px' }}>
        <div style={{ display: activeTab === 'Dashboard' ? 'block' : 'none', width: '100%' }}>
          <DashboardView
            user={user}
            onNavigate={handleNavigateFromDash}
            statsRefreshKey={statsRefreshKey}
          />
        </div>
        <div style={{ display: activeTab === 'AI Tutor' ? 'block' : 'none', width: '100%' }}>
          <AITutorView user={user} initialQuestion={dashSearch} messages={aiMessages} setMessages={setAiMessages} />
        </div>
        <div style={{ display: activeTab === 'Topics' ? 'block' : 'none', width: '100%' }}>
          <TopicExplainerView user={user} />
        </div>
        <div style={{ display: activeTab === 'Code' ? 'block' : 'none', width: '100%' }}>
          <CodeExplainerView user={user} />
        </div>
        <div style={{ display: activeTab === 'Visualize' ? 'block' : 'none', width: '100%' }}>
          <VisualizerView user={user} />
        </div>
        <div style={{ display: activeTab === 'Quizzes' ? 'block' : 'none', width: '100%' }}>
          <QuizView user={user} onQuizComplete={handleQuizComplete} />
        </div>
        <div style={{ display: activeTab === 'Notes' ? 'block' : 'none', width: '100%' }}>
          <NotesView user={user} activeTab={activeTab} />
        </div>
        <div style={{ display: activeTab === 'Progress' ? 'block' : 'none', width: '100%' }}>
          <ProgressView user={user} activeTab={activeTab} />
        </div>
        <div style={{ display: activeTab === 'Settings' ? 'block' : 'none', width: '100%' }}>
          <ProfileSettingsView user={user} />
        </div>
      </main>
    </div>
  );
}

export default App;

