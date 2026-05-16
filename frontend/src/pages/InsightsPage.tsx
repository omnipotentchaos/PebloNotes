import { useState, useEffect } from 'react';
import { insightsApi, aiApi } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { FileText, TrendingUp, Sparkles, Hash, Archive, Globe, BookOpen } from 'lucide-react';

const COLORS = ['#6d5cff', '#a78bfa', '#5b9cf5', '#2dd4a0', '#f5b731', '#f06060', '#f472b6', '#818cf8'];
const tooltipStyle = { background: '#14141e', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, color: '#f0f0f5', fontSize: '0.8rem' };

export default function InsightsPage() {
  const [data, setData] = useState<any>(null);
  const [aiUsage, setAiUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([insightsApi.get(), aiApi.getUsage()])
      .then(([d, a]) => { setData(d); setAiUsage(a); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!data) return <div className="dashboard"><p style={{ color: 'var(--text-3)' }}>Could not load insights.</p></div>;

  const o = data.overview || {};
  const pie = (data.categories || []).map((c: any) => ({ name: c.name, value: c.count }));

  return (
    <div className="dashboard" style={{ flex: 1, overflowY: 'auto' }}>
      <div className="dash-title">Productivity Insights</div>

      <div className="stats-row">
        <Stat icon={<FileText size={22} />} label="Total Notes" value={o.total_notes} color="var(--accent)" />
        <Stat icon={<TrendingUp size={22} />} label="Active" value={o.active_notes} color="var(--green)" />
        <Stat icon={<Archive size={22} />} label="Archived" value={o.archived_notes} color="var(--text-3)" />
        <Stat icon={<Globe size={22} />} label="Shared" value={o.shared_notes} color="var(--blue)" />
        <Stat icon={<BookOpen size={22} />} label="Words" value={(o.total_words || 0).toLocaleString()} color="var(--amber)" />
        <Stat icon={<Sparkles size={22} />} label="AI Summaries" value={aiUsage?.total_summaries || 0} color="var(--accent)" />
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card-title">Daily Activity</div>
          {data.daily_activity?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.daily_activity}>
                <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6d5cff" stopOpacity={.35} /><stop offset="100%" stopColor="#6d5cff" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="day" stroke="#555568" fontSize={11} tickLine={false} />
                <YAxis stroke="#555568" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="notes_edited" stroke="#6d5cff" fill="url(#ag)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </div>

        <div className="dash-card">
          <div className="dash-card-title">Categories</div>
          {pie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart><Pie data={pie} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3}>
                  {pie.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {pie.map((d: any, i: number) => (
                  <span key={d.name} style={{ fontSize: '0.7rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />{d.name}
                  </span>
                ))}
              </div>
            </>
          ) : <Empty />}
        </div>

        <div className="dash-card">
          <div className="dash-card-title">Weekly Trend</div>
          {data.weekly_activity?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.weekly_activity}>
                <XAxis dataKey="week" stroke="#555568" fontSize={11} tickLine={false} />
                <YAxis stroke="#555568" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="notes_edited" fill="#6d5cff" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </div>

        <div className="dash-card">
          <div className="dash-card-title"><Hash size={18} style={{ marginRight: 6 }} />Top Tags</div>
          {data.top_tags?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.top_tags.slice(0, 8).map((tag: any, i: number) => (
                <div key={tag.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.8rem', width: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tag.name}</span>
                  <div style={{ flex: 1, height: 5, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(tag.count / (data.top_tags[0]?.count || 1)) * 100}%`, background: COLORS[i % COLORS.length], borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', width: 20, textAlign: 'right' }}>{tag.count}</span>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </div>
      </div>

      {data.recent_notes?.length > 0 && (
        <div className="dash-card" style={{ marginTop: 16 }}>
          <div className="dash-card-title">Recently Edited</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.recent_notes.map((n: any) => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 'var(--r-sm)', background: 'var(--bg-3)' }}>
                <FileText size={18} style={{ color: 'var(--text-3)' }} />
                <span style={{ flex: 1, fontWeight: 500, fontSize: '0.82rem' }}>{n.title || 'Untitled'}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{new Date(n.updated_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: any; color: string }) {
  return (
    <div className="stat-box">
      <div style={{ color, opacity: .7 }}>{icon}</div>
      <div className="stat-box-label">{label}</div>
      <div className="stat-box-value">{value ?? 0}</div>
    </div>
  );
}

function Empty() {
  return <div style={{ height: 200, display: 'grid', placeItems: 'center', color: 'var(--text-3)', fontSize: '0.8rem' }}>No data yet</div>;
}
