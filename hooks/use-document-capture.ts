"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { analyzeDocumentQuality, type QualityAnalysis } from "@/lib/cv/quality-analyzer"
import { autoCrop, enhanceImage, canvasToDataUrl, resizeCanvas } from "@/lib/cv/image-enhancement"

export interface WebcamState {
  isInitialized: boolean
  isStreaming: boolean
  error: string | null
  facingMode: "user" | "environment"
}

export interface CaptureResult {
  original: string
  enhanced: string
  cropped: string
  quality: QualityAnalysis
}

interface UseDocumentCaptureOptions {
  analysisInterval?: number // ms between quality analyses
  videoWidth?: number
  videoHeight?: number
  facingMode?: "user" | "environment"
}

export function useDocumentCapture(options: UseDocumentCaptureOptions = {}) {
  const {
    analysisInterval = 200, // 5 FPS for analysis
    videoWidth = 1280,
    videoHeight = 720,
    facingMode: initialFacingMode = "environment",
  } = options

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isAnalyzingRef = useRef(false)

  const [webcamState, setWebcamState] = useState<WebcamState>({
    isInitialized: false,
    isStreaming: false,
    error: null,
    facingMode: initialFacingMode,
  })

  const [quality, setQuality] = useState<QualityAnalysis | null>(null)
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 })
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  /**
   * Initialize webcam stream
   */
  const initializeCamera = useCallback(async () => {
    try {
      setWebcamState((prev) => ({ ...prev, error: null }))

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: videoWidth },
          height: { ideal: videoHeight },
          facingMode: webcamState.facingMode,
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setWebcamState((prev) => ({
        ...prev,
        isInitialized: true,
        isStreaming: true,
      }))
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to access camera"
      setWebcamState((prev) => ({
        ...prev,
        error,
        isInitialized: false,
        isStreaming: false,
      }))
    }
  }, [videoWidth, videoHeight, webcamState.facingMode])

  /**
   * Stop webcam stream
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }

    setWebcamState((prev) => ({
      ...prev,
      isStreaming: false,
    }))
  }, [])

  /**
   * Switch between front and back camera
   */
  const switchCamera = useCallback(async () => {
    setWebcamState((prev) => ({
      ...prev,
      facingMode: prev.facingMode === "user" ? "environment" : "user",
    }))
  }, [])

  // Reinitialize when facing mode changes
  useEffect(() => {
    if (webcamState.isInitialized) {
      initializeCamera()
    }
  }, [webcamState.facingMode])

  /**
   * Capture current frame to canvas
   */
  const captureFrame = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || !webcamState.isStreaming) {
      return null
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    return canvas
  }, [webcamState.isStreaming])

  /**
   * Analyze current frame quality
   */
  const analyzeFrame = useCallback(() => {
    // Use ref to avoid stale closure in interval
    if (isAnalyzingRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) {
      return
    }

    // Check if video has valid dimensions and is playing
    if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    isAnalyzingRef.current = true
    setIsAnalyzing(true)

    try {
      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw current video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      setFrameSize({ width: video.videoWidth, height: video.videoHeight })
      const analysis = analyzeDocumentQuality(ctx)
      setQuality(analysis)
    } catch (error) {
      console.error("[v0] Frame analysis error:", error)
    } finally {
      isAnalyzingRef.current = false
      setIsAnalyzing(false)
    }
  }, [])

  /**
   * Start continuous quality analysis
   */
  const startAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
    }

    analysisIntervalRef.current = setInterval(() => {
      analyzeFrame()
    }, analysisInterval)
  }, [analyzeFrame, analysisInterval])

  /**
   * Stop continuous quality analysis
   */
  const stopAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }
  }, [])

  /**
   * Capture and process document image
   */
  const captureDocument = useCallback((): CaptureResult | null => {
    const canvas = captureFrame()
    if (!canvas) return null

    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    // Get quality analysis
    const qualityAnalysis = analyzeDocumentQuality(ctx)

    // Get original image
    const original = canvasToDataUrl(canvas, 0.95)

    // Enhance image
    const enhancedCanvas = enhanceImage(canvas, {
      brightness: 5,
      contrast: 10,
      sharpen: true,
      autoLevels: true,
    })
    const enhanced = canvasToDataUrl(enhancedCanvas, 0.95)

    // Auto-crop to document boundaries
    const cropResult = autoCrop(enhancedCanvas, 20)

    // Resize if too large
    const resizedCropped = resizeCanvas(cropResult.canvas, 2000, 2000)
    const cropped = canvasToDataUrl(resizedCropped, 0.92)

    return {
      original,
      enhanced,
      cropped,
      quality: qualityAnalysis,
    }
  }, [captureFrame])

  /**
   * Set refs for video and canvas elements
   */
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element
  }, [])

  const setCanvasRef = useCallback((element: HTMLCanvasElement | null) => {
    canvasRef.current = element
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    // Refs
    setVideoRef,
    setCanvasRef,

    // State
    webcamState,
    quality,
    frameSize,
    isAnalyzing,

    // Controls
    initializeCamera,
    stopCamera,
    switchCamera,
    startAnalysis,
    stopAnalysis,
    captureDocument,
    captureFrame,
    analyzeFrame,
  }
}
