import { useEffect, useRef, useState } from 'react';

const sizeGameImage = 600;

const GameCanvas = () => {
    const canvasRef = useRef(null);
    const [gameState, setGameState] = useState({
        playerX: 0,
        playerY: 0,
        isDrawing: false,
        currentPath: [],
        completedPaths: [],
        revealedArea: 0,
        gameWon: false,
        enemies: [
            { x: 300, y: 300, dx: 2, dy: 1.5, radius: 8 },
            { x: 400, y: 200, dx: -1.5, dy: 2, radius: 8 }
        ]
    });

    const imageRef = useRef(null);
    const keysPressed = useRef({});

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            imageRef.current = img;
        };
        img.src = '/image.png';

        const handleKeyDown = (e) => {
            keysPressed.current[e.key.toLowerCase()] = true;
        };

        const handleKeyUp = (e) => {
            keysPressed.current[e.key.toLowerCase()] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        const gameLoop = () => {
            updateGame();
            drawGame();
        };

        const intervalId = setInterval(gameLoop, 1000 / 60);
        return () => clearInterval(intervalId);
    }, [gameState]);

    // Función para verificar si un punto está dentro de un polígono (áreas completadas)
    const isPointInPolygon = (x, y, polygon) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (((polygon[i].y > y) !== (polygon[j].y > y)) &&
                (x < (polygon[j].x - polygon[i].x) * (y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
                inside = !inside;
            }
        }
        return inside;
    };

    // Función para verificar si un punto está en área revelada
    const isInRevealedArea = (x, y) => {
        for (let path of gameState.completedPaths) {
            if (path.length > 2 && isPointInPolygon(x, y, path)) {
                return true;
            }
        }
        return false;
    };

    // Función para verificar si un punto está en el contorno (bordes + bordes de áreas)
    const isOnContour = (x, y, tolerance = 5) => {
        // Bordes del canvas
        if (x <= tolerance || x >= sizeGameImage - tolerance ||
            y <= tolerance || y >= sizeGameImage - tolerance) {
            return true;
        }

        // Bordes de áreas completadas
        for (let path of gameState.completedPaths) {
            if (path.length > 2) {
                for (let i = 0; i < path.length - 1; i++) {
                    const dist = distanceToLineSegment(x, y, path[i], path[i + 1]);
                    if (dist <= tolerance) {
                        return true;
                    }
                }
                // Cerrar el polígono (último punto con el primero)
                const dist = distanceToLineSegment(x, y, path[path.length - 1], path[0]);
                if (dist <= tolerance) {
                    return true;
                }
            }
        }
        return false;
    };

    // Función para calcular distancia de un punto a un segmento de línea
    const distanceToLineSegment = (px, py, lineStart, lineEnd) => {
        const A = px - lineStart.x;
        const B = py - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;
        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const updateGame = () => {
        if (gameState.gameWon) return;

        setGameState(prevState => {
            const newState = { ...prevState };
            const playerSpeed = 3;

            let newX = newState.playerX;
            let newY = newState.playerY;

            const upPressed = keysPressed.current['arrowup'] || keysPressed.current['w'];
            const downPressed = keysPressed.current['arrowdown'] || keysPressed.current['s'];
            const leftPressed = keysPressed.current['arrowleft'] || keysPressed.current['a'];
            const rightPressed = keysPressed.current['arrowright'] || keysPressed.current['d'];
            const isPKeyPressed = keysPressed.current['q'];

            // Calcular nueva posición
            let targetX = newX;
            let targetY = newY;

            if (upPressed && !downPressed) {
                targetY = Math.max(0, newY - playerSpeed);
            } else if (downPressed && !upPressed) {
                targetY = Math.min(sizeGameImage, newY + playerSpeed);
            } else if (leftPressed && !rightPressed) {
                targetX = Math.max(0, newX - playerSpeed);
            } else if (rightPressed && !leftPressed) {
                targetX = Math.min(sizeGameImage, newX + playerSpeed);
            }

            // Verificar restricciones de movimiento del jugador
            let canMove = false;

            if (newState.isDrawing) {
                // Si está dibujando, puede moverse libremente en área no revelada
                canMove = !isInRevealedArea(targetX, targetY);
            } else {
                // Si no está dibujando, solo puede moverse por contornos
                canMove = isOnContour(targetX, targetY) && !isInRevealedArea(targetX, targetY);
            }

            if (canMove) {
                newX = targetX;
                newY = targetY;
            }

            // Detectar si está en el borde del canvas
            const isOnBorder = newX <= 0 || newX >= sizeGameImage || newY <= 0 || newY >= sizeGameImage;

            // Lógica de dibujo
            if (isPKeyPressed && !isOnBorder && !isInRevealedArea(newX, newY)) {
                if (!newState.isDrawing) {
                    newState.isDrawing = true;
                    newState.currentPath = [{ x: newX, y: newY }];
                } else {
                    newState.currentPath.push({ x: newX, y: newY });
                }
            } else if (newState.isDrawing && (isOnBorder || !isPKeyPressed)) {
                if (newState.currentPath.length > 10) {
                    newState.completedPaths.push([...newState.currentPath]);
                    newState.revealedArea += calculatePathArea(newState.currentPath);
                }
                newState.currentPath = [];
                newState.isDrawing = false;
            }

            newState.playerX = newX;
            newState.playerY = newY;

            // Actualizar enemigos con restricciones
            newState.enemies = newState.enemies.map(enemy => {
                let newEnemyX = enemy.x + enemy.dx;
                let newEnemyY = enemy.y + enemy.dy;

                // Verificar colisiones con bordes del canvas
                if (newEnemyX <= enemy.radius || newEnemyX >= sizeGameImage - enemy.radius) {
                    enemy.dx = -enemy.dx;
                    newEnemyX = enemy.x + enemy.dx;
                }
                if (newEnemyY <= enemy.radius || newEnemyY >= sizeGameImage - enemy.radius) {
                    enemy.dy = -enemy.dy;
                    newEnemyY = enemy.y + enemy.dy;
                }

                // Verificar si el enemigo entraría en área revelada
                if (isInRevealedArea(newEnemyX, newEnemyY)) {
                    // Rebotar si intenta entrar en área revelada
                    enemy.dx = -enemy.dx;
                    enemy.dy = -enemy.dy;
                    newEnemyX = enemy.x + enemy.dx;
                    newEnemyY = enemy.y + enemy.dy;

                    // Verificar nuevamente después del rebote
                    if (isInRevealedArea(newEnemyX, newEnemyY)) {
                        // Si aún está en área revelada, mantener posición anterior
                        newEnemyX = enemy.x;
                        newEnemyY = enemy.y;
                        // Cambiar dirección aleatoriamente
                        enemy.dx = (Math.random() - 0.5) * 4;
                        enemy.dy = (Math.random() - 0.5) * 4;
                    }
                }

                // Colisión con el path actual
                if (newState.isDrawing && newState.currentPath.length > 5) {
                    for (let point of newState.currentPath) {
                        const dist = Math.sqrt(
                            Math.pow(newEnemyX - point.x, 2) + Math.pow(newEnemyY - point.y, 2)
                        );
                        if (dist < enemy.radius + 5) {
                            newState.currentPath = [];
                            newState.isDrawing = false;
                            newState.playerX = 0;
                            newState.playerY = 0;
                            break;
                        }
                    }
                }

                return {
                    ...enemy,
                    x: newEnemyX,
                    y: newEnemyY
                };
            });

            // Verificar condición de victoria
            if (newState.revealedArea > sizeGameImage * sizeGameImage * 0.7) {
                newState.gameWon = true;
            }

            return newState;
        });
    };

    const calculatePathArea = (path) => {
        if (path.length < 3) return 0;

        let area = 0;
        for (let i = 0; i < path.length - 1; i++) {
            area += (path[i].x * path[i + 1].y - path[i + 1].x * path[i].y);
        }
        return Math.abs(area) / 2;
    };

    const drawGame = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, sizeGameImage, sizeGameImage);

        // Fondo oscuro
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, sizeGameImage, sizeGameImage);

        // Dibujar áreas reveladas
        if (imageRef.current) {
            gameState.completedPaths.forEach(path => {
                if (path.length > 2) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(path[0].x, path[0].y);
                    path.forEach(point => {
                        ctx.lineTo(point.x, point.y);
                    });
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(imageRef.current, 0, 0, sizeGameImage, sizeGameImage);
                    ctx.restore();
                }
            });
        }

        // Dibujar contornos disponibles para el jugador (visual debug - opcional)
        if (gameState.completedPaths.length > 0) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.lineWidth = 10;
            gameState.completedPaths.forEach(path => {
                if (path.length > 2) {
                    ctx.beginPath();
                    ctx.moveTo(path[0].x, path[0].y);
                    path.forEach(point => {
                        ctx.lineTo(point.x, point.y);
                    });
                    ctx.closePath();
                    ctx.stroke();
                }
            });
        }

        // Dibujar path actual
        if (gameState.currentPath.length > 1) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(gameState.currentPath[0].x, gameState.currentPath[0].y);
            gameState.currentPath.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        }

        // Dibujar paths completados (contornos)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        gameState.completedPaths.forEach(path => {
            if (path.length > 2) {
                ctx.beginPath();
                ctx.moveTo(path[0].x, path[0].y);
                path.forEach(point => {
                    ctx.lineTo(point.x, point.y);
                });
                ctx.closePath();
                ctx.stroke();
            }
        });

        // Dibujar jugador
        ctx.fillStyle = gameState.isDrawing ? '#00ff00' : '#ffffff';
        ctx.beginPath();
        ctx.arc(gameState.playerX, gameState.playerY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Indicador visual cuando está presionando P
        if (keysPressed.current['q'] && !gameState.isDrawing) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(gameState.playerX, gameState.playerY, 10, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Dibujar enemigos
        gameState.enemies.forEach(enemy => {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff6666';
            ctx.beginPath();
            ctx.arc(enemy.x - 2, enemy.y - 2, enemy.radius / 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // UI
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        const percentage = Math.min(100, (gameState.revealedArea / (sizeGameImage * sizeGameImage * 0.7)) * 100);
        ctx.fillText(`Área revelada: ${percentage.toFixed(1)}%`, 10, 25);

        ctx.fillStyle = gameState.isDrawing ? '#00ff00' : '#ffffff';
        ctx.fillText(`Dibujando: ${gameState.isDrawing ? 'SÍ' : 'NO'}`, 10, 45);
        ctx.fillText(`Áreas completadas: ${gameState.completedPaths.length}`, 10, 65);

        if (gameState.gameWon) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, sizeGameImage, sizeGameImage);

            ctx.fillStyle = '#00ff00';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('¡GANASTE!', sizeGameImage / 2, sizeGameImage / 2);

            ctx.font = '24px Arial';
            ctx.fillText('Presiona F5 para jugar de nuevo', sizeGameImage / 2, sizeGameImage / 2 + 50);
        }

        // Instrucciones
        if (gameState.completedPaths.length === 0 && !gameState.isDrawing) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Muévete solo por los contornos (bordes)', 10, sizeGameImage - 100);
            ctx.fillText('Presiona Q para adentrarte y dibujar', 10, sizeGameImage - 80);
            ctx.fillText('Los enemigos no pueden entrar en áreas reveladas', 10, sizeGameImage - 60);
            ctx.fillText('Completa 70% del área para ganar', 10, sizeGameImage - 40);
            ctx.fillText('¡Evita las esferas rojas!', 10, sizeGameImage - 20);
        }
    };

    const resetGame = () => {
        setGameState({
            playerX: 0,
            playerY: 0,
            isDrawing: false,
            currentPath: [],
            completedPaths: [],
            revealedArea: 0,
            gameWon: false,
            enemies: [
                { x: 300, y: 300, dx: 2, dy: 1.5, radius: 8 },
                { x: 400, y: 200, dx: -1.5, dy: 2, radius: 8 }
            ]
        });
    };

    return (
        <>
            <canvas
                ref={canvasRef}
                width={sizeGameImage}
                height={sizeGameImage}
                style={{
                    border: '2px solid #333',
                    display: 'block',
                    margin: '20px auto',
                    backgroundColor: '#000'
                }}
            />
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button
                    onClick={resetGame}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Reiniciar Juego
                </button>
            </div>
        </>
    );
};

export default GameCanvas;
