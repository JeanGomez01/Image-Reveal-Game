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
    return input;
};

// Store in the global namespace for access from other modules
window.LP.initInput = initInput;
window.LP.getInput = getInput;