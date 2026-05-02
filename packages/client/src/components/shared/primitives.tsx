// ============================================================
// BasilicaGameCore — UI Primitives
// BasilicaStudiosLLC
// ============================================================

import React from 'react';

// ─── Button ─────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  loading,
  children,
  disabled,
  style,
  ...props
}) => {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    border: '1px solid transparent',
    borderRadius: 'var(--radius)',
    transition: 'all var(--transition)',
    opacity: disabled || loading ? 0.6 : 1,
    whiteSpace: 'nowrap',
    ...(size === 'sm' && { fontSize: 'var(--text-sm)', padding: '4px 10px', height: 28 }),
    ...(size === 'md' && { fontSize: 'var(--text-sm)', padding: '6px 14px', height: 34 }),
    ...(size === 'lg' && { fontSize: 'var(--text-base)', padding: '10px 20px', height: 42 }),
    ...(variant === 'primary' && {
      background: 'var(--accent)',
      color: 'var(--text-inverse)',
      borderColor: 'var(--accent)',
    }),
    ...(variant === 'secondary' && {
      background: 'var(--bg)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border)',
      boxShadow: 'var(--shadow-xs)',
    }),
    ...(variant === 'ghost' && {
      background: 'transparent',
      color: 'var(--text-secondary)',
      borderColor: 'transparent',
    }),
    ...(variant === 'danger' && {
      background: 'var(--error-bg)',
      color: 'var(--error)',
      borderColor: 'var(--error)',
    }),
    ...style,
  };

  return (
    <button style={base} disabled={disabled || loading} {...props}>
      {loading && <span style={{ animation: 'spin 600ms linear infinite', display: 'inline-block' }}>↻</span>}
      {children}
    </button>
  );
};

// ─── Badge ──────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode;
  color?: 'default' | 'accent' | 'success' | 'warning' | 'error' | 'board' | 'card' | 'dice' | 'script';
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'default' }) => {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
    accent: { background: 'var(--accent-subtle)', color: 'var(--accent)' },
    success: { background: 'var(--success-bg)', color: 'var(--success)' },
    warning: { background: 'var(--warning-bg)', color: 'var(--warning)' },
    error: { background: 'var(--error-bg)', color: 'var(--error)' },
    board: { background: 'var(--tag-board-bg)', color: 'var(--tag-board)' },
    card: { background: 'var(--tag-card-bg)', color: 'var(--tag-card)' },
    dice: { background: 'var(--tag-dice-bg)', color: 'var(--tag-dice)' },
    script: { background: 'var(--tag-script-bg)', color: 'var(--tag-script)' },
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 'var(--text-xs)',
      fontWeight: 500,
      padding: '2px 7px',
      borderRadius: 100,
      ...styles[color],
    }}>
      {children}
    </span>
  );
};

// ─── Input ──────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, style, id, ...props }) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-primary)',
          background: 'var(--bg)',
          border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '6px 10px',
          height: 34,
          outline: 'none',
          transition: 'border-color var(--transition), box-shadow var(--transition)',
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent)';
          e.target.style.boxShadow = '0 0 0 3px var(--accent-subtle)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'var(--error)' : 'var(--border)';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--error)' }}>{error}</span>}
    </div>
  );
};

// ─── Card ───────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, onClick, hoverable }) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      ...(hoverable && { cursor: 'pointer', transition: 'box-shadow var(--transition), transform var(--transition)' }),
      ...style,
    }}
    onMouseEnter={hoverable ? (e) => {
      (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
      (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
    } : undefined}
    onMouseLeave={hoverable ? (e) => {
      (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
    } : undefined}
  >
    {children}
  </div>
);

// ─── Divider ────────────────────────────────────────────────

export const Divider: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', ...style }} />
);

// ─── Empty State ────────────────────────────────────────────

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-12)',
    textAlign: 'center',
    gap: 'var(--space-3)',
    animation: 'fadeIn 200ms ease',
  }}>
    <span style={{ fontSize: 36 }}>{icon}</span>
    <div>
      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</p>
      {description && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{description}</p>}
    </div>
    {action}
  </div>
);
