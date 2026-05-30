"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Shield, ArrowRight } from "lucide-react"
import Image from "next/image"

interface SuccessScreenProps {
  onDone: () => void
}

export function SuccessScreen({ onDone }: SuccessScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <motion.header
        className="flex items-center justify-center py-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Image
          src="/logo.svg"
          alt="iKYC Logo"
          width={100}
          height={40}
          className="h-10 w-auto"
        />
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Success Animation */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-20 h-20 text-primary" />
            </motion.div>
          </div>
          
          {/* Ripple effect */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/20"
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
          />
        </motion.div>

        {/* Success Message */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-foreground mb-3 text-balance">
            Verification Submitted Successfully
          </h1>
          <p className="text-muted-foreground text-balance leading-relaxed">
            Your documents have been submitted for verification. You will receive a notification once the process is complete.
          </p>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          className="w-full max-w-sm space-y-3 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Secure Processing</p>
              <p className="text-sm text-muted-foreground">Your data is encrypted and secure</p>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="text-sm text-foreground">
              <span className="font-semibold">Reference ID:</span>
              <span className="ml-2 font-mono text-primary">KYC-2024-{Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        className="px-6 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          onClick={onDone}
          className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg shadow-primary/25"
        >
          Done
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.footer>
    </div>
  )
}
