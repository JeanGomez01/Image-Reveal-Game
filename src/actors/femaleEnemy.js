// Global namespace for the game
window.LP = window.LP || {};

import { createGameObject } from './gameObject';
import { math } from '../engine/math';

// FemaleEnemy class - Enemigo femenino con animación basada en spritesheet de 4 direcciones
export const createFemaleEnemy = (options, myProps = {}) => {
    // Set default options
    options.radius = options.radius || 15; // Tamaño ligeramente mayor para el sprite
    options.x = options.x || math.getRandomInt(options.radius, options.canvasW - options.radius);
    options.y = options.y || math.getRandomInt(options.radius, options.canvasH - options.radius);
    options.speed = options.speed || 1.2; // Ligeramente más rápido que el enemigo circular

    // Default properties
    const my = {
        name: "femaleEnemy",
        ...myProps
    };

    // Create base game object
    const that = createGameObject(options, my);

    // Reference to player
    const player = options.player;

    // Sprite properties
    const spritesheet = new Image();
    spritesheet.src = 'assets/sprites/sprite-femenino.png';

    // Dimensiones del spritesheet (4 filas x 4 columnas)
    const rows = 4;
    const cols = 4;

    // Variables para la animación
    let currentFrame = 0;
    let frameCounter = 0;
    const frameDelay = 8; // Velocidad de la animación (frames a esperar)
    let currentDirection = 0; // 0-3 para las 4 direcciones (derecha, arriba, izquierda, abajo)
    let isMoving = true; // Indica si el enemigo está en movimiento

    // Dimensiones de cada frame (se calculará cuando la imagen se cargue)
    let frameWidth = 0;
    let frameHeight = 0;

    // Esperar a que la imagen se cargue para calcular las dimensiones
    spritesheet.onload = () => {
        frameWidth = spritesheet.width / cols;
        frameHeight = spritesheet.height / rows;
    };

    // Enemy specific properties
    let lastDirectionChangeTime = 0;
    const directionChangeInterval = 2000; // 2 seconds

    // Mapeo de ángulos a direcciones del spritesheet (4 direcciones)
    const getDirectionFromAngle = (angle) => {
        // Convertir el ángulo a grados y normalizar a 0-360
        const degrees = ((angle * 180 / Math.PI) + 360) % 360;

        // // Mapear los grados a las 8 direcciones del spritesheet
        if (degrees >= 45 && degrees < 135) return 0;   // arriba
        if (degrees >= 135 && degrees < 225) return 1;  // izquierda
        if (degrees >= 225 && degrees < 315) return 3;  // abajo
        return 2;                                       // derecha
    };

    // Override update method
    const update = (tFrame, dt) => {
        if (!that.alive) return;

        that.savePreviousPosition();

        // Change direction periodically
        if (tFrame - lastDirectionChangeTime > directionChangeInterval) {
            changeDirection();
            lastDirectionChangeTime = tFrame;
        }

        // Move in the current direction
        that.x += that.directionX * that.speed;
        that.y += that.directionY * that.speed;

        // Bounce off walls
        if (that.x < that.radius || that.x > that.canvasW - that.radius) {
            that.directionX *= -1;
            that.x = Math.max(that.radius, Math.min(that.canvasW - that.radius, that.x));
            updateSpriteDirection();
        }

        if (that.y < that.radius || that.y > that.canvasH - that.radius) {
            that.directionY *= -1;
            that.y = Math.max(that.radius, Math.min(that.canvasH - that.radius, that.y));
            updateSpriteDirection();
        }

        // Check collision with player
        if (player && player.checkCollision) {
            player.checkCollision(that.getHitbox(), tFrame, "female enemy");
        }

        // Check collision with path
        if (player && player.isCollidingPath && player.isCollidingPath(that.getHitbox())) {
            // Bounce off path
            that.directionX *= -1;
            that.directionY *= -1;

            // Move back to previous position
            that.x = that.previousX;
            that.y = that.previousY;

            updateSpriteDirection();
        }

        // Actualizar la animación solo si está en movimiento
        if (isMoving) {
            frameCounter++;
            if (frameCounter >= frameDelay) {
                currentFrame = (currentFrame + 1) % cols;
                frameCounter = 0;
            }
        } else {
            // Si no está en movimiento, usar el primer frame (posición estática)
            currentFrame = 0;
        }
    };

    // Change direction randomly - solo movimientos horizontales o verticales
    const changeDirection = () => {
        // 20% de probabilidad de quedarse parado
        if (Math.random() < 0.2) {
            that.directionX = 0;
            that.directionY = 0;
            isMoving = false;
        } else {
            // Solo movimientos horizontales o verticales (no diagonales)
            const directions = [
                { x: 1, y: 0 },  // derecha
                { x: 0, y: -1 }, // arriba
                { x: -1, y: 0 }, // izquierda
                { x: 0, y: 1 }   // abajo
            ];

            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            that.directionX = randomDir.x;
            that.directionY = randomDir.y;
            isMoving = true;
        }

        updateSpriteDirection();
    };

    // Actualizar la dirección del sprite basado en la dirección de movimiento
    const updateSpriteDirection = () => {
        if (isMoving) {
            // Calcular el ángulo de movimiento
            const angle = Math.atan2(that.directionY, that.directionX);
            currentDirection = getDirectionFromAngle(angle);
        }
        // Si no está en movimiento, mantener la dirección actual pero usar el primer frame
    };

    // Override render method
    const render = (canvasContext) => {
        if (!that.alive || !spritesheet.complete) return;

        // Calcular la posición del frame en el spritesheet
        const sx = currentFrame * frameWidth;
        const sy = currentDirection * frameHeight;

        // Dibujar el sprite centrado en la posición del enemigo
        canvasContext.drawImage(
            spritesheet,
            sx, sy, frameWidth, frameHeight,
            that.x - that.radius, that.y - that.radius, that.radius * 2, that.radius * 2
        );

        // Dibujar hitbox para depuración (comentar en producción)
        // canvasContext.strokeStyle = 'red';
        // canvasContext.strokeRect(that.x - that.radius, that.y - that.radius, that.radius * 2, that.radius * 2);
    };

    // Override base methods
    that.update = update;
    that.render = render;

    // Initialize with a random direction
    changeDirection();

    return that;
};

// Store in the global namespace for access from other modules
window.LP.femaleEnemy = createFemaleEnemy;