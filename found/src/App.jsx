import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Landing from './pages/Landing'
import AccountPage from './pages/AccountPage'
import Modal from './components/Modal'
import LostForm from './components/LostForm'
import FoundForm from './components/FoundForm'
import './App.css'

function HomePage() {
  const [modalMode, setModalMode] = useState(null)
  const [page, setPage] = useState('landing')  
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (page === 'login') {
    return (
      <LoginPage
        onSuccess={() => setPage('landing')}
        onSignupClick={() => setPage('signup')}
      />
    )
  }

  if (page === 'signup') {
    return (
      <SignPage
        onSuccess={() => setPage('landing')}
        onLoginClick={() => setPage('login')}
      />
    )
  }
  if (page === 'account') {
  return (
    <div>Account page coming soon</div>  
  )
}

  return (
    <>
      <Landing
  onLostClick={() => setModalMode('lost')}
  onFoundClick={() => setModalMode('found')}
  onLoginClick={() => setPage('login')}
  onSignupClick={() => setPage('signup')}
  onAccountClick={() => setPage('account')}
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
