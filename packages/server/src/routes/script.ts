import { Router, Request, Response } from 'express';
import { executeScript, validateScript } from '../game-engine/scripting/interpreter';
import { store } from '../utils/store';
import type { ScriptExecutionContext } from '@basilica/shared';

const router = Router();

/** POST /api/v1/script/validate — validate BasilicaScript source */
router.post('/validate', (req: Request, res: Response) => {
  const { source } = req.body;
  if (typeof source !== 'string') {
    return res.status(400).json({ success: false, error: '`source` string required' });
  }
  const result = validateScript(source);
  res.json({ success: true, data: result });
});

/** POST /api/v1/script/execute — execute BasilicaScript in a game context */
router.post('/execute', (req: Request, res: Response) => {
  const { source, gameStateId, eventType, playerId, eventPayload } = req.body;

  if (typeof source !== 'string') {
    return res.status(400).json({ success: false, error: '`source` string required' });
  }
  if (!eventType) {
    return res.status(400).json({ success: false, error: '`eventType` required' });
  }

  const gameState = gameStateId
    ? store.getGameStateById(gameStateId)
    : null;

  if (gameStateId && !gameState) {
    return res.status(404).json({ success: false, error: 'Game state not found' });
  }

  // Build a minimal execution context if no live game state
  const ctx: ScriptExecutionContext = {
    playerId,
    eventType,
    eventPayload,
    gameState: gameState ?? ({
      id: 'sandbox',
      roomId: 'sandbox',
      gameDefId: 'sandbox',
      players: [],
      decks: [],
      turnState: {
        turnNumber: 1,
        activePlayerId: playerId ?? 'player_1',
        currentPhaseId: 'phase_1',
        orderMode: 'sequential',
        playerOrder: [playerId ?? 'player_1'],
        metadata: {},
      },
      scriptContext: req.body.scriptContext ?? {},
      log: [],
      startedAt: new Date(),
      updatedAt: new Date(),
    } as any),
  };

  const result = executeScript(source, ctx);
  res.json({ success: true, data: result });
});

export default router;
