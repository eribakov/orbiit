import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Landing from './pages/Landing'
import AccountPage from './pages/AccountPage'
import Modal from './components/Modal'
import LostForm from './pages/LostForm'
import FoundForm from './pages/FoundForm'
import LoginPage from './components/LoginPage'
import SignPage from './components/SignPage'
import './App.css'

function HomePage() {
  const [modalMode, setModalMode] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      <Landing
        onLostClick={() => setModalMode('lost')}
        onFoundClick={() => setModalMode('found')}
        user={user}
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
    </Routes>
  )
}
