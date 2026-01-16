import { useMemo } from 'react';

// Format seconds to MM:SS
const formatTime = (seconds) => {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const Timer = ({
	remaining,
	state,
	timerType,
	onPause,
	onResume,
	onReset,
	onStop
}) => {
	const displayTime = useMemo(() => formatTime(remaining), [remaining]);

	const isPaused = state === 'paused' || state === 'break-paused';
	const isRunning = state === 'working' || state === 'break';

	return (
		<div className="timer-section">
			<div className={`timer-display ${isRunning ? 'timer-display--active' : ''}`}>
				{displayTime}
			</div>

			<div className="controls">
				{isRunning && (
					<button className="control-btn" onClick={onPause}>
						<span className="control-text">PAUSE</span>
					</button>
				)}

				{isPaused && (
					<button className="control-btn" onClick={onResume}>
						<span className="control-text">RESUME</span>
					</button>
				)}

				<button className="control-btn" onClick={onReset}>
					<span className="control-text">RESET</span>
				</button>

				{/* STOP button - shown for both work and break modes */}
				<button className="control-btn" onClick={onStop}>
					<span className="control-text">STOP</span>
				</button>
			</div>
		</div>
	);
};

export default Timer;
