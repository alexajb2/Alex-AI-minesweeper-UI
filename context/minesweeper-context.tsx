"use client"

import { createContext, useContext, useState, useRef, type ReactNode } from "react"
import { generateProblems, processProblems } from "@/app/actions"

type MoveType = {
  x: number
  y: number
  type: "reveal" | "flag" | "exploded"
  result?: string
}

type ProblemType = {
  id: number
  grid: number[][]
  moves: MoveType[]
  outcome: "win" | "lose" | null
}

type MinesweeperContextType = {
  difficulty: string
  setDifficulty: (difficulty: string) => void
  problemCount: number
  setProblemCount: (count: number) => void
  speed: number
  setSpeed: (speed: number) => void
  isProcessing: boolean
  problems: ProblemType[]
  currentProblemIndex: number
  setCurrentProblemIndex: (index: number) => void
  currentMoveIndex: number
  setCurrentMoveIndex: (index: number) => void
  isPlaying: boolean
  setIsPlaying: (isPlaying: boolean) => void
  handleGenerate: () => Promise<void>
  handleProcess: () => Promise<void>
  handlePlay: () => void
  handlePause: () => void
  handleNext: () => void
  handlePrevious: () => void
  currentGrid: number[][]
}

const MinesweeperContext = createContext<MinesweeperContextType | undefined>(undefined)

export function MinesweeperProvider({ children }: { children: ReactNode }) {
  const [difficulty, setDifficulty] = useState("Beginner")
  const [problemCount, setProblemCount] = useState(1)
  const [speed, setSpeed] = useState(50)
  const [isProcessing, setIsProcessing] = useState(false)
  const [problems, setProblems] = useState<ProblemType[]>([])
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentGrid, setCurrentGrid] = useState<number[][]>([])

  // Ref to store the playback interval
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Helper function to transpose a 2D array.
  function transpose(grid: number[][]): number[][] {
    return grid[0].map((_, colIndex) => grid.map(row => row[colIndex]));
  }

  // Generate problems
  const handleGenerate = async () => {
    setIsProcessing(true)
    try {
      const data = await generateProblems(difficulty, problemCount)
      // Reverse the grid rows (to match backend vertical flip) and then transpose (swap x and y).
      const initialProblems = Array.from({ length: problemCount }, (_, i) => ({
        id: i,
        grid: transpose(data.problems[i].grid.slice().reverse()),
        moves: [],
        outcome: null,
      }))
      setProblems(initialProblems)

      if (initialProblems.length > 0) {
        setCurrentGrid(initialProblems[0].grid)
      }
    } catch (error) {
      console.error("Error generating problems:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Process problems
  const handleProcess = async () => {
    setIsProcessing(true)
    try {
      if (problems.length === 0) {
        console.warn("No problems to process. Generate problems first.")
        return
      }

      const data = await processProblems()

      if (!data || !data.results || !Array.isArray(data.results)) {
        console.error("Invalid response data structure:", data)
        throw new Error("Invalid response from server")
      }

      if (data.results.length !== problems.length) {
        console.error("Mismatch in problem and result counts", {
          problemsCount: problems.length,
          resultsCount: data.results.length,
        })

        const paddedResults = problems.map((problem, index) =>
          data.results[index] || {
            id: problem.id,
            moves: [],
            outcome: null,
          }
        )

        const updatedProblems = problems.map((problem, index) => ({
          ...problem,
          moves: paddedResults[index].moves || [],
          outcome: paddedResults[index].outcome || null,
        }))

        console.log("Updated Problems:", updatedProblems)
        setProblems(updatedProblems)
      } else {
        const updatedProblems = problems.map((problem, index) => ({
          ...problem,
          moves: data.results[index].moves || [],
          outcome: data.results[index].outcome || null,
        }))

        console.log("Updated Problems:", updatedProblems)
        setProblems(updatedProblems)
      }

      // Reset for playback
      setCurrentProblemIndex(0)
      setCurrentMoveIndex(-1)
      if (problems.length > 0) {
        setCurrentGrid(problems[0].grid)
      }
    } catch (error) {
      console.error("Error processing problems:", error)
      alert("Failed to process problems. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Playback controls

  const handlePlay = () => {
    const moves = problems[currentProblemIndex]?.moves || []
    // Reset if already at the end.
    if (currentMoveIndex >= moves.length - 1) {
      setCurrentMoveIndex(-1)
      resetGrid()
    }
    setIsPlaying(true)
    // Clear any previous interval.
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
    }
    // const delay = 905 - speed * 9 // Maps speed 1-100 to delay 910ms-10ms
    const delay = 1
    playIntervalRef.current = setInterval(() => {
      setCurrentMoveIndex(prev => {
        const moves = problems[currentProblemIndex]?.moves || []
        if (prev < moves.length - 1) {
          const next = prev + 1
          applyMoveToGrid(next)
          return next
        } else {
          // End reached: clear the interval and stop playing.
          if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current)
            playIntervalRef.current = null
          }
          setIsPlaying(false)
          return prev
        }
      })
    }, delay)
  }

  const handlePause = () => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
      playIntervalRef.current = null
    }
    setIsPlaying(false)
  }

  const handleNext = () => {
    const moves = problems[currentProblemIndex]?.moves || []
    if (currentMoveIndex < moves.length - 1) {
      const nextIndex = currentMoveIndex + 1
      setCurrentMoveIndex(nextIndex)
      applyMove(nextIndex)
    }
  }

  const handlePrevious = () => {
    if (currentMoveIndex > -1) {
      const prevIndex = currentMoveIndex - 1
      setCurrentMoveIndex(prevIndex)
      resetGrid()
      for (let i = 0; i <= prevIndex; i++) {
        applyMoveToGrid(i)
      }
    }
  }

  const applyMove = (moveIndex: number) => {
    if (!problems[currentProblemIndex]) return
    applyMoveToGrid(moveIndex)
  }

  const applyMoveToGrid = (moveIndex: number) => {
    if (!problems[currentProblemIndex]) return

    const move = problems[currentProblemIndex].moves[moveIndex]
    if (!move) return

    // Clone the current grid
    const newGrid = currentGrid.map((row) => [...row])

    if (move.type === "reveal") {
      if (move.result !== undefined) {
        newGrid[move.y][move.x] = parseInt(move.result, 10)
      } else {
        newGrid[move.y][move.x] = currentGrid[move.y][move.x]
      }
    } else if (move.type === "flag") {
      newGrid[move.y][move.x] = 2
    }

    setCurrentGrid(newGrid)
  }

  const resetGrid = () => {
    if (problems[currentProblemIndex]) {
      setCurrentGrid(problems[currentProblemIndex].grid)
    }
  }

  const value = {
    difficulty,
    setDifficulty,
    problemCount,
    setProblemCount,
    speed,
    setSpeed,
    isProcessing,
    problems,
    currentProblemIndex,
    setCurrentProblemIndex,
    currentMoveIndex,
    setCurrentMoveIndex,
    isPlaying,
    setIsPlaying,
    handleGenerate,
    handleProcess,
    handlePlay,
    handlePause,
    handleNext,
    handlePrevious,
    currentGrid,
  }

  return <MinesweeperContext.Provider value={value}>{children}</MinesweeperContext.Provider>
}

export function useMinesweeper() {
  const context = useContext(MinesweeperContext)
  if (context === undefined) {
    throw new Error("useMinesweeper must be used within a MinesweeperProvider")
  }
  return context
}
