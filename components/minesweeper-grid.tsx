"use client"

import { useMinesweeper } from "@/context/minesweeper-context"
import { useEffect, useState } from "react"

// Cell states
const HIDDEN = 0
const REVEALED = 1
const FLAGGED = 2
const MINE = 3
const EXPLODED = 4

// Cell colors based on adjacent mines
const numberColors = [
  "text-transparent", // 0 - no number shown
  "text-blue-600", // 1
  "text-green-600", // 2
  "text-red-600", // 3
  "text-purple-800", // 4
  "text-red-800", // 5
  "text-cyan-600", // 6
  "text-black", // 7
  "text-gray-600", // 8
]

export default function MinesweeperGrid() {
  const { currentGrid, problems, currentProblemIndex, currentMoveIndex } = useMinesweeper()
  const [displayGrid, setDisplayGrid] = useState<Array<Array<{ state: number; value: number }>>>([])
  const [gridSize, setGridSize] = useState({ rows: 10, cols: 10 })

  useEffect(() => {
    if (currentGrid.length > 0) {
      // Initialize display grid based on current grid
      const rows = currentGrid.length
      const cols = currentGrid[0].length
      setGridSize({ rows, cols })

      const newDisplayGrid = Array(rows)
        .fill(0)
        .map((_, i) =>
          Array(cols)
            .fill(0)
            .map((_, j) => ({
              state: HIDDEN,
              value: currentGrid[i][j] === -1 ? MINE : currentGrid[i][j], // Convert -1 to MINE constant
            })),
        )

      setDisplayGrid(newDisplayGrid)
    }
  }, [currentGrid])

  useEffect(() => {
    // Only run if currentGrid is available and there is a valid problem.
    if (currentGrid.length === 0 || problems.length === 0 || currentProblemIndex < 0) return;
  
    const rows = currentGrid.length;
    const cols = currentGrid[0].length;
  
    // Create the base display grid.
    const newDisplayGrid = Array(rows)
      .fill(0)
      .map((_, i) =>
        Array(cols)
          .fill(0)
          .map((_, j) => ({
            state: HIDDEN,
            // Convert underlying mines (-1) to the display constant MINE.
            value: currentGrid[i][j] === -1 ? MINE : currentGrid[i][j],
          }))
      );
  
    // Apply all moves up to the currentMoveIndex.
    const problem = problems[currentProblemIndex];
    for (let i = 0; i <= currentMoveIndex; i++) {
      const move = problem.moves[i];
      if (!move) continue;
  
      if (move.type === "reveal" || move.type === "exploded") {
        // Use the move.result if available (the backend’s computed number), otherwise use the existing value.
        const cellVal =
          move.result !== undefined && move.result !== "" 
            ? parseInt(move.result, 10)
            : newDisplayGrid[move.y][move.x].value;
        newDisplayGrid[move.y][move.x].value = cellVal;
  
        // Mark the cell state.
        if (move.type === "exploded") {
          newDisplayGrid[move.y][move.x].state = EXPLODED;
        } else {
          newDisplayGrid[move.y][move.x].state = REVEALED;
        }
      } else if (move.type === "flag") {
        // For flagged moves, we don't change the underlying value,
        // but we set the display state to FLAGGED.
        newDisplayGrid[move.y][move.x].state = FLAGGED;
      }
    }
  
    setDisplayGrid(newDisplayGrid);
  }, [currentMoveIndex, currentProblemIndex, problems, currentGrid]);
  
  

  if (displayGrid.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-md">
        <p className="text-gray-500">Generate problems to view the grid</p>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div
        className="grid gap-1 bg-gray-300 p-2 rounded-md"
        style={{
          gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridSize.rows}, minmax(0, 1fr))`,
        }}
      >
        {displayGrid.map((row, i) =>
          row.map((cell, j) => {
            let cellClass = "w-8 h-8 flex items-center justify-center text-sm font-bold"
            let content = null

            switch (cell.state) {
              case HIDDEN:
                cellClass += " bg-gray-400 hover:bg-gray-500 cursor-default"
                break
              case REVEALED:
                cellClass += " bg-gray-200"
                if (cell.value > 0) {
                  content = cell.value
                  cellClass += ` ${numberColors[cell.value]}`
                }
                break
              case FLAGGED:
                cellClass += " bg-gray-400"
                content = "🚩"
                break
              case MINE:
                cellClass += " bg-gray-200"
                content = "💣"
                break
              case EXPLODED:
                cellClass += " bg-red-500"
                content = "💥"
                break
            }

            return (
              <div key={`${i}-${j}`} className={cellClass}>
                {content}
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
