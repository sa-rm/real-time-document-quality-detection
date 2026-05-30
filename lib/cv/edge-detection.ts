/**
 * Edge Detection using Sobel Operator
 *
 * Detects document boundaries via gradient edges, robust bbox, and
 * orientation checks scaled to frame size.
 */

import { getImageData, createGrayscaleArray, convolve3x3, downsample } from "./image-utils"

const SOBEL_X = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
]

const SOBEL_Y = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1],
]

const GAUSSIAN_3x3 = [
  [1 / 16, 2 / 16, 1 / 16],
  [2 / 16, 4 / 16, 2 / 16],
  [1 / 16, 2 / 16, 1 / 16],
]

export interface EdgeResult {
  score: number
  edgePixelRatio: number
  hasStrongEdges: boolean
  boundingBox: { x: number; y: number; width: number; height: number } | null
}

const MIN_EDGE_RATIO = 0.015

function gaussianBlur(gray: Float32Array, width: number, height: number): Float32Array {
  return convolve3x3(gray, width, height, GAUSSIAN_3x3)
}

function computeGradientMagnitude(
  gray: Float32Array,
  width: number,
  height: number,
): { mag: Float32Array; gx: Float32Array; gy: Float32Array; mean: number; std: number } {
  const blurred = gaussianBlur(gray, width, height)
  const gx = convolve3x3(blurred, width, height, SOBEL_X)
  const gy = convolve3x3(blurred, width, height, SOBEL_Y)

  const mag = new Float32Array(width * height)
  let sum = 0
  let count = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const m = Math.sqrt(gx[idx] * gx[idx] + gy[idx] * gy[idx])
      mag[idx] = m
      sum += m
      count++
    }
  }
  const mean = sum / Math.max(count, 1)

  let varSum = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const d = mag[y * width + x] - mean
      varSum += d * d
    }
  }
  const std = Math.sqrt(varSum / Math.max(count, 1))

  return { mag, gx, gy, mean, std }
}

function adaptiveThreshold(mean: number, std: number): number {
  const t = mean + 1.0 * std
  return Math.max(25, Math.min(100, t))
}

function robustBBox(
  xs: number[],
  ys: number[],
  lo: number = 0.08,
  hi: number = 0.92,
): { minX: number; maxX: number; minY: number; maxY: number } | null {
  if (xs.length < 40) return null
  const sx = xs.slice().sort((a, b) => a - b)
  const sy = ys.slice().sort((a, b) => a - b)
  const minX = sx[Math.floor(sx.length * lo)]
  const maxX = sx[Math.floor(sx.length * hi)]
  const minY = sy[Math.floor(sy.length * lo)]
  const maxY = sy[Math.floor(sy.length * hi)]
  if (maxX <= minX || maxY <= minY) return null
  return { minX, maxX, minY, maxY }
}

function isValidDocumentBBox(
  bbox: { minX: number; maxX: number; minY: number; maxY: number },
  frameW: number,
  frameH: number,
): boolean {
  const w = (bbox.maxX - bbox.minX) / frameW
  const h = (bbox.maxY - bbox.minY) / frameH
  const area = w * h

  if (area < 0.1 || area > 0.9) return false

  const aspect = (bbox.maxX - bbox.minX) / Math.max(bbox.maxY - bbox.minY, 1)
  if (aspect < 0.9 || aspect > 2.6) return false

  const cx = (bbox.minX + bbox.maxX) / 2 / frameW
  const cy = (bbox.minY + bbox.maxY) / 2 / frameH
  if (cx < 0.15 || cx > 0.85 || cy < 0.12 || cy > 0.88) return false

  return true
}

function bboxToCorners(
  bbox: { minX: number; maxX: number; minY: number; maxY: number },
  scale: number,
): { x: number; y: number }[] {
  return [
    { x: Math.floor(bbox.minX / scale), y: Math.floor(bbox.minY / scale) },
    { x: Math.floor(bbox.maxX / scale), y: Math.floor(bbox.minY / scale) },
    { x: Math.floor(bbox.maxX / scale), y: Math.floor(bbox.maxY / scale) },
    { x: Math.floor(bbox.minX / scale), y: Math.floor(bbox.maxY / scale) },
  ]
}

export function detectEdges(ctx: CanvasRenderingContext2D): EdgeResult {
  const { ctx: smallCtx, scale } = downsample(ctx, 320)
  const imageData = getImageData(smallCtx)
  const gray = createGrayscaleArray(imageData)
  const { width, height } = imageData

  const { mag, mean, std } = computeGradientMagnitude(gray, width, height)
  const threshold = adaptiveThreshold(mean, std)

  let edgeCount = 0
  const xs: number[] = []
  const ys: number[] = []

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (mag[y * width + x] > threshold) {
        edgeCount++
        xs.push(x)
        ys.push(y)
      }
    }
  }

  const totalPixels = (width - 2) * (height - 2)
  const edgeRatio = edgeCount / totalPixels

  const bbox = robustBBox(xs, ys)
  const boundingBox = bbox
    ? {
        x: Math.floor(bbox.minX / scale),
        y: Math.floor(bbox.minY / scale),
        width: Math.floor((bbox.maxX - bbox.minX) / scale),
        height: Math.floor((bbox.maxY - bbox.minY) / scale),
      }
    : null

  const score = Math.min(100, Math.round((edgeRatio / 0.08) * 100))

  return {
    score,
    edgePixelRatio: edgeRatio,
    hasStrongEdges: edgeRatio > MIN_EDGE_RATIO,
    boundingBox,
  }
}

/**
 * Detect rectangular document in frame
 */
export function detectDocumentBoundary(ctx: CanvasRenderingContext2D): {
  detected: boolean
  confidence: number
  corners: { x: number; y: number }[] | null
} {
  const { ctx: smallCtx, scale } = downsample(ctx, 400)
  const imageData = getImageData(smallCtx)
  const gray = createGrayscaleArray(imageData)
  const { width, height } = imageData

  const { mag, gx, gy, mean, std } = computeGradientMagnitude(gray, width, height)
  const threshold = Math.max(35, adaptiveThreshold(mean, std) * 1.05)

  const xs: number[] = []
  const ys: number[] = []
  let horizontalEdges = 0
  let verticalEdges = 0
  let totalEdges = 0

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      if (mag[idx] <= threshold) continue
      totalEdges++
      xs.push(x)
      ys.push(y)

      const angle = Math.atan2(gy[idx], gx[idx])
      const absAngle = Math.abs(angle)
      if (absAngle < 0.35 || absAngle > Math.PI - 0.35) {
        verticalEdges++
      } else if (Math.abs(absAngle - Math.PI / 2) < 0.35) {
        horizontalEdges++
      }
    }
  }

  const minOrientationEdges = Math.max(30, Math.floor(((width + height) / 2) * 0.06))
  const hasBothOrientations =
    horizontalEdges >= minOrientationEdges && verticalEdges >= minOrientationEdges

  const structuredRatio = (horizontalEdges + verticalEdges) / Math.max(totalEdges, 1)
  const edgeBonus = totalEdges > 400 ? 25 : totalEdges > 150 ? 12 : 0
  let confidence = Math.round(structuredRatio * 85 + edgeBonus)
  if (!hasBothOrientations) confidence = Math.min(confidence, 40)
  confidence = Math.max(0, Math.min(100, confidence))

  const bbox = robustBBox(xs, ys, 0.06, 0.94)
  const bboxValid = bbox !== null && isValidDocumentBBox(bbox, width, height)

  let corners: { x: number; y: number }[] | null = null
  if (bbox && bboxValid && hasBothOrientations) {
    corners = bboxToCorners(bbox, scale)
  }

  const detected =
    hasBothOrientations &&
    bboxValid &&
    structuredRatio >= 0.22 &&
    confidence >= 38 &&
    totalEdges >= 120

  return {
    detected,
    confidence: bboxValid ? confidence : Math.min(confidence, 35),
    corners,
  }
}
