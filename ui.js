export const gameOver = document.querySelector('#gameover');
const gameOverBtn = gameOver.querySelector('.restart-btn');
gameOverBtn.addEventListener('click', () => {
    location.reload();
});
export const restartGame = document.querySelector('#restart');
const restart = restartGame.querySelector('.restart-btn');
restart.addEventListener('click', () => {
    location.reload();
});
export const startGame = document.querySelector('#start');
export const startBtn = startGame.querySelector('.restart-btn');
