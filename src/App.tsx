import { Routes, Route, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import ItemDetailPage from './pages/ItemDetailPage'
import RatePage from './pages/RatePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'
import AdminPage from './pages/AdminPage'

function App() {
  const { pathname } = useLocation()
  const isFullscreen = pathname === '/login' || /^\/item\/[^/]+\/rate$/.test(pathname)

  return (
    <>
      {/* pb-24 reserves comfortable space for the fixed bottom nav (h-14 + safe area), only when bottom nav is active */}
      <div className={`w-full flex-1 flex flex-col items-center ${isFullscreen ? '' : 'pb-24'}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/item/:id" element={<ItemDetailPage />} />
          <Route path="/item/:id/rate" element={<RatePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
      <BottomNav />
    </>
  )
}

export default App
