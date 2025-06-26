const player = document.getElementById('player');
const goal = document.getElementById('goal');
const message = document.getElementById('message');
const retryButton = document.getElementById('retryButton');
const maze = document.getElementById('maze');
const bgm = document.getElementById('bgm');
const goalSound = document.getElementById('goalSound');

let isDragging = false;
let walls = [];
let rotateWallAngle = 0;
let rotateWallElem = null;

function startBGM() {
  if (bgm.paused) {
    bgm.play();
  }
}

// 回転壁アニメーション制御
function animateRotateWall() {
  if (rotateWallElem) {
    rotateWallAngle = (rotateWallAngle + 360 / (60 * 10)) % 360; // 10秒で1周（60FPS換算）
    rotateWallElem.style.transform = `rotate(${rotateWallAngle}deg)`;
  }
  requestAnimationFrame(animateRotateWall);
}
requestAnimationFrame(animateRotateWall);

// 壁のランダム生成
function createWalls() {
  walls.forEach(w => w.remove());
  walls = [];

  const wallCount = 3;

  const startRect = {
    left: document.getElementById('start').offsetLeft,
    top: document.getElementById('start').offsetTop,
    right: document.getElementById('start').offsetLeft + document.getElementById('start').offsetWidth,
    bottom: document.getElementById('start').offsetTop + document.getElementById('start').offsetHeight
  };

  const goalRect = {
    left: goal.offsetLeft,
    top: goal.offsetTop,
    right: goal.offsetLeft + goal.offsetWidth,
    bottom: goal.offsetTop + goal.offsetHeight
  };

  for (let i = 0; i < wallCount; i++) {
    const wall = document.createElement('div');
    wall.className = 'wall';

    if (i === 0) {
      wall.classList.add('rotate');
      rotateWallElem = wall;
      rotateWallAngle = 0;
    }

    const isVertical = Math.random() > 0.5;
    const width = isVertical ? '5%' : `${20 + Math.random() * 30}%`;
    const height = isVertical ? `${20 + Math.random() * 30}%` : '5%';
    wall.style.width = width;
    wall.style.height = height;

    const mazeWidth = maze.clientWidth;
    const mazeHeight = maze.clientHeight;

    let x, y, wallRect, overlap;

    do {
      x = Math.random() * (mazeWidth - parseFloat(wall.style.width) / 100 * mazeWidth);
      y = Math.random() * (mazeHeight - parseFloat(wall.style.height) / 100 * mazeHeight);

      wall.style.left = `${(x / mazeWidth) * 100}%`;
      wall.style.top = `${(y / mazeHeight) * 100}%`;

      wallRect = {
        left: x,
        top: y,
        right: x + (parseFloat(wall.style.width) / 100 * mazeWidth),
        bottom: y + (parseFloat(wall.style.height) / 100 * mazeHeight)
      };

      overlap = isOverlap(wallRect, startRect) || isOverlap(wallRect, goalRect);

    } while (overlap);

    maze.appendChild(wall);
    walls.push(wall);
  }
}

// 矩形の重なり判定
function isOverlap(rect1, rect2) {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

// 回転壁用：点が回転矩形内にあるか判定
function isPointInRotatedRect(px, py, rect, angleDeg) {
  const cx = (rect.left + rect.right) / 2;
  const cy = (rect.top + rect.bottom) / 2;
  const angle = (Math.PI / 180) * angleDeg;

  const dx = px - cx;
  const dy = py - cy;
  const x = dx * Math.cos(-angle) - dy * Math.sin(-angle) + cx;
  const y = dx * Math.sin(-angle) + dy * Math.cos(-angle) + cy;

  return (
    x >= rect.left &&
    x <= rect.right &&
    y >= rect.top &&
    y <= rect.bottom
  );
}

// 壁にぶつかった時の処理
function hitWall() {
  message.textContent = 'ぶつかった！';
  message.style.display = 'block';  // 表示する

  player.style.transition = 'transform 0.2s ease';
  player.style.transform = 'scale(0.5)';

  isDragging = false;

  setTimeout(() => {
    player.style.left = '5%';
    player.style.top = '5%';
    player.style.transform = 'none';
    player.style.transition = 'none';

    message.style.display = 'none';  // 消す
    message.textContent = '';
  }, 800);
}


// プレイヤー移動
function movePlayer(x, y) {
  const mazeRect = maze.getBoundingClientRect();
  x = Math.max(0, Math.min(x - mazeRect.left - player.offsetWidth / 2, mazeRect.width - player.offsetWidth));
  y = Math.max(0, Math.min(y - mazeRect.top - player.offsetHeight / 2, mazeRect.height - player.offsetHeight));

  const playerRect = {
    left: x,
    top: y,
    right: x + player.offsetWidth,
    bottom: y + player.offsetHeight
  };

  for (let wall of walls) {
    const wallRect = wall.getBoundingClientRect();
    const wallInMaze = {
      left: wall.offsetLeft,
      top: wall.offsetTop,
      right: wall.offsetLeft + wall.offsetWidth,
      bottom: wall.offsetTop + wall.offsetHeight
    };

    if (wall.classList.contains('rotate')) {
      const playerCenterX = x + player.offsetWidth / 2;
      const playerCenterY = y + player.offsetHeight / 2;
      if (isPointInRotatedRect(playerCenterX, playerCenterY, wallInMaze, rotateWallAngle)) {
        hitWall();
        return;
      }
    } else {
      if (
        playerRect.left < wallInMaze.right &&
        playerRect.right > wallInMaze.left &&
        playerRect.top < wallInMaze.bottom &&
        playerRect.bottom > wallInMaze.top
      ) {
        hitWall();
        return;
      }
    }
  }

  player.style.left = `${x}px`;
  player.style.top = `${y}px`;

  checkGoal();
}

// ゴール判定
function checkGoal() {
  const playerRect = player.getBoundingClientRect();
  const goalRect = goal.getBoundingClientRect();

  if (
    playerRect.left < goalRect.right &&
    playerRect.right > goalRect.left &&
    playerRect.top < goalRect.bottom &&
    playerRect.bottom > goalRect.top
  ) {
    goalReached();
  }
}

// ゴール到達処理
function goalReached() {
  message.textContent = 'ゴール！';
  goalSound.play();
  bgm.pause();

  player.style.transition = 'transform 0.5s ease';
  player.style.transform = 'scale(1.5) rotate(720deg)';

  isDragging = false;

  setTimeout(() => {
    retryButton.style.display = 'block';
  }, 800);
}

// タッチ操作
player.addEventListener('touchstart', e => {
  startBGM();
  isDragging = true;
  e.preventDefault();
});
document.addEventListener('touchmove', e => {
  if (!isDragging) return;
  movePlayer(e.touches[0].clientX, e.touches[0].clientY);
  e.preventDefault();
});
document.addEventListener('touchend', () => { isDragging = false; });

// マウス操作
player.addEventListener('mousedown', e => {
  startBGM();
  isDragging = true;
  e.preventDefault();
});
document.addEventListener('mousemove', e => {
  if (!isDragging) return;
  movePlayer(e.clientX, e.clientY);
});
document.addEventListener('mouseup', () => { isDragging = false; });

// もういっかいボタン
retryButton.addEventListener('click', () => {
  player.style.left = '5%';
  player.style.top = '5%';
  player.style.transform = 'none';
  player.style.transition = 'none';
  message.textContent = '';
  retryButton.style.display = 'none';
  bgm.currentTime = 0;
  bgm.play();
  createWalls();
});

// 初回ロード時
createWalls();
