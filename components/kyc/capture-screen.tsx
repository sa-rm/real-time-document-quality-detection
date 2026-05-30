"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ProgressIndicator } from "./progress-indicator"
import { QualityCheckItem } from "./quality-check-item"
import { QualityScore } from "./quality-score"
import { DocumentFrame } from "./document-frame"
import { useDocumentCapture, type CaptureResult } from "@/hooks/use-document-capture"
import {
  QUALITY_THRESHOLDS,
  getQualityCheckStatuses,
} from "@/lib/cv/quality-analyzer"
import { ArrowLeft, Camera, RefreshCw, AlertCircle } from "lucide-react"

interface CaptureScreenProps {
  step: number
  totalSteps: number
  side: "front" | "back"
  onCapture: (imageData: string, captureResult?: CaptureResult) => void
  onBack: () => void
}

export function CaptureScreen({ step, totalSteps, side, onCapture, onBack }: CaptureScreenProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isCountingDown, setIsCountingDown] = useState(false)

  const {
    setVideoRef,
    setCanvasRef,
    webcamState,
    quality,
    frameSize,
    initializeCamera,
    stopCamera,
    switchCamera,
    startAnalysis,
    stopAnalysis,
    captureDocument,
  } = useDocumentCapture({
    analysisInterval: 100,
    facingMode: "environment",
  })

  const hasQualitySample = quality !== null && frameSize.width > 0
  const qualityChecks = getQualityCheckStatuses(quality, hasQualitySample)

  const isReady = quality?.isReady ?? false
  const allChecksPass = quality?.allChecksPass ?? false
  const overallScore = quality?.overallScore ?? 0
  const feedback = quality?.feedback ?? "Initializing camera…"
  const feedbackType = quality?.feedbackType ?? "info"

  const resetCountdown = useCallback(() => {
    setCountdown(null)
    setIsCountingDown(false)
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({ name: "camera" as PermissionName })
        setHasPermission(permissionStatus.state === "granted" || permissionStatus.state === "prompt")

        await initializeCamera()
        startAnalysis()
      } catch {
        setHasPermission(false)
      }
    }

    init()

    return () => {
      stopCamera()
      stopAnalysis()
    }
  }, [])

  const handleCapture = useCallback(() => {
    if (!allChecksPass) return

    stopAnalysis()
    const result = captureDocument()
    if (result) {
      onCapture(result.cropped, result)
    }
  }, [allChecksPass, captureDocument, onCapture, stopAnalysis])

  // Start auto-capture only when every quality check passes
  useEffect(() => {
    if (allChecksPass && !isCountingDown && countdown === null) {
      setIsCountingDown(true)
      setCountdown(3)
    }
  }, [allChecksPass, isCountingDown, countdown])

  // Abort countdown immediately if any check fails
  useEffect(() => {
    if (isCountingDown && countdown !== null && !allChecksPass) {
      resetCountdown()
    }
  }, [allChecksPass, isCountingDown, countdown, resetCountdown])

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
    if (countdown === 0 && allChecksPass) {
      handleCapture()
    } else if (countdown === 0) {
      resetCountdown()
    }
  }, [countdown, allChecksPass, handleCapture, resetCountdown])

  const handleManualCapture = useCallback(() => {
    if (!allChecksPass) return
    handleCapture()
  }, [allChecksPass, handleCapture])

  const handleRetry = useCallback(() => {
    resetCountdown()
    initializeCamera()
    startAnalysis()
  }, [initializeCamera, startAnalysis, resetCountdown])

  if (hasPermission === false || webcamState.error) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <ProgressIndicator currentStep={step} totalSteps={totalSteps} />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-4 flex flex-col items-center justify-center">
          <motion.div
            className="text-center max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Camera Access Required</h2>
            <p className="text-muted-foreground mb-6">
              {webcamState.error ||
                "Please allow camera access to capture your document. You can change this in your browser settings."}
            </p>
            <Button onClick={handleRetry} className="rounded-xl">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </motion.div>
        </main>
      </div>
    )
  }

  const feedbackClass =
    feedbackType === "success"
      ? "bg-primary/10 text-primary"
      : feedbackType === "warning"
        ? "bg-amber-500/10 text-amber-800 dark:text-amber-200"
        : feedbackType === "error"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground"

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <ProgressIndicator currentStep={step} totalSteps={totalSteps} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={switchCamera}
            className="rounded-xl"
            title="Switch camera"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Capture {side === "front" ? "Front" : "Back"} of Document
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            All quality checks must pass before capture
          </p>
        </div>
      </header>

      <main className="flex-1 px-4 pb-4">
        <div className="relative">
          <DocumentFrame
            isReady={isReady}
            documentDetected={quality?.documentDetected ?? false}
            countdown={countdown}
            onVideoRef={setVideoRef}
            onCanvasRef={setCanvasRef}
            isStreaming={webcamState.isStreaming}
            documentCorners={quality?.documentCorners}
            sourceWidth={frameSize.width}
            sourceHeight={frameSize.height}
          />
        </div>

        <motion.div
          className="text-center mt-4 mb-4"
          key={feedback}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium max-w-md ${feedbackClass}`}
          >
            {hasQualitySample && (
              <motion.span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isReady ? "bg-primary" : feedbackType === "warning" ? "bg-amber-500" : "bg-muted-foreground"
                }`}
                animate={isReady ? { scale: [1, 1.2, 1] } : { opacity: [0.4, 1, 0.4] }}
                transition={{ duration: isReady ? 0.5 : 0.9, repeat: Infinity }}
              />
            )}
            {feedback}
          </span>
        </motion.div>

        <motion.div
          className="bg-card rounded-2xl border border-border p-4 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-start gap-6">
            <QualityScore score={overallScore} threshold={QUALITY_THRESHOLDS.overallScore} />

            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-semibold text-foreground mb-3">Quality Checks</h3>
              <QualityCheckItem label="Blur Detection" status={qualityChecks.blur} />
              <QualityCheckItem label="Glare Detection" status={qualityChecks.glare} />
              <QualityCheckItem label="Brightness Check" status={qualityChecks.brightness} />
              <QualityCheckItem label="Edge Detection" status={qualityChecks.edges} />
              <QualityCheckItem label="Document Aligned" status={qualityChecks.alignment} />
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="px-6 pb-8">
        <AnimatePresence mode="wait">
          {countdown !== null ? (
            <motion.div
              key="countdown"
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-muted-foreground text-sm mb-2">Auto-capturing when all checks stay green</p>
              <motion.span
                className="text-4xl font-bold text-primary"
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {countdown}
              </motion.span>
            </motion.div>
          ) : (
            <Button
              key="capture"
              onClick={handleManualCapture}
              disabled={!webcamState.isStreaming || !allChecksPass}
              className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg shadow-primary/25 disabled:shadow-none"
            >
              <Camera className="w-5 h-5 mr-2" />
              {allChecksPass ? "Capture Now" : "Complete all checks to capture"}
            </Button>
          )}
        </AnimatePresence>
      </footer>
    </div>
  )
}
