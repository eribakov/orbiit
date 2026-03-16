import { useState } from 'react'
import Landing from './components/Landing'
import Modal from './components/Modal'
import LostForm from './components/LostForm'
import './App.css'

export default function App() {
  const [isFormOpen, setIsFormOpen] = useState(false)

  return (
    <>
      <Landing onReportClick={() => setIsFormOpen(true)} />
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Report something lost"
      >
        <LostForm />
      </Modal>
    </>
  )
}
