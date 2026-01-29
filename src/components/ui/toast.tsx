"use client"

import { useToastStore, ToastType } from "@/stores/toastStore"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
}

const styles: Record<ToastType, string> = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg animate-in slide-in-from-right-5",
            styles[toast.type]
          )}
        >
          {icons[toast.type]}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
