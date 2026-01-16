import { useMemo } from 'react';

// Format seconds to human readable
const formatDuration = (seconds) => {
	if (seconds < 60) return `${seconds}s`;
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
	const hours = Math.floor(mins / 60);
	const remainingMins = mins % 60;
	return `${hours}h ${remainingMins}m`;
};

export const RoomStats = ({ stats }) => {
	if (!stats) return null;

	const formattedWork = useMemo(() => formatDuration(stats.totalWorkTime), [stats.totalWorkTime]);
	const formattedBreak = useMemo(() => formatDuration(stats.totalBreakTime), [stats.totalBreakTime]);
	const formattedAvg = useMemo(() => formatDuration(stats.avgWorkTime), [stats.avgWorkTime]);

	return (
		<div className="room-stats">
			<div className="room-stats-title">Room Stats</div>
			<div className="room-stats-grid">
				<div className="room-stat">
					<span className="room-stat-value">{stats.userCount}</span>
					<span className="room-stat-label">Active</span>
				</div>
				<div className="room-stat">
					<span className="room-stat-value">{formattedWork}</span>
					<span className="room-stat-label">Total Work</span>
				</div>
				<div className="room-stat">
					<span className="room-stat-value">{formattedBreak}</span>
					<span className="room-stat-label">Total Break</span>
				</div>
				<div className="room-stat">
					<span className="room-stat-value">{formattedAvg}</span>
					<span className="room-stat-label">Avg Work</span>
				</div>
			</div>
		</div>
	);
};

export default RoomStats;
