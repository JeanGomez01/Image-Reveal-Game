// Global namespace for the game
window.LP = window.LP || {};

// Math utility functions
export const math = {
    // Get a random number between min and max (inclusive)
    getRandomInt: (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Get a random number between min and max (exclusive)
    getRandomArbitrary: (min, max) => {
        return Math.random() * (max - min) + min;
    },
    
    // Calculate distance between two points
    distance: (x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // Normalize a vector
    normalize: (x, y) => {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    }
};

// Store in the global namespace for access from other modules
window.LP.math = math;