// ============================================================
// BasilicaGameCore — Board Builder Page
// BasilicaStudiosLLC
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Input, Card, Badge, EmptyState } from '../shared/primitives';
import { boardsApi } from '../../utils/api';
import { useBoardStore } from '../../store';
import type { BoardDefinition, BoardCell, TileDefinition } from '@basilica/shared';
import { generateId } from '@basilica/shared';

const PALETTE_COLORS = [
  '#e8e8e4', '#fde68a', '#bbf7d0', '#bfdbfe', '#fecaca',
  '#ddd6fe', '#fed7aa', '#a7f3d0', '#c7d2fe', '#fbcfe8',
  '#1a1a18', '#6366f1', '#10b981', '#f59e0b', '#ef4444',
];

type Tool = 'paint' | 'erase' | 'select';

export const BoardBuilderPage: React.FC = () => {
  const { boards, activeBoard, setBoards, setActiveBoard, updateBoard } = useBoardStore();
  const [selectedTileDefId, setSelectedTileDefId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('paint');
  const [isPainting, setIsPainting] = useState(false);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newRows, setNewRows] = useState(8);
  const [newCols, setNewCols] = useState(8);
  const [loading, setLoading] = useState(false);
  const [newTileColor, setNewTileColor] = useState(PALETTE_COLORS[0]);
  const [newTileLabel, setNewTileLabel] = useState('');
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);

  useEffect(() => { loadBoards(); }, []);

  async function loadBoards() {
    try {
      const data = await boardsApi.list();
      setBoards(data);
    } catch { /* silent */ }
  }

  async function handleCreateBoard() {
    if (!newBoardName.trim()) return;
    setLoading(true);
    try {
      const board = await boardsApi.create({ name: newBoardName, rows: newRows, cols: newCols, tileShape: 'square' });
      setBoards([...boards, board]);
      setActiveBoard(board);
      setShowNewBoard(false);
      setNewBoardName('');
    } finally { setLoading(false); }
  }

  async function handleAddTile() {
    if (!activeBoard || !newTileLabel.trim()) return;
    const updated = await boardsApi.addTile(activeBoard.id, {
      shape: 'square', label: newTileLabel, color: newTileColor, passable: true,
    });
    updateBoard(updated);
    setNewTileLabel('');
    setSelectedTileDefId(updated.tileDefinitions[updated.tileDefinitions.length - 1]?.id ?? null);
  }

  const getCell = (board: BoardDefinition, layerIdx: number, row: number, col: number): BoardCell | undefined =>
    board.layers[layerIdx]?.cells.find(c => c.row === row && c.col === col);

  const paintCell = useCallback(async (row: number, col: number) => {
    if (!activeBoard || !activeBoard.layers[activeLayerIndex]) return;
    const layer = activeBoard.layers[activeLayerIndex];

    let updatedCells: BoardCell[];
    if (activeTool === 'erase') {
      updatedCells = layer.cells.filter(c => !(c.row === row && c.col === col));
    } else if (activeTool === 'paint' && selectedTileDefId) {
      const existing = layer.cells.findIndex(c => c.row === row && c.col === col);
      const newCell: BoardCell = { row, col, tileDefId: selectedTileDefId, metadata: {} };
      if (existing >= 0) {
        updatedCells = layer.cells.map((c, i) => i === existing ? newCell : c);
      } else {
        updatedCells = [...layer.cells, newCell];
      }
    } else return;

    const updatedLayers = activeBoard.layers.map((l, i) =>
      i === activeLayerIndex ? { ...l, cells: updatedCells } : l
    );
    const updatedBoard = { ...activeBoard, layers: updatedLayers };
    updateBoard(updatedBoard);

    try {
      const saved = await boardsApi.update(activeBoard.id, { layers: updatedLayers });
      updateBoard(saved);
    } catch { /* optimistic update already applied */ }
  }, [activeBoard, activeLayerIndex, activeTool, selectedTileDefId]);

  const getTileColor = (board: BoardDefinition, tileDefId: string): string => {
    return board.tileDefinitions.find(t => t.id === tileDefId)?.color ?? 'var(--bg-secondary)';
  };

  const getTileLabel = (board: BoardDefinition, tileDefId: string): string => {
    return board.tileDefinitions.find(t => t.id === tileDefId)?.label ?? '';
  };

  if (!activeBoard) {
    return (
      <div style={{ height: '100%', overflow: 'auto', padding: 'var(--space-8)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)' }}>
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 4 }}>Board Builder</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                Design game boards with tiles, zones, and layers.
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowNewBoard(true)}>+ New Board</Button>
          </div>

          {showNewBoard && (
            <Card style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)' }}>New Board</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <Input label="Name" value={newBoardName} onChange={e => setNewBoardName(e.target.value)} placeholder="My Board" />
                <Input label="Rows" type="number" value={newRows} onChange={e => setNewRows(Number(e.target.value))} min={2} max={64} />
                <Input label="Columns" type="number" value={newCols} onChange={e => setNewCols(Number(e.target.value))} min={2} max={64} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="primary" onClick={handleCreateBoard} loading={loading}>Create</Button>
                <Button onClick={() => setShowNewBoard(false)}>Cancel</Button>
              </div>
            </Card>
          )}

          {boards.length === 0 ? (
            <EmptyState icon="▦" title="No boards yet" description="Create your first board to get started." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              {boards.map(board => (
                <Card key={board.id} hoverable style={{ padding: 'var(--space-4)' }} onClick={() => setActiveBoard(board)}>
                  <div style={{
                    height: 100, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
                    marginBottom: 'var(--space-3)', overflow: 'hidden',
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(board.cols, 10)}, 1fr)`,
                    gridTemplateRows: `repeat(${Math.min(board.rows, 7)}, 1fr)`,
                    gap: 1,
                  }}>
                    {board.layers[0]?.cells.slice(0, Math.min(board.cols, 10) * Math.min(board.rows, 7)).map((cell, i) => (
                      <div key={i} style={{ background: getTileColor(board, cell.tileDefId) }} />
                    ))}
                  </div>
                  <p style={{ fontWeight: 500, fontSize: 'var(--text-sm)', marginBottom: 2 }}>{board.name}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {board.rows}×{board.cols} · {board.tileDefinitions.length} tile types
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const tileSize = Math.min(48, Math.floor(Math.min(640, window.innerWidth - 340) / activeBoard.cols));

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Board Canvas */}
      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-6)', background: 'var(--bg-secondary)' }}>
        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Button size="sm" variant="ghost" onClick={() => setActiveBoard(null)}>← Back</Button>
          <h2 style={{ fontSize: 'var(--text-lg)' }}>{activeBoard.name}</h2>
          <Badge color="board">{activeBoard.rows}×{activeBoard.cols}</Badge>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          {(['paint', 'erase', 'select'] as Tool[]).map(tool => (
            <Button key={tool} size="sm" variant={activeTool === tool ? 'primary' : 'secondary'} onClick={() => setActiveTool(tool)}>
              {tool === 'paint' ? '✏ Paint' : tool === 'erase' ? '⌫ Erase' : '↖ Select'}
            </Button>
          ))}
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'inline-grid',
            gridTemplateColumns: `repeat(${activeBoard.cols}, ${tileSize}px)`,
            gridTemplateRows: `repeat(${activeBoard.rows}, ${tileSize}px)`,
            gap: 1,
            background: 'var(--border)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            cursor: activeTool === 'erase' ? 'crosshair' : activeTool === 'paint' ? 'cell' : 'default',
            userSelect: 'none',
          }}
          onMouseUp={() => setIsPainting(false)}
          onMouseLeave={() => setIsPainting(false)}
        >
          {Array.from({ length: activeBoard.rows }, (_, row) =>
            Array.from({ length: activeBoard.cols }, (_, col) => {
              const cell = getCell(activeBoard, activeLayerIndex, row, col);
              const color = cell ? getTileColor(activeBoard, cell.tileDefId) : 'var(--bg)';
              const label = cell ? getTileLabel(activeBoard, cell.tileDefId) : '';
              return (
                <div
                  key={`${row}-${col}`}
                  style={{
                    width: tileSize, height: tileSize,
                    background: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: tileSize > 32 ? 9 : 0,
                    color: 'rgba(0,0,0,0.4)',
                    fontFamily: 'var(--font-mono)',
                    overflow: 'hidden',
                    transition: 'filter 80ms',
                  }}
                  onMouseDown={() => { setIsPainting(true); paintCell(row, col); }}
                  onMouseEnter={() => { if (isPainting) paintCell(row, col); }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLDivElement).style.filter = 'brightness(0.9)'; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLDivElement).style.filter = 'none'; }}
                >
                  {label.slice(0, 3)}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ width: 240, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Tile Palette */}
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border)', flex: 1, overflow: 'auto' }}>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>Tile Palette</p>

          {activeBoard.tileDefinitions.map(tile => (
            <div
              key={tile.id}
              onClick={() => { setSelectedTileDefId(tile.id); setActiveTool('paint'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 8px',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                background: selectedTileDefId === tile.id ? 'var(--accent-subtle)' : 'transparent',
                border: selectedTileDefId === tile.id ? '1px solid var(--accent-subtle-border)' : '1px solid transparent',
                marginBottom: 2,
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 4, background: tile.color, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-sm)', truncate: true }}>{tile.label}</span>
            </div>
          ))}

          {/* Add Tile */}
          <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 8 }}>Add Tile Type</p>
            <Input
              placeholder="Tile name"
              value={newTileLabel}
              onChange={e => setNewTileLabel(e.target.value)}
              style={{ marginBottom: 8, fontSize: 'var(--text-xs)' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {PALETTE_COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => setNewTileColor(c)}
                  style={{
                    width: 18, height: 18, borderRadius: 3,
                    background: c, cursor: 'pointer',
                    border: newTileColor === c ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
            <Button size="sm" variant="secondary" onClick={handleAddTile} style={{ width: '100%' }}>
              + Add Tile
            </Button>
          </div>
        </div>

        {/* Layers */}
        <div style={{ padding: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>Layers</p>
          {activeBoard.layers.map((layer, i) => (
            <div
              key={layer.id}
              onClick={() => setActiveLayerIndex(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 8px', borderRadius: 'var(--radius)',
                cursor: 'pointer', marginBottom: 2,
                background: activeLayerIndex === i ? 'var(--bg-secondary)' : 'transparent',
                fontSize: 'var(--text-sm)',
              }}
            >
              <span style={{ color: 'var(--text-tertiary)' }}>◧</span>
              <span style={{ flex: 1 }}>{layer.name}</span>
              {activeLayerIndex === i && <span style={{ fontSize: 10, color: 'var(--accent)' }}>active</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
