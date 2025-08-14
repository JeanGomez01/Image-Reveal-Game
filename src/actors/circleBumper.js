// Global namespace for the game
window.LP = window.LP || {};

import { createGameObject } from './gameObject';
import { math } from '../engine/math';

// CircleBumper class
export const createCircleBumper = (options, myProps = {}) => {
    // Set default options
    options.radius = options.radius || 15;
    options.x = options.x || math.getRandomInt(options.radius, options.canvasW - options.radius);
    options.y = options.y || math.getRandomInt(options.radius, options.canvasH - options.radius);
    options.speed = options.speed || 0.5; // Slower than regular enemies

    // Default properties
    const my = {
        name: "circleBumper",
        fillStyle: "purple",
        ...myProps
    };

    // Create base game object
    const that = createGameObject(options, my);

    // Reference to player
    const player = options.player;

    // Bumper specific properties
    let lastDirectionChangeTime = 0;
    const directionChangeInterval = 5000; // 5 seconds

    // Override update method
    const update = (tFrame, dt) => {
        if (!that.alive) return;

        that.savePreviousPosition();

        // Change direction less frequently than regular enemies
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
        }

        if (that.y < that.radius || that.y > that.canvasH - that.radius) {
            that.directionY *= -1;
            that.y = Math.max(that.radius, Math.min(that.canvasH - that.radius, that.y));
        }

        // Check collision with player
        if (player && player.checkCollision) {
            player.checkCollision(that.getHitbox(), tFrame, "bumper");
        }

        // Check collision with path
        if (player && player.isCollidingPath && player.isCollidingPath(that.getHitbox())) {
            // Bounce off path with more force
            that.directionX *= -1.2;
            that.directionY *= -1.2;

            // Normalize direction vector to maintain consistent speed
            const length = Math.sqrt(that.directionX * that.directionX + that.directionY * that.directionY);
            that.directionX /= length;
            that.directionY /= length;

            // Move back to previous position
            that.x = that.previousX;
            that.y = that.previousY;
        }
    };

    // Override render method to make the bumper look different
    const render = (canvasContext) => {
        if (!that.alive) return;

        // Draw outer circle
        canvasContext.beginPath();
        canvasContext.arc(that.x, that.y, that.radius, 0, 2 * Math.PI);
        canvasContext.fillStyle = my.fillStyle;
        canvasContext.fill();

        // Draw inner circle
        canvasContext.beginPath();
        canvasContext.arc(that.x, that.y, that.radius * 0.6, 0, 2 * Math.PI);
        canvasContext.fillStyle = "magenta";
        canvasContext.fill();
    };

    // Change direction randomly
    const changeDirection = () => {
        // Random direction
        const angle = Math.random() * Math.PI * 2;
        that.directionX = Math.cos(angle);
        that.directionY = Math.sin(angle);
    };

    // Override base methods
    that.update = update;
    that.render = render;

    // Initialize with a random direction
    changeDirection();

    return that;
};

// Store in the global namespace for access from other modules
window.LP.circleBumper = createCircleBumper;