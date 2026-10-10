import React, { useState, useEffect } from 'react';
import NeoCard from '../components/NeoCard';
import NeoButton from '../components/NeoButton';

const SECTION_COLORS = {
  '📌': '#C9B8F5',
  '💡': '#F5D876',
  '🔑': '#8FD6B0',
  '📦': '#F5A868',
  '💻': '#1A1A1A',
  '⚡': '#C9B8F5',
  '⚠️': '#FFCDD2',
};

// Renders a single line: bold (**text**), inline code (`text`), bullet (• or -)
const renderLine = (line, i) => {
  if (!line.trim()) return <div key={i} style={{ height: '8px' }} />;

  let html = line
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.1);padding:2px 8px;border-radius:6px;font-family:monospace;font-size:13px;font-weight:bold">$1</code>');

  const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().match(/^\d+\./);
  return (
    <div key={i} style={{
      marginBottom: '6px',
      marginLeft: isBullet ? '4px' : '0',
      fontSize: '15px',
      lineHeight: '1.7',
      display: 'flex',
      gap: isBullet ? '8px' : '0'
    }}>
      {isBullet && <span style={{ flexShrink: 0, marginTop: '2px' }}>→</span>}
      <span dangerouslySetInnerHTML={{ __html: html.replace(/^[•\-]\s*/, '') }} />
    </div>
  );
};

// Splits content into sections and renders each with its own styled card
const renderContent = (text) => {
  if (!text) return null;

  // Split into fenced code blocks vs text blocks
  const codeBlockRegex = /(```[\s\S]*?```)/g;
  const parts = text.split(codeBlockRegex);

  return parts.map((part, pi) => {
    // Code block
    if (part.startsWith('```') && part.endsWith('```')) {
      const lines = part.slice(3, -3).split('\n');
      const lang = lines[0].trim();
      const code = lines.slice(1).join('\n');
      return (
        <div key={pi} style={{
          backgroundColor: '#1A1A1A', color: '#E0E0E0',
          padding: '20px', borderRadius: '12px', margin: '12px 0',
          overflowX: 'auto', border: '3px solid #333', fontFamily: 'monospace'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#8FD6B0', fontWeight: 'bold', textTransform: 'uppercase' }}>{lang || 'CODE'}</span>
            <span style={{ fontSize: '12px', color: '#888', cursor: 'pointer' }}
              onClick={() => { navigator.clipboard.writeText(code); }}>📋 Copy</span>
          </div>
          <pre style={{ margin: 0, fontSize: '14px', lineHeight: '1.7' }}><code>{code}</code></pre>
        </div>
      );
    }

    // Text block — split by emoji section headers
    const sectionRegex = /^(📌|💡|🔑|📦|💻|⚡|⚠️)\s+(.+)/m;
    const sectionSplitRegex = /(?=^(?:📌|💡|🔑|📦|💻|⚡|⚠️)\s)/m;
    const sections = part.split(new RegExp(sectionSplitRegex, 'mg')).filter(s => s.trim());

    return sections.map((section, si) => {
      const headerMatch = section.match(/^(📌|💡|🔑|📦|💻|⚡|⚠️)\s+(.+)/);
      if (headerMatch) {
        const emoji = headerMatch[1];
        const heading = headerMatch[2].split('\n')[0];
        const bodyLines = section.replace(/^(📌|💡|🔑|📦|💻|⚡|⚠️)\s+.+\n?/, '').split('\n');
        const bg = SECTION_COLORS[emoji] || '#FFFFFF';
        return (
          <div key={`${pi}-${si}`} style={{
            backgroundColor: emoji === '💻' ? '#1A1A1A' : bg,
            color: emoji === '💻' ? '#E0E0E0' : '#1A1A1A',
            borderRadius: '14px', padding: '20px 24px',
            border: '2.5px solid #1A1A1A',
            boxShadow: '3px 3px 0 #1A1A1A',
            marginBottom: '2px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '22px' }}>{emoji}</span>
              <span style={{ fontWeight: 900, fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{heading}</span>
            </div>
            <div>{bodyLines.map((line, li) => renderLine(line, li))}</div>
          </div>
        );
      }
      // Plain text without section header
      const lines = section.split('\n');
      return (
        <div key={`${pi}-${si}`} style={{ padding: '4px 0' }}>
          {lines.map((line, li) => renderLine(line, li))}
        </div>
      );
    });
  });
};

const EXPLAIN_MODES = [
  { label: '🧒 SIMPLER', suffix: 'Explain it as if I am 10 years old, using very simple words and a fun analogy.' },
  { label: '🔍 WITH ANALOGY', suffix: 'Focus on giving a detailed, creative real-world analogy that makes this concept crystal clear.' },
  { label: '📋 STEP-BY-STEP', suffix: 'Explain this as a step-by-step process, numbered clearly, as if teaching someone who is completely new.' },
  { label: '💻 WITH CODE', suffix: 'Include code examples in Java showing how this concept is implemented. Walk through each line.' },
  { label: '🎯 INTERVIEW PREP', suffix: 'Give me the key interview questions and answers related to this topic, with what interviewers expect to hear.' },
];

const TopicExplainerView = ({ user }) => {
  const [topic, setTopic] = useState(() => localStorage.getItem('sm_topic_text') || '');
  const [level, setLevel] = useState(() => localStorage.getItem('sm_topic_level') || 'Beginner');
  const [explanation, setExplanation] = useState(() => {
    try {
      const saved = localStorage.getItem('sm_topic_explanation');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState(() => localStorage.getItem('sm_topic_mode') || null);

  useEffect(() => {
    localStorage.setItem('sm_topic_text', topic);
  }, [topic]);

  useEffect(() => {
    localStorage.setItem('sm_topic_level', level);
  }, [level]);

  useEffect(() => {
    if (explanation) {
      localStorage.setItem('sm_topic_explanation', JSON.stringify(explanation));
    } else {
      localStorage.removeItem('sm_topic_explanation');
    }
  }, [explanation]);

  useEffect(() => {
    if (activeMode) {
      localStorage.setItem('sm_topic_mode', activeMode);
    } else {
      localStorage.removeItem('sm_topic_mode');
    }
  }, [activeMode]);

  const fetchExplanation = async (topicVal, levelVal, suffix = '') => {
    setLoading(true);
    setExplanation(null);
    setActiveMode(suffix);
    try {
      const currentTopic = (topicVal || 'Binary Search Tree') + (suffix ? '. ' + suffix : '');
      const response = await fetch(`http://localhost:8080/api/ai/explain?topic=${encodeURIComponent(currentTopic)}&level=${encodeURIComponent(levelVal)}`);
      const data = await response.text();
      setExplanation({ title: `${topicVal || 'Binary Search Tree'} (${levelVal})`, content: data });
    } catch (error) {
      setExplanation({ title: 'ERROR ⚠️', content: '⚠️ Failed to connect to backend: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTopic('');
    setExplanation(null);
    setActiveMode(null);
    localStorage.removeItem('sm_topic_text');
    localStorage.removeItem('sm_topic_explanation');
    localStorage.removeItem('sm_topic_mode');
  };

  const handleExplain = () => fetchExplanation(topic, level, '');
  const handleMode = (mode) => fetchExplanation(topic, level, mode.suffix);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px' }}>TOPIC EXPLAINER 📚</h1>
        {(topic || explanation) && (
          <button
            onClick={handleClear}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: '#FFCDD2',
              border: '2px solid #1A1A1A',
              fontWeight: 900,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: '2px 2px 0 #1A1A1A'
            }}
            title="Clear topic and explanation"
          >
            CLEAR
          </button>
        )}
      </div>

      {/* Controls */}
      <NeoCard bg="#FFFFFF" style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '240px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '13px' }}>TOPIC</label>
          <input
            type="text"
            className="neo-input"
            placeholder="e.g. JVM, OOP, Binary Search, HashMap..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleExplain()}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '13px' }}>LEVEL</label>
          <select className="neo-input" style={{ padding: '12px 16px' }} value={level} onChange={e => setLevel(e.target.value)}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
        <NeoButton action onClick={handleExplain} disabled={loading}>
          {loading ? 'LOADING...' : 'EXPLAIN →'}
        </NeoButton>
      </NeoCard>

      {/* Loading state */}
      {loading && (
        <NeoCard bg="#F5F5F5" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', marginBottom: '12px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#C9B8F5', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <div style={{ fontWeight: 'bold', color: '#555' }}>Generating explanation for <strong>{topic || 'Binary Search Tree'}</strong>...</div>
        </NeoCard>
      )}

      {/* Explanation */}
      {explanation && !loading && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900 }}>{explanation.title}</h2>
          </div>

          {/* Rendered content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {renderContent(explanation.content)}
          </div>

          {/* Explain differently */}
          <NeoCard bg="#FFFFFF">
            <div style={{ fontWeight: 900, fontSize: '13px', marginBottom: '12px' }}>EXPLAIN DIFFERENTLY:</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {EXPLAIN_MODES.map(mode => (
                <span key={mode.label}
                  onClick={() => handleMode(mode)}
                  className="neo-shadow-sm"
                  style={{
                    padding: '8px 18px', borderRadius: '100px', cursor: 'pointer', fontWeight: 'bold',
                    fontSize: '13px', whiteSpace: 'nowrap', transition: 'all 0.15s',
                    backgroundColor: activeMode === mode.suffix ? '#1A1A1A' : 'white',
                    color: activeMode === mode.suffix ? 'white' : '#1A1A1A',
                    border: '2px solid #1A1A1A'
                  }}>
                  {mode.label}
                </span>
              ))}
            </div>
          </NeoCard>
        </>
      )}

      {/* Empty state */}
      {!explanation && !loading && (
        <NeoCard bg="#FFFFFF" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <h3 style={{ fontWeight: 900, marginBottom: '8px' }}>Enter any topic above</h3>
          <p style={{ color: '#555' }}>Try: JVM, Binary Search, OOP, HashMap, Recursion, Threads, SQL Joins...</p>
        </NeoCard>
      )}

      <style>{`@keyframes pulse { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  );
};

export default TopicExplainerView;

