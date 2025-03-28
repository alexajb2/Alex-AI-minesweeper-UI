import { Suspense } from "react"
import DifficultySelector from "@/components/difficulty-selector"
import ProblemSlider from "@/components/problem-slider"
import SpeedSlider from "@/components/speed-slider"
import ProcessButton from "@/components/process-button"
import PlaybackControls from "@/components/playback-controls"
import MinesweeperGrid from "@/components/minesweeper-grid"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="container mx-auto p-4 py-8">
      <h1 className="text-4xl font-bold mb-2 text-center">AI Minesweeper Solver</h1>
      <p className="text-center text-gray-500 mb-8">AI-powered Minesweeper problem solver and visualizer</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Set up the parameters for the Minesweeper problems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Suspense fallback={<div>Loading...</div>}>
              <DifficultySelector />
            </Suspense>
            <ProblemSlider />
            <SpeedSlider />
            <ProcessButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visualization</CardTitle>
            <CardDescription>Watch the AI solve the Minesweeper problems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Suspense fallback={<div>Loading...</div>}>
              <MinesweeperGrid />
            </Suspense>
            <PlaybackControls />
          </CardContent>
        </Card>
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Minesweeper Solver by Alexander Brown</p>
      </footer>
    </main>
  )
}

