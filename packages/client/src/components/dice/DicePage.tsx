// ============================================================
// BasilicaGameCore — Dice Page
// BasilicaStudiosLLC
// ============================================================

import React, { useState } from 'react';
import { Button, Card, Badge } from '../shared/primitives';
import { diceApi } from '../../utils/api';
import { useDiceStore } from '../../store';
import { STANDARD_DIE_TYPES } from '@basilica/shared';

interface DieConfig {
  type: string;
  faces: number;
  count: number;
}

const DIE_ICONS: Record<string, string> = {
  d4: '△', d6: '⬡', d8: '◇', d10: '⬟', d12: '⬠', d20: '⬡', d100: '%',
};

export const DicePage: React.FC = () => {
  const [tray, setTray] = useState<DieConfig[]>([]);
  const [rolling, setRolling] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [seed, setSeed] = useState('');
  const [customFaces, setCustomFaces] = useState('');

  const { rollHistory, addRollResult, clearHistory } = useDiceStore();

  const standardDice = STANDARD_DIE_TYPES.map(type => ({
    type, faces: parseInt(type.slice(1)),
  }));

  function addToTray(faces: number, type: string) {
    const existing = tray.find(d => d.faces === faces);
    if (existing) {
      setTray(tray.map(d => d.faces === faces ? { ...d, count: d.count + 1 } : d));
    } else {
      setTray([...tray, { type, faces, count: 1 }]);
    }
  }

  function removeFromTray(faces: number) {
    setTray(tray
      .map(d => d.faces === faces ? { ...d, count: d.count - 1 } : d)
      .filter(d => d.count > 0)
    );
  }

  async function roll() {
    if (tray.length === 0) return;
    setRolling(true);
    try {
      const dice = tray.map(d => ({ faces: d.faces, count: d.count }));
      const parsedSeed = seed ? parseInt(seed) : undefined;
      const result = await diceApi.roll(dice, parsedSeed);
      setLastResult(result);

      const label = tray.map(d => `${d.count}${d.type}`).join(' + ');
      addRollResult({
        id: result.requestId,
        label,
        results: result.results.flatMap((r: any) => r.rolls),
        total: result.grandTotal,
        ts: new Date(result.rolledAt),
      });
    } catch (e) {
      console.error(e);
    } finally { setRolling(false); }
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 'var(--space-8)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 4 }}>Dice & RNG</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Roll dice with optional seeded RNG for reproducible results.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)' }}>
          {/* Left: Die Picker + Tray */}
          <div>
            {/* Standard Dice */}
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>Standard Dice</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
              {standardDice.map(die => (
                <button
                  key={die.type}
                  onClick={() => addToTray(die.faces, die.type)}
                  style={{
                    width: 72, height: 72,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 4,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all var(--transition)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px var(--accent-subtle)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <span style={{ fontSize: 20, color: 'var(--text-secondary)' }}>{DIE_ICONS[die.type] ?? '◇'}</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{die.type}</span>
                </button>
              ))}
            </div>

            {/* Tray */}
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>Roll Tray</p>
            <Card style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)', minHeight: 80 }}>
              {tray.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-4)' }}>
                  Click dice above to add them to the tray
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {tray.map(die => (
                    <div key={die.faces} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)', padding: '5px 10px',
                    }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                        {die.count}{die.type}
                      </span>
                      <button
                        onClick={() => addToTray(die.faces, die.type)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', fontWeight: 700, padding: 0, fontSize: 14 }}
                      >+</button>
                      <button
                        onClick={() => removeFromTray(die.faces)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontWeight: 700, padding: 0, fontSize: 14 }}
                      >−</button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Seed & Roll */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Seed <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span>
                </label>
                <input
                  type="number"
                  value={seed}
                  onChange={e => setSeed(e.target.value)}
                  placeholder="Random"
                  style={{
                    width: '100%', height: 34, fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-sm)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '0 10px',
                    background: 'var(--bg)', color: 'var(--text-primary)', outline: 'none',
                  }}
                />
              </div>
              <Button
                variant="primary"
                onClick={roll}
                loading={rolling}
                disabled={tray.length === 0}
                size="lg"
                style={{ minWidth: 120 }}
              >
                {rolling ? 'Rolling…' : '🎲 Roll'}
              </Button>
              <Button variant="ghost" onClick={() => setTray([])}>Clear</Button>
            </div>

            {/* Result Display */}
            {lastResult && (
              <Card style={{ marginTop: 'var(--space-5)', padding: 'var(--space-5)', textAlign: 'center', animation: 'fadeIn 200ms ease' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 8 }}>Result</p>
                <p style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
                  {lastResult.grandTotal}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
                  {lastResult.results.map((r: any, i: number) => (
                    <div key={i}>
                      {r.rolls.map((roll: number, j: number) => (
                        <span key={j} style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 32, height: 32, borderRadius: 6,
                          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                          fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--text-sm)',
                          margin: 2,
                        }}>{roll}</span>
                      ))}
                    </div>
                  ))}
                </div>
                {seed && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 8 }}>
                    Seed: <code style={{ fontFamily: 'var(--font-mono)' }}>{seed}</code>
                  </p>
                )}
              </Card>
            )}
          </div>

          {/* Right: Roll History */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>History</p>
              {rollHistory.length > 0 && (
                <Button size="sm" variant="ghost" onClick={clearHistory}>Clear</Button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {rollHistory.length === 0 ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-6)' }}>
                  No rolls yet
                </p>
              ) : (
                rollHistory.map((roll) => (
                  <Card key={roll.id} style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>{roll.label}</span>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                          [{roll.results.join(', ')}]
                        </div>
                      </div>
                      <span style={{ fontSize: 'var(--text-xl)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{roll.total}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
