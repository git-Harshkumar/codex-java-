import React, { useState, useEffect } from 'react';
import NeoCard from '../components/NeoCard';
import NeoButton from '../components/NeoButton';
import { api } from '../api';

const ProgressView = ({ user, activeTab }) => {
  const userId = user?.id || 1;
  const [progress, setProgress] = useState([]);
  const [stats, setStats] = useState({ totalTopics: 0, totalQuestions: 0, avgScore: 0, streak: 7 });

  useEffect(() => {
    if (activeTab === 'Progress' || !activeTab) {
      api.getProgress(userId).then(data => setProgress(Array.isArray(data) ? data : [])).catch(() => setProgress([]));
      api.getStats(userId).then(setStats).catch(() => {});
    }
  }, [userId, activeTab]);

  const safeProgress = Array.isArray(progress) ? progress : [];
  const strong = safeProgress.filter(p => p.masteryPct >= 70);
  const weak = safeProgress.filter(p => p.masteryPct < 70);
  const recommended = weak.length > 0 ? weak[weak.length - 1] : null;

  const StatCard = ({ title, value, color }) => (
    <NeoCard bg={color} style={{ flex: 1 }}>
      <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '13px' }}>{title}</div>
      <div style={{ fontSize: '42px', fontWeight: 900 }}>{value}</div>
    </NeoCard>
  );

  const ProgressRow = ({ label, pct }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
      <div style={{ width: '120px', fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ flex: 1, height: '20px', backgroundColor: '#E0E0E0', borderRadius: '10px', overflow: 'hidden', border: '2px solid #1A1A1A' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct >= 70 ? '#8FD6B0' : '#F5A868', transition: 'width 0.5s ease' }}></div>
      </div>
      <div style={{ width: '40px', fontWeight: 'bold', fontSize: '13px', textAlign: 'right' }}>{pct}%</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <h1 style={{ fontSize: '32px' }}>YOUR PROGRESS 📈</h1>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <StatCard title="TOPICS STUDIED" value={stats.totalTopics || progress.length} color="#C9B8F5" />
        <StatCard title="STUDY STREAK" value={`${stats.streak || 7} 🔥`} color="#F5D876" />
        <StatCard title="QUIZ AVERAGE" value={`${stats.avgScore || 0}%`} color="#F5A868" />
        <StatCard title="QUESTIONS" value={stats.totalQuestions || 0} color="#8FD6B0" />
      </div>

      {progress.length === 0 ? (
        <NeoCard bg="#FFFFFF" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ fontWeight: 900 }}>No progress recorded yet</h3>
          <p style={{ color: '#555', marginTop: '8px' }}>Take a quiz to start tracking your progress!</p>
        </NeoCard>
      ) : (
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900 }}>STRONG TOPICS 💪</h2>
            <NeoCard bg="#FFFFFF" style={{ display: 'flex', flexDirection: 'column' }}>
              {strong.length > 0 ? strong.map(p => (
                <ProgressRow key={p.id} label={p.topicName} pct={p.masteryPct} />
              )) : <p style={{ color: '#888', padding: '12px 0' }}>No strong topics yet — keep practicing!</p>}
            </NeoCard>
          </div>

          <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 900 }}>NEEDS PRACTICE ⚠️</h2>
            <NeoCard bg="#FFFFFF" style={{ display: 'flex', flexDirection: 'column' }}>
              {weak.length > 0 ? weak.map(p => (
                <ProgressRow key={p.id} label={p.topicName} pct={p.masteryPct} />
              )) : <p style={{ color: '#888', padding: '12px 0' }}>Everything looks great! 🎉</p>}
            </NeoCard>
          </div>
        </div>
      )}

      {recommended && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>RECOMMENDED NEXT STEP</h2>
          <NeoCard bg="#C9B8F5">
            <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>🎯 {recommended.topicName}</h3>
            <p style={{ marginBottom: '20px' }}>
              Your mastery is at {recommended.masteryPct}%. Practice more questions to improve!
            </p>
            <NeoButton action>TAKE A QUIZ ON THIS TOPIC →</NeoButton>
          </NeoCard>
        </div>
      )}
    </div>
  );
};

export default ProgressView;
