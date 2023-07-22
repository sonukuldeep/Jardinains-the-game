import { Move as controls } from './controls.js';
import { gameOver, restartGame, startGame, startBtn } from './ui.js';
import { SoundEffect } from './soundManager.js';
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = Math.min(document.documentElement.clientWidth, 610);
canvas.height = document.documentElement.clientHeight - 20;
ctx.strokeStyle = 'white';
const fps = 30;
const frameTime = 1000 / fps;
let lastTime = 0;
let deltaTime = 0;
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
        const circle = { x: this.x, y: this.y, radius: this.radius };
        const rectangle = { x: platform.x, y: platform.y, width: platform.width, height: platform.height };
        if (!this.doubleBounce && detectCollision(circle, rectangle)) {
            this.vy *= -1;
            const ratio = (this.x - platform.x) / (platform.width);
            if (ratio < 0.2)
                this.vx = -2;
            else if (ratio < 0.4)
                this.vx = -1;
            else if (ratio < 0.6)
                this.vx = 0;
            else if (ratio < 0.8)
                this.vx = 1;
            else if (ratio <= 1)
                this.vx = 2;
            this.doubleBounce = true;
            platform.shake.shake = 1;
            const sound = Math.floor(Math.random() * (5 - 3)) + 3;
            SoundEffect(sound);
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
        this.tileAdjustment = (this.width - this.noOfTilesPerRow * Tile.width + Tile.gap) * 0.5;
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
        this.radius = 4;
        this.bounceFactor = bounce;
        this.color = color;
        this.shake = new ShakeOnHit();
    }
    draw(context) {
        if (this.x - 10 * controls.x > 0 && this.x + this.width - 10 * controls.x < this.canvasWidth)
            this.x -= 10 * controls.x;
        context.fillStyle = this.color;
        this.shake.vibrate();
        context.beginPath();
        context.moveTo(this.x + this.radius, this.y);
        context.arcTo(this.x + this.width, this.y, this.x + this.width, this.y + this.height, this.radius);
        context.arcTo(this.x + this.width, this.y + this.height, this.x, this.y + this.height, this.radius);
        context.arcTo(this.x, this.y + this.height, this.x, this.y, this.radius);
        context.arcTo(this.x, this.y, this.x + this.width, this.y, this.radius);
        context.closePath();
        context.fill();
        this.shake.runEveryFrame();
    }
}
class Tile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.color = 'hsl(100,100%,50%)';
        this.deactivate = false;
        this.effectiveWidth = Tile.width - Tile.gap;
        this.effectiveHeight = Tile.height - Tile.gap;
        this.soundTrack = Math.floor(Math.random() * 3);
    }
    draw(context) {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.effectiveWidth, this.effectiveHeight);
    }
    deactivateBall(ball) {
        const circle = { x: ball.x, y: ball.y, radius: ball.radius };
        const rectangle = { x: this.x, y: this.y, width: this.effectiveWidth, height: this.effectiveHeight };
        if (!this.deactivate && detectCollision(circle, rectangle)) {
            this.deactivate = true;
            this.color = 'hsl(100,100%,0%)';
            this.deactivate = true;
            SoundEffect(this.soundTrack);
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
        this.switch = 1;
        this.damping = 0.9;
        this.vibrateX = 0;
        this.vibrateY = 0;
    }
    vibrate() {
        if (this.shake > 0) {
            this.vibrateX = this.switch * this.amplitude * this.shake;
            this.vibrateY = this.amplitude * this.shake;
            this.shake *= this.damping;
        }
    }
    runEveryFrame() {
        this.switch *= -1;
    }
}
let effect = new Effect(canvas);
function animation(currentTime) {
    requestAnimationFrameRef = requestAnimationFrame(animation);
    deltaTime = currentTime - lastTime;
    if (deltaTime >= frameTime) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        effect.handleParticles(ctx);
        lastTime = currentTime - (deltaTime % frameTime);
    }
}
startBtn.addEventListener('click', () => {
    startGame.classList.remove('activate');
    animation(0);
});
function detectCollision(circle, rectangle) {
    if (circle.x + circle.radius > rectangle.x && circle.x - circle.radius < rectangle.x + rectangle.width && circle.y + circle.radius > rectangle.y && circle.y - circle.radius < rectangle.y + rectangle.height)
        return true;
    else
        return false;
}
