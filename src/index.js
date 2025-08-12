import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './App.css';

// Asegurarse de que el namespace global LP existe
window.LP = window.LP || {};

// Exportar componentes y módulos para uso externo
export { default as GameCanvas } from './components/GameCanvas';

// Engine modules
export { initGame } from './engine/engine';
export { initInput, getInput } from './engine/input';
export { initAudioEngine } from './engine/audioEngine';
export { helpers } from './engine/helpers';
export { math } from './engine/math';
export { behaviors } from './engine/behaviors';

// Actor classes
export { createGameObject } from './actors/gameObject';
export { createPlayer } from './actors/player';
export { createCircleEnemy } from './actors/circleEnemy';
export { createCircleBumper } from './actors/circleBumper';

// Renderizar la aplicación usando la API moderna de React 18
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);