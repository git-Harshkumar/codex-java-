import React, { useState, useEffect } from 'react';
import NeoButton from './components/NeoButton';
import NeoCard from './components/NeoCard';
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
import { api } from './api';

// --- Dashboard Stats Component (live data) ---
const DashboardStats = ({ user, setActiveTab, refreshKey }) => {
  const [stats, setStats] = useState({ totalTopics: 0, totalQuestions: 0, avgScore: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    api.getStats(user.id)
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, refreshKey]);

  const cards = [
    { label: 'TOPICS LEARNED', value: loading ? '...' : stats.totalTopics, color: '#C9B8F5', tab: 'Progress' },
    { label: 'QUIZ AVERAGE',   value: loading ? '...' : `${stats.avgScore}%`, color: '#F5A868', tab: 'Quizzes' },
    { label: 'STUDY STREAK',   value: loading ? '...' : `${stats.streak} 🔥`, color: '#F5D876', tab: 'Progress' },
    { label: 'QUESTIONS DONE', value: loading ? '...' : stats.totalQuestions, color: '#8FD6B0', tab: 'Progress' },
  ];

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      {cards.map(card => (
        <NeoCard key={card.label} bg={card.color}
          style={{ flex: 1, minWidth: '160px', cursor: 'pointer' }}
          onClick={() => setActiveTab(card.tab)}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '13px' }}>{card.label}</div>
          <div style={{ fontSize: '44px', fontWeight: 900 }}>{card.value}</div>
        </NeoCard>
      ))}
    </div>
  );
};

// --- Time-aware greeting ---
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
};

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

  const handleLogout = () => {
    setUser(null);
    setActiveTab('Dashboard');
  };

  const handleDashSearch = () => {
    if (dashSearch.trim()) {
      setActiveTab('AI Tutor');
    }
  };

  // Called by QuizView when a quiz finishes — refreshes dashboard stat cards
  const handleQuizComplete = () => {
    setStatsRefreshKey(k => k + 1);
  };

  if (!user) {
    return <AuthView onLogin={handleLogin} />;
  }

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <div>
        <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>{getGreeting()}, {(user?.name || 'STUDENT').toUpperCase()} 👋</h1>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#555' }}>WHAT DO YOU WANT TO LEARN TODAY?</h2>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder='🔍 Ask anything... "Explain Photosynthesis"'
          className="neo-input"
          style={{ flexGrow: 1, maxWidth: '800px' }}
          value={dashSearch}
          onChange={e => setDashSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleDashSearch()}
        />
        <NeoButton action onClick={handleDashSearch}>ASK AI →</NeoButton>
      </div>

      <DashboardStats user={user} setActiveTab={setActiveTab} refreshKey={statsRefreshKey} />

      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '16px' }}>QUICK ACCESS</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { label: '🤖 AI Tutor', desc: 'Ask any study question', tab: 'AI Tutor', color: '#C9B8F5' },
            { label: '📚 Topics',   desc: 'Structured explanations', tab: 'Topics',   color: '#8FD6B0' },
            { label: '💻 Code',     desc: 'Analyze & debug code',   tab: 'Code',     color: '#F5D876' },
            { label: '📝 Quizzes',  desc: 'Test your knowledge',    tab: 'Quizzes',  color: '#F5A868' },
          ].map(q => (
            <NeoCard key={q.label} bg={q.color} style={{ flex: 1, minWidth: '180px', cursor: 'pointer' }}
              onClick={() => setActiveTab(q.tab)}>
              <div style={{ fontWeight: 900, fontSize: '16px', marginBottom: '6px' }}>{q.label}</div>
              <div style={{ fontSize: '13px', color: '#444' }}>{q.desc}</div>
            </NeoCard>
          ))}
        </div>
      </div>
    </div>
  );

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
          {renderDashboard()}
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

