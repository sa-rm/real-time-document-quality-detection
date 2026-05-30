/**
 * Document Quality Analyzer
 *
 * All quality checks must pass before capture is allowed.
 */

import { detectBlur, type BlurResult } from "./blur-detection"
import { detectEdges, detectDocumentBoundary, type EdgeResult } from "./edge-detection"
import {
  analyzeBrightness,
  detectGlare,
  analyzeContrast,
  type BrightnessResult,
  type GlareResult,
  type ContrastResult,
} from "./brightness-detection"

export const QUALITY_THRESHOLDS = {
  overallScore: 65,
  blur: 60,
  edges: 50,
  brightness: 60,
  glare: 60,
  documentConfidence: 50,
} as const

export type QualityCheckKey = "blur" | "glare" | "brightness" | "edges" | "alignment"

export interface QualityCheckStatuses {
  blur: "checking" | "passed" | "failed"
  glare: "checking" | "passed" | "failed"
  brightness: "checking" | "passed" | "failed"
  edges: "checking" | "passed" | "failed"
  alignment: "checking" | "passed" | "failed"
}

export interface QualityAnalysis {
  overallScore: number
  isReady: boolean
  allChecksPass: boolean
  checkStatuses: QualityCheckStatuses
  blur: BlurResult
  edges: EdgeResult
  brightness: BrightnessResult
  glare: GlareResult
  contrast: ContrastResult
  documentDetected: boolean
  documentConfidence: number
  /** Corners as % of source frame (0–100), for overlay */
  documentCorners: { x: number; y: number }[] | null
  feedback: string
  feedbackType: "error" | "warning" | "success" | "info"
}

export function getQualityCheckStatuses(
  analysis: QualityAnalysis | null,
  hasSample: boolean
): QualityCheckStatuses {
  if (!analysis || !hasSample) {
    return {
      blur: "checking",
      glare: "checking",
      brightness: "checking",
      edges: "checking",
      alignment: "checking",
    }
  }
  return analysis.checkStatuses
}

export function allQualityChecksPass(analysis: QualityAnalysis): boolean {
  return analysis.allChecksPass
}

function scorePasses(score: number, threshold: number): boolean {
  return score >= threshold
}

function buildCheckStatuses(params: {
  blur: number
  glare: number
  brightness: number
  edges: number
  documentDetected: boolean
}): QualityCheckStatuses {
  return {
    blur: scorePasses(params.blur, QUALITY_THRESHOLDS.blur) ? "passed" : "failed",
    glare: scorePasses(params.glare, QUALITY_THRESHOLDS.glare) ? "passed" : "failed",
    brightness: scorePasses(params.brightness, QUALITY_THRESHOLDS.brightness) ? "passed" : "failed",
    edges: scorePasses(params.edges, QUALITY_THRESHOLDS.edges) ? "passed" : "failed",
    alignment: params.documentDetected ? "passed" : "failed",
  }
}

/**
 * Full quality analysis — capture only when every check passes.
 */
export function analyzeDocumentQuality(ctx: CanvasRenderingContext2D): QualityAnalysis {
  const blur = detectBlur(ctx)
  const edges = detectEdges(ctx)
  const brightness = analyzeBrightness(ctx)
  const glare = detectGlare(ctx)
  const contrast = analyzeContrast(ctx)
  const documentBoundary = detectDocumentBoundary(ctx)

  const realBlur = blur.score
  const realEdges = edges.score
  const realBrightness = brightness.score
  const realGlare = glare.score
  const realConfidence = documentBoundary.confidence
  const documentDetected = documentBoundary.detected

  const checkStatuses = buildCheckStatuses({
    blur: realBlur,
    glare: realGlare,
    brightness: realBrightness,
    edges: realEdges,
    documentDetected,
  })

  const allChecksPass =
    checkStatuses.blur === "passed" &&
    checkStatuses.glare === "passed" &&
    checkStatuses.brightness === "passed" &&
    checkStatuses.edges === "passed" &&
    checkStatuses.alignment === "passed"

  const overallScore = Math.round(
    realBlur * 0.25 +
      realEdges * 0.15 +
      realBrightness * 0.25 +
      realGlare * 0.2 +
      realConfidence * 0.15
  )

  const isReady = allChecksPass

  const { feedback, feedbackType } = generateFeedback({
    blur: { ...blur, isBlurry: realBlur < QUALITY_THRESHOLDS.blur },
    brightness,
    glare: { ...glare, hasGlare: realGlare < QUALITY_THRESHOLDS.glare },
    edgesScore: realEdges,
    documentDetected,
    checkStatuses,
    isReady,
  })

  const canvasW = ctx.canvas.width
  const canvasH = ctx.canvas.height
  const documentCorners =
    documentBoundary.corners && canvasW > 0 && canvasH > 0
      ? documentBoundary.corners.map((c) => ({
          x: (c.x / canvasW) * 100,
          y: (c.y / canvasH) * 100,
        }))
      : null

  return {
    overallScore,
    isReady,
    allChecksPass,
    checkStatuses,
    blur: { ...blur, isBlurry: realBlur < QUALITY_THRESHOLDS.blur },
    edges: { ...edges },
    brightness: { ...brightness },
    glare: { ...glare, hasGlare: realGlare < QUALITY_THRESHOLDS.glare },
    contrast,
    documentDetected,
    documentConfidence: realConfidence,
    documentCorners,
    feedback,
    feedbackType,
  }
}

function generateFeedback(params: {
  blur: BlurResult
  brightness: BrightnessResult
  glare: GlareResult
  edgesScore: number
  documentDetected: boolean
  checkStatuses: QualityCheckStatuses
  isReady: boolean
}): { feedback: string; feedbackType: "error" | "warning" | "success" | "info" } {
  const { blur, brightness, glare, edgesScore, documentDetected, checkStatuses, isReady } = params

  if (isReady) {
    return { feedback: "Perfect — hold steady, capturing soon", feedbackType: "success" }
  }

  if (checkStatuses.alignment === "failed" || !documentDetected) {
    return {
      feedback: "Align the document inside the frame",
      feedbackType: "warning",
    }
  }

  if (checkStatuses.blur === "failed" || blur.isBlurry) {
    return { feedback: "Hold steady — image is too blurry", feedbackType: "warning" }
  }

  if (checkStatuses.glare === "failed" || glare.hasGlare) {
    return { feedback: "Reduce glare — tilt document or move away from light", feedbackType: "warning" }
  }

  if (checkStatuses.brightness === "failed") {
    if (brightness.isDark) {
      return { feedback: "Too dark — add more light on the document", feedbackType: "warning" }
    }
    if (brightness.isBright) {
      return { feedback: "Too bright — reduce direct light", feedbackType: "warning" }
    }
    return { feedback: "Adjust lighting on the document", feedbackType: "warning" }
  }

  if (checkStatuses.edges === "failed" || edgesScore < QUALITY_THRESHOLDS.edges) {
    return {
      feedback: "Document edges unclear — move closer and fill the frame",
      feedbackType: "warning",
    }
  }

  return { feedback: "Checking quality…", feedbackType: "info" }
}

/**
 * Quick quality check for high-frequency updates
 */
export function quickQualityCheck(ctx: CanvasRenderingContext2D): {
  score: number
  isAcceptable: boolean
  feedback: string
} {
  const analysis = analyzeDocumentQuality(ctx)
  return {
    score: analysis.overallScore,
    isAcceptable: analysis.allChecksPass,
    feedback: analysis.feedback,
  }
}
