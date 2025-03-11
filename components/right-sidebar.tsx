"use client"

import { Camera, Circle, Monitor, Grid, Sun, Cloud, CornerUpRight, Download } from "lucide-react"

interface RightSidebarProps {
  selectedTask?: {
    mode: "preview" | "refine"
    texture_urls?: Array<{
      base_color: string
      metallic: string
      roughness: string
      normal: string
    }> | null
  } | null
  onViewChange?: (view: string) => void
  currentView: string
}

export function RightSidebar({ selectedTask, onViewChange, currentView = "model" }: RightSidebarProps) {
  // Check if the selected task has textures
  const hasTextures =
    selectedTask?.mode === "refine" && selectedTask?.texture_urls && selectedTask.texture_urls.length > 0

  return (
    <div className="fixed right-[30px] !h-[386px] top-[100px] bottom-0 w-[60px] h-auto border-[#3F3F3F] border-solid border rounded-[16px] !bg-transparent flex flex-col items-center py-2">
      {/* Top section */}
      <div className="flex flex-col items-center gap-1">
        <button
          className={`p-2 ${currentView === "model" ? "text-white" : "text-[#666666]"} rounded-md hover:text-white transition-colors`}
          title="3D Model View"
          onClick={() => onViewChange?.("model")}
        >
          <Camera className="h-5 w-5" />
        </button>
        <button
          className={`p-2 ${currentView === "wireframe" ? "text-white" : "text-[#666666]"} rounded-md hover:text-white transition-colors`}
          title="Wireframe View"
          onClick={() => onViewChange?.("wireframe")}
        >
          <Circle className="h-5 w-5" />
        </button>
      </div>

      {/* Divider */}
      <div className="my-2 w-6 h-[4px] rounded-[20%] !bg-[#3F3F3F]" />

      {/* Middle section - Texture maps */}
      <div className="flex flex-col items-center gap-1">
        <button
          className={`p-2 ${currentView === "base_color" ? "text-white" : "text-[#666666]"} rounded-md hover:text-white transition-colors ${!hasTextures ? "opacity-50 cursor-not-allowed" : ""}`}
          title="Base Color Texture"
          onClick={() => hasTextures && onViewChange?.("base_color")}
          disabled={!hasTextures}
        >
          <Monitor className="h-5 w-5" />
        </button>
        <button
          className={`p-2 ${currentView === "normal" ? "text-white" : "text-[#666666]"} rounded-md hover:text-white transition-colors ${!hasTextures ? "opacity-50 cursor-not-allowed" : ""}`}
          title="Normal Map"
          onClick={() => hasTextures && onViewChange?.("normal")}
          disabled={!hasTextures}
        >
          <Grid className="h-5 w-5" />
        </button>
        <button
          className={`p-2 ${currentView === "metallic" ? "text-white" : "text-[#666666]"} rounded-md hover:text-white transition-colors ${!hasTextures ? "opacity-50 cursor-not-allowed" : ""}`}
          title="Metallic Map"
          onClick={() => hasTextures && onViewChange?.("metallic")}
          disabled={!hasTextures}
        >
          <Sun className="h-5 w-5" />
        </button>
        <button
          className={`p-2 ${currentView === "roughness" ? "text-white" : "text-[#666666]"} rounded-md hover:text-white transition-colors ${!hasTextures ? "opacity-50 cursor-not-allowed" : ""}`}
          title="Roughness Map"
          onClick={() => hasTextures && onViewChange?.("roughness")}
          disabled={!hasTextures}
        >
          <Cloud className="h-5 w-5" />
        </button>
      </div>

      {/* Divider */}
      <div className="my-2 w-6 h-[4px] rounded-[20%] bg-[#3F3F3F]" />

      {/* Bottom section */}
      <div className="flex flex-col items-center gap-1">
        <button className="p-2 text-[#666666] rounded-md hover:text-white transition-colors" title="Return">
          <CornerUpRight className="h-5 w-5" />
        </button>
      </div>

      {/* Download button at bottom */}
      <div className="my-4">
        <button
          className="p-2 bg-[#561E69] text-white rounded-md hover:bg-[#6B2583] transition-colors"
          title="Download"
        >
          <Download className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

