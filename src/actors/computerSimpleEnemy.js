// Global namespace for the game
window.LP = window.LP || {};

import { createGameObject } from './gameObject';
import { math } from '../engine/math';

// SimpleImageEnemy class - Enemigo con una sola imagen
export const createSimpleImageEnemy = (options, myProps = {}) => {
    // Set default options
    options.radius = options.radius || 18;
    options.x = options.x || math.getRandomInt(options.radius, options.canvasW - options.radius);
    options.y = options.y || math.getRandomInt(options.radius, options.canvasH - options.radius);
    options.speed = options.speed || 0.8;

    // Default properties
    const my = {
        name: "simpleImageEnemy",
        ...myProps
    };

    // Create base game object
    const that = createGameObject(options, my);

    // Reference to player
    const player = options.player;

    // Image properties
    const enemyImage = new Image();
    enemyImage.src = 'assets/enemy_computer.png'; // Ruta de la imagen

    // Variable para saber si la imagen está cargada
    let imageLoaded = false;

    // Esperar a que la imagen se cargue
    enemyImage.onload = () => {
        imageLoaded = true;
    };

    // Enemy specific properties
    let lastDirectionChangeTime = 0;
    const directionChangeInterval = 2000; // 2 seconds

    // Rotation properties (opcional, para rotar la imagen según dirección)
    let rotation = 0;
    const enableRotation = false;

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
            updateRotation();
        }

        if (that.y < that.radius || that.y > that.canvasH - that.radius) {
            that.directionY *= -1;
            that.y = Math.max(that.radius, Math.min(that.canvasH - that.radius, that.y));
            updateRotation();
        }

        // Check collision with player
        if (player && player.checkCollision) {
            player.checkCollision(that.getHitbox(), tFrame, "simple image enemy");
        }

        // Check collision with path
        if (player && player.isCollidingPath && player.isCollidingPath(that.getHitbox())) {
            // Bounce off path
            that.directionX *= -1;
            that.directionY *= -1;

            // Move back to previous position
            that.x = that.previousX;
            that.y = that.previousY;

            updateRotation();
        }
    };

    // Change direction randomly
    const changeDirection = () => {
        // Random direction
        const angle = Math.random() * Math.PI * 2;
        that.directionX = Math.cos(angle);
        that.directionY = Math.sin(angle);

        updateRotation();
    };

    // Actualizar la rotación de la imagen basado en la dirección de movimiento
    const updateRotation = () => {
        if (enableRotation) {
            // Calcular el ángulo de movimiento
            rotation = Math.atan2(that.directionY, that.directionX);
        }
    };

    // Override render method
    const render = (canvasContext) => {
        if (!that.alive || !imageLoaded) {
            // Fallback: dibujar un círculo si la imagen no está cargada
            canvasContext.fillStyle = 'red';
            canvasContext.beginPath();
            canvasContext.arc(that.x, that.y, that.radius, 0, Math.PI * 2);
            canvasContext.fill();
            return;
        }

        // Guardar el estado del contexto
        canvasContext.save();

        // Mover el contexto al centro del enemigo
        canvasContext.translate(that.x, that.y);

        // Rotar si está habilitado
        if (enableRotation) {
            canvasContext.rotate(rotation);
        }

        // Dibujar la imagen centrada
        canvasContext.drawImage(
            enemyImage,
            -that.radius, -that.radius,
            that.radius * 2, that.radius * 2
        );

        // Restaurar el estado del contexto
        canvasContext.restore();

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
window.LP.simpleImageEnemy = createSimpleImageEnemy;