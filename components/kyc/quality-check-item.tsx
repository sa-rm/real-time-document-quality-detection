"use client"

import { motion } from "framer-motion"
import { Check, X, Loader2 } from "lucide-react"

interface QualityCheckItemProps {
  label: string
  status: "checking" | "passed" | "failed"
  delay?: number
}

export function QualityCheckItem({ label, status, delay = 0 }: QualityCheckItemProps) {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <motion.div
        className={`w-6 h-6 rounded-full flex items-center justify-center ${
          status === "passed"
            ? "bg-primary text-primary-foreground"
            : status === "failed"
            ? "bg-destructive text-destructive-foreground"
            : "bg-muted text-muted-foreground"
        }`}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {status === "checking" && <Loader2 className="w-4 h-4 animate-spin" />}
        {status === "passed" && <Check className="w-4 h-4" />}
        {status === "failed" && <X className="w-4 h-4" />}
      </motion.div>
      <span
        className={`text-sm font-medium ${
          status === "passed"
            ? "text-primary"
            : status === "failed"
            ? "text-destructive"
            : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </motion.div>
  )
}
