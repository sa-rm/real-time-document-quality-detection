/**
 * Core image processing utilities for document capture
 * Provides canvas-based operations for real-time quality analysis
 */

export interface ImageData {
  data: Uint8ClampedArray
  width: number
  height: number
}

/**
 * Get pixel data from canvas
 */
export function getImageData(
  ctx: CanvasRenderingContext2D,
  x: number = 0,
  y: number = 0,
  width?: number,
  height?: number
): ImageData {
  const w = width ?? ctx.canvas.width
  const h = height ?? ctx.canvas.height
  const imageData = ctx.getImageData(x, y, w, h)
  return {
    data: imageData.data,
    width: w,
    height: h,
  }
}

/**
 * Convert RGB pixel to grayscale using luminosity method
 */
export function toGrayscale(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * Create a grayscale array from image data
 */
export function createGrayscaleArray(imageData: ImageData): Float32Array {
  const { data, width, height } = imageData
  const gray = new Float32Array(width * height)
  
  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4
    gray[pixelIndex] = toGrayscale(data[i], data[i + 1], data[i + 2])
  }
  
  return gray
}

/**
 * Apply 3x3 convolution kernel to grayscale image
 */
export function convolve3x3(
  gray: Float32Array,
  width: number,
  height: number,
  kernel: number[][]
): Float32Array {
  const result = new Float32Array(width * height)
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx)
          sum += gray[idx] * kernel[ky + 1][kx + 1]
        }
      }
      result[y * width + x] = sum
    }
  }
  
  return result
}

/**
 * Calculate variance of an array (for Laplacian blur detection)
 */
export function variance(arr: Float32Array): number {
  let sum = 0
  let sumSq = 0
  const n = arr.length
  
  for (let i = 0; i < n; i++) {
    sum += arr[i]
    sumSq += arr[i] * arr[i]
  }
  
  const mean = sum / n
  return sumSq / n - mean * mean
}

/**
 * Downsample image for faster processing
 */
export function downsample(
  ctx: CanvasRenderingContext2D,
  targetWidth: number = 320
): { ctx: CanvasRenderingContext2D; scale: number } {
  const canvas = ctx.canvas
  const scale = targetWidth / canvas.width
  const targetHeight = Math.floor(canvas.height * scale)
  
  const smallCanvas = document.createElement("canvas")
  smallCanvas.width = targetWidth
  smallCanvas.height = targetHeight
  const smallCtx = smallCanvas.getContext("2d")!
  
  smallCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight)
  
  return { ctx: smallCtx, scale }
}
