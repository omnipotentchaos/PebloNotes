import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { notesApi, aiApi } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { useKeyboardShortcuts } from '../hooks/useKeyboard';
import { ArrowLeft, Save, Pin, Archive, Trash2, Share2, Sparkles, Check, X, Tag, Copy, ExternalLink, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [note, setNote] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [loading, setLoading] = useState(!isNew);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [showAI, setShowAI] = useState(false);
  const [shareInfo, setShareInfo] = useState<any>(null);

  const debouncedTitle = useDebounce(title, 1000);
  const debouncedContent = useDebounce(content, 1000);
  const noteIdRef = useRef<string | null>(null);
  const initialLoadRef = useRef(true);

  // Load existing note
  useEffect(() => {
    if (!isNew && id) {
      notesApi.get(id).then(n => {
        setNote(n); setTitle(n.title); setContent(n.content);
        setTags(n.tags || []); noteIdRef.current = n.id;
        if (n.ai_summary) setAiResult({ summary: n.ai_summary, action_items: n.ai_action_items || [], suggested_title: n.ai_suggested_title || '' });
        if (n.is_public && n.share_id) setShareInfo({ share_id: n.share_id, is_public: true });
        setLoading(false); initialLoadRef.current = false;
      }).catch(() => { toast.error('Note not found'); navigate('/notes'); });
    } else if (isNew) {
      notesApi.create({ title: 'Untitled', content: '' }).then(n => {
        setNote(n); setTitle(n.title); setContent(n.content);
        noteIdRef.current = n.id;
        navigate(`/notes/${n.id}`, { replace: true });
        setLoading(false); initialLoadRef.current = false;
      }).catch(() => { toast.error('Failed to create note'); navigate('/notes'); });
    }
  }, [id]);

  // Auto-save on debounced changes
  useEffect(() => {
    if (initialLoadRef.current || !noteIdRef.current) return;
    const save = async () => {
      setSaving('saving');
      try {
        await notesApi.update(noteIdRef.current!, { title: debouncedTitle, content: debouncedContent, tags });
        setSaving('saved');
        setTimeout(() => setSaving('idle'), 2000);
      } catch { toast.error('Auto-save failed'); setSaving('idle'); }
    };
    save();
  }, [debouncedTitle, debouncedContent, tags]);

  const handleManualSave = useCallback(async () => {
    if (!noteIdRef.current) return;
    setSaving('saving');
    try {
      await notesApi.update(noteIdRef.current, { title, content, tags });
      setSaving('saved'); toast.success('Saved!');
      setTimeout(() => setSaving('idle'), 2000);
    } catch { toast.error('Save failed'); setSaving('idle'); }
  }, [title, content, tags]);

  useKeyboardShortcuts([
    { key: 's', ctrl: true, handler: handleManualSave },
  ]);

  const handleAIGenerate = async () => {
    if (!content || content.trim().length < 10) { toast.error('Write more content first'); return; }
    setAiLoading(true); setShowAI(true);
    try {
      const result = await aiApi.generateSummary({ content, note_id: noteIdRef.current || undefined });
      setAiResult(result); toast.success('AI analysis complete!');
    } catch (err: any) { toast.error(err.message || 'AI service error'); }
    finally { setAiLoading(false); }
  };

  const handleTogglePin = async () => {
    if (!noteIdRef.current) return;
    const newPinned = !note?.is_pinned;
    try {
      const updated = await notesApi.update(noteIdRef.current, { is_pinned: newPinned });
      setNote(updated); toast.success(newPinned ? 'Pinned!' : 'Unpinned');
    } catch { toast.error('Failed'); }
  };

  const handleArchive = async () => {
    if (!noteIdRef.current) return;
    try {
      await notesApi.update(noteIdRef.current, { is_archived: true });
      toast.success('Note archived'); navigate('/notes');
    } catch { toast.error('Failed to archive'); }
  };

  const handleDelete = async () => {
    if (!noteIdRef.current || !confirm('Delete this note permanently?')) return;
    try {
      await notesApi.delete(noteIdRef.current);
      toast.success('Note deleted'); navigate('/notes');
    } catch { toast.error('Failed to delete'); }
  };

  const handleShare = async () => {
    if (!noteIdRef.current) return;
    try {
      const res = await notesApi.toggleShare(noteIdRef.current);
      setShareInfo(res);
      if (res.is_public) {
        const url = `${window.location.origin}/shared/${res.share_id}`;
        navigator.clipboard.writeText(url);
        toast.success('Share link copied!');
      } else { toast.success('Sharing disabled'); }
    } catch { toast.error('Failed to share'); }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) { setTags([...tags, tag]); }
    setTagInput('');
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="editor-container">
      <div className="editor-main">
        {/* Toolbar */}
        <div className="editor-toolbar">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/notes')}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="save-indicator" data-state={saving}>
            {saving === 'saving' && <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</>}
            {saving === 'saved' && <><Check size={14} style={{ color: 'var(--success)' }} /> Saved</>}
            {saving === 'idle' && <><Save size={14} /> Auto-save on</>}
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-icon" onClick={handleTogglePin} title="Pin">
            <Pin size={16} style={{ color: note?.is_pinned ? 'var(--warning)' : undefined }} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={handleShare} title="Share">
            <Share2 size={16} style={{ color: shareInfo?.is_public ? 'var(--success)' : undefined }} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={handleArchive} title="Archive">
            <Archive size={16} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={handleDelete} title="Delete">
            <Trash2 size={16} style={{ color: 'var(--danger)' }} />
          </button>
          <button className={`btn ${showAI ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => showAI ? setShowAI(false) : handleAIGenerate()}>
            <Sparkles size={16} /> {showAI ? 'Hide AI' : 'AI Analyze'}
          </button>
        </div>

        {/* Share banner */}
        {shareInfo?.is_public && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(52,211,153,0.1)', borderRadius: 'var(--radius-sm)', marginBottom: 12, fontSize: '0.8rem', color: 'var(--success)' }}>
            <Globe size={14} /> Public link active
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', padding: '4px 8px' }}
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/shared/${shareInfo.share_id}`); toast.success('Copied!'); }}>
              <Copy size={12} /> Copy
            </button>
            <a href={`/shared/${shareInfo.share_id}`} target="_blank" className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
              <ExternalLink size={12} />
            </a>
          </div>
        )}

        {/* Title */}
        <input className="editor-title-input" placeholder="Note title..." value={title}
          onChange={e => setTitle(e.target.value)} />

        {/* Meta */}
        <div className="editor-meta">
          <span>{content.split(/\s+/).filter(Boolean).length} words</span>
          <span>•</span>
          <span>{content.length} characters</span>
          {note?.updated_at && <><span>•</span><span>Updated {new Date(note.updated_at).toLocaleString()}</span></>}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          <Tag size={14} style={{ color: 'var(--text-muted)' }} />
          {tags.map(tag => (
            <span key={tag} className="tag tag-removable" onClick={() => setTags(tags.filter(t => t !== tag))}>
              {tag} <X size={10} />
            </span>
          ))}
          <input style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem', width: 100 }}
            placeholder="Add tag..." value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
            onBlur={addTag} />
        </div>

        {/* Content */}
        <textarea className="editor-textarea" placeholder="Start writing... (Markdown supported)"
          value={content} onChange={e => setContent(e.target.value)} />
      </div>

      {/* AI Panel */}
      {showAI && (
        <div className="ai-panel animate-slide">
          <div className="ai-panel-header">
            <div className="ai-panel-title"><Sparkles size={18} style={{ color: 'var(--accent)' }} /> AI Analysis</div>
            <button className="btn btn-ghost btn-icon" onClick={() => setShowAI(false)}><X size={16} /></button>
          </div>

          {aiLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 40 }}>
              <div className="spinner" style={{ width: 28, height: 28 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Analyzing with Llama 3.1...</span>
            </div>
          ) : aiResult ? (
            <>
              <div className="ai-section">
                <div className="ai-section-title">Suggested Title</div>
                <div className="ai-suggested-title" onClick={() => { setTitle(aiResult.suggested_title); toast.success('Title applied!'); }}>
                  {aiResult.suggested_title}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to apply</span>
                </div>
              </div>
              <div className="ai-section">
                <div className="ai-section-title">Summary</div>
                <div className="ai-summary-text">{aiResult.summary}</div>
              </div>
              {aiResult.action_items?.length > 0 && (
                <div className="ai-section">
                  <div className="ai-section-title">Action Items</div>
                  {aiResult.action_items.map((item: string, i: number) => (
                    <div key={i} className="ai-action-item">
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>→</span> {item}
                    </div>
                  ))}
                </div>
              )}
              {aiResult.tokens_used > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                  {aiResult.tokens_used} tokens used
                </div>
              )}
              <button className="btn btn-secondary btn-sm" onClick={handleAIGenerate} style={{ width: '100%', justifyContent: 'center' }}>
                <Sparkles size={14} /> Regenerate
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
