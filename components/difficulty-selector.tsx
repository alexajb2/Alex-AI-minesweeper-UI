"use client"

import { useMinesweeper } from "@/context/minesweeper-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const difficulties = ["Beginner", "Intermediate", "Expert"]

export default function DifficultySelector() {
  const { difficulty, setDifficulty } = useMinesweeper()

  return (
    <div>
      <label htmlFor="difficulty" className="block text-sm font-medium mb-1">
        Map Difficulty
      </label>
      <Select value={difficulty} onValueChange={setDifficulty}>
        <SelectTrigger id="difficulty" className="w-full">
          <SelectValue placeholder="Select difficulty" />
        </SelectTrigger>
        <SelectContent>
          {difficulties.map((diff) => (
            <SelectItem key={diff} value={diff}>
              {diff}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

