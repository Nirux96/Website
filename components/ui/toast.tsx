"use client"

import * as React from "react"
import { Check, X, AlertCircle, Info } from "lucide-react"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  type?: "success" | "error" | "info" | "default"
  duration?: number
}

const ToastContext = React.createContext<{
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, "id">) => void
  removeToast: (id: string) => void
}>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = React.useCallback((toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, ...toast }])

    if (toast.duration !== Number.POSITIVE_INFINITY) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, toast.duration || 3000)
    }
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(" ")
}

function Toast({ id, title, description, action, type = "default", onClose }: ToastProps & { onClose: () => void }) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const getIcon = () => {
    switch (type) {
      case "success":
        return <Check className="h-4 w-4 text-[#c5f955]" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "info":
        return <Info className="h-4 w-4 text-[#6c99f2]" />
      default:
        return null
    }
  }

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-[#262626] border-l-[#c5f955]"
      case "error":
        return "bg-[#262626] border-l-red-500"
      case "info":
        return "bg-[#262626] border-l-[#6c99f2]"
      default:
        return "bg-[#262626] border-l-[#3f3f3f]"
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border border-[#3f3f3f] border-l-4 p-4 shadow-lg pointer-events-auto transition-all duration-300 transform",
        getBgColor(),
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
      )}
    >
      {getIcon()}
      <div className="flex-1">
        {title && <div className="font-medium text-white">{title}</div>}
        {description && <div className="text-sm text-[#dedede]">{description}</div>}
      </div>
      {action}
      <button onClick={onClose} className="text-[#505050] hover:text-white transition-colors" aria-label="Close toast">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

