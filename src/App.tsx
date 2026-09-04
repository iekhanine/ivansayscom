import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DirectoryPage from './pages/DirectoryPage'
import AboutPage from './pages/AboutPage'
import PhilosophyPage from './pages/PhilosophyPage'
import JournalPage from './pages/JournalPage'
import JournalEntryPage from './pages/JournalEntryPage'
import ReviewPanelPage from './pages/ReviewPanelPage'
import ApplyPage from './pages/ApplyPage'
import NominatePage from './pages/NominatePage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/directory" element={<DirectoryPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/philosophy" element={<PhilosophyPage />} />
      <Route path="/review-panel" element={<ReviewPanelPage />} />
      <Route path="/journal" element={<JournalPage />} />
      <Route path="/journal/:slug" element={<JournalEntryPage />} />
      <Route path="/apply" element={<ApplyPage />} />
      <Route path="/submit" element={<Navigate to="/apply" replace />} />
      <Route path="/nominate" element={<NominatePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
