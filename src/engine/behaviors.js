// Global namespace for the game
window.LP = window.LP || {};

// Behaviors module for reusable game behaviors
export const behaviors = {
    // Bounce behavior - makes an object bounce off walls
    bounce: (obj) => {
        const bounceX = obj.x < obj.radius || obj.x > obj.canvasW - obj.radius;
        const bounceY = obj.y < obj.radius || obj.y > obj.canvasH - obj.radius;
        
        if (bounceX) {
            obj.directionX *= -1;
            obj.x = Math.max(obj.radius, Math.min(obj.canvasW - obj.radius, obj.x));
        }
        
        if (bounceY) {
            obj.directionY *= -1;
            obj.y = Math.max(obj.radius, Math.min(obj.canvasH - obj.radius, obj.y));
        }
        
        return bounceX || bounceY;
    },
    
    // Follow behavior - makes an object follow a target
    follow: (obj, target, speed = 1) => {
        if (!target) return false;
        
        const dx = target.x - obj.x;
        const dy = target.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            obj.directionX = dx / distance;
            obj.directionY = dy / distance;
            
            obj.x += obj.directionX * speed;
            obj.y += obj.directionY * speed;
            
            return true;
        }
        
        return false;
    },
    
    // Wander behavior - makes an object move randomly
    wander: (obj, speed = 1, changeDirectionChance = 0.01) => {
        // Randomly change direction
        if (Math.random() < changeDirectionChance) {
            const angle = Math.random() * Math.PI * 2;
            obj.directionX = Math.cos(angle);
            obj.directionY = Math.sin(angle);
        }
        
        // Move in the current direction
        obj.x += obj.directionX * speed;
        obj.y += obj.directionY * speed;
        
        return true;
    }
};

// Store in the global namespace for access from other modules
window.LP.behaviors = behaviors;