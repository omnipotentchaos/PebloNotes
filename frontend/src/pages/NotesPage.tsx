import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notesApi } from '../api/client';
import { Search, Plus, Archive, Tag, Pin, Globe, Clock } from 'lucide-react';
import { useKeyboardShortcuts } from '../hooks/useKeyboard';
import SearchModal from '../components/SearchModal';
import toast from 'react-hot-toast';

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const fetchNotes = useCallback(async () => {
    try {
      const res = await notesApi.list({
        search: search || undefined,
        tag: selectedTag || undefined,
        is_archived: showArchived,
      });
      setNotes(res.notes);
    } catch (err: any) {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [search, selectedTag, showArchived]);

  const fetchTags = async () => {
    try {
      const res = await notesApi.getTags();
      setTags(res.tags);
    } catch {}
  };

  useEffect(() => { fetchNotes(); fetchTags(); }, [fetchNotes]);

  // Listen for search event from sidebar
  useEffect(() => {
    const handler = () => setSearchOpen(true);
    document.addEventListener('open-search', handler);
    return () => document.removeEventListener('open-search', handler);
  }, []);

  useKeyboardShortcuts([
    { key: 'k', ctrl: true, handler: () => setSearchOpen(true) },
    { key: 'n', ctrl: true, handler: () => handleNewNote() },
  ]);

  const handleNewNote = async () => {
    try {
      const note = await notesApi.create({ title: 'Untitled', content: '' });
      navigate(`/notes/${note.id}`);
    } catch { toast.error('Failed to create note'); }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{showArchived ? 'Archived Notes' : 'My Notes'}</h1>
          <p className="page-subtitle">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowArchived(!showArchived)}>
            <Archive size={16} /> {showArchived ? 'Active' : 'Archived'}
          </button>
          <button className="btn btn-primary" onClick={handleNewNote}>
            <Plus size={18} /> New Note
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="notes-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input className="input" placeholder="Search notes... (Ctrl+K)"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className={`tag ${!selectedTag ? 'tag-active' : 'tag-removable'}`}
              onClick={() => setSelectedTag('')} style={!selectedTag ? { background: 'var(--accent)', color: 'white' } : {}}>
              All
            </button>
            {tags.slice(0, 8).map(t => (
              <button key={t.name}
                className={`tag tag-removable ${selectedTag === t.name ? 'tag-active' : ''}`}
                onClick={() => setSelectedTag(selectedTag === t.name ? '' : t.name)}
                style={selectedTag === t.name ? { background: 'var(--accent)', color: 'white' } : {}}>
                <Tag size={10} /> {t.name} ({t.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="page-loader"><div className="spinner" /><span>Loading notes...</span></div>
      ) : notes.length === 0 ? (
        <div className="empty-state animate-fade">
          <FileTextIcon />
          <h3>{search || selectedTag ? 'No matching notes' : 'No notes yet'}</h3>
          <p>{search || selectedTag ? 'Try a different search or filter' : 'Create your first note to get started'}</p>
          {!search && !selectedTag && (
            <button className="btn btn-primary" onClick={handleNewNote}>
              <Plus size={18} /> Create First Note
            </button>
          )}
        </div>
      ) : (
        <div className="notes-grid">
          {notes.map((note, i) => (
            <div key={note.id} className={`note-card animate-fade ${note.is_pinned ? 'pinned' : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => navigate(`/notes/${note.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {note.is_pinned && <Pin size={14} style={{ color: 'var(--warning)' }} />}
                {note.is_public && <Globe size={14} style={{ color: 'var(--success)' }} />}
                <h3 className="note-card-title" style={{ flex: 1 }}>{note.title || 'Untitled'}</h3>
              </div>
              <p className="note-card-preview">
                {note.content?.substring(0, 150) || 'Empty note...'}
              </p>
              {note.ai_summary && (
                <div style={{ fontSize: '0.78rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  ✦ AI Summary available
                </div>
              )}
              <div className="note-card-footer">
                <span className="note-card-date"><Clock size={12} style={{ marginRight: 4 }} />{formatDate(note.updated_at)}</span>
                <div className="note-card-tags">
                  {(note.tags || []).slice(0, 3).map((tag: string) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

function FileTextIcon() {
  return <svg className="empty-state-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>;
}
