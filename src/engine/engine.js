// Global namespace for the game
window.LP = window.LP || {};

// Importaciones con sintaxis ES6
import { initInput, getInput } from './input';
import { initAudioEngine } from './audioEngine';
import { createPlayer } from '../actors/player';
import { createCircleEnemy } from '../actors/circleEnemy';
import { createCircleBumper } from '../actors/circleBumper';
import { helpers } from './helpers';

// Implementaciones predeterminadas en caso de error
const defaultInput = { up: false, down: false, left: false, right: false, fire: false };
const defaultHelpers = {
    areColliding: () => false,
    isCollidingPoints: () => false
};

// Initialize FPSMeter from external library
// We'll need to include this library in our HTML or import it
const FPSMeter = window.FPSMeter;

export const initGame = (canvasElement, statsElement, fpsMeterElement, messagesElement, selectedImage = 'image.png', musicEnabled = true) => {
    // Create the game engine object
    const engine = {};

    // Store in the global namespace for access from other modules
    window.LP.engine = engine;

    // Game state variables
    let c2d;
    let canvasH;
    let canvasW;
    let player;
    let enemies = [];
    let meter;
    let lastStatsUpdateTime = 0;
    let messageTimeoutHandle = null;
    let clearedPercentage = 0;
    let totalArea = 0;
    let filledArea = 0;
    let remainingTime = 100;
    let lastFrameTime = 0;
    let lastRemaningTimeFrameTime = 0;
    let backgroundImgElement;
    let nextAddTimePercentage = 30;
    let gameLoopId = null;
    let gameStarted = false;
    let audioEngine = null;

    // Initialize the game
    engine.init = () => {
        console.log("init!");

        initializeCanvas(canvasElement);

        // Asegurarse de que las funciones de inicialización existen
        if (typeof initInput === 'function') {
            initInput();
        } else {
            console.error("initInput function not found");
        }

        if (typeof initAudioEngine === 'function') {
            audioEngine = initAudioEngine();

            // Configurar el estado inicial de la música
            if (audioEngine) {
                audioEngine.setMusic(musicEnabled);

                // Reproducir la música del juego si está habilitada
                if (musicEnabled) {
                    audioEngine.trigger('start-game');
                }
            }
        } else {
            console.error("initAudioEngine function not found");
        }

        try {
            // Crear el jugador con comprobación de errores
            player = createPlayer({
                canvasW: canvasW,
                canvasH: canvasH,
                input: typeof getInput === 'function' ? getInput() : {},
                x: 0, // esquina superior izquierda
                y: 0
            });

            console.log("Player created:", player);

            if (!player || typeof player.getEmptyMapPoints !== 'function') {
                console.error("Player not properly initialized or missing required methods");
            }
        } catch (error) {
            console.error("Error creating player:", error);
        }

        try {
            // Inicializar FPSMeter si está disponible
            if (typeof window.FPSMeter === 'function' && fpsMeterElement) {
                meter = new window.FPSMeter(fpsMeterElement, {
                    position: 'absolute',
                    theme: 'light',
                    graph: 1,
                    heat: 1
                });
                console.log("FPSMeter initialized successfully:", meter);
            } else {
                console.warn("FPSMeter not available. window.FPSMeter:", window.FPSMeter);
                // Crear un objeto meter simulado para evitar errores
                meter = {
                    tick: () => { },
                    destroy: () => { }
                };
            }
        } catch (error) {
            console.error("Error initializing FPSMeter:", error);
            // Crear un objeto meter simulado para evitar errores
            meter = {
                tick: () => { },
                destroy: () => { }
            };
        }

        // Solo resetear el nivel si el jugador se creó correctamente
        if (player) {
            resetLevel();
        }

        // Cargar la imagen de fondo
        backgroundImgElement = new Image();
        backgroundImgElement.onload = () => {
            // Mantener el canvas en 600x600 (1:1 ratio)
            canvasElement.width = 600;
            canvasElement.height = 600;

            // Actualizar variables globales
            canvasW = canvasElement.width / 2;
            canvasH = canvasElement.height / 2;

            // Volver a inicializar el contexto y escalar
            c2d = canvasElement.getContext('2d');
            c2d.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
            c2d.scale(2, 2);

            // Calcular el área total y el área inicial llena
            totalArea = canvasW * canvasH;

            // Reiniciar el nivel y jugador con el nuevo tamaño
            if (player && typeof player.reset === 'function') {
                player.reset({ canvasW, canvasH });
            }

            // Iniciar el juego
            startGame();
        };
        backgroundImgElement.onerror = (error) => {
            console.error("Error loading background image:", error);
            // Iniciar el juego incluso si la imagen falla
            startGame();
        };

        // Usar la imagen seleccionada
        console.log("Loading image:", selectedImage);
        backgroundImgElement.src = selectedImage;
    };

    // Iniciar el juego
    const startGame = () => {
        if (!gameStarted) {
            gameStarted = true;
            // Actualizar el área inicial llena
            updateFilledArea();
            // Iniciar el bucle del juego
            gameLoopId = requestAnimationFrame(mainLoop);
        }
    };

    // Actualizar el área llena y el porcentaje limpiado
    const updateFilledArea = () => {
        if (player && typeof player.getFilledMapPoints === 'function') {
            const filledPoints = player.getFilledMapPoints();
            filledArea = filledPoints.length;

            // Calcular el porcentaje de área limpiada
            if (totalArea > 0) {
                clearedPercentage = Math.round(((totalArea - filledArea) / totalArea) * 100);
            }
        }
    };

    engine.playerDied = () => {
        console.log("Player died");
        engine.showMessage("You died :(");

        if (audioEngine && musicEnabled) {
            audioEngine.trigger("game-over");
        }

        resetLevel();
    };

    engine.areaCleared = (percentage) => {
        // En lugar de sumar el porcentaje, actualizamos el área llena y recalculamos
        updateFilledArea();

        if (clearedPercentage >= 80) {
            console.log("Win!");
            engine.showMessage("You win!");

            if (audioEngine && musicEnabled) {
                audioEngine.trigger("win");
            }

            resetLevel();
        }

        if (clearedPercentage >= nextAddTimePercentage) {
            remainingTime += 30;
            nextAddTimePercentage += 10; // We add time each 10 now
            engine.showMessage("Extra time!");


            audioEngine.trigger("extra-time");


            console.log("Extra time added");
        }

        // Solo verificar enemigos encerrados si el jugador está inicializado
        if (player) {
            verifyEnclosedEnemies();
        }
    };

    engine.showMessage = (message) => {
        if (messagesElement) {
            messagesElement.innerText = message;

            if (messageTimeoutHandle) clearTimeout(messageTimeoutHandle);
            messageTimeoutHandle = setTimeout(() => {
                messagesElement.innerText = '';
            }, 3 * 1000);
        }
    };

    // Private functions
    const initializeCanvas = (canvas) => {
        c2d = canvas.getContext('2d');
        c2d.lineWidth = 1;
        c2d.globalAlpha = 1;
        c2d.globalCompositeOperation = 'source-over';

        // We do a little trick here to double everything, we create a normal canvas but tell the game its dimension is half the real one
        // then we scale everything to the double. That way we have bigger objects without changing the game logic.
        canvasW = canvas.width / 2;
        canvasH = canvas.height / 2;
        c2d.scale(2, 2);
        console.log('canvas initialized');
    };

    const resetLevel = () => {
        enemies = [];
        clearedPercentage = 0;
        nextAddTimePercentage = 30;

        // Verificar que el jugador existe antes de llamar a reset
        if (player && typeof player.reset === 'function') {
            player.reset();
        } else {
            console.error("Player not initialized or missing reset method");
            return; // Salir si no hay jugador
        }

        remainingTime = 180;

        const enemyOptions = {
            canvasW: canvasW,
            canvasH: canvasH,
            player: player
        };

        // Verificar que las funciones de creación de enemigos existen
        try {
            if (typeof createCircleEnemy === 'function') {
                enemies.push(createCircleEnemy(enemyOptions));
                enemies.push(createCircleEnemy(enemyOptions));
            }

            if (typeof createCircleBumper === 'function') {
                enemies.push(createCircleBumper(enemyOptions));
                enemies.push(createCircleBumper(enemyOptions));
            }
        } catch (error) {
            console.error("Error creating enemies:", error);
        }

        // Actualizar el área llena después de resetear
        updateFilledArea();
    };

    const mainLoop = (tFrame) => {
        update(tFrame);
        render();
        gameLoopId = requestAnimationFrame(mainLoop);
    };

    const update = (tFrame) => {
        updateStats(tFrame);

        if (tFrame - lastRemaningTimeFrameTime > 1000) {
            --remainingTime;
            lastRemaningTimeFrameTime = tFrame;

            if (remainingTime === 0) {
                engine.playerDied();
            } else if (remainingTime === 30) {
                engine.showMessage("Hurry up!!");

                if (audioEngine && musicEnabled) {
                    audioEngine.trigger("hurry");
                }
            }
        }

        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update(tFrame, tFrame - lastFrameTime);
        }

        player.update(tFrame, tFrame - lastFrameTime);

        // Actualizar el área llena y el porcentaje cada cierto tiempo
        if (tFrame - lastStatsUpdateTime > 1000) {
            updateFilledArea();
        }

        lastFrameTime = tFrame;
    };

    const render = () => {
        renderBackground(1.0);

        player.render(c2d);

        for (let i = enemies.length - 1; i >= 0; i--) {
            if (!enemies[i].alive) {
                enemies.splice(i, 1);
                continue;
            }

            enemies[i].render(c2d);
        }

        // Verificar que meter existe antes de llamar a tick()
        if (meter && typeof meter.tick === 'function') {
            meter.tick();
        }
    };

    const renderBackground = (opacity = 1.0) => {
        // Procesar la imagen para asegurar un ratio 1:1
        const img = backgroundImgElement;

        if (!img || !img.complete) {
            // Si la imagen no está cargada, dibuja un fondo de color
            c2d.fillStyle = '#000000';
            c2d.fillRect(0, 0, canvasW, canvasH);
            return;
        }

        // Guardar el estado actual del contexto
        c2d.save();

        // Establecer la opacidad
        c2d.globalAlpha = opacity;

        // Determinar qué parte de la imagen usar para mantener ratio 1:1
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        // Dibujar la imagen recortada para mantener ratio 1:1
        c2d.drawImage(
            img,
            sx, sy, size, size,  // Recortar la imagen a un cuadrado
            0, 0, canvasW, canvasH  // Dibujar en todo el canvas
        );

        // Restaurar el estado del contexto
        c2d.restore();
    };

    const updateStats = (tFrame) => {
        if (tFrame - lastStatsUpdateTime > 1000) {
            if (statsElement) {
                statsElement.innerText = 'Lives: ' + player.lives + ' | ' + clearedPercentage + '% | Time: ' + remainingTime;
            }
            lastStatsUpdateTime = tFrame;
        }
    };

    const verifyEnclosedEnemies = () => {
        // Verificar que player existe y tiene el método getEmptyMapPoints
        if (!player || typeof player.getEmptyMapPoints !== 'function') {
            console.warn('Player not initialized or missing getEmptyMapPoints method');
            return;
        }

        const emptyPoints = player.getEmptyMapPoints();
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (helpers.isCollidingPoints(enemies[i].getHitbox(), emptyPoints)) {
                enemies[i].die();
                player.points += 200;
            }
        }
    };

    // Cleanup function for React component unmounting
    engine.cleanup = () => {
        // Detener el bucle del juego
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }

        // Limpiar el timeout de mensajes
        if (messageTimeoutHandle) {
            clearTimeout(messageTimeoutHandle);
            messageTimeoutHandle = null;
        }

        // Destruir el medidor FPS si existe
        if (meter && typeof meter.destroy === 'function') {
            try {
                meter.destroy();
                meter = null;
            } catch (error) {
                console.error("Error destroying FPSMeter:", error);
            }
        }

        // Detener todos los sonidos
        if (audioEngine) {
            audioEngine.stopAll();
        }

        console.log("Game engine cleaned up");
    };

    // Initialize the game
    engine.init();

    return engine;
};