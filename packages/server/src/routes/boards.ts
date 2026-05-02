import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { store } from '../utils/store';
import {
  generateId,
  DEFAULT_BOARD_ROWS,
  DEFAULT_BOARD_COLS,
  DEFAULT_TILE_SIZE,
} from '@basilica/shared';
import type { BoardDefinition, TileDefinition, BoardLayer } from '@basilica/shared';

const router = Router();

/** GET /api/v1/boards */
router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: store.getAllBoardDefinitions() });
});

/** GET /api/v1/boards/:id */
router.get('/:id', (req: Request, res: Response) => {
  const board = store.getBoardDefinitionById(req.params.id);
  if (!board) return res.status(404).json({ success: false, error: 'Board not found' });
  res.json({ success: true, data: board });
});

/** POST /api/v1/boards */
router.post('/', (req: Request, res: Response) => {
  const { name, rows, cols, tileSize, tileShape } = req.body;
  const baseLayer: BoardLayer = {
    id: generateId(),
    name: 'Base Layer',
    visible: true,
    locked: false,
    cells: [],
  };
  const board: BoardDefinition = {
    id: generateId(),
    name: name ?? 'Untitled Board',
    rows: rows ?? DEFAULT_BOARD_ROWS,
    cols: cols ?? DEFAULT_BOARD_COLS,
    tileSize: tileSize ?? DEFAULT_TILE_SIZE,
    tileShape: tileShape ?? 'square',
    layers: [baseLayer],
    tileDefinitions: [],
    metadata: {},
  };
  res.status(201).json({ success: true, data: store.upsertBoardDefinition(board) });
});

/** PUT /api/v1/boards/:id */
router.put('/:id', (req: Request, res: Response) => {
  const existing = store.getBoardDefinitionById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, error: 'Board not found' });
  const updated: BoardDefinition = { ...existing, ...req.body, id: existing.id };
  res.json({ success: true, data: store.upsertBoardDefinition(updated) });
});

/** DELETE /api/v1/boards/:id */
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = store.deleteBoardDefinition(req.params.id);
  res.json({ success: true, data: { deleted } });
});

/** POST /api/v1/boards/:id/tiles — add a tile definition */
router.post('/:id/tiles', (req: Request, res: Response) => {
  const board = store.getBoardDefinitionById(req.params.id);
  if (!board) return res.status(404).json({ success: false, error: 'Board not found' });
  const tile: TileDefinition = {
    id: generateId(),
    shape: req.body.shape ?? 'square',
    label: req.body.label,
    color: req.body.color,
    imageUrl: req.body.imageUrl,
    passable: req.body.passable ?? true,
    metadata: {},
  };
  const updated: BoardDefinition = {
    ...board,
    tileDefinitions: [...board.tileDefinitions, tile],
  };
  res.status(201).json({ success: true, data: store.upsertBoardDefinition(updated) });
});

export default router;
