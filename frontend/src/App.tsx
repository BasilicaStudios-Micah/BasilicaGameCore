import { useEffect, useState } from 'react'
import { healthCheck } from './services/api'
import './App.css'

function App() {
  const [status, setStatus] = useState('')

  useEffect(() => {
    healthCheck().then(res => {
      setStatus(res.data.status)
    }).catch(err => {
      setStatus('Error connecting to backend')
      console.error(err)
    })
  }, [])

  return (
    <div className="App">
      <h1>BasilicaGameCore</h1>
      <p>Backend Status: {status}</p>
    </div>
  )
}

export default App