import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { notesApi, aiApi } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { useKeyboardShortcuts } from '../hooks/useKeyboard';
import ReactMarkdown from 'react-markdown';
import SearchModal from '../components/SearchModal';
import toast from 'react-hot-toast';
import {
  Search, Plus, Pin, Globe, Clock, Archive, Tag, FileText,
  Sparkles, X, Trash2, Share2, Copy, ExternalLink, Check,
  Save, Eye, Edit3
} from 'lucide-react';
import { getTagStyle } from '../utils/colors';

export default function Workspace() {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Notes list state
  const [notes, setNotes] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Editor state
  const [activeNote, setActiveNote] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [editorLoading, setEditorLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // AI state
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Share state
  const [shareInfo, setShareInfo] = useState<{ share_id: string; is_public: boolean } | null>(null);

  const debouncedTitle = useDebounce(title, 1200);
  const debouncedContent = useDebounce(content, 1200);
  const activeIdRef = useRef<string | null>(null);
  const initialLoadRef = useRef(true);

  // ── Fetch notes list ──
  const fetchNotes = useCallback(async () => {
    try {
      const res = await notesApi.list({ search: search || undefined, tag: selectedTag || undefined, is_archived: showArchived });
      setNotes(res.notes);
    } catch { toast.error('Failed to load notes'); }
    finally { setListLoading(false); }
  }, [search, selectedTag, showArchived]);

  const fetchTags = async () => {
    try { const res = await notesApi.getTags(); setTags(res.tags); } catch { }
  };

  useEffect(() => { fetchNotes(); fetchTags(); }, [fetchNotes]);

  // ── Load note when route changes ──
  useEffect(() => {
    if (routeId && routeId !== 'new') {
      if (routeId === activeIdRef.current) return; // Prevent double load after creation!

      setEditorLoading(true);
      notesApi.get(routeId).then(n => {
        setActiveNote(n); setTitle(n.title); setContent(n.content);
        setNoteTags(n.tags || []); activeIdRef.current = n.id;
        if (n.ai_summary) setAiResult({ summary: n.ai_summary, action_items: n.ai_action_items || [], suggested_title: n.ai_suggested_title || '' });
        else setAiResult(null);
        if (n.is_public && n.share_id) setShareInfo({ share_id: n.share_id, is_public: true });
        else setShareInfo(null);
        setEditorLoading(false);
        initialLoadRef.current = false;
      }).catch(() => { toast.error('Note not found'); navigate('/notes'); });
    } else if (routeId === 'new') {
      notesApi.create({ title: 'Untitled', content: '' }).then(n => {
        setActiveNote(n); setTitle(n.title); setContent(n.content);
        setNoteTags([]); activeIdRef.current = n.id; setAiResult(null); setShareInfo(null);
        setNotes(prev => [n, ...prev]); // Optimistically insert the new note into the list instantly
        navigate(`/notes/${n.id}`, { replace: true });
        fetchNotes();
        initialLoadRef.current = false;
      }).catch(() => toast.error('Failed to create note'));
    } else {
      setActiveNote(null); activeIdRef.current = null;
      initialLoadRef.current = true;
    }
  }, [routeId]);

  // ── Auto-save ──
  useEffect(() => {
    if (initialLoadRef.current || !activeIdRef.current) return;
    const doSave = async () => {
      setSaving('saving');

      // Optimistic update for the notes list
      setNotes(prev => {
        const exists = prev.some(n => n.id === activeIdRef.current);
        if (exists) {
          return prev.map(n => n.id === activeIdRef.current ? { ...n, title: debouncedTitle, content: debouncedContent, tags: noteTags, updated_at: new Date().toISOString() } : n);
        }
        return [{ id: activeIdRef.current, title: debouncedTitle, content: debouncedContent, tags: noteTags, updated_at: new Date().toISOString() }, ...prev];
      });

      try {
        await notesApi.update(activeIdRef.current!, { title: debouncedTitle, content: debouncedContent, tags: noteTags });
        setSaving('saved');
        document.dispatchEvent(new CustomEvent('refresh-tags')); // trigger layout to fetch tags
        setTimeout(() => { setSaving('idle'); fetchNotes(); }, 2000);
      } catch { setSaving('idle'); }
    };
    doSave();
  }, [debouncedTitle, debouncedContent, noteTags]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const h = () => setSearchOpen(true);
    document.addEventListener('open-search', h);
    return () => document.removeEventListener('open-search', h);
  }, []);

  const manualSave = useCallback(async () => {
    if (!activeIdRef.current) return;
    setSaving('saving');
    try {
      await notesApi.update(activeIdRef.current, { title, content, tags: noteTags });
      setSaving('saved'); toast.success('Saved');
      fetchNotes();
      setTimeout(() => setSaving('idle'), 2000);
    } catch { toast.error('Save failed'); setSaving('idle'); }
  }, [title, content, noteTags]);

  useKeyboardShortcuts([
    { key: 'k', ctrl: true, handler: () => setSearchOpen(true) },
    { key: 'n', alt: true, handler: () => navigate('/notes/new') },
    { key: 's', ctrl: true, handler: manualSave },
  ]);

  // ── Actions ──
  const handleNewNote = async () => { navigate('/notes/new'); };

  const handleSelectNote = (id: string) => {
    if (id === activeIdRef.current) return;
    initialLoadRef.current = true;
    navigate(`/notes/${id}`);
  };

  const handleAI = async () => {
    if (!content || content.trim().length < 10) { toast.error('Write more content first'); return; }
    setShowAI(true); setAiLoading(true);
    try {
      const res = await aiApi.generateSummary({ content, note_id: activeIdRef.current || undefined });
      setAiResult(res); toast.success('AI analysis complete');
    } catch (e: any) { toast.error(e.message || 'AI error'); }
    finally { setAiLoading(false); }
  };

  const handlePin = async () => {
    if (!activeIdRef.current) return;
    const updated = await notesApi.update(activeIdRef.current, { is_pinned: !activeNote?.is_pinned });
    setActiveNote(updated); fetchNotes();
    toast.success(updated.is_pinned ? 'Pinned' : 'Unpinned');
  };

  const handleArchive = async () => {
    if (!activeIdRef.current) return;
    await notesApi.update(activeIdRef.current, { is_archived: true });
    toast.success('Archived');
    setActiveNote(null); activeIdRef.current = null;
    navigate('/notes'); fetchNotes();
  };

  const handleDelete = async () => {
    if (!activeIdRef.current || !confirm('Delete this note permanently?')) return;
    await notesApi.delete(activeIdRef.current);
    toast.success('Deleted');
    setActiveNote(null); activeIdRef.current = null;
    navigate('/notes'); fetchNotes();
  };

  const handleShare = async () => {
    if (!activeIdRef.current) return;
    const res = await notesApi.toggleShare(activeIdRef.current);
    setShareInfo(res);
    if (res.is_public) {
      navigator.clipboard.writeText(`${window.location.origin}/shared/${res.share_id}`);
      toast.success('Share link copied!');
    } else toast.success('Sharing disabled');
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !noteTags.includes(t)) {
      setNoteTags([...noteTags, t]);
      // Optimistically update Workspace sidebar tags
      setTags(prev => prev.find(x => x.name === t)
        ? prev.map(x => x.name === t ? { ...x, count: x.count + 1 } : x)
        : [...prev, { name: t, count: 1 }].sort((a, b) => b.count - a.count)
      );
      document.dispatchEvent(new CustomEvent('optimistic-tag', { detail: t }));
    }
    setTagInput('');
  };

  const removeTag = (t: string) => {
    setNoteTags(noteTags.filter(x => x !== t));
    // Optimistically update Workspace sidebar tags
    setTags(prev => prev.map(x => x.name === t ? { ...x, count: x.count - 1 } : x).filter(x => x.count > 0));
    document.dispatchEvent(new CustomEvent('optimistic-tag-remove', { detail: t }));
  };

  const formatDate = (d: string) => {
    const dt = new Date(d); const now = new Date();
    const diff = now.getTime() - dt.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* ── Notes List Panel ── */}
      <div className="notes-panel">
        <div className="notes-panel-header">
          <div className="notes-panel-title">
            <span>{showArchived ? 'Archived' : 'All Notes'}</span>
            <button className="btn btn-primary btn-sm" onClick={handleNewNote}><Plus size={16} /> New</button>
          </div>
          <div className="notes-search">
            <Search size={16} />
            <input className="input" placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {tags.length > 0 && (
          <div className="notes-filters">
            <button className={`tag ${!selectedTag ? 'tag-active' : 'tag-clickable'}`} onClick={() => setSelectedTag('')}>All</button>
            {tags.slice(0, 6).map(t => (
              <button key={t.name} className={`tag tag-clickable ${selectedTag === t.name ? 'tag-active' : ''}`}
                style={getTagStyle(t.name)}
                onClick={() => setSelectedTag(selectedTag === t.name ? '' : t.name)}>
                {t.name}
              </button>
            ))}
          </div>
        )}

        <div className="notes-list">
          {listLoading ? <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div> :
            notes.length === 0 ? (
              <div className="notes-empty">
                <FileText size={32} style={{ marginBottom: 8, opacity: .4 }} />
                <p>{search ? 'No matching notes' : 'No notes yet'}</p>
                {!search && <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={handleNewNote}><Plus size={14} /> Create first note</button>}
              </div>
            ) : notes.map(note => (
              <div key={note.id} className={`note-item ${activeIdRef.current === note.id ? 'active' : ''}`}
                onClick={() => handleSelectNote(note.id)}>
                {note.is_pinned && <Pin size={12} className="note-item-pin" />}
                <div className="note-item-title">{note.title || 'Untitled'}</div>
                <div className="note-item-preview">{note.content?.substring(0, 100) || 'Empty note...'}</div>
                <div className="note-item-meta">
                  <Clock size={10} /> {formatDate(note.updated_at)}
                  {note.is_public && <><Globe size={10} style={{ color: 'var(--green)' }} /> Shared</>}
                  {note.ai_summary && <><Sparkles size={10} style={{ color: 'var(--accent)' }} /></>}
                  <div className="note-item-badges">
                    {(note.tags || []).slice(0, 2).map((t: string) => <span key={t} className="tag" style={{ ...getTagStyle(t), fontSize: '0.6rem', padding: '1px 5px' }}>{t}</span>)}
                  </div>
                </div>
              </div>
            ))}

          <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
            onClick={() => setShowArchived(!showArchived)}>
            <Archive size={16} /> {showArchived ? 'Show active' : 'Show archived'}
          </button>
        </div>
      </div>

      {/* ── Editor Panel ── */}
      <div className="editor-panel">
        {!activeNote && !editorLoading ? (
          <div className="editor-empty">
            <div className="animate-in">
              <Sparkles size={36} style={{ color: 'var(--accent)', opacity: .5, marginBottom: 12 }} />
              <h3>Select a note or create a new one</h3>
              <p style={{ marginBottom: 8 }}>Write freely with full Markdown support.</p>
              <p>Use <span className="kbd">Alt</span>+<span className="kbd">N</span> to create, <span className="kbd">Ctrl</span>+<span className="kbd">K</span> to search</p>
            </div>
          </div>
        ) : editorLoading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : (
          <>
            <div className="editor-topbar">
              <div className="save-status" data-state={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {saving === 'saving' && <><span className="spinner" style={{ width: 12, height: 12 }} /> Saving</>}
                {saving === 'saved' && <><Check size={12} /> Saved</>}
                {saving === 'idle' && <><Save size={12} /> Auto-save</>}
              </div>
              <div className="spacer" />
              <button className="btn btn-ghost btn-icon" onClick={() => setPreviewMode(!previewMode)} title={previewMode ? 'Switch to Edit Mode' : 'View Markdown Preview'}>
                {previewMode ? <Edit3 size={18} /> : <Eye size={18} />}
              </button>
              <button className="btn btn-ghost btn-icon" onClick={handlePin} title={activeNote?.is_pinned ? 'Unpin Note' : 'Pin Note'}>
                <Pin size={18} style={{ color: activeNote?.is_pinned ? 'var(--amber)' : undefined }} />
              </button>
              <button className="btn btn-ghost btn-icon" onClick={handleShare} title="Create Public Share Link">
                <Share2 size={18} style={{ color: shareInfo?.is_public ? 'var(--green)' : undefined }} />
              </button>
              <button className="btn btn-ghost btn-icon" onClick={handleArchive} title="Archive Note"><Archive size={18} /></button>
              <button className="btn btn-ghost btn-icon" onClick={handleDelete} title="Delete Note Permanently"><Trash2 size={18} style={{ color: 'var(--red)' }} /></button>
              <button className={`btn ${showAI ? 'btn-primary' : 'btn-secondary'} btn-sm`} style={{ marginLeft: 4 }}
                onClick={() => showAI ? setShowAI(false) : handleAI()} title="Generate AI Summary & Action Items">
                <Sparkles size={16} /> AI Analysis
              </button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div className="editor-body">
                {shareInfo?.is_public && (
                  <div className="share-banner">
                    <Globe size={13} /> Public link active
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/shared/${shareInfo.share_id}`); toast.success('Copied!'); }}>
                      <Copy size={11} /> Copy
                    </button>
                    <a href={`/shared/${shareInfo.share_id}`} target="_blank" className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}><ExternalLink size={11} /></a>
                  </div>
                )}

                <input className="editor-title" placeholder="Note title..." value={title}
                  onChange={e => setTitle(e.target.value)} />

                <div className="editor-meta-bar">
                  <span>{content.split(/\s+/).filter(Boolean).length} words</span>
                  <span>·</span>
                  <span>{content.length} chars</span>
                  {activeNote?.updated_at && <><span>·</span><span>Edited {formatDate(activeNote.updated_at)}</span></>}
                </div>

                <div className="editor-tags">
                  <Tag size={16} style={{ color: 'var(--text-3)', marginRight: 4 }} />
                  {noteTags.map(t => (
                    <span key={t} className="tag tag-clickable" style={getTagStyle(t)} onClick={() => removeTag(t)}>
                      {t} <X size={12} />
                    </span>
                  ))}
                  <input placeholder="Add tag..." value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                    onBlur={addTag} />
                </div>

                {previewMode ? (
                  <div className="md-preview"><ReactMarkdown>{content || '*Nothing to preview*'}</ReactMarkdown></div>
                ) : (
                  <textarea className="editor-content" placeholder="Start writing... (supports Markdown)"
                    value={content} onChange={e => setContent(e.target.value)} />
                )}
              </div>

              {/* AI Drawer */}
              {showAI && (
                <div className="ai-drawer">
                  <div className="ai-drawer-header">
                    <div className="ai-drawer-title"><Sparkles size={16} style={{ color: 'var(--accent)' }} /> AI Analysis</div>
                    <button className="btn btn-ghost btn-icon" onClick={() => setShowAI(false)}><X size={15} /></button>
                  </div>
                  <div className="ai-drawer-body">
                    {aiLoading ? (
                      <div className="ai-loading">
                        <div className="spinner" style={{ width: 24, height: 24 }} />
                        Analyzing with Llama 3.1...
                      </div>
                    ) : aiResult ? (
                      <>
                        <div>
                          <div className="ai-section-label">Suggested Title</div>
                          <div className="ai-title-suggestion" onClick={() => { setTitle(aiResult.suggested_title); toast.success('Title applied!'); }}>
                            {aiResult.suggested_title}
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Click to apply</span>
                          </div>
                        </div>
                        <div>
                          <div className="ai-section-label">Summary</div>
                          <div className="ai-card"><div className="ai-card-summary">{aiResult.summary}</div></div>
                        </div>
                        {aiResult.action_items?.length > 0 && (
                          <div>
                            <div className="ai-section-label">Action Items</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {aiResult.action_items.map((item: string, i: number) => (
                                <div key={i} className="ai-card-action"><span className="bullet">→</span> {item}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        {aiResult.tokens_used > 0 && (
                          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-3)' }}>{aiResult.tokens_used} tokens used</div>
                        )}
                        <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={handleAI}>
                          <Sparkles size={13} /> Regenerate
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
