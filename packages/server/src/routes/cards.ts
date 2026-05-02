import { Router, Request, Response } from 'express';
import { store } from '../utils/store';
import { generateId } from '@basilica/shared';
import type { CardDefinition, DeckDefinition } from '@basilica/shared';

const router = Router();

// ─── Cards ──────────────────────────────────────────────────

router.get('/cards', (_req, res) => {
  res.json({ success: true, data: store.getAllCardDefinitions() });
});

router.get('/cards/:id', (req, res) => {
  const card = store.getCardDefinitionById(req.params.id);
  if (!card) return res.status(404).json({ success: false, error: 'Card not found' });
  res.json({ success: true, data: card });
});

router.post('/cards', (req: Request, res: Response) => {
  const card: CardDefinition = {
    id: generateId(),
    name: req.body.name ?? 'Untitled Card',
    type: req.body.type ?? 'action',
    cost: req.body.cost ?? 0,
    description: req.body.description ?? '',
    imageUrl: req.body.imageUrl,
    tags: req.body.tags ?? [],
    script: req.body.script,
    metadata: {},
  };
  res.status(201).json({ success: true, data: store.upsertCardDefinition(card) });
});

router.put('/cards/:id', (req: Request, res: Response) => {
  const existing = store.getCardDefinitionById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Card not found' });
  const updated: CardDefinition = { ...existing, ...req.body, id: existing.id };
  res.json({ success: true, data: store.upsertCardDefinition(updated) });
});

// ─── Decks ──────────────────────────────────────────────────

router.get('/decks', (_req, res) => {
  res.json({ success: true, data: store.getAllDeckDefinitions() });
});

router.get('/decks/:id', (req, res) => {
  const deck = store.getDeckDefinitionById(req.params.id);
  if (!deck) return res.status(404).json({ success: false, error: 'Deck not found' });
  res.json({ success: true, data: deck });
});

router.post('/decks', (req: Request, res: Response) => {
  const deck: DeckDefinition = {
    id: generateId(),
    name: req.body.name ?? 'Untitled Deck',
    cardEntries: req.body.cardEntries ?? [],
    metadata: {},
  };
  res.status(201).json({ success: true, data: store.upsertDeckDefinition(deck) });
});

router.put('/decks/:id', (req: Request, res: Response) => {
  const existing = store.getDeckDefinitionById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Deck not found' });
  const updated: DeckDefinition = { ...existing, ...req.body, id: existing.id };
  res.json({ success: true, data: store.upsertDeckDefinition(updated) });
});

export default router;
