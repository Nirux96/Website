"use client"

import { useEffect, useState, useCallback } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, useGLTF, Html } from "@react-three/drei"
import { Suspense } from "react"
import { useToast } from "@/components/ui/toast"

// Add a new prop for the current view
interface ModelViewerProps {
  modelUrl?: string
  thumbnailUrl?: string
  status?: string
  progress?: number
  textureUrls?: Array<{
    base_color: string
    metallic: string
    roughness: string
    normal: string
  }> | null
  currentView?: string
  onLoadStart?: () => void
  onLoadEnd?: () => void
}

// Helper function to proxy URLs through our API
function getProxyUrl(url: string) {
  if (!url) return ""
  // Encode the URL to handle special characters
  const encodedUrl = encodeURIComponent(url)
  return `/api/proxy/model?url=${encodedUrl}`
}

// Update the Model component to support wireframe view
function Model({ url, wireframe = false }: { url: string; wireframe?: boolean }) {
  const [error, setError] = useState<string | null>(null)
  const { scene, errors } = useGLTF(url, undefined, (e) => {
    console.error("Error loading model:", e)
    setError("Failed to load 3D model. Please try again.")
  })
  const { camera } = useThree()

  useEffect(() => {
    // Reset camera position when model changes
    camera.position.set(2, 2, 2)
    camera.lookAt(0, 0, 0)
  }, [url, camera])

  // Check for errors from useGLTF
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      setError("Failed to load 3D model. Please try again.")
    }
  }, [errors])

  // Apply wireframe material if wireframe view is selected
  useEffect(() => {
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh) {
          if (wireframe) {
            child.material.wireframe = true
          } else {
            child.material.wireframe = false
          }
        }
      })
    }
  }, [scene, wireframe])

  if (error) {
    return (
      <Html center>
        <div className="bg-[#262626] p-4 rounded-md text-white text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-sm text-[#696969]">The model might be temporarily unavailable or still processing.</p>
        </div>
      </Html>
    )
  }

  return <primitive object={scene} />
}

function LoadingSpinner({ progress = 0 }) {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-[#d1afe4] border-[#3f3f3f] rounded-full animate-spin"></div>
        <div className="mt-4 text-white text-sm">{progress}% Complete</div>
      </div>
    </Html>
  )
}

// Update the ModelViewer function to accept the new props
export function ModelViewer({
  modelUrl,
  thumbnailUrl,
  status,
  progress = 0,
  textureUrls,
  currentView = "model",
  onLoadStart,
  onLoadEnd,
}: ModelViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const { addToast } = useToast()
  const [proxiedModelUrl, setProxiedModelUrl] = useState<string | undefined>(undefined)

  // Process the model URL through our proxy
  useEffect(() => {
    if (modelUrl) {
      setIsLoading(true)
      setLoadError(null)
      setProxiedModelUrl(getProxyUrl(modelUrl))
      onLoadStart?.()
    } else {
      setProxiedModelUrl(undefined)
    }
  }, [modelUrl, onLoadStart])

  // Handle model loading completion
  const handleModelLoaded = useCallback(() => {
    setIsLoading(false)
    onLoadEnd?.()
  }, [onLoadEnd])

  // Handle model loading error
  const handleModelError = useCallback(
    (error: Error) => {
      console.error("Error loading model:", error)
      setLoadError("Failed to load 3D model")
      setIsLoading(false)
      onLoadEnd?.()

      addToast({
        type: "error",
        title: "Model Loading Error",
        description: "There was a problem loading the 3D model. Please try again later.",
        duration: 5000,
      })
    },
    [addToast, onLoadEnd],
  )

  // Display texture map if a texture view is selected
  if (currentView !== "model" && currentView !== "wireframe" && textureUrls && textureUrls.length > 0) {
    const textureMap = textureUrls[0][currentView as keyof (typeof textureUrls)[0]] as string

    if (textureMap) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#181818]">
          <div className="relative max-w-[90%] max-h-[90%]">
            <img
              src={textureMap || "/placeholder.svg"}
              alt={`${currentView} texture map`}
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute bottom-4 left-4 bg-[#262626] px-3 py-1 rounded-md text-white text-sm">
              {currentView.replace("_", " ").charAt(0).toUpperCase() + currentView.replace("_", " ").slice(1)} Map
            </div>
          </div>
        </div>
      )
    }
  }

  if (!modelUrl && !thumbnailUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[#505050]">No model to display</p>
      </div>
    )
  }

  if (status === "PENDING" || status === "IN_PROGRESS") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-[#d1afe4] border-[#3f3f3f] rounded-full animate-spin"></div>
        <div className="mt-4 text-white text-sm">{progress}% Complete</div>
        {thumbnailUrl && status === "IN_PROGRESS" && progress > 50 && (
          <div className="mt-8">
            <img
              src={thumbnailUrl || "/placeholder.svg"}
              alt="Preview"
              className="max-w-[300px] max-h-[300px] object-contain rounded-md"
            />
          </div>
        )}
      </div>
    )
  }

  if (status === "FAILED") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">Generation Failed</p>
          <p className="text-[#505050]">Please try again with a different prompt</p>
        </div>
      </div>
    )
  }

  if (thumbnailUrl && !modelUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <img
          src={thumbnailUrl || "/placeholder.svg"}
          alt="Preview"
          className="max-w-[400px] max-h-[400px] object-contain rounded-md"
        />
        <p className="mt-4 text-white text-sm font-semibold">Preview Generated</p>
        <p className="text-[#d1afe4] text-sm mt-2">
          Click "Apply Textures" in the left sidebar to generate the final 3D model
        </p>
        <div className="mt-4 flex items-center">
          <div className="w-3 h-3 bg-[#c5f955] rounded-full mr-2"></div>
          <p className="text-[#c5f955] text-xs">Ready for texturing</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center bg-[#262626] p-6 rounded-lg max-w-md">
          <p className="text-red-400 text-lg mb-3">Model Loading Error</p>
          <p className="text-[#dedede] mb-4">{loadError}</p>
          <p className="text-[#696969] text-sm">
            The model might be temporarily unavailable or still processing. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full z-30">
      {proxiedModelUrl && (
        <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
          <Suspense fallback={<LoadingSpinner progress={progress} />}>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
            <pointLight position={[-10, -10, -10]} />
            <Model url={proxiedModelUrl} wireframe={currentView === "wireframe"} />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={1} maxDistance={10} />
            <Environment preset="studio" />
          </Suspense>
        </Canvas>
      )}

      {/* Only show this loader during initial loading, not when the Suspense is handling it */}
      {isLoading && proxiedModelUrl && !status}
    </div>
  )
}

