import { createBrowserRouter } from 'react-router'
import MainLayout from '../layouts/MainLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import RequireRoleRoute from '../components/RequireRoleRoute'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import EstudiantesPage from '../pages/EstudiantesPage'
import GradosSeccionesPage from '../pages/GradosSeccionesPage'
import TiposRegistroPage from '../pages/TiposRegistroPage'
import RegistroPage from '../pages/RegistroPage'
import ReportesPage from '../pages/ReportesPage'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'estudiantes', element: <EstudiantesPage /> },
          {
            path: 'grados-secciones',
            element: (
              <RequireRoleRoute roles={['admin']}>
                <GradosSeccionesPage />
              </RequireRoleRoute>
            ),
          },
          { path: 'tipos-registro', element: <TiposRegistroPage /> },
          { path: 'registro', element: <RegistroPage /> },
          { path: 'reportes', element: <ReportesPage /> },
        ],
      },
    ],
  },
])

export default router
