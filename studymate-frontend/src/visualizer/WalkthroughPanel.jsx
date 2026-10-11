/**
 * WalkthroughPanel.jsx
 * Step-by-step walkthrough: Previous / Next / Play / Pause / Restart
 * Calls onHighlight(ids) to sync canvas highlighting.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const Btn = ({ onClick, disabled, children, primary, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      padding: '8px 16px',
      background: disabled ? '#E0E0E0' : primary ? '#F5A868' : '#FFFFFF',
      color: disabled ? '#999' : '#1A1A1A',
      border: '2.5px solid #1A1A1A',
      borderRadius: '100px',
      fontWeight: 900, fontSize: 12,
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '2px 2px 0 #1A1A1A',
      transition: 'all 0.15s',
      fontFamily: 'inherit',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </button>
);

const WalkthroughPanel = ({ steps = [], onHighlight }) => {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const current = steps[idx] || null;

  // Sync highlight whenever idx changes
  useEffect(() => {
    onHighlight && onHighlight(current?.ids || []);
  }, [idx, current, onHighlight]);

  // Reset to 0 when steps array changes (new diagram loaded)
  useEffect(() => {
    setIdx(0);
    setPlaying(false);
  }, [steps]);

  // Auto-advance when playing
  useEffect(() => {
    clearInterval(timerRef.current);
    if (playing) {
      timerRef.current = setInterval(() => {
        setIdx(prev => {
          if (prev >= steps.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1600);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, steps.length]);

  const prev    = useCallback(() => { setPlaying(false); setIdx(i => Math.max(0, i - 1)); }, []);
  const next    = useCallback(() => { setPlaying(false); setIdx(i => Math.min(steps.length - 1, i + 1)); }, [steps.length]);
  const restart = useCallback(() => { setPlaying(false); setIdx(0); }, []);
  const togglePlay = useCallback(() => {
    if (idx >= steps.length - 1) setIdx(0);
    setPlaying(p => !p);
  }, [idx, steps.length]);

  if (!steps.length) return null;

  const progress = steps.length > 1 ? (idx / (steps.length - 1)) * 100 : 100;

  return (
    <div style={{
      background: '#FFF8E7',
      border: '3px solid #1A1A1A',
      borderRadius: '18px',
      padding: '20px',
      boxShadow: '4px 4px 0 #1A1A1A',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>👣</span>
        <span style={{ fontWeight: 900, fontSize: 15, textTransform: 'uppercase', letterSpacing: '-0.3px' }}>
          Step-by-Step Walkthrough
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 11, fontWeight: 900,
          background: '#C9B8F5', color: '#1A1A1A',
          padding: '3px 10px', borderRadius: '100px', border: '2px solid #1A1A1A',
        }}>
          {idx + 1} / {steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: '#E0E0E0', borderRadius: 100, border: '2px solid #1A1A1A', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: '#F5A868', borderRadius: 100, transition: 'width 0.3s ease' }} />
      </div>

      {/* Current step */}
      {current && (
        <div style={{ background: '#FFFFFF', border: '3px solid #1A1A1A', borderRadius: 12, padding: '14px 16px', boxShadow: '3px 3px 0 #1A1A1A' }}>
          <div style={{ fontWeight: 900, fontSize: 14, color: '#1A1A1A', marginBottom: 8 }}>
            {current.label}
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: '#333', margin: 0, fontWeight: 500 }}>
            {current.explain}
          </p>
          {current.ids?.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {current.ids.map(id => (
                <span key={id} style={{
                  fontSize: 11, fontWeight: 900,
                  background: '#F5A868', color: '#1A1A1A',
                  padding: '2px 9px', borderRadius: '100px', border: '2px solid #1A1A1A',
                }}>
                  {id}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Btn onClick={restart} title="Restart">⟳ Restart</Btn>
        <Btn onClick={prev}    disabled={idx === 0} title="Previous">← Prev</Btn>
        <Btn onClick={togglePlay} primary title={playing ? 'Pause' : 'Play'}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </Btn>
        <Btn onClick={next} disabled={idx >= steps.length - 1} title="Next">Next →</Btn>
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => { setPlaying(false); setIdx(i); }}
            title={s.label}
            style={{
              width: i === idx ? 22 : 10, height: 10,
              background: i === idx ? '#F5A868' : i < idx ? '#8FD6B0' : '#E0E0E0',
              border: '2px solid #1A1A1A',
              borderRadius: '100px',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.2s',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default WalkthroughPanel;
