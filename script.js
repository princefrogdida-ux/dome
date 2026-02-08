const BOARD_SIZE = 15;
const CELL_COUNT = BOARD_SIZE - 1;
const PADDING = 34;
const AI_PLAYER = 2;
const HUMAN_PLAYER = 1;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restart");
const modeSelect = document.getElementById("mode");
const difficultySelect = document.getElementById("difficulty");
const themeSelect = document.getElementById("theme");

let board = createBoard();
let currentPlayer = HUMAN_PLAYER;
let gameOver = false;
let isThinking = false;
let boardColor = themeSelect.value;

function createBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

function drawBoard() {
  const size = canvas.width;
  const gridSize = size - PADDING * 2;
  const cellSize = gridSize / CELL_COUNT;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = boardColor;
  ctx.fillRect(0, 0, size, size);

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

      if (stone === HUMAN_PLAYER) {
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
  return player === HUMAN_PLAYER ? "黑棋" : "白棋";
}

function getMode() {
  return modeSelect.value;
}

function getDifficulty() {
  return difficultySelect.value;
}

function updateDifficultyAvailability() {
  difficultySelect.disabled = getMode() !== "pve";
}

function placeStone(row, col, player) {
  board[row][col] = player;
  drawBoard();

  if (hasWinner(row, col, player)) {
    gameOver = true;
    updateStatus(`${getPlayerName(player)}获胜！`);
    return;
  }

  if (isBoardFull()) {
    gameOver = true;
    updateStatus("平局！");
    return;
  }

  currentPlayer = player === HUMAN_PLAYER ? AI_PLAYER : HUMAN_PLAYER;

  if (getMode() === "pve" && currentPlayer === AI_PLAYER) {
    updateStatus(`电脑(${difficultySelect.options[difficultySelect.selectedIndex].text})思考中...`);
  } else {
    updateStatus(`${getPlayerName(currentPlayer)}回合`);
  }
}

function evaluateLine(row, col, dRow, dCol, player) {
  const forward = countInDirection(row, col, dRow, dCol, player);
  const backward = countInDirection(row, col, -dRow, -dCol, player);
  const stones = 1 + forward + backward;

  let openEnds = 0;
  const end1Row = row + dRow * (forward + 1);
  const end1Col = col + dCol * (forward + 1);
  const end2Row = row - dRow * (backward + 1);
  const end2Col = col - dCol * (backward + 1);

  if (
    end1Row >= 0 &&
    end1Row < BOARD_SIZE &&
    end1Col >= 0 &&
    end1Col < BOARD_SIZE &&
    board[end1Row][end1Col] === 0
  ) {
    openEnds += 1;
  }

  if (
    end2Row >= 0 &&
    end2Row < BOARD_SIZE &&
    end2Col >= 0 &&
    end2Col < BOARD_SIZE &&
    board[end2Row][end2Col] === 0
  ) {
    openEnds += 1;
  }

  if (stones >= 5) {
    return 100000;
  }

  if (stones === 4) {
    return openEnds === 2 ? 15000 : 4000;
  }

  if (stones === 3) {
    return openEnds === 2 ? 2000 : 400;
  }

  if (stones === 2) {
    return openEnds === 2 ? 180 : 40;
  }

  return 10;
}

function scorePosition(row, col, player) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  let score = 0;
  for (const [dRow, dCol] of directions) {
    score += evaluateLine(row, col, dRow, dCol, player);
  }
  return score;
}

function evaluateBoardState() {
  let aiTotal = 0;
  let humanTotal = 0;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] === AI_PLAYER) {
        aiTotal += scorePosition(row, col, AI_PLAYER);
      } else if (board[row][col] === HUMAN_PLAYER) {
        humanTotal += scorePosition(row, col, HUMAN_PLAYER);
      }
    }
  }

  return aiTotal - humanTotal * 0.92;
}

function isNearbyStone(row, col, distance = 2) {
  for (let r = Math.max(0, row - distance); r <= Math.min(BOARD_SIZE - 1, row + distance); r += 1) {
    for (let c = Math.max(0, col - distance); c <= Math.min(BOARD_SIZE - 1, col + distance); c += 1) {
      if (board[r][c] !== 0) {
        return true;
      }
    }
  }
  return false;
}

function getCandidateMoves() {
  const moves = [];
  let hasAnyStone = false;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] !== 0) {
        hasAnyStone = true;
        continue;
      }

      if (!hasAnyStone || isNearbyStone(row, col)) {
        moves.push({ row, col });
      }
    }
  }

  if (moves.length === 0) {
    moves.push({ row: Math.floor(BOARD_SIZE / 2), col: Math.floor(BOARD_SIZE / 2) });
  }

  return moves;
}

function scoreMove(row, col) {
  board[row][col] = AI_PLAYER;
  const aiWin = hasWinner(row, col, AI_PLAYER);
  const aiScore = aiWin ? 1_000_000 : scorePosition(row, col, AI_PLAYER);
  board[row][col] = 0;

  board[row][col] = HUMAN_PLAYER;
  const humanWin = hasWinner(row, col, HUMAN_PLAYER);
  const defendScore = humanWin ? 900_000 : scorePosition(row, col, HUMAN_PLAYER);
  board[row][col] = 0;

  const center = Math.floor(BOARD_SIZE / 2);
  const centerBias = BOARD_SIZE - 1 - (Math.abs(row - center) + Math.abs(col - center));
  return aiScore + defendScore * 0.9 + centerBias;
}

function pickAdvancedMove() {
  const moves = getCandidateMoves();
  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const totalScore = scoreMove(move.row, move.col);
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMove = move;
    }
  }

  return bestMove;
}

function pickNoviceMove() {
  const moves = getCandidateMoves();
  const scored = moves
    .map((move) => ({ ...move, score: scoreMove(move.row, move.col) }))
    .sort((a, b) => b.score - a.score);

  const poolSize = Math.min(6, scored.length);
  const randomIndex = Math.floor(Math.random() * poolSize);
  return scored[randomIndex];
}

function minimax(depth, maximizing, alpha, beta) {
  if (depth === 0 || isBoardFull()) {
    return evaluateBoardState();
  }

  const candidates = getCandidateMoves()
    .map((move) => ({ ...move, score: scoreMove(move.row, move.col) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of candidates) {
      board[move.row][move.col] = AI_PLAYER;
      if (hasWinner(move.row, move.col, AI_PLAYER)) {
        board[move.row][move.col] = 0;
        return 2_000_000 + depth;
      }

      const evalScore = minimax(depth - 1, false, alpha, beta);
      board[move.row][move.col] = 0;

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) {
        break;
      }
    }
    return maxEval;
  }

  let minEval = Infinity;
  for (const move of candidates) {
    board[move.row][move.col] = HUMAN_PLAYER;
    if (hasWinner(move.row, move.col, HUMAN_PLAYER)) {
      board[move.row][move.col] = 0;
      return -2_000_000 - depth;
    }

    const evalScore = minimax(depth - 1, true, alpha, beta);
    board[move.row][move.col] = 0;

    minEval = Math.min(minEval, evalScore);
    beta = Math.min(beta, evalScore);
    if (beta <= alpha) {
      break;
    }
  }
  return minEval;
}

function pickMasterMove() {
  const moves = getCandidateMoves()
    .map((move) => ({ ...move, score: scoreMove(move.row, move.col) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  let bestMove = moves[0];
  let bestEval = -Infinity;

  for (const move of moves) {
    board[move.row][move.col] = AI_PLAYER;
    if (hasWinner(move.row, move.col, AI_PLAYER)) {
      board[move.row][move.col] = 0;
      return move;
    }

    const evalScore = minimax(1, false, -Infinity, Infinity);
    board[move.row][move.col] = 0;

    if (evalScore > bestEval) {
      bestEval = evalScore;
      bestMove = move;
    }
  }

  return bestMove;
}

function pickAiMove() {
  const difficulty = getDifficulty();
  if (difficulty === "novice") {
    return pickNoviceMove();
  }
  if (difficulty === "master") {
    return pickMasterMove();
  }
  return pickAdvancedMove();
}

function runAiTurn() {
  if (gameOver || getMode() !== "pve" || currentPlayer !== AI_PLAYER) {
    return;
  }

  isThinking = true;
  const delayByDifficulty = {
    novice: 180,
    advanced: 280,
    master: 450,
  };

  window.setTimeout(() => {
    const { row, col } = pickAiMove();
    placeStone(row, col, AI_PLAYER);
    isThinking = false;
  }, delayByDifficulty[getDifficulty()] ?? 220);
}

canvas.addEventListener("click", (event) => {
  if (gameOver || isThinking) {
    return;
  }

  if (getMode() === "pve" && currentPlayer === AI_PLAYER) {
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

  placeStone(row, col, currentPlayer);
  runAiTurn();
});

function resetGame() {
  board = createBoard();
  currentPlayer = HUMAN_PLAYER;
  gameOver = false;
  isThinking = false;
  updateDifficultyAvailability();
  updateStatus("黑棋先手");
  drawBoard();
}

restartBtn.addEventListener("click", () => {
  resetGame();
});

modeSelect.addEventListener("change", () => {
  resetGame();
});

difficultySelect.addEventListener("change", () => {
  if (getMode() === "pve") {
    resetGame();
  }
});

themeSelect.addEventListener("change", () => {
  boardColor = themeSelect.value;
  drawBoard();
});

updateDifficultyAvailability();
drawBoard();
