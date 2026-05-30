"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ProgressIndicator } from "./progress-indicator"
import { QualityCheckItem } from "./quality-check-item"
import { ArrowLeft, RotateCcw, Check, ZoomIn, ZoomOut, Sparkles } from "lucide-react"
import type { CaptureResult } from "@/hooks/use-document-capture"

interface ReviewScreenProps {
  step: number
  totalSteps: number
  side: "front" | "back"
  imageData: string
  captureResult?: CaptureResult
  onConfirm: () => void
  onRetake: () => void
  onBack: () => void
}

export function ReviewScreen({
  step,
  totalSteps,
  side,
  imageData,
  captureResult,
  onConfirm,
  onRetake,
  onBack,
}: ReviewScreenProps) {
  const [showEnhanced, setShowEnhanced] = useState(true)
  const [isZoomed, setIsZoomed] = useState(false)

  // Get quality metrics from capture result
  const quality = captureResult?.quality

  const qualityResults = quality
    ? [
        { label: "Blur Check", status: quality.blur.score >= 40 ? ("passed" as const) : ("failed" as const) },
        { label: "Glare Check", status: quality.glare.score >= 60 ? ("passed" as const) : ("failed" as const) },
        { label: "Brightness", status: quality.brightness.score >= 50 ? ("passed" as const) : ("failed" as const) },
        { label: "Document Detected", status: quality.documentDetected ? ("passed" as const) : ("failed" as const) },
      ]
    : [
        { label: "Blur Check", status: "passed" as const },
        { label: "Glare Check", status: "passed" as const },
        { label: "Brightness", status: "passed" as const },
        { label: "Document Detected", status: "passed" as const },
      ]

  // Determine which image to display
  const displayImage = showEnhanced ? imageData : captureResult?.original || imageData
  const hasEnhancedVersion = captureResult?.enhanced && captureResult?.original

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <ProgressIndicator currentStep={step} totalSteps={totalSteps} />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Review {side === "front" ? "Front" : "Back"} of Document
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Please verify the captured image</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-4">
        {/* Image Preview */}
        <motion.div
          className={`relative w-full bg-card rounded-2xl border border-border overflow-hidden shadow-sm mb-4 ${
            isZoomed ? "aspect-auto" : "aspect-[1.58/1]"
          }`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          {/* Actual captured image */}
          {imageData && !imageData.includes("placeholder") ? (
            <img
              src={displayImage}
              alt={`Captured ${side} of document`}
              className={`w-full h-full ${isZoomed ? "object-contain" : "object-cover"}`}
              style={{ transform: "scaleX(1)" }} // Mirror back to correct orientation
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-muted">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/40 mb-2">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="11" r="2" />
                <line x1="14" y1="9" x2="19" y2="9" />
                <line x1="14" y1="13" x2="19" y2="13" />
              </svg>
              <span className="text-sm text-muted-foreground">{side === "front" ? "Front" : "Back"} side captured</span>
            </div>
          )}

          {/* Success badge */}
          <motion.div
            className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 500 }}
          >
            <Check className="w-4 h-4" />
            <span className="text-xs font-medium">Captured</span>
          </motion.div>

          {/* Zoom indicator */}
          <button
            className="absolute bottom-3 right-3 bg-black/50 text-white p-2 rounded-full"
            onClick={(e) => {
              e.stopPropagation()
              setIsZoomed(!isZoomed)
            }}
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          {/* Enhanced indicator */}
          {showEnhanced && hasEnhancedVersion && (
            <div className="absolute top-3 left-3 bg-black/50 text-white px-2 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span className="text-xs">Enhanced</span>
            </div>
          )}
        </motion.div>

        {/* Toggle Original/Enhanced */}
        {hasEnhancedVersion && (
          <div className="flex justify-center mb-4">
            <div className="inline-flex bg-muted rounded-full p-1">
              <button
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !showEnhanced ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
                onClick={() => setShowEnhanced(false)}
              >
                Original
              </button>
              <button
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  showEnhanced ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
                onClick={() => setShowEnhanced(true)}
              >
                Enhanced
              </button>
            </div>
          </div>
        )}

        {/* Quality Summary */}
        <motion.div
          className="bg-card rounded-2xl border border-border p-5 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Quality Verification</h3>
            {quality && (
              <span
                className={`text-sm font-bold ${quality.overallScore >= 70 ? "text-primary" : "text-warning-foreground"}`}
              >
                {quality.overallScore}% Quality
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {qualityResults.map((result, index) => (
              <QualityCheckItem key={result.label} label={result.label} status={result.status} delay={0.3 + index * 0.1} />
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        className="px-6 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex gap-3">
          <Button variant="outline" onClick={onRetake} className="flex-1 h-14 text-base font-semibold rounded-2xl border-2">
            <RotateCcw className="w-5 h-5 mr-2" />
            Retake
          </Button>
          <Button onClick={onConfirm} className="flex-1 h-14 text-base font-semibold rounded-2xl shadow-lg shadow-primary/25">
            <Check className="w-5 h-5 mr-2" />
            Confirm
          </Button>
        </div>
      </motion.footer>
    </div>
  )
}
