/**
 * Image Enhancement and Cropping Utilities
 * 
 * Post-capture processing for document images:
 * - Perspective correction (basic)
 * - Auto-cropping to document boundaries
 * - Brightness/contrast enhancement
 * - Sharpening
 */

import { getImageData, createGrayscaleArray, convolve3x3, downsample } from "./image-utils"

export interface CropResult {
  canvas: HTMLCanvasElement
  dataUrl: string
  bounds: { x: number; y: number; width: number; height: number }
}

export interface EnhancementOptions {
  brightness?: number // -100 to 100, default 0
  contrast?: number // -100 to 100, default 0
  sharpen?: boolean // Apply sharpening filter
  autoLevels?: boolean // Auto-adjust levels
}

/**
 * Auto-crop image to detected document boundaries
 */
export function autoCrop(
  sourceCanvas: HTMLCanvasElement,
  padding: number = 10
): CropResult {
  const ctx = sourceCanvas.getContext("2d")!
  const { ctx: smallCtx, scale } = downsample(ctx, 320)
  
  const imageData = getImageData(smallCtx)
  const gray = createGrayscaleArray(imageData)
  const { width, height } = imageData

  // Find content boundaries using edge detection
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

  const gradX = convolve3x3(gray, width, height, SOBEL_X)
  const gradY = convolve3x3(gray, width, height, SOBEL_Y)

  // Find bounding box of significant edges
  let minX = width,
    maxX = 0,
    minY = height,
    maxY = 0
  const threshold = 30

  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const idx = y * width + x
      const magnitude = Math.sqrt(gradX[idx] ** 2 + gradY[idx] ** 2)

      if (magnitude > threshold) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  // Scale back to original size and add padding
  const bounds = {
    x: Math.max(0, Math.floor(minX / scale) - padding),
    y: Math.max(0, Math.floor(minY / scale) - padding),
    width: Math.min(sourceCanvas.width, Math.ceil((maxX - minX) / scale) + padding * 2),
    height: Math.min(sourceCanvas.height, Math.ceil((maxY - minY) / scale) + padding * 2),
  }

  // Ensure minimum size
  if (bounds.width < 100 || bounds.height < 50) {
    bounds.x = 0
    bounds.y = 0
    bounds.width = sourceCanvas.width
    bounds.height = sourceCanvas.height
  }

  // Create cropped canvas
  const croppedCanvas = document.createElement("canvas")
  croppedCanvas.width = bounds.width
  croppedCanvas.height = bounds.height
  const croppedCtx = croppedCanvas.getContext("2d")!

  croppedCtx.drawImage(
    sourceCanvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    bounds.width,
    bounds.height
  )

  return {
    canvas: croppedCanvas,
    dataUrl: croppedCanvas.toDataURL("image/jpeg", 0.92),
    bounds,
  }
}

/**
 * Enhance image quality with brightness, contrast, and sharpening
 */
export function enhanceImage(
  sourceCanvas: HTMLCanvasElement,
  options: EnhancementOptions = {}
): HTMLCanvasElement {
  const {
    brightness = 0,
    contrast = 0,
    sharpen = true,
    autoLevels = true,
  } = options

  const canvas = document.createElement("canvas")
  canvas.width = sourceCanvas.width
  canvas.height = sourceCanvas.height
  const ctx = canvas.getContext("2d")!

  // Draw source image
  ctx.drawImage(sourceCanvas, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // Auto-levels: stretch histogram
  if (autoLevels) {
    let minBright = 255,
      maxBright = 0

    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3
      if (gray < minBright) minBright = gray
      if (gray > maxBright) maxBright = gray
    }

    const range = maxBright - minBright
    if (range > 30 && range < 255) {
      const scale = 255 / range
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, (data[i] - minBright) * scale))
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - minBright) * scale))
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - minBright) * scale))
      }
    }
  }

  // Apply brightness and contrast adjustments
  if (brightness !== 0 || contrast !== 0) {
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast))

    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness
      let r = data[i] + brightness
      let g = data[i + 1] + brightness
      let b = data[i + 2] + brightness

      // Apply contrast
      r = contrastFactor * (r - 128) + 128
      g = contrastFactor * (g - 128) + 128
      b = contrastFactor * (b - 128) + 128

      data[i] = Math.min(255, Math.max(0, r))
      data[i + 1] = Math.min(255, Math.max(0, g))
      data[i + 2] = Math.min(255, Math.max(0, b))
    }
  }

  ctx.putImageData(imageData, 0, 0)

  // Apply sharpening (unsharp mask approximation)
  if (sharpen) {
    const sharpenedCanvas = applySharpening(canvas)
    return sharpenedCanvas
  }

  return canvas
}

/**
 * Apply unsharp mask sharpening
 */
function applySharpening(sourceCanvas: HTMLCanvasElement, amount: number = 0.5): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = sourceCanvas.width
  canvas.height = sourceCanvas.height
  const ctx = canvas.getContext("2d")!

  // Draw original
  ctx.drawImage(sourceCanvas, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const width = canvas.width
  const height = canvas.height

  // Create copy for reading
  const original = new Uint8ClampedArray(data)

  // Simple sharpening kernel application
  // [0, -1, 0]
  // [-1, 5, -1]
  // [0, -1, 0]
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4

      for (let c = 0; c < 3; c++) {
        const center = original[idx + c] * 5
        const top = original[((y - 1) * width + x) * 4 + c]
        const bottom = original[((y + 1) * width + x) * 4 + c]
        const left = original[(y * width + (x - 1)) * 4 + c]
        const right = original[(y * width + (x + 1)) * 4 + c]

        const sharpened = center - top - bottom - left - right
        const blended = original[idx + c] + (sharpened - original[idx + c]) * amount

        data[idx + c] = Math.min(255, Math.max(0, blended))
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * Convert canvas to high-quality JPEG data URL
 */
export function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number = 0.92): string {
  return canvas.toDataURL("image/jpeg", quality)
}

/**
 * Resize canvas to maximum dimensions while maintaining aspect ratio
 */
export function resizeCanvas(
  sourceCanvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement {
  const { width, height } = sourceCanvas
  
  let newWidth = width
  let newHeight = height

  if (width > maxWidth) {
    newWidth = maxWidth
    newHeight = (height * maxWidth) / width
  }

  if (newHeight > maxHeight) {
    newHeight = maxHeight
    newWidth = (width * maxHeight) / height
  }

  const canvas = document.createElement("canvas")
  canvas.width = newWidth
  canvas.height = newHeight
  const ctx = canvas.getContext("2d")!

  ctx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight)

  return canvas
}
