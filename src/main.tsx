import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { seedUsers } from './db/seed'
import { seedTiposRegistro } from './db/seedTiposRegistro'
import { useAuthStore } from './store/authStore'
import { useSyncStore } from './store/syncStore'
import { useConnectionStore } from './store/connectionStore'
import router from './router'
import './index.css'

seedUsers()
seedTiposRegistro()
useAuthStore.getState().restoreSession()
useSyncStore.getState().restoreConfig()
useConnectionStore.getState().init()

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
