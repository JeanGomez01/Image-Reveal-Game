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
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const keys = {};

        const image = new Image();
        image.src = '/image2.jpg';

        const handleKeyDown = (e) => {
            keys[e.key] = true;
            if (e.key === ' ') isDrawing.current = true; // Iniciar trazado
        };

        const handleKeyUp = (e) => {
            keys[e.key] = false;
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
            if (keys['ArrowUp']) p.y -= p.speed;
            if (keys['ArrowDown']) p.y += p.speed;
            if (keys['ArrowLeft']) p.x -= p.speed;
            if (keys['ArrowRight']) p.x += p.speed;

            // Limitar dentro del canvas
            p.x = Math.max(0, Math.min(canvas.width - p.size, p.x));
            p.y = Math.max(0, Math.min(canvas.height - p.size, p.y));

            // Guardar trazo si está dibujando
            if (isDrawing.current) {
                const pos = {
                    x: Math.floor(p.x / 10) * 10,
                    y: Math.floor(p.y / 10) * 10
                };

                // Evitar duplicados seguidos
                const last = trail.current[trail.current.length - 1];
                if (!last || last.x !== pos.x || last.y !== pos.y) {
                    trail.current.push(pos);
                }

                // Simular "cerrar zona" cuando vuelve al borde
                if (p.x === 0 || p.x === canvas.width - p.size ||
                    p.y === 0 || p.y === canvas.height - p.size) {
                    isDrawing.current = false;

                    // Marcar los puntos del trail como revelados (por ahora)
                    revealedPixels.current.push(...trail.current);
                    trail.current = [];
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
