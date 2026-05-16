import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Shield, FileText, BarChart3, Search } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-brand">
          <img src="/logo.png" alt="PebloNotes Logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
          <span>PebloNotes</span>
        </div>
        <div className="landing-nav-links">
          <Link to="/login" className="btn btn-ghost">Log in</Link>
          <Link to="/signup" className="btn btn-primary">Get PebloNotes</Link>
        </div>
      </nav>

      <main className="landing-main">
        <header className="landing-hero animate-fade">
          <h1>Write, plan, and organize with AI.</h1>
          <p>PebloNotes is the connected workspace where better, faster work happens. Now with Llama 3.1 inside.</p>
          <Link to="/signup" className="btn btn-primary btn-lg">
            Get PebloNotes <ArrowRight size={18} style={{ marginLeft: 8 }} />
          </Link>
          
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(245, 183, 49, 0.1)', color: 'var(--amber)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(245, 183, 49, 0.2)' }}>
              <span style={{ fontSize: '1.2rem' }}>💡</span> 
              <span><strong>Note for evaluators:</strong> The backend is hosted on Render's free tier. Initial login may take ~50 seconds to wake the server.</span>
            </div>
          </div>
        </header>

        <section className="landing-preview animate-fade" style={{ animationDelay: '0.2s' }}>
          <div className="landing-preview-window">
             <div className="mock-window-header">
                <div className="mock-dots">
                   <div className="mock-dot" style={{background: '#f87171'}}></div>
                   <div className="mock-dot" style={{background: '#fbbf24'}}></div>
                   <div className="mock-dot" style={{background: '#4ade80'}}></div>
                </div>
             </div>
             <div className="mock-window-body">
                <div className="mock-sidebar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                    <img src="/logo.png" style={{width: 20, height: 20, borderRadius: 4}} />
                    <span style={{fontWeight: 600, fontSize: '0.9rem'}}>PebloNotes</span>
                  </div>
                  <div style={{fontSize: '0.65rem', color: 'var(--text-3)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em'}}>WORKSPACE</div>
                  <div className="mock-nav-item active"><FileText size={14}/> All Notes</div>
                  <div className="mock-nav-item"><BarChart3 size={14}/> Insights</div>
                  <div style={{fontSize: '0.65rem', color: 'var(--text-3)', marginTop: 24, marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em'}}>TAGS</div>
                  <div className="mock-nav-item"><span style={{color: '#4ade80', fontSize: '0.8rem'}}>#</span> product</div>
                  <div className="mock-nav-item"><span style={{color: '#818cf8', fontSize: '0.8rem'}}>#</span> ideas</div>
                </div>

                <div className="mock-notes-list">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                    <strong style={{fontSize: '0.9rem'}}>All Notes</strong>
                    <div style={{background: 'var(--text-0)', color: 'var(--bg-0)', padding: '4px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600}}>+ New</div>
                  </div>
                  <div style={{background: 'var(--bg-3)', padding: '6px 12px', borderRadius: 6, fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6}}>
                    <Search size={12}/> Search notes...
                  </div>
                  <div className="mock-note-card active">
                    <div style={{fontWeight: 600, fontSize: '0.85rem', marginBottom: 4}}>Product Roadmap Q3</div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: 8}}>Here is the detailed outline for...</div>
                    <div style={{display: 'flex', gap: 6}}><span className="mock-tag" style={{color: '#4ade80', background: 'rgba(74, 222, 128, 0.15)'}}>product</span></div>
                  </div>
                  <div className="mock-note-card">
                    <div style={{fontWeight: 600, fontSize: '0.85rem', marginBottom: 4}}>Meeting Notes</div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: 8}}>Discussing the new UI...</div>
                    <div style={{display: 'flex', gap: 6}}><span className="mock-tag" style={{color: '#818cf8', background: 'rgba(129, 140, 248, 0.15)'}}>ideas</span></div>
                  </div>
                </div>

                <div className="mock-content">
                  <div className="mock-title">Product Roadmap Q3</div>
                  <div className="mock-text">Here is the detailed outline for our upcoming features. We are focusing heavily on integrating Llama 3.1 for instantaneous AI assistance...</div>
                  <div className="mock-ai-box">
                    <Sparkles size={16} color="var(--accent)" style={{marginRight: 10, flexShrink: 0}}/>
                    <div>
                      <strong style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem' }}>AI Summary</strong>
                      <span style={{fontSize: '0.85rem'}}>The roadmap prioritizes performance, mobile responsiveness, and collaborative editing. Target release is late November.</span>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </section>

        <section className="landing-features">
          <div className="feature-card">
            <Sparkles className="feature-icon" />
            <h3>AI-Powered Insights</h3>
            <p>Automatically generate summaries and extract action items using Cerebras Llama 3.1.</p>
          </div>
          <div className="feature-card">
            <Zap className="feature-icon" />
            <h3>Lightning Fast</h3>
            <p>Keyboard-first design with Cmd+K command palette and instant search.</p>
          </div>
          <div className="feature-card">
            <Shield className="feature-icon" />
            <h3>Secure & Private</h3>
            <p>Your notes are safe, secure, and accessible only to you until you choose to share.</p>
          </div>
        </section>
      </main>
      
      <footer className="landing-footer">
        <div>© 2026 PebloNotes. Built for the Peblo Challenge.</div>
      </footer>
    </div>
  );
}
