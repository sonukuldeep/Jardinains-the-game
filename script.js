import { Move as controls } from './controls.js';
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = document.documentElement.clientWidth;
canvas.height = document.documentElement.clientHeight;
ctx.strokeStyle = 'white';
const fps = 60;
const interval = 1000 / fps;
let lastTime = 0;
let requestAnimationFrameRef = 0;
const mouse = {
    x: -1,
    y: -1,
    radius: 100
};
window.addEventListener('resize', () => {
    cancelAnimationFrame(requestAnimationFrameRef);
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
    effect = new Effect(canvas);
    animation(0);
});
window.addEventListener('mousedown', (e) => {
    const { clientX, clientY } = e;
    mouse.x = clientX;
    mouse.y = clientY;
});
window.addEventListener('mouseup', () => {
    mouse.x = -1;
    mouse.y = -1;
});
class Particle {
    constructor(effect) {
        this.effect = effect;
        this.radius = Math.floor(5 + Math.random() * 10);
        this.x = this.radius + Math.random() * (this.effect.width - this.radius * 2);
        this.y = this.radius + Math.random() * (this.effect.height - this.radius * 2);
        this.vx = ((Math.random() * 5) - 2);
        this.vy = ((Math.random() * 5) - 2);
        this.friction = 0.98;
        this.fillColorFactor = 360 / canvas.width;
        this.doubleBounce = false;
    }
    draw(context) {
        context.fillStyle = `hsl(${this.x * this.fillColorFactor}, 100%, 50%)`;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
    }
    update(platform) {
        if (!this.doubleBounce && this.x + this.radius > platform.x && this.x - this.radius < platform.x + platform.width && platform.y < this.y + this.radius) {
            this.vy *= -1;
            if (platform.y < this.y && platform.y + platform.height > this.y) {
                console.log('fire');
                this.vx *= -1;
            }
            this.doubleBounce = true;
        }
        this.x += this.vx;
        this.y += this.vy;
        if ((this.x + this.radius) > this.effect.width || (this.x - this.radius) < 0) {
            this.x = this.x;
            this.vx *= -1;
            this.doubleBounce = false;
        }
        if ((this.y - this.radius) < 0) {
            this.y = this.y;
            this.vy *= -1;
            this.doubleBounce = false;
        }
        if ((this.y + this.radius) > this.effect.height + 80) {
            cancelAnimationFrame(requestAnimationFrameRef);
        }
    }
    handleMouseMove() {
    }
}
class Effect {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.particles = [];
        this.numberOfParticles = 1;
        this.createParticle();
        this.platform = new Platform(this.canvas, 80, 10, 1, 1, 'hsl(215,100%,50%)');
    }
    createParticle() {
        for (let index = 0; index < this.numberOfParticles; index++) {
            this.particles.push(new Particle(this));
        }
    }
    handleParticles(context) {
        this.particles.forEach(particle => {
            particle.draw(context);
            particle.update(this.platform);
        });
        this.platform.draw(context);
    }
    connectParticles(context) {
        const maxDistance = 100;
        for (let a = 0; a < this.particles.length; a++) {
            for (let b = a; b < this.particles.length; b++) {
                const dx = this.particles[a].x - this.particles[b].x;
                const dy = this.particles[a].y - this.particles[b].y;
                const distance = Math.hypot(dx, dy);
                if (distance < maxDistance) {
                    context.save();
                    const opacity = 1 - distance / maxDistance;
                    context.globalAlpha = opacity;
                    context.beginPath();
                    context.moveTo(this.particles[a].x, this.particles[a].y);
                    context.lineTo(this.particles[b].x, this.particles[b].y);
                    context.stroke();
                    context.restore();
                }
            }
        }
    }
}
class Platform {
    constructor(canvas, width, x, bounce, shake, color) {
        this.canvas = canvas;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        this.height = 20;
        this.width = width;
        this.x = x;
        this.y = this.canvasHeight - this.height - 10;
        this.bounceFactor = bounce;
        this.color = color;
        this.shake = shake;
    }
    draw(context) {
        this.x -= 10 * controls.x;
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}
let effect = new Effect(canvas);
function animation(timestamp) {
    var elapsedTime = timestamp - lastTime;
    if (elapsedTime > interval) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        effect.handleParticles(ctx);
        lastTime = timestamp;
    }
    requestAnimationFrameRef = requestAnimationFrame(animation);
}
animation(0);
