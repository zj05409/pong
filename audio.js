// 音频系统模块 - 管理游戏音效和背景音乐

// 音频对象
let audioContext = null;
let masterGainNode = null;
let musicGainNode = null;
let sfxGainNode = null;

// 音频设置
let soundEnabled = true;
let musicEnabled = true;
let sfxEnabled = true;
let musicVolume = 0.5;
let sfxVolume = 0.7;

// 音频缓存
const audioBuffers = {};
const activeSounds = {};

// 背景音乐
let currentMusic = null;
let musicSource = null;

/**
 * 初始化音频系统
 */
export function initAudio() {
    // 如果浏览器不支持Web Audio API，返回空对象
    if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
        console.warn('此浏览器不支持Web Audio API');
        return {
            loadSound: () => Promise.resolve(null),
            playSound: () => null,
            stopSound: () => { },
            playMusic: () => null,
            stopMusic: () => { },
            setSoundEnabled: () => { },
            setMusicEnabled: () => { },
            setSfxEnabled: () => { },
            setMusicVolume: () => { },
            setSfxVolume: () => { }
        };
    }

    try {
        // 创建音频上下文
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContextClass();

        // 创建主音量控制
        masterGainNode = audioContext.createGain();
        masterGainNode.gain.value = soundEnabled ? 1.0 : 0.0;
        masterGainNode.connect(audioContext.destination);

        // 创建音乐音量控制
        musicGainNode = audioContext.createGain();
        musicGainNode.gain.value = musicEnabled ? musicVolume : 0.0;
        musicGainNode.connect(masterGainNode);

        // 创建音效音量控制
        sfxGainNode = audioContext.createGain();
        sfxGainNode.gain.value = sfxEnabled ? sfxVolume : 0.0;
        sfxGainNode.connect(masterGainNode);

        console.log('音频系统初始化成功');

        // 预加载常用音效
        preloadCommonSounds();

    } catch (error) {
        console.error('音频系统初始化失败:', error);
        return {
            loadSound: () => Promise.resolve(null),
            playSound: () => null,
            stopSound: () => { },
            playMusic: () => null,
            stopMusic: () => { },
            setSoundEnabled: () => { },
            setMusicEnabled: () => { },
            setSfxEnabled: () => { },
            setMusicVolume: () => { },
            setSfxVolume: () => { }
        };
    }

    return {
        loadSound,
        playSound,
        stopSound,
        playMusic,
        stopMusic,
        setSoundEnabled,
        setMusicEnabled,
        setSfxEnabled,
        setMusicVolume,
        setSfxVolume
    };
}

/**
 * 预加载常用音效
 */
function preloadCommonSounds() {
    // 加载常用的音效
    const commonSounds = [
        { name: 'hit', url: 'sounds/hit.mp3' },
        { name: 'score', url: 'sounds/score.mp3' },
        { name: 'bounce', url: 'sounds/bounce.mp3' },
        { name: 'win', url: 'sounds/win.mp3' },
        { name: 'lose', url: 'sounds/lose.mp3' },
        { name: 'bgm', url: 'sounds/bgm.mp3' }
    ];

    commonSounds.forEach(sound => {
        loadSound(sound.name, sound.url)
            .then(() => console.log(`预加载音效: ${sound.name}`))
            .catch(error => console.warn(`预加载音效失败: ${sound.name}`, error));
    });
}

/**
 * 加载音频文件
 * @param {string} name - 音频名称（用于引用）
 * @param {string} url - 音频文件URL
 * @returns {Promise} 加载完成的Promise
 */
export function loadSound(name, url) {
    if (!audioContext) return Promise.resolve(null);

    // 如果已经加载过，直接返回
    if (audioBuffers[name]) {
        return Promise.resolve(audioBuffers[name]);
    }

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.arrayBuffer();
        })
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            audioBuffers[name] = audioBuffer;
            return audioBuffer;
        })
        .catch(error => {
            console.error(`加载音效失败: ${name}`, error);
            return null;
        });
}

/**
 * 播放音效
 * @param {string} name - 音效名称
 * @param {Object} options - 播放选项
 * @param {number} options.volume - 音量 (0.0 - 1.0)
 * @param {number} options.pitch - 音调 (0.5 - 2.0)
 * @param {boolean} options.loop - 是否循环播放
 * @returns {Object|null} 音效控制对象
 */
export function playSound(name, options = {}) {
    if (!audioContext || !sfxEnabled || !soundEnabled) return null;

    // 如果音频上下文被暂停（由于浏览器策略），尝试恢复
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const buffer = audioBuffers[name];
    if (!buffer) {
        console.warn(`找不到音效: ${name}`);
        return null;
    }

    // 创建音源
    const source = audioContext.createBufferSource();
    source.buffer = buffer;

    // 设置循环
    if (options.loop) {
        source.loop = true;
    }

    // 设置音调
    if (options.pitch) {
        source.playbackRate.value = Math.max(0.5, Math.min(2.0, options.pitch));
    }

    // 创建特定音效的增益节点
    const gainNode = audioContext.createGain();
    const volume = typeof options.volume === 'number' ? options.volume : 1.0;
    gainNode.gain.value = volume;

    // 连接节点
    source.connect(gainNode);
    gainNode.connect(sfxGainNode);

    // 开始播放
    source.start(0);

    // 创建音效控制对象
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const soundControl = {
        id: id,
        source: source,
        gainNode: gainNode,
        name: name,

        // 停止播放
        stop: function () {
            try {
                if (source) {
                    source.stop(0);
                    delete activeSounds[id];
                }
            } catch (e) {
                console.warn('停止音效时出错:', e);
            }
        },

        // 设置音量
        setVolume: function (value) {
            try {
                gainNode.gain.value = value;
            } catch (e) {
                console.warn('设置音量时出错:', e);
            }
        }
    };

    // 添加到活动音效列表
    activeSounds[id] = soundControl;

    // 设置音效结束时自动清理
    if (!options.loop) {
        source.onended = () => {
            delete activeSounds[id];
        };
    }

    return soundControl;
}

/**
 * 停止指定音效
 * @param {string|Object} sound - 音效名称或音效控制对象
 */
export function stopSound(sound) {
    if (!sound) return;

    // 如果是音效控制对象
    if (typeof sound === 'object' && sound.stop) {
        sound.stop();
        return;
    }

    // 如果是音效名称，停止所有该名称的音效
    if (typeof sound === 'string') {
        const name = sound;
        Object.values(activeSounds).forEach(soundControl => {
            if (soundControl.name === name) {
                soundControl.stop();
            }
        });
    }
}

/**
 * 播放背景音乐
 * @param {string} name - 音乐名称
 * @param {Object} options - 播放选项
 * @param {number} options.volume - 音量 (0.0 - 1.0)
 * @param {boolean} options.loop - 是否循环播放
 * @param {number} options.fadeIn - 淡入时间（秒）
 * @returns {Object|null} 音乐控制对象
 */
export function playMusic(name, options = {}) {
    if (!audioContext || !musicEnabled || !soundEnabled) return null;

    // 如果当前正在播放音乐，先停止
    stopMusic({ fadeOut: options.fadeIn });

    // 如果音频上下文被暂停（由于浏览器策略），尝试恢复
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const buffer = audioBuffers[name];
    if (!buffer) {
        console.warn(`找不到音乐: ${name}`);
        return null;
    }

    // 创建音源
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop !== false; // 默认循环播放

    // 创建特定音乐的增益节点
    const gainNode = audioContext.createGain();
    const volume = typeof options.volume === 'number' ? options.volume : 1.0;

    // 设置淡入效果
    if (options.fadeIn > 0) {
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + options.fadeIn);
    } else {
        gainNode.gain.value = volume;
    }

    // 连接节点
    source.connect(gainNode);
    gainNode.connect(musicGainNode);

    // 开始播放
    source.start(0);

    // 保存当前音乐信息
    currentMusic = name;
    musicSource = {
        source: source,
        gainNode: gainNode,

        // 停止播放
        stop: function (fadeOutTime = 0) {
            try {
                if (source) {
                    if (fadeOutTime > 0) {
                        const now = audioContext.currentTime;
                        gainNode.gain.linearRampToValueAtTime(0, now + fadeOutTime);

                        // 设置定时器，在淡出后停止播放
                        setTimeout(() => {
                            source.stop(0);
                            currentMusic = null;
                            musicSource = null;
                        }, fadeOutTime * 1000);
                    } else {
                        source.stop(0);
                        currentMusic = null;
                        musicSource = null;
                    }
                }
            } catch (e) {
                console.warn('停止音乐时出错:', e);
            }
        },

        // 设置音量
        setVolume: function (value, fadeTime = 0) {
            try {
                if (fadeTime > 0) {
                    const now = audioContext.currentTime;
                    gainNode.gain.linearRampToValueAtTime(value, now + fadeTime);
                } else {
                    gainNode.gain.value = value;
                }
            } catch (e) {
                console.warn('设置音乐音量时出错:', e);
            }
        }
    };

    return musicSource;
}

/**
 * 停止背景音乐
 * @param {Object} options - 停止选项
 * @param {number} options.fadeOut - 淡出时间（秒）
 */
export function stopMusic(options = {}) {
    if (!musicSource) return;

    const fadeOut = options.fadeOut || 0;
    musicSource.stop(fadeOut);
}

/**
 * 设置是否启用声音（总开关）
 * @param {boolean} enabled - 是否启用
 */
export function setSoundEnabled(enabled) {
    soundEnabled = enabled;

    if (masterGainNode) {
        masterGainNode.gain.value = enabled ? 1.0 : 0.0;
    }
}

/**
 * 设置是否启用背景音乐
 * @param {boolean} enabled - 是否启用
 */
export function setMusicEnabled(enabled) {
    musicEnabled = enabled;

    if (musicGainNode) {
        musicGainNode.gain.value = enabled ? musicVolume : 0.0;
    }
}

/**
 * 设置是否启用音效
 * @param {boolean} enabled - 是否启用
 */
export function setSfxEnabled(enabled) {
    sfxEnabled = enabled;

    if (sfxGainNode) {
        sfxGainNode.gain.value = enabled ? sfxVolume : 0.0;
    }
}

/**
 * 设置背景音乐音量
 * @param {number} volume - 音量 (0.0 - 1.0)
 */
export function setMusicVolume(volume) {
    musicVolume = Math.max(0, Math.min(1, volume));

    if (musicGainNode && musicEnabled) {
        musicGainNode.gain.value = musicVolume;
    }
}

/**
 * 设置音效音量
 * @param {number} volume - 音量 (0.0 - 1.0)
 */
export function setSfxVolume(volume) {
    sfxVolume = Math.max(0, Math.min(1, volume));

    if (sfxGainNode && sfxEnabled) {
        sfxGainNode.gain.value = sfxVolume;
    }
}

// 导出音频模块功能
export {
    initAudio,
    loadSound,
    playSound,
    stopSound,
    playMusic,
    stopMusic,
    setSoundEnabled,
    setMusicEnabled,
    setSfxEnabled,
    setMusicVolume,
    setSfxVolume
}; 