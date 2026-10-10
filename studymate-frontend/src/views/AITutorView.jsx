import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';

/* ─── SVG Icons ─────────────────────────────────────────────────── */
const CopyIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const ThumbUpIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>;
const ThumbDnIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>;
const RefreshIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const SendIcon    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const PlusIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

const INLINE_CODE = `background:#F5A868;color:#1A1A1A;padding:2px 7px;border:2px solid #1a1a1a;border-radius:4px;font-family:'Fira Mono','Courier New',monospace;font-size:0.88em;font-weight:bold;`;

function formatLine(line) {
  return line
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1A1A1A;font-weight:900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="' + INLINE_CODE + '">$1</code>');
}

function renderMessage(text) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const inner = part.slice(3, -3);
      const firstNL = inner.indexOf('\n');
      const lang = firstNL !== -1 ? inner.slice(0, firstNL).trim() : '';
      const code = firstNL !== -1 ? inner.slice(firstNL + 1) : inner;
      return (
        <div key={index} className="neo-shadow" style={{ margin: '14px 0', borderRadius: '8px', overflow: 'hidden', border: '3px solid #1a1a1a', background: '#FDF7E3' }}>
          {lang && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', background: '#C9B8F5', borderBottom: '3px solid #1a1a1a' }}>
              <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 900, fontFamily: 'monospace' }}>{lang.toUpperCase()}</span>
              <button onClick={() => navigator.clipboard.writeText(code)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#1a1a1a', cursor: 'pointer', fontSize: '13px', fontWeight: 900, fontFamily: 'inherit' }}>
                <CopyIcon /> COPY
              </button>
            </div>
          )}
          <pre style={{ margin: 0, padding: '16px', fontFamily: "'Fira Mono','Courier New',monospace", fontSize: '14.5px', lineHeight: '1.65', color: '#1a1a1a', overflowX: 'auto', fontWeight: 600 }}>
            <code>{code}</code>
          </pre>
        </div>
      );
    }
    return (
      <div key={index} style={{ fontSize: '16px', lineHeight: '1.8', color: '#1a1a1a', fontWeight: 500 }}>
        {part.split('\n').map((line, i) => {
          if (line.startsWith('### '))
            return <p key={i} style={{ margin: '16px 0 6px', fontWeight: 900, fontSize: '17px', color: '#1a1a1a' }} dangerouslySetInnerHTML={{ __html: formatLine(line.replace('### ', '')) }} />;
          if (line.startsWith('## '))
            return <p key={i} style={{ margin: '18px 0 6px', fontWeight: 900, fontSize: '19px', color: '#1a1a1a', borderBottom: '3px solid #1a1a1a', paddingBottom: '6px' }} dangerouslySetInnerHTML={{ __html: formatLine(line.replace('## ', '')) }} />;
          if (line.startsWith('# '))
            return <p key={i} style={{ margin: '18px 0 8px', fontWeight: 900, fontSize: '22px', color: '#1a1a1a' }} dangerouslySetInnerHTML={{ __html: formatLine(line.replace('# ', '')) }} />;
          if (line.trim() === '---')
            return <div key={i} style={{ height: '3px', background: '#1a1a1a', margin: '14px 0' }} />;
          const fmt = formatLine(line);
          if (line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('\u2022 '))
            return (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '7px', paddingLeft: '4px' }}>
                <span style={{ color: '#1a1a1a', marginTop: '3px', flexShrink: 0, fontWeight: 900 }}>\u2022</span>
                <span dangerouslySetInnerHTML={{ __html: fmt.replace(/^[\u2022\-\*]\s+/, '') }} />
              </div>
            );
          if (line.trim().match(/^\d+\.\s/))
            return <div key={i} style={{ marginBottom: '7px', paddingLeft: '4px', fontWeight: 700 }} dangerouslySetInnerHTML={{ __html: fmt }} />;
          if (line.trim() === '')
            return <div key={i} style={{ height: '8px' }} />;
          return <div key={i} style={{ marginBottom: '4px' }} dangerouslySetInnerHTML={{ __html: fmt }} />;
        })}
      </div>
    );
  });
}

const QUICK_ACTIONS = ['EXPLAIN SIMPLER', 'GIVE AN EXAMPLE', 'SHOW WITH CODE', 'COMPARE', 'TEST ME'];

const AITutorView = ({ user, initialQuestion, messages, setMessages }) => {
  const [input, setInput] = useState(initialQuestion || '');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [showScrollDown, setShowScrollDown] = useState(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () =>
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });

  const handleScroll = () => {
    if (!chatRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
  };

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { if (initialQuestion?.trim()) handleAsk(initialQuestion); }, []);

  const handleAsk = async (override) => {
    const q = typeof override === 'string' ? override : input;
    if (!q.trim() || loading) return;
    const recent = messages.filter(m => m.sender !== 'SYSTEM').slice(-4);
    const ctx = recent.length
      ? 'Conversation history:\n' + recent.map(m => `${m.sender}: ${m.text.substring(0, 400)}`).join('\n\n') + '\n\nFollow-up: '
      : '';
    setMessages(prev => [...prev, { sender: 'YOU', text: q }]);
    if (typeof override !== 'string') setInput('');
    setLoading(true);
    try {
      const data = await api.ask(ctx + q);
      setMessages(prev => [...prev, { sender: 'AI', text: data }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'SYSTEM', text: 'Could not reach the backend. Make sure Spring Boot is running on port 8080.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleNewChat = () => {
    setMessages([{
      sender: 'AI',
      text: "Hello! I'm **StudyMate AI** \u2014 your personal CS tutor. How can I help you today?"
    }]);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FFF8E7', color: '#1A1A1A', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '3px solid #1a1a1a', background: '#F5D876', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🤖</span>
          <span style={{ fontWeight: 900, fontSize: '18px', color: '#1a1a1a', letterSpacing: '-0.3px', textTransform: 'uppercase' }}>StudyMate AI</span>
          <span className="neo-shadow-sm" style={{ fontSize: '12px', fontWeight: 900, background: '#8FD6B0', color: '#1a1a1a', padding: '4px 10px', borderRadius: '4px', border: '2px solid #1a1a1a' }}>CS TUTOR</span>
        </div>
        <button className="neo-shadow-sm" onClick={handleNewChat} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#FFF', border: '3px solid #1a1a1a', borderRadius: '6px', color: '#1a1a1a', padding: '7px 14px', cursor: 'pointer', fontSize: '14px', fontWeight: 900, fontFamily: 'inherit' }}>
          <PlusIcon /> NEW CHAT
        </button>
      </div>

      {/* Messages */}
      <div ref={chatRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: '28px 0 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'YOU';
          const isSystem = msg.sender === 'SYSTEM';

          if (isUser) return (
            <div key={idx} style={{ width: '100%', maxWidth: '740px', padding: '0 24px', marginBottom: '28px', display: 'flex', justifyContent: 'flex-end' }}>
              <div className="neo-shadow" style={{ background: '#8FD6B0', border: '3px solid #1a1a1a', borderRadius: '8px', padding: '13px 18px', maxWidth: '78%', fontSize: '16px', lineHeight: '1.65', color: '#1a1a1a', fontWeight: 700 }}>
                {msg.text}
              </div>
            </div>
          );

          if (isSystem) return (
            <div key={idx} style={{ width: '100%', maxWidth: '740px', padding: '0 24px', marginBottom: '24px' }}>
              <div className="neo-shadow" style={{ background: '#FF6B6B', border: '3px solid #1a1a1a', borderRadius: '8px', padding: '12px 16px', color: '#fff', fontSize: '14px', fontWeight: 800 }}>
                ⚠️ {msg.text}
              </div>
            </div>
          );

          const isLastMessage = idx === messages.length - 1;

          return (
            <div key={idx} style={{ width: '100%', maxWidth: '740px', padding: '0 24px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0, background: '#C9B8F5', border: '3px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '2px 2px 0px #1A1A1A' }}>🤖</div>
                <span style={{ fontWeight: 900, fontSize: '15px', color: '#1a1a1a', textTransform: 'uppercase' }}>StudyMate AI</span>
              </div>
              <div style={{ paddingLeft: '46px' }}>
                {renderMessage(msg.text)}
                
                {isLastMessage && !loading && (
                  <>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '18px', flexWrap: 'wrap' }}>
                      {QUICK_ACTIONS.map(action => (
                        <button key={action} onClick={() => handleAsk(action)} style={{ background: '#FFF', border: '2px solid #1a1a1a', borderRadius: '4px', color: '#1a1a1a', padding: '6px 14px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', boxShadow: '2px 2px 0px #1A1A1A' }}>
                          {action}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      {[
                        { icon: <CopyIcon />, label: 'COPY', fn: () => handleCopy(msg.text, idx), bg: '#FFF' },
                        { icon: <ThumbUpIcon />, label: 'GOOD', fn: () => setFeedback(prev => ({ ...prev, [idx]: 'up' })), bg: feedback[idx] === 'up' ? '#8FD6B0' : '#FFF' },
                        { icon: <ThumbDnIcon />, label: 'BAD', fn: () => setFeedback(prev => ({ ...prev, [idx]: 'down' })), bg: feedback[idx] === 'down' ? '#FFCDD2' : '#FFF' },
                        { icon: <RefreshIcon />, label: 'REGENERATE', fn: () => handleAsk(messages.slice(0, idx).filter(m => m.sender === 'YOU').at(-1)?.text || ''), bg: '#FFF' },
                      ].map(({ icon, label, fn, bg }) => (
                        <button key={label} title={label} onClick={fn} style={{ background: bg, border: '2px solid #1a1a1a', color: '#1a1a1a', cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontWeight: 900, fontSize: '12px', boxShadow: '2px 2px 0px #1A1A1A', transition: 'background 0.2s' }}>
                          {icon}
                          {copiedIdx === idx && label === 'COPY' && <span style={{ fontSize: '11px', color: '#1a1a1a', fontWeight: 900 }}>COPIED!</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ width: '100%', maxWidth: '740px', padding: '0 24px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#C9B8F5', border: '3px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '2px 2px 0px #1A1A1A' }}>🤖</div>
              <span style={{ fontWeight: 900, fontSize: '15px', color: '#1a1a1a', textTransform: 'uppercase' }}>StudyMate AI</span>
            </div>
            <div style={{ paddingLeft: '46px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1a1a1a', animation: `gptDot 1.4s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div style={{ height: '140px' }} />
      </div>

      {/* Bottom input */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '24px 20px 24px', background: 'linear-gradient(to top, #FFF8E7 85%, transparent)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', zIndex: 10 }}>
        {showScrollDown && (
          <button 
            onClick={scrollToBottom}
            className="neo-shadow"
            style={{ pointerEvents: 'auto', marginBottom: '16px', background: '#FFF', border: '3px solid #1a1a1a', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1a1a1a' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        )}
        <div className="neo-shadow" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '740px', background: '#FFF', border: '3px solid #1A1A1A', borderRadius: '8px', padding: '8px 12px 8px 18px' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAsk()}
            placeholder="ASK STUDYMATE AI ANYTHING..."
            disabled={loading}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#1a1a1a', fontSize: '16px', fontFamily: 'inherit', fontWeight: 700 }}
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || !input.trim()}
            style={{ width: '42px', height: '42px', borderRadius: '6px', flexShrink: 0, background: input.trim() && !loading ? '#F5A868' : '#e0e0e0', border: '3px solid #1A1A1A', cursor: input.trim() && !loading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a1a', transition: 'background 0.15s' }}>
            <SendIcon />
          </button>
        </div>
        <p style={{ pointerEvents: 'auto', margin: '12px 0 0', fontSize: '13px', color: '#1a1a1a', textAlign: 'center', fontWeight: 800 }}>
          STUDYMATE AI CAN MAKE MISTAKES. VERIFY IMPORTANT INFORMATION.
        </p>
      </div>

      <style>{`
        @keyframes gptDot { 0%,60%,100%{transform:scale(0.7);opacity:0.4} 30%{transform:scale(1.1);opacity:1} }
        ::-webkit-scrollbar { width: 12px; }
        ::-webkit-scrollbar-track { background: #FFF8E7; border-left: 3px solid #1a1a1a; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border: 2px solid #FFF8E7; border-radius: 6px; }
      `}</style>
    </div>
  );
};

export default AITutorView;
