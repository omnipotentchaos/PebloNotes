import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FileText, BarChart3, LogOut, Plus, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { notesApi } from '../api/client';
import { getTagStyle } from '../utils/colors';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [noteCount, setNoteCount] = useState(0);

  useEffect(() => {
    const fetchTags = () => {
      notesApi.getTags().then(r => setTags(r.tags)).catch(() => {});
      notesApi.list({}).then(r => setNoteCount(r.total)).catch(() => {});
    };
    fetchTags();
    
    const handleAdd = (e: any) => setTags(prev => prev.find(x => x.name === e.detail) ? prev.map(x => x.name === e.detail ? {...x, count: x.count + 1} : x) : [...prev, { name: e.detail, count: 1 }].sort((a,b)=>b.count-a.count));
    const handleRem = (e: any) => setTags(prev => prev.map(x => x.name === e.detail ? {...x, count: x.count - 1} : x).filter(x => x.count > 0));

    document.addEventListener('refresh-tags', fetchTags);
    document.addEventListener('optimistic-tag', handleAdd);
    document.addEventListener('optimistic-tag-remove', handleRem);
    return () => {
      document.removeEventListener('refresh-tags', fetchTags);
      document.removeEventListener('optimistic-tag', handleAdd);
      document.removeEventListener('optimistic-tag-remove', handleRem);
    };
  }, []);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="PebloNotes Logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
          <span className="sidebar-brand-text">PebloNotes</span>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Workspace</div>
          <NavLink to="/notes" end className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <FileText size={18} /> All Notes <span className="count">{noteCount}</span>
          </NavLink>
          <NavLink to="/insights" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <BarChart3 size={18} /> Insights
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Tags</div>
          {tags.slice(0, 8).map(t => (
            <button key={t.name} className="sidebar-item" onClick={() => navigate('/notes')}>
              <span className="tag" style={{ ...getTagStyle(t.name), padding: '2px 6px', fontSize: '0.7rem' }}>#{t.name}</span>
              <span className="count">{t.count}</span>
            </button>
          ))}
          {tags.length === 0 && <div style={{ padding: '4px 12px', fontSize: '0.75rem', color: 'var(--text-3)' }}>No tags yet</div>}
        </div>

        <div style={{ flex: 1 }} />

        <div className="sidebar-section">
          <button className="sidebar-item" onClick={() => navigate('/notes/new')}>
            <Plus size={18} /> New Note
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
              <span className="kbd">Alt</span><span className="kbd">N</span>
            </span>
          </button>
          <button className="sidebar-item" onClick={() => document.dispatchEvent(new CustomEvent('open-search'))}>
            <Search size={18} /> Search
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
              <span className="kbd">Ctrl</span><span className="kbd">K</span>
            </span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="avatar">{initials}</div>
          <div className="avatar-info">
            <div className="avatar-name">{user?.name}</div>
            <div className="avatar-email">{user?.email}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => { logout(); navigate('/login'); }} title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <Outlet />
    </div>
  );
}
