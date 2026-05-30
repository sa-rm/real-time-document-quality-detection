"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProgressIndicator } from "./progress-indicator"
import {
  ArrowLeft,
  Check,
  FileText,
  Shield,
  ScanLine,
  Pencil,
} from "lucide-react"

interface FinalReviewScreenProps {
  step: number
  totalSteps: number
  frontImage: string
  backImage: string
  onSubmit: () => void
  onBack: () => void
}

interface ExtractedData {
  citizenshipNumber: string
  fullName: string
  dateOfBirth: string
  address: string
}

export function FinalReviewScreen({ step, totalSteps, frontImage, backImage, onSubmit, onBack }: FinalReviewScreenProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    citizenshipNumber: "52-01-79-04630",
    fullName: "PABITRA GIRI",
    dateOfBirth: "2061-07-26",
    address: "Ghorahi Sub-Metropolitan City, Ward No. 18, Dang",
  })

  const statusItems = [
    { icon: ScanLine, label: "OCR Extraction Complete", status: "complete" },
    { icon: Shield, label: "Quality Verification Complete", status: "complete" },
    { icon: FileText, label: "Document Validation Complete", status: "complete" },
  ]

  const handleFieldChange = (field: keyof ExtractedData, value: string) => {
    setExtractedData((prev) => ({ ...prev, [field]: value }))
  }

  // Check if images are real captured images or placeholders
  const isFrontReal = frontImage && !frontImage.includes("placeholder")
  const isBackReal = backImage && !backImage.includes("placeholder")

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <ProgressIndicator currentStep={step} totalSteps={totalSteps} />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Final Review</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Verify your extracted information
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-4 overflow-y-auto">
        {/* Document Thumbnails */}
        <motion.div
          className="flex gap-3 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex-1 aspect-[1.58/1] bg-card rounded-xl border border-border overflow-hidden relative">
            {isFrontReal ? (
              <img 
                src={frontImage} 
                alt="Front of document" 
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(1)" }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-muted">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/40 mb-1">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="9" cy="11" r="2" />
                  <line x1="14" y1="9" x2="19" y2="9" />
                </svg>
                <span className="text-xs text-muted-foreground">Front</span>
              </div>
            )}
            <motion.div
              className="absolute top-2 right-2 bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Check className="w-3 h-3" />
            </motion.div>
          </div>
          <div className="flex-1 aspect-[1.58/1] bg-card rounded-xl border border-border overflow-hidden relative">
            {isBackReal ? (
              <img 
                src={backImage} 
                alt="Back of document" 
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(1)" }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-muted">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/40 mb-1">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="5" y1="9" x2="19" y2="9" />
                  <line x1="5" y1="13" x2="15" y2="13" />
                </svg>
                <span className="text-xs text-muted-foreground">Back</span>
              </div>
            )}
            <motion.div
              className="absolute top-2 right-2 bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Check className="w-3 h-3" />
            </motion.div>
          </div>
        </motion.div>

        {/* Status Cards */}
        <motion.div
          className="space-y-2 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {statusItems.map((item, index) => (
            <motion.div
              key={item.label}
              className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground flex-1">
                {item.label}
              </span>
              <Check className="w-4 h-4 text-primary" />
            </motion.div>
          ))}
        </motion.div>

        {/* Extracted Information */}
        <motion.div
          className="bg-card rounded-2xl border border-border p-5 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Extracted Information
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="text-primary hover:text-primary/80 -mr-2"
            >
              <Pencil className="w-4 h-4 mr-1" />
              {isEditing ? "Done" : "Edit"}
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">
                Citizenship Number
              </label>
              {isEditing ? (
                <Input
                  value={extractedData.citizenshipNumber}
                  onChange={(e) => handleFieldChange("citizenshipNumber", e.target.value)}
                  className="h-11 rounded-xl"
                />
              ) : (
                <p className="text-sm font-medium text-foreground p-3 bg-muted/50 rounded-xl">
                  {extractedData.citizenshipNumber}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">
                Full Name
              </label>
              {isEditing ? (
                <Input
                  value={extractedData.fullName}
                  onChange={(e) => handleFieldChange("fullName", e.target.value)}
                  className="h-11 rounded-xl"
                />
              ) : (
                <p className="text-sm font-medium text-foreground p-3 bg-muted/50 rounded-xl">
                  {extractedData.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">
                Date of Birth
              </label>
              {isEditing ? (
                <Input
                  type="date"
                  value={extractedData.dateOfBirth}
                  onChange={(e) => handleFieldChange("dateOfBirth", e.target.value)}
                  className="h-11 rounded-xl"
                />
              ) : (
                <p className="text-sm font-medium text-foreground p-3 bg-muted/50 rounded-xl">
                  {new Date(extractedData.dateOfBirth).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">
                Address
              </label>
              {isEditing ? (
                <Input
                  value={extractedData.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  className="h-11 rounded-xl"
                />
              ) : (
                <p className="text-sm font-medium text-foreground p-3 bg-muted/50 rounded-xl">
                  {extractedData.address}
                </p>
              )}
            </div>
          </div>
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
          onClick={onSubmit}
          className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg shadow-primary/25"
        >
          Submit Verification
        </Button>
      </motion.footer>
    </div>
  )
}
