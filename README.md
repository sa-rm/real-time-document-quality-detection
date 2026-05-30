# iVX — Real-Time Document Quality Detection and Verification
## Technical Documentation

**Project:** `Real Time Document Quality Detection and Verification` (iVX — Real-Time Document Quality Detection and Verification)
**Version:** 0.1.0
**Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5.7 · Tailwind CSS 4 · Radix UI / shadcn · Framer Motion · Zod · WebRTC `getUserMedia` + HTML `<canvas>` 2D
**Domain:** Browser-based eKYC document capture with on-device computer-vision quality gating, auto-enhancement, and auto-cropping.

---

## 1. Overview

iVX is a client-side document capture experience. The user points their webcam (or rear mobile camera) at an identity document. The app runs a continuous computer-vision (CV) pipeline on each video frame (~5 FPS) and *only* allows capture once every quality check passes:

- **Blur** (Laplacian variance)
- **Edge sharpness** (Sobel gradients)
- **Brightness** (luminance histogram)
- **Glare** (overexposed pixel ratio + hotspot map)
- **Document alignment** (rectangular boundary + orientation check)

When the frame passes, the app:
1. Captures the raw frame to a canvas.
2. Auto-levels, brightness/contrast-corrects, and sharpens it (unsharp mask).
3. Auto-crops to the detected document boundary.
4. Resizes (max 2000×2000) and exports as JPEG (quality 0.92–0.95) data URLs.

All processing happens **in-browser**. No images or video are uploaded by the CV pipeline itself.

---

## 2. Repository Layout

```
app/
  layout.tsx           # Root Next.js layout, fonts, metadata, Analytics
  page.tsx             # Home page → renders <KYCFlow />
  globals.css          # Tailwind v4 + theme tokens
components/
  ui/                  # shadcn/Radix primitives (button, dialog, toast, …)
  kyc/                 # KYC flow components (referenced from page.tsx)
hooks/
  use-document-capture.ts   # Main orchestration hook (camera + CV + capture)
  use-mobile.ts             # Viewport breakpoint helper
  use-toast.ts              # Toast queue
lib/
  utils.ts             # cn() (clsx + tailwind-merge)
  cv/
    index.ts                  # Barrel re-export
    image-utils.ts            # Grayscale, convolution, variance, downsample
    blur-detection.ts         # Laplacian-variance blur score
    edge-detection.ts         # Sobel edges + document-boundary detector
    brightness-detection.ts   # Brightness, glare, contrast analyzers
    quality-analyzer.ts       # Aggregate scorer + feedback generator
    image-enhancement.ts      # Auto-crop, enhance, sharpen, resize
    overlay-coords.ts         # Map source-pixel coords → overlay % (object-fit: cover)
public/                # Icons, logos, placeholders
```

---

## 3. Runtime Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ <KYCFlow />  (UI: camera viewport, overlay, checklist, capture) │
└───────────────┬─────────────────────────────────────────────────┘
                │ uses
                ▼
┌─────────────────────────────────────────────────────────────────┐
│ useDocumentCapture()  (hooks/use-document-capture.ts)           │
│  - getUserMedia stream → <video>                                │
│  - setInterval(200ms) → analyzeFrame()                          │
│  - captureDocument() → original / enhanced / cropped + quality  │
└───────────────┬─────────────────────────────────────────────────┘
                │ calls
                ▼
┌─────────────────────────────────────────────────────────────────┐
│ lib/cv/quality-analyzer.ts                                      │
│   analyzeDocumentQuality(ctx) →                                 │
│     detectBlur · detectEdges · analyzeBrightness ·              │
│     detectGlare · analyzeContrast · detectDocumentBoundary      │
│   → QualityAnalysis { scores, checkStatuses, feedback, corners }│
└───────────────┬─────────────────────────────────────────────────┘
                │ on capture
                ▼
┌─────────────────────────────────────────────────────────────────┐
│ lib/cv/image-enhancement.ts                                     │
│   enhanceImage() → autoCrop() → resizeCanvas() → JPEG dataURL   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. The CV Pipeline

All detectors operate on a **downsampled grayscale Float32Array** for speed (typically 160–400 px on the long edge). Source pixel coordinates are reconstructed via the `scale` factor returned by `downsample()`.

### 4.1 `image-utils.ts` — primitives

| Function | Purpose |
|---|---|
| `getImageData(ctx)` | Read full-canvas `ImageData`. |
| `toGrayscale(r,g,b)` | Rec. 709 luminance: `0.2126·R + 0.7152·G + 0.0722·B`. |
| `createGrayscaleArray(imageData)` | Returns `Float32Array` of luminance. |
| `convolve3x3(src, w, h, kernel)` | Generic 3×3 convolution (used by Sobel, Laplacian, Gaussian, sharpen). |
| `variance(arr)` | Population variance — feeds blur score. |
| `downsample(ctx, targetLong)` | Renders the source onto a smaller offscreen canvas and returns `{ ctx, scale }`. |

### 4.2 `blur-detection.ts` — Laplacian variance

Kernel:
```
[ 0  1  0 ]
[ 1 -4  1 ]
[ 0  1  0 ]
```
Steps: downsample → 320 px → grayscale → 3×3 Laplacian convolution → `variance(laplacian)`.

- `score = clamp(variance / MAX_VARIANCE · 100, 0, 100)` with `MAX_VARIANCE = 500`.
- `isBlurry = variance < BLUR_THRESHOLD (80)`.

### 4.3 `brightness-detection.ts`

Three independent analyzers:

| Analyzer | Method | Pass criteria |
|---|---|---|
| `analyzeBrightness` | Mean luminance over 160 px downsample. Piecewise scoring: dark zone `< 50`, optimal zone `50–200`, bright zone `> 200`. | `50 ≤ avg ≤ 200` |
| `detectGlare` | Counts pixels with `(R+G+B)/3 > 250` and bins hotspots into a 10 px grid (max 10 reported). | `glarePercentage ≤ 5%` |
| `analyzeContrast` | Standard deviation of luminance. Score = `min(100, stdDev/80 · 100)`. | `stdDev ≥ 30` |

### 4.4 `edge-detection.ts`

Two-stage:

**`detectEdges(ctx)`** — generic edge strength:
- Gaussian 3×3 blur → Sobel X / Y → magnitude.
- Adaptive threshold: `clamp(mean + 1·std, 25, 100)`.
- Returns edge-pixel ratio, bounding box (8th–92nd percentile of edge xs/ys → robust against outliers), and a 0–100 score.

**`detectDocumentBoundary(ctx)`** — rectangle validation:
- Same Sobel pipeline at 400 px.
- Classifies each edge gradient angle as horizontal / vertical (tolerance ±0.35 rad).
- Requires **both** orientations to exceed an adaptive `minOrientationEdges` count.
- Validates the bbox: area 10–90 % of frame, aspect ratio 0.9–2.6, center near the middle (15–85 % x, 12–88 % y).
- Returns `{ detected, confidence (0–100), corners }`. Corners are produced by `bboxToCorners()` scaled back to source pixels.

### 4.5 `quality-analyzer.ts` — aggregation

Thresholds (all 0–100 scores):
```ts
QUALITY_THRESHOLDS = {
  overallScore: 65, blur: 60, edges: 50,
  brightness: 60, glare: 60, documentConfidence: 50,
}
```

Aggregate score (weighted):
```
overall = 0.25·blur + 0.15·edges + 0.25·brightness
        + 0.20·glare + 0.15·documentConfidence
```

`allChecksPass` requires **every** check (`blur`, `glare`, `brightness`, `edges`, `alignment`) to be `"passed"`. `isReady === allChecksPass`. The hook only fires `captureDocument()` when `isReady` is true.

`documentCorners` is normalized to **percentages of the source frame** (0–100) so the overlay can render them regardless of CSS sizing. Use `mapPointToOverlayPercent()` from `overlay-coords.ts` when the `<video>` is rendered with `object-fit: cover`.

**Feedback generator** prioritizes:
1. Ready → `"Perfect — hold steady, capturing soon"`
2. Alignment failure → `"Align the document inside the frame"`
3. Blur → `"Hold steady — image is too blurry"`
4. Glare → `"Reduce glare — tilt document or move away from light"`
5. Brightness (dark / bright variants)
6. Edges → `"Document edges unclear — move closer and fill the frame"`

### 4.6 `image-enhancement.ts`

| Function | Behavior |
|---|---|
| `autoCrop(canvas, padding=10)` | Sobel-based bounding box on a 320 px downsample, scaled back to source, padded. Falls back to the full frame if bbox < 100×50. |
| `enhanceImage(canvas, opts)` | Optional auto-levels (histogram stretch when min/max range is 30–255), brightness/contrast (standard contrast factor `259·(c+255)/(255·(259−c))`), then unsharp mask. |
| `applySharpening(canvas, amount=0.5)` | 3×3 `[0,-1,0; -1,5,-1; 0,-1,0]` kernel blended with the original at `amount`. |
| `canvasToDataUrl(canvas, q=0.92)` | JPEG export. |
| `resizeCanvas(canvas, maxW, maxH)` | Aspect-preserving downscale. |

`captureDocument()` chains: `enhanceImage({ brightness: 5, contrast: 10, sharpen: true, autoLevels: true })` → `autoCrop(20)` → `resizeCanvas(2000, 2000)` → JPEG 0.92.

---

## 5. `useDocumentCapture()` API

```ts
const {
  setVideoRef, setCanvasRef,         // attach to <video> and offscreen <canvas>
  webcamState,                       // { isInitialized, isStreaming, error, facingMode }
  quality,                           // QualityAnalysis | null  (updated every analysisInterval)
  frameSize,                         // { width, height } of last analyzed frame
  isAnalyzing,                       // true while a frame is being scored
  initializeCamera, stopCamera, switchCamera,
  startAnalysis, stopAnalysis,
  captureDocument,                   // CaptureResult | null
  captureFrame, analyzeFrame,
} = useDocumentCapture({
  analysisInterval: 200,             // ms (default 200 → 5 FPS)
  videoWidth: 1280, videoHeight: 720,
  facingMode: "environment",         // default rear camera
})
```

`CaptureResult`:
```ts
{
  original: string   // JPEG data URL (q=0.95)
  enhanced: string   // JPEG data URL (q=0.95)
  cropped:  string   // JPEG data URL (q=0.92), resized ≤ 2000 px
  quality:  QualityAnalysis
}
```

Lifecycle notes:
- `initializeCamera()` stops any previous stream first, then `getUserMedia({ video: {…, facingMode}, audio: false })`.
- Switching `facingMode` triggers a re-init via the `useEffect` on `webcamState.facingMode`.
- `analyzeFrame()` uses an `isAnalyzingRef` guard to avoid overlapping work; the interval is a no-op while a previous frame is in flight.
- `stopCamera()` clears the analysis interval and stops all media tracks. Called automatically on unmount.

---

## 6. Coordinate Mapping (`overlay-coords.ts`)

For overlays drawn over a `<video>` element using `object-fit: cover`, source pixels do not map linearly to container percentages. `mapPointToOverlayPercent(px, py, sourceW, sourceH, containerAspect)` returns `{ x, y }` percentages corrected for the cropped axis.

`quality.documentCorners` is already source-frame-percentages — feed each corner through this helper using the container's aspect ratio before rendering SVG overlays.

---

## 7. UI Layer (Next.js App Router)

- `app/layout.tsx`: declares metadata (title, description, multi-mode icons), loads Geist fonts, mounts Vercel `<Analytics />` in production only.
- `app/page.tsx`: renders `<KYCFlow />` (from `components/kyc/kyc-flow`) inside a `min-h-screen bg-background` main element.
- `components/ui/*`: shadcn primitives over Radix — pre-styled with Tailwind 4 tokens defined in `app/globals.css`.
- `components/kyc/*`: domain components (not included in this archive view but consumed by `page.tsx`).

---

## 8. Styling & Theming

- Tailwind CSS v4 (`@tailwindcss/postcss`) with `tw-animate-css`.
- All design tokens are declared in `app/globals.css` as CSS custom properties — components reference them through Tailwind utilities (e.g. `bg-background`, `text-foreground`).
- `cn()` in `lib/utils.ts` merges Tailwind classes safely (`clsx` + `tailwind-merge`).

---

## 9. Dependencies (key)

| Area | Package |
|---|---|
| Framework | `next@16.2.6`, `react@19`, `react-dom@19` |
| Styling | `tailwindcss@^4`, `@tailwindcss/postcss`, `tw-animate-css`, `class-variance-authority`, `clsx`, `tailwind-merge` |
| UI primitives | Full `@radix-ui/react-*` suite, `lucide-react`, `cmdk`, `vaul`, `sonner`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `recharts` |
| Forms / validation | `react-hook-form`, `@hookform/resolvers`, `zod` |
| Motion | `framer-motion@^12` |
| Analytics | `@vercel/analytics` |
| Theme | `next-themes` |

No CV libraries (OpenCV.js, TensorFlow.js, MediaPipe) are used — everything is hand-rolled in TypeScript over the 2D canvas API.

---

## 10. Performance Characteristics

- Analysis runs on a downsampled image (160–400 px long edge) → each `analyzeDocumentQuality()` call is bounded by ≈ `O(N²)` for a small N regardless of source resolution.
- Default cadence: **5 FPS** (`analysisInterval = 200 ms`). Reduce to 100 ms for snappier feedback on mid/high-end devices.
- `isAnalyzingRef` prevents the interval from queueing while a slow frame is still computing.
- Capture-time enhancement runs on the **full-resolution** frame (one-shot), so cost is paid only on the user's tap/auto-trigger.

Tuning knobs:
- `BLUR_THRESHOLD`, `MAX_VARIANCE` (`blur-detection.ts`)
- `DARK_THRESHOLD`, `BRIGHT_THRESHOLD`, `GLARE_THRESHOLD`, `GLARE_AREA_THRESHOLD`, `MIN_CONTRAST` (`brightness-detection.ts`)
- `MIN_EDGE_RATIO`, adaptive-threshold multiplier, bbox aspect/area limits (`edge-detection.ts`)
- `QUALITY_THRESHOLDS` + aggregate weights (`quality-analyzer.ts`)

---

## 11. Browser Requirements

- `navigator.mediaDevices.getUserMedia` (HTTPS or `localhost`).
- HTML `<canvas>` 2D context with `getImageData` / `putImageData`.
- `Uint8ClampedArray`, `Float32Array`, modern ES (Next 16 build target).
- Permissions: camera. The app gracefully surfaces failures through `webcamState.error`.

---

## 12. Build & Run

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build && pnpm start
pnpm lint
```

Production builds emit a fully client-renderable App Router bundle. The CV pipeline has no server dependencies; only the page shell is SSR'd.

---

## 13. Security & Privacy

- No frame is transmitted by the CV/capture path; all data URLs stay in memory until the consuming component (`KYCFlow`) chooses to upload them.
- Vercel `<Analytics />` is mounted only when `process.env.NODE_ENV === 'production'`.
- Camera permission is requested lazily on `initializeCamera()`; `stopCamera()` releases all tracks on unmount or step change.

---

## 14. Extension Points

| Goal | Where to plug in |
|---|---|
| Add OCR / MRZ parsing | Run on `CaptureResult.cropped` after `captureDocument()`. |
| Add liveness / selfie step | Reuse `useDocumentCapture({ facingMode: "user" })` with relaxed thresholds. |
| Persist captures | Pipe `cropped` (data URL) → `fetch('/api/upload', …)` from `KYCFlow`. |
| Custom feedback strings | Override `generateFeedback()` in `quality-analyzer.ts`. |
| Different aggregate weighting | Edit the weighted sum in `analyzeDocumentQuality()`. |

---

