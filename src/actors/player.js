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

    // Movement direction tracking (for restricting diagonal movement)
    let currentMoveDirection = null; // 'horizontal', 'vertical', or null

    // Direction facing (0: down, 1: right, 2: up, 3: left)
    let currentDirection = 0;

    // Animation properties
    const idleSprite = new Image();
    idleSprite.src = 'assets/sprites/sunnyside_world_human_idle_movement_4_direction.png';

    const walkSprite = new Image();
    walkSprite.src = 'assets/sprites/sunnyside_world_human_run_movement_4_direction.png';

    // Idle sprite: 4 rows x 4 columns
    const idleRows = 4;
    const idleCols = 4;

    // Walk sprite: 4 rows x 8 columns
    const walkRows = 4;
    const walkCols = 8;

    // Animation variables
    let currentFrame = 0;
    let frameCounter = 0;
    const frameDelay = 6; // Velocidad de la animación
    let isMoving = false;

    // Sprite dimensions (will be calculated when images load)
    let idleFrameWidth = 0;
    let idleFrameHeight = 0;
    let walkFrameWidth = 0;
    let walkFrameHeight = 0;

    // Wait for sprites to load
    idleSprite.onload = () => {
        idleFrameWidth = idleSprite.width / idleCols;
        idleFrameHeight = idleSprite.height / idleRows;
    };

    walkSprite.onload = () => {
        walkFrameWidth = walkSprite.width / walkCols;
        walkFrameHeight = walkSprite.height / walkRows;
    };

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
        that.canvasW = 300; // Valor predeterminado ajustado para 600x600
    }

    if (!that.canvasH || isNaN(that.canvasH) || that.canvasH <= 0) {
        console.error("Invalid canvasH value:", that.canvasH);
        that.canvasH = 300; // Valor predeterminado ajustado para 600x600
    }
 
    console.log("Initializing player with canvas dimensions:", that.canvasW, "x", that.canvasH);

    const playerCanvas = createCanvas(that.canvasW, that.canvasH);
    const ctxPlayer = playerCanvas.getContext('2d');

    // Asegurarse de que el tamaño del mapa sea correcto
    const mapSize = that.canvasW * that.canvasH;
    const map = new Array(mapSize);

    // Inicializar el mapa con valores predeterminados
    for (let i = 0; i < map.length; i++) {
        map[i] = 'F'; // Inicializar todo como 'F' (Filled)
    }

    let imgData;
    try {
        // Obtener los datos de imagen con el tamaño correcto
        imgData = ctxPlayer.getImageData(0, 0, that.canvasW, that.canvasH);

        // Verificar que el tamaño de imgData.data es correcto (4 bytes por pixel)
        if (imgData.data.length !== mapSize * 4) {
            console.error("imgData size mismatch:", imgData.data.length, "expected:", mapSize * 4);
            // Crear un nuevo imgData con el tamaño correcto
            imgData = {
                data: new Uint8ClampedArray(mapSize * 4),
                width: that.canvasW,
                height: that.canvasH
            };
        }
    } catch (error) {
        console.error("Error getting image data:", error);
        // Crear un imgData vacío como fallback con el tamaño correcto
        imgData = {
            data: new Uint8ClampedArray(mapSize * 4),
            width: that.canvasW,
            height: that.canvasH
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

        // Determinar la dirección de movimiento basada en las teclas presionadas
        let wantsToMoveHorizontal = input.left || input.right;
        let wantsToMoveVertical = input.up || input.down;

        // Determinar si el jugador está en movimiento
        isMoving = wantsToMoveHorizontal || wantsToMoveVertical;

        // Si no hay dirección actual y el jugador quiere moverse en ambas direcciones,
        // priorizar el movimiento horizontal
        if (currentMoveDirection === null) {
            if (wantsToMoveHorizontal) {
                currentMoveDirection = 'horizontal';
            } else if (wantsToMoveVertical) {
                currentMoveDirection = 'vertical';
            }
        }
        // Si el jugador deja de presionar teclas en la dirección actual, permitir cambiar de dirección
        else if ((currentMoveDirection === 'horizontal' && !wantsToMoveHorizontal) ||
            (currentMoveDirection === 'vertical' && !wantsToMoveVertical)) {
            if (wantsToMoveHorizontal) {
                currentMoveDirection = 'horizontal';
            } else if (wantsToMoveVertical) {
                currentMoveDirection = 'vertical';
            } else {
                currentMoveDirection = null; // No se está moviendo
            }
        }

        // Aplicar movimiento según la dirección actual
        if (currentMoveDirection === 'horizontal') {
            // Solo permitir movimiento horizontal
            if (input.left && that.x > 0) {
                that.x = Math.max(0, that.x - that.speed);
                currentDirection = 2; // Izquierda (tercera fila)
            }
            if (input.right && that.x < that.canvasW) {
                that.x = Math.min(that.canvasW, that.x + that.speed);
                currentDirection = 1; // Derecha (segunda fila)
            }
        } else if (currentMoveDirection === 'vertical') {
            // Solo permitir movimiento vertical
            if (input.up && that.y > 0) {
                that.y = Math.max(0, that.y - that.speed);
                currentDirection = 3; // Arriba (cuarta fila)
            }
            if (input.down && that.y < that.canvasH) {
                that.y = Math.min(that.canvasH, that.y + that.speed);
                currentDirection = 0; // Abajo (primera fila)
            }
        }

        // Actualizar la animación
        if (isMoving) {
            frameCounter++;
            if (frameCounter >= frameDelay) {
                currentFrame = (currentFrame + 1) % walkCols;
                frameCounter = 0;
            }
        } else {
            frameCounter++;
            if (frameCounter >= frameDelay) {
                currentFrame = (currentFrame + 1) % idleCols;
                frameCounter = 0;
            }
        }

        isFiring = input.fire;

        // Asegurarse de que los índices estén dentro de los límites
        const prevIndex = Math.min(Math.floor(that.previousY) * that.canvasW + Math.floor(that.previousX), map.length - 1);
        const currIndex = Math.min(Math.floor(that.y) * that.canvasW + Math.floor(that.x), map.length - 1);

        const previousPoint = map[prevIndex];
        const currentPoint = map[currIndex];

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
                    window.LP.audioEngine.trigger("close-path");
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
                        map[Math.min(Math.floor(that.y) * that.canvasW + Math.floor(that.x), map.length - 1)] = 'X';

                        // Debug output
                        for (let i = 0; i < map.length; i += that.canvasW) {
                            //Descomentar por debug
                            // that.log(map.slice(i, i + that.canvasW).join(""));
                        }

                        map[Math.min(Math.floor(that.y) * that.canvasW + Math.floor(that.x), map.length - 1)] = 'P';

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
                // Asegurarse de que el índice esté dentro de los límites
                const safeIndex = Math.min(Math.floor(that.y) * that.canvasW + Math.floor(that.x), map.length - 1);
                map[safeIndex] = 'T';
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

            // Dibujar el jugador con animación
            try {
                canvasContext.globalAlpha = haveJustDied ? 0.5 : 1;

                // Determinar qué sprite usar (idle o walk)
                const sprite = isMoving ? walkSprite : idleSprite;
                const spriteCols = isMoving ? walkCols : idleCols;
                const frameWidth = isMoving ? walkFrameWidth : idleFrameWidth;
                const frameHeight = isMoving ? walkFrameHeight : idleFrameHeight;

                // Cada dirección tiene su propia fila en el spritesheet
                // 0: abajo, 1: derecha, 2: izquierda, 3: arriba

                // Solo dibujar si el sprite está cargado y las dimensiones son válidas
                if (sprite.complete && frameWidth > 0 && frameHeight > 0) {
                    // Calcular la posición del frame en el spritesheet
                    const sx = currentFrame * frameWidth;
                    const sy = currentDirection * frameHeight;

                    // Guardar el estado actual del contexto
                    canvasContext.save();

                    // Dibujar el sprite normalmente
                    canvasContext.drawImage(
                        sprite,
                        sx, sy, frameWidth, frameHeight,
                        that.x - that.radius, that.y - that.radius, that.radius * 2, that.radius * 2
                    );

                    // Restaurar el estado del contexto
                    canvasContext.restore();
                } else {
                    // Fallback: dibujar un rectángulo si el sprite no está listo
                    canvasContext.fillStyle = isFiring ? "orange" : "green";
                    canvasContext.fillRect(that.x - that.radius, that.y - that.radius, that.radius * 2, that.radius * 2);
                }

                canvasContext.globalAlpha = 1;
            } catch (error) {
                console.error("Error drawing player:", error);

                // Fallback: dibujar un rectángulo en caso de error
                canvasContext.fillStyle = isFiring ? "orange" : "green";
                canvasContext.fillRect(that.x - that.radius, that.y - that.radius, that.radius * 2, that.radius * 2);
            }
        } catch (error) {
            console.error("Error in player render:", error);
        }
    };

    // Check collision with enemies
    const checkCollision = (badguyHitbox, tFrame, type = "") => {
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
        currentMoveDirection = null; // Resetear la dirección de movimiento

        // Reset direction and animation
        currentDirection = 0;
        currentFrame = 0;
        frameCounter = 0;
        isMoving = false;

        // Limpiar la caché de puntos del mapa para mejorar el rendimiento
        clearMapPointsCache();

        // En lugar de generar una zona aleatoria, crear un borde limpio alrededor de toda la imagen
        createBorderPath();

        // Optimización: Pre-renderizar el mapa inicial para mejorar el rendimiento
        if (playerCanvas && ctxPlayer && imgData) {
            // Forzar una actualización inicial del canvas con un tamaño de lote más pequeño
            updatePlayerCanvasFromMap();
        }
    };

    // Crear un borde limpio alrededor de toda la imagen
    const createBorderPath = () => {
        const borderWidth = 0; // Ancho del borde en píxeles
        let pixelsCleared = 0;

        // Limpiar los bordes (crear un marco limpio)
        for (let x = 0; x < that.canvasW; x++) {
            for (let y = 0; y < that.canvasH; y++) {
                // Si el pixel está en el borde (dentro del ancho especificado)
                if (x < borderWidth || x >= that.canvasW - borderWidth ||
                    y < borderWidth || y >= that.canvasH - borderWidth) {

                    const index = y * that.canvasW + x;
                    if (index >= 0 && index < map.length) {
                        map[index] = 'E'; // Marcar como vacío
                        pixelsCleared++;
                    }
                }
            }
        }

        // Crear el camino (path) en el borde interior
        for (let x = borderWidth; x < that.canvasW - borderWidth; x++) {
            // Borde superior e inferior
            const topIndex = borderWidth * that.canvasW + x;
            const bottomIndex = (that.canvasH - borderWidth - 1) * that.canvasW + x;

            if (topIndex >= 0 && topIndex < map.length) {
                map[topIndex] = 'P';
            }

            if (bottomIndex >= 0 && bottomIndex < map.length) {
                map[bottomIndex] = 'P';
            }
        }

        for (let y = borderWidth; y < that.canvasH - borderWidth; y++) {
            // Borde izquierdo y derecho
            const leftIndex = y * that.canvasW + borderWidth;
            const rightIndex = y * that.canvasW + (that.canvasW - borderWidth - 1);

            if (leftIndex >= 0 && leftIndex < map.length) {
                map[leftIndex] = 'P';
            }

            if (rightIndex >= 0 && rightIndex < map.length) {
                map[rightIndex] = 'P';
            }
        }

        // Colocar al jugador en la esquina inferior derecha
        that.x = that.canvasW - borderWidth - 1;
        that.y = that.canvasH - borderWidth - 1;
        lastPathX = that.x;
        lastPathY = that.y;

        clearMapPointsCache();

        // Notificar al motor sobre el área limpiada
        if (window.LP && window.LP.engine) {
            const percentageCleared = Math.round(pixelsCleared / map.length * 100);
            window.LP.engine.areaCleared(percentageCleared);
        }
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
            const dataLength = data.length;

            // Verificar que map existe y tiene elementos
            if (!map || !Array.isArray(map) || map.length === 0) {
                console.error("Map is not properly initialized");
                return;
            }

            // Optimización: Procesar en lotes para mejorar el rendimiento
            const batchSize = 5000; // Tamaño del lote
            const totalPixels = map.length;
            const batches = Math.ceil(totalPixels / batchSize);

            for (let batch = 0; batch < batches; batch++) {
                const start = batch * batchSize;
                const end = Math.min(start + batchSize, totalPixels);

                for (let i = start; i < end; i++) {
                    // Verificar que el índice es válido para data
                    const pixelIndex = i * 4;
                    if (pixelIndex + 3 >= dataLength) {
                        // Saltarse este pixel si está fuera de los límites
                        continue;
                    }

                    switch (map[i]) {
                        case 'E': // Empty
                            data[pixelIndex + 3] = 0; // Transparent
                            break;
                        case 'F': // Filled
                            data[pixelIndex] = 70; // Dark Blue with transparency
                            data[pixelIndex + 1] = 70;
                            data[pixelIndex + 2] = 70;
                            data[pixelIndex + 3] = that.fullOpacity ? 255 : 245; // Opacidad configurable 
                            break;
                        case 'P': // Path
                            data[pixelIndex] = 255; // White, 100% opaque
                            data[pixelIndex + 1] = 255;
                            data[pixelIndex + 2] = 255;
                            data[pixelIndex + 3] = 255;
                            break;
                        case 'T': // Temporal path
                            data[pixelIndex] = 0; // Green, 100% opaque
                            data[pixelIndex + 1] = 255;
                            data[pixelIndex + 2] = 0;
                            data[pixelIndex + 3] = 255;
                            break;
                        default:
                            // Para cualquier otro valor, usar un color predeterminado
                            data[pixelIndex] = 128; // Gris, 100% opaque
                            data[pixelIndex + 1] = 128;
                            data[pixelIndex + 2] = 128;
                            data[pixelIndex + 3] = 255;
                    }
                }

                // Actualizar el canvas con los datos de imagen para este lote
                if (batch === batches - 1) {
                    try {
                        ctxPlayer.putImageData(imgData, 0, 0);
                    } catch (error) {
                        console.error("Error putting image data:", error);
                    }
                }
            }
        } catch (error) {
            console.error("Error in updatePlayerCanvasFromMap:", error);
        }
    };

    // Flood fill algorithm
    const floodFill = (mapData, mapWidth, startingX, startingY, oldVal, newVal) => {
        const pixelStack = [{ x: startingX, y: startingY }];
        let pixelsFilled = 0;

        while (pixelStack.length > 0) {
            const current = pixelStack.pop();

            // Verificar que las coordenadas están dentro de los límites
            if (current.x < 0 || current.x >= mapWidth ||
                current.y < 0 || current.y >= mapData.length / mapWidth) {
                continue;
            }

            const index = current.y * mapWidth + current.x;

            // Verificar que el índice está dentro de los límites
            if (index < 0 || index >= mapData.length) {
                continue;
            }

            if (mapData[index] !== oldVal) continue;

            mapData[index] = newVal;
            pixelsFilled++;

            // Verificar límites antes de añadir a la pila
            if (current.x + 1 < mapWidth) {
                pixelStack.push({ x: current.x + 1, y: current.y }); // right
            }
            if (current.x - 1 >= 0) {
                pixelStack.push({ x: current.x - 1, y: current.y }); // left
            }
            if (current.y + 1 < mapData.length / mapWidth) {
                pixelStack.push({ x: current.x, y: current.y + 1 }); // down
            }
            if (current.y - 1 >= 0) {
                pixelStack.push({ x: current.x, y: current.y - 1 }); // up
            }
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
        const mapHeight = Math.floor(mapData.length / mapWidth);

        for (y = 0; y < mapHeight; y++) {
            for (x = 0; x < mapWidth; x++) {
                const index = (x + y * mapWidth);

                // Verificar que el índice está dentro de los límites
                if (index < 0 || index >= mapData.length) {
                    continue;
                }

                const pixel = mapData[index];

                // We want to detect edges from the area with innerVal to the outside
                if (pixel !== innerVal) continue;

                // Get the values of the eight surrounding pixels with verificación de límites
                left = x > 0 ? mapData[index - 1] : null;
                right = x < mapWidth - 1 ? mapData[index + 1] : null;
                top = y > 0 ? mapData[index - mapWidth] : null;
                bottom = y < mapHeight - 1 ? mapData[index + mapWidth] : null;
                topLeft = (x > 0 && y > 0) ? mapData[index - mapWidth - 1] : null;
                topRight = (x < mapWidth - 1 && y > 0) ? mapData[index - mapWidth + 1] : null;
                bottomLeft = (x > 0 && y < mapHeight - 1) ? mapData[index + mapWidth - 1] : null;
                bottomRight = (x < mapWidth - 1 && y < mapHeight - 1) ? mapData[index + mapWidth + 1] : null;

                // Compare it all and save pixels to modify later
                if (pixel !== left || pixel !== right || pixel !== top || pixel !== bottom ||
                    pixel !== topLeft || pixel !== topRight || pixel !== bottomLeft || pixel !== bottomRight) {
                    pixelStack.push(index);
                }
            }
        }

        // We finally stroke (paint) the borders
        for (let i = 0; i < pixelStack.length; i++) {
            const index = pixelStack[i];
            if (index >= 0 && index < mapData.length) {
                mapData[index] = borderVal;
            }
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
            for (let i = 0; i < map.length; i++) {
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
        currentMoveDirection = null; // Resetear la dirección de movimiento al respawn 
        console.log("Respawned at:", that.x, that.y);
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