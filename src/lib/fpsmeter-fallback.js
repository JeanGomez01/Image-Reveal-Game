/**
 * Implementación de respaldo para FPSMeter en caso de que falle la carga desde CDN
 */

// Verificar si FPSMeter ya existe
if (typeof window.FPSMeter === 'undefined') {
    console.warn('Usando implementación de respaldo para FPSMeter');
    
    // Crear una implementación simulada de FPSMeter
    window.FPSMeter = function(element, options) {
        this.element = element;
        this.options = options || {};
        
        // Crear elementos visuales básicos
        if (element) {
            element.innerHTML = '<div class="fps-fallback">FPS: --</div>';
            this.display = element.querySelector('.fps-fallback');
            
            // Aplicar estilos básicos
            element.style.backgroundColor = '#333';
            element.style.color = '#fff';
            element.style.padding = '5px';
            element.style.fontFamily = 'monospace';
            element.style.fontSize = '12px';
        }
        
        // Variables para el cálculo de FPS
        this.frames = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        
        console.log('FPSMeter simulado creado', this);
    };
    
    // Método tick para actualizar el contador de FPS
    window.FPSMeter.prototype.tick = function() {
        this.frames++;
        
        const now = performance.now();
        const elapsed = now - this.lastTime;
        
        // Actualizar FPS cada segundo
        if (elapsed >= 1000) {
            this.fps = Math.round((this.frames * 1000) / elapsed);
            this.lastTime = now;
            this.frames = 0;
            
            // Actualizar la visualización
            if (this.display) {
                this.display.textContent = `FPS: ${this.fps}`;
            }
        }
    };
    
    // Método destroy para limpiar recursos
    window.FPSMeter.prototype.destroy = function() {
        if (this.element) {
            this.element.innerHTML = '';
        }
    };
}