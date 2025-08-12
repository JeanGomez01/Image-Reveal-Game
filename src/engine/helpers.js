// Global namespace for the game
window.LP = window.LP || {};

// Helper functions
export const helpers = {
    // Check if two rectangles are colliding
    areColliding: (rect1, rect2) => {
        return !(
            rect1.x > rect2.x + rect2.width ||
            rect1.x + rect1.width < rect2.x ||
            rect1.y > rect2.y + rect2.height ||
            rect1.y + rect1.height < rect2.y
        );
    },
    
    // Check if a rectangle is colliding with any point in an array
    isCollidingPoints: (rect, points) => {
        if (!points || points.length === 0) return false;
        
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            if (
                point.x >= rect.x &&
                point.x <= rect.x + rect.width &&
                point.y >= rect.y &&
                point.y <= rect.y + rect.height
            ) {
                return true;
            }
        }
        
        return false;
    }
};

// Store in the global namespace for access from other modules
window.LP.helpers = helpers;