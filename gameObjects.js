// gameObjects.js - 游戏对象（桌子、球拍、球等）的创建和管理

import { COLORS, DIMENSIONS, POSITIONS } from './config.js';
import { addToScene } from './scene.js';

// 游戏对象
let table, net, ball, paddle, opponentPaddle;

/**
 * 创建所有游戏对象
 * @returns {Object} 包含所有游戏对象的引用
 */
export function createGameObjects() {
    createTable();
    createPaddle();
    createOpponentPaddle();
    createBall();

    return {
        table,
        ball,
        paddle,
        opponentPaddle
    };
}

/**
 * 创建乒乓球桌
 */
function createTable() {
    // 桌面
    const tableGeometry = new THREE.BoxGeometry(
        DIMENSIONS.TABLE_WIDTH,
        DIMENSIONS.TABLE_HEIGHT,
        DIMENSIONS.TABLE_LENGTH
    );
    const tableMaterial = new THREE.MeshStandardMaterial({ color: COLORS.TABLE });
    table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = POSITIONS.TABLE_HEIGHT;
    table.receiveShadow = true;
    addToScene(table);

    // 网
    const netGeometry = new THREE.BoxGeometry(
        DIMENSIONS.TABLE_WIDTH + 0.2,
        0.2,
        0.05
    );
    const netMaterial = new THREE.MeshStandardMaterial({ color: COLORS.NET });
    net = new THREE.Mesh(netGeometry, netMaterial);
    net.position.y = POSITIONS.NET_HEIGHT;
    net.position.z = 0;
    addToScene(net);

    // 桌子边缘
    const edgeGeometry = new THREE.BoxGeometry(
        DIMENSIONS.TABLE_WIDTH + 0.4,
        0.2,
        DIMENSIONS.TABLE_LENGTH + 0.4
    );
    const edgeMaterial = new THREE.MeshStandardMaterial({ color: COLORS.TABLE_EDGE });
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edge.position.y = POSITIONS.TABLE_HEIGHT - 0.1;
    addToScene(edge);
}

/**
 * 创建玩家球拍
 */
function createPaddle() {
    const paddleGeometry = new THREE.CylinderGeometry(
        DIMENSIONS.PADDLE_RADIUS,
        DIMENSIONS.PADDLE_RADIUS,
        0.02,
        32
    );
    const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 16);

    const paddleMaterial = new THREE.MeshStandardMaterial({ color: COLORS.PLAYER_PADDLE });
    const handleMaterial = new THREE.MeshStandardMaterial({ color: COLORS.PADDLE_HANDLE });

    const paddleHead = new THREE.Mesh(paddleGeometry, paddleMaterial);
    paddleHead.rotation.x = Math.PI / 2;

    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.z = 0.15;

    paddle = new THREE.Group();
    paddle.add(paddleHead);
    paddle.add(handle);

    paddle.position.set(0, 0, POSITIONS.PLAYER_ZONE);
    paddle.rotation.x = 0; // 球拍默认垂直于桌面

    paddle.castShadow = true;
    addToScene(paddle);
}

/**
 * 创建对手球拍
 */
function createOpponentPaddle() {
    const paddleGeometry = new THREE.CylinderGeometry(
        DIMENSIONS.PADDLE_RADIUS,
        DIMENSIONS.PADDLE_RADIUS,
        0.02,
        32
    );
    const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 16);

    const paddleMaterial = new THREE.MeshStandardMaterial({ color: COLORS.OPPONENT_PADDLE });
    const handleMaterial = new THREE.MeshStandardMaterial({ color: COLORS.PADDLE_HANDLE });

    const paddleHead = new THREE.Mesh(paddleGeometry, paddleMaterial);
    paddleHead.rotation.x = Math.PI / 2;

    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.z = -0.15;

    opponentPaddle = new THREE.Group();
    opponentPaddle.add(paddleHead);
    opponentPaddle.add(handle);

    opponentPaddle.position.set(0, 0, POSITIONS.OPPONENT_ZONE);
    opponentPaddle.rotation.x = -Math.PI / 4; // 倾斜角度

    opponentPaddle.castShadow = true;
    addToScene(opponentPaddle);
}

/**
 * 创建乒乓球
 */
function createBall() {
    const ballGeometry = new THREE.SphereGeometry(DIMENSIONS.BALL_RADIUS, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: COLORS.BALL });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, 0, POSITIONS.OPPONENT_ZONE);
    ball.castShadow = true;
    addToScene(ball);
}

/**
 * 获取游戏对象
 * @returns {Object} 包含所有游戏对象的引用
 */
export function getGameObjects() {
    return {
        table,
        ball,
        paddle,
        opponentPaddle
    };
}

/**
 * 获取球对象
 * @returns {THREE.Mesh} 球对象
 */
export function getBall() {
    return ball;
}

/**
 * 获取玩家球拍对象
 * @returns {THREE.Group} 玩家球拍对象
 */
export function getPlayerPaddle() {
    return paddle;
}

/**
 * 获取对手球拍对象
 * @returns {THREE.Group} 对手球拍对象
 */
export function getOpponentPaddle() {
    return opponentPaddle;
} 