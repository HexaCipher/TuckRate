import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ItemDetailPage from './pages/ItemDetailPage'
import RatePage from './pages/RatePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/item/:id" element={<ItemDetailPage />} />
      <Route path="/item/:id/rate" element={<RatePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}

export default App
