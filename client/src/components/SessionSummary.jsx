// Format seconds to human readable
const formatDuration = (seconds) => {
	if (seconds < 60) return `${seconds} seconds`;
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins} minutes`;
	const hours = Math.floor(mins / 60);
	return `${hours}h ${mins % 60}m`;
};

export const SessionSummary = ({ sessions = [], onHaveBreak, onContinueWork }) => {
	const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);

	return (
		<div className="session-summary">
			<h2 className="session-summary-title">GREAT WORK!</h2>

			{sessions.length > 0 && (
				<>
					<p style={{ color: 'var(--white-alpha-80)', marginBottom: '1.5rem' }}>
						You completed {sessions.length} session{sessions.length > 1 ? 's' : ''} • Total: {formatDuration(totalDuration)}
					</p>

					<ul className="session-list">
						{sessions.map((session, index) => (
							<li key={index} className="session-item">
								Session {index + 1}: {formatDuration(session.duration)}
							</li>
						))}
					</ul>
				</>
			)}

			<div className="bubble-container" style={{ height: '200px' }}>
				<button
					className="bubble bubble--lg bubble--filled"
					style={{ left: '35%', top: '50%', transform: 'translate(-50%, -50%)' }}
					onClick={onHaveBreak}
				>
					<span className="bubble-text-sm">HAVE A<br />BREAK</span>
				</button>

				<button
					className="bubble bubble--lg bubble--filled"
					style={{ left: '65%', top: '50%', transform: 'translate(-50%, -50%)' }}
					onClick={onContinueWork}
				>
					<span className="bubble-text-sm">CONTINUE<br />WORK</span>
				</button>
			</div>
		</div>
	);
};

export default SessionSummary;
