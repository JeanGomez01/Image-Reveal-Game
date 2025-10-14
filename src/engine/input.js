// Global namespace for the game
window.LP = window.LP || {};

// Input state object
const input = { up: false, down: false, left: false, right: false, fire: false };

// Key codes
const KEY = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    SPACE: 32
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

// Keyboard event handler functions
function handleKeyDown(ev) { return onkey(ev, ev.keyCode, true); }
function handleKeyUp(ev) { return onkey(ev, ev.keyCode, false); }
 
let gamepadIndex = null;

function connectHandler(e) {
    gamepadIndex = e.gamepad.index;
    console.log(`Gamepad conectado: ${e.gamepad.id}`);
}

function disconnectHandler(e) {
    console.log(`Gamepad desconectado: ${e.gamepad.id}`);
    if (gamepadIndex === e.gamepad.index) {
        gamepadIndex = null;
    }
}
 
function pollGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

    if (!gamepads || !gamepads[gamepadIndex]) {
        return;
    }

    const gp = gamepads[gamepadIndex];
    if (!gp) return;
 
    const threshold = 0.3; // margen muerto
    const lx = gp.axes[0] || 0;
    const ly = gp.axes[1] || 0;

    input.left = lx < -threshold;
    input.right = lx > threshold;
    input.up = ly < -threshold;
    input.down = ly > threshold;
 
    const firePressed = gp.buttons[0]?.pressed || gp.buttons[7]?.pressed;
    input.fire = firePressed;
}
 
export const initInput = () => {
    // Eliminar antiguos
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('gamepadconnected', connectHandler);
    window.removeEventListener('gamepaddisconnected', disconnectHandler);

    // Registrar nuevos
    document.addEventListener('keydown', handleKeyDown, false);
    document.addEventListener('keyup', handleKeyUp, false);
    window.addEventListener('gamepadconnected', connectHandler);
    window.addEventListener('gamepaddisconnected', disconnectHandler);

    console.log("Input (teclado + mando) inicializado");
};
 
export const getInput = () => {
    // Actualiza mando en cada llamada
    pollGamepad();
    return input;
};

// Guardar en el namespace global
window.LP.initInput = initInput;
window.LP.getInput = getInput;
