import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

// Time options with their durations in minutes
const WORK_TIMES = [5, 15, 25, 55];
const BREAK_TIMES = [5, 10, 15, 30];

// Calculate ball radius based on duration (longer = bigger)
// Uses logarithmic scaling to prevent oversized balls for long durations
const getRadius = (minutes) => {
	const isMobile = window.innerWidth < 768;
	const baseRadius = isMobile ? 12 : 22;
	// Use square root scaling to keep large times manageable
	const scaleFactor = isMobile ? 2 : 4;
	const scaledSize = Math.sqrt(minutes) * scaleFactor;
	// Max radius: 38px mobile (17% smaller), 65px desktop
	const maxRadius = isMobile ? 38 : 65;
	return Math.min(baseRadius + scaledSize, maxRadius);
};

// Get ball gradient colors based on duration
const getBallGradient = (minutes) => {
	if (minutes <= 10) return { fill: '#f5a623', stroke: '#e09000' };
	if (minutes <= 25) return { fill: '#d4893a', stroke: '#b87333' };
	return { fill: '#b87333', stroke: '#8b5a2b' };
};

export const PhysicsWorld = ({
	type = 'work',
	onSelect,
	users = [],
	currentUser = null,
	customTimes = [], // Custom time options added by user
	ballColor = 'orange', // 'orange', 'blue', 'pink'
}) => {
	const sceneRef = useRef(null);
	const engineRef = useRef(null);
	const renderRef = useRef(null);
	const runnerRef = useRef(null);
	const ballsRef = useRef([]);
	const focusZoneRef = useRef(null);
	const netBodiesRef = useRef([]);
	const netConstraintsRef = useRef([]);
	const isFirstMountRef = useRef(true);
	const [isReady, setIsReady] = useState(false);
	const ballColorRef = useRef(ballColor);

	const baseTimes = type === 'work' ? WORK_TIMES : BREAK_TIMES;
	const times = [...baseTimes, ...customTimes].filter((t, i, arr) => arr.indexOf(t) === i).sort((a, b) => a - b);

	// Initialize physics world only once
	useEffect(() => {
		if (!sceneRef.current) return;

		const Engine = Matter.Engine;
		const Render = Matter.Render;
		const Runner = Matter.Runner;
		const Bodies = Matter.Bodies;
		const Body = Matter.Body;
		const Composite = Matter.Composite;
		const Mouse = Matter.Mouse;
		const MouseConstraint = Matter.MouseConstraint;
		const Events = Matter.Events;
		const Vector = Matter.Vector;

		const container = sceneRef.current;
		const width = container.clientWidth || window.innerWidth;
		const height = container.clientHeight || window.innerHeight;

		// Create engine with realistic physics settings
		const engine = Engine.create({
			gravity: {
				x: 0,
				y: 1, // More realistic gravity
				scale: 0.001
			},
			timing: {
				timeScale: 1,
				timestamp: 0
			}
		});
		engineRef.current = engine;

		// Create renderer
		const render = Render.create({
			element: container,
			engine: engine,
			options: {
				width: width,
				height: height,
				wireframes: false,
				background: '#faf8f5',
				pixelRatio: Math.min(window.devicePixelRatio, 2)
			}
		});
		renderRef.current = render;

		// Create boundaries (visible walls at edges)
		const wallThickness = 60;
		const walls = [
			// Top wall
			Bodies.rectangle(width / 2, -wallThickness / 2, width + 100, wallThickness, {
				isStatic: true,
				restitution: 0.8,
				render: { visible: false }
			}),
			// Bottom wall
			Bodies.rectangle(width / 2, height + wallThickness / 2, width + 100, wallThickness, {
				isStatic: true,
				restitution: 0.8,
				render: { visible: false }
			}),
			// Left wall
			Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height + 100, {
				isStatic: true,
				restitution: 0.8,
				render: { visible: false }
			}),
			// Right wall
			Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height + 100, {
				isStatic: true,
				restitution: 0.8,
				render: { visible: false }
			})
		];
		Composite.add(engine.world, walls);

		// Create focus zone (basketball hoop) - static sensor
		const focusZoneRadius = 100;
		const focusZone = Bodies.circle(width / 2, height / 2, focusZoneRadius, {
			isStatic: true,
			isSensor: true,
			label: 'focusZone',
			render: {
				visible: false // We'll draw custom basketball hoop
			}
		});
		focusZoneRef.current = focusZone;
		Composite.add(engine.world, focusZone);

		// Create net strings with physics
		const Constraint = Matter.Constraint;
		const netSegments = 12;
		const netLength = 40;
		const hoopX = width / 2;
		const hoopY = height / 2;
		const netStrings = [];
		const netConstraints = [];

		for (let i = 0; i < netSegments; i++) {
			const angle = (i / netSegments) * 2 * Math.PI;
			const startX = hoopX + Math.cos(angle) * (focusZoneRadius - 5);
			const startY = hoopY + Math.sin(angle) * (focusZoneRadius * 0.3);
			const endY = startY + netLength;

			// Create small body for net string end
			const netEnd = Bodies.circle(startX, endY, 2, {
				isStatic: false,
				mass: 0.005, // Lighter for more realistic net movement
				restitution: 0.2, // Less bounce for net
				friction: 0.05,
				frictionAir: 0.08, // More air resistance for realistic net sway
				render: { visible: false }
			});

			// Constraint from hoop to net end (like a rope)
			const constraint = Constraint.create({
				bodyA: focusZone,
				pointA: {
					x: Math.cos(angle) * (focusZoneRadius - 5),
					y: Math.sin(angle) * (focusZoneRadius * 0.3)
				},
				bodyB: netEnd,
				length: netLength,
				stiffness: 0.95, // More rigid for realistic net
				damping: 0.15 // More damping for realistic movement
			});

			netStrings.push(netEnd);
			netConstraints.push(constraint);
			Composite.add(engine.world, [netEnd, constraint]);
		}

		netBodiesRef.current = netStrings;
		netConstraintsRef.current = netConstraints;

		// Create initial time balls - will be updated when type changes
		const createBalls = (ballTimes, startFromTop = false) => {
			const balls = [];
			const spacing = width / (ballTimes.length + 1);
			const isMobile = width < 768;

			ballTimes.forEach((minutes, index) => {
				// Use responsive radius calculation
				const baseRadius = isMobile ? 18 : 25;
				const scaleFactor = isMobile ? 1.2 : 1.8;
				const radius = baseRadius + (minutes * scaleFactor);
				const colors = getBallGradient(minutes);

				// Position balls: start from top on first mount, otherwise preserve position
				const x = spacing * (index + 1);
				const y = startFromTop ? radius + 50 : height - radius - 80;

				// Density affects mass - bigger balls should be heavier
				const density = 0.001 * (minutes / 10);

				const ball = Bodies.circle(x, y, radius, {
					restitution: 0.85, // More realistic bounce (basketball-like)
					friction: 0.1, // More realistic friction
					frictionAir: 0.02, // Air resistance for realistic movement
					density: density,
					mass: density * Math.PI * radius * radius, // Explicit mass calculation
					render: {
						visible: false // We'll draw custom basketball design
					},
					label: `time-${minutes}`
				});

				ball.duration = minutes;
				ball.isTimeBall = true;
				ball.radius = radius;

				// Give initial downward velocity only on first mount
				if (startFromTop) {
					Body.setVelocity(ball, {
						x: (Math.random() - 0.5) * 2,
						y: 2 + Math.random() * 1.5
					});
				}

				balls.push(ball);
			});

			return balls;
		};

		const initialBalls = createBalls(times, isFirstMountRef.current);
		ballsRef.current = initialBalls;
		Composite.add(engine.world, initialBalls);
		isFirstMountRef.current = false;

		// Mouse control for dragging
		const mouse = Mouse.create(render.canvas);
		const mouseConstraint = MouseConstraint.create(engine, {
			mouse: mouse,
			constraint: {
				stiffness: 0.2,
				damping: 0.3,
				render: { visible: false }
			}
		});
		Composite.add(engine.world, mouseConstraint);
		render.mouse = mouse;

		// Fix mouse wheel scroll
		mouse.element.removeEventListener('wheel', mouse.mousewheel);

		// Track drag end to check for focus zone drop
		Events.on(mouseConstraint, 'enddrag', (event) => {
			const body = event.body;
			if (body && body.isTimeBall) {
				const focusPos = focusZone.position;
				const ballPos = body.position;
				const distance = Vector.magnitude(Vector.sub(ballPos, focusPos));

				// If dropped within focus zone radius + ball radius
				if (distance < focusZoneRadius + body.radius * 0.5) {
					const duration = body.duration * 60; // Convert to seconds
					console.log(`Selected ${body.duration} minutes`);
					onSelect?.(duration);
				}
			}
		});


		// Custom rendering for text on balls
		Events.on(render, 'afterRender', () => {
			const ctx = render.context;

			// Draw basketball hoop (pota) - side profile view
			const fz = focusZone;
			const hoopX = fz.position.x;
			const hoopY = fz.position.y;
			const hoopRadius = focusZoneRadius;

			ctx.save();

			// Backboard support (dark gray pole)
			const supportWidth = 20;
			const supportHeight = 30;
			ctx.fillStyle = '#555555';
			ctx.fillRect(hoopX - supportWidth / 2, hoopY - hoopRadius - 120, supportWidth, supportHeight);

			// Backboard (white rectangle with rounded top corners) - connected to support
			const backboardWidth = 150;
			const backboardHeight = 110;
			const backboardTop = hoopY - hoopRadius - backboardHeight - 10;
			const backboardLeft = hoopX - backboardWidth / 2;

			// Backboard shadow
			ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
			ctx.fillRect(backboardLeft + 4, backboardTop + 4, backboardWidth, backboardHeight);

			// Backboard main (white with glass effect)
			const backboardGradient = ctx.createLinearGradient(backboardLeft, backboardTop, backboardLeft, backboardTop + backboardHeight);
			backboardGradient.addColorStop(0, '#F8F9FA');
			backboardGradient.addColorStop(0.5, '#FFFFFF');
			backboardGradient.addColorStop(1, '#E8EAED');

			ctx.fillStyle = backboardGradient;
			ctx.beginPath();
			ctx.moveTo(backboardLeft + 12, backboardTop); // Rounded top left
			ctx.lineTo(backboardLeft + backboardWidth - 12, backboardTop); // Top
			ctx.quadraticCurveTo(backboardLeft + backboardWidth, backboardTop, backboardLeft + backboardWidth, backboardTop + 12); // Rounded top right
			ctx.lineTo(backboardLeft + backboardWidth, backboardTop + backboardHeight); // Right
			ctx.lineTo(backboardLeft, backboardTop + backboardHeight); // Bottom
			ctx.lineTo(backboardLeft, backboardTop + 12); // Left
			ctx.quadraticCurveTo(backboardLeft, backboardTop, backboardLeft + 12, backboardTop); // Rounded top left
			ctx.closePath();
			ctx.fill();

			// Backboard border (red inner border - connected to hoop)
			ctx.strokeStyle = '#DC143C';
			ctx.lineWidth = 5;
			ctx.beginPath();
			ctx.moveTo(backboardLeft + 18, backboardTop + 12);
			ctx.lineTo(backboardLeft + backboardWidth - 18, backboardTop + 12);
			ctx.lineTo(backboardLeft + backboardWidth - 18, backboardTop + backboardHeight - 12);
			ctx.lineTo(backboardLeft + 18, backboardTop + backboardHeight - 12);
			ctx.closePath();
			ctx.stroke();

			// Hoop rim (red circle - side view as ellipse) - connected to backboard
			ctx.strokeStyle = '#DC143C';
			ctx.lineWidth = 12;
			ctx.beginPath();
			ctx.ellipse(hoopX, hoopY, hoopRadius, hoopRadius * 0.35, 0, 0, 2 * Math.PI);
			ctx.stroke();

			// Hoop inner rim (for depth)
			ctx.strokeStyle = '#B22222';
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.ellipse(hoopX, hoopY, hoopRadius - 6, (hoopRadius - 6) * 0.35, 0, 0, 2 * Math.PI);
			ctx.stroke();

			// Net strings (using physics bodies)
			const netStrings = netBodiesRef.current;
			const netConstraints = netConstraintsRef.current;

			netConstraints.forEach((constraint, i) => {
				const pointA = Vector.add(focusZone.position, constraint.pointA);
				const pointB = netStrings[i].position;

				// Alternate blue and red
				const isBlue = Math.floor(i / 2) % 2 === 0;
				ctx.strokeStyle = isBlue ? '#4169E1' : '#DC143C';
				ctx.lineWidth = 2.5;
				ctx.lineCap = 'round';

				ctx.beginPath();
				ctx.moveTo(pointA.x, pointA.y);
				ctx.lineTo(pointB.x, pointB.y);
				ctx.stroke();
			});

			// Net bottom connection (curved)
			if (netStrings.length > 0) {
				ctx.strokeStyle = '#DC143C';
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(netStrings[0].position.x, netStrings[0].position.y);
				for (let i = 1; i < netStrings.length; i++) {
					ctx.lineTo(netStrings[i].position.x, netStrings[i].position.y);
				}
				ctx.closePath();
				ctx.stroke();
			}

			ctx.restore();

			// Draw basketball-style time balls
			ballsRef.current.forEach(ball => {
				const { x, y } = ball.position;
				const r = ball.radius;

				ctx.save();
				ctx.translate(x, y);
				ctx.rotate(ball.angle);

				// Ball colors based on user preference (use ref for instant updates)
				const currentBallColor = ballColorRef.current;
				let primaryColor, darkColor, lightColor, lineColor;

				if (currentBallColor === 'blue') {
					// Calming blue
					primaryColor = '#4A90E2';
					darkColor = '#357ABD';
					lightColor = '#6BA3E8';
					lineColor = '#1a3a5a';
				} else if (ballColor === 'pink') {
					// Pink theme
					primaryColor = '#FF69B4';
					darkColor = '#FF1493';
					lightColor = '#FFB6C1';
					lineColor = '#8B0A50';
				} else {
					// Default orange basketball
					primaryColor = '#E07B39';
					darkColor = '#C96A31';
					lightColor = '#F8A363';
					lineColor = '#1a1614';
				}

				// Draw soft shadow
				ctx.save();
				ctx.translate(r * 0.1, r * 0.1);
				ctx.beginPath();
				ctx.arc(0, 0, r, 0, 2 * Math.PI);
				ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
				ctx.filter = 'blur(10px)';
				ctx.fill();
				ctx.restore();

				// Create realistic sphere gradient
				const sphereGradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.1);
				sphereGradient.addColorStop(0, lightColor);
				sphereGradient.addColorStop(0.25, primaryColor);
				sphereGradient.addColorStop(0.7, darkColor);
				sphereGradient.addColorStop(1, currentBallColor === 'blue' ? '#2E5C8A' : currentBallColor === 'pink' ? '#C71585' : '#A85628');

				// Base sphere
				ctx.beginPath();
				ctx.arc(0, 0, r, 0, 2 * Math.PI);
				ctx.fillStyle = sphereGradient;
				ctx.fill();

				// Basketball seam lines - REAL pattern
				ctx.strokeStyle = lineColor;
				ctx.lineWidth = r * 0.04;
				ctx.lineCap = 'round';
				ctx.lineJoin = 'round';

				// Add subtle shadow to lines
				ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
				ctx.shadowBlur = 1;
				ctx.shadowOffsetX = 0.5;
				ctx.shadowOffsetY = 0.5;

				// REAL NBA PATTERN: 4 curved channels

				// Left channel (like a parenthesis)
				ctx.beginPath();
				ctx.moveTo(-r * 0.92, -r * 0.38);
				ctx.quadraticCurveTo(-r * 0.5, -r * 0.15, -r * 0.25, 0);
				ctx.quadraticCurveTo(-r * 0.5, r * 0.15, -r * 0.92, r * 0.38);
				ctx.stroke();

				// Right channel (mirrored)
				ctx.beginPath();
				ctx.moveTo(r * 0.92, -r * 0.38);
				ctx.quadraticCurveTo(r * 0.5, -r * 0.15, r * 0.25, 0);
				ctx.quadraticCurveTo(r * 0.5, r * 0.15, r * 0.92, r * 0.38);
				ctx.stroke();

				// Top horizontal channel
				ctx.beginPath();
				ctx.moveTo(-r * 0.38, -r * 0.92);
				ctx.quadraticCurveTo(-r * 0.15, -r * 0.5, 0, -r * 0.25);
				ctx.quadraticCurveTo(r * 0.15, -r * 0.5, r * 0.38, -r * 0.92);
				ctx.stroke();

				// Bottom horizontal channel
				ctx.beginPath();
				ctx.moveTo(-r * 0.38, r * 0.92);
				ctx.quadraticCurveTo(-r * 0.15, r * 0.5, 0, r * 0.25);
				ctx.quadraticCurveTo(r * 0.15, r * 0.5, r * 0.38, r * 0.92);
				ctx.stroke();

				// Subtle highlight for glossy leather
				ctx.shadowColor = 'transparent';
				ctx.shadowBlur = 0;
				const highlight = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 0, -r * 0.35, -r * 0.35, r * 0.55);
				highlight.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
				highlight.addColorStop(0.6, 'rgba(255, 255, 255, 0.08)');
				highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
				ctx.beginPath();
				ctx.arc(-r * 0.3, -r * 0.3, r * 0.5, 0, 2 * Math.PI);
				ctx.fillStyle = highlight;
				ctx.fill();

				// Draw time number
				ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
				ctx.shadowBlur = 5;
				ctx.shadowOffsetX = 2;
				ctx.shadowOffsetY = 2;

				ctx.font = `bold ${r * 0.62}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
				ctx.fillStyle = '#FFFFFF';
				ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
				ctx.lineWidth = r * 0.015;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.strokeText(ball.duration.toString(), 0, -r * 0.1);
				ctx.fillText(ball.duration.toString(), 0, -r * 0.1);

				// "min" label
				ctx.font = `600 ${r * 0.23}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
				ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
				ctx.shadowBlur = 3;
				ctx.lineWidth = r * 0.012;
				ctx.strokeText('min', 0, r * 0.3);
				ctx.fillText('min', 0, r * 0.3);

				ctx.restore();
			});
		});

		// Run physics
		const runner = Runner.create();
		runnerRef.current = runner;
		Runner.run(runner, engine);
		Render.run(render);

		setIsReady(true);

		// Handle window resize
		const handleResize = () => {
			const newWidth = container.clientWidth;
			const newHeight = container.clientHeight;

			render.options.width = newWidth;
			render.options.height = newHeight;
			render.canvas.width = newWidth * Math.min(window.devicePixelRatio, 2);
			render.canvas.height = newHeight * Math.min(window.devicePixelRatio, 2);
			render.canvas.style.width = `${newWidth}px`;
			render.canvas.style.height = `${newHeight}px`;

			// Update wall positions
			Body.setPosition(walls[0], { x: newWidth / 2, y: -30 });
			Body.setPosition(walls[1], { x: newWidth / 2, y: newHeight + 30 });
			Body.setPosition(walls[2], { x: -30, y: newHeight / 2 });
			Body.setPosition(walls[3], { x: newWidth + 30, y: newHeight / 2 });

			// Update focus zone
			Body.setPosition(focusZone, { x: newWidth / 2, y: newHeight / 2 });
		};

		window.addEventListener('resize', handleResize);

		// Cleanup - only on unmount
		return () => {
			window.removeEventListener('resize', handleResize);
			Events.off(engine);
			Events.off(render);
			Events.off(mouseConstraint);
			Render.stop(render);
			Runner.stop(runner);
			// Clean up net bodies and constraints
			if (netBodiesRef.current.length > 0) {
				netBodiesRef.current.forEach(body => {
					Composite.remove(engine.world, body);
				});
			}
			if (netConstraintsRef.current.length > 0) {
				netConstraintsRef.current.forEach(constraint => {
					Composite.remove(engine.world, constraint);
				});
			}
			Composite.clear(engine.world);
			Engine.clear(engine);
			render.canvas?.remove();
			render.textures = {};
		};
	}, []); // Only run once on mount

	// Update balls when type changes (without resetting positions)
	useEffect(() => {
		if (!engineRef.current || !renderRef.current || isFirstMountRef.current) return;

		const Engine = Matter.Engine;
		const Bodies = Matter.Bodies;
		const Body = Matter.Body;
		const Composite = Matter.Composite;
		const engine = engineRef.current;
		const container = sceneRef.current;
		const width = container.clientWidth || window.innerWidth;
		const height = container.clientHeight || window.innerHeight;

		// Remove old time balls
		const oldBalls = ballsRef.current;
		oldBalls.forEach(ball => {
			Composite.remove(engine.world, ball);
		});

		// Create new balls with same positions (preserve physics state)
		const spacing = width / (times.length + 1);
		const newBalls = [];
		const isMobile = width < 768;

		times.forEach((minutes, index) => {
			// Use responsive radius calculation
			const baseRadius = isMobile ? 18 : 25;
			const scaleFactor = isMobile ? 1.2 : 1.8;
			const radius = baseRadius + (minutes * scaleFactor);
			const colors = getBallGradient(minutes);

			// Try to preserve position from old ball, otherwise use default
			const oldBall = oldBalls[index];
			const x = spacing * (index + 1);
			const y = oldBall ? oldBall.position.y : height - radius - 80;

			const density = 0.001 * (minutes / 10);

			const ball = Bodies.circle(x, y, radius, {
				restitution: 0.7,
				friction: 0.05,
				frictionAir: 0.01,
				density: density,
				render: {
					fillStyle: colors.fill,
					strokeStyle: colors.stroke,
					lineWidth: 3
				},
				label: `time-${minutes}`
			});

			ball.duration = minutes;
			ball.isTimeBall = true;
			ball.radius = radius;

			// Preserve velocity from old ball if exists
			if (oldBall) {
				Body.setVelocity(ball, Body.getVelocity(oldBall));
			}

			newBalls.push(ball);
		});

		ballsRef.current = newBalls;
		Composite.add(engine.world, newBalls);
	}, [type, customTimes]); // Update when type or custom times change

	// Update ball color instantly (without recreating balls)
	useEffect(() => {
		ballColorRef.current = ballColor;
	}, [ballColor]);

	return (
		<div
			ref={sceneRef}
			style={{
				position: 'fixed',
				inset: 0,
				overflow: 'hidden',
				touchAction: 'none'
			}}
		>
			{/* Instruction overlay */}
			{isReady && (
				<div style={{
					position: 'absolute',
					bottom: '120px',
					left: '50%',
					transform: 'translateX(-50%)',
					fontSize: '0.875rem',
					color: '#a89b8a',
					pointerEvents: 'none',
					textAlign: 'center',
					zIndex: 10
				}}>
					<span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>👆</span>
					Topu sürükle ve merkeze bırak
				</div>
			)}
		</div>
	);
};

export default PhysicsWorld;
