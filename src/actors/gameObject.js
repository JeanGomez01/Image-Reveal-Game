// Global namespace for the game
window.LP = window.LP || {};

// Base GameObject class
export const createGameObject = (options, myProps = {}) => {
    // Default properties
    const my = {
        name: "gameObject",
        fillStyle: "black",
        ...myProps
    };
    
    // Create the game object
    const that = {
        x: options.x,
        y: options.y,
        directionX: options.directionX || 1,
        directionY: options.directionY || 0,
        alive: true,
        radius: options.radius || 10,
        previousX: 0,
        previousY: 0,
        canvasW: options.canvasW,
        canvasH: options.canvasH,
        speed: options.speed || 1,
        fullOpacity: options.fullOpacity || false
    };
    
    // Hitbox for collision detection
    const hitbox = {
        x: that.x - that.radius,
        y: that.y - that.radius,
        width: that.radius * 2,
        height: that.radius * 2
    };
    
    // Update method
    const update = (tFrame, dt) => {
        if (!that.alive) return;
        savePreviousPosition();
    };
    
    // Save the previous position
    const savePreviousPosition = () => {
        that.previousX = that.x;
        that.previousY = that.y;
    };
    
    // Render method
    const render = (canvasContext) => {
        if (!that.alive) return;
        
        canvasContext.beginPath();
        canvasContext.moveTo(that.x, that.y);
        
        // Use arc instead of ellipse for better browser compatibility
        canvasContext.arc(that.x, that.y, that.radius, 0, 2 * Math.PI);
        canvasContext.fillStyle = my.fillStyle;
        canvasContext.fill();
    };
    
    // Get the hitbox for collision detection
    const getHitbox = () => {
        hitbox.x = that.x - that.radius;
        hitbox.y = that.y - that.radius;
        return hitbox;
    };
    
    // Logging method
    const log = (...args) => {
        console.log(my.name + ": ", ...args);
    };
    
    // Die method
    const die = () => {
        that.alive = false;
        log("died");
    };
    
    // Attach methods to the object
    that.update = update;
    that.savePreviousPosition = savePreviousPosition;
    that.render = render;
    that.getHitbox = getHitbox;
    that.log = log;
    that.die = die;
    
    return that;
};

// Store in the global namespace for access from other modules
window.LP.gameObject = createGameObject;