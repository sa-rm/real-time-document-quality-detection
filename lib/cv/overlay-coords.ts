/**
 * Map canvas/video pixel coordinates to overlay percentages when the
 * video is displayed with object-fit: cover inside a fixed-aspect container.
 */

export function mapPointToOverlayPercent(
  px: number,
  py: number,
  sourceWidth: number,
  sourceHeight: number,
  containerAspect: number
): { x: number; y: number } {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return { x: 0, y: 0 }
  }

  const sourceAspect = sourceWidth / sourceHeight

  if (sourceAspect > containerAspect) {
    const visibleWidth = sourceHeight * containerAspect
    const offsetX = (sourceWidth - visibleWidth) / 2
    return {
      x: ((px - offsetX) / visibleWidth) * 100,
      y: (py / sourceHeight) * 100,
    }
  }

  const visibleHeight = sourceWidth / containerAspect
  const offsetY = (sourceHeight - visibleHeight) / 2
  return {
    x: (px / sourceWidth) * 100,
    y: ((py - offsetY) / visibleHeight) * 100,
  }
}
