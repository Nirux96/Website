"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { useToast } from "@/components/ui/toast"

interface CopyButtonProps {
  text: string
  className?: string
  showLabel?: boolean
  label?: string
  successMessage?: string
}

export function CopyButton({
  text,
  className = "",
  showLabel = false,
  label = "Copy",
  successMessage = "Copied to clipboard!",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const { addToast } = useToast()

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)

    addToast({
      type: "success",
      title: successMessage,
      duration: 2000,
    })

    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      className={`inline-flex items-center gap-1.5 ${className}`}
      onClick={copyToClipboard}
      title="Copy to clipboard"
    >
      {showLabel && <span>{label}</span>}
      {copied ? <Check className="h-4 w-4 text-[#c5f955]" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}

