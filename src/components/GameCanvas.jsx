import React, { useRef, useEffect, useState } from 'react';

// Importar el módulo de inicialización del juego con sintaxis ES6
import { initGame } from '../engine/engine';

// Importar la implementación de respaldo de FPSMeter
import '../lib/fpsmeter-fallback';

// Asegurarse de que el namespace global LP existe
if (typeof window !== 'undefined') {
    window.LP = window.LP || {};
}

const GameCanvas = () => {
    const canvasRef = useRef(null);
    const statsRef = useRef(null);
    const fpsMeterRef = useRef(null);
    const messagesRef = useRef(null);
    const [playMusic, setPlayMusic] = useState(true);
    const [gameInitialized, setGameInitialized] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Función para cargar scripts externos necesarios
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    console.log(`Script loaded successfully: ${src}`);
                    resolve();
                };
                script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
                document.head.appendChild(script);
            });
        };

        // Cargar FPSMeter si no está disponible
        const loadDependencies = async () => {
            try {
                if (typeof window.FPSMeter === 'undefined') {
                    console.log("FPSMeter not found, loading from CDN...");
                    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/fpsmeter/0.3.1/fpsmeter.min.js');
                    console.log("FPSMeter loaded successfully, window.FPSMeter:", window.FPSMeter);

                    // Esperar un momento para asegurarse de que FPSMeter esté disponible globalmente
                    setTimeout(() => {
                        setGameInitialized(false); // Forzar la reinicialización
                    }, 100);
                } else {
                    console.log("FPSMeter already available:", window.FPSMeter);
                }
            } catch (error) {
                console.error("Failed to load dependencies:", error);
                setError("Failed to load game dependencies. Please refresh the page.");
            }
        };

        loadDependencies();
    }, []);

    useEffect(() => {
        // Inicializar el juego cuando el componente se monta y FPSMeter está disponible
        if (canvasRef.current &&
            statsRef.current &&
            fpsMeterRef.current &&
            messagesRef.current &&
            !gameInitialized) {

            // Verificar que FPSMeter está disponible
            if (typeof window.FPSMeter === 'undefined') {
                console.log("FPSMeter not available yet, waiting...");
                return; // Salir y esperar a que FPSMeter se cargue
            }

            try {
                console.log("Initializing game...");

                // Verificar que todos los elementos DOM existen
                console.log("Canvas element:", canvasRef.current);
                console.log("Stats element:", statsRef.current);
                console.log("FPSMeter element:", fpsMeterRef.current);
                console.log("Messages element:", messagesRef.current);
                console.log("FPSMeter available:", window.FPSMeter);

                // Verificar que initGame es una función
                if (typeof initGame !== 'function') {
                    throw new Error("initGame is not a function");
                }

                const game = initGame(
                    canvasRef.current,
                    statsRef.current,
                    fpsMeterRef.current,
                    messagesRef.current
                );

                console.log("Game initialized:", game);
                setGameInitialized(true);

                // Limpiar cuando el componente se desmonta
                return () => {
                    // Añadir cualquier limpieza necesaria para el juego
                    if (game && typeof game.cleanup === 'function') {
                        game.cleanup();
                    }
                };
            } catch (error) {
                console.error("Error initializing game:", error);
                setError(`Error initializing game: ${error.message}`);
            }
        }
    }, [canvasRef, statsRef, fpsMeterRef, messagesRef, gameInitialized]);

    const handleMusicToggle = (e) => {
        setPlayMusic(e.target.checked);
        // Implementaremos esta función en el motor de audio
        if (window.LP && window.LP.audioEngine) {
            window.LP.audioEngine.setMusic(e.target.checked);
        }
    };

    return (
        <div className="game-container">
            {error && (
                <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            <div id='header'>
                <div id="fpsMeter" ref={fpsMeterRef} style={{ width: '10%' }}></div>
                <div id="messages" ref={messagesRef} style={{ marginLeft: '15%', float: 'left' }}></div>
                <div id="stats" ref={statsRef} style={{ float: 'right' }}></div>
            </div>
            <br />
            <canvas
                id="canvas"
                ref={canvasRef}
                width="1024"
                height="768"
                style={{
                    border: '2px solid #000',
                    position: 'absolute',
                    left: '25%',
                    marginLeft: '10px'
                }}
            />
        </div>
    );
};

export default GameCanvas;