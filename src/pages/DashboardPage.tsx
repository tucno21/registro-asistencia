import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ClipboardCheck,
  Users,
  BarChart3,
  GraduationCap,
  ListChecks,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useEstudiantesStore } from '../store/estudiantesStore'
import { getRegistrosByFecha } from '../db/registrosRepository'
import type { Registro } from '../types'
import Spinner from '../components/Spinner'

const hoy = () => new Date().toISOString().split('T')[0]

interface SeccionStatus {
  id: string
  nombre: string
  completado: boolean
  parcial: boolean
  totalEstudiantes: number
  registrados: number
}

const DashboardPage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { grados, estudiantes, loadAll } = useEstudiantesStore()
  const [loading, setLoading] = useState(true)
  const [secciones, setSecciones] = useState<SeccionStatus[]>([])
  const [, setHoyRegistros] = useState<Registro[]>([])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await loadAll()
      const r = await getRegistrosByFecha(hoy())
      setHoyRegistros(r)

      const gradosFiltrados = grados.filter((g) => {
        if (!g.activo) return false
        if (user?.rol === 'docente' && user.gradosAsignados.length > 0) {
          return user.gradosAsignados.includes(g.id)
        }
        return true
      })

      const statuses: SeccionStatus[] = gradosFiltrados.map((g) => {
        const ests = estudiantes.filter(
          (e) => e.activo && e.gradoSeccionId === g.id,
        )
        const regs = r.filter((x) => x.gradoSeccionId === g.id)
        const estudiantesUnicos = new Set(regs.map((x) => x.estudianteId)).size
        const completado = ests.length > 0 && estudiantesUnicos >= ests.length
        const parcial = !completado && estudiantesUnicos > 0
        return {
          id: g.id,
          nombre: g.nombre,
          completado,
          parcial,
          totalEstudiantes: ests.length,
          registrados: estudiantesUnicos,
        }
      })

      setSecciones(statuses)
      setLoading(false)
    }
    init()
  }, [])

  const totalEstudiantes = estudiantes.filter((e) => e.activo).length
  const totalSecciones = grados.filter((g) => g.activo).length
  const pendientes = secciones.filter((s) => !s.completado).length

  const totalRegistrados = secciones.reduce((sum, s) => sum + s.registrados, 0)
  const totalCapacidad = secciones.reduce(
    (sum, s) => sum + s.totalEstudiantes,
    0,
  )
  const pctAsistencia =
    totalCapacidad > 0 ? Math.round((totalRegistrados / totalCapacidad) * 100) : 0

  const hora = new Date().getHours()
  const saludo =
    hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const rolLabel = user?.rol === 'admin' ? 'Administrador' : 'Docente'
  const fechaStr = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={28} />
      </div>
    )
  }

  const kpis = [
    {
      icon: Users,
      value: totalEstudiantes,
      label: 'Estudiantes activos',
      iconBg: 'bg-info-bg',
      iconColor: 'text-info',
    },
    {
      icon: GraduationCap,
      value: totalSecciones,
      label: 'Secciones activas',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      icon: TrendingUp,
      value: `${pctAsistencia}%`,
      label: 'Asistencia de hoy',
      iconBg:
        pctAsistencia >= 80
          ? 'bg-success-bg'
          : pctAsistencia >= 50
            ? 'bg-warning-bg'
            : 'bg-error-bg',
      iconColor:
        pctAsistencia >= 80
          ? 'text-success'
          : pctAsistencia >= 50
            ? 'text-warning'
            : 'text-error',
    },
    {
      icon: AlertCircle,
      value: pendientes,
      label: 'Secciones pendientes',
      iconBg: pendientes > 0 ? 'bg-warning-bg' : 'bg-success-bg',
      iconColor: pendientes > 0 ? 'text-warning' : 'text-success',
    },
  ]

  const quickActions = [
    {
      icon: ClipboardCheck,
      label: 'Registrar hoy',
      to: '/registro',
      iconBg: 'bg-primary',
      iconColor: 'text-primary-foreground',
    },
    {
      icon: Users,
      label: 'Estudiantes',
      to: '/estudiantes',
      iconBg: 'bg-info-bg',
      iconColor: 'text-info',
    },
    {
      icon: BarChart3,
      label: 'Reportes',
      to: '/reportes',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    ...(user?.rol === 'admin'
      ? [
          {
            icon: ListChecks,
            label: 'Tipos de Registro',
            to: '/tipos-registro',
            iconBg: 'bg-warning-bg',
            iconColor: 'text-warning',
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* ===== 1. Hero greeting ===== */}
      <div className="overflow-hidden rounded-card bg-gradient-to-br from-primary to-primary-hover p-5 text-primary-foreground">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm opacity-80">{saludo},</p>
            <h2 className="truncate text-2xl font-bold">
              {user?.nombre ?? 'Usuario'}
            </h2>
            <p className="mt-1 text-sm capitalize opacity-80">{fechaStr}</p>
          </div>
          <span className="flex-shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            {rolLabel}
          </span>
        </div>
        {secciones.length > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
            {pendientes > 0 ? (
              <>
                <Clock className="h-4 w-4 flex-shrink-0 opacity-90" />
                <p className="text-sm opacity-90">
                  {pendientes} sección{pendientes !== 1 ? 'es' : ''}{' '}
                  {pendientes !== 1 ? 'pendientes' : 'pendiente'} de{' '}
                  {secciones.length}
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 opacity-90" />
                <p className="text-sm opacity-90">
                  ¡Todo listo! Has completado todas las secciones de hoy
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ===== 2. KPI cards ===== */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k, i) => {
          const Icon = k.icon
          return (
            <div
              key={i}
              className="rounded-card border border-border bg-surface p-4"
            >
              <span
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${k.iconBg} ${k.iconColor}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-2xl font-bold leading-none text-text-primary">
                {k.value}
              </p>
              <p className="mt-1.5 text-xs text-text-muted">{k.label}</p>
            </div>
          )
        })}
      </div>

      {/* ===== 3. Section status grid ===== */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-text-primary">
          Estado de secciones
        </h3>

        {secciones.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface py-10 text-center">
            <GraduationCap className="h-8 w-8 text-text-muted/40" />
            <p className="text-sm text-text-muted">
              No hay secciones{' '}
              {user?.rol === 'docente' ? 'asignadas' : 'activas'}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {secciones.map((s) => {
              const pct =
                s.totalEstudiantes > 0
                  ? Math.round(
                      (s.registrados / s.totalEstudiantes) * 100,
                    )
                  : 0

              const StatusIcon = s.completado
                ? CheckCircle2
                : s.parcial
                  ? Clock
                  : XCircle
              const iconColor = s.completado
                ? 'text-success'
                : s.parcial
                  ? 'text-warning'
                  : 'text-error'
              const badgeBg = s.completado
                ? 'bg-success-bg text-success'
                : s.parcial
                  ? 'bg-warning-bg text-warning'
                  : 'bg-error-bg text-error'
              const badgeLabel = s.completado
                ? 'Completo'
                : s.parcial
                  ? 'Parcial'
                  : 'Pendiente'
              const barColor = s.completado
                ? 'bg-success'
                : s.parcial
                  ? 'bg-warning'
                  : 'bg-error'

              return (
                <div
                  key={s.id}
                  className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
                >
                  {/* Status row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <StatusIcon
                        className={`h-4 w-4 flex-shrink-0 ${iconColor}`}
                      />
                      <span className="truncate text-sm font-semibold text-text-primary">
                        {s.nombre}
                      </span>
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${badgeBg}`}
                    >
                      {badgeLabel}
                    </span>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs text-text-muted">
                      <span>
                        {s.registrados}/{s.totalEstudiantes} estudiantes
                      </span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-alt">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Action button */}
                  <button
                    onClick={() => navigate('/registro')}
                    className="flex items-center justify-center gap-2 rounded-button bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Registrar
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ===== 4. Quick actions ===== */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-text-primary">
          Accesos rápidos
        </h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickActions.map((a) => {
            const Icon = a.icon
            return (
              <button
                key={a.to}
                onClick={() => navigate(a.to)}
                className="group flex items-center gap-3 rounded-card border border-border bg-surface p-4 transition-all hover:border-primary hover:shadow-card active:scale-95"
              >
                <span
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${a.iconBg} ${a.iconColor} transition-transform group-hover:scale-105`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 text-sm font-semibold text-text-primary">
                  {a.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
