import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import AccountPage from './pages/AccountPage'
import Modal from './components/Modal'
import LostForm from './pages/LostForm'
import FoundForm from './pages/FoundForm'
import LoginPage from './components/LoginPage'
import SignPage from './components/SignPage'
import EditProfile from './pages/EditProfile'
import './App.css'

function HomePage() {
  const [modalMode, setModalMode] = useState(null)

  return (
    <>
      <Landing
        onLostClick={() => setModalMode('lost')}
        onFoundClick={() => setModalMode('found')}
      />
      <Modal
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={
          modalMode === 'found'
            ? 'Report something found'
            : 'Report something lost'
        }
      >
        {modalMode === 'found' ? <FoundForm /> : <LostForm />}
      </Modal>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignPage />} />
      <Route path="/edit-profile" element={<EditProfile />} />
    </Routes>
  )
}
