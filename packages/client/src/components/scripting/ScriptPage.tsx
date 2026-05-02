// ============================================================
// BasilicaGameCore — BasilicaScript Editor Page
// BasilicaStudiosLLC
// ============================================================

import React, { useState, useRef } from 'react';
import { Button, Card, Badge } from '../shared/primitives';
import { scriptApi } from '../../utils/api';

const EXAMPLE_SCRIPTS: Record<string, string> = {
  'Card Effect': `// Deal damage on play, heal on turn end
on play {
  if player.mana >= 3 {
    deal_damage(target, 5)
    draw_cards(player, 1)
    set player.mana = player.mana - 3
    log("Fireball cast!")
  }
}

on turn_end {
  heal(player, 1)
}`,
  'Win Condition': `// Check win condition on turn start
on turn_start {
  if player.health <= 0 {
    end_game(opponent)
  }

  if opponent.health <= 0 {
    end_game(player)
  }
}`,
  'Phase Script': `// Auto-draw at phase enter
on phase_enter {
  draw_cards(active_player, 2)
  log("Draw phase: drew 2 cards")
  next_phase
}`,
  'Unit Move': `// Handle movement
on move {
  if player.action_points >= 1 {
    set player.action_points = player.action_points - 1
    log("Unit moved")
  }
}`,
};

const EVENT_TYPES = [
  'on_play', 'on_turn_start', 'on_turn_end',
  'on_phase_enter', 'on_phase_exit', 'on_draw',
  'on_discard', 'on_move', 'on_attack',
  'on_game_start', 'on_game_end',
];

interface ExecutionOutput {
  success: boolean;
  mutations: Array<{ type: string; path: string; value: unknown }>;
  errors: string[];
  log: string[];
}

export const ScriptPage: React.FC = () => {
  const [source, setSource] = useState(EXAMPLE_SCRIPTS['Card Effect']);
  const [eventType, setEventType] = useState('on_play');
  const [scriptContext, setScriptContext] = useState('{\n  "player": { "mana": 5, "health": 20 },\n  "opponent": { "health": 20 }\n}');
  const [output, setOutput] = useState<ExecutionOutput | null>(null);
  const [validating, setValidating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleValidate() {
    setValidating(true);
    setValidationResult(null);
    try {
      const result = await scriptApi.validate(source);
      setValidationResult(result);
    } catch (e: any) {
      setValidationResult({ valid: false, errors: [e.message] });
    } finally { setValidating(false); }
  }

  async function handleExecute() {
    setExecuting(true);
    setOutput(null);
    try {
      let ctx: Record<string, unknown> = {};
      try { ctx = JSON.parse(scriptContext); } catch { /* use empty */ }
      const result = await scriptApi.execute(source, eventType, { scriptContext: ctx });
      setOutput(result);
    } catch (e: any) {
      setOutput({ success: false, mutations: [], errors: [e.message], log: [] });
    } finally { setExecuting(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newSource = source.substring(0, start) + '  ' + source.substring(end);
      setSource(newSource);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      });
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 32px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 4 }}>BasilicaScript</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              A lightweight DSL for card effects, win conditions, and game rules.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button size="sm" onClick={handleValidate} loading={validating}>Validate</Button>
            <Button size="sm" variant="primary" onClick={handleExecute} loading={executing}>▶ Run</Button>
          </div>
        </div>

        {/* Examples */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', alignSelf: 'center' }}>Examples:</span>
          {Object.keys(EXAMPLE_SCRIPTS).map(name => (
            <button
              key={name}
              onClick={() => setSource(EXAMPLE_SCRIPTS[name])}
              style={{
                fontSize: 'var(--text-xs)', padding: '3px 8px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 100, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                color: 'var(--text-secondary)',
                transition: 'all var(--transition)',
              }}
            >{name}</button>
          ))}
        </div>
      </div>

      {/* Editor body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', overflow: 'hidden' }}>
        {/* Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>
          {validationResult && (
            <div style={{
              padding: '8px 16px',
              background: validationResult.valid ? 'var(--success-bg)' : 'var(--error-bg)',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 'var(--text-xs)',
              color: validationResult.valid ? 'var(--success)' : 'var(--error)',
            }}>
              {validationResult.valid ? '✓ Valid BasilicaScript' : `✗ ${validationResult.errors.join(', ')}`}
            </div>
          )}
          <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
            {/* Line numbers */}
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: 40,
              background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
              overflow: 'hidden', paddingTop: 16,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: 8,
              pointerEvents: 'none',
            }}>
              {source.split('\n').map((_, i) => (
                <div key={i} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', lineHeight: '22px' }}>
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={source}
              onChange={e => { setSource(e.target.value); setValidationResult(null); }}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              style={{
                position: 'absolute', top: 0, left: 40, right: 0, bottom: 0,
                fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: '22px',
                padding: '16px 20px',
                background: 'var(--bg)', color: 'var(--text-primary)',
                border: 'none', outline: 'none', resize: 'none',
                tabSize: 2,
              }}
            />
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Event & Context */}
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>Execution Context</p>

            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Trigger Event
              </label>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                style={{
                  width: '100%', height: 32, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  padding: '0 8px', background: 'var(--bg)', color: 'var(--text-primary)',
                }}
              >
                {EVENT_TYPES.map(et => <option key={et} value={et}>{et}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Script Context (JSON)
              </label>
              <textarea
                value={scriptContext}
                onChange={e => setScriptContext(e.target.value)}
                rows={6}
                style={{
                  width: '100%', fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.6,
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  padding: '6px 8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                  resize: 'none', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Output */}
          <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>Output</p>
            {!output ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Press ▶ Run to execute the script</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', animation: 'fadeIn 150ms ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge color={output.success ? 'success' : 'error'}>
                    {output.success ? '✓ Success' : '✗ Failed'}
                  </Badge>
                </div>

                {output.log.length > 0 && (
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Logs</p>
                    <div style={{
                      background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
                      padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: 11,
                    }}>
                      {output.log.map((l, i) => (
                        <div key={i} style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>› {l}</div>
                      ))}
                    </div>
                  </div>
                )}

                {output.mutations.length > 0 && (
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      State Mutations ({output.mutations.length})
                    </p>
                    {output.mutations.map((m, i) => (
                      <div key={i} style={{
                        background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
                        padding: '5px 8px', fontFamily: 'var(--font-mono)', fontSize: 10,
                        marginBottom: 2, display: 'flex', gap: 6,
                      }}>
                        <Badge color="script">{m.type}</Badge>
                        <span style={{ color: 'var(--text-secondary)' }}>{m.path}</span>
                        <span style={{ color: 'var(--accent)' }}>= {JSON.stringify(m.value)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {output.errors.length > 0 && (
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--error)', marginBottom: 4 }}>Errors</p>
                    {output.errors.map((e, i) => (
                      <div key={i} style={{
                        background: 'var(--error-bg)', borderRadius: 'var(--radius)',
                        padding: '5px 8px', fontSize: 11, color: 'var(--error)',
                        fontFamily: 'var(--font-mono)', marginBottom: 2,
                      }}>{e}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Language Reference */}
          <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Built-in Functions</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {['deal_damage(target, n)', 'heal(target, n)', 'draw_cards(player, n)', 'discard_cards(player, n)', 'log(msg)', 'end_turn', 'next_phase', 'end_game(winner)'].map(fn => (
                <code key={fn} style={{
                  fontSize: 9, fontFamily: 'var(--font-mono)',
                  background: 'var(--tag-script-bg)', color: 'var(--tag-script)',
                  padding: '2px 5px', borderRadius: 3,
                }}>{fn}</code>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
