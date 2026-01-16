import { useMemo } from 'react';
import { getUserId } from '../utils/cookies';

// Format seconds to mm:ss or h:mm:ss
const formatDuration = (seconds) => {
	if (seconds < 60) return `${seconds}s`;
	const mins = Math.floor(seconds / 60);
	if (mins < 60) return `${mins}m`;
	const hours = Math.floor(mins / 60);
	return `${hours}h ${mins % 60}m`;
};

// Get initials from name
const getInitials = (name) => {
	if (!name) return '?';
	const words = name.split(/[\s_-]/);
	if (words.length === 1) {
		return name.slice(0, 2).toUpperCase();
	}
	return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

export const UserList = ({ users = [], onEditName }) => {
	const currentUserId = useMemo(() => getUserId(), []);

	return (
		<div className="user-panel">
			{users.map(user => {
				const isSelf = user.userId === currentUserId;

				return (
					<div
						key={user.socketId}
						className={`user-bubble ${isSelf ? 'user-bubble--self' : ''}`}
						onClick={() => isSelf && onEditName?.()}
						title={isSelf ? 'Click to edit name' : user.userName}
					>
						{getInitials(user.userName)}

						<div className="user-tooltip">
							<div className="user-tooltip-name">
								{user.userName} {isSelf && '(you)'}
							</div>
							<div className="user-tooltip-stats">
								Work: {formatDuration(user.workTime)}<br />
								Break: {formatDuration(user.breakTime)}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default UserList;
