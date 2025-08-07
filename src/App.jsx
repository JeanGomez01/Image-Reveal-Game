import { useState } from 'react'
import './App.css'
import GameCanvas from './components/GameCanvas'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <h1 style={{ color: '#fff' }}>Image Reveal Game</h1>
        <GameCanvas />
      </div>
    </>
  )
}

export default App
