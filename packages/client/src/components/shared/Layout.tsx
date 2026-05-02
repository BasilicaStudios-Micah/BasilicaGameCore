import React from 'react';
import { useUIStore } from '../store';

const NAV_ITEMS = [
  { id: 'lobby',   label: 'Lobby',         icon: '⊞', desc: 'Rooms & players' },
  { id: 'board',   label: 'Board Builder', icon: '▦', desc: 'Design game boards' },
  { id: 'cards',   label: 'Cards & Decks', icon: '⊟', desc: 'Card definitions' },
  { id: 'dice',    label: 'Dice',          icon: '⚄', desc: 'Roll & configure' },
  { id: 'script',  label: 'BasilicaScript',icon: '⟨⟩', desc: 'Game logic DSL' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { activeTab, setActiveTab } = useUIStore();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-width)',
        height: '100%',
        background: 'var(--bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: '16px 20px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26,
              background: 'var(--text-primary)',
              borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: 'var(--bg)', fontWeight: 700,
              flexShrink: 0,
            }}>B</div>
            <span style={{ fontWeight: 600, fontSize: 'var(--text-base)', letterSpacing: '-0.02em' }}>
              BasilicaGameCore
            </span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', paddingLeft: 34 }}>
            BasilicaStudiosLLC
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 8px', overflow: 'auto' }}>
          <p style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--text-tertiary)',
            padding: '8px 10px 4px',
          }}>Engine</p>
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 10px',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  background: active ? 'var(--bg-secondary)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  textAlign: 'left',
                  transition: 'all var(--transition)',
                  marginBottom: 1,
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: active ? 600 : 400 }}>
                    {item.label}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>v0.1.0</span>
          <a
            href="https://github.com/BasilicaStudiosLLC/BasilicaGameCore"
            target="_blank"
            rel="noopener"
            style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
          >GitHub ↗</a>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </main>
    </div>
  );
};
