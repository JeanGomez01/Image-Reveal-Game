import React from 'react';
import GameCanvas from './components/GameCanvas';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Larvs Panic - React Version</h1>
      </header>
      <main>
        <GameCanvas />
      </main>
      <footer>
        <p>
          Controles: Flechas para mover, Espacio para dibujar líneas.
          Objetivo: Captura al menos el 80% del área para ganar.
        </p>
      </footer>
    </div>
  );
}

export default App;