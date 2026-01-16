// Cookie utilities for user persistence
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'focus_timer_user_id';
const USER_NAME_KEY = 'focus_timer_user_name';

// Get or create a persistent user ID
export const getUserId = () => {
	let userId = Cookies.get(USER_ID_KEY);
	if (!userId) {
		userId = uuidv4();
		Cookies.set(USER_ID_KEY, userId, { expires: 365 });
	}
	return userId;
};

// Get saved user name
export const getUserName = () => {
	return Cookies.get(USER_NAME_KEY) || generateRandomName();
};

// Save user name
export const setUserName = (name) => {
	Cookies.set(USER_NAME_KEY, name, { expires: 365 });
};

// Generate a random friendly name
const adjectives = ['Happy', 'Clever', 'Brave', 'Calm', 'Swift', 'Wise', 'Kind', 'Bright'];
const nouns = ['Owl', 'Fox', 'Bear', 'Wolf', 'Eagle', 'Tiger', 'Lion', 'Hawk'];

export const generateRandomName = () => {
	const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
	const noun = nouns[Math.floor(Math.random() * nouns.length)];
	const num = Math.floor(Math.random() * 100);
	return `${adj}${noun}${num}`;
};
