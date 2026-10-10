import React, { useState, useEffect } from 'react';
import NeoCard from '../components/NeoCard';
import NeoButton from '../components/NeoButton';
import { api } from '../api';

const CARD_COLORS = ['#C9B8F5', '#F5A868', '#F5D876', '#8FD6B0', '#FFFFFF'];

const NotesView = ({ user, activeTab }) => {
  const userId = user?.id || 1;
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', topic: '', tags: '' });
  const [loading, setLoading] = useState(false);

  const loadNotes = async () => {
    try {
      const data = search
        ? await api.searchNotes(search, userId)
        : await api.getNotes(userId);
      setNotes(data);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    await api.deleteNote(id);
    await loadNotes();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '32px' }}>STUDY NOTES 📚</h1>
        <div style={{ flexGrow: 1 }}></div>
        <input type="text" className="neo-input" placeholder="Search notes..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ width: '220px' }} />
        <NeoButton action onClick={() => setShowForm(!showForm)}>
          {showForm ? 'CANCEL' : '+ NEW NOTE'}
        </NeoButton>
      </div>

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

      {notes.length === 0 && !showForm && (
        <NeoCard bg="#FFFFFF" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ fontWeight: 900 }}>No notes yet</h3>
          <p style={{ color: '#555', marginTop: '8px' }}>Click "+ NEW NOTE" to save your first study note!</p>
        </NeoCard>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {notes.map((n, i) => (
          <NeoCard key={n.id} bg={CARD_COLORS[i % CARD_COLORS.length]}
            style={{ width: '300px', display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
            <h3 style={{ fontWeight: 900, fontSize: '16px', marginBottom: '8px' }}>{n.title}</h3>
            <p style={{ fontSize: '13px', color: '#444', flexGrow: 1, marginBottom: '12px' }}>
              {n.content?.substring(0, 120)}{n.content?.length > 120 ? '...' : ''}
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
              <button onClick={() => handleDelete(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>🗑️</button>
            </div>
          </NeoCard>
        ))}
      </div>
    </div>
  );
};

export default NotesView;
