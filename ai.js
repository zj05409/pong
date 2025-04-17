// AI对手逻辑模块 - 实现不同难度级别的AI行为

import { Vector3 } from 'three';

// AI难度级别
const AI_DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
    ADAPTIVE: 'adaptive'
};

// AI状态
const AI_STATE = {
    IDLE: 'idle',            // 空闲
    PREPARING: 'preparing',  // 准备接球
    TRACKING: 'tracking',    // 追踪球
    RETURNING: 'returning',  // 回球
    MOVING: 'moving',        // 移动到基础位置
    CELEBRATING: 'celebrating', // 庆祝得分
    FRUSTRATED: 'frustrated' // 丢分懊恼
};

// AI行为配置
const AI_CONFIG = {
    [AI_DIFFICULTY.EASY]: {
        reactionTime: 0.8,           // 反应时间（秒）
        movementSpeed: 0.5,          // 移动速度（0-1）
        accuracy: 0.5,               // 准确度（0-1）
        prediction: 0.3,             // 预测能力（0-1）
        errorRate: 0.4,              // 犯错率（0-1）
        returnHeight: 0.3,           // 回球高度（0-1）
        returnSpeed: 0.6,            // 回球速度（0-1）
        spinRate: 0.3,               // 旋转球率（0-1）
        recoverySpeed: 0.5,          // 恢复速度（0-1）
        aggression: 0.2,             // 侵略性（0-1）
        consistency: 0.4             // 一致性（0-1）
    },
    [AI_DIFFICULTY.MEDIUM]: {
        reactionTime: 0.5,           // 反应时间（秒）
        movementSpeed: 0.7,          // 移动速度（0-1）
        accuracy: 0.7,               // 准确度（0-1）
        prediction: 0.6,             // 预测能力（0-1）
        errorRate: 0.2,              // 犯错率（0-1）
        returnHeight: 0.5,           // 回球高度（0-1）
        returnSpeed: 0.8,            // 回球速度（0-1）
        spinRate: 0.6,               // 旋转球率（0-1）
        recoverySpeed: 0.7,          // 恢复速度（0-1）
        aggression: 0.5,             // 侵略性（0-1）
        consistency: 0.7             // 一致性（0-1）
    },
    [AI_DIFFICULTY.HARD]: {
        reactionTime: 0.2,           // 反应时间（秒）
        movementSpeed: 0.9,          // 移动速度（0-1）
        accuracy: 0.9,               // 准确度（0-1）
        prediction: 0.9,             // 预测能力（0-1）
        errorRate: 0.05,             // 犯错率（0-1）
        returnHeight: 0.6,           // 回球高度（0-1）
        returnSpeed: 0.95,           // 回球速度（0-1）
        spinRate: 0.8,               // 旋转球率（0-1）
        recoverySpeed: 0.9,          // 恢复速度（0-1）
        aggression: 0.8,             // 侵略性（0-1）
        consistency: 0.9             // 一致性（0-1）
    },
    [AI_DIFFICULTY.ADAPTIVE]: {
        // 自适应难度基础配置，会根据玩家表现调整
        reactionTime: 0.5,           // 反应时间（秒）
        movementSpeed: 0.7,          // 移动速度（0-1）
        accuracy: 0.7,               // 准确度（0-1）
        prediction: 0.6,             // 预测能力（0-1）
        errorRate: 0.2,              // 犯错率（0-1）
        returnHeight: 0.5,           // 回球高度（0-1）
        returnSpeed: 0.8,            // 回球速度（0-1）
        spinRate: 0.6,               // 旋转球率（0-1）
        recoverySpeed: 0.7,          // 恢复速度（0-1）
        aggression: 0.5,             // 侵略性（0-1）
        consistency: 0.7,            // 一致性（0-1）
        adaptationRate: 0.1          // 适应速率（0-1）
    }
};

// AI决策点类型
const DECISION_TYPE = {
    DEFENSE: 'defense',       // 防守
    ATTACK: 'attack',         // 进攻
    PLACEMENT: 'placement',   // 球的放置
    SPIN: 'spin',             // 旋转
    POWER: 'power'            // 力量
};

/**
 * AI类 - 实现AI对手的行为和决策
 */
class AI {
    /**
     * 创建一个AI实例
     * @param {Object} options - AI配置选项
     * @param {string} options.difficulty - 难度级别
     * @param {Object} options.paddle - AI控制的球拍对象
     * @param {Object} options.gameState - 游戏状态对象
     */
    constructor(options) {
        // 基本属性
        this.difficulty = options.difficulty || AI_DIFFICULTY.MEDIUM;
        this.paddle = options.paddle || null;
        this.gameState = options.gameState || null;
        this.ball = options.ball || null;

        // 配置
        this.config = { ...AI_CONFIG[this.difficulty] };

        // 状态
        this.state = AI_STATE.IDLE;
        this.target = new Vector3();
        this.stateTime = 0;
        this.reactionTimer = 0;
        this.decisionTimer = 0;
        this.anticipationPoint = new Vector3();
        this.lastKnownBallPosition = new Vector3();
        this.basePosition = new Vector3();
        this.movingToBase = false;

        // 适应性学习
        this.playerPatterns = {
            leftSide: 0,
            rightSide: 0,
            shortBalls: 0,
            longBalls: 0,
            spinBalls: 0
        };
        this.adaptiveConfig = { ...this.config };
        this.consecutivePointsLost = 0;
        this.consecutivePointsWon = 0;

        // 初始化
        this.initialize();
    }

    /**
     * 初始化AI
     */
    initialize() {
        if (this.paddle) {
            // 设置基础位置（球拍初始位置）
            this.basePosition.copy(this.paddle.position);
        }
    }

    /**
     * 更新AI状态和行为
     * @param {number} deltaTime - 帧时间差
     */
    update(deltaTime) {
        if (!this.paddle || !this.ball || !this.gameState) return;

        // 更新状态时间
        this.stateTime += deltaTime;

        // 获取当前球的位置和速度
        const ballPosition = this.ball.position.clone();
        const ballVelocity = this.ball.velocity ? this.ball.velocity.clone() : new Vector3();

        // 保存球的位置用于轨迹分析
        this.lastKnownBallPosition.copy(ballPosition);

        // 根据当前状态执行不同的行为
        switch (this.state) {
            case AI_STATE.IDLE:
                this.executeIdleState(deltaTime, ballPosition, ballVelocity);
                break;

            case AI_STATE.PREPARING:
                this.executePreparingState(deltaTime, ballPosition, ballVelocity);
                break;

            case AI_STATE.TRACKING:
                this.executeTrackingState(deltaTime, ballPosition, ballVelocity);
                break;

            case AI_STATE.RETURNING:
                this.executeReturningState(deltaTime, ballPosition, ballVelocity);
                break;

            case AI_STATE.MOVING:
                this.executeMovingState(deltaTime);
                break;

            case AI_STATE.CELEBRATING:
                this.executeCelebratingState(deltaTime);
                break;

            case AI_STATE.FRUSTRATED:
                this.executeFrustratedState(deltaTime);
                break;
        }

        // 决策更新
        this.decisionTimer += deltaTime;
        if (this.decisionTimer >= 0.5) {
            this.makeDecisions();
            this.decisionTimer = 0;
        }
    }

    /**
     * 执行空闲状态
     */
    executeIdleState(deltaTime, ballPosition, ballVelocity) {
        // 在空闲状态下，AI会等待球向它的方向移动

        // 如果球向AI方向移动，进入准备状态
        if (this.isBallApproaching(ballPosition, ballVelocity)) {
            this.changeState(AI_STATE.PREPARING);
            this.reactionTimer = 0;
        } else {
            // 不是向AI移动，AI应该移回基础位置
            this.moveTowardsBasePosition(deltaTime);
        }
    }

    /**
     * 执行准备状态
     */
    executePreparingState(deltaTime, ballPosition, ballVelocity) {
        // 在准备状态下，AI有一个反应时间，然后开始追踪球

        this.reactionTimer += deltaTime;

        // 如果球不再向AI方向移动，返回空闲状态
        if (!this.isBallApproaching(ballPosition, ballVelocity)) {
            this.changeState(AI_STATE.IDLE);
            return;
        }

        // 反应时间后，开始追踪球
        if (this.reactionTimer >= this.config.reactionTime) {
            this.changeState(AI_STATE.TRACKING);
            this.calculateAnticipationPoint(ballPosition, ballVelocity);
        } else {
            // 在反应前保持基础位置附近
            this.moveTowardsBasePosition(deltaTime);
        }
    }

    /**
     * 执行追踪状态
     */
    executeTrackingState(deltaTime, ballPosition, ballVelocity) {
        // 在追踪状态下，AI尝试移动到球的预计位置

        // 如果球不再向AI方向移动，返回空闲状态
        if (!this.isBallApproaching(ballPosition, ballVelocity)) {
            this.changeState(AI_STATE.IDLE);
            return;
        }

        // 定期更新预期点
        if (this.stateTime > 0.1) {
            this.calculateAnticipationPoint(ballPosition, ballVelocity);
            this.stateTime = 0;
        }

        // 移动到预期点
        this.moveTowardsAnticipationPoint(deltaTime);

        // 检查是否到了回球的时间
        if (this.isReadyToReturnBall(ballPosition)) {
            this.changeState(AI_STATE.RETURNING);
        }
    }

    /**
     * 执行回球状态
     */
    executeReturningState(deltaTime, ballPosition, ballVelocity) {
        // 在回球状态下，AI会击球并添加一些随机的方向和力量

        // 检查是否已经击球
        if (this.stateTime > 0.1) {
            this.returnBall();
            this.changeState(AI_STATE.MOVING);
        }
    }

    /**
     * 执行移动状态
     */
    executeMovingState(deltaTime) {
        // 在移动状态下，AI会返回到基础位置

        if (this.moveTowardsBasePosition(deltaTime)) {
            this.changeState(AI_STATE.IDLE);
        }
    }

    /**
     * 执行庆祝状态
     */
    executeCelebratingState(deltaTime) {
        // 庆祝动画
        if (this.stateTime > 1.0) {
            this.changeState(AI_STATE.MOVING);
        }
    }

    /**
     * 执行懊恼状态
     */
    executeFrustratedState(deltaTime) {
        // 懊恼动画
        if (this.stateTime > 1.0) {
            this.changeState(AI_STATE.MOVING);
        }
    }

    /**
     * 判断球是否正向AI方向移动
     */
    isBallApproaching(ballPosition, ballVelocity) {
        // 简化：检查z轴速度是否朝向AI侧
        // 假设AI在正z方向，球在负z方向移动时表示球正接近AI
        return ballVelocity.z > 0;
    }

    /**
     * 计算球的预期位置
     */
    calculateAnticipationPoint(ballPosition, ballVelocity) {
        // 预测球会在哪里与AI侧的平面相交
        const aiTableZ = this.paddle.position.z - 0.5; // 假设AI在桌子的这一侧

        if (Math.abs(ballVelocity.z) < 0.001) {
            return; // 避免除以零
        }

        // 计算球到达AI侧所需的时间
        const timeToReach = (aiTableZ - ballPosition.z) / ballVelocity.z;

        if (timeToReach <= 0) {
            return; // 球已经过了或者正在远离
        }

        // 预测位置，加入一些基于准确度的随机性
        this.anticipationPoint.x = ballPosition.x + ballVelocity.x * timeToReach;
        this.anticipationPoint.y = ballPosition.y + ballVelocity.y * timeToReach;
        this.anticipationPoint.z = aiTableZ;

        // 添加基于准确度的随机偏移
        const accuracyFactor = 1 - this.config.accuracy;
        this.anticipationPoint.x += (Math.random() * 2 - 1) * accuracyFactor;

        // 确保预期点在合理范围内
        this.anticipationPoint.x = Math.max(-2, Math.min(2, this.anticipationPoint.x));
    }

    /**
     * 移动向预期点
     */
    moveTowardsAnticipationPoint(deltaTime) {
        if (!this.paddle) return;

        // 获取目标X位置（只在X轴上移动）
        const targetX = this.anticipationPoint.x;

        // 计算移动方向和距离
        const currentX = this.paddle.position.x;
        const distance = targetX - currentX;
        const direction = Math.sign(distance);

        // 设置移动速度
        const speed = this.config.movementSpeed * 5; // 调整为适合的速度值
        const moveAmount = speed * deltaTime;

        // 如果足够接近目标，直接设置到目标位置
        if (Math.abs(distance) <= moveAmount) {
            this.paddle.position.x = targetX;
        } else {
            this.paddle.position.x += direction * moveAmount;
        }
    }

    /**
     * 移动向基础位置
     */
    moveTowardsBasePosition(deltaTime) {
        if (!this.paddle) return false;

        // 计算移动方向和距离
        const currentX = this.paddle.position.x;
        const distance = this.basePosition.x - currentX;
        const direction = Math.sign(distance);

        // 如果已经足够接近基础位置，返回true
        if (Math.abs(distance) < 0.1) {
            this.paddle.position.x = this.basePosition.x;
            return true;
        }

        // 设置移动速度
        const speed = this.config.recoverySpeed * 3;
        const moveAmount = speed * deltaTime;

        // 移动球拍
        this.paddle.position.x += direction * moveAmount;

        return false;
    }

    /**
     * 检查是否准备回球
     */
    isReadyToReturnBall(ballPosition) {
        // 检查球是否足够接近AI侧
        const aiTableZ = this.paddle.position.z - 0.5;
        return Math.abs(ballPosition.z - aiTableZ) < 0.2;
    }

    /**
     * 执行回球
     */
    returnBall() {
        if (!this.ball) return;

        // 基础回球逻辑：反转球的z轴速度
        if (this.ball.velocity) {
            // 反转z轴速度
            this.ball.velocity.z *= -1;

            // 添加基于AI回球力量的速度
            const powerFactor = this.config.returnSpeed;
            this.ball.velocity.multiplyScalar(powerFactor);

            // 添加基于AI准确度的随机性
            const randomFactor = 1 - this.config.accuracy;
            this.ball.velocity.x += (Math.random() * 2 - 1) * randomFactor;
            this.ball.velocity.y = Math.max(0.1, this.ball.velocity.y); // 确保球有一些上升的趋势

            // 随机添加旋转
            if (Math.random() < this.config.spinRate) {
                // 添加旋转效果，影响x轴速度
                this.ball.velocity.x += (Math.random() * 2 - 1) * this.config.spinRate;
            }
        }
    }

    /**
     * 改变AI状态
     */
    changeState(newState) {
        this.state = newState;
        this.stateTime = 0;
    }

    /**
     * 通知AI球员得分
     */
    onPlayerScored() {
        this.consecutivePointsLost++;
        this.consecutivePointsWon = 0;

        // 根据连续失分调整难度
        if (this.difficulty === AI_DIFFICULTY.ADAPTIVE) {
            this.adjustDifficulty(true);
        }

        this.changeState(AI_STATE.FRUSTRATED);
    }

    /**
     * 通知AI得分
     */
    onAIScored() {
        this.consecutivePointsWon++;
        this.consecutivePointsLost = 0;

        // 根据连续得分调整难度
        if (this.difficulty === AI_DIFFICULTY.ADAPTIVE) {
            this.adjustDifficulty(false);
        }

        this.changeState(AI_STATE.CELEBRATING);
    }

    /**
     * 调整难度（只在自适应模式下）
     * @param {boolean} makeEasier - 是否降低难度
     */
    adjustDifficulty(makeEasier) {
        if (this.difficulty !== AI_DIFFICULTY.ADAPTIVE) return;

        const adjustRate = this.config.adaptationRate;
        const properties = [
            'reactionTime', 'movementSpeed', 'accuracy', 'prediction',
            'errorRate', 'returnHeight', 'returnSpeed', 'spinRate',
            'recoverySpeed', 'aggression', 'consistency'
        ];

        // 根据游戏表现调整各个参数
        properties.forEach(prop => {
            if (prop === 'reactionTime' || prop === 'errorRate') {
                // 这些属性是越小越难
                if (makeEasier) {
                    this.adaptiveConfig[prop] = Math.min(1, this.adaptiveConfig[prop] + adjustRate);
                } else {
                    this.adaptiveConfig[prop] = Math.max(0.1, this.adaptiveConfig[prop] - adjustRate);
                }
            } else {
                // 其他属性是越大越难
                if (makeEasier) {
                    this.adaptiveConfig[prop] = Math.max(0.1, this.adaptiveConfig[prop] - adjustRate);
                } else {
                    this.adaptiveConfig[prop] = Math.min(1, this.adaptiveConfig[prop] + adjustRate);
                }
            }
        });

        // 应用调整后的配置
        this.config = this.adaptiveConfig;
    }

    /**
     * 学习玩家的行为模式
     */
    learnPlayerBehavior(ballPosition, ballVelocity) {
        // 记录玩家的击球位置偏好
        if (ballPosition.x < -0.5) {
            this.playerPatterns.leftSide++;
        } else if (ballPosition.x > 0.5) {
            this.playerPatterns.rightSide++;
        }

        // 记录球的长短
        if (Math.abs(ballPosition.z) < 1) {
            this.playerPatterns.shortBalls++;
        } else {
            this.playerPatterns.longBalls++;
        }

        // 记录旋转球
        if (Math.abs(ballVelocity.x) > 2) {
            this.playerPatterns.spinBalls++;
        }
    }

    /**
     * 做出策略决策
     */
    makeDecisions() {
        // 基于玩家模式和当前游戏状态调整AI行为

        const totalShots = this.playerPatterns.leftSide + this.playerPatterns.rightSide;

        if (totalShots > 5) {
            // 如果玩家倾向于打左侧
            if (this.playerPatterns.leftSide > this.playerPatterns.rightSide * 1.5) {
                this.basePosition.x = -0.3; // 稍微偏向左侧等待
            }
            // 如果玩家倾向于打右侧
            else if (this.playerPatterns.rightSide > this.playerPatterns.leftSide * 1.5) {
                this.basePosition.x = 0.3; // 稍微偏向右侧等待
            }
            // 否则回到中间
            else {
                this.basePosition.x = 0;
            }
        }
    }

    /**
     * 设置难度
     */
    setDifficulty(difficulty) {
        if (AI_CONFIG[difficulty]) {
            this.difficulty = difficulty;
            this.config = { ...AI_CONFIG[difficulty] };
            this.adaptiveConfig = { ...this.config };
        }
    }
}

// 导出AI类和常量
export {
    AI,
    AI_DIFFICULTY,
    AI_STATE
}; 