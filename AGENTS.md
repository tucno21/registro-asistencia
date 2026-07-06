# Registro Auxiliar — School Attendance Control App

## Tech Stack
- **React 19** + **TypeScript 6** (strict mode: `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`)
- **Vite 8** with `@vitejs/plugin-react`, `@tailwindcss/vite`, `@vitejs/plugin-basic-ssl`
- **TailwindCSS v4** — CSS-first config via `@theme` in `src/index.css`; NO `tailwind.config.js`
- **React Router v7** — `createBrowserRouter` from `react-router` (NOT `react-router-dom`), `RouterProvider` from `react-router/dom`
- **Zustand v5** — state management (stores in `src/store/`)
- **idb v8** — IndexedDB wrapper (DB in `src/db/`)
- **SheetJS (xlsx) v0.20.3** — installed from CDN `.tgz`, import as `import * as XLSX from 'xlsx'`
- **lucide-react** — icons
- **zustand** — state management

## Architecture

### Routes (`src/router/index.tsx`)
- `/login` — LoginPage
- `/` — ProtectedRoute > MainLayout
  - `index` → DashboardPage
  - `estudiantes` → EstudiantesPage
  - `grados-secciones` → GradosSeccionesPage (admin only, via RequireRoleRoute)
  - `tipos-registro` → TiposRegistroPage
  - `registro` → RegistroPage
  - `reportes` → ReportesPage
  - `respaldo` → RespaldoPage (admin only)

### Layout (`src/layouts/MainLayout.tsx`)
```
flex h-dvh overflow-hidden
├── NavDrawer (left sidebar, lg+: persistent, mobile: drawer)
└── flex-1 flex-col
    ├── TopBar (sticky, h-14)
    └── main (flex-1, overflow-y-auto)
```

### Navigation
- `NavDrawer.tsx` — unified sidebar: persistent on `lg:` breakpoint (1024px+), drawer with overlay on mobile. Menu button in TopBar is `lg:hidden`.
- Links use `NavLink` from `react-router` with `end` on `/`

### IndexedDB Schema (`src/db/index.ts`)
- DB_NAME: `registroAuxiliarDB`, DB_VERSION: 2
- Stores: `usuarios`, `estudiantes`, `gradosSecciones`, `tiposRegistro`, `registros`
- Upgrade handler: on v1→v2, clears `estudiantes` store (schema change from `nombres+apellidos` → `nombreCompleto`)
- `getDB()` singleton — reuse cached instance

### Repositories (`src/db/`)
- `estudiantesRepository.ts` — CRUD + batch create + duplicate code check
- `gradosSeccionesRepository.ts` — CRUD + getByName for duplicate validation
- `tiposRegistroRepository.ts` — CRUD
- `registrosRepository.ts` — queries by fecha/grado/estudiante, upsert
- `backupRepository.ts` — full JSON export/import

### Stores (`src/store/`)
- `authStore.ts` — login/logout/session restore. `SafeUser` type with `rol: 'admin' | 'docente'`, `gradosAsignados: string[]`. Session persisted in localStorage or sessionStorage.
- `estudiantesStore.ts` — estudiantes + grados CRUD, filters, import preview
- `tiposRegistroStore.ts` — tipos CRUD
- `toastStore.ts` — toast notifications (auto-dismiss 3.5s)
- `uiStore.ts` — sidebar open/close, loading state

### Data Types (`src/types/index.ts`)
- `Estudiante` — `nombreCompleto` (merged field), `codigo`, `gradoSeccionId`, `activo`
- `GradoSeccion` — `grado` (e.g. "1ro"), `seccion` (e.g. "A"), `nombre` (computed: "1ro A")
- `TipoRegistro` — `nombre`, `categorias: CategoriaOpcion[]`, `obligatorio`, `activo`
- `CategoriaOpcion` — `nombre`, `color: ColorCategoria` (success/warning/error/info/neutral)
- `Registro` — `estudianteId`, `tipoRegistroId`, `categoriaSeleccionada`, `fecha`, `gradoSeccionId`
- `Usuario` — `username`, `passwordHash` (SHA-256), `rol`, `gradosAsignados`

### Seed Data
- `src/db/seed.ts` — creates admin (admin@admin.com/admin) and docente (docente@docente.com/docente) users. Runs once (checks count > 0).
- `src/db/seedTiposRegistro.ts` — creates Asistencia (obligatorio), Uniforme, Cabello tipos. Guarded by `DESACTIVAR_SEED` flag.

### Component Library (`src/components/`)
- `Button` — variants: primary/secondary/danger/ghost; sizes: sm/md/lg; loading spinner, fullWidth
- `Card` — padding: none/sm/md/lg; border + shadow + rounded
- `Badge` — variants: success/warning/error/info/neutral
- `Spinner` — loading indicator with configurable size
- `EmptyState` — icon + title + description + optional action
- `ConfirmDialog` — modal with title, message (whitespace-pre-line), confirm/cancel
- `Toast` — fixed bottom-center notifications
- `Avatar` — initial-based colored circle
- `DataTable` — generic reusable table with search, filters, skeleton loading, responsive table/cards, professional paginator (page size selector, first/last, ellipsis)
- `EstudianteForm` — centered modal with codigo (numeric only), nombreCompleto (Apellidos, Nombres format validation), grado select (sorted)
- `ExcelImport` — multi-step import (upload > preview > result) with row-level validation
- `GradoSeccionForm` — centered modal for create/edit grades
- `TipoRegistroForm` — centered modal with category management
- `ProtectedRoute` — checks auth, shows spinner while loading, redirects to /login
- `RequireRoleRoute` — checks user role, redirects unauthorized users
- `NavDrawer` — sidebar navigation, admin section for admin-only routes
- `TopBar` — menu button (lg:hidden), dynamic title based on route

## Naming Convention
- Format: `"Apellidos, Nombres"` (e.g. "García Pérez, Juan Carlos")
- At least 2 apellidos before comma, at least 1 nombre after
- `codigo` is numeric (DNI), unique per active student

## Key Rules & Conventions
- **No comments in code** — clean code only
- **No emojis** unless explicitly requested
- **All imports**: named imports for components, `import * as XLSX from 'xlsx'`
- **Module imports**: `react-router` (NOT `react-router-dom`), `react-router/dom` only for `RouterProvider`
- **TailwindCSS v4**: `@import "tailwindcss"` in CSS, `@theme` block for design tokens, `@utility` for custom utilities. No `tailwind.config.js`.
- **Design principle**: "Color con propósito" — color only for selected state or alerts
- **Mobile-first**: touch targets ≥ 44px, responsive breakpoints
- **HTTPS required** for mobile dev (`crypto.subtle`, `crypto.randomUUID()` need secure context) — solved via `@vitejs/plugin-basic-ssl`. Dev command: `npm run dev` (runs `vite --host`).
- **IndexedDB**: auto-commits when event loop returns; never open a second transaction while another is active (deadlock risk)
- **`estudiantesFiltrados()`** is synchronous store method — do NOT wrap in `useMemo` with function reference as dependency
- **Grado format**: `formatGrado()` converts "1" → "1ro", `unformatGrado()` extracts number from "1ro A"

## Pages
- `LoginPage` — redirects docentes to `/registro`, admins to `/` on login
- `DashboardPage` — overview with counts and charts
- `RegistroPage` — daily attendance recording with category initial buttons, per-tipo mark-all toggle, abbreviated names, horizontal scroll table
- `EstudiantesPage` — CRUD with DataTable, sorted by grado→seccion→nombre, search/filter, import/export
- `GradosSeccionesPage` — CRUD with duplicate validation, student count warning on delete
- `TiposRegistroPage` — CRUD with category colors
- `ReportesPage` — two tabs: "Por Estudiante" (searchable with dropdown, historial grouped by date with tipo columns) and "Por Sección" (grado + tipo filter, student × date matrix)
- `RespaldoPage` — JSON/Excel export, JSON import (admin only)

## Common Pitfalls
- `crypto.subtle` and `crypto.randomUUID()` fail on HTTP → app shows blank screen. Fixed with `basicSsl()` plugin.
- `Navigate` is NOT exported from `react-router`; use `useNavigate` hook instead.
- `Download` icon from lucide-react may conflict with HTML download attribute — always use `Download` as component.
