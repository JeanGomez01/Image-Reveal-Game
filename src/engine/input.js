// Global namespace for the game
window.LP = window.LP || {};

// Input state object
const input = { up: false, down: false, left: false, right: false, fire: false };

// Key codes
const KEY = {
    BACKSPACE: 8,
    TAB: 9,
    RETURN: 13,
    ESC: 27,
    SPACE: 32,
    PAGEUP: 33,
    PAGEDOWN: 34,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    INSERT: 45,
    DELETE: 46,
    ZERO: 48, ONE: 49, TWO: 50, THREE: 51, FOUR: 52, FIVE: 53, SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57,
    A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90,
    TILDA: 192
};

// Handle key events
const onkey = (ev, key, pressed) => {
    switch (key) {
        case KEY.UP:
            input.up = pressed;
            ev.preventDefault();
            break;
        case KEY.DOWN:
            input.down = pressed;
            ev.preventDefault();
            break;
        case KEY.LEFT:
            input.left = pressed;
            ev.preventDefault();
            break;
        case KEY.RIGHT:
            input.right = pressed;
            ev.preventDefault();
            break;
        case KEY.SPACE:
            input.fire = pressed;
            ev.preventDefault();
            break;
        default:
            break;
    }
};
 
let gamepadIndex = null;
 
const detectGamepad = () => {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            gamepadIndex = i;
            const gamepadId = gamepads[i].id.toLowerCase();
            
            // Detectar PS5 DualSense
            if (gamepadId.includes('dualsense') || gamepadId.includes('ps5') || gamepadId.includes('054c')) {
                console.log("Mando PS5 detectado:", gamepads[i].id);
            } else {
                console.log("Gamepad detectado:", gamepads[i].id);
            }
            return true;
        }
    }
    return false;
};
 
const getGamepadInput = () => {
    if (gamepadIndex === null) return {};
    
    const gamepad = navigator.getGamepads()[gamepadIndex];
    if (!gamepad) return {};
    
    return {
        up: gamepad.axes[1] < -0.3 || gamepad.buttons[12]?.pressed,    // Stick arriba o D-pad arriba
        down: gamepad.axes[1] > 0.3 || gamepad.buttons[13]?.pressed,   // Stick abajo o D-pad abajo  
        left: gamepad.axes[0] < -0.3 || gamepad.buttons[14]?.pressed,  // Stick izquierda o D-pad izquierda
        right: gamepad.axes[0] > 0.3 || gamepad.buttons[15]?.pressed,  // Stick derecha o D-pad derecha
        fire: gamepad.buttons[0]?.pressed ||  // X (Cruz)
              gamepad.buttons[1]?.pressed ||  // Círculo  
              gamepad.buttons[2]?.pressed ||  // Cuadrado
              gamepad.buttons[3]?.pressed ||  // Triángulo
              gamepad.buttons[4]?.pressed ||  // L1
              gamepad.buttons[5]?.pressed ||  // R1
              gamepad.buttons[6] > 0.1 ||     // L2
              gamepad.buttons[7] > 0.1        // R2
    };
}; 

// Initialize input handlers
export const initInput = () => {
    // Remove any existing event listeners to prevent duplicates
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, false);
    document.addEventListener('keyup', handleKeyUp, false);
    
    console.log("input initialized");
};

// Event handler functions
function handleKeyDown(ev) {
    return onkey(ev, ev.keyCode, true);
}

function handleKeyUp(ev) {
    return onkey(ev, ev.keyCode, false);
}
 
// Get the current input state
export const getInput = () => {
    detectGamepad();
    
    const keyboardInput = {
        up: input.up,
        down: input.down,
        left: input.left,
        right: input.right,
        fire: input.fire
    };
    
    const gamepadInput = getGamepadInput();
    
    // Combinar ambos inputs (cualquiera de los dos funciona)
    return {
        up: gamepadInput.up || keyboardInput.up,
        down: gamepadInput.down || keyboardInput.down,
        left: gamepadInput.left || keyboardInput.left,
        right: gamepadInput.right || keyboardInput.right,
        fire: gamepadInput.fire || keyboardInput.fire
    };
};
// ========== FIN DE MODIFICACIÓN ==========

// Store in the global namespace for access from other modules
window.LP.initInput = initInput;
window.LP.getInput = getInput;