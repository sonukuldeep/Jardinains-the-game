export const Move = {
    x: 0,
    y: 0,
}

// handle movement 
window.addEventListener('keydown', (e) => {
    e.preventDefault()
    switch (e.key) {
        case 'w':
        case 'ArrowUp':
            Move.y = 1
            break
        case 'a':
        case 'ArrowLeft':
            Move.x = 1
            break
        case 's':
        case 'ArrowDown':
            Move.y = -1
            break
        case 'd':
        case 'ArrowRight':
            Move.x = -1
            break
        default:
            console.log(e.key)
    }
})

window.addEventListener('keyup', (e) => {
    e.preventDefault()

    switch (e.key) {
        case 'w':
        case 'ArrowUp':
            Move.y = 0
            break
        case 'a':
        case 'ArrowLeft':
            Move.x = 0
            break
        case 's':
        case 'ArrowDown':
            Move.y = 0
            break
        case 'd':
        case 'ArrowRight':
            Move.x = 0
            break
        default:
            console.log(e.key)
    }
})


// mouse controls
function beginSliding(e: TouchEvent) {
    e.preventDefault()
    startX = e.touches[0].clientX
}
function moveSlider(e: TouchEvent) {
    e.preventDefault()
    endX = e.touches[0].clientX
    Move.x = (startX - endX) > 0 ? +1 : -1
}

function stopSliding(e: TouchEvent) {
    e.preventDefault()
    Move.x = 0
}

const slider = document.querySelector("main")!;
let startX = 0
let endX = 0
slider.ontouchstart = beginSliding;
slider.ontouchend = stopSliding;
slider.ontouchmove = moveSlider;