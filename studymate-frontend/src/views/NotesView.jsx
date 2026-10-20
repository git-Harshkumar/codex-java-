import React, { useState, useEffect } from 'react';
import NeoCard from '../components/NeoCard';
import NeoButton from '../components/NeoButton';
import { api } from '../api';
import DiagramCanvas from '../visualizer/DiagramCanvas';
import WalkthroughPanel from '../visualizer/WalkthroughPanel';

const CARD_COLORS = ['#C9B8F5', '#F5A868', '#F5D876', '#8FD6B0', '#FFFFFF'];

/* ── helper: try to parse a visualizer note payload ─────────────── */
const parseDiagram = (content) => {
  try {
    const obj = JSON.parse(content);
    if (obj?.__type === 'visualizer_diagram') return obj;
  } catch (_) {}
  return null;
};

/* ── Full-screen modal backdrop ──────────────────────────────────── */
const Modal = ({ onClose, children }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: '#FAF6EC', border: '3px solid #1A1A1A',
        borderRadius: 20, boxShadow: '8px 8px 0 #1A1A1A',
        width: '100%', maxWidth: 1100,
        maxHeight: '90vh', overflowY: 'auto',
        padding: '28px 32px',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}
    >
      {children}
    </div>
  </div>
);

/* ── Diagram note modal ───────────────────────────────────────────── */
const DiagramNoteModal = ({ note, diagram, onClose }) => {
  const [highlightIds, setHighlightIds] = useState([]);
  const [walkthroughSteps] = useState(diagram.meta?.steps || []);

  const typeLabel = {
    concept: '🗺 concept map', flowchart: '⬇ flowchart',
    tree: '🌳 tree', graph: '🕸 graph', sequence: '↔ sequence',
    layered: '📊 layered', architecture: '🏗 architecture',
    process: '⚙ process', comparison: '⚖ comparison',
  };

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 28, fontWeight: 900 }}>{diagram.meta.title}</span>
        {diagram.meta.category && (
          <span style={{
            fontSize: 11, fontWeight: 900, background: '#F5D876', color: '#1A1A1A',
            padding: '3px 10px', border: '2px solid #1A1A1A', borderRadius: '100px',
          }}>{diagram.meta.category}</span>
        )}
        {diagram.meta.diagramType && (
          <span style={{
            fontSize: 11, fontWeight: 900, background: '#C9B8F5', color: '#1A1A1A',
            padding: '3px 10px', border: '2px solid #1A1A1A', borderRadius: '100px',
          }}>{typeLabel[diagram.meta.diagramType] || diagram.meta.diagramType}</span>
        )}
        <span style={{
          fontSize: 11, fontWeight: 900, background: '#8FD6B0', color: '#1A1A1A',
          padding: '3px 10px', border: '2px solid #1A1A1A', borderRadius: '100px',
        }}>💾 saved diagram</span>
        <div style={{ flexGrow: 1 }} />
        <button
          onClick={onClose}
          style={{
            background: '#1A1A1A', color: '#fff', border: 'none',
            borderRadius: '100px', padding: '8px 20px', fontWeight: 900,
            fontSize: 13, cursor: 'pointer',
          }}
        >✕ CLOSE</button>
      </div>

      {/* Snapshot image — shown above the interactive canvas if available */}
      {diagram.snapshot && (
        <div>
          <div style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>📸 Saved Snapshot</div>
          <img
            src={diagram.snapshot}
            alt={`Diagram snapshot: ${diagram.meta.title}`}
            style={{
              width: '100%', borderRadius: 14,
              border: '3px solid #1A1A1A',
              boxShadow: '4px 4px 0 #1A1A1A',
              display: 'block',
            }}
          />
        </div>
      )}

      {/* Interactive React Flow Canvas */}
      <div>
        <div style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>🔄 Interactive Diagram</div>
        <DiagramCanvas
          nodes={diagram.nodes}
          edges={diagram.edges}
          onNodeClick={(node) => {
            if (!node) return;
            const connected = (diagram.edges || [])
              .filter(e => e.source === node.id || e.target === node.id)
              .flatMap(e => [e.source, e.target]);
            setHighlightIds([...new Set([node.id, ...connected])]);
          }}
          highlightIds={highlightIds}
          height={420}
        />
      </div>

      {/* Description */}
      {diagram.meta.description && (
        <div style={{
          background: '#FFF8E7', border: '2.5px solid #1A1A1A', borderRadius: 12,
          padding: '14px 18px', fontSize: 14, lineHeight: 1.75, fontWeight: 500,
        }}>
          {diagram.meta.description}
        </div>
      )}

      {/* Walkthrough */}
      {walkthroughSteps.length > 0 && (
        <WalkthroughPanel
          steps={walkthroughSteps}
          onHighlight={ids => setHighlightIds(ids || [])}
        />
      )}

      {/* Component grid */}
      {diagram.meta.components?.length > 0 && (
        <div>
          <div style={{ fontWeight: 900, fontSize: 13, textTransform: 'uppercase', color: '#555', marginBottom: 10 }}>
            Components
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
            {diagram.meta.components.map((comp, i) => {
              const colors = ['#C9B8F5', '#8FD6B0', '#F5A868', '#F5D876', '#FFFFFF'];
              return (
                <div
                  key={comp.id || i}
                  onClick={() => {
                    const nd = diagram.nodes.find(n => n.id === comp.id);
                    if (nd) {
                      const connected = (diagram.edges || [])
                        .filter(e => e.source === nd.id || e.target === nd.id)
                        .flatMap(e => [e.source, e.target]);
                      setHighlightIds([...new Set([nd.id, ...connected])]);
                    }
                  }}
                  style={{
                    background: colors[i % colors.length], color: '#1A1A1A',
                    border: '2.5px solid #1A1A1A', borderRadius: 12,
                    padding: '12px 14px', cursor: 'pointer',
                    boxShadow: '2px 2px 0 #1A1A1A', transition: 'all 0.15s',
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
        </div>
      )}
    </Modal>
  );
};

/* ── Plain text note modal ───────────────────────────────────────── */
const TextNoteModal = ({ note, onClose }) => (
  <Modal onClose={onClose}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 22, fontWeight: 900 }}>{note.title}</span>
      {note.topic && (
        <span style={{ backgroundColor: '#1A1A1A', color: 'white', fontSize: 11, fontWeight: 'bold', padding: '3px 12px', borderRadius: '100px' }}>
          {note.topic}
        </span>
      )}
      <div style={{ flexGrow: 1 }} />
      <button
        onClick={onClose}
        style={{ background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '100px', padding: '8px 20px', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}
      >✕ CLOSE</button>
    </div>

    <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: '#222', background: '#fff', border: '2px solid #1A1A1A', borderRadius: 12, padding: '18px 20px' }}>
      {note.content}
    </div>

    {(note.tags || []).length > 0 && (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {note.tags.map(tag => (
          <span key={tag} style={{ backgroundColor: '#F5D876', border: '2px solid #1A1A1A', fontSize: 11, fontWeight: 'bold', padding: '3px 12px', borderRadius: '100px' }}>
            {tag}
          </span>
        ))}
      </div>
    )}

    <div style={{ fontSize: 11, color: '#888', fontWeight: 700 }}>
      {note.createdAt ? new Date(note.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
    </div>
  </Modal>
);

/* ══════════════════════════════════════════════════════════════════
   NotesView
══════════════════════════════════════════════════════════════════ */
const NotesView = ({ user, activeTab }) => {
  const userId = user?.id || 1;
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', topic: '', tags: '' });
  const [loading, setLoading] = useState(false);
  const [openNote, setOpenNote] = useState(null); // note being viewed

  const loadNotes = async () => {
    try {
      const data = search
        ? await api.searchNotes(search, userId)
        : await api.getNotes(userId);
      setNotes(Array.isArray(data) ? data : []);
    } catch {
      setNotes([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'Notes' || !activeTab) {
      loadNotes();
    }
  }, [search, activeTab]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const note = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        userId,
      };
      await api.createNote(note);
      setForm({ title: '', content: '', topic: '', tags: '' });
      setShowForm(false);
      await loadNotes();
    } catch (err) {
      alert('Failed to save note: ' + err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // don't open modal when clicking trash
    if (!window.confirm('Delete this note?')) return;
    await api.deleteNote(id);
    await loadNotes();
  };

  const handleCardClick = (note) => setOpenNote(note);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '32px' }}>STUDY NOTES 📚</h1>
        <div style={{ flexGrow: 1 }} />
        <input type="text" className="neo-input" placeholder="Search notes..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ width: '220px' }} />
        <NeoButton action onClick={() => setShowForm(!showForm)}>
          {showForm ? 'CANCEL' : '+ NEW NOTE'}
        </NeoButton>
      </div>

      {/* ── Create form ─────────────────────────────────────────────── */}
      {showForm && (
        <NeoCard bg="#C9B8F5">
          <h3 style={{ fontWeight: 900, marginBottom: '16px' }}>CREATE NEW NOTE</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" className="neo-input" placeholder="Title *" required
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input type="text" className="neo-input" placeholder="Topic (e.g. DSA)"
              value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
            <textarea className="neo-input" placeholder="Content / Summary *" required rows={4}
              style={{ borderRadius: '16px', resize: 'vertical' }}
              value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
            <input type="text" className="neo-input" placeholder="Tags (comma-separated, e.g. JAVA, DSA)"
              value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
            <NeoButton action disabled={loading} style={{ alignSelf: 'flex-start' }}>
              {loading ? 'SAVING...' : 'SAVE NOTE ✓'}
            </NeoButton>
          </form>
        </NeoCard>
      )}

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {(!Array.isArray(notes) || notes.length === 0) && !showForm && (
        <NeoCard bg="#FFFFFF" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ fontWeight: 900 }}>No notes yet</h3>
          <p style={{ color: '#555', marginTop: '8px' }}>Click "+ NEW NOTE" to save your first study note!</p>
        </NeoCard>
      )}

      {/* ── Notes grid ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {(Array.isArray(notes) ? notes : []).map((n, i) => {
          const diagramData = parseDiagram(n.content);
          const isViz = !!diagramData;
          return (
            <NeoCard
              key={n.id}
              bg={CARD_COLORS[i % CARD_COLORS.length]}
              style={{ width: '300px', display: 'flex', flexDirection: 'column', minHeight: '200px', cursor: 'pointer', transition: 'transform 0.15s' }}
              onClick={() => handleCardClick(n)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translate(-2px,-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}
            >
              {/* Visualizer badge */}
              {isViz && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 900, background: '#1A1A1A', color: '#F5D876', padding: '2px 10px', borderRadius: '100px' }}>
                    👁️ DIAGRAM
                  </span>
                </div>
              )}
              {/* Snapshot thumbnail */}
              {isViz && diagramData.snapshot && (
                <img
                  src={diagramData.snapshot}
                  alt="Diagram preview"
                  style={{
                    width: '100%', borderRadius: 10, marginBottom: 10,
                    border: '2px solid #1A1A1A',
                    display: 'block', objectFit: 'cover', maxHeight: 130,
                  }}
                />
              )}
              <h3 style={{ fontWeight: 900, fontSize: '16px', marginBottom: '8px' }}>{n.title}</h3>
              <p style={{ fontSize: '13px', color: '#444', flexGrow: 1, marginBottom: '12px' }}>
                {isViz
                  ? diagramData.meta?.description?.substring(0, 120) + (diagramData.meta?.description?.length > 120 ? '…' : '')
                  : n.content?.substring(0, 120) + (n.content?.length > 120 ? '…' : '')
                }
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {n.topic && <span style={{ backgroundColor: '#1A1A1A', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '100px' }}>{n.topic}</span>}
                {(n.tags || []).map(tag => (
                  <span key={tag} style={{ backgroundColor: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '100px', border: '1px solid #1A1A1A' }}>{tag}</span>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#666' }}>
                  {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                </span>
                <button onClick={(e) => handleDelete(e, n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>🗑️</button>
              </div>
            </NeoCard>
          );
        })}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────── */}
      {openNote && (() => {
        const diagramData = parseDiagram(openNote.content);
        return diagramData
          ? <DiagramNoteModal note={openNote} diagram={diagramData} onClose={() => setOpenNote(null)} />
          : <TextNoteModal note={openNote} onClose={() => setOpenNote(null)} />;
      })()}
    </div>
  );
};

export default NotesView;
