// config.js - 游戏配置和常量

// 游戏尺寸和界限
export const DIMENSIONS = {
    // 场景尺寸
    TABLE_WIDTH: 15,
    TABLE_LENGTH: 25,
    TABLE_HEIGHT: 1,

    // 球拍尺寸
    PADDLE_WIDTH: 2,
    PADDLE_HEIGHT: 3,
    PADDLE_DEPTH: 0.2,

    // 球的尺寸和物理特性
    BALL_RADIUS: 0.4,
    BALL_SEGMENTS: 32,
    BALL_MASS: 0.1,

    // 场景边界
    WALL_THICKNESS: 0.5,
    WALL_HEIGHT: 5,

    // 摄像机设置
    CAMERA_FOV: 60,
    CAMERA_NEAR: 0.1,
    CAMERA_FAR: 1000,
    DEFAULT_CAMERA_POSITION: [0, 10, 15]
};

// 物理引擎配置
export const PHYSICS = {
    // 重力
    GRAVITY: 9.8,
    GRAVITY_DIRECTION: [0, -1, 0],

    // 弹性和摩擦力
    DEFAULT_RESTITUTION: 0.7,
    PADDLE_RESTITUTION: 0.9,
    TABLE_RESTITUTION: 0.8,
    WALL_RESTITUTION: 0.7,

    DEFAULT_FRICTION: 0.1,
    TABLE_FRICTION: 0.05,

    // 阻尼和空气阻力
    LINEAR_DAMPING: 0.01,
    ANGULAR_DAMPING: 0.05,

    // 物理更新频率 (秒)
    TIME_STEP: 1 / 60,
    MAX_SUB_STEPS: 5,

    // 碰撞检测精度
    COLLISION_PRECISION: 0.001
};

// 控制设置
export const CONTROLS = {
    // 玩家移动相关
    PADDLE_SPEED: 10,
    PADDLE_ACCELERATION: 50,
    PADDLE_DECELERATION: 20,

    // 鼠标敏感度
    MOUSE_SENSITIVITY: 1.0,

    // 触摸控制
    TOUCH_SENSITIVITY: 1.5,

    // 游戏手柄设置
    GAMEPAD_SENSITIVITY: 1.2,
    GAMEPAD_DEADZONE: 0.1,

    // 控制反转选项
    INVERT_Y_AXIS: false,
    INVERT_X_AXIS: false
};

// AI 设置
export const AI = {
    // AI 难度级别
    DIFFICULTY_EASY: {
        REACTION_TIME: 0.5,
        PREDICTION_ERROR: 0.3,
        MAX_SPEED: 0.6
    },

    DIFFICULTY_MEDIUM: {
        REACTION_TIME: 0.3,
        PREDICTION_ERROR: 0.15,
        MAX_SPEED: 0.8
    },

    DIFFICULTY_HARD: {
        REACTION_TIME: 0.1,
        PREDICTION_ERROR: 0.05,
        MAX_SPEED: 0.95
    },

    // 预测和行为模式
    PREDICTION_STEPS: 10,
    POSITION_UPDATE_RATE: 0.1
};

// 游戏设置
export const GAME = {
    // 规则
    POINTS_TO_WIN: 11,
    POINTS_LEAD_TO_WIN: 2,

    // 状态常量
    STATE: {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'game_over'
    },

    // 默认玩家
    PLAYERS: {
        HUMAN: 'human',
        AI: 'ai'
    }
};

// 渲染设置
export const RENDER = {
    // 基础色彩
    COLORS: {
        TABLE: 0x1b5e20,
        BALL: 0xffffff,
        PADDLE: 0xe64a19,
        WALL: 0x424242,
        NET: 0xbdbdbd,
        AMBIENT_LIGHT: 0xffffff,
        DIRECTIONAL_LIGHT: 0xffffff,
        SHADOW: 0x000000,
        BACKGROUND: 0x263238
    },

    // 光照设置
    LIGHTS: {
        AMBIENT_INTENSITY: 0.5,
        DIRECTIONAL_INTENSITY: 0.8,
        SHADOWS_ENABLED: true,
        SHADOW_MAP_SIZE: 1024
    },

    // 性能设置
    SHADOW_MAP_ENABLED: true,
    ANTI_ALIAS_ENABLED: true,
    MAX_FPS: 60,

    // 后期处理
    POST_PROCESSING: {
        ENABLED: false,
        BLOOM_STRENGTH: 0.5,
        BLOOM_RADIUS: 0.4,
        BLOOM_THRESHOLD: 0.85
    }
};

// 音效设置
export const AUDIO = {
    // 音量设置
    MASTER_VOLUME: 0.7,
    EFFECTS_VOLUME: 1.0,
    MUSIC_VOLUME: 0.5,

    // 音效文件路径
    SOUNDS: {
        PADDLE_HIT: 'sounds/paddle_hit.mp3',
        WALL_HIT: 'sounds/wall_hit.mp3',
        TABLE_HIT: 'sounds/table_hit.mp3',
        SCORE: 'sounds/score.mp3',
        GAME_START: 'sounds/game_start.mp3',
        GAME_OVER: 'sounds/game_over.mp3'
    },

    // 背景音乐
    MUSIC: 'sounds/background_music.mp3',

    // 3D音效设置
    SPATIAL_AUDIO_ENABLED: true,
    DOPPLER_FACTOR: 0.5
}; 