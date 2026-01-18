// Room Manager - In-memory state management for study rooms
// No database - all state is cleared when server restarts or room empties

class RoomManager {
	constructor() {
		this.rooms = new Map();
	}

	// Create or get a room
	getRoom(roomId) {
		if (!this.rooms.has(roomId)) {
			this.rooms.set(roomId, this.createRoom(roomId));
		}
		return this.rooms.get(roomId);
	}

	// Create a fresh room state
	createRoom(roomId) {
		return {
			roomId,
			state: 'idle', // idle, working, paused, break, break-paused, stopped
			timerType: null, // 'work' or 'break'
			timerDuration: 0, // Total duration in seconds
			timerRemaining: 0, // Remaining seconds
			lastTickAt: null, // Server timestamp of last tick
			workSessions: [], // Array of { startedAt, duration }
			currentSessionStart: null, // When current work session started
			users: new Map() // socketId -> UserData
		};
	}

	// Add user to room
	addUser(roomId, socketId, userId, userName) {
		const room = this.getRoom(roomId);
		const now = Date.now();

		room.users.set(socketId, {
			socketId,
			userId,
			userName,
			joinedAt: now,
			workTime: 0, // Personal work time in seconds
			breakTime: 0, // Personal break time in seconds
			isActive: true
		});

		return room;
	}

	// Remove user from room
	removeUser(roomId, socketId) {
		const room = this.rooms.get(roomId);
		if (!room) return null;

		room.users.delete(socketId);

		// If room is empty, delete it completely
		if (room.users.size === 0) {
			this.rooms.delete(roomId);
			return null;
		}

		return room;
	}

	// Update user name
	updateUserName(roomId, socketId, newName) {
		const room = this.rooms.get(roomId);
		if (!room) return null;

		const user = room.users.get(socketId);
		if (user) {
			user.userName = newName;
		}

		return room;
	}

	// Start work timer
	startWork(roomId, duration) {
		const room = this.rooms.get(roomId);
		if (!room) return null;

		room.state = 'working';
		room.timerType = 'work';
		room.timerDuration = duration;
		room.timerRemaining = duration;
		room.lastTickAt = Date.now();
		room.currentSessionStart = Date.now();

		return room;
	}

	// Start break timer
	startBreak(roomId, duration) {
		const room = this.rooms.get(roomId);
		if (!room) return null;

		room.state = 'break';
		room.timerType = 'break';
		room.timerDuration = duration;
		room.timerRemaining = duration;
		room.lastTickAt = Date.now();

		console.log(`[START BREAK] Room: ${roomId}, timerType: ${room.timerType}, state: ${room.state}`);

		return room;
	}

	// Pause timer
	pauseTimer(roomId) {
		const room = this.rooms.get(roomId);
		if (!room) return null;

		if (room.state === 'working') {
			room.state = 'paused';
		} else if (room.state === 'break') {
			room.state = 'break-paused';
		}

		return room;
	}

	// Resume timer
	resumeTimer(roomId) {
		const room = this.rooms.get(roomId);
		if (!room) return null;

		if (room.state === 'paused') {
			room.state = 'working';
			room.lastTickAt = Date.now();
		} else if (room.state === 'break-paused') {
			room.state = 'break';
			room.lastTickAt = Date.now();
		}

		return room;
	}

	// Reset timer (restart to original duration)
	resetTimer(roomId) {
		const room = this.rooms.get(roomId);
		if (!room) return null;

		// Only reset if there's a timer running or paused
		if (room.timerDuration > 0) {
			// Restart timer to original duration
			room.timerRemaining = room.timerDuration;
			room.lastTickAt = Date.now();

			// Resume if it was paused
			if (room.state === 'paused') {
				room.state = 'working';
			} else if (room.state === 'break-paused') {
				room.state = 'break';
			}

			// Reset session start for work timer
			if (room.timerType === 'work') {
				room.currentSessionStart = Date.now();
			}
		} else {
			// If no timer was set, go to idle
			room.state = 'idle';
			room.timerType = null;
			room.timerDuration = 0;
			room.timerRemaining = 0;
			room.lastTickAt = null;
			room.currentSessionStart = null;
		}

		return room;
	}

	// Go to idle (return to time selection)
	goToIdle(roomId) {
		const room = this.rooms.get(roomId);
		if (!room) return null;

		room.state = 'idle';
		room.timerType = null;
		room.timerDuration = 0;
		room.timerRemaining = 0;
		room.lastTickAt = null;
		room.currentSessionStart = null;

		return room;
	}

	// Stop timer (show work sessions summary)
	stopTimer(roomId) {
		const room = this.rooms.get(roomId);
		if (!room) return null;

		// Save current work session if there was one
		if (room.currentSessionStart && room.timerType === 'work') {
			const sessionDuration = Math.floor((Date.now() - room.currentSessionStart) / 1000);
			room.workSessions.push({
				startedAt: room.currentSessionStart,
				duration: sessionDuration
			});
		}

		room.state = 'stopped';
		room.timerRemaining = 0;
		room.lastTickAt = null;
		room.currentSessionStart = null;

		return room;
	}

	// Tick the timer (called every second by timer engine)
	tick(roomId) {
		const room = this.rooms.get(roomId);
		if (!room) return null;

		const now = Date.now();
		const isActive = room.state === 'working' || room.state === 'break';

		if (!isActive) return room;

		// Calculate elapsed time since last tick
		const elapsed = Math.floor((now - room.lastTickAt) / 1000);

		if (elapsed >= 1) {
			room.timerRemaining = Math.max(0, room.timerRemaining - elapsed);
			room.lastTickAt = now;

			// Update user stats
			room.users.forEach(user => {
				if (room.timerType === 'work') {
					user.workTime += elapsed;
				} else if (room.timerType === 'break') {
					user.breakTime += elapsed;
				}
			});

			// Check if timer completed
			if (room.timerRemaining <= 0) {
				if (room.timerType === 'work') {
					// Save the completed work session
					if (room.currentSessionStart) {
						room.workSessions.push({
							startedAt: room.currentSessionStart,
							duration: room.timerDuration
						});
					}
					room.state = 'stopped';
				} else {
					room.state = 'idle';
				}
				room.currentSessionStart = null;
			}
		}

		return room;
	}

	// Get room state for client
	getRoomState(roomId) {
		const room = this.rooms.get(roomId);
		if (!room) return null;

		// Convert users Map to array for JSON serialization
		const users = Array.from(room.users.values());

		// Calculate room stats
		const totalWorkTime = users.reduce((sum, u) => sum + u.workTime, 0);
		const totalBreakTime = users.reduce((sum, u) => sum + u.breakTime, 0);
		const avgWorkTime = users.length > 0 ? Math.floor(totalWorkTime / users.length) : 0;

		return {
			roomId: room.roomId,
			state: room.state,
			timerType: room.timerType,
			timerDuration: room.timerDuration,
			timerRemaining: room.timerRemaining,
			workSessions: room.workSessions,
			users,
			stats: {
				userCount: users.length,
				totalWorkTime,
				totalBreakTime,
				avgWorkTime
			}
		};
	}

	// Check if room exists
	hasRoom(roomId) {
		return this.rooms.has(roomId);
	}

	// Get all room IDs (for debugging)
	getAllRoomIds() {
		return Array.from(this.rooms.keys());
	}
}

export default new RoomManager();
