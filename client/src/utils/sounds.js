// Sound utility for timer notifications

// Sound file paths
const SOUNDS = {
	stop: '/sounds/notification-error-427345.mp3',      // Bitir
	reset: '/sounds/new-notification-014-363678.mp3',   // Sıfırla
	pause: '/sounds/new-notification-09-352705.mp3',    // Durdur
	complete: '/sounds/bell-notification-337658.mp3'    // Sayaç bitti
};

// Cache for audio objects
const audioCache = {};

// Preload sounds for faster playback
export const preloadSounds = () => {
	Object.entries(SOUNDS).forEach(([key, path]) => {
		const audio = new Audio(path);
		audio.preload = 'auto';
		audioCache[key] = audio;
	});
};

// Play a specific sound
export const playSound = (soundName) => {
	try {
		const path = SOUNDS[soundName];
		if (!path) {
			console.warn(`Sound not found: ${soundName}`);
			return;
		}

		// Create new audio instance each time to allow overlapping sounds
		const audio = new Audio(path);
		audio.volume = 0.7;
		audio.play().catch(err => {
			console.warn('Could not play sound:', err);
		});
	} catch (error) {
		console.error('Error playing sound:', error);
	}
};

// Convenience functions for each sound
export const playSoundStop = () => playSound('stop');
export const playSoundReset = () => playSound('reset');
export const playSoundPause = () => playSound('pause');
export const playSoundComplete = () => playSound('complete');

export default {
	playSound,
	playSoundStop,
	playSoundReset,
	playSoundPause,
	playSoundComplete,
	preloadSounds
};
