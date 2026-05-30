"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ProgressIndicator } from "./progress-indicator"
import { Sun, Sparkles, Square, Hand, ArrowLeft } from "lucide-react"

interface InstructionScreenProps {
  step: number
  totalSteps: number
  side: "front" | "back"
  onContinue: () => void
  onBack: () => void
}

export function InstructionScreen({ step, totalSteps, side, onContinue, onBack }: InstructionScreenProps) {
  const instructions = [
    { icon: Sun, label: "Ensure good lighting", description: "Natural light works best" },
    { icon: Sparkles, label: "Avoid glare and reflections", description: "Tilt document if needed" },
    { icon: Square, label: "Keep all corners visible", description: "Fit entire document in frame" },
    { icon: Hand, label: "Hold device steady", description: "Avoid shaking while capturing" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <ProgressIndicator currentStep={step} totalSteps={totalSteps} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-8">
        {/* Document Illustration */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative w-64 h-44 bg-gradient-to-br from-secondary to-muted rounded-2xl shadow-lg overflow-hidden">
            {/* Card background */}
            <div className="absolute inset-2 bg-card rounded-xl border border-border shadow-inner">
              {/* Document content */}
              <div className="p-4 h-full flex flex-col justify-between">
                {side === "front" ? (
                  <>
                    {/* Front side content */}
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-16 bg-secondary rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 bg-muted rounded" />
                        <div className="h-2 w-full bg-muted rounded" />
                        <div className="h-2 w-2/3 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-muted rounded" />
                      <div className="h-2 w-4/5 bg-muted rounded" />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Back side content */}
                    <div className="space-y-2">
                      <div className="h-3 w-1/2 bg-muted rounded" />
                      <div className="h-2 w-full bg-muted rounded" />
                      <div className="h-2 w-3/4 bg-muted rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-muted rounded" />
                      <div className="h-2 w-full bg-muted rounded" />
                      <div className="h-2 w-2/3 bg-muted rounded" />
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Corner guides */}
            <motion.div
              className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-primary rounded-tl-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-primary rounded-tr-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-primary rounded-bl-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
            <motion.div
              className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-primary rounded-br-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-foreground mb-2">
            Capture {side === "front" ? "Front" : "Back"} of Document
          </h2>
          <p className="text-muted-foreground text-sm">
            Please follow these guidelines for best results
          </p>
        </motion.div>

        {/* Instructions */}
        <div className="space-y-3">
          {instructions.map((instruction, index) => (
            <motion.div
              key={instruction.label}
              className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <instruction.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{instruction.label}</p>
                <p className="text-sm text-muted-foreground">{instruction.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        className="px-6 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          onClick={onContinue}
          className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg shadow-primary/25"
        >
          Continue
        </Button>
      </motion.footer>
    </div>
  )
}
