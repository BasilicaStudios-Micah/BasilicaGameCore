// ============================================================
// BasilicaGameCore — Turn Manager
// BasilicaStudiosLLC
// ============================================================

import {
  GameState,
  TurnState,
  TurnStructure,
  TurnOrderMode,
  GameLogEntry,
  generateId,
} from '@basilica/shared';
import { executeScript } from '../scripting/interpreter';

export interface TurnTransition {
  newState: GameState;
  log: GameLogEntry[];
}

export class TurnManager {
  constructor(
    private gameState: GameState,
    private turnStructure: TurnStructure
  ) {}

  /** Advance to the next player's turn */
  nextTurn(): TurnTransition {
    const { turnState } = this.gameState;
    const logs: GameLogEntry[] = [];

    // Fire on_turn_end script for current phase
    const currentPhase = this.currentPhase();
    if (currentPhase?.onExitScript) {
      const result = executeScript(currentPhase.onExitScript, {
        playerId: turnState.activePlayerId,
        gameState: this.gameState,
        eventType: 'on_turn_end',
      });
      logs.push(...result.log.map(l => this.makeLog(l, turnState.activePlayerId)));
    }

    // Determine next player
    const nextPlayerId = this.resolveNextPlayer(turnState);
    const newTurnNumber = this.isLastPlayer(turnState)
      ? turnState.turnNumber + 1
      : turnState.turnNumber;

    const firstPhase = this.turnStructure.phases[0];

    const newTurnState: TurnState = {
      ...turnState,
      turnNumber: newTurnNumber,
      activePlayerId: nextPlayerId,
      currentPhaseId: firstPhase?.id ?? turnState.currentPhaseId,
    };

    // Fire on_turn_start script
    if (firstPhase?.onEnterScript) {
      const result = executeScript(firstPhase.onEnterScript, {
        playerId: nextPlayerId,
        gameState: { ...this.gameState, turnState: newTurnState },
        eventType: 'on_turn_start',
      });
      logs.push(...result.log.map(l => this.makeLog(l, nextPlayerId)));
    }

    logs.push(this.makeLog(
      `Turn ${newTurnNumber}: ${nextPlayerId}'s turn begins`,
      nextPlayerId
    ));

    const newState: GameState = {
      ...this.gameState,
      turnState: newTurnState,
      log: [...this.gameState.log, ...logs],
      updatedAt: new Date(),
    };

    return { newState, log: logs };
  }

  /** Advance to the next phase within the current turn */
  nextPhase(): TurnTransition {
    const { turnState } = this.gameState;
    const logs: GameLogEntry[] = [];

    const phases = this.turnStructure.phases;
    const currentIdx = phases.findIndex(p => p.id === turnState.currentPhaseId);

    // Exit current phase
    const currentPhase = phases[currentIdx];
    if (currentPhase?.onExitScript) {
      const result = executeScript(currentPhase.onExitScript, {
        playerId: turnState.activePlayerId,
        gameState: this.gameState,
        eventType: 'on_phase_exit',
      });
      logs.push(...result.log.map(l => this.makeLog(l)));
    }

    // Wrap around
    const nextIdx = (currentIdx + 1) % phases.length;
    const nextPhase = phases[nextIdx];

    // If we wrapped, it means we're done with this turn
    if (nextIdx === 0) {
      return this.nextTurn();
    }

    const newTurnState: TurnState = {
      ...turnState,
      currentPhaseId: nextPhase.id,
    };

    // Enter next phase
    if (nextPhase.onEnterScript) {
      const result = executeScript(nextPhase.onEnterScript, {
        playerId: turnState.activePlayerId,
        gameState: { ...this.gameState, turnState: newTurnState },
        eventType: 'on_phase_enter',
      });
      logs.push(...result.log.map(l => this.makeLog(l)));
    }

    logs.push(this.makeLog(`Phase: ${nextPhase.name}`));

    const newState: GameState = {
      ...this.gameState,
      turnState: newTurnState,
      log: [...this.gameState.log, ...logs],
      updatedAt: new Date(),
    };

    return { newState, log: logs };
  }

  private resolveNextPlayer(turnState: TurnState): string {
    const { playerOrder, activePlayerId, orderMode } = turnState;
    const idx = playerOrder.indexOf(activePlayerId);

    switch (orderMode as TurnOrderMode) {
      case 'sequential':
        return playerOrder[(idx + 1) % playerOrder.length];
      case 'initiative':
        // In initiative mode, order is pre-sorted by initiative value
        return playerOrder[(idx + 1) % playerOrder.length];
      case 'simultaneous':
        // All players act; cycle through
        return playerOrder[(idx + 1) % playerOrder.length];
      default:
        return playerOrder[(idx + 1) % playerOrder.length];
    }
  }

  private isLastPlayer(turnState: TurnState): boolean {
    const { playerOrder, activePlayerId } = turnState;
    return playerOrder[playerOrder.length - 1] === activePlayerId;
  }

  private currentPhase() {
    return this.turnStructure.phases.find(
      p => p.id === this.gameState.turnState.currentPhaseId
    );
  }

  private makeLog(message: string, playerId?: string): GameLogEntry {
    return {
      id: generateId(),
      timestamp: new Date(),
      playerId,
      action: 'TURN_MANAGER',
      payload: { message },
    };
  }
}
