import { Router, Request, Response } from 'express';
import { store } from '../utils/store';
import { generateId, rollDice, STANDARD_DIE_TYPES } from '@basilica/shared';
import type { DieDefinition, DiceRollResult } from '@basilica/shared';

const router = Router();

/** GET /api/v1/dice/definitions — list die types */
router.get('/definitions', (_req, res) => {
  res.json({ success: true, data: store.getAllDieDefinitions() });
});

/** POST /api/v1/dice/definitions — create custom die */
router.post('/definitions', (req: Request, res: Response) => {
  const die: DieDefinition = {
    id: generateId(),
    type: req.body.type ?? 'custom',
    faces: req.body.faces ?? 6,
    label: req.body.label,
    customFaces: req.body.customFaces,
  };
  res.status(201).json({ success: true, data: store.upsertDieDefinition(die) });
});

/** POST /api/v1/dice/roll — roll dice */
router.post('/roll', (req: Request, res: Response) => {
  const { dice, seed } = req.body as {
    dice: Array<{ dieDefId?: string; faces?: number; count: number }>;
    seed?: number;
  };

  if (!dice || !Array.isArray(dice)) {
    return res.status(400).json({ success: false, error: '`dice` array required' });
  }

  const results: DiceRollResult['results'] = [];

  for (const entry of dice) {
    let faces = entry.faces ?? 6;
    let dieDefId = entry.dieDefId ?? `d${faces}`;

    if (entry.dieDefId) {
      const def = store.getDieDefinitionById(entry.dieDefId);
      if (def) { faces = def.faces; dieDefId = def.id; }
    }

    const rolls = rollDice(entry.count ?? 1, faces, seed);
    const total = rolls.reduce((a, b) => a + b, 0);
    results.push({ dieDefId, rolls, total });
  }

  const grandTotal = results.reduce((a, r) => a + r.total, 0);

  const rollResult: DiceRollResult = {
    requestId: generateId(),
    rolledAt: new Date(),
    results,
    grandTotal,
  };

  res.json({ success: true, data: rollResult });
});

/** GET /api/v1/dice/standard — list standard die types */
router.get('/standard', (_req, res) => {
  const standard = STANDARD_DIE_TYPES.map(type => ({
    type,
    faces: parseInt(type.slice(1)),
  }));
  res.json({ success: true, data: standard });
});

export default router;
