import { Move as controls } from './controls.js'
import { gameOver, restartGame, startGame, startBtn } from './ui.js'
import { SoundEffect, soundsArrayLength } from './soundManager.js'

const canvas = document.querySelector('canvas')!
const ctx = canvas.getContext('2d')!
canvas.width = Math.min(document.documentElement.clientWidth, 610)
canvas.height = document.documentElement.clientHeight - 20
ctx.strokeStyle = 'white'

const fps = 30 // Frames per second
const frameTime = 1000 / fps // frameTime between frames in milliseconds
let lastTime = 0
let deltaTime = 0

let requestAnimationFrameRef: number

// add resize event handler here

class Ball {
    x: number;
    y: number;
    radius: number;
    effect: Effect;
    vx: number;
    vy: number;
    friction: number;
    fillColorFactor: number;
    doubleBounce: boolean;

    constructor(effect: Effect) {
        this.effect = effect
        this.radius = 8
        this.x = 20
        this.y = this.effect.height - 40
        this.vx = Math.random() * 5 - 2
        this.vy = -5
        this.friction = 0.98
        this.fillColorFactor = 360 / canvas.width
        this.doubleBounce = false
    }

    draw(context: CanvasRenderingContext2D) {
        context.fillStyle = `hsl(60, 100%, 50%)`
        // context.fillStyle = `hsl(${this.x * this.fillColorFactor}, 100%, 50%)`
        context.beginPath()
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        context.fill()
    }
    update(platform: Platform) {

        const circle = { x: this.x, y: this.y, radius: this.radius }
        const rectangle = { x: platform.x, y: platform.y, width: platform.width, height: platform.height }

        //collision with platform
        if (!this.doubleBounce && detectCollision(circle, rectangle)) {
            this.vy *= -1
            const ratio = (this.x - platform.x) / (platform.width)
            if (ratio < 0.2)
                this.vx = -2
            else if (ratio < 0.4)
                this.vx = -1
            else if (ratio < 0.6)
                this.vx = 0
            else if (ratio < 0.8)
                this.vx = 1
            else if (ratio <= 1)
                this.vx = 2
            this.doubleBounce = true
            platform.shake.shake = 1
            const sound = Math.floor(Math.random() * (5 - 3)) + 3
            SoundEffect(sound)

        }


        // collision with verticals boundary walls 
        if ((this.x + this.radius) > this.effect.width || (this.x - this.radius) < 0) {
            this.x = this.x
            this.vx *= -1
            this.doubleBounce = false

        }

        // collision with top
        if ((this.y - this.radius) < 0) {
            this.y = this.y
            this.vy *= -1
            this.doubleBounce = false

        }

        // end game
        if ((this.y + this.radius) > this.effect.height + 18) {
            cancelAnimationFrame(requestAnimationFrameRef)
            gameOver.classList.add('activate')
        }

        this.x += this.vx
        this.y += this.vy
    }
    handleMouseMove() {

    }
}

class Effect {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    ball: Ball;
    platform: Platform;
    tiles: Tile[];
    noOfTilesPerRow: number;
    noOfRows: number;
    tileAdjustment: number;
    inactiveTiles: number;


    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.width = this.canvas.width
        this.height = this.canvas.height
        this.ball = new Ball(this)
        this.tiles = []
        this.platform = new Platform(this.canvas, 80, 10, 1, 1, 'hsl(215,100%,50%)')
        this.noOfTilesPerRow = Math.floor(this.width / (Tile.width))
        this.noOfRows = 3
        this.tileAdjustment = (this.width - this.noOfTilesPerRow * Tile.width + Tile.gap) * 0.5
        this.inactiveTiles = 0

        this.createParticle()
    }

    createParticle() {
        for (let i = 2; i <= this.noOfRows + 1; i++) { //starting from to give myself 2xheight for charater placement 
            for (let j = 0; j < this.noOfTilesPerRow; j++) {
                const spawnCharaterOnFirstRow = i === 2 ? true : false
                this.tiles.push(new Tile(Tile.width * j + this.tileAdjustment, Tile.height * i, spawnCharaterOnFirstRow))
            }
        }
    }
    handleParticles(context: CanvasRenderingContext2D) {
        this.tiles.forEach(tile => {
            tile.draw(context)
            this.inactiveTiles += tile.deactivateBall(this.ball)

            const rectangle1 = { x: tile.nains.x, y: tile.nains.y, width: tile.nains.width, height: tile.nains.height }
            const rectangle2 = { x: this.platform.x, y: this.platform.y, width: this.platform.width, height: this.platform.height }

            tile.nains.bounceNaine(rectangle1, rectangle2)
        })
        this.ball.draw(context)
        this.ball.update(this.platform)
        this.platform.draw(context)

        if (this.inactiveTiles === this.noOfTilesPerRow * this.noOfRows) {
            restartGame.classList.add('activate')
            cancelAnimationFrame(requestAnimationFrameRef)
        }
    }

}

class Platform {
    canvas: HTMLCanvasElement;
    canvasWidth: number;
    canvasHeight: number;
    height: number;
    width: number;
    x: number;
    y: number;
    radius: number;
    bounceFactor: number;
    color: string;
    shake: ShakeOnHit

    constructor(canvas: HTMLCanvasElement, width: number, x: number, bounce: number, shake: number, color: string) {
        this.canvas = canvas
        this.canvasWidth = canvas.width
        this.canvasHeight = canvas.height
        this.height = 20
        this.width = width
        this.x = x
        this.y = this.canvasHeight - this.height - 10
        this.radius = 4
        this.bounceFactor = bounce
        this.color = color
        this.shake = new ShakeOnHit()
    }
    draw(context: CanvasRenderingContext2D) {
        // controls
        if (this.x - 10 * controls.x > 0 && this.x + this.width - 10 * controls.x < this.canvasWidth)
            this.x -= 10 * controls.x

        context.fillStyle = this.color
        this.shake.vibrate()

        context.beginPath();
        context.moveTo(this.x + this.radius, this.y);
        context.arcTo(this.x + this.width, this.y, this.x + this.width, this.y + this.height, this.radius);
        context.arcTo(this.x + this.width, this.y + this.height, this.x, this.y + this.height, this.radius);
        context.arcTo(this.x, this.y + this.height, this.x, this.y, this.radius);
        context.arcTo(this.x, this.y, this.x + this.width, this.y, this.radius);
        context.closePath();
        context.fill();

        this.shake.runEveryFrame()
    }
}

class Tile {
    x: number;
    y: number;
    color: string;
    deactivate: boolean;
    effectiveWidth: number;
    effectiveHeight: number;
    soundTrack: number;
    nains: Character;
    shouldDrawNains: boolean
    static width = 40
    static height = 20
    static gap = 5

    constructor(x: number, y: number, spawn = false) {
        this.x = x
        this.y = y
        this.color = 'hsl(300,100%,50%)'
        this.deactivate = false
        this.effectiveWidth = Tile.width - Tile.gap
        this.effectiveHeight = Tile.height - Tile.gap
        this.soundTrack = Math.floor(Math.random() * 3)
        this.nains = new Character(this.x + 5, this.y)
        this.shouldDrawNains = spawn && Math.floor(Math.random() * 20) === 1 ? true : false
    }

    draw(context: CanvasRenderingContext2D) {
        context.fillStyle = this.color
        !this.deactivate && context.fillRect(this.x, this.y, this.effectiveWidth, this.effectiveHeight)

        if (this.shouldDrawNains) {
            this.nains.drawNains(context)
        }
    }

    deactivateBall(ball: Ball) {

        const circle = { x: ball.x, y: ball.y, radius: ball.radius }
        const rectangle = { x: this.x, y: this.y, width: this.effectiveWidth, height: this.effectiveHeight }
        if (!this.deactivate && detectCollision(circle, rectangle)) {
            this.deactivate = true
            this.deactivate = true
            SoundEffect(this.soundTrack)
            if (this.shouldDrawNains) {
                this.nains.fall = true
                this.nains.force = 5
                this.nains.vy = 2
            }
            return 1
        }
        else return 0

    }
}

class ShakeOnHit {
    shake: number;
    amplitude: number;
    switch: number;
    damping: number;
    vibrateX: number;
    vibrateY: number;
    constructor() {
        this.shake = 0
        this.amplitude = 2
        this.switch = 1
        this.damping = 0.9;
        this.vibrateX = 0
        this.vibrateY = 0
    }

    vibrate() {
        if (this.shake > 0) {
            this.vibrateX = this.switch * this.amplitude * this.shake
            this.vibrateY = this.amplitude * this.shake
            this.shake *= this.damping
        }
    }
    runEveryFrame() {
        this.switch *= -1
    }
}

class Character {
    x: number;
    y: number;
    vx: number;
    vy: number;
    force: number;
    damping: number;
    width: number;
    height: number;
    nainsImage: HTMLImageElement;
    frameNains: number;
    verticalShift: number;
    fall: boolean;
    spawn: number;
    canSpawn: boolean;

    constructor(x: number, y: number) {
        this.x = x
        this.width = 24 + 1
        this.height = 24 + 1
        this.y = y
        this.vx = 0
        this.vy = 0
        this.force = 0
        this.damping = 0.98
        this.nainsImage = document.querySelector('#character img')!
        this.frameNains = Math.floor(Math.random() * 8)
        this.verticalShift = 25
        this.fall = false
        this.spawn = Math.floor(Math.random() * (12000 - 10000)) + 10000
        this.canSpawn = false
    }

    drawNains(context: CanvasRenderingContext2D) {
        if (!this.fall) {
            const rowNumber = 0
            if (lastTime > this.spawn) {
                this.canSpawn = true
                context.drawImage(this.nainsImage, Math.floor(this.frameNains) * this.width, rowNumber * this.height, this.width, this.height, this.x, this.y - this.verticalShift, this.width, this.height)
            }
            this.frameNains < 8 ? this.frameNains += 0.35 : this.frameNains = 0
        } else {
            const rowNumber = 6
            this.canSpawn && context.drawImage(this.nainsImage, this.frameNains * this.width, rowNumber * this.height, this.width, this.height, this.x, this.y - this.verticalShift, this.width, this.height)
            this.frameNains < 14 ? this.frameNains += 1 : this.frameNains = 0



            if (this.vy - this.force > 0) {
                this.vy *= 1.02
            } else {
                this.force *= this.damping
            }
            this.y += this.vy - this.force
        }
    }

    bounceNaine(rectangle1: IRectangleCollisionProps, rectangle2: IRectangleCollisionProps) {
        if (!this.fall || !this.canSpawn) return
        if (detectRectangleCollision(rectangle1, rectangle2)) {
            console.log('fire') 
            this.force = 5//fix this
        }
    }
}

let effect = new Effect(canvas)

function animation(currentTime: number) {
    requestAnimationFrameRef = requestAnimationFrame(animation) // this should always be at the start
    // Calculate the time difference since the last frame
    deltaTime = currentTime - lastTime;

    // Proceed only if enough time has elapsed based on the desired frame rate
    if (deltaTime >= frameTime) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        effect.handleParticles(ctx)
        lastTime = currentTime - (deltaTime % frameTime)
    }
}

// requestAnimationFrameRef = requestAnimationFrame(animation)

startBtn.addEventListener('click', () => {
    startGame.classList.remove('activate')
    animation(0)
})


function detectCollision(circle: ICircleCollisionProps, rectangle: IRectangleCollisionProps): boolean {
    if (circle.x + circle.radius > rectangle.x && circle.x - circle.radius < rectangle.x + rectangle.width && circle.y + circle.radius > rectangle.y && circle.y - circle.radius < rectangle.y + rectangle.height)
        return true
    else return false
}


function detectRectangleCollision(rectangle1: IRectangleCollisionProps, rectangle2: IRectangleCollisionProps): boolean {
    if (rectangle1.x + rectangle1.width > rectangle2.x && rectangle1.x < rectangle2.x + rectangle2.width && rectangle1.y + rectangle1.height > rectangle2.y && rectangle1.y < rectangle2.y + rectangle2.height)
        return true
    else return false
}