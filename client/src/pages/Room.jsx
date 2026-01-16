import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import PhysicsWorld from '../components/PhysicsWorld';
import { getUserName } from '../utils/cookies';

// Format seconds to MM:SS
const formatTime = (seconds) => {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format duration for stats
const formatDuration = (seconds) => {
	if (seconds < 60) return `${seconds}s`;
	const mins = Math.floor(seconds / 60);
	if (mins < 60) return `${mins}m`;
	const hours = Math.floor(mins / 60);
	return `${hours}h ${mins % 60}m`;
};

const Room = () => {
	const { roomId } = useParams();
	const { roomState, connected, currentUser, actions } = useRoom(roomId);
	const [showBreakMode, setShowBreakMode] = useState(false);
	const [showNameEditor, setShowNameEditor] = useState(false);
	const [editingName, setEditingName] = useState('');
	const [showInviteModal, setShowInviteModal] = useState(false);
	const [showSettingsModal, setShowSettingsModal] = useState(false);
	const [customWorkTimes, setCustomWorkTimes] = useState([]);
	const [customBreakTimes, setCustomBreakTimes] = useState([]);
	const [customTimeInput, setCustomTimeInput] = useState('');
	const [ballColor, setBallColor] = useState('orange'); // 'orange', 'blue', 'pink'

	// Determine timer state
	const timerActive = useMemo(() => {
		if (!roomState) return false;
		return ['working', 'paused', 'break', 'break-paused'].includes(roomState.state);
	}, [roomState?.state]);

	const isPaused = useMemo(() => {
		if (!roomState) return false;
		return ['paused', 'break-paused'].includes(roomState.state);
	}, [roomState?.state]);

	const isBreak = useMemo(() => {
		if (!roomState) return false;
		return ['break', 'break-paused'].includes(roomState.state);
	}, [roomState?.state]);

	// Copy room URL with share message
	const copyRoomUrl = () => {
		const inviteLink = window.location.href;
		const userName = currentUser?.userName || getUserName();
		const shareMessage = `Merhaba! Benimle "${userName}" olarak beraber çalışmak adına aşağıdaki davet linkine bekliyorum:\n\n${inviteLink}`;
		
		navigator.clipboard.writeText(shareMessage).then(() => {
			// Show success notification
			const notification = document.createElement('div');
			notification.textContent = '✅ Başarı ile davet linki kopyalandı!';
			notification.style.cssText = `
				position: fixed;
				top: 20px;
				right: 20px;
				background: #4CAF50;
				color: white;
				padding: 1rem 1.5rem;
				border-radius: 12px;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
				z-index: 10000;
				font-size: 0.95rem;
				font-weight: 500;
				animation: slideIn 0.3s ease-out;
			`;
			
			// Add animation
			const style = document.createElement('style');
			style.textContent = `
				@keyframes slideIn {
					from {
						transform: translateX(400px);
						opacity: 0;
					}
					to {
						transform: translateX(0);
						opacity: 1;
					}
				}
			`;
			document.head.appendChild(style);
			
			document.body.appendChild(notification);
			
			setTimeout(() => {
				notification.style.animation = 'slideIn 0.3s ease-out reverse';
				setTimeout(() => {
					notification.remove();
					style.remove();
				}, 300);
			}, 3000);
		}).catch(() => {
			alert('Link kopyalanırken bir hata oluştu.');
		});
	};

	// Get invite link
	const getInviteLink = () => {
		return window.location.href;
	};

	// Handle custom time addition
	const handleAddCustomTime = () => {
		const inputValue = customTimeInput.trim();
		if (!inputValue) return;
		
		const minutes = parseInt(inputValue);
		if (isNaN(minutes) || minutes <= 0) {
			alert('Lütfen geçerli bir sayı girin (1 ve üzeri)');
			return;
		}

		const maxTime = showBreakMode ? 30 : 55;
		if (minutes > maxTime) {
			alert(`${showBreakMode ? 'Mola' : 'Çalışma'} için maksimum ${maxTime} dakika ekleyebilirsiniz.`);
			return;
		}

		if (showBreakMode) {
			if (!customBreakTimes.includes(minutes)) {
				setCustomBreakTimes([...customBreakTimes, minutes].sort((a, b) => a - b));
			} else {
				alert('Bu süre zaten eklenmiş!');
			}
		} else {
			if (!customWorkTimes.includes(minutes)) {
				setCustomWorkTimes([...customWorkTimes, minutes].sort((a, b) => a - b));
			} else {
				alert('Bu süre zaten eklenmiş!');
			}
		}
		setCustomTimeInput('');
	};

	// Remove custom time
	const handleRemoveCustomTime = (minutes) => {
		if (showBreakMode) {
			setCustomBreakTimes(customBreakTimes.filter(t => t !== minutes));
		} else {
			setCustomWorkTimes(customWorkTimes.filter(t => t !== minutes));
		}
	};

	// Handle time selection from physics world
	const handleTimeSelect = (duration) => {
		if (showBreakMode) {
			actions.startBreak(duration);
			setShowBreakMode(false);
		} else {
			actions.startWork(duration);
		}
	};

	// Handle name save
	const handleNameSave = () => {
		if (editingName.trim()) {
			actions.updateName(editingName.trim());
		}
		setShowNameEditor(false);
	};

	// Loading state
	if (!connected || !roomState) {
		return (
			<div className="app">
				<div className="loading">
					<div className="loading-spinner" />
					<span>Odaya bağlanılıyor...</span>
				</div>
			</div>
		);
	}

	// Session stopped - show summary
	if (roomState.state === 'stopped') {
		const totalWorkTime = roomState.workSessions.reduce((sum, s) => sum + s.duration, 0);
		const wasBreak = roomState.timerType === 'break'; // Check if last session was break

		return (
			<div className="app">
				<div className="session-summary" style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					minHeight: '100vh',
					padding: '2rem'
				}}>
					<div className="session-summary-title">
						{wasBreak ? 'Mola tamamlandı! 😊' : 'Harika çalışma! 🎉'}
					</div>
					<div className="session-summary-stat">{formatDuration(totalWorkTime)}</div>
					<div className="session-summary-label">Toplam çalışma süresi</div>

					<div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
						{!wasBreak && (
							<button
								className="control-btn"
								onClick={() => {
									setShowBreakMode(true);
									actions.goToIdle();
								}}
							>
								Mola Al
							</button>
						)}
						<button
							className="control-btn control-btn--active"
							onClick={() => {
								setShowBreakMode(false);
								actions.goToIdle();
							}}
						>
							Devam Et
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="app">
			{/* Header */}
			<div className="header">
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
					<button
						onClick={() => setShowSettingsModal(true)}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							fontSize: '1.5rem',
							padding: '0.25rem',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center'
						}}
						title="Ayarlar"
					>
						⚙️
					</button>
					
					{/* Custom Time Input in Header - Only when idle */}
					{!timerActive && roomState.state === 'idle' && (
						<div style={{
							display: 'flex',
							gap: '0.5rem',
							alignItems: 'center',
							background: 'rgba(255, 255, 255, 0.9)',
							padding: '0.375rem 0.75rem',
							borderRadius: '20px',
							boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
							border: '1px solid rgba(232, 224, 213, 0.5)'
						}}>
							<input
								type="number"
								value={customTimeInput}
								onChange={(e) => setCustomTimeInput(e.target.value)}
								onKeyPress={(e) => {
									if (e.key === 'Enter') {
										handleAddCustomTime();
									}
								}}
								placeholder={`${showBreakMode ? 'Mola' : 'Çalışma'} süresi (dk)`}
								min="1"
								max={showBreakMode ? 30 : 55}
								style={{
									padding: '0.375rem 0.5rem',
									border: 'none',
									borderRadius: '8px',
									fontSize: '0.8125rem',
									width: '100px',
									outline: 'none',
									background: 'transparent',
									color: 'var(--text-primary)'
								}}
							/>
							<button
								onClick={handleAddCustomTime}
								disabled={!customTimeInput || parseInt(customTimeInput) <= 0}
								style={{
									padding: '0.375rem 0.75rem',
									background: customTimeInput && parseInt(customTimeInput) > 0 ? '#f5a623' : '#e0e0e0',
									color: customTimeInput && parseInt(customTimeInput) > 0 ? 'white' : '#999',
									border: 'none',
									borderRadius: '8px',
									cursor: customTimeInput && parseInt(customTimeInput) > 0 ? 'pointer' : 'not-allowed',
									fontSize: '0.75rem',
									fontWeight: '600',
									whiteSpace: 'nowrap',
									transition: 'all 0.2s'
								}}
								title={`${showBreakMode ? 'Mola' : 'Çalışma'} topu ekle`}
							>
								+ Ekle
							</button>
						</div>
					)}
					
					<div className="header-title" onClick={() => {
						setEditingName(currentUser?.userName || getUserName());
						setShowNameEditor(true);
					}} style={{ cursor: 'pointer' }}>
						{currentUser?.userName || 'İsimsiz'}
					</div>
				</div>
				<div className="header-room" onClick={copyRoomUrl} style={{ cursor: 'pointer' }}>
					📋 {roomId}
				</div>
			</div>

			{/* Timer Display (when active) */}
			{timerActive && (
				<div className="timer-overlay">
					<div className="timer-display">
						{formatTime(roomState.timerRemaining)}
					</div>
					<div className="timer-label">
						{isBreak ? 'Mola' : 'Odaklanma'}
					</div>
				</div>
			)}

			{/* Physics World (when not in active timer) */}
			{!timerActive && (
				<PhysicsWorld
					type={showBreakMode ? 'break' : 'work'}
					onSelect={handleTimeSelect}
					users={roomState.users}
					currentUser={currentUser}
					timerActive={timerActive}
					timerRemaining={roomState.timerRemaining}
					timerDuration={roomState.timerDuration}
					customTimes={showBreakMode ? customBreakTimes : customWorkTimes}
					ballColor={showBreakMode ? 'blue' : ballColor} // Mola modunda her zaman mavi, çalışma modunda seçilen renk
				/>
			)}

			{/* Active Timer View */}
			{timerActive && (
				<div style={{
					position: 'fixed',
					inset: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: isBreak
						? 'linear-gradient(180deg, #faf8f5 0%, #f5f0e8 100%)'
						: 'linear-gradient(180deg, #fffcf7 0%, #faf6f0 100%)'
				}}>
					{/* Large timer ball */}
					<div style={{
						width: '200px',
						height: '200px',
						borderRadius: '50%',
						background: isBreak
							? 'linear-gradient(145deg, #e8e0d5, #d4ccc0)'
							: 'linear-gradient(145deg, #d4893a, #b87333)',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						boxShadow: '0 8px 32px rgba(139, 90, 43, 0.2)',
						transition: 'transform 0.3s ease'
					}}>
						<div style={{
							fontFamily: 'var(--font-mono)',
							fontSize: '2.5rem',
							fontWeight: '300',
							color: isBreak ? 'var(--text-primary)' : 'white',
							textShadow: isBreak ? 'none' : '0 2px 4px rgba(0,0,0,0.2)'
						}}>
							{formatTime(roomState.timerRemaining)}
						</div>
					</div>
				</div>
			)}

			{/* Controls (when timer active) */}
			{timerActive && (
				<div className="controls-bar">
					{isPaused ? (
						<button className="control-btn control-btn--active" onClick={actions.resume}>
							Devam
						</button>
					) : (
						<button className="control-btn" onClick={actions.pause}>
							Durdur
						</button>
					)}
					<button className="control-btn" onClick={actions.reset}>
						Sıfırla
					</button>
					<button className="control-btn" onClick={isBreak ? actions.goToIdle : actions.stop}>
						Bitir
					</button>
				</div>
			)}

			{/* Room Stats */}
			<div className="room-stats">
				<div className="room-stats-item">
					<span>Aktif:</span>
					<span className="room-stats-value">{roomState.stats.userCount}</span>
				</div>
				<div className="room-stats-item">
					<span>Toplam:</span>
					<span className="room-stats-value">{formatDuration(roomState.stats.totalWorkTime)}</span>
				</div>
			</div>

			{/* Mode Toggle (when idle) */}
			{!timerActive && roomState.state === 'idle' && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
					<div className="controls-bar">
						<button
							className={`control-btn ${!showBreakMode ? 'control-btn--active' : ''}`}
							onClick={() => setShowBreakMode(false)}
						>
							Çalışma
						</button>
						<button
							className={`control-btn ${showBreakMode ? 'control-btn--active' : ''}`}
							onClick={() => setShowBreakMode(true)}
						>
							Mola
						</button>
					</div>

					{/* Show custom times */}
					{((showBreakMode && customBreakTimes.length > 0) || (!showBreakMode && customWorkTimes.length > 0)) && (
						<div style={{
							display: 'flex',
							flexWrap: 'wrap',
							gap: '0.5rem',
							justifyContent: 'center',
							maxWidth: '400px'
						}}>
							{(showBreakMode ? customBreakTimes : customWorkTimes).map((minutes) => (
								<div
									key={minutes}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										background: 'rgba(245, 166, 35, 0.2)',
										padding: '0.5rem 1rem',
										borderRadius: '20px',
										fontSize: '0.85rem'
									}}
								>
									<span>{minutes} dk</span>
									<button
										onClick={() => handleRemoveCustomTime(minutes)}
										style={{
											background: 'none',
											border: 'none',
											cursor: 'pointer',
											fontSize: '1.2rem',
											lineHeight: 1,
											padding: 0,
											color: '#666'
										}}
									>
										×
									</button>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Name Editor Modal */}
			{showNameEditor && (
				<div className="modal-overlay" onClick={() => setShowNameEditor(false)}>
					<div className="modal" onClick={e => e.stopPropagation()}>
						<h2 className="modal-title">İsim Değiştir</h2>
						<input
							type="text"
							className="modal-input"
							value={editingName}
							onChange={e => setEditingName(e.target.value)}
							placeholder="İsminizi girin"
							autoFocus
							maxLength={20}
						/>
						<div className="modal-actions">
							<button
								className="modal-btn modal-btn--secondary"
								onClick={() => setShowNameEditor(false)}
							>
								İptal
							</button>
							<button
								className="modal-btn modal-btn--primary"
								onClick={handleNameSave}
							>
								Kaydet
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Invite Link Modal */}
			{showInviteModal && (
				<div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
					<div className="modal" onClick={e => e.stopPropagation()}>
						<h2 className="modal-title">Davet Linki</h2>
						<p style={{ 
							marginBottom: '1rem', 
							color: '#666', 
							fontSize: '0.9rem',
							textAlign: 'center'
						}}>
							Bu linki arkadaşlarınızla paylaşarak onları odaya davet edebilirsiniz
						</p>
						<div style={{
							display: 'flex',
							gap: '0.5rem',
							marginBottom: '1rem'
						}}>
							<input
								type="text"
								value={getInviteLink()}
								readOnly
								style={{
									flex: 1,
									padding: '0.75rem',
									border: '1px solid #e0e0e0',
									borderRadius: '8px',
									fontSize: '0.9rem',
									background: '#f5f5f5'
								}}
							/>
							<button
								onClick={() => {
									copyRoomUrl();
									alert('Link kopyalandı!');
								}}
								style={{
									padding: '0.75rem 1.5rem',
									background: '#f5a623',
									color: 'white',
									border: 'none',
									borderRadius: '8px',
									cursor: 'pointer',
									fontSize: '0.9rem',
									fontWeight: '600',
									whiteSpace: 'nowrap'
								}}
							>
								Kopyala
							</button>
						</div>
						<div className="modal-actions">
							<button
								className="modal-btn modal-btn--primary"
								onClick={() => setShowInviteModal(false)}
							>
								Tamam
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Settings Modal - Modern & Minimal */}
			{showSettingsModal && (
				<div 
					className="modal-overlay" 
					onClick={() => setShowSettingsModal(false)}
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(0, 0, 0, 0.4)',
						backdropFilter: 'blur(4px)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1000
					}}
				>
					<div 
						onClick={e => e.stopPropagation()}
						style={{
							background: '#FFFFFF',
							borderRadius: '20px',
							padding: '2rem',
							maxWidth: '400px',
							width: '90%',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
							animation: 'fadeIn 0.2s ease-out'
						}}
					>
						<div style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '1.5rem'
						}}>
							<h2 style={{
								margin: 0,
								fontSize: '1.5rem',
								fontWeight: '600',
								color: '#1a1a1a'
							}}>
								Top Rengi
							</h2>
							<button
								onClick={() => setShowSettingsModal(false)}
								style={{
									background: 'none',
									border: 'none',
									fontSize: '1.5rem',
									cursor: 'pointer',
									color: '#999',
									padding: 0,
									width: '32px',
									height: '32px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									borderRadius: '8px',
									transition: 'all 0.2s'
								}}
								onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
								onMouseLeave={(e) => e.target.style.background = 'none'}
							>
								×
							</button>
						</div>
						
						<div style={{
							display: 'flex',
							gap: '1.25rem',
							justifyContent: 'center',
							marginBottom: '1rem'
						}}>
							<button
								onClick={() => setBallColor('orange')}
								style={{
									width: '70px',
									height: '70px',
									borderRadius: '50%',
									background: 'linear-gradient(135deg, #F8A363, #E07B39, #C96A31)',
									border: ballColor === 'orange' ? '3px solid #f5a623' : '2px solid #e8e8e8',
									cursor: 'pointer',
									boxShadow: ballColor === 'orange' 
										? '0 8px 20px rgba(245, 166, 35, 0.3), 0 0 0 4px rgba(245, 166, 35, 0.1)' 
										: '0 2px 8px rgba(0, 0, 0, 0.08)',
									transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
									transform: ballColor === 'orange' ? 'scale(1.05)' : 'scale(1)',
									outline: 'none'
								}}
								title="Turuncu"
							/>
							<button
								onClick={() => setBallColor('blue')}
								style={{
									width: '70px',
									height: '70px',
									borderRadius: '50%',
									background: 'linear-gradient(135deg, #6BA3E8, #4A90E2, #357ABD)',
									border: ballColor === 'blue' ? '3px solid #4A90E2' : '2px solid #e8e8e8',
									cursor: 'pointer',
									boxShadow: ballColor === 'blue' 
										? '0 8px 20px rgba(74, 144, 226, 0.3), 0 0 0 4px rgba(74, 144, 226, 0.1)' 
										: '0 2px 8px rgba(0, 0, 0, 0.08)',
									transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
									transform: ballColor === 'blue' ? 'scale(1.05)' : 'scale(1)',
									outline: 'none'
								}}
								title="Mavi"
							/>
							<button
								onClick={() => setBallColor('pink')}
								style={{
									width: '70px',
									height: '70px',
									borderRadius: '50%',
									background: 'linear-gradient(135deg, #FFB6C1, #FF69B4, #FF1493)',
									border: ballColor === 'pink' ? '3px solid #FF69B4' : '2px solid #e8e8e8',
									cursor: 'pointer',
									boxShadow: ballColor === 'pink' 
										? '0 8px 20px rgba(255, 105, 180, 0.3), 0 0 0 4px rgba(255, 105, 180, 0.1)' 
										: '0 2px 8px rgba(0, 0, 0, 0.08)',
									transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
									transform: ballColor === 'pink' ? 'scale(1.05)' : 'scale(1)',
									outline: 'none'
								}}
								title="Pembe"
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Room;
