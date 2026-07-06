# Registro Auxiliar

Sistema de control de asistencia escolar offline-first. Funciona 100% en el navegador sin necesidad de servidor.

## Tecnologías

- React 19 + TypeScript 6
- Vite 8
- TailwindCSS v4
- React Router v7
- Zustand v5
- IndexedDB (via idb)
- SheetJS (xlsx)

## Requisitos

- Node.js 20+
- npm 10+

## Instalación

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm run dev
```

Abre `https://localhost:5173` en el navegador. El certificado SSL es auto-firmado.

## Usuarios por defecto

| Rol      | Email              | Contraseña |
|----------|--------------------|------------|
| Admin    | admin@admin.com    | admin      |
| Docente  | docente@docente.com | docente    |

## Funcionalidades

- **Autenticación** — login con sesión persistente (recordar o no recordar)
- **Dashboard** — resumen de estudiantes, registros y tipos de registro
- **Registro diario** — toma de asistencia por grado/sección con categorías por tipo de registro
- **Estudiantes** — CRUD, importación desde Excel, exportación
- **Grados y Secciones** — CRUD con validación de duplicados
- **Tipos de Registro** — CRUD con categorías personalizables (Presente/Tardanza/Ausente, etc.)
- **Reportes** — historial por estudiante (columnas por tipo de registro) y matriz por sección (fechas × estudiantes)
- **Respaldo** — exportación/importación JSON y exportación Excel completa (admin)

## Estructura

```
src/
├── components/   # Componentes reutilizables
├── db/           # IndexedDB (schema, repositorios, seed)
├── layouts/      # Layout principal con sidebar y topbar
├── lib/           # Utilidades (crypto, formato de grados)
├── pages/        # Páginas de la aplicación
├── router/       # Configuración de rutas
├── store/        # Zustand stores
└── types/        # Tipos TypeScript
```

## Licencia

MIT
