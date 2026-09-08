/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BoardCell {
  row: number;
  col: number;
  letter: string;
}

export type BoardGrid = BoardCell[][];

export interface PlayerWord {
  id: string;
  word: string;
  points: number;
  status: 'valid' | 'invalid' | 'loading' | 'unchecked';
  definition?: string;
  canBeFormedOnBoard?: boolean;
}

export type GameStatus = 'idle' | 'shaking' | 'playing' | 'ended';

export interface GameSettings {
  timerDuration: number; // in seconds (60, 180, 300)
  soundEnabled: boolean;
  boardSize: 4 | 5;
}

export interface Coordinates {
  row: number;
  col: number;
}
