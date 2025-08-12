// Global namespace for the game
window.LP = window.LP || {};

import { createGameObject } from './gameObject';
import { math } from '../engine/math';

// CircleEnemy class
export const createCircleEnemy = (options, myProps = {}) => {
    // Set default options
    options.radius = options.radius || 10;
    options.x = options.x || math.getRandomInt(options.radius, options.canvasW - options.radius);
    options.y = options.y || math.getRandomInt(options.radius, options.canvasH - options.radius);
    options.speed = options.speed || 1;
    
    // Default properties
    const my = {
        name: "circleEnemy",
        fillStyle: "red",
        ...myProps
    };
    
    // Create base game object
    const that = createGameObject(options, my);
    
    // Reference to player
    const player = options.player;
    
    // Enemy specific properties
    let lastDirectionChangeTime = 0;
    const directionChangeInterval = 2000; // 2 seconds
    
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
        }
        
        if (that.y < that.radius || that.y > that.canvasH - that.radius) {
            that.directionY *= -1;
            that.y = Math.max(that.radius, Math.min(that.canvasH - that.radius, that.y));
        }
        
        // Check collision with player
        if (player && player.checkCollision) {
            player.checkCollision(that.getHitbox(), tFrame);
        }
        
        // Check collision with path
        if (player && player.isCollidingPath && player.isCollidingPath(that.getHitbox())) {
            // Bounce off path
            that.directionX *= -1;
            that.directionY *= -1;
            
            // Move back to previous position
            that.x = that.previousX;
            that.y = that.previousY;
        }
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
    
    // Initialize with a random direction
    changeDirection();
    
    return that;
};

// Store in the global namespace for access from other modules
window.LP.circleEnemy = createCircleEnemy;