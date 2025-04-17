// controls.js - 处理游戏输入和控制

import * as THREE from 'three';
import { CONTROLS, DIMENSIONS } from './config.js';

// 控制状态
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false,
    Space: false
};

// 鼠标状态
const mouse = {
    x: 0,
    y: 0,
    isPressed: false,
    sensitivity: CONTROLS.MOUSE_SENSITIVITY
};

// 游戏手柄状态
const gamepad = {
    connected: false,
    device: null,
    deadzone: CONTROLS.GAMEPAD_DEADZONE,
    sensitivity: CONTROLS.GAMEPAD_SENSITIVITY
};

// 初始化控制
export function initControls(container) {
    // 键盘事件监听
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 鼠标事件监听
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);

    // 触摸事件监听（移动设备）
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    // 游戏手柄连接监听
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    return {
        update: updateControls,
        getInputVector: getInputVector,
        getMousePosition: getMousePosition,
        isKeyPressed: isKeyPressed,
        isMousePressed: isMousePressed,
        hasGamepad: hasGamepad,
        getGamepadAxis: getGamepadAxis,
        getGamepadButton: getGamepadButton,
        dispose: disposeControls
    };
}

// 清理控制监听器
export function disposeControls(container) {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);

    if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mousedown', handleMouseDown);
        container.removeEventListener('mouseup', handleMouseUp);

        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
    }

    window.removeEventListener('gamepadconnected', handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
}

// 键盘事件处理
function handleKeyDown(event) {
    if (keys.hasOwnProperty(event.code)) {
        keys[event.code] = true;
        event.preventDefault();
    }
}

function handleKeyUp(event) {
    if (keys.hasOwnProperty(event.code)) {
        keys[event.code] = false;
        event.preventDefault();
    }
}

// 鼠标事件处理
function handleMouseMove(event) {
    // 计算鼠标在容器中的相对位置（-1到1之间）
    const rect = event.currentTarget.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function handleMouseDown(event) {
    mouse.isPressed = true;
    event.preventDefault();
}

function handleMouseUp(event) {
    mouse.isPressed = false;
    event.preventDefault();
}

// 触摸事件处理
function handleTouchMove(event) {
    if (event.touches.length > 0) {
        const touch = event.touches[0];
        const rect = event.currentTarget.getBoundingClientRect();
        mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    }
    event.preventDefault();
}

function handleTouchStart(event) {
    mouse.isPressed = true;

    if (event.touches.length > 0) {
        const touch = event.touches[0];
        const rect = event.currentTarget.getBoundingClientRect();
        mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    }

    event.preventDefault();
}

function handleTouchEnd(event) {
    mouse.isPressed = false;
    event.preventDefault();
}

// 游戏手柄事件处理
function handleGamepadConnected(event) {
    gamepad.connected = true;
    gamepad.device = event.gamepad;
    console.log(`游戏手柄已连接: ${event.gamepad.id}`);
}

function handleGamepadDisconnected(event) {
    gamepad.connected = false;
    gamepad.device = null;
    console.log('游戏手柄已断开连接');
}

// 更新游戏手柄状态
function updateGamepadState() {
    if (gamepad.connected) {
        // 获取连接的游戏手柄的最新状态
        const gamepads = navigator.getGamepads();
        for (const gp of gamepads) {
            if (gp && gp.index === gamepad.device.index) {
                gamepad.device = gp;
                break;
            }
        }
    } else {
        // 检查是否有新的游戏手柄连接
        const gamepads = navigator.getGamepads();
        for (const gp of gamepads) {
            if (gp) {
                gamepad.connected = true;
                gamepad.device = gp;
                console.log(`游戏手柄已检测到: ${gp.id}`);
                break;
            }
        }
    }
}

// 获取游戏手柄轴的值（应用死区）
function getAxisValueWithDeadzone(value) {
    // 应用死区
    if (Math.abs(value) < gamepad.deadzone) {
        return 0;
    }

    // 重新映射值，使其在死区后从0开始
    const sign = value > 0 ? 1 : -1;
    return sign * (Math.abs(value) - gamepad.deadzone) / (1 - gamepad.deadzone);
}

// 获取游戏输入向量
export function getInputVector() {
    const inputVector = new THREE.Vector2(0, 0);

    // 键盘输入
    if (keys.ArrowUp || keys.KeyW) inputVector.y += 1;
    if (keys.ArrowDown || keys.KeyS) inputVector.y -= 1;
    if (keys.ArrowRight || keys.KeyD) inputVector.x += 1;
    if (keys.ArrowLeft || keys.KeyA) inputVector.x -= 1;

    // 游戏手柄输入
    if (hasGamepad()) {
        const xAxis = getAxisValueWithDeadzone(gamepad.device.axes[0]);
        const yAxis = getAxisValueWithDeadzone(gamepad.device.axes[1]);

        inputVector.x += xAxis * gamepad.sensitivity;
        inputVector.y -= yAxis * gamepad.sensitivity; // 注意：游戏手柄的Y轴通常是相反的
    }

    // 如果长度大于1，则归一化
    if (inputVector.length() > 1) {
        inputVector.normalize();
    }

    return inputVector;
}

// 获取鼠标位置
export function getMousePosition() {
    return { x: mouse.x, y: mouse.y };
}

// 检查按键是否按下
export function isKeyPressed(keyCode) {
    return keys[keyCode] === true;
}

// 检查鼠标是否按下
export function isMousePressed() {
    return mouse.isPressed;
}

// 检查是否有游戏手柄连接
export function hasGamepad() {
    return gamepad.connected && gamepad.device !== null;
}

// 获取游戏手柄轴的值
export function getGamepadAxis(axisIndex) {
    if (!hasGamepad() || axisIndex >= gamepad.device.axes.length) {
        return 0;
    }

    return getAxisValueWithDeadzone(gamepad.device.axes[axisIndex]) * gamepad.sensitivity;
}

// 获取游戏手柄按钮的状态
export function getGamepadButton(buttonIndex) {
    if (!hasGamepad() || buttonIndex >= gamepad.device.buttons.length) {
        return false;
    }

    return gamepad.device.buttons[buttonIndex].pressed;
}

// 更新控制状态
export function updateControls() {
    // 更新游戏手柄状态
    updateGamepadState();
} 