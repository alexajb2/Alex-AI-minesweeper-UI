"use client"

import { useMinesweeper } from "@/context/minesweeper-context"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipForward, SkipBack, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PlaybackControls() {
  const {
    isPlaying,
    handlePlay,
    handlePause,
    handleNext,
    handlePrevious,
    problems,
    currentProblemIndex,
    setCurrentProblemIndex,
    currentMoveIndex,
  } = useMinesweeper()

  if (problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="h-8 w-8 text-yellow-500 mb-2" />
        <p>Generate and process problems to enable playback</p>
      </div>
    )
  }

  const currentProblem = problems[currentProblemIndex]
  const totalMoves = currentProblem?.moves.length || 0
  const progress = totalMoves > 0 ? ((currentMoveIndex + 1) / totalMoves) * 100 : 0

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <label htmlFor="problem-selector" className="block text-sm font-medium mb-1">
            Problem
          </label>
          <Select
            value={currentProblemIndex.toString()}
            onValueChange={(value) => setCurrentProblemIndex(Number.parseInt(value))}
          >
            <SelectTrigger id="problem-selector" className="w-32">
              <SelectValue placeholder="Select problem" />
            </SelectTrigger>
            <SelectContent>
              {problems.map((_, index) => (
                <SelectItem key={index} value={index.toString()}>
                  Problem {index + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-right">
          <p className="text-sm font-medium mb-1">Outcome</p>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              currentProblem?.outcome === "win"
                ? "bg-green-100 text-green-800"
                : currentProblem?.outcome === "lose"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {currentProblem?.outcome ? currentProblem.outcome.toUpperCase() : "PENDING"}
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm">
          Move {currentMoveIndex + 1} of {totalMoves}
        </span>
        <div className="flex space-x-2">
          <Button onClick={handlePrevious} variant="outline" size="icon" disabled={currentMoveIndex < 0}>
            <SkipBack className="h-4 w-4" />
          </Button>
          {isPlaying ? (
            <Button onClick={handlePause} variant="outline" size="icon">
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handlePlay} variant="outline" size="icon" disabled={totalMoves === 0}>
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button onClick={handleNext} variant="outline" size="icon" disabled={currentMoveIndex >= totalMoves - 1}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
