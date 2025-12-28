import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const AircraftWarGame = () => {
    const canvasRef = useRef(null);
    const [gameState, setGameState] = useState('start'); // start, playing, paused, gameover, victory
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [life, setLife] = useState(0); // Will be set based on boss
    const [message, setMessage] = useState('');

    const [weaponLevel, setWeaponLevel] = useState(0);
    const [zCount, setZCount] = useState(3);
    const [xCount, setXCount] = useState(3);

    // Game constants matching C code
    const FRAME_X = 5;
    const FRAME_Y = 5;
    const WIDE = 20;
    const HIGH = 20;
    const MAX_X = 47;
    const MAX_Y = 25;
    
    // Game State Refs (to avoid re-renders during game loop)
    const gameRef = useRef({
        grid: Array(MAX_X).fill().map(() => Array(MAX_Y).fill(0)),
        plane: {
            x: [0, WIDE, 0], // Head x
            X: [0, FRAME_Y + HIGH - 3, 0], // Head y
            z: [WIDE - 1, 0, WIDE + 1], // Body x
            Z: [FRAME_Y + HIGH - 1, 0, FRAME_Y + HIGH - 1], // Body y
            y: [WIDE - 1, WIDE, WIDE + 1], // Tail x
            Y: [FRAME_Y + HIGH - 2, FRAME_Y + HIGH - 2, FRAME_Y + HIGH - 2], // Tail y
        },
        enemies1: [], // Meteors
        enemies2: [], // Small planes
        enemies3: [], // Big planes
        boss: { active: false, type: 0, x: 0, y: 0, life: 0, dir: 1, moveCounter: 0 },
        bullets: [],
        weapon: 0, // 0: normal, 1: double, 2: strong
        nirvana: [3, 3], // Z, X skills
        score: 0,
        level: 1,
        frameCount: 0,
        speed: 5,
        ispeed: 7000, // This was used for delay loops in C, we'll adapt
        enemySpeedCounters: [0, 0, 0], // For different enemy types
        flag: 0, // Boss phase flag
        T: 0, // Timer marker for freezing
        iflag: 0, // Freeze flag
        spawnRates: { e1: 8, e2: 3, e3: 2 }, // Max counts
        keys: {}
    });

    const requestRef = useRef();

    useEffect(() => {
        const handlePKey = (e) => {
             if (e.key === 'p' || e.key === 'P') {
                 setGameState(prev => prev === 'playing' ? 'paused' : (prev === 'paused' ? 'playing' : prev));
             }
        };
        window.addEventListener('keydown', handlePKey);
        return () => window.removeEventListener('keydown', handlePKey);
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(requestRef.current);
        };
    }, []);

    useEffect(() => {
        if (gameState === 'playing') {
            requestRef.current = requestAnimationFrame(gameLoop);
        } else {
            cancelAnimationFrame(requestRef.current);
        }
    }, [gameState]);

    const handleKeyDown = (e) => {
        gameRef.current.keys[e.key] = true;
        // Manual fire is still supported, but auto-fire in loop handles continuous
        if (e.code === 'Space' && !gameRef.current.keys['Space_held']) {
             fireBullet();
             gameRef.current.keys['Space_held'] = true;
        }
        if (e.key === 'z' || e.key === 'Z') useNirvanaZ();
        if (e.key === 'x' || e.key === 'X') useNirvanaX();
    };

    const handleKeyUp = (e) => {
        gameRef.current.keys[e.key] = false;
        if (e.code === 'Space') gameRef.current.keys['Space_held'] = false;
    };

    const initGame = () => {
        const g = gameRef.current;
        // Reset Grid
        for(let i=0; i<MAX_X; i++) for(let j=0; j<MAX_Y; j++) g.grid[i][j] = 0;
        
        // Init Plane
        g.plane = {
            head: { x: WIDE, y: FRAME_Y + HIGH - 3 },
            body: { x: WIDE - 1, y: FRAME_Y + HIGH - 1 },
            rightWing: { x: WIDE + 1, y: FRAME_Y + HIGH - 1 },
            tail: [
                { x: WIDE - 1, y: FRAME_Y + HIGH - 2 },
                { x: WIDE, y: FRAME_Y + HIGH - 2 },
                { x: WIDE + 1, y: FRAME_Y + HIGH - 2 }
            ]
        };
        
        // Update grid with plane
        updatePlaneGrid(g.plane);

        g.score = 0;
        g.level = 1;
        g.weapon = 0;
        g.nirvana = [3, 3];
        g.flag = 0;
        g.spawnRates = { e1: 8, e2: 3, e3: 2 };
        g.enemies1 = [];
        g.enemies2 = [];
        g.enemies3 = [];
        g.boss = { active: false, type: 0 };
        
        // Initial Enemies
        spawnEnemy1(g);
        spawnEnemy2(g);
        spawnEnemy3(g);

        setScore(0);
        setLevel(1);
        setWeaponLevel(0);
        setZCount(3);
        setXCount(3);
        setMessage('');
        setGameState('playing');
    };

    const updatePlaneGrid = (plane, clear = false) => {
        const g = gameRef.current;
        const val = clear ? 0 : 1;
        
        // Helper to safely set grid
        const set = (x, y) => {
            if (x >= 0 && x < MAX_X && y >= 0 && y < MAX_Y) g.grid[x][y] = val;
        };

        set(plane.head.x, plane.head.y);
        set(plane.body.x, plane.body.y);
        set(plane.rightWing.x, plane.rightWing.y);
        plane.tail.forEach(p => set(p.x, p.y));
    };

    const checkItemPickup = (g) => {
        // Check player body parts for collision with items
        // Items are negative numbers
        const parts = [
            g.plane.head, g.plane.body, g.plane.rightWing, ...g.plane.tail
        ];
        
        for (const part of parts) {
            const val = g.grid[part.x][part.y];
            if (val < 0) {
                applyItem(g, val);
                // Clear item from grid is handled by updatePlaneGrid overwriting it?
                // Actually no, because we move the plane on top of it.
                // But the value in the grid *at that moment* is the item.
                // Wait, movePlane does updatePlaneGrid(clear=true) then updatePlaneGrid(clear=false).
                // So the item value is lost when plane moves over it.
                // We need to check BEFORE moving or check current plane position against items.
                // The issue is: movePlane clears the old position and sets the new position to 1 (Player).
                // So we can't see the item anymore if we just moved.
                // However, we can check for items during the move logic or scan the area around the player.
                
                // Better approach: When moving, check the target cell for items.
            }
        }
    };

    const applyItem = (g, itemVal) => {
        if (itemVal === -1) { // Z
            g.nirvana[0]++;
            setZCount(g.nirvana[0]);
            setMessage("MISSILE +1");
        } else if (itemVal === -2) { // X
            g.nirvana[1]++;
            setXCount(g.nirvana[1]);
            setMessage("BOMB +1");
        } else if (itemVal === -3) { // UP
            if (g.weapon < 2) {
                g.weapon++;
                setWeaponLevel(g.weapon);
                setMessage("WEAPON UP!");
            }
        } else if (itemVal === -4) { // ST
             // Stop enemies logic
             g.iflag = 1;
             g.T = g.score;
             g.spawnRates = { e1:0, e2:0, e3:0 }; // Stop spawning
             setMessage("TIME FREEZE!");
        }
        setTimeout(() => setMessage(''), 1000);
    };

    const movePlane = (dx, dy) => {
        const g = gameRef.current;
        const p = g.plane;

        // Check bounds (simplified)
        if (p.head.x + dx < FRAME_X + 3 || p.head.x + dx >= FRAME_Y + WIDE * 2) return;
        if (p.head.y + dy < FRAME_Y + 1 || p.head.y + dy >= FRAME_Y + HIGH - 2) return;

        // Check for items at new positions
        // We only need to check the "leading edge" of the movement, but checking all parts is safer/easier
        const newParts = [
            {x: p.head.x + dx, y: p.head.y + dy},
            {x: p.body.x + dx, y: p.body.y + dy},
            {x: p.rightWing.x + dx, y: p.rightWing.y + dy},
            ...p.tail.map(t => ({x: t.x + dx, y: t.y + dy}))
        ];

        for (const part of newParts) {
            const val = g.grid[part.x][part.y];
            if (val < 0) {
                applyItem(g, val);
                g.grid[part.x][part.y] = 0; // Consume item
            }
        }

        updatePlaneGrid(p, true); // Clear old pos

        p.head.x += dx; p.head.y += dy;
        p.body.x += dx; p.body.y += dy;
        p.rightWing.x += dx; p.rightWing.y += dy;
        p.tail.forEach(t => { t.x += dx; t.y += dy; });

        updatePlaneGrid(p, false); // Set new pos
    };

    const fireBullet = () => {
        const g = gameRef.current;
        const p = g.plane;
        const x = p.head.x;
        const y = p.head.y - 1;

        if (g.weapon === 0) {
            if (g.grid[x][y] === 0 || g.grid[x][y] === 3 || g.grid[x][y] === 4 || g.grid[x][y] === 5) 
                g.grid[x][y] = 2; 
        } else if (g.weapon === 1) {
             // Double
             if(x-1 >= 0) g.grid[x-1][y] = 2;
             if(x+1 < MAX_X) g.grid[x+1][y] = 2;
        } else if (g.weapon === 2) {
            // Strong
            if(x-1 >= 0) g.grid[x-1][y] = 2;
            g.grid[x][y] = 2;
            if(x+1 < MAX_X) g.grid[x+1][y] = 2;
        }
    };

    const useNirvanaZ = () => {
        const g = gameRef.current;
        if (g.nirvana[0] > 0) {
            const y = g.plane.head.y - 1;
            for(let i=7; i<46; i++) {
                if (g.grid[i][y] !== 1) g.grid[i][y] = 2;
            }
            g.nirvana[0]--;
            setZCount(g.nirvana[0]);
        }
    };

    const useNirvanaX = () => {
        const g = gameRef.current;
        if (g.nirvana[1] > 0) {
            for(let i=7; i<46; i++) {
                for(let j=6; j<24; j++) {
                    if(g.grid[i][j] === 3) g.grid[i][j+2] = 2; // Turn meteors into bullets? Or just destroy logic
                }
            }
            g.nirvana[1]--;
            setXCount(g.nirvana[1]);
        }
    };

    const spawnEnemy1 = (g) => {
        // Meteorites
        // Re-populating if needed
        let currentCount = 0;
        // Optimization: Don't scan the whole grid every time, maintain a counter or just trust probability
        // Scanning is safer for now but lets fix the bounds
        for(let i=7; i<46; i++) for(let j=6; j<24; j++) if(g.grid[i][j] === 3) currentCount++;
        
        // Always try to spawn if below cap, but with a per-frame chance to avoid instant flooding
        if(currentCount < g.spawnRates.e1 && Math.random() < 0.1) {
            const x = Math.floor(Math.random() * 39) + 7;
            const y = Math.floor(Math.random() * 2) + 6; // Spawn at top area
            if(g.grid[x][y] === 0) {
                g.grid[x][y] = 3;
            }
        }
    };

    const spawnEnemy2 = (g) => {
        // Small planes (Type 4) - Basic chasers
        let currentCount = 0;
        for(let i=7; i<46; i++) for(let j=6; j<24; j++) if(g.grid[i][j] === 4) currentCount++;

        if (currentCount < g.spawnRates.e2 && Math.random() < 0.02) {
             const x = Math.floor(Math.random() * 39) + 7;
             const y = 6; 
             if(g.grid[x][y] === 0) g.grid[x][y] = 4;
        }
    };
    
    const spawnEnemy3 = (g) => {
         // Big planes (Type 5) - Slower but tougher?
         let currentCount = 0;
         for(let i=7; i<46; i++) for(let j=6; j<24; j++) if(g.grid[i][j] === 5) currentCount++;
 
         if (currentCount < g.spawnRates.e3 && Math.random() < 0.01) {
              const x = Math.floor(Math.random() * 39) + 7;
              const y = 6; 
              if(g.grid[x][y] === 0) g.grid[x][y] = 5;
         }
    };

    // --- Boss Logic (Simplified) ---
    const initBoss1 = (g) => {
        g.boss = { active: true, type: 1, x: 20 + FRAME_X, y: FRAME_Y + 4, life: 51, dir: -1, moveCounter: 10 };
        // Draw boss 1 on grid... (omitted for brevity, will rely on draw loop to visualize or just simple marker)
        // Actually, the C code draws it into the grid as 6.
        drawBoss1(g, g.boss.x, g.boss.y);
        setLife(51);
        setMessage("BOSS WARNING: MOTHERSHIP INCOMING!");
    };

    const drawBoss1 = (g, x, y) => {
        // 6 is Boss 1
        if(x<0 || x>=MAX_X || y<0 || y>=MAX_Y) return;
        g.grid[x][y] = 6;
        // Simplified shape
        for(let i=x-1; i<=x+1; i++) g.grid[i][y-1] = 6;
        for(let i=x-2; i<=x+2; i++) g.grid[i][y-2] = 6;
    };
    
    const clearBoss1 = (g, x, y) => {
         g.grid[x][y] = 0;
         for(let i=x-1; i<=x+1; i++) g.grid[i][y-1] = 0;
         for(let i=x-2; i<=x+2; i++) g.grid[i][y-2] = 0;
    };

    // --- Improved Controls ---
    // Instead of direct grid updates, we'll use a continuous movement loop with velocity
    // but sticking to the grid-based nature for now to preserve core logic, 
    // just smoothing the input handling.
    
    // We already have handleKeyDown/Up updating a keys object.
    // In gameLoop, we check keys and move.
    // To make it smoother, we can increase frame rate or update position more frequently.
    // Currently gameLoop uses requestAnimationFrame.
    
    // Let's refine the movement speed.
    // We can add a move delay to prevent 'too fast' movement on 60fps
    
    // Add movement cooldown to gameRef
    // g.moveCooldown = 0;
    
    const gameLoop = () => {
        const g = gameRef.current;
        if (gameState !== 'playing') return; // Double check state
        
        const keys = g.keys;

        // Player Movement with Cooldown for smoother but controlled speed
        if (!g.moveCooldown) g.moveCooldown = 0;
        
        if (g.moveCooldown <= 0) {
            let moved = false;
            // Allow diagonal movement
            let dx = 0;
            let dy = 0;
            
            if (keys['ArrowUp'] || keys['w'] || keys['W']) dy = -1;
            if (keys['ArrowDown'] || keys['s'] || keys['S']) dy = 1;
            if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx = -1;
            if (keys['ArrowRight'] || keys['d'] || keys['D']) dx = 1;
            
            if (dx !== 0 || dy !== 0) {
                movePlane(dx, dy);
                moved = true;
            }
            
            if (moved) g.moveCooldown = 2; // Move every 2 frames (~30fps effective speed)
        } else {
            g.moveCooldown--;
        }

        // Auto-fire if space is held (for better playability)
        if (keys[' '] || keys['Space']) {
             if (g.frameCount % 5 === 0) fireBullet();
        }

        // Update Game Logic
        g.frameCount++;
        
        // Enemy Logic Update Speed
        // Slower speed: Start at 30 frames per move, decrease as score increases
        const updateSpeed = Math.max(5, 30 - Math.floor(g.score / 50));
        
        if (g.frameCount % updateSpeed === 0) {
            updateEnemies(g);
        }

        // Bullet Updates (slower than before, every 5 frames)
        if (g.frameCount % 5 === 0) {
            updateBullets(g);
        }

        // Boss Logic
        checkBossSpawns(g);
        if (g.boss.active) updateBoss(g);

        // Score Items
        // Drastically reduced spawn rate from 100 to 500 frames (~8 seconds)
        if (g.frameCount % 500 === 0) {
            spawnItem(g);
        }

        draw();
        setScore(g.score);
        requestRef.current = requestAnimationFrame(gameLoop);
    };

    const updateBullets = (g) => {
        // Scan grid for bullets (2) moving up
        // Need to scan from top to bottom to avoid double moves
        for(let j=6; j<24; j++) { // Loop direction important? C: for j=6; j<24
             for(let i=7; i<46; i++) {
                 if (g.grid[i][j] === 2) {
                     // Check collision with enemy at j-1
                     if (j-1 >= 0) {
                         const target = g.grid[i][j-1];
                         if (target >= 3 && target <= 8) {
                             handleHit(g, i, j-1, target);
                             g.grid[i][j] = 0; // Bullet gone
                         } else if (j > 6) {
                             g.grid[i][j-1] = 2;
                             g.grid[i][j] = 0;
                         } else {
                             g.grid[i][j] = 0; // Out of bounds
                         }
                     }
                 }
             }
        }
    };

    const handleHit = (g, x, y, type) => {
        if (type === 3) { // Meteor
            g.score++;
            g.grid[x][y] = 0;
            spawnEnemy1(g); // Respawn immediately
        } else if (type === 4 || type === 5) { // Enemy planes
            g.score += 2;
            // Clear enemy shape (simplified)
            g.grid[x][y] = 0;
            // Respawn logic would be here
        } else if (type === 6 || type === 7 || type === 8) { // Boss
             g.boss.life--;
             setLife(g.boss.life);
             if (g.boss.life <= 0) {
                 // Boss Dead
                 g.boss.active = false;
                 clearBoss1(g, g.boss.x, g.boss.y); // Assuming boss 1 for now
                 g.score += 50;
                 g.level++;
                 setLevel(g.level);
                 setMessage("ROUND CLEARED!");
                 setTimeout(() => setMessage(''), 2000);
                 // Reset spawns
                 g.spawnRates = { e1: 8, e2: 3, e3: 2 };
             }
        }
    };

    const updateEnemies = (g) => {
        // Generic enemy mover (scans grid and moves types 3, 4, 5 down)
        // Scan bottom to top
        for(let j=23; j>=6; j--) {
            for(let i=7; i<46; i++) {
                const val = g.grid[i][j];
                if (val >= 3 && val <= 5) { // 3: Meteor, 4: Enemy1, 5: Enemy2
                    g.grid[i][j] = 0;
                    
                    // Move logic
                    // Meteors (3) just fall straight
                    // Enemies (4,5) could track player? For now just fall straight + wobble
                    
                    let nextX = i;
                    let nextY = j + 1;
                    
                    if (val === 4 && Math.random() < 0.3) {
                         // Wobble
                         nextX += Math.random() < 0.5 ? -1 : 1;
                         if(nextX < 7) nextX = 7;
                         if(nextX > 45) nextX = 45;
                    }

                    if (nextY < 24) {
                        // Check player collision
                        if (g.grid[nextX][nextY] === 1) gameOver();
                        else if (g.grid[nextX][nextY] === 0) g.grid[nextX][nextY] = val;
                        // Else blocked, stay put or vanish? Vanish for now to avoid stacking
                    } 
                }
            }
        }
        
        // Spawn/Replenish
        spawnEnemy1(g);
        spawnEnemy2(g);
        spawnEnemy3(g);
    };
    
    const updateBoss = (g) => {
        if (g.frameCount % 10 !== 0) return;
        
        clearBoss1(g, g.boss.x, g.boss.y);
        
        if (g.boss.moveCounter > 0) {
            g.boss.x += g.boss.dir;
            g.boss.moveCounter--;
        } else {
            g.boss.dir *= -1;
            g.boss.moveCounter = 20;
        }
        
        drawBoss1(g, g.boss.x, g.boss.y);
        
        // Boss fire
        if (Math.random() < 0.05) {
            if(g.boss.y + 1 < MAX_Y) g.grid[g.boss.x][g.boss.y+1] = 10;
        }
    };

    const checkBossSpawns = (g) => {
        if (g.boss.active) return;
        if (g.score > 100 && g.flag === 0) {
            g.flag = 1;
            // Clear screen
            for(let i=7; i<46; i++) for(let j=6; j<24; j++) if(g.grid[i][j] !== 1) g.grid[i][j] = 0;
            initBoss1(g);
        }
    };

    const spawnItem = (g) => {
        const i = Math.floor(Math.random() * 31) + 10;
        const j = Math.floor(Math.random() * 20) + 10;
        // -1: Z, -2: X, -3: *, -4: &
        g.grid[i][j] = -(Math.floor(Math.random() * 4) + 1); 
    };

    const gameOver = () => {
        setGameState('gameover');
        // Clear all intervals/frames
        cancelAnimationFrame(requestRef.current);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const g = gameRef.current;

        // Clear
        ctx.fillStyle = '#021025';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Frame
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(FRAME_X * 15, FRAME_Y * 15, (WIDE * 2 + 1) * 15, HIGH * 15);

        // Draw Grid
        ctx.font = '15px monospace';
        for(let i=0; i<MAX_X; i++) {
            for(let j=0; j<MAX_Y; j++) {
                const val = g.grid[i][j];
                const x = i * 15;
                const y = j * 15;

                if (val === 0) continue;
                
                if (val === 1) { // Player
                    ctx.fillStyle = '#00ff00';
                    ctx.fillText('✈', x, y);
                } else if (val === 2) { // Bullet
                    ctx.fillStyle = '#ffff00';
                    ctx.fillText('|', x, y);
                } else if (val === 3) { // Meteor
                    ctx.fillStyle = '#888';
                    ctx.fillText('$', x, y);
                } else if (val === 4) { // Enemy 1
                    ctx.fillStyle = '#ff0000';
                    ctx.fillText('x', x, y);
                } else if (val === 5) { // Enemy 2
                    ctx.fillStyle = '#ff00ff';
                    ctx.fillText('X', x, y);
                } else if (val === 6 || val === 7 || val === 8) { // Boss
                    ctx.fillStyle = '#ff0000';
                    ctx.font = 'bold 15px monospace';
                    ctx.fillText('W', x, y);
                    ctx.font = '15px monospace';
                } else if (val === 10) { // Enemy Bullet
                    ctx.fillStyle = '#ff8800';
                    ctx.fillText('*', x, y);
                } else if (val < 0) { // Items
                    ctx.fillStyle = '#00ffff';
                    const items = { '-1': 'Z', '-2': 'X', '-3': 'UP', '-4': 'ST' };
                    ctx.fillText(items[val] || '?', x, y);
                }
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-2xl">
            <div className="flex justify-between w-full max-w-2xl mb-4 text-white font-mono">
                <div>SCORE: {score}</div>
                <div>LEVEL: {level}</div>
                <div className="flex gap-4">
                     <span className="text-cyan-400">WEAPON: LV{weaponLevel+1}</span>
                     <span className="text-green-400">Z: {zCount}</span>
                     <span className="text-green-400">X: {xCount}</span>
                </div>
                <div>BOSS HP: {life > 0 ? life : '-'}</div>
            </div>
            
            <div className="relative">
                <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={500} 
                    className="bg-black rounded border border-gray-600 shadow-[0_0_15px_rgba(0,255,0,0.2)]"
                />

                {gameState === 'playing' && (
                    <button 
                        onClick={() => setGameState('paused')}
                        className="absolute top-4 right-4 p-3 bg-yellow-600/20 hover:bg-yellow-600/40 rounded-full border border-yellow-500/30 transition-all text-yellow-400 z-10"
                        title="Pause Game (P)"
                    >
                        <Pause size={24} />
                    </button>
                )}
                
                {/* Pause / Restart Overlay */}
                {(gameState !== 'playing') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-10 backdrop-blur-sm">
                        {gameState === 'gameover' && <h2 className="text-5xl text-red-500 font-bold mb-2 animate-bounce">GAME OVER</h2>}
                        {gameState === 'gameover' && <div className="text-2xl text-yellow-400 mb-8 font-mono">FINAL SCORE: {score}</div>}
                        
                        {gameState === 'start' && (
                            <div className="text-center mb-8">
                                <h2 className="text-5xl text-green-500 font-bold mb-2 tracking-wider">AIRCRAFT WAR</h2>
                                <p className="text-cyan-400 font-mono tracking-widest">REACT EDITION</p>
                            </div>
                        )}
                        
                        {gameState === 'paused' && <h2 className="text-4xl text-yellow-400 font-bold mb-8">PAUSED</h2>}
                        
                        <div className="flex gap-4">
                            <button 
                                onClick={initGame}
                                className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-500 rounded-full font-bold text-lg transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-105 active:scale-95"
                            >
                                {gameState === 'start' ? <Play size={24}/> : <RotateCcw size={24}/>}
                                {gameState === 'start' ? 'START MISSION' : 'RESTART MISSION'}
                            </button>
                            
                            {gameState === 'playing' && (
                                <button 
                                    onClick={() => setGameState('paused')}
                                    className="p-4 bg-yellow-600/20 hover:bg-yellow-600/40 rounded-full border border-yellow-500/30 transition-all hidden"
                                >
                                    <Pause size={24} />
                                </button>
                            )}
                        </div>
                        
                        {gameState === 'start' && (
                        <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10 max-w-md w-full">
                            <h3 className="text-xl font-bold text-yellow-400 mb-4 border-b border-white/10 pb-2 flex justify-between">
                                <span>MISSION BRIEFING</span>
                                <span className="text-xs font-normal text-gray-500 self-end">TOP SECRET</span>
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-6 text-sm text-gray-300 text-left font-mono">
                                <div className="space-y-3">
                                    <div className="font-bold text-white mb-1 border-b border-green-500/30 inline-block">CONTROLS</div>
                                    <div className="flex justify-between"><span>MOVE</span> <span className="text-green-400">WASD / ↑↓←→</span></div>
                                    <div className="flex justify-between"><span>SHOOT</span> <span className="text-green-400">SPACE (Hold)</span></div>
                                    <div className="flex justify-between"><span>MISSILE</span> <span className="text-green-400">Z Key</span></div>
                                    <div className="flex justify-between"><span>BOMB</span> <span className="text-green-400">X Key</span></div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="font-bold text-white mb-1 border-b border-cyan-500/30 inline-block">INTEL</div>
                                    <div className="flex items-center gap-2"><span className="text-gray-400">$</span> <span>Meteor</span></div>
                                    <div className="flex items-center gap-2"><span className="text-red-500">W</span> <span>Boss Ship</span></div>
                                    <div className="flex items-center gap-2"><span className="text-cyan-400">UP</span> <span>Weapon +</span></div>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                )}
                
                {message && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-400 text-2xl font-bold animate-pulse pointer-events-none">
                        {message}
                    </div>
                )}
            </div>

            <div className="mt-4 text-gray-500 text-xs font-mono">
                Ported from C to React
            </div>
        </div>
    );
};

export default AircraftWarGame;
