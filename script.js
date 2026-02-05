const BOARD_SIZE = 8;
const COLORS = [
  "#ff6b6b",
  "#feca57",
  "#1dd1a1",
  "#54a0ff",
  "#5f27cd",
  "#ff9ff3",
];

const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const movesElement = document.getElementById("moves");
const restartButton = document.getElementById("restart");

let board = [];
let selectedIndex = null;
let score = 0;
let moves = 0;
let isAnimating = false;

const toIndex = (row, col) => row * BOARD_SIZE + col;
const toRowCol = (index) => ({
  row: Math.floor(index / BOARD_SIZE),
  col: index % BOARD_SIZE,
});

const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const initBoard = () => {
  board = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => randomColor());
  ensureNoImmediateMatches();
  renderBoard();
  score = 0;
  moves = 0;
  updateStats();
};

const ensureNoImmediateMatches = () => {
  let hasMatch = true;
  while (hasMatch) {
    hasMatch = false;
    const matches = findMatches();
    if (matches.length) {
      hasMatch = true;
      matches.forEach((index) => {
        board[index] = randomColor();
      });
    }
  }
};

const renderBoard = () => {
  boardElement.innerHTML = "";
  board.forEach((color, index) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.style.background = color;
    tile.dataset.index = index;
    tile.setAttribute("role", "gridcell");
    tile.addEventListener("click", handleTileClick);
    boardElement.appendChild(tile);
  });
};

const updateStats = () => {
  scoreElement.textContent = score.toString();
  movesElement.textContent = moves.toString();
};

const handleTileClick = (event) => {
  if (isAnimating) {
    return;
  }
  const index = Number(event.currentTarget.dataset.index);
  if (selectedIndex === null) {
    selectedIndex = index;
    highlightSelection();
    return;
  }

  if (selectedIndex === index) {
    selectedIndex = null;
    highlightSelection();
    return;
  }

  const isNeighbor = areNeighbors(selectedIndex, index);
  if (!isNeighbor) {
    selectedIndex = index;
    highlightSelection();
    return;
  }

  swapTiles(selectedIndex, index);
  const matches = findMatches();
  if (!matches.length) {
    swapTiles(selectedIndex, index);
    selectedIndex = null;
    highlightSelection();
    return;
  }

  moves += 1;
  selectedIndex = null;
  highlightSelection();
  handleMatches(matches);
};

const highlightSelection = () => {
  const tiles = boardElement.querySelectorAll(".tile");
  tiles.forEach((tile) => tile.classList.remove("selected"));
  if (selectedIndex !== null) {
    const tile = boardElement.querySelector(`[data-index="${selectedIndex}"]`);
    if (tile) {
      tile.classList.add("selected");
    }
  }
};

const areNeighbors = (first, second) => {
  const { row: rowA, col: colA } = toRowCol(first);
  const { row: rowB, col: colB } = toRowCol(second);
  const rowDiff = Math.abs(rowA - rowB);
  const colDiff = Math.abs(colA - colB);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
};

const swapTiles = (first, second) => {
  [board[first], board[second]] = [board[second], board[first]];
  updateTiles([first, second]);
};

const updateTiles = (indices) => {
  indices.forEach((index) => {
    const tile = boardElement.querySelector(`[data-index="${index}"]`);
    if (tile) {
      tile.style.background = board[index];
    }
  });
};

const findMatches = () => {
  const matches = new Set();

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    let runStart = 0;
    for (let col = 1; col <= BOARD_SIZE; col += 1) {
      const current = col < BOARD_SIZE ? board[toIndex(row, col)] : null;
      const previous = board[toIndex(row, col - 1)];
      if (current !== previous) {
        const runLength = col - runStart;
        if (runLength >= 3) {
          for (let i = runStart; i < col; i += 1) {
            matches.add(toIndex(row, i));
          }
        }
        runStart = col;
      }
    }
  }

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    let runStart = 0;
    for (let row = 1; row <= BOARD_SIZE; row += 1) {
      const current = row < BOARD_SIZE ? board[toIndex(row, col)] : null;
      const previous = board[toIndex(row - 1, col)];
      if (current !== previous) {
        const runLength = row - runStart;
        if (runLength >= 3) {
          for (let i = runStart; i < row; i += 1) {
            matches.add(toIndex(i, col));
          }
        }
        runStart = row;
      }
    }
  }

  return Array.from(matches);
};

const handleMatches = async (matches) => {
  isAnimating = true;
  const tiles = boardElement.querySelectorAll(".tile");
  matches.forEach((index) => {
    tiles[index]?.classList.add("matched");
  });

  await wait(280);

  matches.forEach((index) => {
    board[index] = null;
  });

  score += matches.length * 10;
  updateStats();

  collapseColumns();
  refillBoard();
  renderBoard();
  const newMatches = findMatches();
  if (newMatches.length) {
    await handleMatches(newMatches);
  }

  isAnimating = false;
};

const collapseColumns = () => {
  for (let col = 0; col < BOARD_SIZE; col += 1) {
    const column = [];
    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      const value = board[toIndex(row, col)];
      if (value) {
        column.push(value);
      }
    }
    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      board[toIndex(row, col)] = column[BOARD_SIZE - 1 - row] || null;
    }
  }
};

const refillBoard = () => {
  for (let i = 0; i < board.length; i += 1) {
    if (!board[i]) {
      board[i] = randomColor();
    }
  }
};

const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

restartButton.addEventListener("click", () => {
  if (isAnimating) {
    return;
  }
  selectedIndex = null;
  initBoard();
});

initBoard();
