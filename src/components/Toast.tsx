import { CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react'
import { useToastStore } from '../store/toastStore'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
}

const bgClasses = {
  success: 'bg-success text-success-foreground',
  error: 'bg-error text-error-foreground',
  warning: 'bg-warning text-warning-foreground',
}

const Toast = () => {
  const { message, type, visible, hide } = useToastStore()

  if (!visible) return null

  const Icon = icons[type]

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] animate-slide-up md:bottom-6 md:left-auto md:right-6 md:w-96">
      <div
        className={`flex items-center gap-3 rounded-card px-4 py-3 shadow-card ${bgClasses[type]}`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={hide}
          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast
