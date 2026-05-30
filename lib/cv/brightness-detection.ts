/**
 * Brightness and Glare Detection
 * 
 * Analyzes image luminosity to detect:
 * - Overall brightness (too dark/too bright)
 * - Glare/hotspots (overexposed regions)
 * - Contrast levels
 */

import { getImageData, toGrayscale, downsample } from "./image-utils"

export interface BrightnessResult {
  score: number // 0-100, higher = better brightness
  averageBrightness: number // 0-255
  isDark: boolean
  isBright: boolean
  isOptimal: boolean
}

export interface GlareResult {
  score: number // 0-100, higher = less glare
  glarePercentage: number // Percentage of overexposed pixels
  hasGlare: boolean
  hotspots: { x: number; y: number }[]
}

export interface ContrastResult {
  score: number // 0-100
  contrast: number // Standard deviation of brightness
  isLowContrast: boolean
}

// Real thresholds for production
const DARK_THRESHOLD = 50 // Below this = too dark
const BRIGHT_THRESHOLD = 200 // Above this = too bright
const GLARE_THRESHOLD = 250 // Pixel value for glare detection
const GLARE_AREA_THRESHOLD = 0.05 // Max 5% glare acceptable
const MIN_CONTRAST = 30 // Minimum acceptable contrast

/**
 * Analyze overall image brightness
 */
export function analyzeBrightness(ctx: CanvasRenderingContext2D): BrightnessResult {
  const { ctx: smallCtx } = downsample(ctx, 160) // Small sample is enough
  const imageData = getImageData(smallCtx)
  const { data } = imageData

  let sum = 0
  const pixelCount = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    sum += toGrayscale(data[i], data[i + 1], data[i + 2])
  }

  const avgBrightness = sum / pixelCount

  // Realistic scoring based on actual brightness
  let score: number
  if (avgBrightness < DARK_THRESHOLD) {
    score = Math.round((avgBrightness / DARK_THRESHOLD) * 40)
  } else if (avgBrightness > BRIGHT_THRESHOLD) {
    score = Math.round(80 - ((avgBrightness - BRIGHT_THRESHOLD) / (255 - BRIGHT_THRESHOLD)) * 50)
  } else {
    // Optimal brightness zone - still needs to be earned
    const distFromDark = avgBrightness - DARK_THRESHOLD
    const rangeSize = BRIGHT_THRESHOLD - DARK_THRESHOLD
    score = 60 + ((distFromDark / rangeSize) * 30)
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    averageBrightness: avgBrightness,
    isDark: avgBrightness < DARK_THRESHOLD,
    isBright: avgBrightness > BRIGHT_THRESHOLD,
    isOptimal: avgBrightness >= DARK_THRESHOLD && avgBrightness <= BRIGHT_THRESHOLD,
  }
}

/**
 * Detect glare and hotspots in image
 */
export function detectGlare(ctx: CanvasRenderingContext2D): GlareResult {
  const { ctx: smallCtx, scale } = downsample(ctx, 200)
  const imageData = getImageData(smallCtx)
  const { data, width, height } = imageData

  let glarePixels = 0
  const hotspots: { x: number; y: number }[] = []
  const pixelCount = data.length / 4

  // Grid-based hotspot detection to avoid too many points
  const gridSize = 10
  const hotspotGrid: boolean[][] = Array(Math.ceil(height / gridSize))
    .fill(null)
    .map(() => Array(Math.ceil(width / gridSize)).fill(false))

  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3

    if (brightness > GLARE_THRESHOLD) {
      glarePixels++

      // Track hotspot location
      const pixelIndex = i / 4
      const x = pixelIndex % width
      const y = Math.floor(pixelIndex / width)
      const gridX = Math.floor(x / gridSize)
      const gridY = Math.floor(y / gridSize)

      if (!hotspotGrid[gridY][gridX]) {
        hotspotGrid[gridY][gridX] = true
        hotspots.push({
          x: Math.floor((x / scale) * gridSize),
          y: Math.floor((y / scale) * gridSize),
        })
      }
    }
  }

  const glarePercentage = glarePixels / pixelCount
  const hasGlare = glarePercentage > GLARE_AREA_THRESHOLD

  // Realistic glare score
  const score = Math.max(0, 100 - glarePercentage * 1000)

  return {
    score,
    glarePercentage,
    hasGlare,
    hotspots: hotspots.slice(0, 10), // Limit hotspot count
  }
}

/**
 * Analyze image contrast
 */
export function analyzeContrast(ctx: CanvasRenderingContext2D): ContrastResult {
  const { ctx: smallCtx } = downsample(ctx, 160)
  const imageData = getImageData(smallCtx)
  const { data } = imageData

  const values: number[] = []
  let sum = 0

  for (let i = 0; i < data.length; i += 4) {
    const gray = toGrayscale(data[i], data[i + 1], data[i + 2])
    values.push(gray)
    sum += gray
  }

  const mean = sum / values.length

  // Calculate standard deviation (contrast measure)
  let sumSquaredDiff = 0
  for (const value of values) {
    sumSquaredDiff += (value - mean) ** 2
  }
  const stdDev = Math.sqrt(sumSquaredDiff / values.length)

  // Score based on contrast level
  const score = Math.min(100, Math.round((stdDev / 80) * 100))

  return {
    score,
    contrast: stdDev,
    isLowContrast: stdDev < MIN_CONTRAST,
  }
}
