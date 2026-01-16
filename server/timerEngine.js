// Timer Engine - Server-authoritative timer with 1-second ticks
import roomManager from './roomManager.js';

class TimerEngine {
	constructor() {
		this.tickInterval = null;
		this.io = null;
	}

	// Initialize with Socket.io instance
	init(io) {
		this.io = io;
		this.startTicking();
	}

	// Start the global tick interval
	startTicking() {
		if (this.tickInterval) return;

		this.tickInterval = setInterval(() => {
			this.tick();
		}, 1000);
	}

	// Stop ticking (for cleanup)
	stopTicking() {
		if (this.tickInterval) {
			clearInterval(this.tickInterval);
			this.tickInterval = null;
		}
	}

	// Tick all active rooms
	tick() {
		const roomIds = roomManager.getAllRoomIds();

		for (const roomId of roomIds) {
			const room = roomManager.tick(roomId);

			if (room) {
				const state = roomManager.getRoomState(roomId);

				// Emit timer update to all clients in the room
				this.io.to(roomId).emit('timer-tick', {
					timerRemaining: state.timerRemaining,
					state: state.state,
					timerType: state.timerType,
					users: state.users,
					stats: state.stats
				});

				// If timer just completed, emit completion event
				if (state.timerRemaining === 0 && (state.state === 'stopped' || state.state === 'idle')) {
					this.io.to(roomId).emit('timer-complete', {
						type: state.timerType,
						state: state.state,
						workSessions: state.workSessions
					});
				}
			}
		}
	}
}

export default new TimerEngine();
