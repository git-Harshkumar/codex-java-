/**
 * AIQAPanel.jsx
 *
 * Collapsible AI assistant slide-out panel.
 *
 * Exports TWO things:
 *   1. <AIAssistantDrawer meta={} isOpen={} onClose={} />   — the slide-out panel itself
 *   2. <AIAssistantTrigger meta={} onClick={} isOpen={} />  — the floating "Ask AI" button
 *
 * The parent (VisualizerView) manages isOpen state and passes meta down.
 * Chat history lives inside this component and survives open/close cycles
 * (state is not reset on unmount because the drawer stays in the DOM).
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';

const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080';

/* ─── tiny markdown renderer ──────────────────────────────────────── */
function RichText({ text }) {
  const lines = text.split('\n');
  return (
    <div style={{ fontSize: 13, lineHeight: 1.75, color: '#1A1A1A', fontWeight: 500 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 5 }} />;
        if (line.startsWith('### '))
          return <p key={i} style={{ fontWeight: 900, fontSize: 14, margin: '9px 0 3px' }}>{line.slice(4)}</p>;
        if (line.startsWith('## '))
          return <p key={i} style={{ fontWeight: 900, fontSize: 15, margin: '11px 0 3px' }}>{line.slice(3)}</p>;
        if (line.startsWith('# '))
          return <p key={i} style={{ fontWeight: 900, fontSize: 16, margin: '12px 0 4px' }}>{line.slice(2)}</p>;
        if (line.trim().match(/^[-*•]\s/))
          return (
            <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 4, paddingLeft: 2 }}>
              <span style={{ fontWeight: 900, flexShrink: 0, color: '#F5A868' }}>•</span>
              <span>{line.replace(/^[-*•]\s/, '')}</span>
            </div>
          );
        if (line.trim().match(/^\d+\.\s/))
          return (
            <div key={i} style={{ marginBottom: 4, paddingLeft: 2, fontWeight: 600 }}>{line}</div>
          );
        return <div key={i} style={{ marginBottom: 3 }}>{line}</div>;
      })}
    </div>
  );
}

/* ─── Loading dots ────────────────────────────────────────────────── */
const TypingDots = () => (
  <div style={{ display: 'flex', gap: 5, padding: '10px 14px', alignItems: 'center' }}>
    <span style={{ fontSize: 12, fontWeight: 700, color: '#888', marginRight: 4 }}>AI is thinking</span>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 7, height: 7, borderRadius: '50%', background: '#C9B8F5',
        border: '1.5px solid #1A1A1A',
        animation: `aiDot 0.8s ease-in-out ${i * 0.18}s infinite alternate`,
      }} />
    ))}
    <style>{`@keyframes aiDot{from{transform:translateY(0);opacity:.4}to{transform:translateY(-6px);opacity:1}}`}</style>
  </div>
);

/* ─── Suggestion chips ────────────────────────────────────────────── */
const FIXED_SUGGESTIONS = [
  "I don't understand this diagram.",
  'Explain this topic from the basics.',
  'Why are these components connected?',
  'Give me a simple real-world example.',
  'Explain step by step.',
  'What is the time complexity?',
];

function getSuggestions(meta) {
  if (!meta) return FIXED_SUGGESTIONS.slice(0, 4);
  return [
    `Explain the ${meta.title} in simple terms.`,
    'Walk me through each component.',
    'Why are these components connected?',
    'Give a real-world example.',
    'What is the time and space complexity?',
    "Explain like I'm a beginner.",
  ];
}

/* ══════════════════════════════════════════════════════════════════
   Floating trigger button
══════════════════════════════════════════════════════════════════ */
export const AIAssistantTrigger = ({ onClick, isOpen, hasDiagram }) => (
  <button
    onClick={onClick}
    title={isOpen ? 'Close AI Assistant' : 'Ask AI about this diagram'}
    style={{
      position: 'fixed',
      right: isOpen ? 384 : 0,         /* shifts left when panel is open */
      bottom: 80,
      zIndex: 1200,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      width: 56,
      height: isOpen ? 56 : 80,
      background: isOpen ? '#1A1A1A' : '#C9B8F5',
      color: '#1A1A1A',
      border: '3px solid #1A1A1A',
      borderRight: isOpen ? '3px solid #1A1A1A' : 'none',
      borderRadius: isOpen ? '12px 0 0 12px' : '12px 0 0 12px',
      cursor: 'pointer',
      boxShadow: '-3px 3px 0 #1A1A1A',
      transition: 'all 0.25s ease',
      fontFamily: "'Inter','Segoe UI',sans-serif",
      padding: '6px 0',
    }}
  >
    <span style={{ fontSize: 22, lineHeight: 1 }}>{isOpen ? '✕' : '🤖'}</span>
    {!isOpen && (
      <span style={{
        fontSize: 9,
        fontWeight: 900,
        color: '#1A1A1A',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        lineHeight: 1.2,
        textAlign: 'center',
        maxWidth: 44,
      }}>
        {hasDiagram ? 'Ask AI' : 'Need\nHelp?'}
      </span>
    )}
    {/* unread dot when diagram is loaded but panel is closed */}
    {!isOpen && hasDiagram && (
      <div style={{
        position: 'absolute',
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        background: '#F5A868',
        border: '1.5px solid #1A1A1A',
        borderRadius: '50%',
      }} />
    )}
  </button>
);

/* ══════════════════════════════════════════════════════════════════
   Slide-out drawer
══════════════════════════════════════════════════════════════════ */
const AIAssistantDrawer = ({ meta, isOpen, onClose }) => {
  const [messages, setMessages]   = useState([]);
  const [input,    setInput]      = useState('');
  const [loading,  setLoading]    = useState(false);
  const inputRef   = useRef(null);
  const bottomRef  = useRef(null);
  const prevMeta   = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  // Inject a context-change notice when the diagram switches
  useEffect(() => {
    if (!meta) return;
    if (prevMeta.current && prevMeta.current.title !== meta.title) {
      setMessages(prev => [...prev, {
        role: 'system',
        text: `📊 Diagram changed to: ${meta.title}`,
      }]);
    }
    prevMeta.current = meta;
  }, [meta]);

  const buildContext = useCallback(() => {
    if (!meta) return 'You are a friendly computer science tutor. ';
    const comps = (meta.components || [])
      .map(c => `  • ${c.name}: ${c.role}`)
      .join('\n');
    return (
      `You are a friendly, beginner-focused CS tutor explaining a diagram called "${meta.title}" ` +
      `(category: ${meta.category}).\n` +
      `Diagram overview: ${meta.description}\n` +
      `Components in this diagram:\n${comps}\n\n` +
      `Explain in simple, clear language — avoid jargon, use analogies. ` +
      `Keep answers concise (3-6 sentences unless detail is asked). ` +
      `Always relate your answer back to the diagram components above.\n\n`
    );
  }, [meta]);

  const sendMessage = useCallback(async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      // Include last 4 messages as context window
      const history = messages
        .filter(m => m.role !== 'system')
        .slice(-4)
        .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text.slice(0, 300)}`)
        .join('\n');
      const fullPrompt =
        buildContext() +
        (history ? `Previous conversation:\n${history}\n\n` : '') +
        `Student question: ${q}`;

      const res = await fetch(`${BASE_URL}/api/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: fullPrompt }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const aiText = await res.text();
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'error',
        text: 'Could not reach the AI backend. Make sure Spring Boot is running on port 8080.',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [input, loading, messages, buildContext]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => setMessages([]);

  const suggestions = getSuggestions(meta);
  const showSuggestions = messages.length === 0;

  // ── Drawer ──────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop on mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            display: 'none',               /* hidden on desktop */
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 1199,
          }}
          className="ai-drawer-backdrop"
        />
      )}

      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 380,
          maxWidth: '100vw',
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          background: '#FAF6EC',
          border: '3px solid #1A1A1A',
          borderRight: 'none',
          borderTop: 'none',
          borderBottom: 'none',
          boxShadow: '-6px 0 0 #1A1A1A',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          fontFamily: "'Inter','Segoe UI',sans-serif",
          overflowY: 'hidden',  /* outer container never scrolls */
        }}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 16px',
          background: '#C9B8F5',
          borderBottom: '3px solid #1A1A1A',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '-0.2px', color: '#1A1A1A' }}>
              Ask AI About This Diagram
            </div>
            {meta && (
              <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginTop: 1 }}>
                Context: {meta.title}
              </div>
            )}
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              title="Clear chat"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 900, color: '#888', padding: '3px 8px', borderRadius: 6 }}
            >
              CLEAR
            </button>
          )}
          <button
            onClick={onClose}
            title="Close panel"
            style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#1A1A1A', color: '#FFFFFF',
              border: '2px solid #1A1A1A', borderRadius: '50%',
              cursor: 'pointer', fontSize: 14, fontWeight: 900,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Message list ─────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 14px 4px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          {/* Empty state / welcome */}
          {messages.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '24px 16px 8px',
              color: '#777',
            }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🤖</div>
              <p style={{ fontWeight: 900, fontSize: 14, color: '#1A1A1A', marginBottom: 6 }}>
                {meta ? `Hi! Ask me anything about "${meta.title}"` : 'Generate a diagram first, then ask me anything!'}
              </p>
              <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.6 }}>
                I'll explain every component, connection, and concept in simple language.
              </p>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && meta && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0 8px' }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: 2 }}>
                Suggested questions
              </span>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    background: '#F5D876',
                    color: '#1A1A1A',
                    border: '2px solid #1A1A1A',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '2px 2px 0 #1A1A1A',
                    transition: 'all 0.12s',
                    lineHeight: 1.4,
                  }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = 'none'; }}
                  onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '2px 2px 0 #1A1A1A'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '2px 2px 0 #1A1A1A'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => {
            if (msg.role === 'system') return (
              <div key={idx} style={{
                textAlign: 'center', fontSize: 11, fontWeight: 700,
                color: '#888', padding: '4px 0',
                borderTop: '1px dashed #DDD', borderBottom: '1px dashed #DDD',
                margin: '4px 0',
              }}>
                {msg.text}
              </div>
            );

            if (msg.role === 'user') return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '82%',
                  background: '#8FD6B0',
                  border: '2.5px solid #1A1A1A',
                  borderRadius: '14px 14px 4px 14px',
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#1A1A1A',
                  boxShadow: '2px 2px 0 #1A1A1A',
                  lineHeight: 1.5,
                }}>
                  {msg.text}
                </div>
              </div>
            );

            if (msg.role === 'error') return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  maxWidth: '90%',
                  background: '#FFE5E5',
                  border: '2.5px solid #1A1A1A',
                  borderRadius: '4px 14px 14px 14px',
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: 12,
                  color: '#c0392b',
                }}>
                  ⚠️ {msg.text}
                </div>
              </div>
            );

            // AI message
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'flex-start', gap: 8, alignItems: 'flex-start' }}>
                {/* Robot avatar */}
                <div style={{
                  width: 28, height: 28, flexShrink: 0,
                  background: '#C9B8F5', border: '2.5px solid #1A1A1A',
                  borderRadius: 8, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14,
                  boxShadow: '2px 2px 0 #1A1A1A',
                  marginTop: 2,
                }}>
                  🤖
                </div>
                <div style={{
                  maxWidth: '85%',
                  background: '#FFFFFF',
                  border: '2.5px solid #1A1A1A',
                  borderRadius: '4px 14px 14px 14px',
                  padding: '10px 14px',
                  boxShadow: '2px 2px 0 #1A1A1A',
                }}>
                  <RichText text={msg.text} />
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8, alignItems: 'flex-start' }}>
              <div style={{
                width: 28, height: 28, flexShrink: 0,
                background: '#C9B8F5', border: '2.5px solid #1A1A1A',
                borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14,
                boxShadow: '2px 2px 0 #1A1A1A', marginTop: 2,
              }}>
                🤖
              </div>
              <div style={{
                background: '#FFFFFF', border: '2.5px solid #1A1A1A',
                borderRadius: '4px 14px 14px 14px',
                boxShadow: '2px 2px 0 #1A1A1A',
              }}>
                <TypingDots />
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          borderTop: '3px solid #1A1A1A',
          background: '#FFFFFF',
          padding: '12px 14px',
        }}>
          {/* Quick-fire chips above input (only when there are messages) */}
          {messages.length > 0 && meta && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
              {['Explain simpler', 'Give an example', 'What next?'].map(chip => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  disabled={loading}
                  style={{
                    fontSize: 10, fontWeight: 900, padding: '4px 10px',
                    background: loading ? '#E0E0E0' : '#F5D876',
                    color: '#1A1A1A', border: '2px solid #1A1A1A',
                    borderRadius: '100px', cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={meta ? 'Ask anything... I\'ll help you understand it' : 'Generate a diagram first...'}
              disabled={loading}
              rows={1}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '2.5px solid #1A1A1A',
                borderRadius: '12px',
                fontSize: 13,
                fontFamily: 'inherit',
                fontWeight: 600,
                outline: 'none',
                resize: 'none',
                background: '#FAF6EC',
                lineHeight: 1.5,
                minHeight: 40,
                maxHeight: 100,
                overflowY: 'auto',
                color: '#1A1A1A',
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              title="Send (Enter)"
              style={{
                width: 40, height: 40, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: (loading || !input.trim()) ? '#E0E0E0' : '#F5A868',
                border: '2.5px solid #1A1A1A',
                borderRadius: '50%',
                cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
                boxShadow: (loading || !input.trim()) ? 'none' : '2px 2px 0 #1A1A1A',
                fontSize: 17, fontWeight: 900, color: '#1A1A1A',
                transition: 'all 0.12s',
              }}
            >
              ↑
            </button>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 10, color: '#AAA', fontWeight: 600, textAlign: 'center' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Responsive mobile styles injected once */}
      <style>{`
        @media (max-width: 640px) {
          .ai-drawer-backdrop { display: block !important; }
        }
        @keyframes aiDot {
          from { transform: translateY(0); opacity: .4; }
          to   { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export { AIAssistantDrawer };
export default AIAssistantDrawer;
