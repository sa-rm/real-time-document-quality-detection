"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface QualityScoreProps {
  score: number
  threshold?: number
  size?: "sm" | "md" | "lg"
}

export function QualityScore({ score, threshold = 70, size = "md" }: QualityScoreProps) {
  const [displayScore, setDisplayScore] = useState(0)
  const isGood = score >= threshold

  // Dimensions based on size
  const dimensions = {
    sm: { width: 80, height: 80, cx: 40, cy: 40, r: 32, strokeWidth: 6, fontSize: "text-lg" },
    md: { width: 112, height: 112, cx: 56, cy: 56, r: 44, strokeWidth: 8, fontSize: "text-2xl" },
    lg: { width: 140, height: 140, cx: 70, cy: 70, r: 56, strokeWidth: 10, fontSize: "text-3xl" },
  }

  const dim = dimensions[size]
  const circumference = 2 * Math.PI * dim.r
  const strokeDashoffset = circumference - (displayScore / 100) * circumference

  // Animate score counting up
  useEffect(() => {
    const duration = 800
    const startTime = Date.now()
    const startScore = displayScore

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const newScore = Math.round(startScore + (score - startScore) * eased)
      setDisplayScore(newScore)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [score])

  // Color based on score
  const getColor = () => {
    if (score >= threshold) return "text-primary"
    if (score >= threshold * 0.7) return "text-yellow-500"
    return "text-orange-500"
  }

  return (
    <motion.div
      className="relative"
      style={{ width: dim.width, height: dim.height }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <svg className="w-full h-full transform -rotate-90">
        {/* Background track */}
        <circle
          cx={dim.cx}
          cy={dim.cy}
          r={dim.r}
          stroke="currentColor"
          strokeWidth={dim.strokeWidth}
          fill="none"
          className="text-muted"
        />
        {/* Progress arc */}
        <motion.circle
          cx={dim.cx}
          cy={dim.cy}
          r={dim.r}
          stroke="currentColor"
          strokeWidth={dim.strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={getColor()}
          style={{
            strokeDasharray: circumference,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`${dim.fontSize} font-bold ${getColor()}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {displayScore}%
        </motion.span>
        <span className="text-xs text-muted-foreground">Quality</span>
      </div>

      {/* Threshold indicator */}
      {isGood && (
        <motion.div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Ready
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}
