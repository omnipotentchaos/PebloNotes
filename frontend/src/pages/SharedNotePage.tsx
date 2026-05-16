import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { shareApi } from '../api/client';
import { Calendar, User, Tag, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function SharedNotePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shareId) return;
    shareApi.getSharedNote(shareId)
      .then(setNote)
      .catch(err => setError(err.message || 'Note not found'))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) return <div className="shared-page"><div className="page-loader"><div className="spinner" /></div></div>;
  if (error) return (
    <div className="shared-page">
      <div className="shared-article" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.3rem' }}>Note Not Found</h1>
        <p style={{ color: 'var(--text-2)', marginTop: 6 }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="shared-page">
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <div className="sidebar-brand" style={{ justifyContent: 'center' }}>
          <div className="sidebar-brand-icon">P</div>
          <span className="sidebar-brand-text">PebloNotes</span>
        </div>
      </div>

      <div className="shared-article animate-in">
        <h1>{note?.title || 'Untitled'}</h1>
        <div className="shared-meta">
          {note?.author_name && <span><User size={13} /> {note.author_name}</span>}
          {note?.created_at && <span><Calendar size={13} /> {new Date(note.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
          {note?.word_count > 0 && <span><FileText size={13} /> {note.word_count} words</span>}
        </div>

        {note?.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 20 }}>
            {note.tags.map((t: string) => <span key={t} className="tag"><Tag size={9} /> {t}</span>)}
          </div>
        )}

        <div className="md-preview"><ReactMarkdown>{note?.content || ''}</ReactMarkdown></div>

        {note?.ai_summary && (
          <div style={{ marginTop: 28, padding: 18, background: 'var(--bg-3)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>✦ AI Summary</div>
            <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.7 }}>{note.ai_summary}</p>
          </div>
        )}
      </div>

      <div className="shared-footer">Shared via <strong>PebloNotes</strong> — AI-Powered Notes Workspace</div>
    </div>
  );
}
