import React from 'react';
import GameCanvas from './components/GameCanvas';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Minigame Arcade - React Version</h1>
      </header>
      <main>
        <GameCanvas />
      </main>
      <footer>
        <p>
          Controles: Flechas para mover  <code>↑ ↓ → ←</code>
        </p>
        <p>
          <code>Tecla Espacio</code> para dibujar líneas.
        </p>
      </footer>
    </div>
  );
}

export default App;