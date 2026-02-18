// ====== 基本設定 ======
const WIDTH = 800;
const HEIGHT = 600;
const CELL_SIZE = 20;
const ROWS = HEIGHT / CELL_SIZE;
const COLS = WIDTH / CELL_SIZE;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = WIDTH;
canvas.height = HEIGHT;

// ====== 迷路生成（壁伸ばし法） ======
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function generateMaze() {
    const maze = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => 1)
    );

    function extendWall(r, c) {
        const directions = [
            [0, 2], [0, -2],
            [2, 0], [-2, 0]
        ];
        shuffle(directions);

        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            if (
                nr >= 1 && nr < ROWS - 1 &&
                nc >= 1 && nc < COLS - 1 &&
                maze[nr][nc] === 1
            ) {
                maze[nr][nc] = 0;
                maze[r + dr / 2][c + dc / 2] = 0;
                extendWall(nr, nc);
            }
        }
    }

    maze[1][1] = 0;
    extendWall(1, 1);
    return maze;
}

// ====== BFS ======
function bfsPath(maze, start) {
    const visited = new Set();
    const queue = [start];
    const path = [];

    while (queue.length > 0) {
        const [r, c] = queue.shift();
        const key = `${r},${c}`;

        if (visited.has(key)) continue;
        visited.add(key);
        path.push([r, c]);

        const directions = [
            [0, 1], [1, 0],
            [0, -1], [-1, 0]
        ];

        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            if (
                nr >= 0 && nr < ROWS &&
                nc >= 0 && nc < COLS &&
                maze[nr][nc] === 0 &&
                !visited.has(`${nr},${nc}`)
            ) {
                queue.push([nr, nc]);
            }
        }
    }

    return path;
}

// ====== チェックポイント配置 ======
function createCheckpoints(path) {
    const step = Math.floor(path.length / 7);
    const checkpoints = [];

    for (let i = 1; i <= 5; i++) {
        checkpoints.push(path[i * step]);
    }

    const goal = path[6 * step];
    return { checkpoints, goal };
}

// ====== 描画 ======
function drawMaze(maze) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            ctx.fillStyle = maze[r][c] === 1 ? "black" : "white";
            ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
}

function drawPoints(start, goal, checkpoints) {
    ctx.fillStyle = "green";
    ctx.fillRect(start[1] * CELL_SIZE, start[0] * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    ctx.fillStyle = "red";
    ctx.fillRect(goal[1] * CELL_SIZE, goal[0] * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    checkpoints.forEach(([r, c], i) => {
        ctx.fillStyle = "blue";
        ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        ctx.fillStyle = "white";
        ctx.font = "12px sans-serif";
        ctx.fillText(String(i + 1), c * CELL_SIZE + 5, r * CELL_SIZE + 14);
    });
}

function drawPlayer(player) {
    ctx.fillStyle = "gray";
    ctx.fillRect(player[1] * CELL_SIZE, player[0] * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

// ====== UI ボタン ======
function drawButton(text, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = "black";
    ctx.font = "20px sans-serif";
    ctx.fillText(text, x + 10, y + 32);

    return { x, y, w, h };
}

function isInsideButton(btn, mx, my) {
    return (
        mx >= btn.x &&
        mx <= btn.x + btn.w &&
        my >= btn.y &&
        my <= btn.y + btn.h
    );
}

// ====== ゲーム初期化 ======
let maze, path, checkpoints, goal;
let player, checkpointIndex;
let gameStarted = false;
let gameOver = false;

let startBtn, endBtn, retryBtn;

function initGame() {
    maze = generateMaze();
    path = bfsPath(maze, [1, 1]);

    const cp = createCheckpoints(path);
    checkpoints = cp.checkpoints;
    goal = cp.goal;

    player = [1, 1];
    checkpointIndex = 0;
    gameStarted = false;
    gameOver = false;
}

initGame();

// ====== キー入力 ======
document.addEventListener("keydown", (e) => {
    if (!gameStarted || gameOver) return;

    let dr = 0, dc = 0;

    if (e.key === "ArrowUp") dr = -1;
    else if (e.key === "ArrowDown") dr = 1;
    else if (e.key === "ArrowLeft") dc = -1;
    else if (e.key === "ArrowRight") dc = 1;

    const nr = player[0] + dr;
    const nc = player[1] + dc;

    if (
        nr >= 0 && nr < ROWS &&
        nc >= 0 && nc < COLS &&
        maze[nr][nc] === 0
    ) {
        player = [nr, nc];

        const [cr, cc] = checkpoints[checkpointIndex];
        if (nr === cr && nc === cc) {
            checkpointIndex++;
        }

        if (nr === goal[0] && nc === goal[1] &&
            checkpointIndex === checkpoints.length) {
            gameOver = true;
        }
    }
});

// ====== マウスクリック ======
canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (!gameStarted && isInsideButton(startBtn, mx, my)) {
        gameStarted = true;
    } else if (gameOver) {
        if (isInsideButton(endBtn, mx, my)) {
            location.reload();
        } else if (isInsideButton(retryBtn, mx, my)) {
            initGame();
        }
    }
});

// ====== メインループ ======
function gameLoop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawMaze(maze);
    drawPoints([1, 1], goal, checkpoints);
    drawPlayer(player);

    if (!gameStarted) {
        startBtn = drawButton("スタート", WIDTH / 2 - 60, HEIGHT / 2 - 30, 120, 50, "lightgreen");
    } else if (gameOver) {
        endBtn = drawButton("終わる", WIDTH / 2 - 130, HEIGHT / 2 - 30, 100, 50, "pink");
        retryBtn = drawButton("もう一度", WIDTH / 2 + 30, HEIGHT / 2 - 30, 120, 50, "lightgreen");
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();