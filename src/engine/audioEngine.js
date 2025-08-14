// Global namespace for the game
window.LP = window.LP || {};

// Audio engine implementation
export const initAudioEngine = () => {
    const audioEngine = {};

    // Audio settings
    let musicEnabled = true;

    // Sound effects mapping
    const sounds = {
        'music-game': { url: 'sounds/523725__mrthenoronha__8-bit-water-stage-loop.mp3', loop: true, volume: 0.5 },
        'start-game': { url: 'sounds/520937__mrthenoronha__8-bit-game-intro-loop.mp3', loop: true, volume: 0.5 },
        'game-over': { url: 'https://freesound.org/data/previews/362/362205_6629861-lq.mp3', loop: false, volume: 0.8 },
        'win': { url: 'https://freesound.org/data/previews/456/456966_9652915-lq.mp3', loop: false, volume: 0.8 },
        'extra-time': { url: 'https://freesound.org/data/previews/264/264828_5052308-lq.mp3', loop: false, volume: 0.8 },
        'hurry': { url: 'sounds/518304__mrthenoronha__hurry-up-8-bit.wav', loop: false, volume: 0.8 },
        'touched': { url: 'https://freesound.org/data/previews/331/331912_3248244-lq.mp3', loop: false, volume: 0.8 }
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
    }

    // Play a sound
    audioEngine.trigger = (soundName) => {
        if (!audioElements[soundName]) {
            console.warn(`Sound '${soundName}' not found`);
            return;
        }

        // Don't play music if it's disabled
        if (soundName.startsWith('music-') && !musicEnabled) {
            return;
        }

        const audio = audioElements[soundName];

        // If it's already playing, reset it
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }

        // Play the sound
        audio.play().catch(error => {
            console.warn(`Error playing sound '${soundName}':`, error);
        });
    };

    // Stop a sound
    audioEngine.stop = (soundName) => {
        if (!audioElements[soundName]) {
            console.warn(`Sound '${soundName}' not found`);
            return;
        }

        const audio = audioElements[soundName];
        audio.pause();
        audio.currentTime = 0;
    };

    // Enable/disable music
    audioEngine.setMusic = (enabled) => {
        musicEnabled = enabled;

        // Stop all music if disabled
        if (!enabled) {
            for (const [key, audio] of Object.entries(audioElements)) {
                if (key.startsWith('music-') && !audio.paused) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }
        } else {
            // Restart game music if it was playing
            audioEngine.trigger('music-game');
        }
    };

    // Store in the global namespace for access from other modules
    window.LP.audioEngine = audioEngine;

    console.log("audio engine initialized");

    return audioEngine;
};