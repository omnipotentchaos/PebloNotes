import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notesApi } from '../api/client';
import { Search, FileText, Clock } from 'lucide-react';

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => { ref.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try { const r = await notesApi.list({ search: query }); setResults(r.notes.slice(0, 8)); }
      catch {}
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const select = (id: string) => { navigate(`/notes/${id}`); onClose(); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[idx]) select(results[idx].id);
  };

  return (
    <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmd-modal">
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
          <Search size={16} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <input ref={ref} className="cmd-input" placeholder="Search notes..."
            value={query} onChange={e => { setQuery(e.target.value); setIdx(0); }} onKeyDown={onKey} />
        </div>
        <div className="cmd-results">
          {loading && <div style={{ padding: 16, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}
          {!loading && query && results.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)', fontSize: '0.82rem' }}>No results</div>}
          {results.map((n, i) => (
            <div key={n.id} className={`cmd-item ${i === idx ? 'active' : ''}`}
              onClick={() => select(n.id)} onMouseEnter={() => setIdx(i)}>
              <FileText size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="cmd-item-title">{n.title || 'Untitled'}</div>
                <div className="cmd-item-sub">{n.content?.substring(0, 60) || 'Empty'}</div>
              </div>
              <Clock size={11} style={{ color: 'var(--text-3)' }} />
            </div>
          ))}
        </div>
        <div className="cmd-footer">
          <span><span className="kbd">↑↓</span> Navigate</span>
          <span><span className="kbd">↵</span> Open</span>
          <span><span className="kbd">Esc</span> Close</span>
        </div>
      </div>
    </div>
  );
}
