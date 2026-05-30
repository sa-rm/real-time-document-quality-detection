/**
 * Blur Detection using Laplacian Variance
 * 
 * The Laplacian operator highlights regions of rapid intensity change.
 * A focused image has sharp edges -> high Laplacian variance
 * A blurry image has smooth transitions -> low Laplacian variance
 */

import { getImageData, createGrayscaleArray, convolve3x3, variance, downsample } from "./image-utils"

// Laplacian kernel for edge detection
const LAPLACIAN_KERNEL = [
  [0, 1, 0],
  [1, -4, 1],
  [0, 1, 0],
]

export interface BlurResult {
  score: number // 0-100, higher = less blur
  variance: number // Raw Laplacian variance
  isBlurry: boolean
}

// Real thresholds for production quality
const BLUR_THRESHOLD = 80 // Below this = blurry
const MAX_VARIANCE = 500 // Realistic max variance

/**
 * Detect blur level in an image using Laplacian variance method
 */
export function detectBlur(ctx: CanvasRenderingContext2D): BlurResult {
  // Downsample for faster processing
  const { ctx: smallCtx } = downsample(ctx, 320)
  
  const imageData = getImageData(smallCtx)
  const gray = createGrayscaleArray(imageData)
  
  // Apply Laplacian operator
  const laplacian = convolve3x3(gray, imageData.width, imageData.height, LAPLACIAN_KERNEL)
  
  // Calculate variance of Laplacian
  const laplacianVariance = variance(laplacian)
  
  // Convert to 0-100 score - realistic scoring
  const normalizedScore = Math.min(100, Math.max(0, (laplacianVariance / MAX_VARIANCE) * 100))
  
  return {
    score: Math.round(normalizedScore),
    variance: laplacianVariance,
    isBlurry: laplacianVariance < BLUR_THRESHOLD,
  }
}

/**
 * Quick blur check without full analysis
 */
export function isImageBlurry(ctx: CanvasRenderingContext2D, threshold: number = BLUR_THRESHOLD): boolean {
  return detectBlur(ctx).isBlurry
}
