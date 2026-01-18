import { useState, useEffect, useCallback } from 'react';
import { getSocket, connectSocket } from '../utils/socket';
import { getUserId, getUserName, setUserName as saveUserName } from '../utils/cookies';

export const useRoom = (roomId) => {
	const [roomState, setRoomState] = useState(null);
	const [connected, setConnected] = useState(false);
	const [currentUser, setCurrentUser] = useState(null);

	useEffect(() => {
		if (!roomId) return;

		const socket = connectSocket();
		const userId = getUserId();
		const userName = getUserName();

		// Set up event listeners
		socket.on('connect', () => {
			setConnected(true);
			socket.emit('join-room', { roomId, userId, userName });
		});

		socket.on('disconnect', () => {
			setConnected(false);
		});

		socket.on('room-state', (state) => {
			setRoomState(state);
			// Find current user
			const me = state.users.find(u => u.userId === userId);
			if (me) setCurrentUser(me);
		});

		socket.on('timer-tick', (data) => {
			setRoomState(prev => prev ? {
				...prev,
				timerRemaining: data.timerRemaining,
				state: data.state,
				timerType: data.timerType,
				users: data.users,
				stats: data.stats
			} : null);
		});

		socket.on('user-joined', ({ roomState: newState }) => {
			setRoomState(newState);
		});

		socket.on('user-left', ({ roomState: newState }) => {
			if (newState) setRoomState(newState);
		});

		socket.on('timer-complete', () => {
			// Timer completed - play completion sound
			try {
				const audio = new Audio('/sounds/bell-notification-337658.mp3');
				audio.volume = 0.8;
				audio.play().catch(err => console.warn('Could not play timer complete sound:', err));
			} catch (e) {
				console.warn('Sound error:', e);
			}
		});

		// If already connected, join room
		if (socket.connected) {
			socket.emit('join-room', { roomId, userId, userName });
		}

		return () => {
			socket.off('connect');
			socket.off('disconnect');
			socket.off('room-state');
			socket.off('timer-tick');
			socket.off('user-joined');
			socket.off('user-left');
			socket.off('timer-complete');
		};
	}, [roomId]);

	// Action handlers
	const startWork = useCallback((duration) => {
		const socket = getSocket();
		socket.emit('start-work', { duration });
	}, []);

	const startBreak = useCallback((duration) => {
		const socket = getSocket();
		socket.emit('start-break', { duration });
	}, []);

	const pause = useCallback(() => {
		const socket = getSocket();
		socket.emit('pause');
	}, []);

	const resume = useCallback(() => {
		const socket = getSocket();
		socket.emit('resume');
	}, []);

	const reset = useCallback(() => {
		const socket = getSocket();
		socket.emit('reset');
	}, []);

	const stop = useCallback(() => {
		const socket = getSocket();
		socket.emit('stop');
	}, []);

	const skipBreak = useCallback(() => {
		const socket = getSocket();
		socket.emit('skip-break');
	}, []);

	const goToIdle = useCallback(() => {
		const socket = getSocket();
		socket.emit('go-to-idle');
	}, []);

	const updateName = useCallback((newName) => {
		saveUserName(newName);
		const socket = getSocket();
		socket.emit('update-name', { userName: newName });
	}, []);

	return {
		roomState,
		connected,
		currentUser,
		actions: {
			startWork,
			startBreak,
			pause,
			resume,
			reset,
			stop,
			skipBreak,
			goToIdle,
			updateName
		}
	};
};
