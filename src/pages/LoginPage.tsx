import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ClipboardCheck, Eye, EyeOff } from 'lucide-react'
import { useAuthStore, getSavedCredentials } from '../store/authStore'
import { useSyncStore } from '../store/syncStore'
import Button from '../components/Button'
import Card from '../components/Card'

const LoginPage = () => {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = getSavedCredentials()
    if (saved) {
      setEmail(saved.email)
      setPassword(saved.password)
      setRemember(true)
    }
  }, [])

  if (isAuthenticated) {
    const user = useAuthStore.getState().user
    navigate(user?.rol === 'docente' ? '/registro' : '/', { replace: true })
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos')
      return
    }

    setLoading(true)
    const result = await login(email.trim(), password, remember)
    setLoading(false)

    if (result.success) {
      const user = useAuthStore.getState().user
      if (user?.rol === 'docente' && navigator.onLine) {
        const { scriptUrl, syncNow } = useSyncStore.getState()
        if (scriptUrl) syncNow()
      }
      navigate(user?.rol === 'docente' ? '/registro' : '/', { replace: true })
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-gradient-to-b from-primary to-primary-hover px-4 py-10">
      <div className="flex flex-col items-center gap-1.5 text-primary-foreground">
        <ClipboardCheck className="h-12 w-12" />
        <h1 className="text-2xl font-bold">Registro Auxiliar</h1>
        <p className="text-sm opacity-80">Control de asistencia escolar</p>
      </div>

      <Card padding="lg" className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-text-secondary"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ej: admin@admin.com"
              className="h-11 w-full rounded-input border border-border bg-surface px-3 text-base text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-text-secondary"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-input border border-border bg-surface pl-3 pr-10 text-base text-text-primary placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:text-text-secondary"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <span className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="peer sr-only"
              />
              <span
                className={
                  'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ' +
                  (remember
                    ? 'border-primary bg-primary'
                    : 'border-border bg-surface')
                }
              >
                {remember && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </span>
            <span className="text-sm text-text-secondary">Recordarme</span>
          </label>

          {error && (
            <p className="rounded-md bg-error-bg px-3 py-2 text-sm text-error">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
      </Card>

      <p className="text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} Carlos Tucno · DEV
      </p>
    </div>
  )
}

export default LoginPage
