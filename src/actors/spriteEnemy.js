// Global namespace for the game
window.LP = window.LP || {};

import { createGameObject } from './gameObject';
import { math } from '../engine/math';

// SpriteEnemy class - Enemigo con animación basada en spritesheet
export const createSpriteEnemy = (options, myProps = {}) => {
    // Set default options}

    options.radius = options.radius || 18; // Tamaño mayor para el sprite
    options.x = options.x || math.getRandomInt(options.radius, options.canvasW - options.radius);
    options.y = options.y || math.getRandomInt(options.radius, options.canvasH - options.radius);
    options.speed = options.speed || 0.8; // Más lento que el enemigo circular

    // Default properties
    const my = {
        name: "spriteEnemy",
        ...myProps
    };

    // Create base game object
    const that = createGameObject(options, my);

    // Reference to player
    const player = options.player;

    // Sprite properties
    const spritesheet = new Image();
    spritesheet.src = 'assets/sprites/spritesheet_escalada.png';

    // Dimensiones del spritesheet (8 filas x 4 columnas)
    const rows = 8;
    const cols = 4;

    // Variables para la animación
    let currentFrame = 0;
    let frameCounter = 0;
    const frameDelay = 8; // Velocidad de la animación (frames a esperar)
    let currentDirection = 0; // 0-7 para las 8 direcciones
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

    // Mapeo de ángulos a direcciones del spritesheet
    const getDirectionFromAngle = (angle) => {
        // Convertir el ángulo a grados y normalizar a 0-360
        const degrees = ((angle * 180 / Math.PI) + 360) % 360;

        // Mapear los grados a las 8 direcciones del spritesheet
        if (degrees >= 337.5 || degrees < 22.5) return 0;      // derecha
        if (degrees >= 22.5 && degrees < 67.5) return 7;       // diagonal arriba derecha
        if (degrees >= 67.5 && degrees < 112.5) return 6;      // arriba
        if (degrees >= 112.5 && degrees < 157.5) return 5;     // diagonal arriba izquierda
        if (degrees >= 157.5 && degrees < 202.5) return 4;     // izquierda
        if (degrees >= 202.5 && degrees < 247.5) return 3;     // diagonal abajo izquierda
        if (degrees >= 247.5 && degrees < 292.5) return 2;     // abajo
        return 1;                                            // diagonal abajo derecha
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
            player.checkCollision(that.getHitbox(), tFrame, "sprite enemy");
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

    // Change direction randomly
    const changeDirection = () => {
        // 20% de probabilidad de quedarse parado
        if (Math.random() < 0.2) {
            that.directionX = 0;
            that.directionY = 0;
            isMoving = false;
        } else {
            // Random direction
            const angle = Math.random() * Math.PI * 2;
            that.directionX = Math.cos(angle);
            that.directionY = Math.sin(angle);
            isMoving = true;
        }

        updateSpriteDirection();
    };

    // Actualizar la dirección del sprite basado en la dirección de movimiento
    const updateSpriteDirection = () => {
        // Calcular el ángulo de movimiento
        const angle = Math.atan2(that.directionY, that.directionX);
        currentDirection = getDirectionFromAngle(angle);
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
window.LP.spriteEnemy = createSpriteEnemy;