import { useState, useCallback } from 'react';

// Work time options in minutes
const WORK_TIMES = [5, 15, 25, 55];
// Break time options in minutes  
const BREAK_TIMES = [5, 10, 15, 30];

// Bubble positions for organic layout (percentages)
const WORK_POSITIONS = [
	{ left: '15%', top: '20%', size: 'lg' },   // 15
	{ left: '50%', top: '15%', size: 'xl' },   // 25
	{ left: '30%', top: '50%', size: 'md' },   // 5
	{ left: '55%', top: '55%', size: 'xl' },   // 55
];

const BREAK_POSITIONS = [
	{ left: '20%', top: '15%', size: 'xl' },   // 30
	{ left: '55%', top: '20%', size: 'lg' },   // 10
	{ left: '45%', top: '45%', size: 'md' },   // 5
	{ left: '20%', top: '55%', size: 'lg' },   // 15
];

export const TimeSelector = ({
	type = 'work',
	onSelect,
	onHaveBreak,
	onSkipBreak
}) => {
	const [showCustom, setShowCustom] = useState(false);
	const [customValue, setCustomValue] = useState('');

	const times = type === 'work' ? WORK_TIMES : BREAK_TIMES;
	const positions = type === 'work' ? WORK_POSITIONS : BREAK_POSITIONS;
	const title = type === 'work' ? 'WORK TIME' : 'BREAK TIME';

	const handleSelect = useCallback((minutes) => {
		onSelect(minutes * 60); // Convert to seconds
	}, [onSelect]);

	const handleCustomSubmit = useCallback((e) => {
		e.preventDefault();
		const minutes = parseInt(customValue, 10);
		if (minutes > 0 && minutes <= 180) {
			handleSelect(minutes);
			setShowCustom(false);
			setCustomValue('');
		}
	}, [customValue, handleSelect]);

	return (
		<div className="main-container">
			<h1 className="title">{title}</h1>

			<div className="bubble-container">
				{times.map((time, index) => (
					<button
						key={time}
						className={`bubble bubble--${positions[index].size} bubble--filled`}
						style={{
							left: positions[index].left,
							top: positions[index].top,
							transform: 'translate(-50%, -50%)'
						}}
						onClick={() => handleSelect(time)}
					>
						<span className="bubble-text">{time}</span>
					</button>
				))}

				{/* Have a Break / Skip Break button */}
				{type === 'work' && onHaveBreak && (
					<button
						className="bubble bubble--lg bubble--filled"
						style={{ left: '25%', top: '75%', transform: 'translate(-50%, -50%)' }}
						onClick={onHaveBreak}
					>
						<span className="bubble-text-sm">HAVE A<br />BREAK</span>
					</button>
				)}

				{type === 'break' && onSkipBreak && (
					<button
						className="bubble bubble--lg bubble--filled"
						style={{ left: '65%', top: '75%', transform: 'translate(-50%, -50%)' }}
						onClick={onSkipBreak}
					>
						<span className="bubble-text-sm">SKIP<br />BREAK</span>
					</button>
				)}
			</div>

			{/* Custom time button */}
			<button
				className="custom-time-btn"
				onClick={() => setShowCustom(true)}
				title="Custom time"
			>
				+
			</button>

			{/* Custom time modal */}
			{showCustom && (
				<div className="name-editor" onClick={() => setShowCustom(false)}>
					<form
						className="name-editor-modal"
						onClick={e => e.stopPropagation()}
						onSubmit={handleCustomSubmit}
					>
						<h2 className="name-editor-title">Custom Time (minutes)</h2>
						<input
							type="number"
							className="name-editor-input"
							value={customValue}
							onChange={e => setCustomValue(e.target.value)}
							placeholder="e.g. 45"
							min="1"
							max="180"
							autoFocus
						/>
						<div className="name-editor-actions">
							<button
								type="button"
								className="name-editor-btn name-editor-btn--secondary"
								onClick={() => setShowCustom(false)}
							>
								Cancel
							</button>
							<button
								type="submit"
								className="name-editor-btn name-editor-btn--primary"
							>
								Start
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
};

export default TimeSelector;
