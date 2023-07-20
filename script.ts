import { Move as controls } from './controls.js'
import { gameOver } from './ui.js'

const canvas = document.querySelector('canvas')!
const ctx = canvas.getContext('2d')!
canvas.width = document.documentElement.clientWidth
canvas.height = document.documentElement.clientHeight

ctx.strokeStyle = 'white'
const fps = 30; // Frames per second
const interval = 1000 / fps; // Interval between frames in milliseconds
let lastTime = 0;
let requestAnimationFrameRef: number

// window.addEventListener('resize', () => {
//     cancelAnimationFrame(requestAnimationFrameRef)
//     canvas.width = document.documentElement.clientWidth
//     canvas.height = document.documentElement.clientHeight
//     effect = new Effect(canvas)
//     animation(0)
// })



class Particle {
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
        context.fillStyle = `hsl(${this.x * this.fillColorFactor}, 100%, 50%)`
        context.beginPath()
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        context.fill()
    }
    update(platform: Platform) {

        if (!this.doubleBounce && this.x + this.radius > platform.x && this.x - this.radius < platform.x + platform.width && platform.y < this.y + this.radius) {
            this.vy *= -1
            if (platform.y < this.y && platform.y + platform.height > this.y) {
                console.log('fire')
                this.vx *= -1
            }
            this.doubleBounce = true
            platform.shake.shake = 1

        }

        this.x += this.vx
        this.y += this.vy

        if ((this.x + this.radius) > this.effect.width || (this.x - this.radius) < 0) {
            this.x = this.x
            this.vx *= -1
            this.doubleBounce = false

        }
        if ((this.y - this.radius) < 0) {
            this.y = this.y
            this.vy *= -1
            this.doubleBounce = false

        }

        if ((this.y + this.radius) > this.effect.height + 18) {
            cancelAnimationFrame(requestAnimationFrameRef)
            gameOver.classList.toggle('activate')
        }

    }
    handleMouseMove() {

    }
}

class Effect {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    particles: Particle[];
    numberOfParticles: number;
    platform: Platform;
    tiles: Tile[];
    noOfTiles: number;
    tileAdjustment: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.width = this.canvas.width
        this.height = this.canvas.height
        this.particles = []
        this.numberOfParticles = 1
        this.tiles = []
        this.platform = new Platform(this.canvas, 80, 10, 1, 1, 'hsl(215,100%,50%)')
        this.noOfTiles = Math.floor(this.width / (Tile.width))
        this.tileAdjustment = 0
        this.createParticle()
    }

    createParticle() {
        for (let index = 0; index < this.numberOfParticles; index++) {
            this.particles.push(new Particle(this))
        }

        for (let i = 1; i < 4; i++) {
            for (let j = 0; j < this.noOfTiles; j++) {

                this.tiles.push(new Tile(Tile.width * j + this.tileAdjustment, Tile.height * i))

            }
        }
    }
    handleParticles(context: CanvasRenderingContext2D) {
        this.particles.forEach(particle => {
            particle.draw(context)
            particle.update(this.platform)
        })
        this.platform.draw(context)
        this.tiles.forEach(tile => {
            tile.draw(context)
        })
        // this.connectParticles(context)

    }
    connectParticles(context: CanvasRenderingContext2D) {
        const maxDistance = 100
        for (let a = 0; a < this.particles.length; a++) {
            for (let b = a; b < this.particles.length; b++) {
                // @ts-ignore
                const dx = this.particles[a].x - this.particles[b].x
                // @ts-ignore
                const dy = this.particles[a].y - this.particles[b].y
                const distance = Math.hypot(dx, dy)
                if (distance < maxDistance) {
                    context.save()
                    const opacity = 1 - distance / maxDistance
                    context.globalAlpha = opacity
                    context.beginPath()
                    // @ts-ignore
                    context.moveTo(this.particles[a].x, this.particles[a].y)
                    // @ts-ignore
                    context.lineTo(this.particles[b].x, this.particles[b].y)
                    context.stroke()
                    context.restore()
                }
            }
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
        this.bounceFactor = bounce
        this.color = color
        this.shake = new ShakeOnHit()
    }
    draw(context: CanvasRenderingContext2D) {
        if (this.x - 10 * controls.x > 0 && this.x + this.width - 10 * controls.x < this.canvasWidth)
            this.x -= 10 * controls.x

        context.fillStyle = this.color
        this.shake.vibrate()
        context.fillRect(this.x + this.shake.vibrateX, this.y + this.shake.vibrateY, this.width, this.height)

        this.shake.runEveryFrame()
    }
}

class Tile {
    x: number;
    y: number;
    color: string;

    static width = 40
    static height = 20
    static gap = 5
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.color = 'hsl(100,100%,50%)'
    }

    draw(context: CanvasRenderingContext2D) {
        context.fillStyle = this.color
        context.fillRect(this.x, this.y, Tile.width - Tile.gap, Tile.height - Tile.gap)
    }

    changeColor(context: CanvasRenderingContext2D) {
    }
}

class ShakeOnHit {
    shake: number;
    amplitude: number;
    angle: number;
    damping: number;
    vibrateX: number;
    vibrateY: number;
    constructor() {
        this.shake = 0
        this.amplitude = 2
        this.angle = 90
        this.damping = 0.9;
        this.vibrateX = 0
        this.vibrateY = 0
    }

    vibrate() {
        if (this.shake > 0) {
            this.vibrateX = Math.sin(this.angle) * this.amplitude * this.shake
            this.vibrateY = this.amplitude * this.shake
            this.shake *= this.damping
        }
    }
    runEveryFrame() {
        this.angle *= -1
    }
}

let effect = new Effect(canvas)

function animation(timestamp: number) {
    requestAnimationFrameRef = requestAnimationFrame(animation) // this should always be at the start
    // Calculate the time difference since the last frame
    let elapsedTime = timestamp - lastTime;

    // Proceed only if enough time has elapsed based on the desired frame rate
    if (elapsedTime > interval) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        effect.handleParticles(ctx)
        lastTime = timestamp;
    }
}

// requestAnimationFrameRef = requestAnimationFrame(animation)
animation(0)