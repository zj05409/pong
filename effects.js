// 特效系统模块 - 管理游戏视觉特效

import * as THREE from 'three';
import { RENDER } from './config.js';
import { scene } from './scene.js';

// 特效对象集合
const activeEffects = [];
let effectsEnabled = true;

/**
 * 初始化特效系统
 */
export function initEffects() {
    // 清理之前的特效
    clearAllEffects();

    return {
        createHitEffect,
        createScoreEffect,
        createTrailEffect,
        clearAllEffects,
        setEffectsEnabled,
        updateEffects
    };
}

/**
 * 设置特效是否启用
 * @param {boolean} enabled - 是否启用特效
 */
export function setEffectsEnabled(enabled) {
    effectsEnabled = enabled;

    // 如果禁用特效，清理所有活动特效
    if (!enabled) {
        clearAllEffects();
    }
}

/**
 * 更新所有特效
 * @param {number} deltaTime - 时间增量（秒）
 */
export function updateEffects(deltaTime) {
    if (!effectsEnabled) return;

    // 更新并移除已完成的特效
    for (let i = activeEffects.length - 1; i >= 0; i--) {
        const effect = activeEffects[i];

        if (effect.update(deltaTime)) {
            // 特效完成，从场景和列表中移除
            if (effect.dispose) {
                effect.dispose();
            }
            activeEffects.splice(i, 1);
        }
    }
}

/**
 * 创建击球特效
 * @param {THREE.Vector3} position - 特效位置
 * @param {THREE.Vector3} direction - 特效方向
 * @param {string} type - 特效类型 ('player', 'opponent', 'table', 'net')
 */
export function createHitEffect(position, direction, type = 'player') {
    if (!effectsEnabled || !scene) return null;

    // 创建粒子系统
    const particleCount = 20;
    const particles = new THREE.Group();

    // 确定特效颜色
    let color;
    switch (type) {
        case 'player':
            color = 0xff5555;
            break;
        case 'opponent':
            color = 0x55ff55;
            break;
        case 'table':
            color = 0xffffff;
            break;
        case 'net':
            color = 0xaaaaaa;
            break;
        default:
            color = 0xffffff;
    }

    // 创建粒子
    const particleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8
    });

    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());

        // 设置随机初始位置
        particle.position.copy(position);
        particle.position.x += (Math.random() - 0.5) * 0.1;
        particle.position.y += (Math.random() - 0.5) * 0.1;
        particle.position.z += (Math.random() - 0.5) * 0.1;

        // 随机速度，但主要沿击球方向
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );

        // 添加定向分量
        if (direction) {
            velocity.add(direction.clone().multiplyScalar(2));
        }

        velocities.push(velocity);
        particles.add(particle);
    }

    scene.add(particles);

    // 创建特效对象
    const effect = {
        lifeTime: 0,
        maxLifeTime: 1.0, // 特效持续1秒

        // 更新特效
        update: function (deltaTime) {
            this.lifeTime += deltaTime;

            // 如果特效寿命结束，返回true
            if (this.lifeTime >= this.maxLifeTime) {
                return true;
            }

            // 计算特效进度（0-1）
            const progress = this.lifeTime / this.maxLifeTime;
            const opacity = 1 - progress;

            // 更新每个粒子
            for (let i = 0; i < particles.children.length; i++) {
                const particle = particles.children[i];

                // 移动粒子
                const velocity = velocities[i];
                particle.position.add(velocity.clone().multiplyScalar(deltaTime));

                // 缩小粒子
                const scale = 1 - progress * 0.9;
                particle.scale.set(scale, scale, scale);

                // 更新透明度
                particle.material.opacity = opacity;
            }

            return false; // 特效尚未完成
        },

        // 清理特效资源
        dispose: function () {
            scene.remove(particles);

            // 清理几何体和材质
            particles.children.forEach(particle => {
                particle.geometry.dispose();
                particle.material.dispose();
            });
        }
    };

    activeEffects.push(effect);
    return effect;
}

/**
 * 创建得分特效
 * @param {THREE.Vector3} position - 特效位置
 * @param {boolean} isPlayerScore - 是否为玩家得分
 */
export function createScoreEffect(position, isPlayerScore = true) {
    if (!effectsEnabled || !scene) return null;

    // 创建闪光光柱
    const color = isPlayerScore ? 0x4444ff : 0xff4444;
    const beamGeometry = new THREE.CylinderGeometry(0.1, 0.5, 5, 16, 1, true);
    const beamMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });

    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.copy(position);
    beam.rotation.x = Math.PI / 2;
    scene.add(beam);

    // 创建光环
    const ringGeometry = new THREE.RingGeometry(0.3, 0.5, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(position);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // 创建特效对象
    const effect = {
        lifeTime: 0,
        maxLifeTime: 1.5, // 特效持续1.5秒

        // 更新特效
        update: function (deltaTime) {
            this.lifeTime += deltaTime;

            // 如果特效寿命结束，返回true
            if (this.lifeTime >= this.maxLifeTime) {
                return true;
            }

            // 计算特效进度（0-1）
            const progress = this.lifeTime / this.maxLifeTime;

            // 光柱动画
            beam.scale.y = 1 + progress * 2;
            beam.material.opacity = 0.7 * (1 - progress);

            // 光环动画
            ring.scale.set(1 + progress * 3, 1 + progress * 3, 1);
            ring.material.opacity = 0.7 * (1 - progress);

            return false; // 特效尚未完成
        },

        // 清理特效资源
        dispose: function () {
            scene.remove(beam);
            scene.remove(ring);

            beam.geometry.dispose();
            beam.material.dispose();
            ring.geometry.dispose();
            ring.material.dispose();
        }
    };

    activeEffects.push(effect);
    return effect;
}

/**
 * 创建球体轨迹特效
 * @param {THREE.Object3D} ball - 球对象
 * @param {THREE.Vector3} velocity - 球的速度
 * @returns {Object} 轨迹特效对象
 */
export function createTrailEffect(ball, velocity) {
    if (!effectsEnabled || !scene || !ball) return null;

    // 创建轨迹线
    const maxPoints = 50;
    const positions = new Float32Array(maxPoints * 3);

    // 初始化所有点为球的当前位置
    for (let i = 0; i < maxPoints; i++) {
        positions[i * 3] = ball.position.x;
        positions[i * 3 + 1] = ball.position.y;
        positions[i * 3 + 2] = ball.position.z;
    }

    // 创建几何体
    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // 确定轨迹颜色（基于速度）
    const speed = velocity ? velocity.length() : 1;
    const color = new THREE.Color().setHSL(0.6 - Math.min(speed / 10, 0.5), 1.0, 0.5);

    // 创建材质
    const trailMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
        linewidth: 1
    });

    // 创建线段
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    scene.add(trail);

    // 创建特效对象
    const effect = {
        ball: ball,
        maxPoints: maxPoints,
        positions: positions,
        lastPosition: ball.position.clone(),
        minDistance: 0.05, // 最小位置更新距离
        active: true,

        // 更新特效
        update: function (deltaTime) {
            if (!this.active || !this.ball) {
                return true; // 特效结束
            }

            // 计算与上一个点的距离
            const distance = this.ball.position.distanceTo(this.lastPosition);

            // 如果移动距离足够大，更新轨迹
            if (distance > this.minDistance) {
                // 移动所有点向后
                for (let i = this.maxPoints - 1; i > 0; i--) {
                    this.positions[i * 3] = this.positions[(i - 1) * 3];
                    this.positions[i * 3 + 1] = this.positions[(i - 1) * 3 + 1];
                    this.positions[i * 3 + 2] = this.positions[(i - 1) * 3 + 2];
                }

                // 设置第一个点为球的当前位置
                this.positions[0] = this.ball.position.x;
                this.positions[1] = this.ball.position.y;
                this.positions[2] = this.ball.position.z;

                // 更新几何体
                trail.geometry.attributes.position.needsUpdate = true;

                // 更新最后位置
                this.lastPosition.copy(this.ball.position);
            }

            // 轨迹效果永远活跃，除非显式停止
            return false;
        },

        // 停止特效
        stop: function () {
            this.active = false;
            return true;
        },

        // 清理特效资源
        dispose: function () {
            scene.remove(trail);
            trail.geometry.dispose();
            trail.material.dispose();
        }
    };

    activeEffects.push(effect);
    return effect;
}

/**
 * 清除所有特效
 */
export function clearAllEffects() {
    // 调用每个特效的dispose方法并清空数组
    activeEffects.forEach(effect => {
        if (effect.dispose) {
            effect.dispose();
        }
    });

    activeEffects.length = 0;
}

// 导出特效模块功能
export {
    initEffects,
    createHitEffect,
    createScoreEffect,
    createTrailEffect,
    updateEffects,
    setEffectsEnabled,
    clearAllEffects
}; 