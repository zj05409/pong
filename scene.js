// scene.js - 3D场景、相机和渲染相关功能

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CAMERA, COLORS } from './config.js';

// 场景对象
let scene, camera, renderer, controls;
let ambientLight, directionalLight, pointLight;
let table, tableGeometry, tableMaterial;
let backgroundMesh;

// 初始化场景
export function initScene(container) {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.ENVIRONMENT);

    // 添加环境光和方向光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 5);
    directionalLight.castShadow = true;

    // 配置阴影
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;

    scene.add(directionalLight);

    // 创建相机
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera = new THREE.PerspectiveCamera(
        CAMERA.FOV,
        width / height,
        CAMERA.NEAR,
        CAMERA.FAR
    );

    // 设置相机初始位置
    camera.position.set(
        CAMERA.PLAYER_VIEW.x,
        CAMERA.PLAYER_VIEW.y,
        CAMERA.PLAYER_VIEW.z
    );
    camera.lookAt(0, 0, 0);

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 创建相机控制器
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;

    // 设置控制范围限制
    controls.minDistance = 1;
    controls.maxDistance = 10;

    // 响应窗口大小变化
    window.addEventListener('resize', onWindowResize);

    // 添加环境
    addEnvironment();

    return {
        scene,
        camera,
        renderer,
        controls
    };
}

// 创建环境
function addEnvironment() {
    // 创建地板
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    // 可以添加其他环境元素，如墙壁、天花板等
}

// 处理窗口大小变化
function onWindowResize() {
    const container = renderer.domElement.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// 设置相机位置
export function setCameraPosition(position) {
    camera.position.copy(position);
    camera.lookAt(0, 0, 0);
}

// 设置为玩家视角
export function setPlayerView() {
    setCameraPosition(new THREE.Vector3(
        CAMERA.PLAYER_VIEW.x,
        CAMERA.PLAYER_VIEW.y,
        CAMERA.PLAYER_VIEW.z
    ));
    controls.enabled = false;
}

// 设置为俯视图
export function setTopView() {
    setCameraPosition(new THREE.Vector3(
        CAMERA.TOP_VIEW.x,
        CAMERA.TOP_VIEW.y,
        CAMERA.TOP_VIEW.z
    ));
    controls.enabled = true;
}

// 渲染场景
export function render() {
    if (controls) controls.update();
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// 添加物体到场景
export function addToScene(object) {
    scene.add(object);
}

// 从场景中移除物体
export function removeFromScene(object) {
    scene.remove(object);
}

// 获取场景
export function getScene() {
    return scene;
}

// 获取相机
export function getCamera() {
    return camera;
}

// 获取渲染器
export function getRenderer() {
    return renderer;
}

// 清理资源
export function disposeScene() {
    window.removeEventListener('resize', onWindowResize);

    if (renderer) {
        renderer.dispose();
        if (renderer.domElement) {
            renderer.domElement.remove();
        }
    }

    // 释放场景中的几何体和材质
    if (scene) {
        scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}

// 添加光源
function addLights() {
    // 环境光
    ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // 平行光（主光源）
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    // 点光源（增加细节）
    pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(0, 2, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);
}

// 创建乒乓球桌
function createTable() {
    // 桌面
    tableGeometry = new THREE.BoxGeometry(2.74, 0.05, 1.525); // 标准乒乓球桌尺寸
    tableMaterial = new THREE.MeshStandardMaterial({ color: 0x1b5e20 }); // 深绿色
    table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.receiveShadow = true;
    scene.add(table);

    // 桌子边框
    const edgeWidth = 0.05;
    const edgeHeight = 0.1;

    // 长边 (两侧)
    const longEdgeGeometry = new THREE.BoxGeometry(2.74 + 2 * edgeWidth, edgeHeight, edgeWidth);
    const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x8d6e63 }); // 木质颜色

    const longEdge1 = new THREE.Mesh(longEdgeGeometry, edgeMaterial);
    longEdge1.position.set(0, edgeHeight / 2, (1.525 + edgeWidth) / 2);
    longEdge1.castShadow = true;
    scene.add(longEdge1);

    const longEdge2 = new THREE.Mesh(longEdgeGeometry, edgeMaterial);
    longEdge2.position.set(0, edgeHeight / 2, -(1.525 + edgeWidth) / 2);
    longEdge2.castShadow = true;
    scene.add(longEdge2);

    // 短边 (两端)
    const shortEdgeGeometry = new THREE.BoxGeometry(edgeWidth, edgeHeight, 1.525);

    const shortEdge1 = new THREE.Mesh(shortEdgeGeometry, edgeMaterial);
    shortEdge1.position.set((2.74 + edgeWidth) / 2, edgeHeight / 2, 0);
    shortEdge1.castShadow = true;
    scene.add(shortEdge1);

    const shortEdge2 = new THREE.Mesh(shortEdgeGeometry, edgeMaterial);
    shortEdge2.position.set(-(2.74 + edgeWidth) / 2, edgeHeight / 2, 0);
    shortEdge2.castShadow = true;
    scene.add(shortEdge2);

    // 添加球网
    const netWidth = 1.525;
    const netHeight = 0.1525; // 高度15.25厘米

    const netGeometry = new THREE.PlaneGeometry(netWidth, netHeight);
    const netMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });

    const net = new THREE.Mesh(netGeometry, netMaterial);
    net.rotation.y = Math.PI / 2; // 旋转90度
    net.position.set(0, 0.05 + netHeight / 2, 0); // 放置在桌面中央
    net.castShadow = true;
    scene.add(net);

    // 中心线
    const centerLineGeometry = new THREE.PlaneGeometry(0.01, 1.525);
    const centerLineMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
    });

    const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
    centerLine.rotation.x = -Math.PI / 2; // 旋转使其水平放置
    centerLine.position.set(0, 0.051, 0); // 略高于桌面
    scene.add(centerLine);
}

// 创建环境装饰
function createEnvironment() {
    // 创建房间地板
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    scene.add(floor);

    // 创建墙壁
    const wallGeometry = new THREE.PlaneGeometry(20, 10);
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xf0f0f0,
        roughness: 0.7
    });

    // 后墙
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, 4, -10);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // 侧墙
    const sideWall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    sideWall1.position.set(-10, 4, 0);
    sideWall1.rotation.y = Math.PI / 2;
    sideWall1.receiveShadow = true;
    scene.add(sideWall1);

    const sideWall2 = new THREE.Mesh(wallGeometry, wallMaterial);
    sideWall2.position.set(10, 4, 0);
    sideWall2.rotation.y = -Math.PI / 2;
    sideWall2.receiveShadow = true;
    scene.add(sideWall2);

    // 天花板
    const ceilingGeometry = new THREE.PlaneGeometry(20, 20);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        color: 0xe0e0e0
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 9;
    scene.add(ceiling);

    // 添加窗户
    const windowGeometry = new THREE.PlaneGeometry(3, 2);
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x87ceeb,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });

    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-9.99, 4, -3);
    window1.rotation.y = Math.PI / 2;
    scene.add(window1);

    const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(-9.99, 4, 3);
    window2.rotation.y = Math.PI / 2;
    scene.add(window2);
}

// 通过ID获取对象
function getObjectById(id) {
    return scene ? scene.getObjectById(id) : null;
}

// 清除场景
function clearScene() {
    if (scene) {
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
    }
}

// 导出场景模块的功能
export {
    initScene,
    render,
    getObjectById,
    clearScene,
    scene,
    camera,
    renderer
}; 