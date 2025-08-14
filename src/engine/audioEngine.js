// Global namespace for the game
window.LP = window.LP || {};

// Audio engine implementation
export const initAudioEngine = () => {
    const audioEngine = {};

    // Audio settings
    let musicEnabled = true;
    let currentMusic = null;

    // Sound effects mapping
    const sounds = {
        'music-game': { url: 'sounds/523725__mrthenoronha__8-bit-water-stage-loop.mp3', loop: true, volume: 0.5, category: 'music' },
        'start-game': { url: 'sounds/520937__mrthenoronha__8-bit-game-intro-loop.mp3', loop: true, volume: 0.5, category: 'music' },
        'game-over': { url: 'https://freesound.org/data/previews/362/362205_6629861-lq.mp3', loop: false, volume: 0.8, category: 'sfx' },
        'win': { url: 'https://freesound.org/data/previews/456/456966_9652915-lq.mp3', loop: false, volume: 0.8, category: 'sfx' },
        'extra-time': { url: 'https://freesound.org/data/previews/264/264828_5052308-lq.mp3', loop: false, volume: 0.8, category: 'sfx' },
        'hurry': { url: 'sounds/518304__mrthenoronha__hurry-up-8-bit.wav', loop: false, volume: 0.8, category: 'sfx' },
        'touched': { url: 'https://freesound.org/data/previews/331/331912_3248244-lq.mp3', loop: false, volume: 0.8, category: 'sfx' }
    };

    // Audio elements cache
    const audioElements = {};

    // Initialize audio elements
    for (const [key, sound] of Object.entries(sounds)) {
        const audio = new Audio();
        audio.src = sound.url;
        audio.loop = sound.loop;
        audio.volume = sound.volume;
        audioElements[key] = audio;
        
        // Manejar errores de carga
        audio.onerror = (e) => {
            console.warn(`Error loading sound '${key}':`, e);
        };
        
        // Precargar sonidos
        audio.load();
    }

    // Play a sound
    audioEngine.trigger = (soundName) => {
        if (!audioElements[soundName]) {
            console.warn(`Sound '${soundName}' not found`);
            return;
        }

        const sound = sounds[soundName];
        const audio = audioElements[soundName];

        // Don't play music if it's disabled
        if (sound.category === 'music' && !musicEnabled) {
            return;
        }

        // Si es música, detener la música actual primero
        if (sound.category === 'music') {
            if (currentMusic && currentMusic !== soundName) {
                audioEngine.stop(currentMusic);
            }
            currentMusic = soundName;
        }

        // Si ya está reproduciendo, reiniciar solo para efectos de sonido
        if (!audio.paused && sound.category !== 'music') {
            audio.currentTime = 0;
        } else if (audio.paused) {
            // Reproducir el sonido
            audio.play().catch(error => {
                console.warn(`Error playing sound '${soundName}':`, error);
            });
        }
    };

    // Stop a sound
    audioEngine.stop = (soundName) => {
        if (!audioElements[soundName]) {
            console.warn(`Sound '${soundName}' not found`);
            return;
        }

        const audio = audioElements[soundName];
        
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
        
        // Si era la música actual, limpiar la referencia
        if (currentMusic === soundName) {
            currentMusic = null;
        }
    };

    // Stop all sounds
    audioEngine.stopAll = () => {
        for (const [key, audio] of Object.entries(audioElements)) {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        }
        currentMusic = null;
    };

    // Enable/disable music
    audioEngine.setMusic = (enabled) => {
        musicEnabled = enabled;

        // Stop all music if disabled
        if (!enabled) {
            for (const [key, sound] of Object.entries(sounds)) {
                if (sound.category === 'music') {
                    audioEngine.stop(key);
                }
            }
            currentMusic = null;
        } else if (currentMusic) {
            // Restart current music if it was playing
            audioEngine.trigger(currentMusic);
        }
    };

    // Get music state
    audioEngine.isMusicEnabled = () => {
        return musicEnabled;
    };

    // Get current music
    audioEngine.getCurrentMusic = () => {
        return currentMusic;
    };

    // Store in the global namespace for access from other modules
    window.LP.audioEngine = audioEngine;

    console.log("audio engine initialized");

    return audioEngine;
};