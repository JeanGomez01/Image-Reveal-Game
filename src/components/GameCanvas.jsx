import { useEffect, useRef, useState } from 'react';
import { enemies } from '../actors/enemy.model';
const sizeGameImage = 600

const GameCanvas = () => {
    const [gameState, setGameState] = useState('playing');
    const canvasRef = useRef(null);
    const player = useRef({ x: 0, y: 0, size: 10, speed: 2 });
    const revealedPixels = useRef([]);
    const isDrawing = useRef(false);
    const trail = useRef([]);
    const lastDirection = useRef(null);
    const movementGrid = useRef([]);

    const initMovementGrid = (canvas) => {
        const grid = [];
        const gridSize = 10;

        for (let y = 0; y < canvas.height; y += gridSize) {
            const row = [];
            for (let x = 0; x < canvas.width; x += gridSize) {
                // Permitir solo bordes y posición inicial del jugador
                const isBorder = x === 0 || x >= canvas.width - gridSize ||
                    y === 0 || y >= canvas.height - gridSize ||
                    (x === 0 && y === Math.floor(canvas.height / 2 / gridSize) * gridSize);
                row.push(isBorder ? 1 : 0);
            }
            grid.push(row);
        }
        return grid;
    };
    const isPositionAllowed = (x, y) => {
        if (isDrawing.current) return true; // Permitir movimiento libre mientras dibuja

        const gridX = Math.floor(x / 10);
        const gridY = Math.floor(y / 10);

        // Verificar límites del grid
        if (gridY < 0 || gridY >= movementGrid.current.length ||
            gridX < 0 || gridX >= movementGrid.current[0].length) {
            return false;
        }

        return movementGrid.current[gridY][gridX] === 1;
    };
    const updateMovementGrid = (canvas) => {
        const newGrid = Array(movementGrid.current.length)
            .fill()
            .map(() => Array(movementGrid.current[0].length).fill(0));

        // Marcamos las celdas permitidas (bordes y bordes de áreas no reveladas)
        for (let y = 0; y < movementGrid.current.length; y++) {
            for (let x = 0; x < movementGrid.current[0].length; x++) {
                const isRevealed = revealedPixels.current.some(p =>
                    Math.floor(p.x / 10) === x && Math.floor(p.y / 10) === y
                );

                // Permitir en bordes del canvas o bordes de áreas no reveladas
                const isAllowed = !isRevealed && (
                    x === 0 || x === movementGrid.current[0].length - 1 ||
                    y === 0 || y === movementGrid.current.length - 1 ||
                    // Celda adyacente a un área revelada
                    (x > 0 && revealedPixels.current.some(p => Math.floor(p.x / 10) === x - 1 && Math.floor(p.y / 10) === y)) ||
                    (x < movementGrid.current[0].length - 1 && revealedPixels.current.some(p => Math.floor(p.x / 10) === x + 1 && Math.floor(p.y / 10) === y)) ||
                    (y > 0 && revealedPixels.current.some(p => Math.floor(p.x / 10) === x && Math.floor(p.y / 10) === y - 1)) ||
                    (y < movementGrid.current.length - 1 && revealedPixels.current.some(p => Math.floor(p.x / 10) === x && Math.floor(p.y / 10) === y + 1))
                );

                newGrid[y][x] = isAllowed ? 1 : 0;
            }
        }

        movementGrid.current = newGrid;
    };


    function intersectsCircleAndLine(cx, cy, radius, p1, p2) {
        const acx = cx - p1.x
        const acy = cy - p1.y
        const abx = p2.x - p1.x
        const aby = p2.y - p1.y
        const abLen = Math.sqrt(abx * abx + aby * aby)
        const abUnitX = abx / abLen
        const abUnitY = aby / abLen
        const proj = acx * abUnitX + acy * abUnitY
        let closestX, closestY

        if (proj < 0) {
            closestX = p1.x
            closestY = p1.y
        } else if (proj > abLen) {
            closestX = p2.x
            closestY = p2.y
        } else {
            closestX = p1.x + abUnitX * proj
            closestY = p1.y + abUnitY * proj
        }

        const dx = cx - closestX
        const dy = cy - closestY
        return dx * dx + dy * dy <= radius * radius
    }

    function isAreaClosed(trail) {
        if (trail.length < 4) return false;

        const first = trail[0];
        const last = trail[trail.length - 1];

        // Verificar si el último punto está cerca del primero (cierre)
        const distance = Math.sqrt(
            Math.pow(last.x - first.x, 2) +
            Math.pow(last.y - first.y, 2)
        );

        return distance < 20; // Umbral de cierre
    }
    function fillClosedArea(trail, ctx, image, canvas) {
        // Crear un canvas temporal para el relleno
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Dibujar el camino cerrado
        tempCtx.beginPath();
        tempCtx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
            tempCtx.lineTo(trail[i].x, trail[i].y);
        }
        tempCtx.closePath();

        // Rellenar el área
        tempCtx.fillStyle = 'red';
        tempCtx.fill();

        // Obtener los píxeles del área
        const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);

        // Agregar los píxeles revelados
        for (let y = 0; y < canvas.height; y += 10) {
            for (let x = 0; x < canvas.width; x += 10) {
                const index = (y * canvas.width + x) * 4;
                if (imageData.data[index] === 255) { // Si es parte del área rellena
                    revealedPixels.current.push({ x, y });
                }
            }
        }
    }
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const keys = {};

        const image = new Image();
        image.src = '/image2.jpg';

        movementGrid.current = initMovementGrid(canvas);

        const handleKeyDown = (e) => {
            if (!keys[e.key]) {
                keys[e.key] = true;

                // Actualizar última dirección presionada
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    lastDirection.current = 'vertical';
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    lastDirection.current = 'horizontal';
                }

                if (e.key.toLowerCase() === 'a') {  // Detecta tanto 'P' como 'p'
                    isDrawing.current = true;
                    updateMovementGrid(canvas);
                }
            }
        };

        const handleKeyUp = (e) => {
            keys[e.key] = false;

            // Resetear dirección si se suelta la tecla
            if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !keys['ArrowUp'] && !keys['ArrowDown']) {
                lastDirection.current = null;
            } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !keys['ArrowLeft'] && !keys['ArrowRight']) {
                lastDirection.current = null;
            }
        };

        const drawImage = () => {
            const canvasRatio = canvas.width / canvas.height;
            const imageRatio = image.width / image.height;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (imageRatio > canvasRatio) {
                // Imagen más ancha que el canvas
                drawHeight = canvas.height;
                drawWidth = image.width * (drawHeight / image.height);
                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = 0;
            } else {
                // Imagen más alta que el canvas
                drawWidth = canvas.width;
                drawHeight = image.height * (drawWidth / image.width);
                offsetX = 0;
                offsetY = (canvas.height - drawHeight) / 2;
            }

            ctx.drawImage(
                image,
                0, 0, image.width, image.height,
                offsetX, offsetY, drawWidth, drawHeight
            );
        };

        const drawCover = () => {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        const drawRevealedZones = () => {
            revealedPixels.current.forEach(pos => {
                // Calcula la posición relativa en la imagen original
                const srcX = (pos.x / canvas.width) * image.width;
                const srcY = (pos.y / canvas.height) * image.height;
                const srcSizeX = (10 / canvas.width) * image.width;
                const srcSizeY = (10 / canvas.height) * image.height;

                ctx.drawImage(
                    image,
                    srcX, srcY, srcSizeX, srcSizeY,
                    pos.x, pos.y, 10, 10
                );
            });
        };

        const drawTrail = () => {
            if (trail.current.length < 2) return;
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(trail.current[0].x + 5, trail.current[0].y + 5);
            for (let i = 1; i < trail.current.length; i++) {
                ctx.lineTo(trail.current[i].x + 5, trail.current[i].y + 5);
            }
            ctx.stroke();
        };

        const drawPlayer = () => {
            ctx.fillStyle = 'orange';
            ctx.fillRect(player.current.x, player.current.y, player.current.size, player.current.size);
        };

        const update = () => {
            const p = player.current;
            const prevX = p.x;
            const prevY = p.y;

            // Movimiento restringido a horizontal o vertical (sin diagonales)
            if (lastDirection.current === 'horizontal') {
                if (keys['ArrowLeft']) p.x -= p.speed;
                if (keys['ArrowRight']) p.x += p.speed;
            } else if (lastDirection.current === 'vertical') {
                if (keys['ArrowUp']) p.y -= p.speed;
                if (keys['ArrowDown']) p.y += p.speed;
            } else {
                // Permitir iniciar movimiento en cualquier dirección
                if (keys['ArrowLeft']) { p.x -= p.speed; lastDirection.current = 'horizontal'; }
                if (keys['ArrowRight']) { p.x += p.speed; lastDirection.current = 'horizontal'; }
                if (keys['ArrowUp']) { p.y -= p.speed; lastDirection.current = 'vertical'; }
                if (keys['ArrowDown']) { p.y += p.speed; lastDirection.current = 'vertical'; }
            }

            // Limitar dentro del canvas
            p.x = Math.max(0, Math.min(canvas.width - p.size, p.x));
            p.y = Math.max(0, Math.min(canvas.height - p.size, p.y));

            // Verificar posición permitida (con reglas diferentes cuando está dibujando)
            if (!isPositionAllowed(p.x, p.y, isDrawing.current)) {
                p.x = prevX;
                p.y = prevY;
                return; // Salir si el movimiento no está permitido
            }

            // Guardar trazo si está dibujando
            if (isDrawing.current) {
                const pos = {
                    x: Math.floor(p.x / 10) * 10,
                    y: Math.floor(p.y / 10) * 10
                };

                // Evitar duplicados consecutivos
                const last = trail.current[trail.current.length - 1];
                if (!last || last.x !== pos.x || last.y !== pos.y) {
                    trail.current.push(pos);
                }

                // Verificar si se cerró el área
                if (isAreaClosed(trail.current)) {
                    fillClosedArea(trail.current, ctx, image, canvas);
                    trail.current = [];
                    isDrawing.current = false;
                    updateMovementGrid(canvas); // Actualizar áreas permitidas
                }
            }
        };

        const gameLoop = () => {
            if (gameState !== 'playing') return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawImage();
            drawCover();
            drawRevealedZones();
            update();
            drawTrail();
            drawPlayer();
            // Enemigos
            for (const enemy of enemies) {
                // Movimiento
                enemy.x += enemy.vx;
                enemy.y += enemy.vy;

                // Rebote con bordes
                if (enemy.x < enemy.radius || enemy.x > canvas.width - enemy.radius) {
                    enemy.vx *= -1;
                }
                if (enemy.y < enemy.radius || enemy.y > canvas.height - enemy.radius) {
                    enemy.vy *= -1;
                }

                // Dibujar enemigo
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.radius, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();

                // Colisión con línea en construcción
                if (trail.current.length > 1) {
                    for (let i = 0; i < trail.current.length - 1; i++) {
                        const p1 = trail.current[i];
                        const p2 = trail.current[i + 1];
                        if (intersectsCircleAndLine(enemy.x, enemy.y, enemy.radius, p1, p2)) {
                            setGameState('lost');
                            return;
                        }
                    }
                }
            }

            requestAnimationFrame(gameLoop);


        };


        image.onload = () => {
            player.current.x = 0;
            player.current.y = canvas.height / 2;
            gameLoop();
        };


        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return (
        <>  <canvas
            ref={canvasRef}
            width={sizeGameImage}
            height={sizeGameImage}
            style={{
                border: '2px solid #000',
                backgroundColor: 'black',
                imageRendering: 'pixelated'  // <- añade esta línea
            }}
        />
            {gameState === 'lost' && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'red',
                        fontSize: '2rem',
                        padding: '1rem 2rem',
                        borderRadius: '10px',
                        textAlign: 'center'
                    }}
                >
                    💥 ¡Has perdido!
                    <br />
                    <button onClick={() => window.location.reload()}>Reintentar</button>
                </div>
            )}
        </>
    );
};

export default GameCanvas;
