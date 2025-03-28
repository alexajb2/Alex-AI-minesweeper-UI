"use client"

import { useMinesweeper } from "@/context/minesweeper-context"
import { Slider } from "@/components/ui/slider"

export default function ProblemSlider() {
  const { problemCount, setProblemCount } = useMinesweeper()

  return (
    <div>
      <label htmlFor="problem-count" className="block text-sm font-medium mb-1">
        Number of Problems: {problemCount}
      </label>
      <Slider
        id="problem-count"
        min={1}
        max={1000}
        step={1}
        value={[problemCount]}
        onValueChange={(value) => setProblemCount(value[0])}
      />
    </div>
  )
}

