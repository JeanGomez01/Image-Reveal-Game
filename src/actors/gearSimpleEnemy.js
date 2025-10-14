// Global namespace for the game
window.LP = window.LP || {};

import { createGameObject } from './gameObject';
import { math } from '../engine/math';

// SimpleFemaleEnemy class - Enemigo femenino con una sola imagen
export const createSimpleGearEnemy = (options, myProps = {}) => {
    // Set default options
    options.radius = options.radius || 15;
    options.x = options.x || math.getRandomInt(options.radius, options.canvasW - options.radius);
    options.y = options.y || math.getRandomInt(options.radius, options.canvasH - options.radius);
    options.speed = options.speed || 1.2;

    // Default properties
    const my = {
        name: "simpleFemaleEnemy",
        ...myProps
    };

    // Create base game object
    const that = createGameObject(options, my);

    // Reference to player
    const player = options.player;

    // Image properties
    const enemyImage = new Image();
        enemyImage.src ='assets/enemy_gear.png'; // Ruta de la imagen


    // Variable para saber si la imagen está cargada
    let imageLoaded = false;

    // Dimensiones renderizadas de la imagen (mantener aspecto ratio)
    let renderWidth = 0;
    let renderHeight = 0;

    // Esperar a que la imagen se cargue
    enemyImage.onload = () => {
        imageLoaded = true;
        
        // Calcular dimensiones manteniendo el aspect ratio
        const aspectRatio = enemyImage.width / enemyImage.height;
        
        if (options.maintainAspectRatio !== false) {
            // Usar el radio como referencia de altura o ancho
            if (aspectRatio >= 1) {
                // Imagen horizontal o cuadrada
                renderWidth = that.radius * 2;
                renderHeight = renderWidth / aspectRatio;
            } else {
                // Imagen vertical
                renderHeight = that.radius * 2;
                renderWidth = renderHeight * aspectRatio;
            }
        } else {
            // Forzar a cuadrado si se especifica
            renderWidth = that.radius * 2;
            renderHeight = that.radius * 2;
        }
    };

    // Enemy specific properties
    let lastDirectionChangeTime = 0;
    const directionChangeInterval = 2000; // 2 seconds
    let isMoving = true;

    // Rotation properties (opcional, para rotar la imagen según dirección)
    let rotation = 0;
    const enableRotation = options.enableRotation !== undefined ? options.enableRotation : false;

    // Si no usa rotación, puede usar flip horizontal para mirar izquierda/derecha
    const useFlip = options.useFlip !== undefined ? options.useFlip : true;
    let flipHorizontal = false;

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
            updateVisualDirection();
        }

        if (that.y < that.radius || that.y > that.canvasH - that.radius) {
            that.directionY *= -1;
            that.y = Math.max(that.radius, Math.min(that.canvasH - that.radius, that.y));
            updateVisualDirection();
        }

        // Check collision with player
        if (player && player.checkCollision) {
            player.checkCollision(that.getHitbox(), tFrame, "simple female enemy");
        }

        // Check collision with path
        if (player && player.isCollidingPath && player.isCollidingPath(that.getHitbox())) {
            // Bounce off path
            that.directionX *= -1;
            that.directionY *= -1;

            // Move back to previous position
            that.x = that.previousX;
            that.y = that.previousY;

            updateVisualDirection();
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

        updateVisualDirection();
    };

    // Actualizar la dirección visual (rotación o flip) basado en la dirección de movimiento
    const updateVisualDirection = () => {
        if (!isMoving) return;

        if (enableRotation) {
            // Modo rotación: rotar la imagen según dirección
            rotation = Math.atan2(that.directionY, that.directionX);
        } else if (useFlip) {
            // Modo flip: voltear horizontalmente si va a la izquierda
            flipHorizontal = that.directionX < 0;
        }
    };

    // Override render method
    const render = (canvasContext) => {
        if (!that.alive || !imageLoaded) {
            // Fallback: dibujar un círculo si la imagen no está cargada
            canvasContext.fillStyle = 'purple';
            canvasContext.beginPath();
            canvasContext.arc(that.x, that.y, that.radius, 0, Math.PI * 2);
            canvasContext.fill();
            return;
        }

        // Guardar el estado del contexto
        canvasContext.save();

        // Mover el contexto al centro del enemigo
        canvasContext.translate(that.x, that.y);

        if (enableRotation) {
            // Rotar si está habilitado
            canvasContext.rotate(rotation);
        } else if (useFlip && flipHorizontal) {
            // Voltear horizontalmente si está habilitado
            canvasContext.scale(-1, 1);
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
        // canvasContext.strokeStyle = 'purple';
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
window.LP.simpleFemaleEnemy = createSimpleGearEnemy;