import { useState } from 'react';

// Generate a random room ID
const generateRoomId = () => {
	const adjectives = ['güzel', 'huzurlu', 'sessiz', 'odakli', 'verimli', 'sakin'];
	const nouns = ['oda', 'alan', 'merkez', 'köse', 'masa', 'kafe'];
	const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
	const noun = nouns[Math.floor(Math.random() * nouns.length)];
	const num = Math.floor(Math.random() * 1000);
	return `${adj}-${noun}-${num}`;
};

// Clean room name for URL
const cleanRoomName = (name) => {
	return name.trim().toLowerCase()
		.replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
		.replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
		.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
};

const Home = () => {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showJoinModal, setShowJoinModal] = useState(false);
	const [roomName, setRoomName] = useState('');

	// Navigate to room
	const goToRoom = (roomId) => {
		if (roomId) {
			window.location.href = `/${roomId}`;
		}
	};

	// Create room with custom name
	const handleCreateSubmit = (e) => {
		e.preventDefault();
		if (roomName.trim()) {
			const cleanName = cleanRoomName(roomName);
			goToRoom(cleanName);
		} else {
			const roomId = generateRoomId();
			goToRoom(roomId);
		}
	};

	// Join existing room
	const handleJoinSubmit = (e) => {
		e.preventDefault();
		if (roomName.trim()) {
			const cleanName = cleanRoomName(roomName);
			goToRoom(cleanName);
		}
	};

	// Open modals
	const openCreateModal = () => {
		setRoomName('');
		setShowCreateModal(true);
		setShowJoinModal(false);
	};

	const openJoinModal = () => {
		setRoomName('');
		setShowJoinModal(true);
		setShowCreateModal(false);
	};

	const closeModals = () => {
		setShowCreateModal(false);
		setShowJoinModal(false);
		setRoomName('');
	};

	return (
		<div className="app" style={{
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center'
		}}>
			<div className="home-content">
				{/* Logo / Title */}
				<div className="home-header">
					<div className="home-logo">⏱️</div>
					<h1 className="home-title">Focus Timer</h1>
					<p className="home-subtitle">Birlikte çalış, birlikte odaklan</p>
				</div>

				{/* Action Buttons */}
				<div className="home-actions">
					<button className="home-btn home-btn--primary" onClick={openCreateModal}>
						Yeni Oda Oluştur
					</button>

					<div className="home-divider">
						<span>veya</span>
					</div>

					<button className="home-btn home-btn--secondary" onClick={openJoinModal}>
						Odaya Katıl
					</button>
				</div>

				{/* Features - Modernized */}
				<div className="home-features">
					<div className="home-feature-card">
						<div className="home-feature-icon-wrapper">
							<svg className="home-feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
								<path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
							</svg>
						</div>
						<div className="home-feature-content">
							<div className="home-feature-title">Gerçek Zamanlı</div>
							<div className="home-feature-subtitle">Sayaç</div>
						</div>
					</div>
					<div className="home-feature-card">
						<div className="home-feature-icon-wrapper">
							<svg className="home-feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
								<circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
								<path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
								<path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
							</svg>
						</div>
						<div className="home-feature-content">
							<div className="home-feature-title">Birlikte</div>
							<div className="home-feature-subtitle">Çalış</div>
						</div>
					</div>
					<div className="home-feature-card">
						<div className="home-feature-icon-wrapper">
							<svg className="home-feature-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
								<line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
								<line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
							</svg>
						</div>
						<div className="home-feature-content">
							<div className="home-feature-title">İlerleme</div>
							<div className="home-feature-subtitle">Takibi</div>
						</div>
					</div>
				</div>
			</div>

			{/* Create Room Modal */}
			{showCreateModal && (
				<div className="modal-overlay" onClick={closeModals}>
					<div className="modal" onClick={e => e.stopPropagation()}>
						<h2 className="modal-title">Yeni Oda Oluştur</h2>
						<p className="modal-subtitle">Oda ismi girin veya rastgele oluşturun</p>

						<form onSubmit={handleCreateSubmit}>
							<input
								type="text"
								className="modal-input"
								value={roomName}
								onChange={e => setRoomName(e.target.value)}
								placeholder="örn: calisma-odasi"
								autoFocus
							/>

							<div className="modal-actions">
								<button type="button" className="modal-btn modal-btn--secondary" onClick={closeModals}>
									İptal
								</button>
								<button type="submit" className="modal-btn modal-btn--primary">
									{roomName.trim() ? 'Oluştur' : 'Rastgele Oluştur'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Join Room Modal */}
			{showJoinModal && (
				<div className="modal-overlay" onClick={closeModals}>
					<div className="modal" onClick={e => e.stopPropagation()}>
						<h2 className="modal-title">Odaya Katıl</h2>
						<p className="modal-subtitle">Katılmak istediğiniz oda ismini girin</p>

						<form onSubmit={handleJoinSubmit}>
							<input
								type="text"
								className="modal-input"
								value={roomName}
								onChange={e => setRoomName(e.target.value)}
								placeholder="Oda ismi..."
								autoFocus
								required
							/>

							<div className="modal-actions">
								<button type="button" className="modal-btn modal-btn--secondary" onClick={closeModals}>
									İptal
								</button>
								<button type="submit" className="modal-btn modal-btn--primary" disabled={!roomName.trim()}>
									Katıl
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default Home;
