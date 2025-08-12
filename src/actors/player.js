// Global namespace for the game
window.LP = window.LP || {};

import { createGameObject } from './gameObject';
import { helpers } from '../engine/helpers';
import { math } from '../engine/math';

// Player class
export const createPlayer = (options, myProps = {}) => {
    // Set default radius
    options.radius = options.radius || 5;

    // Default properties
    const my = {
        name: "player",
        ...myProps
    };

    // Create base game object
    const that = createGameObject(options, my);

    // Player specific properties
    that.lives = options.lives || 3;
    that.points = 0;

    // Input reference
    const input = options.input;

    // Player state variables
    let lastPathX = 0;
    let lastPathY = 0;
    let isFiring = false;
    let haveJustDied = false;
    let dieTime = null;
    let mapPointsCache = {};

    // Create player canvas for drawing the map
    // Verificar que canvasW y canvasH son valores válidos
    if (!that.canvasW || isNaN(that.canvasW) || that.canvasW <= 0) {
        console.error("Invalid canvasW value:", that.canvasW);
        that.canvasW = 512; // Valor predeterminado
    }

    if (!that.canvasH || isNaN(that.canvasH) || that.canvasH <= 0) {
        console.error("Invalid canvasH value:", that.canvasH);
        that.canvasH = 384; // Valor predeterminado
    }

    console.log("Initializing player with canvas dimensions:", that.canvasW, "x", that.canvasH);

    const playerCanvas = createCanvas(that.canvasW, that.canvasH);
    const ctxPlayer = playerCanvas.getContext('2d');
    const map = new Array(that.canvasW * that.canvasH);

    // Inicializar el mapa con valores predeterminados
    for (let i = 0; i < map.length; i++) {
        map[i] = 'F'; // Inicializar todo como 'F' (Filled)
    }

    let imgData;
    try {
        // Obtener los datos de imagen
        imgData = ctxPlayer.getImageData(0, 0, that.canvasW, that.canvasH);
    } catch (error) {
        console.error("Error getting image data:", error);
        // Crear un imgData vacío como fallback
        imgData = {
            data: new Uint8ClampedArray(that.canvasW * that.canvasH * 4)
        };
    }

    // Helper function to create a canvas
    function createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    // Update method
    const update = (tFrame, dt) => {
        // If 5 seconds passed since we died, we are fully back in life now
        if (haveJustDied && (tFrame - dieTime > 5 * 1000)) {
            that.log("haveJustDied set to false");
            haveJustDied = false;
        }

        that.previousX = that.x;
        that.previousY = that.y;

        // Handle input
        if (input.left && that.x > 0) {
            that.x = Math.max(0, that.x - that.speed);
        }

        if (input.right && that.x < that.canvasW) {
            that.x = Math.min(that.canvasW, that.x + that.speed);
        }

        if (input.up && that.y > 0) {
            that.y = Math.max(0, that.y - that.speed);
        }

        if (input.down && that.y < that.canvasH) {
            that.y = Math.min(that.canvasH, that.y + that.speed);
        }

        isFiring = input.fire;

        const previousPoint = map[that.previousX + that.canvasW * that.previousY];
        const currentPoint = map[that.x + that.canvasW * that.y];

        // If it's firing we update the path, otherwise he can't move outside
        if (isFiring) {
            // Nothing more to calculate
            if (that.previousX === that.x && that.previousY === that.y) return;

            if (currentPoint === 'T' || currentPoint === 'E') {
                // We have bit our own tail or the pixel was empty
                that.x = that.previousX;
                that.y = that.previousY;
            } else if (currentPoint === 'P') {
                lastPathY = that.y;
                lastPathX = that.x;

                if (previousPoint !== 'P') {
                    that.log("path closed!", previousPoint);

                    // Transform all temporal paths into final paths
                    // Bug Handling - This is a workaround for a bug in the original code
                    let percentageCleared = replaceValuesInMap('T', 'B');

                    // Find vectors for flood fill
                    const dx = (that.x - that.previousX) * -1;
                    const dy = (that.y - that.previousY) * -1;

                    // Fill two zones
                    let zone1 = 0;
                    for (let backSteps = 0; backSteps < 3; ++backSteps) {
                        zone1 += floodFill(
                            map,
                            that.canvasW,
                            (that.previousX + dx * backSteps) - dy,
                            (that.previousY + dy * backSteps) + dx,
                            'F',
                            '1'
                        );
                    }

                    let zone2 = 0;
                    for (let backSteps = 0; backSteps < 3; ++backSteps) {
                        zone2 += floodFill(
                            map,
                            that.canvasW,
                            (that.previousX + dx * backSteps) + dy,
                            (that.previousY + dy * backSteps) - dx,
                            'F',
                            '2'
                        );
                    }

                    // Bug handling
                    if (zone1 === 0 || zone2 === 0) {
                        map[that.y * that.canvasW + that.x] = 'X';

                        // Debug output
                        for (let i = 0; i < map.length; i += that.canvasW) {
                            that.log(map.slice(i, i + that.canvasW).join(""));
                        }

                        map[that.y * that.canvasW + that.x] = 'P';

                        replaceValuesInMap('1', 'F');
                        replaceValuesInMap('2', 'F');
                        replaceValuesInMap('B', 'T');
                        respawn();

                        if (window.LP && window.LP.engine) {
                            // window.LP.engine.showMessage("Sorry, I should fix that bug!");
                        }
                        return;
                    }

                    replaceValuesInMap('B', 'P');

                    // Choose the smallest zone
                    percentageCleared += replaceValuesInMap(zone1 < zone2 ? '1' : '2', 'E');
                    replaceValuesInMap(zone1 < zone2 ? '2' : '1', 'F');

                    // Replace all paths with E, then stroke the borders
                    replaceValuesInMap('P', 'E');
                    strokeAreaEdges(map, that.canvasW, 'E', 'P');

                    // Handle game points and notify engine
                    percentageCleared = Math.round(percentageCleared / map.length * 100);
                    addPointsByAreaCleared(percentageCleared);

                    if (window.LP && window.LP.engine) {
                        window.LP.engine.areaCleared(percentageCleared);
                    }
                }
            } else {
                // We are just drawing
                map[that.x + that.canvasW * that.y] = 'T';
                clearMapPointsCache();
            }
        } else if (currentPoint === 'P') {
            // We are just walking on a path
            lastPathY = that.y;
            lastPathX = that.x;
        } else if (previousPoint === 'T') {
            // We were drawing, but we stop without closing a path, just respawn
            respawn();
        } else {
            // We are not drawing, and we are trying to walk outside a path, we can't do that
            that.x = that.previousX;
            that.y = that.previousY;
        }
    };

    // Render method
    const render = (canvasContext) => {
        try {
            // Verificar que el contexto del canvas existe
            if (!canvasContext) {
                console.error("Canvas context is undefined");
                return;
            }

            // Actualizar el canvas del jugador desde el mapa
            updatePlayerCanvasFromMap();

            // Verificar que playerCanvas existe
            if (!playerCanvas) {
                console.error("Player canvas is undefined");
                return;
            }

            // Dibujar el canvas del jugador
            try {
                canvasContext.drawImage(playerCanvas, 0, 0);
            } catch (error) {
                console.error("Error drawing player canvas:", error);
            }

            // Dibujar el jugador
            try {
                canvasContext.globalAlpha = haveJustDied ? 0.5 : 1;
                canvasContext.fillStyle = isFiring ? "orange" : "green";
                canvasContext.fillRect(that.x - that.radius, that.y - that.radius, that.radius * 2, that.radius * 2);
                canvasContext.globalAlpha = 1;
            } catch (error) {
                console.error("Error drawing player:", error);
            }
        } catch (error) {
            console.error("Error in player render:", error);
        }
    };

    // Check collision with enemies
    const checkCollision = (badguyHitbox, tFrame) => {
        if (!isFiring || haveJustDied ||
            (!helpers.areColliding(that.getHitbox(), badguyHitbox) &&
                !isCollidingTemporalPath(badguyHitbox))) return false;

        // We got hit!
        --that.lives;

        haveJustDied = true;
        dieTime = tFrame;
        respawn();

        if (window.LP && window.LP.engine) {
            window.LP.engine.showMessage("Ouch!");
        }

        if (window.LP && window.LP.audioEngine) {
            window.LP.audioEngine.trigger("touched");
        }

        that.log("Hit! Remaining lives: ", that.lives, tFrame);

        if (that.lives === 0 && window.LP && window.LP.engine) {
            window.LP.engine.playerDied();
        }

        return true;
    };

    // Reset the player
    const reset = () => {
        replaceValuesInMap(null, 'F');

        that.lives = 3;
        haveJustDied = false;

        generateRandomClearedZone();
    };

    // Check if an enemy is colliding with the path
    const isCollidingPath = (badguyHitbox) => {
        return helpers.isCollidingPoints(badguyHitbox, getMapPoints('P'));
    };

    // Get filled map points
    const getFilledMapPoints = () => {
        try {
            return getMapPoints('F') || [];
        } catch (error) {
            console.error("Error in getFilledMapPoints:", error);
            return [];
        }
    };

    // Get empty map points
    const getEmptyMapPoints = () => {
        try {
            return getMapPoints('E') || [];
        } catch (error) {
            console.error("Error in getEmptyMapPoints:", error);
            return [];
        }
    };

    // Replace values in the map
    const replaceValuesInMap = (oldVal, newVal) => {
        let replacedCount = 0;

        for (let i = map.length - 1; i >= 0; i--) {
            if (!oldVal || map[i] === oldVal) {
                map[i] = newVal;
                ++replacedCount;
            }
        }

        if (replacedCount > 0) clearMapPointsCache();
        return replacedCount;
    };

    // Update the player canvas from the map
    const updatePlayerCanvasFromMap = () => {
        try {
            // Verificar que imgData y data existen
            if (!imgData || !imgData.data) {
                console.error("imgData or imgData.data is undefined");
                return;
            }

            const data = imgData.data;

            // Verificar que map existe y tiene elementos
            if (!map || !Array.isArray(map) || map.length === 0) {
                console.error("Map is not properly initialized");
                return;
            }

            for (let i = map.length - 1; i >= 0; i--) {
                // Verificar que el índice es válido para data
                if (i * 4 + 3 >= data.length) {
                    console.error("Index out of bounds for imgData.data:", i * 4 + 3, "length:", data.length);
                    continue;
                }

                switch (map[i]) {
                    case 'E': // Empty
                        data[i * 4 + 3] = 0; // Transparent
                        break;
                    case 'F': // Filled
                        data[i * 4] = 0; // Dark Blue, 100% opaque
                        data[i * 4 + 1] = 0;
                        data[i * 4 + 2] = 100;
                        data[i * 4 + 3] = 255;
                        break;
                    case 'P': // Path
                        data[i * 4] = 255; // White, 100% opaque
                        data[i * 4 + 1] = 255;
                        data[i * 4 + 2] = 255;
                        data[i * 4 + 3] = 255;
                        break;
                    case 'T': // Temporal path
                        data[i * 4] = 0; // Green, 100% opaque
                        data[i * 4 + 1] = 255;
                        data[i * 4 + 2] = 0;
                        data[i * 4 + 3] = 255;
                        break;
                    default:
                        // Para cualquier otro valor, usar un color predeterminado
                        data[i * 4] = 128; // Gris, 100% opaque
                        data[i * 4 + 1] = 128;
                        data[i * 4 + 2] = 128;
                        data[i * 4 + 3] = 255;
                }
            }

            // Actualizar el canvas con los datos de imagen
            ctxPlayer.putImageData(imgData, 0, 0);
        } catch (error) {
            console.error("Error in updatePlayerCanvasFromMap:", error);
        }
    };

    // Generate a random cleared zone
    const generateRandomClearedZone = () => {
        // Generate a random cleared zone of a random width and height between 2 and 15% of the canvas dimensions
        const width = Math.floor(that.canvasW * math.getRandomArbitrary(0.02, 0.15));
        const height = Math.floor(that.canvasH * math.getRandomArbitrary(0.02, 0.15));
        const x = math.getRandomInt(0, that.canvasW - that.radius);
        const y = math.getRandomInt(0, that.canvasH - that.radius);
        let pixelsCleared = 0;

        that.log("generateRandomClearedZone", x, y, width, height);

        for (let xIndex = x; xIndex < x + width; xIndex++) {
            for (let yIndex = y; yIndex < y + height; yIndex++) {
                map[yIndex * that.canvasW + xIndex] = 'E';
                ++pixelsCleared;
            }
        }

        strokeAreaEdges(map, that.canvasW, 'E', 'P');

        that.x = x;
        that.y = y;
        lastPathX = that.x;
        lastPathY = that.y;

        if (window.LP && window.LP.engine) {
            window.LP.engine.areaCleared(Math.round(pixelsCleared / map.length * 100));
        }
    };

    // Flood fill algorithm
    const floodFill = (mapData, mapWidth, startingX, startingY, oldVal, newVal) => {
        const pixelStack = [{ x: startingX, y: startingY }];
        let pixelsFilled = 0;

        while (pixelStack.length > 0) {
            const current = pixelStack.pop();
            const index = current.y * mapWidth + current.x;

            if (mapData[index] !== oldVal) continue;

            mapData[index] = newVal;
            pixelsFilled++;

            // We don't bother checking limits, undefined will be different from oldVal
            pixelStack.push({ x: current.x + 1, y: current.y }); // right
            pixelStack.push({ x: current.x - 1, y: current.y }); // left
            pixelStack.push({ x: current.x, y: current.y + 1 }); // up
            pixelStack.push({ x: current.x, y: current.y - 1 }); // down
        }

        clearMapPointsCache();
        return pixelsFilled;
    };

    // Stroke area edges
    const strokeAreaEdges = (mapData, mapWidth, innerVal, borderVal) => {
        let x = 0;
        let y = 0;
        let left, top, right, bottom, topLeft, topRight, bottomLeft, bottomRight;
        const pixelStack = [];
        const mapHeight = mapData.length / mapWidth;

        for (y = 0; y < mapHeight; y++) {
            for (x = 0; x < mapWidth; x++) {
                const index = (x + y * mapWidth);
                const pixel = mapData[index];

                // We want to detect edges from the area with innerVal to the outside
                if (pixel !== innerVal) continue;

                // Get the values of the eight surrounding pixels
                left = mapData[index - 1];
                right = mapData[index + 1];
                top = mapData[index - mapWidth];
                bottom = mapData[index + mapWidth];
                topLeft = mapData[index - mapWidth - 1];
                topRight = mapData[index - mapWidth + 1];
                bottomLeft = mapData[index + mapWidth - 1];
                bottomRight = mapData[index + mapWidth + 1];

                // Compare it all and save pixels to modify later
                if (pixel !== left || pixel !== right || pixel !== top || pixel !== bottom ||
                    pixel !== topLeft || pixel !== topRight || pixel !== bottomLeft || pixel !== bottomRight) {
                    pixelStack.push(index);
                }
            }
        }

        // We finally stroke (paint) the borders
        for (let i = pixelStack.length - 1; i >= 0; i--) {
            mapData[pixelStack[i]] = borderVal;
        }

        clearMapPointsCache();
    };

    // Check if an enemy is colliding with the temporal path
    const isCollidingTemporalPath = (badguyHitbox) => {
        return isFiring ? helpers.isCollidingPoints(badguyHitbox, getMapPoints('T')) : false;
    };

    // Get map points of a specific type
    const getMapPoints = (type) => {
        // Verificar si ya tenemos los puntos en caché
        if (mapPointsCache[type]) return mapPointsCache[type];

        const points = [];

        // Verificar que el mapa existe
        if (!map || !Array.isArray(map)) {
            console.error("Map is not properly initialized");
            return points;
        }

        // Verificar que canvasW es un número válido
        if (!that.canvasW || isNaN(that.canvasW) || that.canvasW <= 0) {
            console.error("Invalid canvasW value:", that.canvasW);
            return points;
        }

        try {
            for (let i = map.length - 1; i >= 0; i--) {
                if (map[i] === type) {
                    const y = Math.floor(i / that.canvasW);
                    const x = i % that.canvasW;
                    points.push({ x: x, y: y });
                }
            }

            // Guardar en caché para futuras llamadas
            mapPointsCache[type] = points;
            return points;
        } catch (error) {
            console.error("Error in getMapPoints:", error);
            return [];
        }
    };

    // Resets the path and go back to last path known
    const respawn = () => {
        // Transform all temporal paths into filled
        replaceValuesInMap('T', 'F');
        that.x = lastPathX;
        that.y = lastPathY;
    };

    // Add points based on area cleared
    const addPointsByAreaCleared = (percentageCleared) => {
        let pointsMultiplier;

        if (percentageCleared <= 1) {
            pointsMultiplier = 1;
        } else if (percentageCleared <= 2) {
            pointsMultiplier = 3;
        } else if (percentageCleared <= 10) {
            pointsMultiplier = 5;
        } else if (percentageCleared <= 50) {
            pointsMultiplier = 10;
        } else if (percentageCleared <= 70) {
            pointsMultiplier = 30;
        } else {
            pointsMultiplier = 50;
        }

        that.points += percentageCleared * pointsMultiplier;
    };

    // Clear map points cache
    const clearMapPointsCache = () => {
        mapPointsCache = {};
    };

    // Override base methods
    that.update = update;
    that.render = render;

    // Add player-specific methods
    that.checkCollision = checkCollision;
    that.reset = reset;
    that.isCollidingPath = isCollidingPath;
    that.getFilledMapPoints = getFilledMapPoints;
    that.getEmptyMapPoints = getEmptyMapPoints;

    // Initialize the player
    reset();

    return that;
};

// Store in the global namespace for access from other modules
window.LP.player = createPlayer;