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

// Removed duplicate DashboardStats component as it's handled in ProgressView

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center', textAlign: 'center', paddingTop: '40px' }}>
      <div>
        <h1 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '16px', letterSpacing: '-1px' }}>
          {getGreeting()}, <span style={{ color: '#F5A868' }}>{(user?.name || 'STUDENT').toUpperCase()}</span> 👋
        </h1>
        <h2 style={{ fontSize: '20px', fontWeight: 'normal', color: '#555', maxWidth: '600px', margin: '0 auto' }}>
          Welcome to StudyMate AI. Your personal, intelligent study companion. What would you like to master today?
        </h2>
      </div>

      <NeoCard bg="#FFFFFF" style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%', maxWidth: '800px', padding: '24px', borderRadius: '24px' }}>
        <input
          type="text"
          placeholder='🔍 Ask your AI Tutor anything... e.g. "Explain Graph BFS"'
          className="neo-input"
          style={{ flexGrow: 1, fontSize: '18px', padding: '16px 24px', borderRadius: '16px' }}
          value={dashSearch}
          onChange={e => setDashSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleDashSearch()}
        />
        <NeoButton action onClick={handleDashSearch} style={{ padding: '18px 32px', fontSize: '16px', borderRadius: '16px' }}>ASK AI →</NeoButton>
      </NeoCard>

      <div style={{ width: '100%', maxWidth: '1000px', marginTop: '60px', display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '60px' }}>
        {[
          { label: 'Chat with AI Tutor', desc: 'Ask questions and get instant, interactive help. The AI Tutor remembers your conversation history and provides tailored, deep explanations on any subject.', tab: 'AI Tutor', color: '#C9B8F5', emoji: '💬' },
          { label: 'Study Topics',   desc: 'Get structured breakdowns of complex subjects. We break down the definition, intuition, real-world examples, and advanced details of any concept.', tab: 'Topics',   color: '#8FD6B0', emoji: '📖' },
          { label: 'Take a Quiz',  desc: 'Test your knowledge with dynamic AI quizzes. Every quiz is generated specifically for you by the LLM to test your mastery.',    tab: 'Quizzes',  color: '#F5A868', emoji: '🎯' },
          { label: 'Analyze Code',     desc: 'Paste code to get a line-by-line breakdown. Find bugs, understand time and space complexity, and learn coding best practices.',   tab: 'Code',     color: '#F5D876', emoji: '🛠️' },
          { label: 'Track Progress',     desc: 'View your study streaks, total questions answered, and quiz mastery levels over time to stay motivated.',   tab: 'Progress',     color: '#E0E0E0', emoji: '📈' },
        ].map((q, i) => (
          <NeoCard key={q.label} bg={q.color} 
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              flexDirection: i % 2 === 0 ? 'row' : 'row-reverse', 
              alignItems: 'center',
              gap: '40px',
              padding: '40px',
              transition: 'transform 0.2s',
              minHeight: '250px'
            }}
            onClick={() => setActiveTab(q.tab)}
          >
            <div style={{ flex: '1', display: 'flex', justifyContent: 'center', fontSize: '100px', filter: 'drop-shadow(4px 4px 0px #1A1A1A)' }}>
              {q.emoji}
            </div>
            <div style={{ flex: '2', textAlign: i % 2 === 0 ? 'left' : 'right' }}>
              <div style={{ fontWeight: 900, fontSize: '32px', marginBottom: '16px' }}>{q.label}</div>
              <div style={{ fontSize: '18px', color: '#333', lineHeight: 1.6, fontWeight: '500' }}>{q.desc}</div>
            </div>
          </NeoCard>
        ))}
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

