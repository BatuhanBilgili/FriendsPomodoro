// Focus Timer Server - Express + Socket.io
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import roomManager from './roomManager.js';
import timerEngine from './timerEngine.js';

const app = express();
const server = createServer(app);

// Configure CORS for development
const io = new Server(server, {
	cors: {
		origin: ['http://localhost:5173', 'http://localhost:3000'],
		methods: ['GET', 'POST'],
		credentials: true
	}
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({ status: 'ok', rooms: roomManager.getAllRoomIds().length });
});

// Initialize timer engine with Socket.io
timerEngine.init(io);

// Socket.io connection handling
io.on('connection', (socket) => {
	console.log(`Client connected: ${socket.id}`);

	let currentRoom = null;

	// Join a room
	socket.on('join-room', ({ roomId, userId, userName }) => {
		console.log(`${userName} (${userId}) joining room: ${roomId}`);

		// Leave previous room if any
		if (currentRoom) {
			socket.leave(currentRoom);
			const updatedRoom = roomManager.removeUser(currentRoom, socket.id);
			if (updatedRoom) {
				io.to(currentRoom).emit('user-left', {
					socketId: socket.id,
					roomState: roomManager.getRoomState(currentRoom)
				});
			} else {
				io.to(currentRoom).emit('room-closed');
			}
		}

		// Join new room
		currentRoom = roomId;
		socket.join(roomId);
		roomManager.addUser(roomId, socket.id, userId, userName);

		// Send full room state to the joining client
		const roomState = roomManager.getRoomState(roomId);
		socket.emit('room-state', roomState);

		// Notify others in the room
		socket.to(roomId).emit('user-joined', {
			user: roomState.users.find(u => u.socketId === socket.id),
			roomState
		});
	});

	// Update user name
	socket.on('update-name', ({ userName }) => {
		if (!currentRoom) return;

		roomManager.updateUserName(currentRoom, socket.id, userName);
		const roomState = roomManager.getRoomState(currentRoom);
		io.to(currentRoom).emit('room-state', roomState);
	});

	// Start work timer
	socket.on('start-work', ({ duration }) => {
		if (!currentRoom) return;

		console.log(`Starting work timer: ${duration}s in room ${currentRoom}`);
		roomManager.startWork(currentRoom, duration);
		const roomState = roomManager.getRoomState(currentRoom);
		io.to(currentRoom).emit('room-state', roomState);
	});

	// Start break timer
	socket.on('start-break', ({ duration }) => {
		if (!currentRoom) return;

		console.log(`Starting break timer: ${duration}s in room ${currentRoom}`);
		roomManager.startBreak(currentRoom, duration);
		const roomState = roomManager.getRoomState(currentRoom);
		io.to(currentRoom).emit('room-state', roomState);
	});

	// Pause timer
	socket.on('pause', () => {
		if (!currentRoom) return;

		console.log(`Pausing timer in room ${currentRoom}`);
		roomManager.pauseTimer(currentRoom);
		const roomState = roomManager.getRoomState(currentRoom);
		io.to(currentRoom).emit('room-state', roomState);
	});

	// Resume timer
	socket.on('resume', () => {
		if (!currentRoom) return;

		console.log(`Resuming timer in room ${currentRoom}`);
		roomManager.resumeTimer(currentRoom);
		const roomState = roomManager.getRoomState(currentRoom);
		io.to(currentRoom).emit('room-state', roomState);
	});

	// Reset timer
	socket.on('reset', () => {
		if (!currentRoom) return;

		console.log(`Resetting timer in room ${currentRoom}`);
		roomManager.resetTimer(currentRoom);
		const roomState = roomManager.getRoomState(currentRoom);
		io.to(currentRoom).emit('room-state', roomState);
	});

	// Stop timer
	socket.on('stop', () => {
		if (!currentRoom) return;

		console.log(`Stopping timer in room ${currentRoom}`);
		roomManager.stopTimer(currentRoom);
		const roomState = roomManager.getRoomState(currentRoom);
		io.to(currentRoom).emit('room-state', roomState);
	});

	// Go to idle (return to time selection)
	socket.on('go-to-idle', () => {
		if (!currentRoom) return;

		console.log(`Going to idle in room ${currentRoom}`);
		roomManager.goToIdle(currentRoom);
		const roomState = roomManager.getRoomState(currentRoom);
		io.to(currentRoom).emit('room-state', roomState);
	});

	// Skip break (go back to work time selection)
	socket.on('skip-break', () => {
		if (!currentRoom) return;

		console.log(`Skipping break in room ${currentRoom}`);
		roomManager.goToIdle(currentRoom);
		const roomState = roomManager.getRoomState(currentRoom);
		io.to(currentRoom).emit('room-state', roomState);
	});

	// Handle disconnection
	socket.on('disconnect', () => {
		console.log(`Client disconnected: ${socket.id}`);

		if (currentRoom) {
			const updatedRoom = roomManager.removeUser(currentRoom, socket.id);

			if (updatedRoom) {
				const roomState = roomManager.getRoomState(currentRoom);
				io.to(currentRoom).emit('user-left', {
					socketId: socket.id,
					roomState
				});
			} else {
				// Room was deleted (last user left)
				console.log(`Room ${currentRoom} closed - last user left`);
			}
		}
	});
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
	console.log(`🚀 Focus Timer server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received, shutting down...');
	timerEngine.stopTicking();
	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});
