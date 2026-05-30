"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Shield, Scan, Clock, Lock } from "lucide-react"
import Image from "next/image"

interface WelcomeScreenProps {
  onStart: () => void
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const features = [
    { icon: Shield, label: "Bank-grade security" },
    { icon: Scan, label: "Real-time verification" },
    { icon: Clock, label: "Complete in minutes" },
    { icon: Lock, label: "Data privacy guaranteed" },
  ]

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
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Illustration */}
        <motion.div
          className="relative w-64 h-64 mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full" />
          <div className="absolute inset-4 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="relative"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Document Icon */}
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="text-primary">
                <rect x="25" y="15" width="70" height="90" rx="8" stroke="currentColor" strokeWidth="3" fill="white" />
                <rect x="35" y="30" width="30" height="30" rx="4" fill="#E8F5E9" stroke="currentColor" strokeWidth="2" />
                <circle cx="50" cy="42" r="8" fill="currentColor" fillOpacity="0.3" />
                <rect x="35" y="70" width="50" height="4" rx="2" fill="currentColor" fillOpacity="0.4" />
                <rect x="35" y="80" width="40" height="4" rx="2" fill="currentColor" fillOpacity="0.3" />
                <rect x="35" y="90" width="35" height="4" rx="2" fill="currentColor" fillOpacity="0.2" />
                {/* Scan line animation */}
                <motion.rect
                  x="30"
                  y="25"
                  width="60"
                  height="2"
                  rx="1"
                  fill="currentColor"
                  animate={{ y: [25, 95, 25] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </svg>
              {/* Check badge */}
              <motion.div
                className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 500 }}
              >
                <Shield className="w-6 h-6 text-primary-foreground" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-foreground mb-2 text-balance">
            Real-Time KYC Verification
          </h1>
          <p className="text-muted-foreground text-balance">
            Verify your identity securely in minutes
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          className="grid grid-cols-2 gap-4 mb-10 w-full max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.label}
              className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <feature.icon className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-foreground">{feature.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        className="px-6 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          onClick={onStart}
          className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
        >
          Start Verification
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.footer>
    </div>
  )
}
