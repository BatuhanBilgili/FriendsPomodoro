// Socket.io client configuration
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket = null;

export const getSocket = () => {
	if (!socket) {
		socket = io(SOCKET_URL, {
			autoConnect: false,
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionAttempts: 10
		});
	}
	return socket;
};

export const connectSocket = () => {
	const s = getSocket();
	if (!s.connected) {
		s.connect();
	}
	return s;
};

export const disconnectSocket = () => {
	if (socket && socket.connected) {
		socket.disconnect();
	}
};

export default getSocket;
