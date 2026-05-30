"use client"

import { forwardRef, useRef, useImperativeHandle, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { mapPointToOverlayPercent } from "@/lib/cv/overlay-coords"

export interface DocumentFrameHandle {
  getVideoElement: () => HTMLVideoElement | null
  getCanvasElement: () => HTMLCanvasElement | null
}

interface DocumentFrameProps {
  isReady?: boolean
  documentDetected?: boolean
  countdown?: number | null
  aspectRatio?: number
  onVideoRef?: (element: HTMLVideoElement | null) => void
  onCanvasRef?: (element: HTMLCanvasElement | null) => void
  isStreaming?: boolean
  /** Corners as % of source frame (0–100) */
  documentCorners?: { x: number; y: number }[] | null
  sourceWidth?: number
  sourceHeight?: number
  showCornerGuides?: boolean
}

export const DocumentFrame = forwardRef<DocumentFrameHandle, DocumentFrameProps>(
  function DocumentFrame(
    {
      isReady = false,
      documentDetected = false,
      countdown = null,
      aspectRatio = 1.58,
      onVideoRef,
      onCanvasRef,
      isStreaming = false,
      documentCorners = null,
      sourceWidth = 0,
      sourceHeight = 0,
      showCornerGuides = true,
    },
    ref
  ) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useImperativeHandle(ref, () => ({
      getVideoElement: () => videoRef.current,
      getCanvasElement: () => canvasRef.current,
    }))

    useEffect(() => {
      onVideoRef?.(videoRef.current)
      return () => onVideoRef?.(null)
    }, [onVideoRef])

    useEffect(() => {
      onCanvasRef?.(canvasRef.current)
      return () => onCanvasRef?.(null)
    }, [onCanvasRef])

    const overlayPolygon = useMemo(() => {
      if (!documentCorners || documentCorners.length < 4 || sourceWidth <= 0 || sourceHeight <= 0) {
        return null
      }

      const mapped = documentCorners.map((c) => {
        const px = (c.x / 100) * sourceWidth
        const py = (c.y / 100) * sourceHeight
        return mapPointToOverlayPercent(px, py, sourceWidth, sourceHeight, aspectRatio)
      })

      const inBounds = mapped.every(
        (p) => p.x >= -5 && p.x <= 105 && p.y >= -5 && p.y <= 105
      )
      if (!inBounds) return null

      return mapped.map((p) => `${p.x},${p.y}`).join(" ")
    }, [documentCorners, sourceWidth, sourceHeight, aspectRatio])

    const overlayStroke = isReady ? "#16A34A" : documentDetected ? "#EAB308" : "#ffffff"

    return (
      <div
        className="relative w-full bg-accent/10 rounded-2xl overflow-hidden"
        style={{ aspectRatio: `${aspectRatio}/1` }}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: "scaleX(1)",
            WebkitTransform: "scaleX(1)",
          }}
          autoPlay
          playsInline
          muted
        />

        <canvas ref={canvasRef} className="hidden" />

        {showCornerGuides && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 63.29">
            <motion.path
              d="M 4 16 L 4 4 L 16 4"
              fill="none"
              stroke={isReady ? "#16A34A" : documentDetected ? "#EAB308" : "#ffffff"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity={isReady ? 1 : 0.85}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
            <motion.path
              d="M 84 4 L 96 4 L 96 16"
              fill="none"
              stroke={isReady ? "#16A34A" : documentDetected ? "#EAB308" : "#ffffff"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity={isReady ? 1 : 0.85}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
            <motion.path
              d="M 96 47.29 L 96 59.29 L 84 59.29"
              fill="none"
              stroke={isReady ? "#16A34A" : documentDetected ? "#EAB308" : "#ffffff"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity={isReady ? 1 : 0.85}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            <motion.path
              d="M 16 59.29 L 4 59.29 L 4 47.29"
              fill="none"
              stroke={isReady ? "#16A34A" : documentDetected ? "#EAB308" : "#ffffff"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity={isReady ? 1 : 0.85}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
          </svg>
        )}

        {/* Live document edge overlay — shown whenever corners are detected */}
        <AnimatePresence>
          {overlayPolygon && isStreaming && (
            <motion.svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.polygon
                points={overlayPolygon}
                fill={isReady ? "rgba(22, 163, 74, 0.12)" : "rgba(234, 179, 8, 0.1)"}
                stroke={overlayStroke}
                strokeWidth="0.6"
                strokeDasharray={isReady ? "none" : "2 1"}
                animate={
                  isReady
                    ? { strokeOpacity: [0.8, 1, 0.8] }
                    : { strokeDashoffset: [0, 6] }
                }
                transition={
                  isReady
                    ? { duration: 1.2, repeat: Infinity }
                    : { duration: 0.8, repeat: Infinity, ease: "linear" }
                }
              />
            </motion.svg>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isReady && (
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-primary pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{
                  boxShadow: "0 0 20px 4px rgba(22, 163, 74, 0.3)",
                }}
                animate={{
                  boxShadow: [
                    "0 0 20px 4px rgba(22, 163, 74, 0.3)",
                    "0 0 30px 8px rgba(22, 163, 74, 0.5)",
                    "0 0 20px 4px rgba(22, 163, 74, 0.3)",
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                key={countdown}
                className="flex flex-col items-center"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-7xl font-bold text-white">{countdown}</span>
                <span className="text-white/80 text-sm mt-2">Hold steady…</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-accent/20">
            <motion.div
              className="flex flex-col items-center gap-3 text-muted-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="12" cy="12" r="3" />
                <path d="M3 8h2" />
              </svg>
              <span className="text-sm">Initializing camera…</span>
            </motion.div>
          </div>
        )}
      </div>
    )
  }
)
