// 游戏变量
let scene, camera, renderer;
let paddle, opponentPaddle, ball, table;
let ballDirection = new THREE.Vector3();
let playerScore = 0;
let opponentScore = 0;
let isGameStarted = false;
let isGameOver = false;
let paddleOffset = new THREE.Vector3(0, 0, 0); // 球拍相对偏移
let paddleTilt = 0; // 球拍默认垂直于桌面 (0度)
let mousePosition = new THREE.Vector2(0, 0); // 记录鼠标位置
let previousMousePosition = new THREE.Vector2(0, 0); // 用于计算鼠标移动速度
let mouseSpeed = 0; // 鼠标移动速度
let mouseDirection = new THREE.Vector2(0, 0); // 鼠标移动方向（单位向量）
let clock = new THREE.Clock();
let lastHitByPlayer = false; // 记录上次击球方，true为玩家，false为电脑

// 物理参数
const BALL_SPEED = 0.10; // 进一步降低球速
const GRAVITY = 0.002; // 相应降低重力影响
const PADDLE_SENSITIVITY = 0.005; // 调整灵敏度
const MAX_OFFSET = 1.0; // 最大偏移
const AI_SPEED = 0.15; // 提高AI对手移动速度
const TILT_SENSITIVITY = 0.02; // 减小倾斜角度调整灵敏度
const MIN_TILT = -Math.PI / 2; // 最小倾斜角度 (-90度，向后)
const MAX_TILT = Math.PI / 2; // 最大倾斜角度 (90度，向前)

// DOM元素
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const gameStartScreen = document.getElementById('gameStartScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreElement = document.getElementById('playerScore');
const finalScoreElement = document.getElementById('finalScore');

// 初始化
function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // 天蓝色背景

    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 1.7; // 人的眼睛高度
    camera.lookAt(0, 0, 0); // 固定视角看向场景中心

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('gameContainer').appendChild(renderer.domElement);

    // 创建灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 创建得分显示UI
    createScoreDisplay();

    // 创建乒乓球桌
    createTable();

    // 创建球拍
    createPaddle();
    createOpponentPaddle();

    // 创建球
    createBall();

    // 调整开始按钮位置到乒乓球初始位置
    adjustStartButtonPosition();

    // 事件监听器
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('wheel', onMouseWheel);
    document.addEventListener('keydown', onKeyDown); // 添加键盘事件监听

    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);

    // 启动动画循环
    animate();
}

// 创建得分显示UI
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

// 调整开始按钮位置到乒乓球初始位置
function adjustStartButtonPosition() {
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

// 创建乒乓球桌
function createTable() {
    // 桌面
    const tableGeometry = new THREE.BoxGeometry(4, 0.1, 8);
    const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x1a472a }); // 绿色
    table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = -0.5;
    table.receiveShadow = true;
    scene.add(table);

    // 网
    const netGeometry = new THREE.BoxGeometry(4.2, 0.2, 0.05);
    const netMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const net = new THREE.Mesh(netGeometry, netMaterial);
    net.position.y = -0.2;
    net.position.z = 0;
    scene.add(net);

    // 桌子边缘
    const edgeGeometry = new THREE.BoxGeometry(4.4, 0.2, 8.4);
    const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // 棕色
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edge.position.y = -0.6;
    scene.add(edge);
}

// 创建球拍
function createPaddle() {
    const paddleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.02, 32);
    const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 16);

    const paddleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    const paddleHead = new THREE.Mesh(paddleGeometry, paddleMaterial);
    paddleHead.rotation.x = Math.PI / 2;

    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.z = 0.15;

    paddle = new THREE.Group();
    paddle.add(paddleHead);
    paddle.add(handle);

    paddle.position.set(0, 0, 1.5); // 默认位置靠近玩家发球区域
    paddle.rotation.x = 0; // 球拍默认垂直于桌面

    paddle.castShadow = true;
    scene.add(paddle);
}

// 创建对手球拍
function createOpponentPaddle() {
    const paddleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.02, 32);
    const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 16);

    const paddleMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    const paddleHead = new THREE.Mesh(paddleGeometry, paddleMaterial);
    paddleHead.rotation.x = Math.PI / 2;

    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.z = -0.15;

    opponentPaddle = new THREE.Group();
    opponentPaddle.add(paddleHead);
    opponentPaddle.add(handle);

    opponentPaddle.position.set(0, 0, -3); // 初始位置在桌子对面
    opponentPaddle.rotation.x = -Math.PI / 4; // 倾斜角度

    opponentPaddle.castShadow = true;
    scene.add(opponentPaddle);
}

// 创建乒乓球
function createBall() {
    const ballGeometry = new THREE.SphereGeometry(0.05, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, 0, -3); // 桌子对面
    ball.castShadow = true;
    scene.add(ball);

    // 设置初始球的方向
    resetBall();
}

// 重置球的位置和方向
function resetBall() {
    // 根据上次得分方确定发球方向
    if (lastHitByPlayer) {
        // 如果玩家最后击球，球从对手方发球
        ball.position.set(0, 0.5, -3);

        // 朝向玩家方向
        ballDirection.set(
            (Math.random() - 0.5) * 0.3,  // x: 左右随机偏移
            0.15 + Math.random() * 0.2,   // y: 向上的初始速度
            0.5 + Math.random() * 0.15    // z: 朝向玩家
        );
    } else {
        // 如果电脑最后击球，球从玩家方发球
        ball.position.set(0, 0.5, 3);

        // 朝向电脑方向
        ballDirection.set(
            (Math.random() - 0.5) * 0.3,  // x: 左右随机偏移
            0.15 + Math.random() * 0.2,   // y: 向上的初始速度
            -0.5 - Math.random() * 0.15   // z: 朝向电脑
        );
    }

    ballDirection.normalize().multiplyScalar(BALL_SPEED * 1.2);
}

// 开始游戏
function startGame() {
    gameStartScreen.classList.add('hidden');
    isGameStarted = true;
    playerScore = 0;
    opponentScore = 0;
    updateScoreDisplay();
    isGameOver = false;

    // 重置球拍位置和角度
    paddleOffset.set(0, 0.5, 1.5); // 固定y轴高度为0.5
    paddleTilt = 0; // 球拍默认垂直于桌面

    // 随机设置初始击球方
    lastHitByPlayer = Math.random() > 0.5;
    console.log((lastHitByPlayer ? "玩家" : "电脑") + "先发球");

    resetBall();

    // 将鼠标指针位置同步到球拍位置
    mousePosition.x = paddleOffset.x / 2.0;
    mousePosition.y = (paddleOffset.z / 1.25) - 1;
}

// 重新开始游戏
function restartGame() {
    gameOverScreen.classList.add('hidden');
    startGame();
}

// 游戏结束
function gameOver() {
    isGameOver = true;
    isGameStarted = false;
    finalScoreElement.textContent = playerScore + " - " + opponentScore; // 显示最终比分
    gameOverScreen.classList.remove('hidden');
}

// 处理窗口调整大小
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 处理鼠标移动
function onMouseMove(event) {
    if (!isGameStarted) return;

    // 保存前一帧的鼠标位置
    previousMousePosition.copy(mousePosition);

    // 记录鼠标位置
    mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 计算鼠标移动速度（欧几里得距离）
    mouseSpeed = mousePosition.distanceTo(previousMousePosition);

    // 计算鼠标移动方向（单位向量）
    mouseDirection.subVectors(mousePosition, previousMousePosition);
    if (mouseDirection.lengthSq() > 0.0001) { // 避免太小的移动产生不稳定的方向
        mouseDirection.normalize();
    }

    // 将鼠标位置转换为球拍位置
    paddleOffset.x = mousePosition.x * 2.0; // 水平位置

    // 将鼠标的纵向位置映射到球拍的z轴位置 (0.5到4.0)
    // 鼠标在屏幕底部时，球拍在z=4.0（远离网）
    // 鼠标在屏幕顶部时，球拍在z=0.5（靠近网）
    const zPosition = 4.0 - ((mousePosition.y + 1) / 2) * 3.5;
    paddleOffset.z = zPosition;

    // 限制偏移范围
    paddleOffset.x = THREE.MathUtils.clamp(paddleOffset.x, -2.0, 2.0);
    paddleOffset.z = THREE.MathUtils.clamp(paddleOffset.z, 0.5, 4.0); // 扩大z轴范围到4.0

    // 设置固定高度 - 不再使用滚轮控制高度
    paddleOffset.y = 0.5; // 设置为固定的合适高度
}

// 处理鼠标滚轮事件 - 现在用于控制球拍倾斜角度
function onMouseWheel(event) {
    if (!isGameStarted) return;

    // 根据滚轮方向调整球拍的倾斜角度
    // 向上滚动使球拍向前倾斜，向下滚动使球拍向后倾斜
    paddleTilt += event.deltaY > 0 ? -0.05 : 0.05;

    // 限制倾斜角度范围在 -90度 到 90度 之间
    paddleTilt = THREE.MathUtils.clamp(paddleTilt, MIN_TILT, MAX_TILT);

    // 将角度换算成度数，方便显示
    const tiltDegrees = (paddleTilt * 180 / Math.PI).toFixed(1);

    // 判断倾斜方向并显示
    let tiltDirection = "";
    if (paddleTilt > 0.05) {
        tiltDirection = "向前倾斜";
    } else if (paddleTilt < -0.05) {
        tiltDirection = "向后倾斜";
    } else {
        tiltDirection = "垂直于桌面";
    }

    console.log(`球拍角度: ${tiltDegrees}° (${tiltDirection})`);
}

// 添加一个安全的得分更新函数
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

// 检测球与球拍的碰撞
function checkPaddleCollision() {
    const paddlePos = paddle.position.clone();
    const ballPos = ball.position.clone();

    const distance = paddlePos.distanceTo(ballPos);

    // 调整碰撞条件，确保能接住球
    if (distance < 0.5 && ballDirection.z > 0) {
        // 设置上次击球方为玩家
        lastHitByPlayer = true;

        // --- 基于真实乒乓球物理的新反弹逻辑 ---

        // 1. 计算击球点相对于球拍中心的偏移
        const hitOffset = new THREE.Vector3().subVectors(ballPos, paddlePos);

        // 2. 创建一个新的方向向量，主要基于挥拍方向
        const newDirection = new THREE.Vector3();

        // 挥拍方向转换为3D空间 (mouseDirection是2D的)
        // 注意Y轴在屏幕和3D空间中是相反的，所以我们取负值
        // X轴映射到3D空间的X轴，Y轴映射到3D空间的Z轴
        const swingDirection = new THREE.Vector3(
            mouseDirection.x,
            0, // Y方向在我们的游戏中由球拍角度控制
            -mouseDirection.y // 屏幕Y轴与3D空间Z轴相反
        );

        // 如果挥拍速度足够大，则使用挥拍方向
        if (mouseSpeed > 0.01) {
            // 挥拍方向占主导地位 (70%)
            newDirection.copy(swingDirection).multiplyScalar(0.7);

            // 确保球总是前进(朝向对手方向)，不管挥拍方向如何
            if (newDirection.z > 0) {
                newDirection.z *= -1; // 反转z方向，确保球飞向对手
            }
        } else {
            // 如果没有明显的挥拍，则设置一个默认的前向方向
            newDirection.set(0, 0, -1);
        }

        // 3. 球拍角度影响 (20%)
        // 球拍倾斜角度影响Y方向分量
        // paddleTilt = 0 时球拍垂直，正值向前倾斜，负值向后倾斜
        const tiltContribution = new THREE.Vector3(
            0,
            Math.sin(paddleTilt) * 0.8, // 正角度提供向上的分量，负角度提供向下的分量
            Math.cos(paddleTilt) * -0.8  // 确保Z方向总是偏向对手
        );
        newDirection.add(tiltContribution.multiplyScalar(0.2));

        // 4. 击球点影响 (10%)
        // 在球拍平面上的偏移会影响球的方向
        const hitPointInfluence = new THREE.Vector3(
            hitOffset.x * 0.5,  // 横向击球偏移影响横向方向
            hitOffset.y * 0.3,  // 纵向击球偏移影响垂直方向
            0
        );
        newDirection.add(hitPointInfluence.multiplyScalar(0.1));

        // 确保方向向量是单位向量
        newDirection.normalize();

        // 5. 应用速度
        // 根据挥拍速度调整球速，但保持一个最小速度
        let speedMultiplier = 0.8 + mouseSpeed * 15; // 减小乘数，避免球速过快
        speedMultiplier = THREE.MathUtils.clamp(speedMultiplier, 0.8, 1.8);

        // 完全取代原有方向，不保留任何原始速度分量
        ballDirection.copy(newDirection).multiplyScalar(BALL_SPEED * speedMultiplier);

        // --- 确保球始终向上和向前 ---
        // 保证Y方向最小向上速度，防止球直接撞地
        if (ballDirection.y < 0.05) {
            ballDirection.y = 0.05;
            ballDirection.normalize().multiplyScalar(BALL_SPEED * speedMultiplier);
        }

        // 确保Z方向始终朝向对手
        if (ballDirection.z > 0) {
            ballDirection.z *= -1;
            ballDirection.normalize().multiplyScalar(BALL_SPEED * speedMultiplier);
        }

        // 添加调试信息
        console.log("玩家击球!",
            "挥拍方向:", [swingDirection.x.toFixed(2), swingDirection.y.toFixed(2), swingDirection.z.toFixed(2)],
            "球拍角度:", (paddleTilt * 180 / Math.PI).toFixed(1) + "°",
            "击球点:", [hitOffset.x.toFixed(2), hitOffset.y.toFixed(2)],
            "最终方向:", [ballDirection.x.toFixed(2), ballDirection.y.toFixed(2), ballDirection.z.toFixed(2)],
            "速度:", (BALL_SPEED * speedMultiplier).toFixed(3)
        );
    }
}

// 检测球与对手球拍的碰撞
function checkOpponentPaddleCollision() {
    const opponentPos = opponentPaddle.position.clone();
    const ballPos = ball.position.clone();

    // 简化的碰撞检测 - 球与对手球拍头部的距离
    const distance = opponentPos.distanceTo(ballPos);

    // 增大碰撞检测距离，提高AI接球能力
    if (distance < 0.4 && ballDirection.z < 0) {
        // 设置上次击球方为电脑
        lastHitByPlayer = false;

        // 简化的AI反弹逻辑 - 电脑不需要和玩家一样复杂的物理模型
        // 根据击球位置和随机因素决定方向
        const offset = new THREE.Vector3().subVectors(ballPos, opponentPos);

        // 创建新的方向向量
        const newDirection = new THREE.Vector3();

        // 基础方向 - 朝向玩家
        newDirection.set(0, 0, 1);

        // 添加一些水平随机性和基于击球点的偏移
        newDirection.x = offset.x * 0.5 + (Math.random() - 0.5) * 0.2;

        // 设置垂直分量 - 确保球能越过网
        newDirection.y = 0.3 + Math.random() * 0.2;

        // 标准化并设置速度
        ballDirection.copy(newDirection.normalize().multiplyScalar(BALL_SPEED * 1.2));

        console.log("AI击球! 新方向:", [ballDirection.x.toFixed(2), ballDirection.y.toFixed(2), ballDirection.z.toFixed(2)]);
    }
}

// 检测球与桌子和墙壁的碰撞
function checkTableCollision() {
    const ballPos = ball.position;

    // 桌面碰撞
    if (ballPos.y < -0.4 && ballDirection.y < 0) {
        ballDirection.y = -ballDirection.y * 0.8;
        ball.position.y = -0.39; // 防止卡在桌面
    }

    // 侧边界碰撞
    if (Math.abs(ballPos.x) > 2) {
        ballDirection.x = -ballDirection.x;
    }

    // *** 新的得分规则逻辑 ***
    // 球落到了球桌所在平面(y约为-0.4)，但不在球桌范围内(x超过2或z超过4)
    if (ballPos.y < -0.4 && ballPos.y > -0.6 && (Math.abs(ballPos.x) > 2 || Math.abs(ballPos.z) > 4)) {
        // 这里表示球落到球桌平面但不在球桌范围内，由上次击球方得分
        if (lastHitByPlayer) {
            playerScore += 1;
            console.log("玩家得分! 球出界了");
        } else {
            opponentScore += 1;
            console.log("电脑得分! 球出界了");
        }

        updateScoreDisplay(); // 更新得分显示

        // 检查游戏是否结束（玩家或对手得分超过11分）
        if (playerScore >= 11 || opponentScore >= 11) {
            gameOver();
        } else {
            resetBall(); // 重置球
        }
        return;
    }

    // 球撞到后墙，此时算对方得分（保留作为安全措施）
    if (ballPos.z < -7.5) {
        playerScore += 1; // 玩家得分
        updateScoreDisplay();
        console.log("玩家得分! 球撞到了后墙");
        resetBall();
        return;
    }

    // 球撞到玩家这边的墙，算对方得分（保留作为安全措施）
    if (ballPos.z > 7.5) {
        opponentScore += 1; // 对手得分
        updateScoreDisplay();
        console.log("电脑得分! 球撞到了玩家这边的墙");
        resetBall();
        return;
    }

    // 网的碰撞检测 - 简化逻辑，减少方向改变
    if (Math.abs(ballPos.z) < 0.1 && ballPos.y < 0.3) {
        // 只有当球真正撞到网时才反弹回去
        if (ballPos.y < 0.0) {
            // 球撞到网的下部分，直接反弹
            ballDirection.z = -ballDirection.z;

            // 球触网后可以给到上一个击球方的对手得分
            if (lastHitByPlayer) {
                opponentScore += 1;
                console.log("电脑得分! 球触网了");
            } else {
                playerScore += 1;
                console.log("玩家得分! 球触网了");
            }

            updateScoreDisplay();

            // 检查游戏是否结束
            if (playerScore >= 11 || opponentScore >= 11) {
                gameOver();
            } else {
                resetBall();
            }
            return;
        }
        // 如果球经过网的上部分，不改变方向，保持原有轨迹
    }
}

// 更新球拍位置
function updatePaddle() {
    if (!isGameStarted) return;

    // 球拍位置跟随鼠标
    const targetPosition = new THREE.Vector3(0, 0, 0);

    // 应用鼠标偏移 - 现在y轴是固定值
    targetPosition.x = paddleOffset.x;
    targetPosition.y = paddleOffset.y; // 使用固定高度
    targetPosition.z = paddleOffset.z;

    // --- 自动微调逻辑 ---
    const ballPos = ball.position.clone();
    const paddlePos = paddle.position.clone();
    const distanceToBall = paddlePos.distanceTo(ballPos);
    const autoAdjustDistance = 1.0; // 当球距离小于此值时开始微调
    const autoAdjustSpeed = 0.1; // 微调速度

    // 只在球朝玩家飞来且足够近时微调
    if (ballDirection.z > 0 && distanceToBall < autoAdjustDistance) {
        // 计算目标位置与当前位置的差异 - 现在只调整x坐标，不再调整y坐标
        const diffX = ballPos.x - paddlePos.x;

        // 逐步调整球拍位置，使其更接近球的x坐标
        targetPosition.x += diffX * autoAdjustSpeed;

        // 保持限制
        targetPosition.x = THREE.MathUtils.clamp(targetPosition.x, -2.0, 2.0);
    }
    // --- 自动微调逻辑结束 ---

    // 应用计算后的位置
    paddle.position.copy(targetPosition);

    // 应用倾斜角度
    paddle.rotation.x = paddleTilt;
}

// 更新对手球拍位置
function updateOpponentPaddle() {
    if (!isGameStarted) return;

    // 预测球的轨迹来提前移动球拍
    let targetX = ball.position.x;
    let targetY = ball.position.y;

    // 如果球正朝AI方向移动，预测球的落点
    if (ballDirection.z < 0) {
        // 简单的轨迹预测 - 计算球在到达AI所在z位置时的x坐标
        const distanceToAI = Math.abs((ball.position.z - opponentPaddle.position.z) / ballDirection.z);
        targetX = ball.position.x + ballDirection.x * distanceToAI;

        // 考虑重力影响，预测y坐标
        let timeToReach = distanceToAI / Math.abs(ballDirection.z);
        targetY = ball.position.y + ballDirection.y * timeToReach - 0.5 * GRAVITY * timeToReach * timeToReach;
    }

    // 保持球拍位置更高，确保能击出高球越过网
    targetY = Math.max(targetY, 0.3);

    // 提高AI反应速度 - 使用更大的移动系数当球离得更近时
    const distanceFactor = Math.min(1.5, 3.0 / Math.max(0.5, Math.abs(ball.position.z - opponentPaddle.position.z)));
    const effectiveSpeed = AI_SPEED * distanceFactor;

    // 逐渐移动到目标位置，使用加速系数
    opponentPaddle.position.x += (targetX - opponentPaddle.position.x) * effectiveSpeed;
    opponentPaddle.position.y += (targetY - opponentPaddle.position.y) * effectiveSpeed;

    // 扩大移动范围，提高接球成功率
    opponentPaddle.position.x = THREE.MathUtils.clamp(opponentPaddle.position.x, -1.8, 1.8);
    opponentPaddle.position.y = THREE.MathUtils.clamp(opponentPaddle.position.y, 0.15, 1.8); // 提高最小高度

    // 保持z位置和旋转
    opponentPaddle.position.z = -3;
    opponentPaddle.rotation.x = -Math.PI / 4;
}

// 更新球的位置
function updateBall(deltaTime) {
    if (!isGameStarted || isGameOver) return;

    // 应用重力
    ballDirection.y -= GRAVITY;

    // 更新球的位置
    ball.position.add(ballDirection.clone().multiplyScalar(deltaTime * 60));

    // 检测碰撞
    checkPaddleCollision();
    checkOpponentPaddleCollision();
    checkTableCollision();
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    updatePaddle();
    updateOpponentPaddle();
    updateBall(deltaTime);

    renderer.render(scene, camera);
}

// 处理键盘事件
function onKeyDown(event) {
    const key = event.key.toLowerCase();

    // 按R键重新开始游戏
    if (key === 'r') {
        if (isGameOver) {
            restartGame();
        } else {
            // 如果游戏正在进行中，也可以重新开始
            resetBall();
        }
    }
}

// 启动游戏
window.onload = init;
