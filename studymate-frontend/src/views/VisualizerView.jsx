/**
 * VisualizerView.jsx — AI-powered interactive diagram experience.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  Title · input field · Generate button                    │
 *   ├──────────────────────────────────────────────────────────┤
 *   │  React Flow Canvas (full width, zoom/pan/fit)             │
 *   ├──────────────────────────────────────────────────────────┤
 *   │  Walkthrough · Operations · Explanation · AI Q&A drawer   │
 *   └──────────────────────────────────────────────────────────┘
 */
import React, { useState, useCallback, useRef } from 'react';
import NeoButton from '../components/NeoButton';
import { api } from '../api';
import DiagramCanvas     from '../visualizer/DiagramCanvas';
import WalkthroughPanel  from '../visualizer/WalkthroughPanel';
import OperationsPanel   from '../visualizer/OperationsPanel';
import AIAssistantDrawer, { AIAssistantTrigger } from '../visualizer/AIQAPanel';
import { buildDiagram } from '../visualizer/diagramEngine';

/* ── shared small button ──────────────────────────────────────────── */
const Btn = ({ onClick, children, color = '#FFFFFF', disabled = false, style: sx = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 18px',
    background: disabled ? '#E0E0E0' : color,
    color: '#1A1A1A',
    border: '2.5px solid #1A1A1A', borderRadius: '100px',
    fontWeight: 900, fontSize: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : '3px 3px 0 #1A1A1A',
    fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
    ...sx,
  }}>
    {children}
  </button>
);

/* ── Loading dots ─────────────────────────────────────────────────── */
const LoadingDots = ({ label = 'Generating diagram...' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, height: '100%', minHeight: 320 }}>
    <div style={{ display: 'flex', gap: 8 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 12, height: 12, borderRadius: '50%', background: '#1A1A1A',
          animation: `vizBounce 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
        }} />
      ))}
    </div>
    <p style={{ fontWeight: 900, fontSize: 14, color: '#555' }}>{label}</p>
    <style>{`@keyframes vizBounce { from { transform: translateY(0) } to { transform: translateY(-9px) } }`}</style>
  </div>
);

/* ── Empty / idle state ───────────────────────────────────────────── */
const EmptyState = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '100%', minHeight: 320, textAlign: 'center', padding: 40 }}>
    <div style={{ fontSize: 60 }}>👁️</div>
    <div>
      <p style={{ fontWeight: 900, fontSize: 20, color: '#1A1A1A', margin: '0 0 8px' }}>Visualize anything</p>
      <p style={{ fontSize: 14, color: '#777', fontWeight: 600, maxWidth: 400, lineHeight: 1.7, margin: '0 auto' }}>
        Type <strong>any topic</strong> in the box above — algorithms, data structures, OS concepts,
        networks, science, or anything else. The AI builds a real interactive diagram for it.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
        {['Quick Sort', 'Dijkstra\'s Algorithm', 'Deadlock', 'Photosynthesis', 'TCP/IP Handshake', 'Neural Network'].map(ex => (
          <span key={ex} style={{
            fontSize: 12, fontWeight: 700,
            background: '#F5D876', color: '#1A1A1A',
            padding: '4px 12px', borderRadius: '100px', border: '2px solid #1A1A1A',
          }}>
            {ex}
          </span>
        ))}
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   Main VisualizerView
══════════════════════════════════════════════════════════════════ */
const VisualizerView = ({ user }) => {
  const [topic,            setTopic]            = useState('');
  const [diagram,          setDiagram]          = useState(null);
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState('');
  const [highlightIds,     setHighlightIds]     = useState([]);
  const [walkthroughSteps, setWalkthroughSteps] = useState([]);
  const [toast,            setToast]            = useState('');
  const [aiPanelOpen,      setAiPanelOpen]      = useState(false);
  const canvasRef = useRef(null); // ref to the DiagramCanvas DOM wrapper

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  /* ── Generate ────────────────────────────────────────────────── */
  const generate = useCallback(async (t) => {
    const q = (t || topic).trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setDiagram(null);
    setHighlightIds([]);
    setWalkthroughSteps([]);
    setTopic(q);
    try {
      const result = await buildDiagram(q);
      setDiagram(result);
      if (result.meta?.steps?.length) setWalkthroughSteps(result.meta.steps);
    } catch (err) {
      const msg = err.message || 'Unknown error';
      const isNetworkErr = msg.includes('Cannot reach') || msg.includes('Failed to fetch') || msg.includes('NetworkError');
      setError(
        isNetworkErr
          ? '🔌 Cannot reach the backend. Make sure Spring Boot is running on port 8080, then try again.'
          : `⚠️ Could not generate diagram for "${q}". ${msg}`
      );
    } finally {
      setLoading(false);
    }
  }, [topic]);

  /* ── Node click — highlight node + connected edges ───────────── */
  const handleNodeClick = useCallback((node) => {
    if (!node) return;
    setHighlightIds(prev => {
      const connected = (diagram?.edges || [])
        .filter(e => e.source === node.id || e.target === node.id)
        .flatMap(e => [e.source, e.target]);
      return [...new Set([node.id, ...connected])];
    });
  }, [diagram]);

  /* ── Walkthrough highlight sync ──────────────────────────────── */
  const handleWalkthroughHighlight = useCallback((ids) => {
    setHighlightIds(ids || []);
  }, []);

  /* ── Operation steps override ────────────────────────────────── */
  const handleOperationSteps = useCallback((steps) => {
    setWalkthroughSteps(steps);
    setHighlightIds(steps[0]?.ids || []);
  }, []);

  /* ── Save to Notes ───────────────────────────────────────────── */
  const handleSave = async () => {
    if (!diagram) return;
    const userId = user?.id || 1;
    const { meta } = diagram;
    showToast('📸 Capturing snapshot...');
    try {
      // Capture a PNG snapshot of the live canvas
      let snapshot = null;
      if (canvasRef.current) {
        try {
          const html2canvas = (await import('html2canvas')).default;
          const cvs = await html2canvas(canvasRef.current, {
            useCORS: true,
            backgroundColor: '#FAF6EC',
            scale: 1.5,
            logging: false,
          });
          snapshot = cvs.toDataURL('image/png');
        } catch (snapErr) {
          console.warn('Snapshot failed, saving without image:', snapErr);
        }
      }
      // Embed full diagram JSON + snapshot image so NotesView can show both
      const diagramPayload = JSON.stringify({
        __type:   'visualizer_diagram',
        nodes:    diagram.nodes,
        edges:    diagram.edges,
        meta:     diagram.meta,
        snapshot,                // base64 PNG or null
      });
      await api.createNote({
        title:   `Diagram: ${meta.title}`,
        content: diagramPayload,
        topic:   meta.category || 'CS',
        tags:    ['visualizer', meta.category || 'CS'],
        userId,
      });
      showToast('✅ Saved to Notes!');
    } catch { showToast('❌ Could not save note.'); }
  };


  const hasDiagram = !!diagram && !loading;

  /* ── Diagram-type label ──────────────────────────────────────── */
  const typeLabel = {
    concept:      '🗺 concept map',
    flowchart:    '⬇ flowchart',
    tree:         '🌳 tree',
    graph:        '🕸 graph',
    sequence:     '↔ sequence',
    layered:      '📊 layered',
    architecture: '🏗 architecture',
    process:      '⚙ process',
    comparison:   '⚖ comparison',
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 20,
      fontFamily: "'Inter','Segoe UI',sans-serif",
      marginRight: aiPanelOpen ? 380 : 0,
      transition: 'margin-right 0.28s cubic-bezier(0.4,0,0.2,1)',
    }}>

      {/* ── Title row ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>ALGORITHM VISUALIZER 👁️</h1>
        <div style={{ flex: 1 }} />
        {hasDiagram && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={() => generate(topic)} color="#F5D876">🔄 Regenerate</Btn>
            <Btn onClick={handleSave}            color="#8FD6B0">💾 Save Note</Btn>
          </div>
        )}
      </div>

      {/* ── Input + Generate ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          className="neo-input"
          style={{ flexGrow: 1, borderRadius: 14, padding: '12px 20px', fontSize: 14 }}
          placeholder='Type any topic: "Quick Sort", "Dijkstra", "Deadlock", "Photosynthesis", "TCP/IP"…'
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generate()}
        />
        <NeoButton action onClick={() => generate()} disabled={loading || !topic.trim()}>
          {loading ? 'GENERATING…' : 'GENERATE →'}
        </NeoButton>
      </div>

      {/* ── Diagram canvas (full width) ───────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Badges row */}
        {hasDiagram && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 900, fontSize: 17, color: '#1A1A1A' }}>
              {diagram.meta.title}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 900, background: '#F5D876', color: '#1A1A1A',
              padding: '3px 10px', border: '2px solid #1A1A1A', borderRadius: '100px',
            }}>
              {diagram.meta.category}
            </span>
            {diagram.meta.diagramType && (
              <span style={{
                fontSize: 11, fontWeight: 900, background: '#C9B8F5', color: '#1A1A1A',
                padding: '3px 10px', border: '2px solid #1A1A1A', borderRadius: '100px',
              }}>
                {typeLabel[diagram.meta.diagramType] || diagram.meta.diagramType}
              </span>
            )}
            {!diagram.meta._isPreset && (
              <span style={{
                fontSize: 11, fontWeight: 900, background: '#8FD6B0', color: '#1A1A1A',
                padding: '3px 10px', border: '2px solid #1A1A1A', borderRadius: '100px',
              }}>
                ✨ AI generated
              </span>
            )}
          </div>
        )}

        {/* Canvas */}
        {loading && (
          <div style={{ border: '3px solid #1A1A1A', borderRadius: 18, overflow: 'hidden', boxShadow: '6px 6px 0 #1A1A1A', background: '#FAF6EC', height: 460 }}>
            <LoadingDots />
          </div>
        )}
        {!loading && !diagram && !error && (
          <div style={{ border: '3px solid #1A1A1A', borderRadius: 18, overflow: 'hidden', boxShadow: '6px 6px 0 #1A1A1A', background: '#FAF6EC', height: 460 }}>
            <EmptyState />
          </div>
        )}
        {!loading && error && (
          <div style={{ border: '3px solid #1A1A1A', borderRadius: 18, padding: 24, background: '#FFE5E5', boxShadow: '4px 4px 0 #1A1A1A', color: '#c0392b', fontWeight: 700, fontSize: 14 }}>
            {error}
          </div>
        )}
        {hasDiagram && (
          <DiagramCanvas
            ref={canvasRef}
            nodes={diagram.nodes}
            edges={diagram.edges}
            onNodeClick={handleNodeClick}
            highlightIds={highlightIds}
            height={460}
          />
        )}
      </div>

      {/* ── Below-canvas panels ───────────────────────────────────── */}
      {hasDiagram && (
        <>
          {/* Walkthrough */}
          <WalkthroughPanel
            steps={walkthroughSteps}
            onHighlight={handleWalkthroughHighlight}
          />

          {/* Operations */}
          <OperationsPanel
            operations={diagram.meta.operations || []}
            topic={diagram.meta.title}
            onStepsGenerated={handleOperationSteps}
          />

          {/* Explanation */}
          <div style={{ background: '#FFFFFF', border: '3px solid #1A1A1A', borderRadius: 18, padding: 22, boxShadow: '4px 4px 0 #1A1A1A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>📖</span>
              <span style={{ fontWeight: 900, fontSize: 15, textTransform: 'uppercase' }}>
                Understand: {diagram.meta.title}
              </span>
            </div>

            {/* Overview */}
            <div style={{ background: '#FFF8E7', border: '2.5px solid #1A1A1A', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontSize: 14, lineHeight: 1.75, color: '#1A1A1A', fontWeight: 500 }}>
              {diagram.meta.description}
            </div>

            {/* Component grid */}
            {diagram.meta.components?.length > 0 && (
              <>
                <div style={{ fontWeight: 900, fontSize: 13, textTransform: 'uppercase', color: '#555', marginBottom: 10 }}>
                  Components
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
                  {diagram.meta.components.map((comp, i) => {
                    const colors = ['#C9B8F5', '#8FD6B0', '#F5A868', '#F5D876', '#FFFFFF'];
                    return (
                      <div
                        key={comp.id}
                        onClick={() => {
                          const nd = diagram.nodes.find(n => n.id === comp.id);
                          if (nd) handleNodeClick(nd);
                        }}
                        style={{
                          background: colors[i % colors.length],
                          color: '#1A1A1A',
                          border: '2.5px solid #1A1A1A', borderRadius: 12,
                          padding: '12px 14px', cursor: 'pointer',
                          boxShadow: '2px 2px 0 #1A1A1A',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translate(1px,1px)'; e.currentTarget.style.boxShadow = '1px 1px 0 #1A1A1A'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '2px 2px 0 #1A1A1A'; }}
                      >
                        <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 5 }}>{comp.name}</div>
                        <div style={{ fontSize: 12, lineHeight: 1.6, color: '#444', fontWeight: 500 }}>{comp.role}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Floating AI assistant ─────────────────────────────────── */}
      <AIAssistantTrigger
        onClick={() => setAiPanelOpen(o => !o)}
        isOpen={aiPanelOpen}
        hasDiagram={hasDiagram}
      />
      <AIAssistantDrawer
        meta={diagram?.meta ?? null}
        isOpen={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
      />

      {/* ── Toast ────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: '#1A1A1A', color: '#FFFFFF', padding: '12px 24px', borderRadius: '100px',
          fontWeight: 900, fontSize: 14, boxShadow: '4px 4px 0 rgba(0,0,0,0.3)', zIndex: 9999,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default VisualizerView;
