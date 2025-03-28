"use client"

import { useMinesweeper } from "@/context/minesweeper-context"
import { Slider } from "@/components/ui/slider"

export default function SpeedSlider() {
  const { speed, setSpeed } = useMinesweeper()

  return (
    <div>
      <label htmlFor="speed" className="block text-sm font-medium mb-1">
        Animation Speed: {speed}%
      </label>
      <Slider id="speed" min={1} max={100} step={1} value={[speed]} onValueChange={(value) => setSpeed(value[0])} />
    </div>
  )
}

