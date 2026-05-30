"use client"

import { useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { WelcomeScreen } from "./welcome-screen"
import { InstructionScreen } from "./instruction-screen"
import { CaptureScreen } from "./capture-screen"
import { ReviewScreen } from "./review-screen"
import { FinalReviewScreen } from "./final-review-screen"
import { SuccessScreen } from "./success-screen"
import type { CaptureResult } from "@/hooks/use-document-capture"

type Screen =
  | "welcome"
  | "front-instructions"
  | "front-capture"
  | "front-review"
  | "back-instructions"
  | "back-capture"
  | "back-review"
  | "final-review"
  | "success"

interface CapturedData {
  imageData: string
  captureResult?: CaptureResult
}

interface CapturedImages {
  front: CapturedData | null
  back: CapturedData | null
}

export function KYCFlow() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome")
  const [capturedImages, setCapturedImages] = useState<CapturedImages>({
    front: null,
    back: null,
  })

  const totalSteps = 4

  const getStepNumber = (screen: Screen): number => {
    switch (screen) {
      case "front-instructions":
      case "front-capture":
      case "front-review":
        return 0
      case "back-instructions":
      case "back-capture":
      case "back-review":
        return 2
      case "final-review":
        return 3
      default:
        return 0
    }
  }

  const handleFrontCapture = useCallback((imageData: string, captureResult?: CaptureResult) => {
    setCapturedImages((prev) => ({
      ...prev,
      front: { imageData, captureResult },
    }))
    setCurrentScreen("front-review")
  }, [])

  const handleBackCapture = useCallback((imageData: string, captureResult?: CaptureResult) => {
    setCapturedImages((prev) => ({
      ...prev,
      back: { imageData, captureResult },
    }))
    setCurrentScreen("back-review")
  }, [])

  const handleSubmit = useCallback(() => {
    // In a real app, this would submit the data to a backend
    setCurrentScreen("success")
  }, [])

  const handleReset = useCallback(() => {
    setCapturedImages({ front: null, back: null })
    setCurrentScreen("welcome")
  }, [])

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  return (
    <div className="min-h-screen w-full max-w-md mx-auto bg-background relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="min-h-screen"
        >
          {currentScreen === "welcome" && (
            <WelcomeScreen onStart={() => setCurrentScreen("front-instructions")} />
          )}

          {currentScreen === "front-instructions" && (
            <InstructionScreen
              step={getStepNumber(currentScreen)}
              totalSteps={totalSteps}
              side="front"
              onContinue={() => setCurrentScreen("front-capture")}
              onBack={() => setCurrentScreen("welcome")}
            />
          )}

          {currentScreen === "front-capture" && (
            <CaptureScreen
              step={getStepNumber(currentScreen)}
              totalSteps={totalSteps}
              side="front"
              onCapture={handleFrontCapture}
              onBack={() => setCurrentScreen("front-instructions")}
            />
          )}

          {currentScreen === "front-review" && (
            <ReviewScreen
              step={getStepNumber(currentScreen)}
              totalSteps={totalSteps}
              side="front"
              imageData={capturedImages.front?.imageData || ""}
              captureResult={capturedImages.front?.captureResult}
              onConfirm={() => setCurrentScreen("back-instructions")}
              onRetake={() => setCurrentScreen("front-capture")}
              onBack={() => setCurrentScreen("front-capture")}
            />
          )}

          {currentScreen === "back-instructions" && (
            <InstructionScreen
              step={getStepNumber(currentScreen)}
              totalSteps={totalSteps}
              side="back"
              onContinue={() => setCurrentScreen("back-capture")}
              onBack={() => setCurrentScreen("front-review")}
            />
          )}

          {currentScreen === "back-capture" && (
            <CaptureScreen
              step={getStepNumber(currentScreen)}
              totalSteps={totalSteps}
              side="back"
              onCapture={handleBackCapture}
              onBack={() => setCurrentScreen("back-instructions")}
            />
          )}

          {currentScreen === "back-review" && (
            <ReviewScreen
              step={getStepNumber(currentScreen)}
              totalSteps={totalSteps}
              side="back"
              imageData={capturedImages.back?.imageData || ""}
              captureResult={capturedImages.back?.captureResult}
              onConfirm={() => setCurrentScreen("final-review")}
              onRetake={() => setCurrentScreen("back-capture")}
              onBack={() => setCurrentScreen("back-capture")}
            />
          )}

          {currentScreen === "final-review" && (
            <FinalReviewScreen
              step={getStepNumber(currentScreen)}
              totalSteps={totalSteps}
              frontImage={capturedImages.front?.imageData || ""}
              backImage={capturedImages.back?.imageData || ""}
              onSubmit={handleSubmit}
              onBack={() => setCurrentScreen("back-review")}
            />
          )}

          {currentScreen === "success" && <SuccessScreen onDone={handleReset} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
