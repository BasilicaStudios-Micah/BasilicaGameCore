// ============================================================
// BasilicaGameCore — Cards & Decks Page
// BasilicaStudiosLLC
// ============================================================

import React, { useState, useEffect } from 'react';
import { Button, Input, Card, Badge, EmptyState } from '../shared/primitives';
import { cardsApi } from '../../utils/api';
import { useCardStore } from '../../store';
import type { CardDefinition, DeckDefinition, CardType } from '@basilica/shared';

const CARD_TYPES: CardType[] = ['action', 'item', 'unit', 'spell', 'event', 'custom'];
const TYPE_COLORS: Record<CardType, 'success' | 'accent' | 'warning' | 'error' | 'board' | 'script'> = {
  action: 'error', item: 'success', unit: 'accent', spell: 'script', event: 'warning', custom: 'board',
};

type Tab = 'cards' | 'decks';

export const CardsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('cards');
  const [showNewCard, setShowNewCard] = useState(false);
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [editCard, setEditCard] = useState<CardDefinition | null>(null);
  const [loading, setLoading] = useState(false);

  // Card form
  const [cardName, setCardName] = useState('');
  const [cardType, setCardType] = useState<CardType>('action');
  const [cardCost, setCardCost] = useState(0);
  const [cardDesc, setCardDesc] = useState('');
  const [cardScript, setCardScript] = useState('');
  const [cardTags, setCardTags] = useState('');

  // Deck form
  const [deckName, setDeckName] = useState('');

  const { cards, decks, setCards, setDecks, addCard, updateCard } = useCardStore();

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [c, d] = await Promise.all([cardsApi.listCards(), cardsApi.listDecks()]);
      setCards(c); setDecks(d);
    } catch { /* silent */ }
  }

  function resetCardForm() {
    setCardName(''); setCardType('action'); setCardCost(0);
    setCardDesc(''); setCardScript(''); setCardTags('');
    setEditCard(null); setShowNewCard(false);
  }

  async function handleSaveCard() {
    if (!cardName.trim()) return;
    setLoading(true);
    try {
      const payload = {
        name: cardName, type: cardType, cost: cardCost,
        description: cardDesc, script: cardScript || undefined,
        tags: cardTags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (editCard) {
        const updated = await cardsApi.updateCard(editCard.id, payload);
        updateCard(updated);
      } else {
        const created = await cardsApi.createCard(payload);
        addCard(created);
      }
      resetCardForm();
    } finally { setLoading(false); }
  }

  function handleEditCard(card: CardDefinition) {
    setEditCard(card);
    setCardName(card.name); setCardType(card.type); setCardCost(card.cost);
    setCardDesc(card.description); setCardScript(card.script ?? '');
    setCardTags(card.tags.join(', '));
    setShowNewCard(true);
  }

  async function handleCreateDeck() {
    if (!deckName.trim()) return;
    setLoading(true);
    try {
      const deck = await cardsApi.createDeck({ name: deckName, cardEntries: [] });
      setDecks([...decks, deck]);
      setDeckName(''); setShowNewDeck(false);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 'var(--space-8)' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 4 }}>Cards & Decks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Define cards with properties, effects, and BasilicaScript.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {(['cards', 'decks'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-sm)', fontWeight: tab === t ? 600 : 400,
                color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1, fontFamily: 'var(--font-sans)',
                transition: 'all var(--transition)',
                textTransform: 'capitalize',
              }}
            >
              {t} {t === 'cards' ? `(${cards.length})` : `(${decks.length})`}
            </button>
          ))}
        </div>

        {/* Cards Tab */}
        {tab === 'cards' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
              <Button variant="primary" onClick={() => { resetCardForm(); setShowNewCard(true); }}>+ New Card</Button>
            </div>

            {showNewCard && (
              <Card style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)', animation: 'fadeIn 150ms ease' }}>
                <h3 style={{ marginBottom: 'var(--space-4)' }}>{editCard ? 'Edit Card' : 'New Card'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <Input label="Card Name" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Fireball" />
                  <div>
                    <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Type</label>
                    <select
                      value={cardType}
                      onChange={e => setCardType(e.target.value as CardType)}
                      style={{
                        width: '100%', height: 34, fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                        padding: '0 10px', background: 'var(--bg)', color: 'var(--text-primary)',
                      }}
                    >
                      {CARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <Input label="Cost" type="number" value={cardCost} onChange={e => setCardCost(Number(e.target.value))} min={0} />
                  <Input label="Tags (comma separated)" value={cardTags} onChange={e => setCardTags(e.target.value)} placeholder="damage, fire" />
                </div>
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Description</label>
                  <textarea
                    value={cardDesc}
                    onChange={e => setCardDesc(e.target.value)}
                    placeholder="Deal 5 damage to target."
                    rows={2}
                    style={{
                      width: '100%', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                      padding: '6px 10px', background: 'var(--bg)', color: 'var(--text-primary)',
                      resize: 'vertical', outline: 'none',
                    }}
                  />
                </div>
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    BasilicaScript <Badge color="script">optional</Badge>
                  </label>
                  <textarea
                    value={cardScript}
                    onChange={e => setCardScript(e.target.value)}
                    placeholder={'on play {\n  deal_damage(target, 5)\n}'}
                    rows={4}
                    style={{
                      width: '100%', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                      padding: '8px 10px', background: '#fafaf8', color: 'var(--text-primary)',
                      resize: 'vertical', outline: 'none', lineHeight: 1.6,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                  <Button variant="primary" onClick={handleSaveCard} loading={loading}>
                    {editCard ? 'Save Changes' : 'Create Card'}
                  </Button>
                  <Button onClick={resetCardForm}>Cancel</Button>
                </div>
              </Card>
            )}

            {cards.length === 0 ? (
              <EmptyState icon="⊟" title="No cards yet" description="Create your first card above." />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                {cards.map(card => (
                  <Card key={card.id} hoverable style={{ padding: 'var(--space-4)' }} onClick={() => handleEditCard(card)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                      <Badge color={TYPE_COLORS[card.type]}>{card.type}</Badge>
                      <span style={{
                        fontSize: 'var(--text-sm)', fontWeight: 700,
                        background: 'var(--bg-secondary)', borderRadius: '50%',
                        width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{card.cost}</span>
                    </div>
                    <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 4 }}>{card.name}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {card.description || <span style={{ color: 'var(--text-tertiary)' }}>No description</span>}
                    </p>
                    {card.script && (
                      <div style={{ marginTop: 'var(--space-2)' }}>
                        <Badge color="script">scripted</Badge>
                      </div>
                    )}
                    {card.tags.length > 0 && (
                      <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {card.tags.map(tag => (
                          <span key={tag} style={{ fontSize: 10, color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 100 }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Decks Tab */}
        {tab === 'decks' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
              <Button variant="primary" onClick={() => setShowNewDeck(true)}>+ New Deck</Button>
            </div>
            {showNewDeck && (
              <Card style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ marginBottom: 'var(--space-4)' }}>New Deck</h3>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
                  <Input label="Deck Name" value={deckName} onChange={e => setDeckName(e.target.value)} placeholder="Starter Deck" style={{ flex: 1 }} />
                  <Button variant="primary" onClick={handleCreateDeck} loading={loading}>Create</Button>
                  <Button onClick={() => setShowNewDeck(false)}>Cancel</Button>
                </div>
              </Card>
            )}
            {decks.length === 0 ? (
              <EmptyState icon="⊟" title="No decks yet" description="Create a deck to organise your cards." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {decks.map(deck => (
                  <Card key={deck.id} style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span style={{ fontSize: 20 }}>⊟</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{deck.name}</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                          {deck.cardEntries.reduce((a, e) => a + e.count, 0)} cards
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">Edit</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
