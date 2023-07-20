export const gameOver = document.querySelector('#gameover')!
const gameOverBtn = document.querySelector('#restart-btn')!

gameOverBtn.addEventListener('click', () => {
    location.reload()
})
