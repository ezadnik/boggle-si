/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { BoardGrid, Coordinates } from '../types';
import { Trash2, CheckCircle2 } from 'lucide-react';

interface BoggleBoardProps {
  grid: BoardGrid;
  isRevealed: boolean;
  gameStatus: 'idle' | 'shaking' | 'playing' | 'ended';
  selectedCells: Coordinates[];
  setSelectedCells: React.Dispatch<React.SetStateAction<Coordinates[]>>;
  onSubmitWord: (word: string) => void;
}

export const BoggleBoard: React.FC<BoggleBoardProps> = ({
  grid,
  isRevealed,
  gameStatus,
  selectedCells,
  setSelectedCells,
  onSubmitWord,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Helper: check if cells are adjacent (including diagonals) and not reused
  const isAdjacent = (cell1: Coordinates, cell2: Coordinates) => {
    const dr = Math.abs(cell1.row - cell2.row);
    const dc = Math.abs(cell1.col - cell2.col);
    return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
  };

  const isCellSelected = (r: number, c: number) => {
    return selectedCells.some(cell => cell.row === r && cell.col === c);
  };

  const getCellIndex = (r: number, c: number) => {
    return selectedCells.findIndex(cell => cell.row === r && cell.col === c);
  };

  // Convert current cell path to a string word
  const getCurrentWord = () => {
    return selectedCells.map(cell => grid[cell.row][cell.col].letter).join('');
  };

  // Click handler (precise tap-to-select and deselection/undo)
  const handleCellClick = (r: number, c: number) => {
    if (gameStatus !== 'playing') return;

    const lastSelected = selectedCells[selectedCells.length - 1];

    if (isCellSelected(r, c)) {
      // Deselection / Undo Logic:
      // If clicked the last selected cube, pop it from selection array (undo)
      if (lastSelected && lastSelected.row === r && lastSelected.col === c) {
        setSelectedCells(prev => prev.slice(0, -1));
      } else {
        // If clicked any previously selected cube earlier in the chain, truncate back to that letter
        const idx = getCellIndex(r, c);
        setSelectedCells(prev => prev.slice(0, idx + 1));
      }
    } else {
      // A cube can only be selected if it is a neighbor of the last selected cube in the current word chain, 
      // or if it's the very first letter of a new word.
      if (!lastSelected || isAdjacent(lastSelected, { row: r, col: c })) {
        setSelectedCells(prev => [...prev, { row: r, col: c }]);
      }
    }
  };

  // Clear active selection path
  const handleClearSelection = () => {
    setSelectedCells([]);
  };

  // Submit active word
  const handleDirectSubmit = () => {
    const word = getCurrentWord();
    if (word.length >= 3) {
      onSubmitWord(word);
      setSelectedCells([]);
    }
  };

  // Draw path connection lines between adjacent selected cells
  const renderPathCanvas = () => {
    if (selectedCells.length < 2 || !containerRef.current) return null;

    const points: Array<{ x: number; y: number }> = [];

    // Calculate grid centroids relative to board container
    selectedCells.forEach(cell => {
      const element = document.getElementById(`cell-${cell.row}-${cell.col}`);
      if (element && containerRef.current) {
        const boardRect = containerRef.current.getBoundingClientRect();
        const rect = element.getBoundingClientRect();
        points.push({
          x: rect.left - boardRect.left + rect.width / 2,
          y: rect.top - boardRect.top + rect.height / 2,
        });
      }
    });

    if (points.length < 2) return null;

    // Direct SVG line connections
    return (
      <svg className="absolute inset-0 pointer-events-none z-10 w-full h-full">
        {points.map((pt, idx) => {
          if (idx === 0) return null;
          const prev = points[idx - 1];
          const strokeColor = 'rgba(37, 99, 235, 0.65)';

          return (
            <g key={`path-segment-${idx}`}>
              <line
                x1={prev.x}
                y1={prev.y}
                x2={pt.x}
                y2={pt.y}
                stroke={strokeColor}
                strokeWidth="10"
                strokeLinecap="round"
                className="animate-pulse"
              />
              <line
                x1={prev.x}
                y1={prev.y}
                x2={pt.x}
                y2={pt.y}
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
    );
  };

  const is4x4 = grid.length === 4;

  const cellStyles = (isSelected: boolean) => {
    if (isSelected) {
      return 'bg-blue-600 border-blue-500 font-extrabold shadow-md scale-[1.03] select-none text-white';
    }
    return 'bg-slate-50 hover:bg-white border-slate-200 font-bold shadow-[inset_0_-4px_0_#CBD5E1,0_4px_6px_rgba(0,0,0,0.1)] active:scale-95 cursor-pointer selection:bg-transparent';
  };

  const shakingClass = gameStatus === 'shaking' ? 'animate-bounce duration-75' : '';

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      {/* 5x5 / 4x4 Main Grid Container */}
      <div
        id="boggle-grid-container"
        ref={containerRef}
        className={`relative w-full aspect-square p-3 border-4 rounded-3xl bg-slate-900 border-slate-700/80 text-slate-100 shadow-[0_15px_30px_rgba(0,0,0,0.4)] border ${shakingClass} transition-all duration-300`}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* Connection drawing SVG Layer */}
        {renderPathCanvas()}

        <div className={`grid ${is4x4 ? 'grid-cols-4 grid-rows-4' : 'grid-cols-5 grid-rows-5'} gap-2 h-full w-full`}>
          {grid.map((rowArr, rIdx) =>
            rowArr.map((cellObj, cIdx) => {
              const isSelected = isCellSelected(rIdx, cIdx);
              const isCellRevealed = gameStatus !== 'ended' || isRevealed;

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  id={`cell-${rIdx}-${cIdx}`}
                  className={`relative flex items-center justify-center border-2 rounded-2xl leading-none transition-all duration-200 select-none ${cellStyles(isSelected)}`}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                >
                  {isCellRevealed ? (
                    // Display actual letter
                    <span className={`absolute inset-0 flex items-center justify-center text-center leading-none font-sans antialiased pointer-events-none font-black select-none ${
                      isSelected ? 'text-white' : 'text-black'
                    } ${
                      is4x4 
                        ? 'text-[36px] xs:text-[48px] md:text-[60px]' 
                        : 'text-[32px] xs:text-[43px] md:text-[54px]'
                    }`}>
                      {cellObj.letter}
                    </span>
                  ) : (
                    // Display blank block texture at end-of-round
                    <div className="w-5 h-5 rounded-md bg-neutral-600/40 animate-pulse border border-neutral-500/30" />
                  )}

                  {/* Micro index circle showing word drawing sequence */}
                  {isSelected && (
                    <span className="absolute bottom-1 right-2 text-[10px] font-mono opacity-80 pointer-events-none">
                      {getCellIndex(rIdx, cIdx) + 1}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Control bar below grid */}
      <div className="flex items-center gap-2 w-full mt-1">
        <button
          id="clear-word-btn"
          onClick={handleClearSelection}
          disabled={selectedCells.length === 0}
          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 disabled:opacity-40 rounded-xl transition bg-[#334155] hover:bg-slate-600 disabled:bg-[#334155] text-[#F8FAFC] border border-[#475569]/30"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-medium">Počisti</span>
        </button>

        {/* Dynamic interactive word preview container */}
        <div 
          onClick={handleDirectSubmit}
          className={`flex-[2] border rounded-xl px-3 py-1 text-center font-mono font-semibold tracking-wider flex items-center justify-center h-[38px] text-lg transition ${
            selectedCells.length >= 3 
              ? 'cursor-pointer bg-blue-950/40 border-blue-500/55 hover:bg-blue-900/40 text-blue-300' 
              : 'bg-[#0F172A] border-[#334155] text-blue-400'
          }`}
          title={selectedCells.length >= 3 ? "Klikni za oddajo besede" : undefined}
        >
          {selectedCells.length > 0 ? (
            <span className="uppercase text-white animate-fade-in flex items-center gap-1.5 font-bold">
              {getCurrentWord()}
              {selectedCells.length >= 3 && (
                <span className="text-[10px] text-emerald-400 font-sans tracking-normal font-medium bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
                  Oddaj
                </span>
              )}
            </span>
          ) : (
            <span className="text-xs text-neutral-500 font-sans italic">Tapni črke za sestavo</span>
          )}
        </div>

        <button
          id="submit-word-btn"
          onClick={handleDirectSubmit}
          disabled={selectedCells.length < 3 || gameStatus !== 'playing'}
          className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 text-white rounded-xl transition ${
            selectedCells.length >= 3 && gameStatus === 'playing'
              ? 'bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-900/20 font-semibold'
              : 'bg-[#334155]/40 opacity-40 text-neutral-500'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm">Oddaj</span>
        </button>
      </div>
    </div>
  );
};
