export interface CategoriaOpcion {
  id: string
  nombre: string
  color: ColorCategoria
  orden: number
}

export interface TipoRegistroFormData {
  nombre: string
  descripcion: string
  obligatorio: boolean
  categorias: CategoriaOpcion[]
}

export type ColorCategoria = 'success' | 'warning' | 'error' | 'info' | 'neutral'

export const COLORES_CATEGORIA: { value: ColorCategoria; label: string }[] = [
  { value: 'success', label: 'Verde' },
  { value: 'warning', label: 'Ámbar' },
  { value: 'error', label: 'Rojo' },
  { value: 'info', label: 'Azul' },
  { value: 'neutral', label: 'Gris' },
]

export interface Estudiante {
  id: string
  codigo: string
  nombreCompleto: string
  gradoSeccionId: string
  activo: boolean
  fechaCreacion: string
}

export interface EstudianteFormData {
  codigo: string
  nombreCompleto: string
  gradoSeccionId: string
}

export interface GradoSeccionFormData {
  grado: string
  seccion: string
}

export interface FiltrosEstudiantes {
  busqueda: string
  gradoSeccionId: string
  activo: 'todos' | 'activos' | 'inactivos'
}

export interface FilaImportacion {
  rowIndex: number
  nombreCompleto: string
  codigo: string
  grado: string
  seccion: string
  valida: boolean
  errores: string[]
  gradoSeccionId?: string
}

export interface GradoSeccion {
  id: string
  grado: string
  seccion: string
  nombre: string
  activo: boolean
}

export interface TipoRegistro {
  id: string
  nombre: string
  descripcion: string
  categorias: CategoriaOpcion[]
  activo: boolean
  orden: number
  obligatorio: boolean
}

export interface Registro {
  id: string
  estudianteId: string
  tipoRegistroId: string
  categoriaSeleccionada: string
  fecha: string
  gradoSeccionId: string
  registradoPor: string
  fechaCreacion: string
}

export type RolUsuario = 'admin' | 'docente'

export interface Usuario {
  id: string
  nombre: string
  username: string
  passwordHash: string
  rol: RolUsuario
  gradosAsignados: string[]
  activo: boolean
}
