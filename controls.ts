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
function beginSliding(e: PointerEvent) {
    e.preventDefault()
    startX = e.clientX
}
function moveSlider(e: PointerEvent) {
    e.preventDefault()
    endX = e.clientX
    Move.x = (startX - endX) > 0 ? +1 : -1
}

function stopSliding(e: PointerEvent) {
    e.preventDefault()
    Move.x = 0
}

const slider = document.querySelector("main")!;
let startX = 0
let endX = 0
slider.onpointerdown = beginSliding;
slider.onpointerup = stopSliding;
slider.onpointermove = moveSlider;