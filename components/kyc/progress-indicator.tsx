"use client"

import { motion } from "framer-motion"

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-2 w-full px-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <motion.div
          key={index}
          className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: index < currentStep ? "100%" : index === currentStep ? "50%" : "0%"
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </motion.div>
      ))}
      <span className="text-sm font-medium text-muted-foreground ml-2">
        {currentStep + 1}/{totalSteps}
      </span>
    </div>
  )
}
