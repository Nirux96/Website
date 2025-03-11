"use client"

import { useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { LeftSidebar } from "@/components/left-sidebar"
import { MainContent } from "@/components/main-content"
import { useToast } from "@/components/ui/toast"

export default function OmniInterface() {
  const { addToast } = useToast()

  useEffect(() => {
    // Check if API key is set
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/check-api-key")

        if (!response.ok) {
          console.error("Failed to check API key status")
          return
        }

        const data = await response.json()

        if (!data.isSet) {
          addToast({
            type: "info",
            title: "API Key Required",
            description: "Please set your Meshy API key in the environment variables to use the Text to 3D feature.",
            duration: 10000,
          })
        }
      } catch (error) {
        console.error("Error checking API key:", error)
      }
    }

    checkApiKey()
  }, [addToast])

  return (
    <div className="flex flex-col h-screen bg-[#160422]">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <MainContent />
        {/* RightSidebar is now rendered inside MainContent */}
      </div>
    </div>
  )
}

