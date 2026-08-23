const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const storedScores = JSON.parse(localStorage.getItem('ticTacToeScores') || '{}');
const scores = {
  X: Number.isFinite(storedScores.X) ? storedScores.X : 0,
  O: Number.isFinite(storedScores.O) ? storedScores.O : 0,
  draws: Number.isFinite(storedScores.draws) ? storedScores.draws : 0
};

let boardState = Array(9).fill('');
let currentPlayer = 'X';
let gameOver = false;
let gameMode = 'pvp';
let computerTimer;

const cells = [...document.querySelectorAll('.cell')];
const statusMessage = document.querySelector('#status-message');
const turnChip = document.querySelector('#turn-chip');
const roundNote = document.querySelector('#round-note');
const playerOLabel = document.querySelector('#player-o-label');

function initializeGame() {
  cells.forEach((cell) => cell.addEventListener('click', handleCellClick));
  document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', switchGameMode));
  document.querySelector('#restart-button').addEventListener('click', restartGame);
  document.querySelector('#reset-score').addEventListener('click', resetScores);
  updateScoreboard();
  updateBoard();
  updateStatus();
}

function handleCellClick(event) {
  const index = Number(event.currentTarget.dataset.index);
  if (gameOver || boardState[index] || (gameMode === 'computer' && currentPlayer === 'O')) return;

  placeMark(index, currentPlayer);
  const result = finishRoundIfNeeded();
  if (!result && gameMode === 'computer') {
    currentPlayer = 'O';
    updateStatus();
    computerTimer = window.setTimeout(makeComputerMove, 480);
  } else if (!result) {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();
  }
}

function placeMark(index, player) {
  boardState[index] = player;
  updateBoard();
}

function makeComputerMove() {
  if (gameOver) return;
  const move = chooseComputerMove();
  placeMark(move, 'O');
  currentPlayer = 'X';
  finishRoundIfNeeded();
  if (!gameOver) updateStatus();
}

function chooseComputerMove() {
  const winningMove = findTacticalMove('O');
  if (winningMove !== -1) return winningMove;
  const blockingMove = findTacticalMove('X');
  if (blockingMove !== -1) return blockingMove;
  if (!boardState[4]) return 4;
  const corners = [0, 2, 6, 8].filter((index) => !boardState[index]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return boardState.findIndex((value) => !value);
}

function findTacticalMove(player) {
  return WINNING_COMBINATIONS.reduce((move, combination) => {
    if (move !== -1) return move;
    const marks = combination.map((index) => boardState[index]);
    if (marks.filter((mark) => mark === player).length === 2 && marks.includes('')) {
      return combination[marks.indexOf('')];
    }
    return -1;
  }, -1);
}

function checkWinner() {
  return WINNING_COMBINATIONS.find((combination) => {
    const [first, second, third] = combination;
    return boardState[first] && boardState[first] === boardState[second] && boardState[first] === boardState[third];
  }) || null;
}

function checkDraw() {
  return boardState.every(Boolean);
}

function finishRoundIfNeeded() {
  const winningCombination = checkWinner();
  if (winningCombination) {
    gameOver = true;
    winningCombination.forEach((index) => cells[index].classList.add('winner'));
    scores[currentPlayer] += 1;
    saveScores();
    updateScoreboard();
    statusMessage.textContent = `${currentPlayer} wins!`;
    turnChip.textContent = '✓';
    turnChip.classList.toggle('o', currentPlayer === 'O');
    roundNote.textContent = 'A beautiful finish.';
    return true;
  }
  if (checkDraw()) {
    gameOver = true;
    cells.forEach((cell) => cell.classList.add('draw'));
    scores.draws += 1;
    saveScores();
    updateScoreboard();
    statusMessage.textContent = 'Draw!';
    turnChip.textContent = '=';
    roundNote.textContent = 'No room left on the board.';
    return true;
  }
  return false;
}

function updateBoard() {
  cells.forEach((cell, index) => {
    const mark = boardState[index];
    cell.classList.remove('x', 'o');
    if (mark) {
      cell.classList.add(mark.toLowerCase());
      cell.disabled = true;
      cell.setAttribute('aria-label', `${getCellLocation(index)}, ${mark}`);
    } else {
      cell.disabled = gameOver;
      cell.setAttribute('aria-label', `${getCellLocation(index)}, empty`);
    }
  });
}

function updateStatus() {
  statusMessage.textContent = gameMode === 'computer' && currentPlayer === 'O' ? 'Computer is thinking...' : `${currentPlayer}'s turn`;
  turnChip.textContent = currentPlayer;
  turnChip.classList.toggle('o', currentPlayer === 'O');
}

function updateScoreboard() {
  document.querySelector('#score-x').textContent = scores.X;
  document.querySelector('#score-o').textContent = scores.O;
  document.querySelector('#score-draws').textContent = scores.draws;
}

function restartGame() {
  window.clearTimeout(computerTimer);
  boardState = Array(9).fill('');
  currentPlayer = 'X';
  gameOver = false;
  cells.forEach((cell) => cell.classList.remove('winner', 'draw'));
  roundNote.textContent = 'Make the first mark count.';
  updateBoard();
  updateStatus();
}

function switchGameMode(event) {
  const selectedMode = event.currentTarget.dataset.mode;
  if (selectedMode === gameMode) return;
  gameMode = selectedMode;
  document.querySelectorAll('.mode-button').forEach((button) => {
    const isActive = button.dataset.mode === gameMode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  playerOLabel.textContent = gameMode === 'computer' ? 'Computer O' : 'Player O';
  restartGame();
}

function resetScores() {
  scores.X = 0;
  scores.O = 0;
  scores.draws = 0;
  saveScores();
  updateScoreboard();
}

function saveScores() {
  localStorage.setItem('ticTacToeScores', JSON.stringify(scores));
}

function getCellLocation(index) {
  const row = index < 3 ? 'Top' : index < 6 ? 'Middle' : 'Bottom';
  const column = index % 3 === 0 ? 'left' : index % 3 === 1 ? 'center' : 'right';
  return `${row} ${column}`;
}

initializeGame();
