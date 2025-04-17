// physics.js - 物理引擎和运动计算模块

import * as THREE from 'three';
import { PHYSICS, DIMENSIONS } from './config.js';
import { scene } from './scene.js';

// 物理状态
let lastTime = 0;
const objects = [];

// 物理相关变量
let ball;
let ballVelocity = new THREE.Vector3(0, 0, 0);
let gravity = 9.8;
let ballRadius = 0.02;  // 乒乓球半径约为2cm
let ballMass = 0.0027;  // 乒乓球质量约为2.7g
const FRICTION = 0.99;
const RESTITUTION = 0.95;  // 弹性系数

// 初始化物理引擎
export function initPhysics() {
    createBall();
    lastTime = performance.now();
    return {
        update: updatePhysics,
        addObject: addPhysicsObject,
        removeObject: removePhysicsObject,
        applyForce: applyForce,
        applyImpulse: applyImpulse,
        setVelocity: setVelocity,
        getVelocity: getVelocity,
        ball,
        ballVelocity
    };
}

// 添加物体到物理系统
export function addPhysicsObject(object, options = {}) {
    const physicsObj = {
        object: object,
        position: object.position,
        velocity: new THREE.Vector3(0, 0, 0),
        mass: options.mass || 1,
        restitution: options.restitution || 0.8,
        friction: options.friction || 0.1,
        damping: options.damping || PHYSICS.BALL_DAMPING,
        isStatic: options.isStatic || false,
        collider: options.collider || {
            type: 'sphere',
            radius: DIMENSIONS.BALL_RADIUS
        },
        onCollision: options.onCollision || null
    };

    objects.push(physicsObj);
    return physicsObj;
}

// 从物理系统移除物体
export function removePhysicsObject(object) {
    const index = objects.findIndex(obj => obj.object === object);
    if (index !== -1) {
        objects.splice(index, 1);
        return true;
    }
    return false;
}

// 应用力到物体
export function applyForce(object, force) {
    const physicsObj = objects.find(obj => obj.object === object);
    if (physicsObj && !physicsObj.isStatic) {
        const acceleration = force.clone().divideScalar(physicsObj.mass);
        physicsObj.velocity.add(acceleration);
    }
}

// 应用瞬时冲量
export function applyImpulse(object, impulse) {
    const physicsObj = objects.find(obj => obj.object === object);
    if (physicsObj && !physicsObj.isStatic) {
        const deltaVelocity = impulse.clone().divideScalar(physicsObj.mass);
        physicsObj.velocity.add(deltaVelocity);
    }
}

// 设置物体速度
export function setVelocity(object, velocity) {
    const physicsObj = objects.find(obj => obj.object === object);
    if (physicsObj) {
        physicsObj.velocity.copy(velocity);
    }
}

// 获取物体速度
export function getVelocity(object) {
    const physicsObj = objects.find(obj => obj.object === object);
    if (physicsObj) {
        return physicsObj.velocity.clone();
    }
    return new THREE.Vector3(0, 0, 0);
}

// 应用重力
function applyGravity(physicsObj, deltaTime) {
    if (!physicsObj.isStatic) {
        const gravity = new THREE.Vector3(0, -PHYSICS.GRAVITY, 0);
        const gravityForce = gravity.multiplyScalar(physicsObj.mass * deltaTime);
        physicsObj.velocity.add(gravityForce);
    }
}

// 应用阻尼
function applyDamping(physicsObj, deltaTime) {
    if (!physicsObj.isStatic && physicsObj.damping > 0) {
        physicsObj.velocity.multiplyScalar(
            Math.pow(1 - physicsObj.damping, deltaTime)
        );
    }
}

// 更新物体位置
function updatePosition(physicsObj, deltaTime) {
    if (!physicsObj.isStatic) {
        const deltaPosition = physicsObj.velocity.clone().multiplyScalar(deltaTime);
        physicsObj.object.position.add(deltaPosition);
    }
}

// 检测和处理碰撞
function detectCollisions() {
    // 遍历所有物体对进行碰撞检测
    for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
            const objA = objects[i];
            const objB = objects[j];

            // 如果两者都是静态物体，跳过碰撞检测
            if (objA.isStatic && objB.isStatic) continue;

            const collision = checkCollision(objA, objB);
            if (collision) {
                resolveCollision(objA, objB, collision);

                // 触发碰撞回调
                if (objA.onCollision) objA.onCollision(objB, collision);
                if (objB.onCollision) objB.onCollision(objA, collision);
            }
        }
    }
}

// 检查两个物体之间的碰撞
function checkCollision(objA, objB) {
    // 球体与球体碰撞
    if (objA.collider.type === 'sphere' && objB.collider.type === 'sphere') {
        return checkSphereSphereCollision(objA, objB);
    }

    // 球体与平面碰撞
    if (objA.collider.type === 'sphere' && objB.collider.type === 'plane') {
        return checkSpherePlaneCollision(objA, objB);
    }

    if (objA.collider.type === 'plane' && objB.collider.type === 'sphere') {
        return checkSpherePlaneCollision(objB, objA);
    }

    // 其他类型的碰撞检测可以在这里扩展

    return null;
}

// 球体与球体碰撞检测
function checkSphereSphereCollision(sphereA, sphereB) {
    const posA = sphereA.object.position;
    const posB = sphereB.object.position;

    const radiusA = sphereA.collider.radius;
    const radiusB = sphereB.collider.radius;

    const distance = posA.distanceTo(posB);
    const minDistance = radiusA + radiusB;

    if (distance < minDistance) {
        const normal = new THREE.Vector3().subVectors(posB, posA).normalize();
        const penetrationDepth = minDistance - distance;

        return {
            normal: normal,
            penetrationDepth: penetrationDepth,
            contactPoint: new THREE.Vector3().copy(posA).add(
                normal.clone().multiplyScalar(radiusA)
            )
        };
    }

    return null;
}

// 球体与平面碰撞检测
function checkSpherePlaneCollision(sphere, plane) {
    const spherePos = sphere.object.position;
    const planePos = plane.object.position;
    const planeNormal = plane.collider.normal.clone().normalize();

    const distance = new THREE.Vector3().subVectors(spherePos, planePos).dot(planeNormal);

    if (distance < sphere.collider.radius) {
        return {
            normal: planeNormal,
            penetrationDepth: sphere.collider.radius - distance,
            contactPoint: new THREE.Vector3().copy(spherePos).sub(
                planeNormal.clone().multiplyScalar(distance)
            )
        };
    }

    return null;
}

// 解决碰撞
function resolveCollision(objA, objB, collision) {
    // 如果两者都是静态物体，跳过解决
    if (objA.isStatic && objB.isStatic) return;

    // 计算位置校正
    if (objA.isStatic) {
        // 只有B移动
        objB.object.position.add(
            collision.normal.clone().multiplyScalar(collision.penetrationDepth)
        );
    } else if (objB.isStatic) {
        // 只有A移动
        objA.object.position.sub(
            collision.normal.clone().multiplyScalar(collision.penetrationDepth)
        );
    } else {
        // 两者都移动
        const totalMass = objA.mass + objB.mass;
        const ratioA = objB.mass / totalMass;
        const ratioB = objA.mass / totalMass;

        objA.object.position.sub(
            collision.normal.clone().multiplyScalar(collision.penetrationDepth * ratioA)
        );

        objB.object.position.add(
            collision.normal.clone().multiplyScalar(collision.penetrationDepth * ratioB)
        );
    }

    // 计算碰撞后速度
    if (!objA.isStatic && !objB.isStatic) {
        const velA = objA.velocity;
        const velB = objB.velocity;

        const relativeVel = new THREE.Vector3().subVectors(velB, velA);
        const velAlongNormal = relativeVel.dot(collision.normal);

        // 如果物体正在分离，不需要计算反弹
        if (velAlongNormal > 0) return;

        // 计算反弹
        const restitution = Math.min(objA.restitution, objB.restitution);

        const impulseMagnitude = -(1 + restitution) * velAlongNormal;
        const impulse = collision.normal.clone().multiplyScalar(
            impulseMagnitude / (1 / objA.mass + 1 / objB.mass)
        );

        objA.velocity.sub(impulse.clone().divideScalar(objA.mass));
        objB.velocity.add(impulse.clone().divideScalar(objB.mass));
    } else if (!objA.isStatic) {
        // 只有A移动，撞到静态物体B
        const velA = objA.velocity;
        const normalVel = collision.normal.clone().multiplyScalar(
            velA.dot(collision.normal)
        );

        if (normalVel.dot(collision.normal) < 0) {
            objA.velocity.sub(normalVel.multiplyScalar(1 + objA.restitution));
        }
    } else if (!objB.isStatic) {
        // 只有B移动，撞到静态物体A
        const velB = objB.velocity;
        const normalVel = collision.normal.clone().multiplyScalar(
            velB.dot(collision.normal)
        );

        if (normalVel.dot(collision.normal) > 0) {
            objB.velocity.sub(normalVel.multiplyScalar(1 + objB.restitution));
        }
    }
}

// 更新物理状态
export function updatePhysics(currentTime, paddle, aiPaddle, onPlayerScore, onOpponentScore, onPaddleHit, isGameStarted = true) {
    if (!ball || !isGameStarted) return false;

    const deltaTime = (currentTime - lastTime) / 1000; // 转换为秒
    lastTime = currentTime;

    // 限制增量时间，防止在标签页不活跃时发生大的时间跳跃
    const cappedDeltaTime = Math.min(deltaTime, 0.1);

    // 应用重力
    ballVelocity.y -= gravity * cappedDeltaTime;

    // 应用摩擦力（空气阻力）
    ballVelocity.multiplyScalar(FRICTION);

    // 更新球的位置
    const positionDelta = ballVelocity.clone().multiplyScalar(cappedDeltaTime);
    ball.position.add(positionDelta);

    // 检测碰撞
    return checkCollisions(paddle, aiPaddle, onPlayerScore, onOpponentScore, onPaddleHit);
}

/**
 * 检测碰撞
 * @param {Object} paddle - 玩家的球拍
 * @param {Object} aiPaddle - AI球拍
 * @param {Function} onPlayerScore - 玩家得分回调
 * @param {Function} onOpponentScore - 对手得分回调
 * @param {Function} onPaddleHit - 球拍击球回调
 * @returns {boolean} - 返回是否发生碰撞
 */
function checkCollisions(paddle, aiPaddle, onPlayerScore, onOpponentScore, onPaddleHit) {
    if (!ball) return false;

    let collisionOccurred = false;

    // 桌子碰撞检测
    if (ball.position.y - ballRadius < 0.05 && ballVelocity.y < 0) {
        // 确保球在桌子范围内
        if (Math.abs(ball.position.x) < 1.37 && Math.abs(ball.position.z) < 0.7625) {
            ball.position.y = 0.05 + ballRadius; // 防止球穿过桌面
            ballVelocity.y = -ballVelocity.y * RESTITUTION; // 反弹，能量损失
            collisionOccurred = true;
        }
    }

    // 地板碰撞检测
    if (ball.position.y - ballRadius < -1 && ballVelocity.y < 0) {
        // 球落地，判断得分
        if (ball.position.z > 0) {
            // 对手得分
            if (onOpponentScore) onOpponentScore();
        } else {
            // 玩家得分
            if (onPlayerScore) onPlayerScore();
        }

        // 重置球的位置
        resetBallPosition(ball.position.z > 0);
        collisionOccurred = true;
    }

    // 墙壁碰撞检测
    // 左右墙壁
    if ((ball.position.x - ballRadius < -10 && ballVelocity.x < 0) ||
        (ball.position.x + ballRadius > 10 && ballVelocity.x > 0)) {
        ballVelocity.x = -ballVelocity.x * RESTITUTION;
        collisionOccurred = true;
    }

    // 前后墙壁
    if ((ball.position.z - ballRadius < -10 && ballVelocity.z < 0) ||
        (ball.position.z + ballRadius > 10 && ballVelocity.z > 0)) {
        ballVelocity.z = -ballVelocity.z * RESTITUTION;
        collisionOccurred = true;
    }

    // 天花板碰撞
    if (ball.position.y + ballRadius > 9 && ballVelocity.y > 0) {
        ballVelocity.y = -ballVelocity.y * RESTITUTION;
        collisionOccurred = true;
    }

    // 与球网碰撞检测
    if (Math.abs(ball.position.z) < 0.02 &&
        ball.position.y - ballRadius < 0.2025 && // 网高15.25cm + 桌高5cm
        ball.position.y > 0.05) {

        if (Math.abs(ball.position.x) < 0.7625) { // 网长1.525m / 2
            // 确定是否穿过网（基于速度方向）
            const movingTowardsNet = (ball.position.z > 0 && ballVelocity.z < 0) ||
                (ball.position.z < 0 && ballVelocity.z > 0);

            if (movingTowardsNet) {
                ballVelocity.z = -ballVelocity.z * RESTITUTION;
                collisionOccurred = true;
            }
        }
    }

    // 球拍碰撞检测
    if (paddle && checkPaddleCollision(paddle)) {
        // 计算反弹方向，更真实的物理响应
        calculatePaddleRebound(paddle);

        if (onPaddleHit) onPaddleHit(true); // 玩家击球回调
        collisionOccurred = true;
    }

    if (aiPaddle && checkPaddleCollision(aiPaddle)) {
        // 计算反弹方向
        calculatePaddleRebound(aiPaddle);

        if (onPaddleHit) onPaddleHit(false); // AI击球回调
        collisionOccurred = true;
    }

    return collisionOccurred;
}

/**
 * 检测球拍碰撞
 * @param {Object} paddle - 球拍对象
 * @returns {boolean} - 是否发生碰撞
 */
function checkPaddleCollision(paddle) {
    if (!ball || !paddle) return false;

    // 获取球拍的位置和尺寸
    const paddlePosition = paddle.position;
    const paddleWidth = 0.15; // 球拍宽度
    const paddleHeight = 0.25; // 球拍高度
    const paddleDepth = 0.02; // 球拍厚度

    // 检查是否与球拍相交
    return (
        ball.position.x > paddlePosition.x - paddleWidth / 2 - ballRadius &&
        ball.position.x < paddlePosition.x + paddleWidth / 2 + ballRadius &&
        ball.position.y > paddlePosition.y - paddleHeight / 2 - ballRadius &&
        ball.position.y < paddlePosition.y + paddleHeight / 2 + ballRadius &&
        ball.position.z > paddlePosition.z - paddleDepth / 2 - ballRadius &&
        ball.position.z < paddlePosition.z + paddleDepth / 2 + ballRadius
    );
}

/**
 * 计算球拍反弹
 * @param {Object} paddle - 球拍对象
 */
function calculatePaddleRebound(paddle) {
    if (!ball || !paddle) return;

    // 获取球拍法线（假设球拍面向Z轴）
    const paddleNormal = new THREE.Vector3(0, 0, paddle.position.z > 0 ? -1 : 1);

    // 计算球拍的角度（倾斜度）影响
    const paddleRotationX = paddle.rotation.x;
    const paddleRotationY = paddle.rotation.y;

    // 调整法线基于球拍的旋转
    paddleNormal.applyAxisAngle(new THREE.Vector3(1, 0, 0), paddleRotationX);
    paddleNormal.applyAxisAngle(new THREE.Vector3(0, 1, 0), paddleRotationY);

    // 入射向量
    const incident = ballVelocity.clone();

    // 入射角
    const dot = incident.dot(paddleNormal);

    // 计算反射向量：r = i - 2 * (i·n) * n
    const reflectedVector = incident.sub(paddleNormal.multiplyScalar(2 * dot));

    // 计算球与球拍接触点相对于球拍中心的位置（这会影响旋转）
    const contactPointX = ball.position.x - paddle.position.x;
    const contactPointY = ball.position.y - paddle.position.y;

    // 根据接触点添加额外的速度分量（旋转效果）
    reflectedVector.x += contactPointX * 5; // 水平方向的旋转影响
    reflectedVector.y += contactPointY * 3; // 垂直方向的旋转影响

    // 反弹速度受球拍移动速度影响（如果有）
    if (paddle.userData && paddle.userData.velocity) {
        reflectedVector.add(paddle.userData.velocity.multiplyScalar(0.5));
    }

    // 应用弹性系数
    reflectedVector.multiplyScalar(RESTITUTION);

    // 更新球的速度
    ballVelocity.copy(reflectedVector);

    // 确保球不卡在球拍内部
    const minDistance = ballRadius + 0.02; // 球半径 + 一点安全距离

    // 根据法线方向移动球
    const moveDirection = paddleNormal.clone().normalize();
    ball.position.add(moveDirection.multiplyScalar(minDistance));
}

/**
 * 创建乒乓球
 */
function createBall() {
    // 创建乒乓球
    const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.4,
        metalness: 0.1
    });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.castShadow = true;
    ball.position.set(0, 0.5, 0);
    ball.userData.id = 'ball';  // 为球添加标识符
    scene.add(ball);

    // 重置球的速度
    resetBallVelocity();
}

/**
 * 重置球的速度
 * @param {boolean} isPlayerServing - 是否为玩家发球
 */
function resetBallVelocity(isPlayerServing = true) {
    // 随机x方向速度
    const xVelocity = (Math.random() * 2 - 1) * 1.5;
    // 初始y方向速度（轻微向上）
    const yVelocity = 1 + Math.random() * 0.5;
    // z方向速度（基于谁在发球）
    const zVelocity = isPlayerServing ? -3 - Math.random() : 3 + Math.random();

    ballVelocity.set(xVelocity, yVelocity, zVelocity);
}

/**
 * 设置球的位置和速度
 * @param {THREE.Vector3} position - 球的位置
 * @param {THREE.Vector3} velocity - 球的速度
 */
function setBallPositionAndVelocity(position, velocity) {
    if (ball) {
        ball.position.copy(position);
        ballVelocity.copy(velocity);
    }
}

/**
 * 重置球的位置
 * @param {boolean} isPlayerServing - 是否为玩家发球
 */
function resetBallPosition(isPlayerServing = true) {
    if (ball) {
        // 如果是玩家发球，球放在玩家这侧
        if (isPlayerServing) {
            ball.position.set(0, 0.5, 1);
        } else {
            // 如果是对手发球，球放在对手这侧
            ball.position.set(0, 0.5, -1);
        }
        resetBallVelocity(isPlayerServing);
    }
}

/**
 * 为球添加轨迹效果
 */
function addBallTrail() {
    if (!ball) return;

    // 创建轨迹系统
    const trailLength = 20;
    const trail = [];

    for (let i = 0; i < trailLength; i++) {
        const trailPartGeometry = new THREE.SphereGeometry(ballRadius * (1 - i / trailLength * 0.8), 8, 8);
        const trailPartMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 1 - i / trailLength
        });
        const trailPart = new THREE.Mesh(trailPartGeometry, trailPartMaterial);
        trailPart.visible = false;
        scene.add(trailPart);
        trail.push(trailPart);
    }

    // 保存轨迹到球的userData中
    ball.userData.trail = trail;
    ball.userData.trailPositions = Array(trailLength).fill(new THREE.Vector3());
}

/**
 * 更新球的轨迹
 */
function updateBallTrail() {
    if (!ball || !ball.userData.trail) return;

    const trail = ball.userData.trail;
    const positions = ball.userData.trailPositions;

    // 将当前位置添加到轨迹开头
    positions.unshift(ball.position.clone());
    positions.pop(); // 移除最后一个位置

    // 更新轨迹部分的位置
    for (let i = 0; i < trail.length; i++) {
        if (i < positions.length && ballVelocity.length() > 3) {
            trail[i].position.copy(positions[i]);
            trail[i].visible = true;
        } else {
            trail[i].visible = false;
        }
    }
}

// 导出物理引擎模块的功能
export {
    initPhysics,
    updatePhysics,
    resetBallPosition,
    setBallPositionAndVelocity,
    addBallTrail,
    updateBallTrail,
    ball,
    ballVelocity,
    ballRadius
}; 