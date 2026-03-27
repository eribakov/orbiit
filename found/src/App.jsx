import { useState } from 'react'
import Landing from './components/Landing'
import Modal from './components/Modal'
import LostForm from './components/LostForm'
import FoundForm from './components/FoundForm'
import './App.css'

export default function App() {
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
