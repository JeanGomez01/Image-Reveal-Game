class Enemy {
    constructor(x, y, vx, vy, radius = 10) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
    }

    update(canvasWidth, canvasHeight) {
        this.x += this.vx;
        this.y += this.vy;

        // Rebote en los bordes
        if (this.x <= this.radius || this.x >= canvasWidth - this.radius) {
            this.vx *= -1;
        }

        if (this.y <= this.radius || this.y >= canvasHeight - this.radius) {
            this.vy *= -1;
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    checkCollision(points) {
        for (let i = 0; i < points.length; i++) {
            const dx = this.x - points[i].x;
            const dy = this.y - points[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.radius) {
                return true;
            }
        }
        return false;
    }

}
