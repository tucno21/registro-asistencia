import { Outlet } from 'react-router'
import TopBar from '../components/TopBar'
import NavDrawer from '../components/NavDrawer'
import Toast from '../components/Toast'

const MainLayout = () => {
  return (
    <div className="flex min-h-dvh">
      <NavDrawer />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <main className="flex-1 px-4 py-4 md:py-6">
          <Outlet />
        </main>
      </div>

      <Toast />
    </div>
  )
}

export default MainLayout
