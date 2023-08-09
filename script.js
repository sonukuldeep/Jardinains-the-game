import { Move as controls } from './controls.js';
import { gameOver as gameOverUI, restartGame, startGame, startBtn } from './ui.js';
import { SoundEffect } from './soundManager.js';
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = Math.min(document.documentElement.clientWidth, 610);
canvas.height = document.documentElement.clientHeight - 20;
ctx.strokeStyle = 'white';
ctx.font = `24px Arial`;
const fps = 30;
const frameTime = 1000 / fps;
let lastTime = 0;
let deltaTime = 0;
let lastCollisionTime = 0;
let score = 0;
let lives = 3;
let gunActive = true;
let gameOver = false;
let requestAnimationFrameRef;
let lastCollisionID;
const PowerUpEvent = new CustomEvent('powerUpEvent', { detail: { power: { type: '', number: -1 } } });
class Ball {
    constructor(effect) {
        this.effect = effect;
        this.radius = 8;
        this.x = 50;
        this.y = this.effect.height - 80;
        this.vx = Math.random() * 5 - 2;
        this.vy = -5;
        this.friction = 0.98;
        this.fillColorFactor = 360 / canvas.width;
        this.rocketMode = false;
    }
    draw(context) {
        context.fillStyle = `hsl(60, 100%, 50%)`;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
    }
    update(platform) {
        const circle = { x: this.x, y: this.y, radius: this.radius };
        const rectangle = { x: platform.x, y: platform.y, width: platform.width, height: platform.height };
        if (detectCollision(circle, rectangle)) {
            this.vy *= -1;
            const ratio = (this.x - platform.x) / (platform.width);
            if (ratio <= 0)
                this.vx = -3;
            else if (ratio < 0.2)
                this.vx = -2;
            else if (ratio < 0.4)
                this.vx = -1;
            else if (ratio < 0.6)
                this.vx = 0;
            else if (ratio < 0.8)
                this.vx = 1;
            else if (ratio < 1)
                this.vx = 2;
            else if (ratio >= 1)
                this.vx = 3;
            platform.shake.shake = 1;
            const sound = Math.floor(Math.random() * (5 - 3)) + 3;
            SoundEffect(sound);
        }
        if ((this.x + this.radius) > this.effect.width || (this.x - this.radius) < 0) {
            this.x = this.x;
            this.vx *= -1;
        }
        if ((this.y - this.radius) < 0) {
            this.y = this.y;
            this.vy *= -1;
        }
        if ((this.y + this.radius) > this.effect.height + 18) {
            gameOverUI.classList.add('activate');
            gameOver === false && setTimeout(() => { cancelAnimationFrame(requestAnimationFrameRef); }, 200);
            gameOver = true;
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
        this.platform = new Platform(this.canvas, 10, 1, 'hsl(215,100%,50%)');
        this.noOfTilesPerRow = Math.floor(this.width / (Tile.width));
        this.noOfRows = 3;
        this.tileAdjustment = (this.width - this.noOfTilesPerRow * Tile.width + Tile.gap) * 0.5;
        this.statsBoard = new StatsBoard(this.canvas, 0, this.height - 40);
        this.createParticle();
    }
    createParticle() {
        for (let i = 2; i <= this.noOfRows + 1; i++) {
            for (let j = 0; j < this.noOfTilesPerRow; j++) {
                const spawnCharaterOnFirstRow = i === 2 ? true : false;
                this.tiles.push(new Tile(Tile.width * j + this.tileAdjustment, Tile.height * i, spawnCharaterOnFirstRow));
            }
        }
    }
    handleParticles(context) {
        this.tiles.forEach((tile, index) => {
            tile.draw(context, this.platform);
            if (tile.deativateTile(this.ball))
                this.cleanUp(index);
            const rectangle1 = { x: tile.nains.x, y: tile.nains.y, width: tile.nains.width, height: tile.nains.height - tile.nains.verticalShift };
            const rectangle2 = { x: this.platform.x, y: this.platform.y, width: this.platform.width, height: this.platform.height };
            if (tile.nains.bounceNaine(rectangle1, rectangle2)) {
                this.platform.shake.shake = 1;
                this.cleanUp(index);
            }
            if (tile.nains.y > canvas.height)
                this.tiles = this.tiles.filter(tile => !tile.deactivate);
        });
        this.ball.draw(context);
        this.ball.update(this.platform);
        this.platform.draw(context);
        this.statsBoard.draw(context);
        this.tiles.forEach(tile => {
            this.platform.bullet.forEach(bullet => bullet.deactivateBullet(tile));
        });
        if (this.tiles.length === 0) {
            Array.from(document.querySelectorAll('.score .score-count')).forEach(ui => ui.innerHTML = score.toString());
            restartGame.classList.add('activate');
            gameOver === false && setTimeout(() => { cancelAnimationFrame(requestAnimationFrameRef); }, 200);
            gameOver = true;
        }
    }
    cleanUp(index) {
        const tile = this.tiles[index];
        if (!tile)
            return;
    }
}
class Platform {
    constructor(canvas, x, bounce, color) {
        this.canvas = canvas;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        this.height = 20;
        this.width = 80;
        this.x = x;
        this.y = this.canvasHeight - 70;
        this.platformHitPanelty = 0.6;
        this.radius = 4;
        this.bounceFactor = bounce;
        this.color = color;
        this.shake = new ShakeOnHit();
        this.bullet = [];
        this.bulletOffset = 10;
    }
    draw(context) {
        if (this.shake.shake < this.platformHitPanelty && this.x - 10 * controls.x > 0 && this.x + this.width - 10 * controls.x < this.canvasWidth)
            this.x -= 10 * controls.x;
        this.bullet.forEach(bullet => {
            bullet.draw(context);
            if (bullet.y < -20) {
                bullet.deactive = true;
            }
        });
        context.fillStyle = this.color;
        this.shake.vibrate();
        context.beginPath();
        context.moveTo(this.x + this.shake.vibrateX + this.radius, this.y + this.shake.vibrateY);
        context.arcTo(this.x + this.shake.vibrateX + this.width, this.y + this.shake.vibrateY, this.x + this.shake.vibrateX + this.width, this.y + this.shake.vibrateY + this.height, this.radius);
        context.arcTo(this.x + this.shake.vibrateX + this.width, this.y + this.shake.vibrateY + this.height, this.x + this.shake.vibrateX, this.y + this.shake.vibrateY + this.height, this.radius);
        context.arcTo(this.x + this.shake.vibrateX, this.y + this.shake.vibrateY + this.height, this.x + this.shake.vibrateX, this.y + this.shake.vibrateY, this.radius);
        context.arcTo(this.x + this.shake.vibrateX, this.y + this.shake.vibrateY, this.x + this.shake.vibrateX + this.width, this.y + this.shake.vibrateY, this.radius);
        context.closePath();
        gunActive && context.arc(this.x + this.shake.vibrateX + this.bulletOffset, this.y + this.shake.vibrateY, 5, Math.PI, 2 * Math.PI);
        gunActive && context.arc(this.x + this.shake.vibrateX + this.width - this.bulletOffset, this.y + this.shake.vibrateY, 5, Math.PI, 2 * Math.PI);
        context.fill();
        this.shake.runEveryFrame();
        this.bulletCleanUp();
    }
    bulletCleanUp() {
        this.bullet = this.bullet.filter(bullet => !bullet.deactive);
    }
}
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vy = 7;
        this.length = 5;
        this.deactive = false;
    }
    draw(context) {
        if (this.deactive)
            return;
        context.beginPath();
        context.moveTo(this.x, this.y);
        context.lineTo(this.x, this.y + this.length);
        context.strokeStyle = 'white';
        context.stroke();
        this.y -= this.vy;
    }
    deactivateBullet(tile) {
        if (!tile.deactivate && this.x > tile.x && this.x < tile.x + tile.effectiveWidth && this.y < tile.y + tile.effectiveHeight) {
            this.deactive = true;
            tile.deactivate = true;
            score++;
            if (tile.shouldDrawNains) {
                if (tile.nains.nainsIsPresent) {
                    tile.nains.shouldNainsFall = true;
                }
                tile.nains.force = 5;
                tile.nains.vy = 2;
            }
        }
    }
}
class Tile {
    constructor(x, y, spawn = false) {
        this.x = x;
        this.y = y;
        this.color = 'hsl(300,100%,50%)';
        this.deactivate = false;
        this.effectiveWidth = Tile.width - Tile.gap;
        this.effectiveHeight = Tile.height - Tile.gap;
        this.soundTrack = Math.floor(Math.random() * 3);
        this.nains = new Character(this.x + 5, this.y);
        this.shouldDrawNains = spawn && Math.floor(Math.random() * 4) === 1 ? true : false;
        this.lastCollisionTime = 0;
    }
    draw(context, platform) {
        context.fillStyle = this.color;
        !this.deactivate && context.fillRect(this.x, this.y, this.effectiveWidth, this.effectiveHeight);
        if (this.shouldDrawNains) {
            this.nains.drawNains(context, platform);
        }
    }
    deativateTile(ball) {
        const circle = { x: ball.x, y: ball.y, radius: ball.radius };
        const rectangle = { x: this.x, y: this.y, width: this.effectiveWidth, height: this.effectiveHeight };
        if (!this.deactivate && detectCollision(circle, rectangle)) {
            this.deactivate = true;
            if (!ball.rocketMode) {
                ball.vy *= -1;
            }
            score++;
            SoundEffect(this.soundTrack);
            if (score !== 0 && score % 8 === 0 && ball.vy < 10) {
                ball.vy *= 1.1;
            }
            if (this.shouldDrawNains) {
                if (this.nains.nainsIsPresent) {
                    this.nains.shouldNainsFall = true;
                }
                this.nains.force = 5;
                this.nains.vy = 2;
            }
            this.lastCollisionTime = lastTime;
            return true;
        }
        else
            return false;
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
class Pot {
    constructor(x, y) {
        this.potNumber = Math.floor(Math.random() * (13 - 9)) + 9;
        this.x = x;
        this.y = y;
        this.potHeight = 24;
        this.potWidth = 24;
        this.angle = 0;
        this.potx = 0;
        this.poty = 0;
        this.potV = 10;
        this.potIsActive = false;
        this.explodePotKeyFrame = 0;
        this.potCollided = false;
        this.pot = document.querySelector('#character .character');
        this.explosionImage = document.querySelector('#character .explosion');
        this.explositionWidth = 256;
        this.explositionHeight = 341;
        this.explosionSound = Math.floor(Math.random() * (8 - 5)) + 5;
        this.verticalShift = 25;
        this.spriteSheetRowNumber = 4;
    }
    explode(context) {
        if (!this.potCollided)
            return;
        context.drawImage(this.explosionImage, this.explodePotKeyFrame * this.explositionWidth, 0, this.explositionWidth, this.explositionHeight, this.potx - this.explositionWidth * 0.5, this.poty - this.explositionHeight * 0.6, this.explositionWidth, this.explositionHeight);
        this.explodePotKeyFrame < 44 ? this.explodePotKeyFrame += 1 : '';
    }
    draw(context, platform) {
        if (!this.potIsActive)
            return;
        const rectangle1 = { x: this.potx, y: this.poty - this.verticalShift * this.potHeight, width: this.potWidth, height: this.potHeight };
        const rectangle2 = { x: platform.x, y: platform.y, width: platform.width, height: platform.height };
        this.potCollided = detectRectangleCollision(rectangle1, rectangle2);
        if (!this.potCollided) {
            this.potx += this.potV * Math.cos(this.angle);
            this.poty += this.potV * Math.sin(this.angle);
            this.potV *= 1.01;
            context.drawImage(this.pot, this.potNumber * this.potWidth, this.spriteSheetRowNumber * this.potHeight, this.potWidth, this.potHeight, this.x, this.y - this.verticalShift * this.potHeight, this.potWidth, this.potHeight);
        }
        else {
            if (!this.potIsActive) {
                platform.shake.shake = 1;
                SoundEffect(this.explosionSound);
                lives--;
                if (lives === 0) {
                    Array.from(document.querySelectorAll('.score .score-count')).forEach(ui => ui.innerHTML = score.toString());
                    gameOverUI.classList.add('activate');
                    gameOver === false && setTimeout(() => { cancelAnimationFrame(requestAnimationFrameRef); }, 800);
                    gameOver = true;
                }
            }
            this.potIsActive = true;
        }
    }
}
class Character {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24 + 1;
        this.height = 24 + 1;
        this.vx = 0;
        this.vy = 0;
        this.force = 0;
        this.damping = 0.98;
        this.nainsImage = document.querySelector('#character .character');
        this.powerUpImage = document.querySelector('#character .power-up');
        this.nainsIdea = Math.floor(Math.random() * 8);
        this.nainsFall = 0;
        this.nainsAim = 1;
        this.nainsCloseEye = 0;
        this.nainsBounceCount = 0;
        this.nainsWidthOnScreenX = this.width;
        this.nainsWidthOnScreenY = this.height;
        this.verticalShift = 25;
        this.spawnAt = Math.floor(Math.random() * (12000 - 10000)) + 10000;
        this.powerUp = Math.floor(Math.random() * 9);
        this.lastCollision = 0;
        this.powerUpWidth = 44;
        this.powerUpHeight = 44;
        this.powerUpShowAt = 3;
        this.time = (Math.random() * 10000) + lastTime + 10000;
        this.nainsIsPresent = false;
        this.shouldNainsFall = false;
        this.showPowerUp = false;
        this.id = crypto.randomUUID();
        this.runOnce = false;
        this.nainsFrame = 0;
    }
    drawNains(context, platform) {
        if (this.nainsBounceCount > this.powerUpShowAt) {
            this.nainsWidthOnScreenX *= 0.95;
            this.nainsWidthOnScreenY *= 0.95;
            if (this.vy - this.force < 0) {
                this.showPowerUp = true;
                this.shouldNainsFall = false;
                this.force *= this.damping;
            }
        }
        if (lastTime - this.time > 0 && !this.runOnce) {
            this.runOnce = true;
            this.nainsIsPresent = true;
        }
        if (this.nainsIsPresent && !this.shouldNainsFall && !this.showPowerUp) {
            if (this.nainsFrame >= 0 && this.nainsFrame < 200)
                context.drawImage(this.nainsImage, Math.floor(this.nainsIdea) * this.width, 0, this.width, this.height, this.x, this.y - this.verticalShift, this.width, this.height);
            else if (this.nainsFrame >= 200 && this.nainsFrame <= 400)
                context.drawImage(this.nainsImage, Math.floor(this.nainsIdea) * this.width, 4 * this.height, this.width, this.height, this.x, this.y - this.verticalShift, this.width, this.height);
            else {
                context.drawImage(this.nainsImage, 1 * this.width, 2 * this.height, this.width, this.height, this.x, this.y - this.verticalShift, this.width, this.height);
            }
            if (this.nainsIdea > 8)
                this.nainsIdea = 0;
            else
                this.nainsIdea += 0.3;
            this.nainsFrame < 600 ? this.nainsFrame++ : this.nainsFrame = 0;
        }
        else if (this.nainsIsPresent && this.shouldNainsFall && !this.showPowerUp) {
            context.drawImage(this.nainsImage, Math.floor(this.nainsFall) * this.width, 6 * this.height, this.width, this.height, this.x, this.y - this.verticalShift, this.width, this.height);
            if (this.nainsFall > 14)
                this.nainsFall = 0;
            else
                this.nainsFall += 0.3;
        }
        else if (this.nainsIsPresent && !this.shouldNainsFall && this.showPowerUp) {
            context.drawImage(this.powerUpImage, this.powerUp * this.powerUpWidth, 0, this.powerUpWidth, this.powerUpHeight, this.x - this.powerUpWidth / 4, this.y - this.verticalShift, this.powerUpWidth, this.powerUpHeight);
        }
        if (this.vy - this.force > 0) {
            this.vy *= 1.02;
        }
        else {
            this.force *= this.damping;
        }
        this.y += this.vy - this.force;
    }
    bounceNaine(rectangle1, rectangle2) {
        if (!this.nainsIsPresent)
            return false;
        if (detectRectangleCollision(rectangle1, rectangle2)) {
            if (this.nainsBounceCount > this.powerUpShowAt) {
                powerUpManager(this.powerUp);
                this.nainsIsPresent = false;
                return false;
            }
            this.force *= this.vy * 0.53;
            this.vy = 2;
            this.nainsBounceCount++;
            this.lastCollision = lastTime;
            return true;
        }
        return false;
    }
}
class StatsBoard {
    constructor(canvas, x, y) {
        this.x = x;
        this.y = y;
        this.offsetX = 5;
        this.offsetY = 15;
        this.height = 40;
        this.width = canvas.width;
        this.color = 'hsl(240,40%,50%)';
        this.textColor = 'hsl(0,0%,0%)';
    }
    draw(context) {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
        const scoreText = `Coins:- ${score}`;
        const livesText = `Health:- ${lives}`;
        context.fillStyle = this.textColor;
        context.fillText(scoreText, this.x + this.offsetX, this.y + this.offsetY + 15);
        context.fillText(livesText, this.width - 110, this.y + this.offsetY + 15);
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
startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startGame.classList.remove('activate');
    animation(0);
});
function detectCollision(circle, rectangle) {
    if (lastTime - lastCollisionTime < 20)
        return false;
    if (circle.x + circle.radius > rectangle.x && circle.x - circle.radius < rectangle.x + rectangle.width && circle.y + circle.radius > rectangle.y && circle.y - circle.radius < rectangle.y + rectangle.height) {
        lastCollisionTime = lastTime;
        return true;
    }
    else
        return false;
}
function detectRectangleCollision(rectangle1, rectangle2) {
    if (lastTime - lastCollisionTime < 20)
        return false;
    if (rectangle1.x + rectangle1.width > rectangle2.x && rectangle1.x < rectangle2.x + rectangle2.width && rectangle1.y + rectangle1.height > rectangle2.y && rectangle1.y < rectangle2.y + rectangle2.height) {
        lastCollisionTime = lastTime;
        return true;
    }
    else
        return false;
}
function powerUpManager(powerUp) {
    PowerUpEvent.detail.power.number = powerUp;
    document.dispatchEvent(PowerUpEvent);
}
document.addEventListener('powerUpEvent', ({ detail }) => {
    console.log('custom event fired', detail);
    if (detail && detail.power.number > 9)
        return;
    switch (detail === null || detail === void 0 ? void 0 : detail.power.number) {
        case 0:
            gunActive = true;
            break;
        case 1:
            lives++;
            break;
        case 2:
            score += 100;
            break;
        case 3:
            effect.platform.width = 24;
            effect.ball.vy = -10;
            break;
        case 4:
            const minWidth = effect.platform.width * 0.8;
            minWidth <= 24 ? effect.platform.width = 24 : effect.platform.width = minWidth;
            break;
        case 5:
            const maxWidth = effect.platform.width * 1.2;
            maxWidth > 110 ? effect.platform.width = 110 : effect.platform.width = maxWidth;
            break;
        case 6:
            effect.ball.vy -= 2;
            break;
        case 7:
            effect.ball.vy += 2;
            break;
        case 8:
            effect.ball.rocketMode = true;
            break;
        default:
            break;
    }
});
document.addEventListener('click', () => {
    if (!gunActive)
        return;
    const bulletOffset = effect.platform.bulletOffset;
    const x = effect.platform.x + bulletOffset;
    const y = effect.platform.y;
    const x2 = effect.platform.x + effect.platform.width - bulletOffset;
    effect.platform.bullet.push(new Bullet(x, y));
    effect.platform.bullet.push(new Bullet(x2, y));
});
