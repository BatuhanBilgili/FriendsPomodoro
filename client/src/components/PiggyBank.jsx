import { useMemo, useRef, useEffect } from 'react';

// Generate coins based on work time accumulated
const generateCoins = (totalWorkTime, timerRemaining, timerDuration) => {
	const coins = [];

	// Calculate progress (0-1) based on completed time
	const elapsed = timerDuration - timerRemaining;
	const progress = timerDuration > 0 ? elapsed / timerDuration : 0;

	// Base number of coins increases with total work time
	const baseCoinCount = Math.min(Math.floor(totalWorkTime / 60) + 1, 20);

	// Add more coins as current session progresses
	const sessionCoins = Math.floor(progress * 5);
	const totalCoins = baseCoinCount + sessionCoins;

	for (let i = 0; i < totalCoins; i++) {
		// Distribute coins within the piggy bank area
		const angle = (i / totalCoins) * Math.PI * 2 + (i * 0.5);
		const radius = 30 + Math.random() * 50;
		const x = 50 + Math.cos(angle) * radius * 0.8;
		const y = 55 + Math.sin(angle) * radius * 0.5;

		// Coin size grows with total work time
		const baseSize = 16 + Math.min(totalWorkTime / 300, 10);
		const size = baseSize + Math.random() * 8;

		coins.push({
			id: i,
			x: Math.max(15, Math.min(85, x)),
			y: Math.max(25, Math.min(85, y)),
			size,
			delay: i * 0.1
		});
	}

	return coins;
};

export const PiggyBank = ({ totalWorkTime = 0, timerRemaining = 0, timerDuration = 0 }) => {
	const containerRef = useRef(null);

	const coins = useMemo(() =>
		generateCoins(totalWorkTime, timerRemaining, timerDuration),
		[totalWorkTime, Math.floor(timerRemaining / 10), timerDuration] // Update every 10 seconds
	);

	return (
		<div className="piggy-container" ref={containerRef}>
			<div className="piggy-bank">
				{coins.map(coin => (
					<div
						key={coin.id}
						className="coin"
						style={{
							left: `${coin.x}%`,
							top: `${coin.y}%`,
							width: `${coin.size}px`,
							height: `${coin.size}px`,
							animationDelay: `${coin.delay}s`,
							transform: 'translate(-50%, -50%)'
						}}
					/>
				))}
			</div>
		</div>
	);
};

export default PiggyBank;
