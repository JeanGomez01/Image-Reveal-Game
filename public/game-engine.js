// Game Engine para Image Reveal con estructura de capas y transiciones

class ImageRevealGame {
    constructor(gameCanvas, uiCanvas, options = {}) {
        // Canvas y contextos
        this.gameCanvas = gameCanvas;
        this.uiCanvas = uiCanvas;
        this.gameCtx = gameCanvas.getContext('2d');
        this.uiCtx = uiCanvas.getContext('2d');
        
        // Dimensiones
        this.width = gameCanvas.width;
        this.height = gameCanvas.height;
        
        // Opciones
        this.options = {
            borderWidth: options.borderWidth || 2,
            winPercentage: options.winPercentage || 80,
            initialTime: options.initialTime || 180,
            initialLives: options.initialLives || 3,
            ...options
        };
        
        // Estado del juego
        this.state = {
            clearedPercentage: 0,
            remainingTime: this.options.initialTime,
            lives: this.options.initialLives,
            gameOver: false,
            win: false,
            paused: false
        };
        
        // Mapa y jugador
        this.map = new Array(this.width * this.height);
        this.player = {
            x: this.width - this.options.borderWidth - 1,
            y: this.height - this.options.borderWidth - 1,
            radius: 5,
            speed: 2,
            isFiring: false,
            lastPathX: 0,
            lastPathY: 0,
            currentMoveDirection: null
        };
        
        // Enemigos
        this.enemies = [];
        
        // Imagen de fondo
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'image.png';
        
        // Recursos
        this.resources = {
            heart: new Image(),
            loaded: false
        };
        this.resources.heart.src = 'assets/heart.png';
        
        // Temporizadores
        this.timers = {
            gameLoop: null,
            countdown: null,
            message: null
        };
        
        // UI
        this.message = '';
        this.messageTimeout = 3000;
        
        // Input
        this.input = {
            up: false,
            down: false,
            left: false,
            right: false,
            fire: false
        };
        
        // Estadísticas
        this.stats = {
            totalArea: this.width * this.height,
            filledArea: 0,
            startTime: 0,
            lastUpdateTime: 0
        };
        
        // Efectos visuales
        this.effects = {
            transitionAlpha: 0,
            shake: {
                active: false,
                intensity: 0,
                duration: 0,
                startTime: 0
            },
            particles: []
        };
        
        // Inicializar
        this.init();
    }
    
    // Inicializar el juego
    init() {
        // Inicializar mapa
        for (let i = 0; i < this.map.length; i++) {
            this.map[i] = 'F'; // Filled
        }
        
        // Crear borde limpio
        this.createBorderPath();
        
        // Configurar eventos de input
        this.setupInputHandlers();
        
        // Iniciar temporizadores
        this.startTimers();
        
        // Calcular área inicial
        this.updateFilledArea();
        
        // Iniciar bucle del juego
        this.gameLoop();
    }
    
    // Crear un borde limpio alrededor de toda la imagen
    createBorderPath() {
        const borderWidth = this.options.borderWidth;
        let pixelsCleared = 0;

        // Limpiar los bordes (crear un marco limpio)
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                // Si el pixel está en el borde (dentro del ancho especificado)
                if (x < borderWidth || x >= this.width - borderWidth || 
                    y < borderWidth || y >= this.height - borderWidth) {
                    
                    const index = y * this.width + x;
                    if (index >= 0 && index < this.map.length) {
                        this.map[index] = 'E'; // Marcar como vacío
                        pixelsCleared++;
                    }
                }
            }
        }

        // Crear el camino (path) en el borde interior
        for (let x = borderWidth; x < this.width - borderWidth; x++) {
            // Borde superior e inferior
            const topIndex = borderWidth * this.width + x;
            const bottomIndex = (this.height - borderWidth - 1) * this.width + x;
            
            if (topIndex >= 0 && topIndex < this.map.length) {
                this.map[topIndex] = 'P';
            }
            
            if (bottomIndex >= 0 && bottomIndex < this.map.length) {
                this.map[bottomIndex] = 'P';
            }
        }
        
        for (let y = borderWidth; y < this.height - borderWidth; y++) {
            // Borde izquierdo y derecho
            const leftIndex = y * this.width + borderWidth;
            const rightIndex = y * this.width + (this.width - borderWidth - 1);
            
            if (leftIndex >= 0 && leftIndex < this.map.length) {
                this.map[leftIndex] = 'P';
            }
            
            if (rightIndex >= 0 && rightIndex < this.map.length) {
                this.map[rightIndex] = 'P';
            }
        }

        // Colocar al jugador en la esquina inferior derecha
        this.player.x = this.width - borderWidth - 1;
        this.player.y = this.height - borderWidth - 1;
        this.player.lastPathX = this.player.x;
        this.player.lastPathY = this.player.y;

        // Actualizar el porcentaje limpiado
        this.state.clearedPercentage = Math.round(pixelsCleared / this.map.length * 100);
    }
    
    // Configurar manejadores de entrada
    setupInputHandlers() {
        // Teclado
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    this.input.up = true;
                    break;
                case 'ArrowDown':
                    this.input.down = true;
                    break;
                case 'ArrowLeft':
                    this.input.left = true;
                    break;
                case 'ArrowRight':
                    this.input.right = true;
                    break;
                case ' ':
                    this.input.fire = true;
                    break;
                case 'p':
                    this.togglePause();
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    this.input.up = false;
                    break;
                case 'ArrowDown':
                    this.input.down = false;
                    break;
                case 'ArrowLeft':
                    this.input.left = false;
                    break;
                case 'ArrowRight':
                    this.input.right = false;
                    break;
                case ' ':
                    this.input.fire = false;
                    break;
            }
        });
    }
    
    // Iniciar temporizadores
    startTimers() {
        // Temporizador de cuenta regresiva
        this.timers.countdown = setInterval(() => {
            if (this.state.paused) return;
            
            this.state.remainingTime--;
            
            if (this.state.remainingTime <= 0) {
                this.gameOver();
            } else if (this.state.remainingTime === 30) {
                this.showMessage("Hurry up!!");
                // Reproducir sonido de prisa si está disponible
            }
        }, 1000);
        
        // Establecer tiempo de inicio
        this.stats.startTime = performance.now();
        this.stats.lastUpdateTime = this.stats.startTime;
    }
    
    // Bucle principal del juego
    gameLoop() {
        const now = performance.now();
        const dt = now - this.stats.lastUpdateTime;
        
        // Actualizar
        if (!this.state.paused) {
            this.update(dt);
        }
        
        // Renderizar
        this.render();
        
        // Actualizar tiempo
        this.stats.lastUpdateTime = now;
        
        // Continuar el bucle
        this.timers.gameLoop = requestAnimationFrame(() => this.gameLoop());
    }
    
    // Actualizar el estado del juego
    update(dt) {
        // Si el juego ha terminado, no actualizar
        if (this.state.gameOver || this.state.win) return;
        
        // Guardar posición anterior
        const previousX = this.player.x;
        const previousY = this.player.y;
        
        // Determinar la dirección de movimiento basada en las teclas presionadas
        const wantsToMoveHorizontal = this.input.left || this.input.right;
        const wantsToMoveVertical = this.input.up || this.input.down;
        
        // Lógica para limitar el movimiento a horizontal o vertical
        if (this.player.currentMoveDirection === null) {
            if (wantsToMoveHorizontal) {
                this.player.currentMoveDirection = 'horizontal';
            } else if (wantsToMoveVertical) {
                this.player.currentMoveDirection = 'vertical';
            }
        } else if ((this.player.currentMoveDirection === 'horizontal' && !wantsToMoveHorizontal) ||
                   (this.player.currentMoveDirection === 'vertical' && !wantsToMoveVertical)) {
            if (wantsToMoveHorizontal) {
                this.player.currentMoveDirection = 'horizontal';
            } else if (wantsToMoveVertical) {
                this.player.currentMoveDirection = 'vertical';
            } else {
                this.player.currentMoveDirection = null;
            }
        }
        
        // Aplicar movimiento según la dirección actual
        if (this.player.currentMoveDirection === 'horizontal') {
            // Solo permitir movimiento horizontal
            if (this.input.left && this.player.x > 0) {
                this.player.x = Math.max(0, this.player.x - this.player.speed);
            }
            if (this.input.right && this.player.x < this.width) {
                this.player.x = Math.min(this.width, this.player.x + this.player.speed);
            }
        } else if (this.player.currentMoveDirection === 'vertical') {
            // Solo permitir movimiento vertical
            if (this.input.up && this.player.y > 0) {
                this.player.y = Math.max(0, this.player.y - this.player.speed);
            }
            if (this.input.down && this.player.y < this.height) {
                this.player.y = Math.min(this.height, this.player.y + this.player.speed);
            }
        }
        
        // Asegurarse de que los índices estén dentro de los límites
        const prevIndex = Math.min(Math.floor(previousY) * this.width + Math.floor(previousX), this.map.length - 1);
        const currIndex = Math.min(Math.floor(this.player.y) * this.width + Math.floor(this.player.x), this.map.length - 1);
        
        const previousPoint = this.map[prevIndex];
        const currentPoint = this.map[currIndex];
        
        // Lógica de dibujo y relleno
        if (this.input.fire) {
            // Si no hay movimiento, no hacer nada
            if (previousX === this.player.x && previousY === this.player.y) return;
            
            if (currentPoint === 'T' || currentPoint === 'E') {
                // Mordimos nuestra propia cola o el pixel estaba vacío
                this.player.x = previousX;
                this.player.y = previousY;
            } else if (currentPoint === 'P') {
                this.player.lastPathX = this.player.x;
                this.player.lastPathY = this.player.y;
                
                if (previousPoint !== 'P') {
                    // Cerramos un camino
                    console.log("Path closed!");
                    
                    // Aquí iría la lógica de flood fill y cálculo de áreas
                    // Para simplificar, solo actualizamos el porcentaje
                    this.state.clearedPercentage += 5;
                    
                    // Verificar victoria
                    if (this.state.clearedPercentage >= this.options.winPercentage) {
                        this.win();
                    }
                    
                    // Actualizar área llena
                    this.updateFilledArea();
                }
            } else {
                // Estamos dibujando
                const safeIndex = Math.min(Math.floor(this.player.y) * this.width + Math.floor(this.player.x), this.map.length - 1);
                this.map[safeIndex] = 'T';
            }
        } else if (currentPoint === 'P') {
            // Estamos caminando sobre un camino
            this.player.lastPathX = this.player.x;
            this.player.lastPathY = this.player.y;
        } else if (previousPoint === 'T') {
            // Estábamos dibujando pero paramos sin cerrar un camino
            this.respawn();
        } else {
            // No estamos dibujando y tratamos de caminar fuera de un camino
            this.player.x = previousX;
            this.player.y = previousY;
        }
        
        // Actualizar enemigos
        this.updateEnemies(dt);
        
        // Actualizar efectos
        this.updateEffects(dt);
    }
    
    // Actualizar enemigos
    updateEnemies(dt) {
        // Implementación simplificada
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Mover enemigo
            enemy.x += enemy.vx * dt / 1000;
            enemy.y += enemy.vy * dt / 1000;
            
            // Rebotar en los bordes
            if (enemy.x < 0 || enemy.x > this.width) {
                enemy.vx *= -1;
            }
            if (enemy.y < 0 || enemy.y > this.height) {
                enemy.vy *= -1;
            }
            
            // Verificar colisión con el jugador
            if (this.input.fire && this.checkCollision(enemy)) {
                this.playerHit();
            }
        }
    }
    
    // Actualizar efectos visuales
    updateEffects(dt) {
        // Actualizar partículas
        for (let i = this.effects.particles.length - 1; i >= 0; i--) {
            const particle = this.effects.particles[i];
            
            particle.life -= dt;
            if (particle.life <= 0) {
                this.effects.particles.splice(i, 1);
                continue;
            }
            
            particle.x += particle.vx * dt / 1000;
            particle.y += particle.vy * dt / 1000;
            particle.alpha = particle.life / particle.initialLife;
        }
        
        // Actualizar efecto de shake
        if (this.effects.shake.active) {
            const elapsed = performance.now() - this.effects.shake.startTime;
            if (elapsed >= this.effects.shake.duration) {
                this.effects.shake.active = false;
            }
        }
    }
    
    // Renderizar el juego
    render() {
        // Limpiar canvas
        this.gameCtx.clearRect(0, 0, this.width, this.height);
        this.uiCtx.clearRect(0, 0, this.width, this.height);
        
        // Aplicar efecto de shake
        if (this.effects.shake.active) {
            const intensity = this.effects.shake.intensity;
            const dx = (Math.random() * 2 - 1) * intensity;
            const dy = (Math.random() * 2 - 1) * intensity;
            
            this.gameCtx.save();
            this.gameCtx.translate(dx, dy);
        }
        
        // Renderizar fondo
        this.renderBackground();
        
        // Renderizar mapa
        this.renderMap();
        
        // Renderizar jugador
        this.renderPlayer();
        
        // Renderizar enemigos
        this.renderEnemies();
        
        // Restaurar contexto si hay shake
        if (this.effects.shake.active) {
            this.gameCtx.restore();
        }
        
        // Renderizar UI
        this.renderUI();
        
        // Renderizar efectos
        this.renderEffects();
        
        // Renderizar mensajes
        this.renderMessage();
        
        // Renderizar estados especiales
        if (this.state.paused) {
            this.renderPaused();
        }
        
        if (this.state.gameOver) {
            this.renderGameOver();
        }
        
        if (this.state.win) {
            this.renderWin();
        }
    }
    
    // Renderizar fondo
    renderBackground() {
        // Si la imagen está cargada, dibujarla
        if (this.backgroundImage.complete) {
            // Determinar qué parte de la imagen usar para mantener ratio 1:1
            const size = Math.min(this.backgroundImage.width, this.backgroundImage.height);
            const sx = (this.backgroundImage.width - size) / 2;
            const sy = (this.backgroundImage.height - size) / 2;
            
            // Dibujar la imagen recortada para mantener ratio 1:1
            this.gameCtx.drawImage(
                this.backgroundImage,
                sx, sy, size, size,  // Recortar la imagen a un cuadrado
                0, 0, this.width, this.height  // Dibujar en todo el canvas
            );
        } else {
            // Si la imagen no está cargada, dibujar un fondo de color
            this.gameCtx.fillStyle = '#0a0a2a';
            this.gameCtx.fillRect(0, 0, this.width, this.height);
        }
    }
    
    // Renderizar mapa
    renderMap() {
        // Crear un ImageData para dibujar el mapa
        const imgData = this.gameCtx.createImageData(this.width, this.height);
        const data = imgData.data;
        
        for (let i = 0; i < this.map.length; i++) {
            const pixelIndex = i * 4;
            
            switch (this.map[i]) {
                case 'E': // Empty
                    data[pixelIndex + 3] = 0; // Transparent
                    break;
                case 'F': // Filled
                    data[pixelIndex] = 0; // Dark Blue, 100% opaque
                    data[pixelIndex + 1] = 0;
                    data[pixelIndex + 2] = 100;
                    data[pixelIndex + 3] = 200; // Semi-transparent
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
        
        // Dibujar el mapa
        this.gameCtx.putImageData(imgData, 0, 0);
    }
    
    // Renderizar jugador
    renderPlayer() {
        // Dibujar el jugador
        this.gameCtx.fillStyle = this.input.fire ? "#ff00ff" : "#00ff00";
        this.gameCtx.shadowColor = this.input.fire ? "#ff00ff" : "#00ff00";
        this.gameCtx.shadowBlur = 10;
        this.gameCtx.fillRect(
            this.player.x - this.player.radius, 
            this.player.y - this.player.radius, 
            this.player.radius * 2, 
            this.player.radius * 2
        );
        this.gameCtx.shadowBlur = 0;
    }
    
    // Renderizar enemigos
    renderEnemies() {
        for (const enemy of this.enemies) {
            this.gameCtx.fillStyle = enemy.color;
            this.gameCtx.shadowColor = enemy.color;
            this.gameCtx.shadowBlur = 10;
            this.gameCtx.beginPath();
            this.gameCtx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            this.gameCtx.fill();
            this.gameCtx.shadowBlur = 0;
        }
    }
    
    // Renderizar UI
    renderUI() {
        // Dibujar HUD en el canvas de UI
        
        // Fondo del HUD
        this.uiCtx.fillStyle = 'rgba(10, 10, 42, 0.7)';
        this.uiCtx.fillRect(10, 10, 200, 80);
        this.uiCtx.strokeStyle = '#ff00ff';
        this.uiCtx.lineWidth = 2;
        this.uiCtx.strokeRect(10, 10, 200, 80);
        
        // Porcentaje revelado
        this.uiCtx.fillStyle = '#00ff00';
        this.uiCtx.font = '16px "Press Start 2P"';
        this.uiCtx.textAlign = 'left';
        this.uiCtx.shadowColor = '#00ff00';
        this.uiCtx.shadowBlur = 5;
        this.uiCtx.fillText(`${this.state.clearedPercentage.toFixed(1)}%/80`, 20, 35);
        this.uiCtx.shadowBlur = 0;
        
        // Tiempo restante
        this.uiCtx.fillStyle = '#ffcd75';
        this.uiCtx.font = '16px "Press Start 2P"';
        this.uiCtx.fillText(`TIME:${this.state.remainingTime}`, 20, 60);
        
        // Vidas
        for (let i = 0; i < this.state.lives; i++) {
            if (this.resources.heart.complete) {
                this.uiCtx.drawImage(this.resources.heart, 20 + i * 25, 70, 20, 20);
            } else {
                this.uiCtx.fillStyle = '#ff00ff';
                this.uiCtx.fillRect(20 + i * 25, 70, 20, 20);
            }
        }
        
        // Crédito
        this.uiCtx.fillStyle = '#ffcd75';
        this.uiCtx.font = '10px "Press Start 2P"';
        this.uiCtx.textAlign = 'right';
        this.uiCtx.fillText('pkNoCREDIT', this.width - 20, this.height - 20);
    }
    
    // Renderizar efectos
    renderEffects() {
        // Renderizar partículas
        for (const particle of this.effects.particles) {
            this.uiCtx.globalAlpha = particle.alpha;
            this.uiCtx.fillStyle = particle.color;
            this.uiCtx.fillRect(particle.x, particle.y, particle.size, particle.size);
        }
        this.uiCtx.globalAlpha = 1;
    }
    
    // Renderizar mensaje
    renderMessage() {
        if (this.message) {
            this.uiCtx.fillStyle = 'rgba(10, 10, 42, 0.7)';
            this.uiCtx.fillRect(this.width / 2 - 150, this.height / 2 - 25, 300, 50);
            this.uiCtx.strokeStyle = '#ff00ff';
            this.uiCtx.lineWidth = 2;
            this.uiCtx.strokeRect(this.width / 2 - 150, this.height / 2 - 25, 300, 50);
            
            this.uiCtx.fillStyle = '#ffffff';
            this.uiCtx.font = '16px "Press Start 2P"';
            this.uiCtx.textAlign = 'center';
            this.uiCtx.fillText(this.message, this.width / 2, this.height / 2 + 5);
        }
    }
    
    // Renderizar pausa
    renderPaused() {
        this.uiCtx.fillStyle = 'rgba(10, 10, 42, 0.7)';
        this.uiCtx.fillRect(0, 0, this.width, this.height);
        
        this.uiCtx.fillStyle = '#ffffff';
        this.uiCtx.font = '24px "Press Start 2P"';
        this.uiCtx.textAlign = 'center';
        this.uiCtx.shadowColor = '#ffffff';
        this.uiCtx.shadowBlur = 10;
        this.uiCtx.fillText('PAUSED', this.width / 2, this.height / 2);
        this.uiCtx.shadowBlur = 0;
        
        this.uiCtx.font = '12px "Press Start 2P"';
        this.uiCtx.fillText('Press P to continue', this.width / 2, this.height / 2 + 40);
    }
    
    // Renderizar game over
    renderGameOver() {
        this.uiCtx.fillStyle = 'rgba(10, 10, 42, 0.8)';
        this.uiCtx.fillRect(0, 0, this.width, this.height);
        
        this.uiCtx.fillStyle = '#e43b44';
        this.uiCtx.font = '32px "Press Start 2P"';
        this.uiCtx.textAlign = 'center';
        this.uiCtx.shadowColor = '#e43b44';
        this.uiCtx.shadowBlur = 15;
        this.uiCtx.fillText('GAME', this.width / 2, this.height / 2 - 20);
        this.uiCtx.fillText('OVER', this.width / 2, this.height / 2 + 20);
        this.uiCtx.shadowBlur = 0;
        
        this.uiCtx.fillStyle = '#ffffff';
        this.uiCtx.font = '16px "Press Start 2P"';
        this.uiCtx.fillText('Press ENTER to retry', this.width / 2, this.height / 2 + 80);
    }
    
    // Renderizar victoria
    renderWin() {
        this.uiCtx.fillStyle = 'rgba(10, 10, 42, 0.8)';
        this.uiCtx.fillRect(0, 0, this.width, this.height);
        
        this.uiCtx.fillStyle = '#00ff00';
        this.uiCtx.font = '40px "Press Start 2P"';
        this.uiCtx.textAlign = 'center';
        this.uiCtx.shadowColor = '#00ff00';
        this.uiCtx.shadowBlur = 15;
        this.uiCtx.fillText('CLEAR!', this.width / 2, this.height / 2);
        this.uiCtx.shadowBlur = 0;
        
        // Efecto de confeti
        if (Math.random() < 0.1) {
            this.addParticle();
        }
        
        this.uiCtx.fillStyle = '#ffffff';
        this.uiCtx.font = '16px "Press Start 2P"';
        this.uiCtx.fillText('Press ENTER to continue', this.width / 2, this.height / 2 + 80);
    }
    
    // Verificar colisión
    checkCollision(enemy) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.player.radius + enemy.radius;
    }
    
    // Respawn del jugador
    respawn() {
        // Transformar todos los caminos temporales en llenos
        for (let i = 0; i < this.map.length; i++) {
            if (this.map[i] === 'T') {
                this.map[i] = 'F';
            }
        }
        
        // Volver a la última posición conocida del camino
        this.player.x = this.player.lastPathX;
        this.player.y = this.player.lastPathY;
        this.player.currentMoveDirection = null;
    }
    
    // Jugador golpeado
    playerHit() {
        this.state.lives--;
        this.showMessage("Ouch!");
        this.startShake(10, 500);
        this.respawn();
        
        if (this.state.lives <= 0) {
            this.gameOver();
        }
    }
    
    // Game over
    gameOver() {
        this.state.gameOver = true;
        this.pauseTimers();
        
        // Añadir manejador de tecla para reiniciar
        const restartHandler = (e) => {
            if (e.key === 'Enter') {
                window.removeEventListener('keydown', restartHandler);
                this.restart();
            }
        };
        window.addEventListener('keydown', restartHandler);
    }
    
    // Victoria
    win() {
        this.state.win = true;
        this.showMessage("You win!");
        this.pauseTimers();
        
        // Generar muchas partículas
        for (let i = 0; i < 100; i++) {
            this.addParticle();
        }
        
        // Añadir manejador de tecla para continuar
        const continueHandler = (e) => {
            if (e.key === 'Enter') {
                window.removeEventListener('keydown', continueHandler);
                this.restart();
            }
        };
        window.addEventListener('keydown', continueHandler);
    }
    
    // Reiniciar juego
    restart() {
        // Limpiar estado
        this.state.gameOver = false;
        this.state.win = false;
        this.state.paused = false;
        this.state.lives = this.options.initialLives;
        this.state.remainingTime = this.options.initialTime;
        this.state.clearedPercentage = 0;
        
        // Limpiar efectos
        this.effects.particles = [];
        this.effects.shake.active = false;
        
        // Reiniciar mapa
        for (let i = 0; i < this.map.length; i++) {
            this.map[i] = 'F';
        }
        
        // Crear borde limpio
        this.createBorderPath();
        
        // Reiniciar temporizadores
        this.startTimers();
        
        // Actualizar área inicial
        this.updateFilledArea();
    }
    
    // Pausar/reanudar juego
    togglePause() {
        this.state.paused = !this.state.paused;
        
        if (this.state.paused) {
            this.pauseTimers();
        } else {
            this.resumeTimers();
        }
    }
    
    // Pausar temporizadores
    pauseTimers() {
        clearInterval(this.timers.countdown);
    }
    
    // Reanudar temporizadores
    resumeTimers() {
        // Reiniciar temporizador de cuenta regresiva
        this.timers.countdown = setInterval(() => {
            if (this.state.paused) return;
            
            this.state.remainingTime--;
            
            if (this.state.remainingTime <= 0) {
                this.gameOver();
            }
        }, 1000);
    }
    
    // Mostrar mensaje
    showMessage(text, duration = 3000) {
        this.message = text;
        
        if (this.timers.message) {
            clearTimeout(this.timers.message);
        }
        
        this.timers.message = setTimeout(() => {
            this.message = '';
        }, duration);
    }
    
    // Iniciar efecto de shake
    startShake(intensity, duration) {
        this.effects.shake.active = true;
        this.effects.shake.intensity = intensity;
        this.effects.shake.duration = duration;
        this.effects.shake.startTime = performance.now();
    }
    
    // Añadir partícula
    addParticle() {
        const colors = ['#ff00ff', '#00ff00', '#ffcd75', '#4b80ca', '#e43b44'];
        
        this.effects.particles.push({
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            size: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: Math.random() * 2000 + 1000,
            initialLife: Math.random() * 2000 + 1000,
            alpha: 1
        });
    }
    
    // Actualizar área llena y porcentaje limpiado
    updateFilledArea() {
        let filledCount = 0;
        
        for (let i = 0; i < this.map.length; i++) {
            if (this.map[i] === 'F') {
                filledCount++;
            }
        }
        
        this.stats.filledArea = filledCount;
        
        // Calcular el porcentaje de área limpiada
        if (this.stats.totalArea > 0) {
            this.state.clearedPercentage = Math.round(((this.stats.totalArea - this.stats.filledArea) / this.stats.totalArea) * 100);
        }
    }
    
    // Limpiar recursos
    cleanup() {
        // Detener temporizadores
        clearInterval(this.timers.countdown);
        clearTimeout(this.timers.message);
        cancelAnimationFrame(this.timers.gameLoop);
        
        // Eliminar event listeners
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}

// Exportar la clase
window.ImageRevealGame = ImageRevealGame;