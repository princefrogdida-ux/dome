const BOARD_SIZE = 15;
const CELL_COUNT = BOARD_SIZE - 1;
const PADDING = 30;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");

let board = createBoard();
let currentPlayer = 1; // 1 黑棋, 2 白棋
let gameOver = false;

function createBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

function drawBoard() {
  const size = canvas.width;
  const gridSize = size - PADDING * 2;
  const cellSize = gridSize / CELL_COUNT;

  ctx.clearRect(0, 0, size, size);

  for (let i = 0; i < BOARD_SIZE; i += 1) {
    const offset = PADDING + i * cellSize;

    ctx.beginPath();
    ctx.moveTo(PADDING, offset);
    ctx.lineTo(size - PADDING, offset);
    ctx.strokeStyle = "#92400e";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(offset, PADDING);
    ctx.lineTo(offset, size - PADDING);
    ctx.stroke();
  }

  drawStones(cellSize);
}

function drawStones(cellSize) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const stone = board[row][col];
      if (!stone) {
        continue;
      }

      const x = PADDING + col * cellSize;
      const y = PADDING + row * cellSize;
      const radius = cellSize * 0.42;

      const gradient = ctx.createRadialGradient(
        x - radius * 0.25,
        y - radius * 0.25,
        radius * 0.2,
        x,
        y,
        radius
      );

      if (stone === 1) {
        gradient.addColorStop(0, "#4b5563");
        gradient.addColorStop(1, "#030712");
      } else {
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(1, "#d1d5db");
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }
}

function findCellFromClick(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  const gridSize = canvas.width - PADDING * 2;
  const cellSize = gridSize / CELL_COUNT;

  const col = Math.round((x - PADDING) / cellSize);
  const row = Math.round((y - PADDING) / cellSize);

  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return null;
  }

  const snapX = PADDING + col * cellSize;
  const snapY = PADDING + row * cellSize;
  const threshold = cellSize * 0.45;

  if (Math.abs(x - snapX) > threshold || Math.abs(y - snapY) > threshold) {
    return null;
  }

  return { row, col };
}

function countInDirection(row, col, dRow, dCol, player) {
  let count = 0;
  let r = row + dRow;
  let c = col + dCol;

  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
    count += 1;
    r += dRow;
    c += dCol;
  }

  return count;
}

function hasWinner(row, col, player) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  return directions.some(([dRow, dCol]) => {
    const count =
      1 +
      countInDirection(row, col, dRow, dCol, player) +
      countInDirection(row, col, -dRow, -dCol, player);
    return count >= 5;
  });
}

function isBoardFull() {
  return board.every((row) => row.every((cell) => cell !== 0));
}

function updateStatus(text) {
  statusEl.textContent = text;
}

function getPlayerName(player) {
  return player === 1 ? "黑棋" : "白棋";
}

canvas.addEventListener("click", (event) => {
  if (gameOver) {
    return;
  }

  const cell = findCellFromClick(event);
  if (!cell) {
    return;
  }

  const { row, col } = cell;
  if (board[row][col] !== 0) {
    return;
  }

  board[row][col] = currentPlayer;
  drawBoard();

  if (hasWinner(row, col, currentPlayer)) {
    gameOver = true;
    updateStatus(`${getPlayerName(currentPlayer)}获胜！`);
    return;
  }

  if (isBoardFull()) {
    gameOver = true;
    updateStatus("平局！");
    return;
  }

  currentPlayer = currentPlayer === 1 ? 2 : 1;
  updateStatus(`${getPlayerName(currentPlayer)}回合`);
});

restartBtn.addEventListener("click", () => {
  board = createBoard();
  currentPlayer = 1;
  gameOver = false;
  updateStatus("黑棋先手");
  drawBoard();
});

drawBoard();
