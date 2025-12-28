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
        if (e.code === 'Space') {
            fireBullet();
        }
        if (e.key === 'z' || e.key === 'Z') useNirvanaZ();
        if (e.key === 'x' || e.key === 'X') useNirvanaX();
    };

    const handleKeyUp = (e) => {
        gameRef.current.keys[e.key] = false;
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
        for(let i=7; i<46; i++) for(let j=6; j<24; j++) if(g.grid[i][j] === 3) currentCount++;
        
        while(currentCount < g.spawnRates.e1) {
            const x = Math.floor(Math.random() * 39) + 7;
            const y = Math.floor(Math.random() * 2) + 6;
            if(g.grid[x][y] === 0) {
                g.grid[x][y] = 3;
                currentCount++;
            } else {
                break; // avoid infinite loop
            }
        }
    };

    const spawnEnemy2 = (g) => {
        // Small planes
        let currentCount = 0; // Simplified counting
        // In real port, we'd track objects, but grid scan is okay for now
        // Or just trust the loop updates
    };
    
    const spawnEnemy3 = (g) => {};

    // --- Boss Logic (Simplified) ---
    const initBoss1 = (g) => {
        g.boss = { active: true, type: 1, x: 20 + FRAME_X, y: FRAME_Y + 4, life: 51, dir: -1, moveCounter: 10 };
        // Draw boss 1 on grid... (omitted for brevity, will rely on draw loop to visualize or just simple marker)
        // Actually, the C code draws it into the grid as 6.
        drawBoss1(g, g.boss.x, g.boss.y);
        setLife(51);
        setMessage("The FIRST BOSS is coming!!!");
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

    const gameLoop = () => {
        const g = gameRef.current;
        const keys = g.keys;

        // Player Movement
        if (keys['ArrowUp'] || keys['w'] || keys['W']) movePlane(0, -1);
        if (keys['ArrowDown'] || keys['s'] || keys['S']) movePlane(0, 1);
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) movePlane(-1, 0);
        if (keys['ArrowRight'] || keys['d'] || keys['D']) movePlane(1, 0);

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
        if (g.frameCount % 100 === 0) {
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
        // Move Meteors (3) down
        // Scan bottom to top
        for(let j=23; j>=6; j--) {
            for(let i=7; i<46; i++) {
                if (g.grid[i][j] === 3) {
                    g.grid[i][j] = 0;
                    if (j+1 < 24) {
                        // Check player collision
                        if (g.grid[i][j+1] === 1) gameOver();
                        else g.grid[i][j+1] = 3;
                    } else {
                        // Respawn at top
                        const nx = Math.floor(Math.random() * 39) + 7;
                        g.grid[nx][6] = 3;
                    }
                }
            }
        }
        
        // Spawn/Replenish Meteors
        spawnEnemy1(g);
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
                
                {gameState !== 'playing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
                        {gameState === 'gameover' && <h2 className="text-4xl text-red-500 font-bold mb-4">GAME OVER</h2>}
                        {gameState === 'start' && <h2 className="text-4xl text-green-500 font-bold mb-4">AIRCRAFT WAR</h2>}
                        
                        <button 
                            onClick={initGame}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-full font-bold transition-all"
                        >
                            {gameState === 'start' ? <Play size={20}/> : <RotateCcw size={20}/>}
                            {gameState === 'start' ? 'START GAME' : 'RESTART'}
                        </button>
                        
                        <div className="mt-8 p-6 bg-white/10 rounded-xl backdrop-blur-sm max-w-md w-full">
                            <h3 className="text-xl font-bold text-yellow-400 mb-4 border-b border-white/20 pb-2">Mission Control</h3>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 text-left font-mono">
                                <div className="space-y-2">
                                    <div className="font-bold text-white mb-1">CONTROLS</div>
                                    <div><span className="text-green-400">WASD / Arrows</span> : Move</div>
                                    <div><span className="text-green-400">SPACE</span> : Shoot</div>
                                    <div><span className="text-green-400">Z</span> : Missile Barrage</div>
                                    <div><span className="text-green-400">X</span> : Clear Screen</div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="font-bold text-white mb-1">LEGEND</div>
                                    <div><span className="text-gray-400">$</span> : Meteor (Avoid!)</div>
                                    <div><span className="text-cyan-400">UP</span> : Upgrade Weapon</div>
                                    <div><span className="text-cyan-400">ST</span> : Freeze Enemies</div>
                                    <div><span className="text-red-500">W</span> : Boss Enemy</div>
                                </div>
                            </div>
                            
                            <div className="mt-4 text-xs text-gray-500 italic border-t border-white/10 pt-2">
                                Tip: Defeat bosses to clear rounds. Collect items to survive!
                            </div>
                        </div>
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
