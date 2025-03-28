"use client"

import { useMinesweeper } from "@/context/minesweeper-context"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useState } from "react"

export default function ProcessButton() {
  const { 
    isProcessing, 
    handleGenerate, 
    handleProcess, 
    problems 
  } = useMinesweeper()
  const [localProcessing, setLocalProcessing] = useState(false)

  const handleClick = async () => {
    try {
      setLocalProcessing(true)
      
      // If no problems, generate first
      if (problems.length === 0) {
        await handleGenerate()
      }
      
      // Then process
      await handleProcess()
    } catch (error) {
      console.error("Error in process flow:", error)
    } finally {
      setLocalProcessing(false)
    }
  }

  const isButtonDisabled = isProcessing || localProcessing

  return (
    <div className="space-y-2">
      <Button 
        onClick={handleClick} 
        disabled={isButtonDisabled} 
        className="w-full"
      >
        {isButtonDisabled ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {problems.length === 0 ? "Generating..." : "Processing..."}
          </>
        ) : problems.length === 0 ? (
          "Generate & Process"
        ) : (
          "Process"
        )}
      </Button>

      {problems.length > 0 && (
        <Button 
          onClick={handleGenerate} 
          disabled={isButtonDisabled} 
          variant="outline" 
          className="w-full"
        >
          Generate New Problems
        </Button>
      )}
    </div>
  )
}