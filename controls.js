export const Move = {
    x: 0,
    y: 0,
};
window.addEventListener('keydown', (e) => {
    e.preventDefault();
    switch (e.key) {
        case 'w':
        case 'ArrowUp':
            Move.y = 1;
            break;
        case 'a':
        case 'ArrowLeft':
            Move.x = 1;
            break;
        case 's':
        case 'ArrowDown':
            Move.y = -1;
            break;
        case 'd':
        case 'ArrowRight':
            Move.x = -1;
            break;
        default:
            console.log(e.key);
    }
});
window.addEventListener('keyup', (e) => {
    e.preventDefault();
    switch (e.key) {
        case 'w':
        case 'ArrowUp':
            Move.y = 0;
            break;
        case 'a':
        case 'ArrowLeft':
            Move.x = 0;
            break;
        case 's':
        case 'ArrowDown':
            Move.y = 0;
            break;
        case 'd':
        case 'ArrowRight':
            Move.x = 0;
            break;
        default:
            console.log(e.key);
    }
});
