// 游戏状态管理模块

// 游戏状态变量
let playerScore = 0;
let opponentScore = 0;
let isGameStarted = false;
let isGameOver = false;
let lastHitByPlayer = false; // 记录上次击球方，true为玩家，false为电脑

// DOM元素
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const gameStartScreen = document.getElementById('gameStartScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreElement = document.getElementById('playerScore');
const finalScoreElement = document.getElementById('finalScore');

/**
 * 初始化游戏状态
 * @param {Function} resetBallCallback - 重置球的回调函数
 */
function initGameState() {
    // 添加事件监听器
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);

    // 创建得分显示UI
    createScoreDisplay();
}

/**
 * 创建得分显示UI
 */
function createScoreDisplay() {
    // 移除已有的得分显示（如果存在）
    const existingScoreDisplay = document.getElementById('scoreDisplayContainer');
    if (existingScoreDisplay) {
        existingScoreDisplay.remove();
    }

    // 创建新的得分显示容器
    const scoreDisplayContainer = document.createElement('div');
    scoreDisplayContainer.id = 'scoreDisplayContainer';
    scoreDisplayContainer.style.position = 'absolute';
    scoreDisplayContainer.style.width = '100%';
    scoreDisplayContainer.style.top = '20px';
    scoreDisplayContainer.style.display = 'flex';
    scoreDisplayContainer.style.justifyContent = 'space-between';
    scoreDisplayContainer.style.padding = '0 20px';
    scoreDisplayContainer.style.boxSizing = 'border-box';
    scoreDisplayContainer.style.color = 'white';
    scoreDisplayContainer.style.fontFamily = 'Arial, sans-serif';
    scoreDisplayContainer.style.fontSize = '24px';
    scoreDisplayContainer.style.fontWeight = 'bold';
    scoreDisplayContainer.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    scoreDisplayContainer.style.zIndex = '100';

    // 玩家得分显示（左上角）
    const playerScoreDiv = document.createElement('div');
    playerScoreDiv.innerHTML = '玩家: <span id="playerScoreValue">0</span>';
    playerScoreDiv.style.backgroundColor = 'rgba(0, 100, 255, 0.7)';
    playerScoreDiv.style.padding = '10px 20px';
    playerScoreDiv.style.borderRadius = '5px';

    // 对手得分显示（右上角）
    const opponentScoreDiv = document.createElement('div');
    opponentScoreDiv.innerHTML = '电脑: <span id="opponentScoreValue">0</span>';
    opponentScoreDiv.style.backgroundColor = 'rgba(255, 50, 50, 0.7)';
    opponentScoreDiv.style.padding = '10px 20px';
    opponentScoreDiv.style.borderRadius = '5px';

    // 添加到容器
    scoreDisplayContainer.appendChild(playerScoreDiv);
    scoreDisplayContainer.appendChild(opponentScoreDiv);

    // 将容器添加到页面
    document.getElementById('gameContainer').appendChild(scoreDisplayContainer);
}

/**
 * 开始游戏
 */
function startGame() {
    gameStartScreen.classList.add('hidden');
    isGameStarted = true;
    playerScore = 0;
    opponentScore = 0;
    updateScoreDisplay();
    isGameOver = false;

    // 随机设置初始击球方
    lastHitByPlayer = Math.random() > 0.5;
    console.log((lastHitByPlayer ? "玩家" : "电脑") + "先发球");

    // 触发自定义事件以通知其他模块游戏已开始
    const gameStartEvent = new CustomEvent('gameStart', {
        detail: { lastHitByPlayer }
    });
    document.dispatchEvent(gameStartEvent);
}

/**
 * 重新开始游戏
 */
function restartGame() {
    gameOverScreen.classList.add('hidden');
    startGame();
}

/**
 * 游戏结束
 */
function gameOver() {
    isGameOver = true;
    isGameStarted = false;
    finalScoreElement.textContent = playerScore + " - " + opponentScore; // 显示最终比分
    gameOverScreen.classList.remove('hidden');
}

/**
 * 更新分数显示
 */
function updateScoreDisplay() {
    // 更新玩家得分
    const playerScoreValue = document.getElementById('playerScoreValue');
    if (playerScoreValue) {
        playerScoreValue.textContent = playerScore;
    }

    // 更新对手得分
    const opponentScoreValue = document.getElementById('opponentScoreValue');
    if (opponentScoreValue) {
        opponentScoreValue.textContent = opponentScore;
    }

    // 在控制台显示当前比分
    console.log("当前比分: 玩家 " + playerScore + " - 电脑 " + opponentScore);
}

/**
 * 增加玩家得分
 */
function increasePlayerScore() {
    playerScore += 1;
    updateScoreDisplay();

    // 检查游戏是否结束
    if (playerScore >= 11 || opponentScore >= 11) {
        gameOver();
        return true;
    }
    return false;
}

/**
 * 增加对手得分
 */
function increaseOpponentScore() {
    opponentScore += 1;
    updateScoreDisplay();

    // 检查游戏是否结束
    if (playerScore >= 11 || opponentScore >= 11) {
        gameOver();
        return true;
    }
    return false;
}

/**
 * 设置最后击球方
 * @param {boolean} isPlayer - 是否为玩家击球
 */
function setLastHitByPlayer(isPlayer) {
    lastHitByPlayer = isPlayer;
}

/**
 * 调整开始按钮位置
 * @param {THREE.Camera} camera - 三维相机对象
 */
function adjustStartButtonPosition(camera) {
    const startButtonContainer = document.getElementById('gameStartScreen');
    if (startButtonContainer) {
        // 获取乒乓球初始位置的屏幕坐标
        const ballScreenPosition = new THREE.Vector3(0, 0.5, -3); // 乒乓球初始位置
        ballScreenPosition.project(camera);

        // 将三维坐标转换为屏幕坐标
        const screenX = (ballScreenPosition.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-ballScreenPosition.y * 0.5 + 0.5) * window.innerHeight;

        // 调整按钮位置
        startButtonContainer.style.position = 'absolute';
        startButtonContainer.style.left = `${screenX - 50}px`; // 调整偏移量以居中按钮
        startButtonContainer.style.top = `${screenY - 25}px`; // 调整偏移量以居中按钮
    }
}

// 导出游戏状态功能
export {
    initGameState,
    createScoreDisplay,
    startGame,
    restartGame,
    gameOver,
    updateScoreDisplay,
    increasePlayerScore,
    increaseOpponentScore,
    setLastHitByPlayer,
    adjustStartButtonPosition,
    // 导出状态变量
    isGameStarted,
    isGameOver,
    lastHitByPlayer
}; 