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
let lastCollisionTime = 0

let requestAnimationFrameRef: number

// add resize event handler here

//custom event
const PowerUpEvent = new CustomEvent('powerUpEvent', { detail: { power: { type: '', number: -1 } } })

class Ball {
    x: number;
    y: number;
    radius: number;
    effect: Effect;
    vx: number;
    vy: number;
    friction: number;
    fillColorFactor: number;
    rocketMode: boolean;

    constructor(effect: Effect) {
        this.effect = effect
        this.radius = 8
        this.x = 20
        this.y = this.effect.height - 40
        this.vx = Math.random() * 5 - 2
        this.vy = -5
        this.friction = 0.98
        this.fillColorFactor = 360 / canvas.width
        this.rocketMode = false
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
        if (detectCollision(circle, rectangle)) {
            this.vy *= -1
            const ratio = (this.x - platform.x) / (platform.width)
            if (ratio <= 0)
                this.vx = -3
            else if (ratio < 0.2)
                this.vx = -2
            else if (ratio < 0.4)
                this.vx = -1
            else if (ratio < 0.6)
                this.vx = 0
            else if (ratio < 0.8)
                this.vx = 1
            else if (ratio < 1)
                this.vx = 2
            else if (ratio >= 1)
                this.vx = 3
            platform.shake.shake = 1
            const sound = Math.floor(Math.random() * (5 - 3)) + 3
            SoundEffect(sound)
        }


        // collision with verticals boundary walls 
        if ((this.x + this.radius) > this.effect.width || (this.x - this.radius) < 0) {
            this.x = this.x
            this.vx *= -1
        }

        // collision with top
        if ((this.y - this.radius) < 0) {
            this.y = this.y
            this.vy *= -1
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
        this.platform = new Platform(this.canvas, 10, 1, 'hsl(215,100%,50%)')
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
        this.tiles.forEach((tile, index) => {
            tile.draw(context, this.platform)
            const shouldDeactivate = tile.deactivateBall(this.ball)
            this.inactiveTiles += shouldDeactivate
            if (shouldDeactivate === 1) this.cleanUp(index)
            const rectangle1 = { x: tile.nains.x, y: tile.nains.y, width: tile.nains.width, height: tile.nains.height - tile.nains.verticalShift } // zero since height was originally shifted 25 px
            const rectangle2 = { x: this.platform.x, y: this.platform.y, width: this.platform.width, height: this.platform.height }

            if (tile.nains.bounceNaine(rectangle1, rectangle2)) {
                this.platform.shake.shake = 1
                this.cleanUp(index)
            }
        })
        this.ball.draw(context)
        this.ball.update(this.platform)
        this.platform.draw(context)

        this.tiles.forEach(tile => {
            // tile.nains.explode(context)
        })

        if (this.inactiveTiles === this.noOfTilesPerRow * this.noOfRows) {
            restartGame.classList.add('activate')
            cancelAnimationFrame(requestAnimationFrameRef)
        }
    }

    cleanUp(index: number) {
        const tile = this.tiles[index]
        if (!tile) return
        if ((tile.deactivate && !tile.nains.canSpawn) || (tile.nains.canSpawn && tile.nains.y > this.canvas.height + 50)) {
            const temp = [...this.tiles]
            temp.splice(index, 1)
            this.tiles = temp
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
    platformHitPanelty: number;
    radius: number;
    bounceFactor: number;
    color: string;
    shake: ShakeOnHit

    constructor(canvas: HTMLCanvasElement, x: number, bounce: number, color: string) {
        this.canvas = canvas
        this.canvasWidth = canvas.width
        this.canvasHeight = canvas.height
        this.height = 20
        this.width = 80
        this.x = x
        this.y = this.canvasHeight - this.height - 10
        this.platformHitPanelty = 0.6
        this.radius = 4
        this.bounceFactor = bounce
        this.color = color
        this.shake = new ShakeOnHit()
    }
    draw(context: CanvasRenderingContext2D) {
        // controls
        if (this.shake.shake < this.platformHitPanelty && this.x - 10 * controls.x > 0 && this.x + this.width - 10 * controls.x < this.canvasWidth)
            this.x -= 10 * controls.x

        context.fillStyle = this.color
        this.shake.vibrate()

        context.beginPath();
        context.moveTo(this.x + this.shake.vibrateX + this.radius, this.y + this.shake.vibrateY);
        context.arcTo(this.x + this.shake.vibrateX + this.width, this.y + this.shake.vibrateY, this.x + this.shake.vibrateX + this.width, this.y + this.shake.vibrateY + this.height, this.radius);
        context.arcTo(this.x + this.shake.vibrateX + this.width, this.y + this.shake.vibrateY + this.height, this.x + this.shake.vibrateX, this.y + this.shake.vibrateY + this.height, this.radius);
        context.arcTo(this.x + this.shake.vibrateX, this.y + this.shake.vibrateY + this.height, this.x + this.shake.vibrateX, this.y + this.shake.vibrateY, this.radius);
        context.arcTo(this.x + this.shake.vibrateX, this.y + this.shake.vibrateY, this.x + this.shake.vibrateX + this.width, this.y + this.shake.vibrateY, this.radius);
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
    shouldDrawNains: boolean;
    lastCollisionTime: number;
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
        this.lastCollisionTime = 0
    }

    draw(context: CanvasRenderingContext2D, platform: Platform) {
        context.fillStyle = this.color
        !this.deactivate && context.fillRect(this.x, this.y, this.effectiveWidth, this.effectiveHeight)

        if (this.shouldDrawNains) {
            this.nains.drawNains(context, platform)
        }

    }

    deactivateBall(ball: Ball) {

        const circle = { x: ball.x, y: ball.y, radius: ball.radius }
        const rectangle = { x: this.x, y: this.y, width: this.effectiveWidth, height: this.effectiveHeight }

        if (!this.deactivate && detectCollision(circle, rectangle)) {
            this.deactivate = true
            this.deactivate = true
            if (!ball.rocketMode) {
                ball.vy *= -1
            }

            SoundEffect(this.soundTrack)
            if (this.shouldDrawNains) {
                this.nains.fall = true
                this.nains.force = 5
                this.nains.vy = 2
            }
            this.lastCollisionTime = lastTime
            return 1
        }
        else
            return 0
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
    nainsBounceCount: number;
    nainsWidthOnScreenX: number;
    nainsWidthOnScreenY: number;
    explosionImage: HTMLImageElement;
    powerUpImage: HTMLImageElement;
    frameNains: number;
    verticalShift: number;
    fall: boolean;
    spawn: number;
    powerUp: number;
    canSpawn: boolean;
    showPowerUp: boolean;
    lastCollision: number;
    potNumber: number;
    potHeight: number;
    angle: number;
    potx: number;
    poty: number;
    potV: number;
    potCollided: boolean;
    potDeactivated: boolean;
    explodePotKeyFrame: number;
    explositionWidth: number;
    explositionHeight: number;
    explosionSound: number;
    powerUpWidth: number;
    powerUpHeight: number;
    powerUpShowAt: number;

    constructor(x: number, y: number) {
        this.x = x
        this.width = 24 + 1
        this.height = 24 + 1
        this.y = y
        this.vx = 0
        this.vy = 0
        this.force = 0
        this.damping = 0.98
        this.nainsImage = document.querySelector('#character .character')!
        this.explosionImage = document.querySelector('#character .explosion')!
        this.powerUpImage = document.querySelector('#character .power-up')!
        this.nainsBounceCount = 0
        this.frameNains = Math.floor(Math.random() * 8)
        this.nainsWidthOnScreenX = this.width
        this.nainsWidthOnScreenY = this.height
        this.verticalShift = 25
        this.fall = false
        this.showPowerUp = false
        this.spawn = Math.floor(Math.random() * (12000 - 10000)) + 10000
        this.powerUp = Math.floor(Math.random() * 9)
        this.canSpawn = false
        this.lastCollision = 0
        this.potNumber = Math.floor(Math.random() * (13 - 9)) + 9
        this.potHeight = 1.7
        this.angle = 0
        this.potx = 1
        this.poty = 1
        this.potV = 10
        this.potCollided = false
        this.potDeactivated = false
        this.explodePotKeyFrame = 0
        this.powerUpWidth = 44
        this.powerUpHeight = 44
        this.powerUpShowAt = 3
        this.explositionWidth = 256
        this.explositionHeight = 341
        this.explosionSound = Math.floor(Math.random() * (8 - 5)) + 5
    }

    drawNains(context: CanvasRenderingContext2D, platform: Platform) {
        let spriteSheetRowNumber: number
        if (!this.fall) {
            if (lastTime > this.spawn) {
                if (lastTime - this.spawn > 8000) {
                    // setting up things for the first time
                    if (this.potx === 1 && this.poty === 1) {
                        this.angle = Math.atan2(platform.y - this.y + this.verticalShift * this.potHeight, (platform.x + platform.width * 0.5) - this.x)
                        this.potx = this.x
                        this.poty = this.y
                    }

                    const rectangle1: IRectangleCollisionProps = { x: this.potx, y: this.poty - this.verticalShift * this.potHeight, width: this.width, height: this.height }
                    const rectangle2: IRectangleCollisionProps = { x: platform.x, y: platform.y, width: platform.width, height: platform.height }
                    if (!this.potDeactivated) {
                        this.potCollided = detectRectangleCollision(rectangle1, rectangle2)
                    }


                    spriteSheetRowNumber = 4
                    // nains
                    context.drawImage(this.nainsImage, Math.floor(this.frameNains) * this.width, spriteSheetRowNumber * this.height, this.width, this.height, this.x, this.y - this.verticalShift, this.width, this.height)


                    if (!this.potCollided) {
                        this.potx += this.potV * Math.cos(this.angle)
                        this.poty += this.potV * Math.sin(this.angle)
                        this.potV *= 1.01
                        //pots
                        context.drawImage(this.nainsImage, this.potNumber * this.width, spriteSheetRowNumber * this.height, this.width, this.height, this.potx, this.poty - this.verticalShift * this.potHeight, this.width, this.height)
                        // this.explodePotKeyFrame = 0
                    } else {
                        // explosion. drawimage called in different function to have it show over the platform
                        if (!this.potDeactivated) {
                            platform.shake.shake = 1
                            SoundEffect(this.explosionSound)
                        }

                        // context.drawImage(this.explosionImage, this.explodePotKeyFrame * this.explositionWidth, 0, this.explositionWidth, this.explositionHeight, this.potx - this.explositionWidth * 0.5, this.poty - this.explositionHeight * 0.6, this.explositionWidth, this.explositionHeight)
                        // this.explodePotKeyFrame < 44 ? this.explodePotKeyFrame += 1 : ''
                        this.potDeactivated = true
                    }

                    //reset for next round of assult
                    if (lastTime - this.spawn > 15000) {
                        this.spawn = lastTime
                        this.potx = 1
                        this.poty = 1
                        this.potV = 10
                        this.potDeactivated = false
                        this.explodePotKeyFrame = 0
                    }
                } else if (lastTime - this.spawn > 5000) {

                    this.frameNains = 1
                    // nains
                    spriteSheetRowNumber = 2
                    context.drawImage(this.nainsImage, this.frameNains * this.width, spriteSheetRowNumber * this.height, this.width, this.height, this.x, this.y - this.verticalShift, this.width, this.height)

                    //pots
                    spriteSheetRowNumber = 4
                    context.drawImage(this.nainsImage, this.potNumber * this.width, spriteSheetRowNumber * this.height, this.width, this.height, this.x, this.y - this.verticalShift * this.potHeight, this.width, this.height)
                }
                else {
                    //nains
                    spriteSheetRowNumber = 0
                    context.drawImage(this.nainsImage, Math.floor(this.frameNains) * this.width, spriteSheetRowNumber * this.height, this.width, this.height, this.x, this.y - this.verticalShift, this.width, this.height)
                }
                this.frameNains < 8 ? this.frameNains += 0.35 : this.frameNains = 0
                this.canSpawn = true
            }
        } else {

            // bounce nains
            if (this.nainsBounceCount > this.powerUpShowAt) {
                this.nainsWidthOnScreenX *= 0.95
                this.nainsWidthOnScreenY *= 0.95
                if (this.vy - this.force < 0) {

                    this.showPowerUp = true
                    this.force *= this.damping
                }
            }
            if (this.nainsBounceCount > this.powerUpShowAt + 1) {
                this.canSpawn = false

            }
            this.canSpawn && this.showPowerUp && context.drawImage(this.powerUpImage, this.powerUp * this.powerUpWidth, 0, this.powerUpWidth, this.powerUpHeight, this.x, this.y - this.powerUpHeight, this.powerUpWidth, this.powerUpHeight)

            spriteSheetRowNumber = 6
            this.canSpawn && !this.showPowerUp && context.drawImage(this.nainsImage, this.frameNains * this.width, spriteSheetRowNumber * this.height, this.width, this.height, this.x, this.y - this.verticalShift, this.nainsWidthOnScreenX, this.nainsWidthOnScreenY)
            this.frameNains < 14 ? this.frameNains += 1 : this.frameNains = 0

            if (this.vy - this.force > 0) {
                this.vy *= 1.02
            } else {
                this.force *= this.damping
            }
            this.y += this.vy - this.force

        }
    }

    explode(context: CanvasRenderingContext2D) {
        if (this.potCollided && lastTime - this.spawn > 8000 && !this.fall) {
            context.drawImage(this.explosionImage, this.explodePotKeyFrame * this.explositionWidth, 0, this.explositionWidth, this.explositionHeight, this.potx - this.explositionWidth * 0.5, this.poty - this.explositionHeight * 0.6, this.explositionWidth, this.explositionHeight)
            this.explodePotKeyFrame < 44 ? this.explodePotKeyFrame += 1 : ''
        }
    }

    bounceNaine(rectangle1: IRectangleCollisionProps, rectangle2: IRectangleCollisionProps): boolean {
        if (!this.fall || !this.canSpawn || lastTime - this.lastCollision < 100) return false
        if (detectRectangleCollision(rectangle1, rectangle2)) {
            this.force *= this.vy * 0.53 //higher value causes it to skip collision
            this.vy = 2
            this.lastCollision = lastTime
            this.nainsBounceCount++
            this.nainsBounceCount > this.powerUpShowAt + 1 && powerUpManager(this.powerUp)
            return true
        }
        return false
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
    if (lastTime - lastCollisionTime < 20) return false
    if (circle.x + circle.radius > rectangle.x && circle.x - circle.radius < rectangle.x + rectangle.width && circle.y + circle.radius > rectangle.y && circle.y - circle.radius < rectangle.y + rectangle.height) {
        lastCollisionTime = lastTime
        return true
    }
    else return false
}


function detectRectangleCollision(rectangle1: IRectangleCollisionProps, rectangle2: IRectangleCollisionProps): boolean {
    if (lastTime - lastCollisionTime < 20) return false
    if (rectangle1.x + rectangle1.width > rectangle2.x && rectangle1.x < rectangle2.x + rectangle2.width && rectangle1.y + rectangle1.height > rectangle2.y && rectangle1.y < rectangle2.y + rectangle2.height) {
        lastCollisionTime = lastTime
        return true
    }
    else return false
}

function powerUpManager(powerUp: number) {
    PowerUpEvent.detail.power.number = powerUp
    document.dispatchEvent(PowerUpEvent)
}

document.addEventListener('powerUpEvent', ({ detail }: IPowerUpEventProps) => {
    console.log('custom event fired', detail)
    if (detail && detail.power.number > 9) return

    switch (detail?.power.number) {
        case 0:
            //power.number = 0
            //power.type = 'guns'
            break;
        case 1:
            //power.number = 1
            //power.type = 'life++'
            break;
        case 2:
            //power.number = 2
            //power.type = 'money'
            break;
        case 3:
            //power.number = 3
            //power.type = 'bad luck'
            effect.platform.width = 24
            effect.ball.vy = -10
            break;
        case 4:
            //power.number = 4
            //power.type = 'platform--'
            const minWidth = effect.platform.width * 0.8
            minWidth <= 24 ? effect.platform.width = 24 : effect.platform.width = minWidth
            break;
        case 5:
            //power.number = 5
            //power.type = 'platform++'
            const maxWidth = effect.platform.width * 1.2
            maxWidth > 110 ? effect.platform.width = 110 : effect.platform.width = maxWidth
            break;
        case 6:
            //power.number = 6
            //power.type = 'ball speed++'
            effect.ball.vy -= 2
            break;
        case 7:
            //power.number = 7
            //power.type = 'ball speed--'
            effect.ball.vy += 2
            break;
        case 8:
            //power.number = 8
            //power.type = 'rocket'
            effect.ball.rocketMode = true
            break;
        default:
            //power.number = -1
            //power.type = ''
            break;
    }
})