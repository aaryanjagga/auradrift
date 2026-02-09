// script for auradrift //
const canvas = document.getElementById('pacmanCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const levelEl = document.getElementById('level-display');
const livesEl = document.getElementById('lives-display');
const overlay = document.getElementById('overlay');
const statusText = document.getElementById('status-text');
const subText = document.getElementById('sub-text');
const actionBtn = document.getElementById('action-btn');
const gameBoard = document.getElementById('game-board');

const TILE_SIZE = 24;
const ROWS = 21;
const COLS = 19;

const BASE_MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,3,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,4,1,1,0,1,2,1,1,1,1],
    [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
    [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
    [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
    [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let grid = [];
let pacman = {
    x: 9, y: 15,
    dir: { x: 0, y: 0 },
    nextDir: { x: 0, y: 0 },
    pixelX: 0, pixelY: 0,
    speed: 2, 
    mouth: 0,
    mouthDir: 0.1
};

let ghosts = [
    { id: 0, name: 'blinky', x: 9, y: 9, color: '#ff0000', dir: { x: 0, y: -1 }, pixelX: 0, pixelY: 0, state: 'normal' },
    { id: 1, name: 'pinky', x: 8, y: 9, color: '#ffb8ff', dir: { x: 0, y: -1 }, pixelX: 0, pixelY: 0, state: 'normal' },
    { id: 2, name: 'inky', x: 10, y: 9, color: '#00ffff', dir: { x: 0, y: -1 }, pixelX: 0, pixelY: 0, state: 'normal' },
    { id: 3, name: 'clyde', x: 9, y: 8, color: '#ffb852', dir: { x: 0, y: 1 }, pixelX: 0, pixelY: 0, state: 'normal' }
];

let score = 0;
let lives = 3;
let currentLevel = 1;
let isGameOver = false;
let isLevelTransition = false;
let powerModeActive = false;
let powerTimer = 0;

// TOUCH HANDLING STATE
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 30; // Min pixels to detect swipe

function updateLivesUI() {
    livesEl.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const life = document.createElement('div');
        life.className = 'life-icon';
        livesEl.appendChild(life);
    }
}

function resetPositions() {
    pacman.x = 9;
    pacman.y = 15;
    pacman.pixelX = pacman.x * TILE_SIZE;
    pacman.pixelY = pacman.y * TILE_SIZE;
    pacman.dir = { x: 0, y: 0 };
    pacman.nextDir = { x: 0, y: 0 };

    ghosts.forEach((g, i) => {
        g.x = 8 + (i % 3);
        g.y = 9;
        g.pixelX = g.x * TILE_SIZE;
        g.pixelY = g.y * TILE_SIZE;
        g.state = 'normal';
        g.dir = { x: 0, y: -1 };
    });
    
    powerModeActive = false;
    powerTimer = 0;
    gameBoard.classList.remove('power-active');
}

function initLevel(isNewGame = false) {
    if (isNewGame) {
        lives = 3;
        score = 0;
        currentLevel = 1;
    }
    
    // Internal dimensions remain constant for logic stability
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ROWS * TILE_SIZE;
    grid = JSON.parse(JSON.stringify(BASE_MAP));
    
    resetPositions();
    updateLivesUI();

    timerEl.innerText = "0.0s";
    scoreEl.innerText = score.toString().padStart(4, '0');
    levelEl.innerText = currentLevel === 4 ? "MASTER LEVEL" : `Level ${currentLevel}`;
    overlay.style.display = 'none';
    isGameOver = false;
    isLevelTransition = false;
}

function update() {
    if (isGameOver || isLevelTransition) return;

    if (powerModeActive) {
        powerTimer--;
        timerEl.innerText = (powerTimer / 60).toFixed(1) + "s";
        if (powerTimer <= 0) {
            powerModeActive = false;
            gameBoard.classList.remove('power-active');
            ghosts.forEach(g => g.state = 'normal');
        }
    }

    if (pacman.pixelX % TILE_SIZE === 0 && pacman.pixelY % TILE_SIZE === 0) {
        pacman.x = Math.round(pacman.pixelX / TILE_SIZE);
        pacman.y = Math.round(pacman.pixelY / TILE_SIZE);

        if (canMove(pacman.x + pacman.nextDir.x, pacman.y + pacman.nextDir.y, false)) {
            pacman.dir = { ...pacman.nextDir };
        } else if (!canMove(pacman.x + pacman.dir.x, pacman.y + pacman.dir.y, false)) {
            pacman.dir = { x: 0, y: 0 };
        }

        const tile = grid[pacman.y][pacman.x];
        if (tile === 2) { grid[pacman.y][pacman.x] = 0; score += 10; }
        else if (tile === 3) { grid[pacman.y][pacman.x] = 0; triggerPowerMode(); }
        
        scoreEl.innerText = score.toString().padStart(4, '0');
        checkWin();
    }

    pacman.pixelX += pacman.dir.x * pacman.speed;
    pacman.pixelY += pacman.dir.y * pacman.speed;
    pacman.mouth += pacman.mouthDir;
    if (pacman.mouth > 0.25 || pacman.mouth < 0) pacman.mouthDir *= -1;

    ghosts.forEach(g => {
        const ghostSpeed = (powerModeActive && g.state === 'vulnerable') ? 1 : 1;

        if (g.pixelX % TILE_SIZE === 0 && g.pixelY % TILE_SIZE === 0) {
            g.x = Math.round(g.pixelX / TILE_SIZE);
            g.y = Math.round(g.pixelY / TILE_SIZE);

            const possibleDirs = [
                { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
            ].filter(d => {
                if (d.x === -g.dir.x && d.y === -g.dir.y) return false;
                return canMove(g.x + d.x, g.y + d.y, true);
            });

            if (possibleDirs.length > 0) {
                let tx = pacman.x, ty = pacman.y;

                if (g.state === 'vulnerable') {
                    tx = g.id % 2 === 0 ? 0 : COLS;
                    ty = g.id < 2 ? 0 : ROWS;
                } else {
                    switch(g.name) {
                        case 'blinky': tx = pacman.x; ty = pacman.y; break;
                        case 'pinky': tx = pacman.x + pacman.dir.x * 4; ty = pacman.y + pacman.dir.y * 4; break;
                        case 'inky': 
                            const blinky = ghosts[0];
                            tx = pacman.x + (pacman.x - blinky.x);
                            ty = pacman.y + (pacman.y - blinky.y);
                            break;
                        case 'clyde': 
                            const dist = Math.hypot(g.x - pacman.x, g.y - pacman.y);
                            if (dist < 8) { tx = 0; ty = ROWS; } else { tx = pacman.x; ty = pacman.y; }
                            break;
                    }
                }

                possibleDirs.sort((a, b) => {
                    const da = Math.hypot((g.x + a.x) - tx, (g.y + a.y) - ty);
                    const db = Math.hypot((g.x + b.x) - tx, (g.y + b.y) - ty);
                    return da - db;
                });
                
                if (Math.random() > 0.9) {
                    g.dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                } else {
                    g.dir = possibleDirs[0];
                }
            } else {
                g.dir = { x: -g.dir.x, y: -g.dir.y };
            }
        }
        g.pixelX += g.dir.x * ghostSpeed;
        g.pixelY += g.dir.y * ghostSpeed;

        const dist = Math.hypot(pacman.pixelX - g.pixelX, pacman.pixelY - g.pixelY);
        if (dist < TILE_SIZE * 0.75) {
            if (powerModeActive && g.state === 'vulnerable') {
                score += 200;
                respawnGhost(g);
            } else {
                handleDeath();
            }
        }
    });
}

function handleDeath() {
    if (lives > 1) {
        lives--;
        updateLivesUI();
        resetPositions();
    } else {
        lives = 0;
        updateLivesUI();
        endGame("WRECKED", `Out of Lives! Final Score: ${score}`);
    }
}

function triggerPowerMode() {
    powerModeActive = true;
    powerTimer = 540; 
    gameBoard.classList.add('power-active');
    ghosts.forEach(g => g.state = 'vulnerable');
}

function respawnGhost(g) {
    g.x = 9; g.y = 9;
    g.pixelX = g.x * TILE_SIZE;
    g.pixelY = g.y * TILE_SIZE;
    g.state = 'normal';
    g.dir = { x: 0, y: -1 };
}

function canMove(nx, ny, isGhost) {
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false;
    const tile = grid[ny][nx];
    if (tile === 1) return false;
    if (tile === 4 && !isGhost) return false;
    return true;
}

function checkWin() {
    const hasPellets = grid.some(row => row.includes(2) || row.includes(3));
    if (!hasPellets) {
        if (currentLevel < 4) nextLevel();
        else victory();
    }
}

function nextLevel() {
    isLevelTransition = true;
    statusText.innerText = `LEVEL ${currentLevel} COMPLETED`;
    subText.innerText = "Difficulty Increasing...";
    overlay.style.display = 'flex';
    actionBtn.innerText = "Next Level";
    actionBtn.onclick = () => { currentLevel++; initLevel(); };
    gameBoard.classList.add('complete-anim');
    setTimeout(() => gameBoard.classList.remove('complete-anim'), 1000);
}

function victory() {
    isGameOver = true;
    statusText.innerText = "MASTER ACHIEVED";
    statusText.style.color = "#00ff00";
    subText.innerText = `Final Score: ${score}`;
    overlay.style.display = 'flex';
    actionBtn.innerText = "Play Again";
    actionBtn.onclick = () => { initLevel(true); };
    startGrandAnimation();
}

function startGrandAnimation() {
    let particles = [];
    for(let i=0; i<100; i++) particles.push({
        x: canvas.width/2, y: canvas.height/2,
        vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
        c: `hsl(${Math.random()*360}, 100%, 50%)`
    });
    const vLoop = () => {
        if (!isGameOver) return;
        ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = 'black'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.globalAlpha = 1;
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.1; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 4, 4); });
        ctx.restore(); requestAnimationFrame(vLoop);
    };
    vLoop();
}

function draw() {
    if (isLevelTransition) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const tile = grid[r][c];
            const tx = c * TILE_SIZE; const ty = r * TILE_SIZE;
            if (tile === 1) {
                ctx.fillStyle = powerModeActive ? '#004400' : '#2424ff';
                ctx.fillRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } else if (tile === 2) {
                ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2, 2, 0, Math.PI * 2); ctx.fill();
            } else if (tile === 3) {
                ctx.fillStyle = '#00ff00'; ctx.shadowBlur = 10; ctx.shadowColor = '#00ff00';
                ctx.beginPath(); ctx.arc(tx + TILE_SIZE / 2, ty + TILE_SIZE / 2, 6, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
            } else if (tile === 4) {
                ctx.strokeStyle = '#ffb8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, ty + TILE_SIZE/2); ctx.lineTo(tx + TILE_SIZE, ty + TILE_SIZE/2); ctx.stroke();
            }
        }
    }

    ctx.save();
    ctx.translate(pacman.pixelX + TILE_SIZE / 2, pacman.pixelY + TILE_SIZE / 2);
    let angle = 0;
    if (pacman.dir.x === 1) angle = 0; else if (pacman.dir.x === -1) angle = Math.PI;
    else if (pacman.dir.y === 1) angle = Math.PI / 2; else if (pacman.dir.y === -1) angle = -Math.PI / 2;
    ctx.rotate(angle);
    ctx.fillStyle = 'yellow'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, TILE_SIZE / 2 - 2, pacman.mouth * Math.PI, (2 - pacman.mouth) * Math.PI); ctx.fill();
    ctx.restore();

    ghosts.forEach(g => {
        let ghostColor = g.color;
        if (powerModeActive && g.state === 'vulnerable') {
            ghostColor = (powerTimer < 180 && Math.floor(powerTimer / 10) % 2 === 0) ? '#fff' : '#2424ff';
        }
        ctx.fillStyle = ghostColor;
        const gx = g.pixelX + 2; const gy = g.pixelY + 2; const gw = TILE_SIZE - 4;
        ctx.beginPath(); ctx.arc(gx + gw/2, gy + gw/2, gw/2, Math.PI, 0); ctx.lineTo(gx + gw, gy + gw);
        for(let i=0; i<=3; i++) ctx.lineTo(gx + gw - (i * gw/3), gy + gw - (i%2?5:0));
        ctx.fill();
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(gx + gw * 0.3, gy + gw * 0.4, 3, 0, Math.PI * 2); ctx.arc(gx + gw * 0.7, gy + gw * 0.4, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(gx + gw * 0.3 + (g.dir.x*2), gy + gw * 0.4 + (g.dir.y*2), 1.5, 0, Math.PI * 2); ctx.arc(gx + gw * 0.7 + (g.dir.x*2), gy + gw * 0.4 + (g.dir.y*2), 1.5, 0, Math.PI * 2); ctx.fill();
    });
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
function endGame(title, text) { isGameOver = true; statusText.innerText = title; subText.innerText = text; overlay.style.display = 'flex'; actionBtn.innerText = "Restart Game"; actionBtn.onclick = () => { initLevel(true); }; }
function resetGame() { initLevel(true); }

// SWIPE CONTROLLER
window.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: false });

window.addEventListener('touchmove', e => {
    e.preventDefault(); // Stop scrolling while playing
}, { passive: false });

window.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (Math.abs(dx) > SWIPE_THRESHOLD) {
            pacman.nextDir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
        }
    } else {
        // Vertical swipe
        if (Math.abs(dy) > SWIPE_THRESHOLD) {
            pacman.nextDir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
        }
    }
}, { passive: false });

// KEYBOARD CONTROLLER
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') pacman.nextDir = { x: 0, y: -1 };
    if (e.key === 'ArrowDown') pacman.nextDir = { x: 0, y: 1 };
    if (e.key === 'ArrowLeft') pacman.nextDir = { x: -1, y: 0 };
    if (e.key === 'ArrowRight') pacman.nextDir = { x: 1, y: 0 };
});

initLevel(true);
loop();
