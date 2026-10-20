import React, { useState, useEffect } from 'react';
import NeoCard from '../components/NeoCard';
import NeoButton from '../components/NeoButton';
import { api } from '../api';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Search,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Code2,
  Activity,
  FileText,
  Brain,
  Trophy,
  Clock,
  Zap,
  Plus,
  Compass,
  Lightbulb,
  Check,
  SlidersHorizontal
} from 'lucide-react';

// Curated study tips for the interactive tip cycler
const STUDY_TIPS = [
  { id: 1, title: 'The Feynman Technique', text: 'Explain concepts in plain, simple words as if teaching a beginner. If you get stuck, that is where your gap is.' },
  { id: 2, title: 'Active Recall', text: 'Test yourself before re-reading notes. Generating answers from memory produces 50% stronger retention.' },
  { id: 3, title: 'Spaced Repetition', text: 'Review tricky topics on day 1, 3, 7, and 14 to permanently lock them into long-term memory.' },
  { id: 4, title: 'Interleaving Practice', text: 'Mix up topics instead of practicing just one problem type. This trains your brain to select the right approach.' },
  { id: 5, title: 'Pomodoro Sprints', text: '25 minutes of zero-distraction focus beats 3 hours of half-focused multitasking every time.' },
  { id: 6, title: 'Rubber Duck Debugging', text: 'Explain your code line-by-line out loud. Bugs often reveal themselves the moment you speak them.' },
  { id: 7, title: 'Build Intuition First', text: 'Never memorize formulas or algorithms blindly. Understand the "why" and the mental model first.' }
];

const MOODS = [
  { id: 'focus', label: 'Deep Focus', icon: '🎯', color: '#8FD6B0' },
  { id: 'dsa', label: 'Grinding DSA', icon: '⚡', color: '#F5D876' },
  { id: 'review', label: 'Quick Review', icon: '☕', color: '#C9B8F5' },
  { id: 'exam', label: 'Exam Cram', icon: '🚀', color: '#F5A868' }
];

const QUICK_PROMPTS = [
  { text: 'Graph BFS vs DFS', tab: 'Topics', topic: 'Graph BFS and DFS' },
  { text: 'Java Polymorphism', tab: 'Topics', topic: 'Polymorphism in Java' },
  { text: 'Binary Search Implementation', tab: 'Code', topic: 'Binary Search' },
  { text: 'Dynamic Programming Patterns', tab: 'AI Tutor', question: 'Explain the top 5 Dynamic Programming patterns with intuition.' },
  { text: 'System Design Basics', tab: 'Topics', topic: 'System Design Fundamentals' },
  { text: 'Big-O Time Complexity', tab: 'AI Tutor', question: 'How do I calculate Big-O time and space complexity step by step?' }
];

const DashboardView = ({ user, onNavigate, onQuickAsk, statsRefreshKey = 0 }) => {
  const userId = user?.id || 1;

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('AI Tutor'); // 'AI Tutor' | 'Topics' | 'Quizzes' | 'Code'

  // User Mood State
  const [currentMood, setCurrentMood] = useState(() => localStorage.getItem('sm_user_mood') || 'focus');

  // Tip Index State
  const [tipIndex, setTipIndex] = useState(0);

  // Daily Streak Check-in State
  const [checkedInToday, setCheckedInToday] = useState(() => {
    const today = new Date().toDateString();
    return localStorage.getItem('sm_last_checkin') === today;
  });

  // Daily Quests State (persisted per day)
  const [quests, setQuests] = useState(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem(`sm_quests_${today}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [
      { id: 'quiz', text: 'Conquer 1 AI Quiz challenge', completed: false, xp: 25 },
      { id: 'tutor', text: 'Ask AI Tutor a challenging question', completed: false, xp: 25 },
      { id: 'timer', text: 'Complete a focus session (Pomodoro or custom)', completed: false, xp: 25 },
      { id: 'note', text: 'Capture or review 1 key study note', completed: false, xp: 25 }
    ];
  });

  // Pomodoro Focus Timer State
  const [pomodoroMode, setPomodoroMode] = useState('focus'); // 'focus' (25) | 'short' (5) | 'long' (15) | 'custom'
  const [customMinutes, setCustomMinutes] = useState(45);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [timerInitialSeconds, setTimerInitialSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Live Stats State
  const [stats, setStats] = useState({
    totalTopics: 8,
    totalQuestions: 35,
    avgScore: 84,
    streak: 7
  });
  const [notesCount, setNotesCount] = useState(0);
  const [recentNotes, setRecentNotes] = useState([]);
  const [weakTopic, setWeakTopic] = useState(null);

  // Quick Note creation inline
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteSaving, setQuickNoteSaving] = useState(false);
  const [quickNoteSuccess, setQuickNoteSuccess] = useState(false);

  // Load stats, notes and progress
  useEffect(() => {
    api.getStats(userId)
      .then(res => {
        if (res && typeof res.streak !== 'undefined') {
          setStats(prev => ({ ...prev, ...res }));
        }
      })
      .catch(() => {});

    api.getNotes(userId)
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setNotesCount(arr.length);
        setRecentNotes(arr.slice(0, 3));
      })
      .catch(() => {});

    api.getProgress(userId)
      .then(prog => {
        if (Array.isArray(prog) && prog.length > 0) {
          const weak = prog.find(p => (p.masteryPct || 0) < 70);
          if (weak) setWeakTopic(weak);
        }
      })
      .catch(() => {});
  }, [userId, statsRefreshKey]);

  // Pomodoro timer ticker
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // Mark pomodoro quest as complete
      toggleQuest('timer', true);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsLeft]);

  // Save quests to localStorage
  const saveQuests = (newQuests) => {
    setQuests(newQuests);
    const today = new Date().toDateString();
    localStorage.setItem(`sm_quests_${today}`, JSON.stringify(newQuests));
  };

  const toggleQuest = (id, forceState) => {
    const updated = quests.map(q => {
      if (q.id === id) {
        const completed = forceState !== undefined ? forceState : !q.completed;
        return { ...q, completed };
      }
      return q;
    });
    saveQuests(updated);
  };

  // Timer controls
  const handleTimerModeChange = (mode) => {
    setPomodoroMode(mode);
    setIsTimerRunning(false);
    let target = 25 * 60;
    if (mode === 'focus') target = 25 * 60;
    else if (mode === 'short') target = 5 * 60;
    else if (mode === 'long') target = 15 * 60;
    else if (mode === 'custom') target = customMinutes * 60;

    setTimerInitialSeconds(target);
    setSecondsLeft(target);
    setShowCustomPicker(false);
  };

  const handleApplyCustomTime = (mins) => {
    const validMins = Math.max(1, Math.min(360, parseInt(mins, 10) || 25));
    setCustomMinutes(validMins);
    setPomodoroMode('custom');
    setIsTimerRunning(false);
    const secs = validMins * 60;
    setTimerInitialSeconds(secs);
    setSecondsLeft(secs);
    setShowCustomPicker(false);
  };

  const toggleTimer = () => {
    setIsTimerRunning(prev => !prev);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setSecondsLeft(timerInitialSeconds);
  };

  const formatTimer = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    const totalMins = Math.floor(totalSec / 60);
    return `${totalMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check-in handler
  const handleCheckIn = () => {
    if (checkedInToday) return;
    const today = new Date().toDateString();
    localStorage.setItem('sm_last_checkin', today);
    setCheckedInToday(true);
    setStats(prev => ({ ...prev, streak: (prev.streak || 0) + 1 }));
  };

  // Mood switch
  const handleMoodSelect = (moodId) => {
    setCurrentMood(moodId);
    localStorage.setItem('sm_user_mood', moodId);
  };

  // Quick prompt click
  const handlePromptClick = (p) => {
    if (p.tab === 'AI Tutor') {
      onNavigate('AI Tutor', p.question || p.text);
      toggleQuest('tutor', true);
    } else if (p.tab === 'Topics') {
      onNavigate('Topics', p.topic || p.text);
    } else if (p.tab === 'Code') {
      onNavigate('Code', p.text);
    }
  };

  // Search submit
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchMode === 'AI Tutor') {
      onNavigate('AI Tutor', searchQuery);
      toggleQuest('tutor', true);
    } else if (searchMode === 'Topics') {
      onNavigate('Topics', searchQuery);
    } else if (searchMode === 'Quizzes') {
      onNavigate('Quizzes', searchQuery);
      toggleQuest('quiz', true);
    } else if (searchMode === 'Code') {
      onNavigate('Code', searchQuery);
    }
  };

  // Quick note save directly from dashboard
  const handleSaveQuickNote = async () => {
    if (!quickNoteText.trim() || quickNoteSaving) return;
    setQuickNoteSaving(true);
    try {
      const firstLine = quickNoteText.trim().split('\n')[0].substring(0, 40);
      await api.createNote({
        title: firstLine || 'Quick Study Note',
        content: quickNoteText.trim(),
        topic: 'General',
        tags: ['QuickNote', 'Dashboard'],
        userId
      });
      setQuickNoteText('');
      setQuickNoteSuccess(true);
      setNotesCount(c => c + 1);
      toggleQuest('note', true);
      setTimeout(() => setQuickNoteSuccess(false), 2500);
    } catch (_) {}
    setQuickNoteSaving(false);
  };

  // Greeting helper
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Quest stats
  const completedQuestsCount = quests.filter(q => q.completed).length;
  const questProgressPct = Math.round((completedQuestsCount / quests.length) * 100);
  const activeMoodObj = MOODS.find(m => m.id === currentMood) || MOODS[0];

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
      
      {/* ── 1. HERO HEADER WITH MOOD & LIVE DATE ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="neo-badge" style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
              📅 {todayFormatted.toUpperCase()}
            </span>
            <div
              className="neo-badge"
              style={{
                backgroundColor: activeMoodObj.color,
                color: '#1A1A1A',
                cursor: 'pointer',
                transform: 'rotate(-1deg)'
              }}
              title="Click to switch your study mood"
              onClick={() => {
                const nextIdx = (MOODS.findIndex(m => m.id === currentMood) + 1) % MOODS.length;
                handleMoodSelect(MOODS[nextIdx].id);
              }}
            >
              {activeMoodObj.icon} MODE: {activeMoodObj.label.toUpperCase()} ▾
            </div>
          </div>
          <h1 style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
            {greeting}, <span style={{ color: '#F5A868' }}>{(user?.name || 'STUDENT').toUpperCase()}</span> 👋
          </h1>
          <p style={{ fontSize: '16px', color: '#555', marginTop: '6px', fontWeight: 500 }}>
            Ready to accelerate your learning? What would you like to master right now?
          </p>
        </div>

        {/* Interactive Daily Tip Card */}
        <div style={{ maxWidth: '420px', width: '100%' }}>
          <NeoCard bg="#FFF9E6" style={{ padding: '16px 20px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={16} color="#F5A868" />
                STUDY TIP #{STUDY_TIPS[tipIndex].id}: {STUDY_TIPS[tipIndex].title.toUpperCase()}
              </span>
              <button
                onClick={() => setTipIndex(i => (i + 1) % STUDY_TIPS.length)}
                className="neo-shadow-sm"
                style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '4px 10px',
                  borderRadius: '100px',
                  backgroundColor: '#F5D876',
                  color: '#1A1A1A',
                  cursor: 'pointer',
                  border: '2px solid #1A1A1A'
                }}
              >
                NEXT ⚡
              </button>
            </div>
            <p style={{ fontSize: '13.5px', lineHeight: 1.5, color: '#222', fontWeight: 500, margin: 0 }}>
              "{STUDY_TIPS[tipIndex].text}"
            </p>
          </NeoCard>
        </div>
      </div>

      {/* ── 2. OMNI-LAUNCHPAD SEARCH BAR & TRENDING PILLS ── */}
      <NeoCard bg="#FFFFFF" style={{ padding: '24px', borderRadius: '22px' }}>
        {/* Mode selector pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', marginRight: '4px' }}>
            ACTION:
          </span>
          {[
            { id: 'AI Tutor', label: '💬 Ask AI Tutor', color: '#C9B8F5' },
            { id: 'Topics', label: '📖 Explain Topic', color: '#8FD6B0' },
            { id: 'Quizzes', label: '🎯 Instant Quiz', color: '#F5D876' },
            { id: 'Code', label: '🛠️ Inspect Code', color: '#F5A868' }
          ].map(m => {
            const isSelected = searchMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSearchMode(m.id)}
                className="neo-shadow-sm"
                style={{
                  backgroundColor: isSelected ? m.color : '#FFFFFF',
                  color: '#1A1A1A',
                  border: '2px solid #1A1A1A',
                  padding: '6px 14px',
                  borderRadius: '100px',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  transform: isSelected ? 'translate(-1px, -1px)' : 'none'
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Input box */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#1A1A1A' }} />
            <input
              type="text"
              placeholder={
                searchMode === 'AI Tutor'
                  ? 'Ask anything... e.g. "Explain how Dijkstra\'s algorithm works with intuition"'
                  : searchMode === 'Topics'
                  ? 'Enter topic to break down... e.g. "B-Trees in Database Indexing"'
                  : searchMode === 'Quizzes'
                  ? 'Topic for instant quiz... e.g. "Java Multithreading & Concurrency"'
                  : 'Enter code topic... e.g. "Quicksort partition function in Python"'
              }
              className="neo-input"
              style={{ width: '100%', fontSize: '16px', padding: '14px 20px 14px 50px', borderRadius: '14px' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <NeoButton
            action
            type="submit"
            style={{
              padding: '14px 28px',
              fontSize: '15px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0
            }}
          >
            <span>LAUNCH</span>
            <ArrowRight size={18} />
          </NeoButton>
        </form>

        {/* Trending prompt chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: '#666', textTransform: 'uppercase', marginRight: '4px' }}>
            POPULAR:
          </span>
          {QUICK_PROMPTS.map((p, i) => (
            <div
              key={i}
              className="neo-chip"
              onClick={() => handlePromptClick(p)}
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              {p.text}
            </div>
          ))}
        </div>
      </NeoCard>

      {/* ── 3. LIVE STATS & INTERACTIVE STREAK CHECK-IN ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
        
        {/* Streak Card */}
        <NeoCard bg="#F5D876" style={{ padding: '20px', borderRadius: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', color: '#1A1A1A' }}>
                STUDY STREAK
              </span>
              <span className="neo-badge" style={{ backgroundColor: '#FFFFFF', padding: '2px 8px', fontSize: '10px' }}>
                ACTIVE
              </span>
            </div>
            <div style={{ fontSize: '38px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {stats.streak || 7} DAYS <Flame size={32} color="#F5A868" fill="#F5A868" />
            </div>
            <p style={{ fontSize: '12px', color: '#444', fontWeight: 600, marginTop: '2px' }}>
              Practice daily to protect your streak
            </p>
          </div>
          <button
            onClick={handleCheckIn}
            className="neo-shadow-sm"
            style={{
              marginTop: '14px',
              width: '100%',
              padding: '8px',
              borderRadius: '10px',
              border: '2px solid #1A1A1A',
              backgroundColor: checkedInToday ? '#8FD6B0' : '#1A1A1A',
              color: checkedInToday ? '#1A1A1A' : '#FFFFFF',
              fontWeight: 900,
              fontSize: '12px',
              cursor: checkedInToday ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {checkedInToday ? (
              <>
                <Check size={16} strokeWidth={3} /> STREAK SAVED TODAY!
              </>
            ) : (
              '✔ CHECK IN FOR TODAY'
            )}
          </button>
        </NeoCard>

        {/* Topics Explored Card */}
        <NeoCard
          bg="#8FD6B0"
          style={{ padding: '20px', borderRadius: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          onClick={() => onNavigate('Topics')}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', color: '#1A1A1A' }}>
                TOPICS EXPLORED
              </span>
              <BookOpen size={18} />
            </div>
            <div style={{ fontSize: '38px', fontWeight: 900 }}>
              {stats.totalTopics || 12}
            </div>
            <p style={{ fontSize: '12px', color: '#222', fontWeight: 600, marginTop: '2px' }}>
              Deep-dive breakdowns mastered
            </p>
          </div>
          <div style={{ marginTop: '14px', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>EXPLORE NEW TOPIC</span>
            <ArrowRight size={14} />
          </div>
        </NeoCard>

        {/* Quiz Accuracy Card */}
        <NeoCard
          bg="#F5A868"
          style={{ padding: '20px', borderRadius: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          onClick={() => onNavigate('Quizzes')}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', color: '#1A1A1A' }}>
                QUIZ MASTERY
              </span>
              <Trophy size={18} />
            </div>
            <div style={{ fontSize: '38px', fontWeight: 900 }}>
              {stats.avgScore || 85}%
            </div>
            <p style={{ fontSize: '12px', color: '#222', fontWeight: 600, marginTop: '2px' }}>
              Across {stats.totalQuestions || 40}+ questions
            </p>
          </div>
          <div style={{ marginTop: '14px', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>TAKE A PRACTICE QUIZ</span>
            <ArrowRight size={14} />
          </div>
        </NeoCard>

        {/* Knowledge Bank Card */}
        <NeoCard
          bg="#C9B8F5"
          style={{ padding: '20px', borderRadius: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          onClick={() => onNavigate('Notes')}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', color: '#1A1A1A' }}>
                SAVED NOTES
              </span>
              <FileText size={18} />
            </div>
            <div style={{ fontSize: '38px', fontWeight: 900 }}>
              {notesCount}
            </div>
            <p style={{ fontSize: '12px', color: '#222', fontWeight: 600, marginTop: '2px' }}>
              Notes, diagrams & takeaways
            </p>
          </div>
          <div style={{ marginTop: '14px', fontSize: '12px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>OPEN NOTE VAULT</span>
            <ArrowRight size={14} />
          </div>
        </NeoCard>
      </div>

      {/* ── 4. TWO-COLUMN INTERACTIVE ZONE: DAILY QUESTS & POMODORO TIMER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        
        {/* Daily Study Quests */}
        <NeoCard bg="#FFFFFF" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🎯</span>
                <h3 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>TODAY'S STUDY QUESTS</h3>
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '2px', fontWeight: 500 }}>
                Complete daily missions to reinforce memory
              </p>
            </div>
            <span className="neo-badge" style={{ backgroundColor: questProgressPct === 100 ? '#8FD6B0' : '#F5D876' }}>
              {completedQuestsCount}/{quests.length} DONE
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ height: '14px', backgroundColor: '#EFEFEF', borderRadius: '100px', border: '2px solid #1A1A1A', overflow: 'hidden', marginBottom: '18px' }}>
            <div
              style={{
                width: `${questProgressPct}%`,
                height: '100%',
                backgroundColor: questProgressPct === 100 ? '#8FD6B0' : '#F5A868',
                transition: 'width 0.4s ease-out'
              }}
            />
          </div>

          {/* Quest items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
            {quests.map(q => (
              <div
                key={q.id}
                onClick={() => toggleQuest(q.id)}
                className="neo-shadow-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: q.completed ? '#E8F8F0' : '#FFFFFF',
                  border: '2px solid #1A1A1A',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {q.completed ? (
                  <CheckCircle2 size={20} color="#1A1A1A" fill="#8FD6B0" style={{ flexShrink: 0 }} />
                ) : (
                  <Circle size={20} color="#888" style={{ flexShrink: 0 }} />
                )}
                <span
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: q.completed ? '#555' : '#1A1A1A',
                    textDecoration: q.completed ? 'line-through' : 'none',
                    flexGrow: 1
                  }}
                >
                  {q.text}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#888' }}>
                  +{q.xp}XP
                </span>
              </div>
            ))}
          </div>

          {questProgressPct === 100 && (
            <div
              className="neo-badge"
              style={{
                marginTop: '16px',
                backgroundColor: '#8FD6B0',
                padding: '10px',
                justifyContent: 'center',
                width: '100%',
                textAlign: 'center'
              }}
            >
              🎉 ALL MISSIONS CRUSHED! +100 XP REWARD EARNED!
            </div>
          )}
        </NeoCard>

        {/* Embedded Pomodoro / Focus Sprint Timer */}
        <NeoCard bg="#FFFDF8" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#F5A868" />
                <h3 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>FOCUS SPRINT TIMER</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowCustomPicker(prev => !prev)}
                  className="neo-badge"
                  style={{
                    cursor: 'pointer',
                    backgroundColor: showCustomPicker ? '#F5D876' : '#FFFFFF',
                    color: '#1A1A1A',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px'
                  }}
                  title="Set custom timer duration"
                >
                  <SlidersHorizontal size={13} /> {showCustomPicker ? 'CLOSE' : 'SET TIMER'}
                </button>
                <span
                  className="neo-badge"
                  style={{
                    backgroundColor: isTimerRunning ? '#F5A868' : '#E0E0E0',
                    color: '#1A1A1A'
                  }}
                >
                  {isTimerRunning ? '⚡ FOCUS ACTIVE' : 'PAUSED'}
                </span>
              </div>
            </div>

            {/* Mode selection & Set Timer */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {[
                { id: 'focus', label: '25m Focus' },
                { id: 'short', label: '5m Break' },
                { id: 'long', label: '15m Reset' },
                { id: 'custom', label: `⚙️ ${pomodoroMode === 'custom' ? `${customMinutes}m Custom` : 'Set Timer'}` }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    if (m.id === 'custom') {
                      setShowCustomPicker(prev => !prev);
                    } else {
                      handleTimerModeChange(m.id);
                    }
                  }}
                  style={{
                    flex: 1,
                    minWidth: '65px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '2px solid #1A1A1A',
                    backgroundColor: pomodoroMode === m.id ? '#1A1A1A' : '#FFFFFF',
                    color: pomodoroMode === m.id ? '#FFFFFF' : '#1A1A1A',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Expandable Custom Duration Setter */}
            {showCustomPicker && (
              <div
                style={{
                  backgroundColor: '#FFF8E7',
                  border: '2.5px solid #1A1A1A',
                  borderRadius: '14px',
                  padding: '14px',
                  boxShadow: '3px 3px 0px #1A1A1A',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#1A1A1A' }}>
                    ⏱️ SET TIMER DURATION:
                  </span>
                  <span style={{ fontSize: '11px', color: '#666', fontWeight: 700 }}>
                    Preset or custom minutes
                  </span>
                </div>

                {/* Preset Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {[10, 15, 20, 30, 45, 60, 90, 120].map(mins => (
                    <span
                      key={mins}
                      onClick={() => handleApplyCustomTime(mins)}
                      className="neo-chip"
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        backgroundColor: customMinutes === mins && pomodoroMode === 'custom' ? '#F5D876' : '#FFFFFF',
                        fontWeight: 800
                      }}
                    >
                      {mins}m
                    </span>
                  ))}
                </div>

                {/* Stepper & Number Input */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleApplyCustomTime(Math.max(1, customMinutes - 5))}
                    style={{
                      width: '38px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '2px solid #1A1A1A',
                      backgroundColor: '#FFFFFF',
                      fontWeight: 900,
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '2px 2px 0 #1A1A1A'
                    }}
                    title="Decrease 5 minutes"
                  >
                    -5m
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                    <input
                      type="number"
                      min="1"
                      max="360"
                      value={customMinutes}
                      onChange={e => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '2px solid #1A1A1A',
                        fontWeight: 900,
                        fontSize: '15px',
                        textAlign: 'center',
                        outline: 'none',
                        backgroundColor: '#FFFFFF'
                      }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 900 }}>MINS</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyCustomTime(Math.min(360, customMinutes + 5))}
                    style={{
                      width: '38px',
                      height: '36px',
                      borderRadius: '8px',
                      border: '2px solid #1A1A1A',
                      backgroundColor: '#FFFFFF',
                      fontWeight: 900,
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '2px 2px 0 #1A1A1A'
                    }}
                    title="Increase 5 minutes"
                  >
                    +5m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyCustomTime(customMinutes)}
                    className="neo-shadow-sm"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '2px solid #1A1A1A',
                      backgroundColor: '#8FD6B0',
                      fontWeight: 900,
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    SET ✔
                  </button>
                </div>
              </div>
            )}

            {/* Big Timer Display (Clickable to open Set Timer) */}
            <div
              onClick={() => setShowCustomPicker(prev => !prev)}
              title="Click to customize timer duration"
              style={{
                backgroundColor: '#1A1A1A',
                color: '#8FD6B0',
                padding: '20px',
                borderRadius: '16px',
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: '52px',
                fontWeight: 900,
                letterSpacing: '2px',
                border: '3px solid #1A1A1A',
                boxShadow: '4px 4px 0px #F5A868',
                marginBottom: '10px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
            >
              {formatTimer(secondsLeft)}
            </div>
            <div style={{ fontSize: '11.5px', color: '#666', textAlign: 'center', marginBottom: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Clock size={13} />
              <span>Click timer display or "Set Timer" to customize</span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <NeoButton
              action={!isTimerRunning}
              onClick={toggleTimer}
              style={{
                flex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '14px',
                backgroundColor: isTimerRunning ? '#F5D876' : '#F5A868',
                color: '#1A1A1A'
              }}
            >
              {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
              <span>{isTimerRunning ? 'PAUSE TIMER' : 'START FOCUS SPRINT'}</span>
            </NeoButton>
            <button
              onClick={resetTimer}
              className="neo-shadow-sm"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid #1A1A1A',
                backgroundColor: '#FFFFFF',
                fontWeight: 900,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <RotateCcw size={15} /> RESET
            </button>
          </div>
        </NeoCard>
      </div>

      {/* ── 5. INTERACTIVE 6-CARD FEATURE HUB GRID (NEO-BRUTALISM) ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px' }}>
              LEARNING ARSENAL 🛠️
            </h2>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '2px', fontWeight: 500 }}>
              Specialized AI tools designed to help you understand faster and retain longer
            </p>
          </div>
          <span className="neo-badge" style={{ backgroundColor: '#FAF6EC' }}>
            6 MODULES READY
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* 1. AI Tutor Card */}
          <NeoCard
            bg="#C9B8F5"
            style={{
              padding: '26px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '260px',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="neo-badge" style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
                  24/7 MENTOR
                </span>
                <span style={{ fontSize: '36px' }}>💬</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>
                Chat with AI Tutor
              </h3>
              <p style={{ fontSize: '14px', color: '#222', lineHeight: 1.5, fontWeight: 500, marginBottom: '16px' }}>
                Conversational study assistant that answers doubts, solves equations, and remembers chat history.
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {['Explain simpler', 'Give code example', 'Debug my thinking'].map(t => (
                  <span
                    key={t}
                    onClick={() => {
                      onNavigate('AI Tutor', t);
                      toggleQuest('tutor', true);
                    }}
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      border: '1.5px solid #1A1A1A',
                      cursor: 'pointer'
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <NeoButton
              onClick={() => onNavigate('AI Tutor')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span>LAUNCH TUTOR</span>
              <ArrowRight size={16} />
            </NeoButton>
          </NeoCard>

          {/* 2. Topic Explainer Card */}
          <NeoCard
            bg="#8FD6B0"
            style={{
              padding: '26px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '260px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="neo-badge" style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
                  DEEP DIVE
                </span>
                <span style={{ fontSize: '36px' }}>📖</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>
                Structured Topic Breakdown
              </h3>
              <p style={{ fontSize: '14px', color: '#222', lineHeight: 1.5, fontWeight: 500, marginBottom: '16px' }}>
                Master complex concepts through analogies, intuitive definitions, real-world examples, and syntax.
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {['Recursion', 'Binary Trees', 'Docker', 'SQL Joins'].map(topic => (
                  <span
                    key={topic}
                    onClick={() => onNavigate('Topics', topic)}
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      border: '1.5px solid #1A1A1A',
                      cursor: 'pointer'
                    }}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            <NeoButton
              onClick={() => onNavigate('Topics')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span>EXPLORE TOPICS</span>
              <ArrowRight size={16} />
            </NeoButton>
          </NeoCard>

          {/* 3. AI Quiz Master Card */}
          <NeoCard
            bg="#F5D876"
            style={{
              padding: '26px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '260px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="neo-badge" style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
                  ACTIVE RECALL
                </span>
                <span style={{ fontSize: '36px' }}>🎯</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>
                Dynamic AI Quizzes
              </h3>
              <p style={{ fontSize: '14px', color: '#222', lineHeight: 1.5, fontWeight: 500, marginBottom: '16px' }}>
                Instant quizzes generated by AI with detailed answer explanations to test retention.
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {['Beginner', 'Intermediate', 'Advanced'].map(diff => (
                  <span
                    key={diff}
                    onClick={() => {
                      onNavigate('Quizzes');
                      toggleQuest('quiz', true);
                    }}
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      border: '1.5px solid #1A1A1A',
                      cursor: 'pointer'
                    }}
                  >
                    {diff}
                  </span>
                ))}
              </div>
            </div>
            <NeoButton
              action
              onClick={() => {
                onNavigate('Quizzes');
                toggleQuest('quiz', true);
              }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span>START A QUIZ 🚀</span>
            </NeoButton>
          </NeoCard>

          {/* 4. Code Explainer Card */}
          <NeoCard
            bg="#F5A868"
            style={{
              padding: '26px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '260px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="neo-badge" style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
                  SYNTAX & BUGS
                </span>
                <span style={{ fontSize: '36px' }}>🛠️</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>
                Code & Complexity Inspector
              </h3>
              <p style={{ fontSize: '14px', color: '#222', lineHeight: 1.5, fontWeight: 500, marginBottom: '16px' }}>
                Paste any code snippet for line-by-line breakdowns, Big-O runtime analysis, and bug detection.
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {['Java', 'Python', 'C++', 'JavaScript'].map(lang => (
                  <span
                    key={lang}
                    onClick={() => onNavigate('Code')}
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      border: '1.5px solid #1A1A1A',
                      cursor: 'pointer'
                    }}
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
            <NeoButton
              onClick={() => onNavigate('Code')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span>ANALYZE CODE</span>
              <ArrowRight size={16} />
            </NeoButton>
          </NeoCard>

          {/* 5. Algorithm Visualizer Card */}
          <NeoCard
            bg="#7BDFF2"
            style={{
              padding: '26px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '260px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="neo-badge" style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
                  INTERACTIVE CANVAS
                </span>
                <span style={{ fontSize: '36px' }}>🎨</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>
                Algorithm & Diagram Canvas
              </h3>
              <p style={{ fontSize: '14px', color: '#222', lineHeight: 1.5, fontWeight: 500, marginBottom: '16px' }}>
                Interactive visualizer for data structures, trees, graph algorithms, and architectural concepts.
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {['Binary Search', 'Graph DFS', 'Tree Traversal'].map(algo => (
                  <span
                    key={algo}
                    onClick={() => onNavigate('Visualize')}
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      padding: '4px 10px',
                      borderRadius: '100px',
                      border: '1.5px solid #1A1A1A',
                      cursor: 'pointer'
                    }}
                  >
                    {algo}
                  </span>
                ))}
              </div>
            </div>
            <NeoButton
              onClick={() => onNavigate('Visualize')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span>OPEN VISUALIZER</span>
              <ArrowRight size={16} />
            </NeoButton>
          </NeoCard>

          {/* 6. Quick Scratchpad & Notes Card */}
          <NeoCard
            bg="#FFAAA6"
            style={{
              padding: '26px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '260px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="neo-badge" style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
                  QUICK CAPTURE
                </span>
                <span style={{ fontSize: '36px' }}>📝</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>
                Smart Scratchpad
              </h3>
              <p style={{ fontSize: '14px', color: '#222', lineHeight: 1.5, fontWeight: 500, marginBottom: '12px' }}>
                Capture an insight on the fly right here without losing your study momentum.
              </p>

              {/* Quick Note Input Inline */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="Type a quick insight to save..."
                  value={quickNoteText}
                  onChange={e => setQuickNoteText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveQuickNote()}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '2px solid #1A1A1A',
                    fontSize: '13px',
                    outline: 'none',
                    fontWeight: 600
                  }}
                />
                <button
                  onClick={handleSaveQuickNote}
                  className="neo-shadow-sm"
                  disabled={quickNoteSaving}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '2px solid #1A1A1A',
                    backgroundColor: quickNoteSuccess ? '#8FD6B0' : '#1A1A1A',
                    color: quickNoteSuccess ? '#1A1A1A' : '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {quickNoteSuccess ? 'SAVED ✔' : quickNoteSaving ? '...' : '+ SAVE'}
                </button>
              </div>
            </div>
            <NeoButton
              onClick={() => onNavigate('Notes')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span>VIEW ALL NOTES ({notesCount})</span>
              <ArrowRight size={16} />
            </NeoButton>
          </NeoCard>

        </div>
      </div>

      {/* ── 6. RECENT ACTIVITY & WEAK TOPIC RECOMMENDATION DRAWER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Recommended Focus Area */}
        <NeoCard bg="#FFF9E6" style={{ padding: '22px', borderRadius: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>💡</span>
              <h4 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }}>
                RECOMMENDED FOCUS TARGET
              </h4>
            </div>
            {weakTopic ? (
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '6px' }}>
                  🎯 Topic: <span style={{ textDecoration: 'underline' }}>{weakTopic.topicName}</span>
                </p>
                <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
                  Your current mastery is at <strong>{weakTopic.masteryPct}%</strong>. Taking another practice quiz will help push this topic into your strong zone!
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '6px' }}>
                  🎯 Algorithm Foundations & System Design
                </p>
                <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
                  Everything is looking strong! Consider tackling advanced topics like distributed cache consistency or tree balancing.
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (weakTopic) onNavigate('Quizzes', weakTopic.topicName);
              else onNavigate('Topics', 'System Design');
            }}
            className="neo-shadow-sm"
            style={{
              marginTop: '16px',
              padding: '10px 16px',
              borderRadius: '10px',
              border: '2px solid #1A1A1A',
              backgroundColor: '#8FD6B0',
              color: '#1A1A1A',
              fontWeight: 900,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            PRACTICE THIS TOPIC NOW →
          </button>
        </NeoCard>

        {/* Recent Notes Preview */}
        <NeoCard bg="#FFFFFF" style={{ padding: '22px', borderRadius: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#1A1A1A" />
                <h4 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase' }}>
                  RECENT NOTES PREVIEW
                </h4>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#888' }}>
                {notesCount} TOTAL
              </span>
            </div>

            {recentNotes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentNotes.map((n, i) => (
                  <div
                    key={n.id || i}
                    onClick={() => onNavigate('Notes')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '2px solid #1A1A1A',
                      backgroundColor: ['#C9B8F5', '#8FD6B0', '#F5D876'][i % 3],
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                      {n.title || 'Untitled Note'}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', backgroundColor: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', border: '1px solid #1A1A1A' }}>
                      {n.topic || 'Note'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#666', fontStyle: 'italic', padding: '10px 0' }}>
                No notes captured yet. Use the scratchpad or Notes tab to start building your knowledge base!
              </p>
            )}
          </div>

          <button
            onClick={() => onNavigate('Notes')}
            className="neo-shadow-sm"
            style={{
              marginTop: '16px',
              padding: '10px 16px',
              borderRadius: '10px',
              border: '2px solid #1A1A1A',
              backgroundColor: '#1A1A1A',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            OPEN COMPLETE NOTE VAULT →
          </button>
        </NeoCard>

      </div>

    </div>
  );
};

export default DashboardView;
