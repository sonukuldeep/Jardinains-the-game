import { Move as controls } from './controls.js';
import { gameOver, restartGame, startGame, startBtn } from './ui.js';
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = document.documentElement.clientWidth;
canvas.height = document.documentElement.clientHeight;
ctx.strokeStyle = 'white';
const fps = 30;
const interval = 1000 / fps;
let lastTime = 0;
let requestAnimationFrameRef;
class Ball {
    constructor(effect) {
        this.effect = effect;
        this.radius = 8;
        this.x = 20;
        this.y = this.effect.height - 40;
        this.vx = Math.random() * 5 - 2;
        this.vy = -5;
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
            platform.shake.shake = 1;
        }
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
        if ((this.y + this.radius) > this.effect.height + 18) {
            cancelAnimationFrame(requestAnimationFrameRef);
            gameOver.classList.add('activate');
        }
        this.x += this.vx;
        this.y += this.vy;
    }
    handleMouseMove() {
    }
}
class Effect {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ball = new Ball(this);
        this.tiles = [];
        this.platform = new Platform(this.canvas, 80, 10, 1, 1, 'hsl(215,100%,50%)');
        this.noOfTilesPerRow = Math.floor(this.width / (Tile.width));
        this.noOfRows = 3;
        this.tileAdjustment = (this.width - this.noOfTilesPerRow * Tile.width) * 0.5;
        this.inactiveTiles = 0;
        this.createParticle();
    }
    createParticle() {
        for (let i = 1; i <= this.noOfRows; i++) {
            for (let j = 0; j < this.noOfTilesPerRow; j++) {
                this.tiles.push(new Tile(Tile.width * j + this.tileAdjustment, Tile.height * i));
            }
        }
    }
    handleParticles(context) {
        this.tiles.forEach(tile => {
            tile.draw(context);
            this.inactiveTiles += tile.deactivateBall(this.ball);
        });
        this.ball.draw(context);
        this.ball.update(this.platform);
        this.platform.draw(context);
        if (this.inactiveTiles === this.noOfTilesPerRow * this.noOfRows) {
            restartGame.classList.add('activate');
            cancelAnimationFrame(requestAnimationFrameRef);
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
        this.shake = new ShakeOnHit();
    }
    draw(context) {
        if (this.x - 10 * controls.x > 0 && this.x + this.width - 10 * controls.x < this.canvasWidth)
            this.x -= 10 * controls.x;
        context.fillStyle = this.color;
        this.shake.vibrate();
        context.fillRect(this.x + this.shake.vibrateX, this.y + this.shake.vibrateY, this.width, this.height);
        this.shake.runEveryFrame();
    }
}
class Tile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.color = 'hsl(100,100%,50%)';
        this.deactivate = false;
    }
    draw(context) {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, Tile.width - Tile.gap, Tile.height - Tile.gap);
    }
    deactivateBall(ball) {
        if (!this.deactivate && this.x < ball.x + ball.radius && this.x + Tile.width - Tile.gap > ball.x && this.y + Tile.height - Tile.gap > ball.y + ball.radius) {
            this.deactivate = true;
            this.color = 'hsl(100,100%,0%)';
            this.deactivate = true;
            return 1;
        }
        else
            return 0;
    }
}
Tile.width = 40;
Tile.height = 20;
Tile.gap = 5;
class ShakeOnHit {
    constructor() {
        this.shake = 0;
        this.amplitude = 2;
        this.angle = 90;
        this.damping = 0.9;
        this.vibrateX = 0;
        this.vibrateY = 0;
    }
    vibrate() {
        if (this.shake > 0) {
            this.vibrateX = Math.sin(this.angle) * this.amplitude * this.shake;
            this.vibrateY = this.amplitude * this.shake;
            this.shake *= this.damping;
        }
    }
    runEveryFrame() {
        this.angle *= -1;
    }
}
let effect = new Effect(canvas);
function animation(timestamp) {
    requestAnimationFrameRef = requestAnimationFrame(animation);
    let elapsedTime = timestamp - lastTime;
    if (elapsedTime > interval) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        effect.handleParticles(ctx);
        lastTime = timestamp;
    }
}
startBtn.addEventListener('click', () => {
    startGame.classList.remove('activate');
    animation(0);
});
