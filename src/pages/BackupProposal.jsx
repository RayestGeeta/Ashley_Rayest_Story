import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Fireworks = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        canvas.width = width;
        canvas.height = height;

        const particles = [];
        // Disney Colors: Magic Blue, Princess Pink, Mickey Red, Gold, Tinkerbell Green, Purple
        const colors = ['#4ca9ff', '#ff69b4', '#ff0000', '#ffd700', '#76ff03', '#ffffff', '#9c27b0'];

        class Particle {
            constructor(x, y, color, velocity, type = 'standard') {
                this.x = x;
                this.y = y;
                this.color = color;
                this.velocity = velocity;
                this.alpha = 1;
                this.type = type;
                this.life = type === 'sparkle' ? Math.random() * 50 + 120 : Math.random() * 40 + 80; // Increased life substantially
                this.decay = type === 'sparkle' ? Math.random() * 0.005 + 0.003 : Math.random() * 0.008 + 0.008; 
                this.size = Math.random() * 2 + 1;
            }

            draw() {
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();

                // Sparkle effect
                if (this.type === 'sparkle' && Math.random() < 0.2) {
                    ctx.globalAlpha = this.alpha * 0.7;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffff';
                    ctx.fill();
                }
            }

            update() {
                this.velocity.x *= 0.96;
                this.velocity.y *= 0.96;
                this.velocity.y += 0.02; // lower gravity for floatier feel
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                this.alpha -= this.decay;
                this.life--;
            }
        }

        class Firework {
            constructor() {
                this.x = Math.random() * width;
                this.y = height;
                this.targetY = Math.random() * (height * 0.5) + height * 0.1;
                this.speed = Math.random() * 2 + 3; // Slower launch speed (was 3+5)
                this.angle = -Math.PI / 2 + (Math.random() * 0.2 - 0.1);
                this.vx = Math.cos(this.angle) * this.speed;
                this.vy = Math.sin(this.angle) * this.speed;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.exploded = false;
                this.particles = [];
            }

            draw() {
                if (!this.exploded) {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                }
                this.particles.forEach(p => p.draw());
            }

            update() {
                if (!this.exploded) {
                    this.x += this.vx;
                    this.y += this.vy;
                    
                    if (this.y <= this.targetY || this.vy >= 0) {
                        this.explode();
                    }
                }

                this.particles.forEach((p, index) => {
                    p.update();
                    if (p.alpha <= 0) this.particles.splice(index, 1);
                });
            }

            explode() {
                this.exploded = true;
                
                // 40% Chance for Character Shape (Mickey or Minnie)
                const rand = Math.random();
                if (rand < 0.2) {
                    this.createMickeyShape();
                } else if (rand < 0.4) {
                    this.createMinnieShape();
                } else {
                    this.createStandardExplosion();
                }
            }

            createStandardExplosion() {
                const particleCount = 250; // Dense explosion
                const type = Math.random() < 0.4 ? 'sparkle' : 'standard';
                
                for (let i = 0; i < particleCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 6 + 2; // High initial speed for large radius
                    const velocity = {
                        x: Math.cos(angle) * speed,
                        y: Math.sin(angle) * speed
                    };
                    this.particles.push(new Particle(this.x, this.y, this.color, velocity, type));
                }
            }

            createMickeyShape() {
                const headSize = 140; // Massive
                const earSize = 85;
                const earOffset = 130;

                // Main Head
                this.createCircleExplosion(this.x, this.y, headSize);
                // Left Ear
                this.createCircleExplosion(this.x - earOffset, this.y - earOffset, earSize);
                // Right Ear
                this.createCircleExplosion(this.x + earOffset, this.y - earOffset, earSize);
            }

            createMinnieShape() {
                const headSize = 140;
                const earSize = 85;
                const earOffset = 130;
                const bowColor = '#ff0044'; // Red/Pink Bow

                // Main Head
                this.createCircleExplosion(this.x, this.y, headSize);
                // Left Ear
                this.createCircleExplosion(this.x - earOffset, this.y - earOffset, earSize);
                // Right Ear
                this.createCircleExplosion(this.x + earOffset, this.y - earOffset, earSize);

                // The Bow (Triangle/Cluster on top)
                const bowY = this.y - earOffset; 
                this.createBowExplosion(this.x, bowY, 60, bowColor);
            }

            createBowExplosion(centerX, centerY, size, color) {
                const count = 40;
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    // Elliptical or clustered spread for bow
                    const speed = Math.random() * 1.5 + 0.5;
                    const velocity = {
                        x: Math.cos(angle) * speed * 2, // Wider X
                        y: Math.sin(angle) * speed * 0.8  // Flatter Y
                    };
                     this.particles.push(new Particle(centerX, centerY, color, velocity, 'sparkle'));
                }
            }

            createCircleExplosion(centerX, centerY, radius) {
                // Create a burst that maintains shape briefly
                const count = 50; // More particles for definition
                for (let i = 0; i < count; i++) {
                    const angle = (Math.PI * 2 / count) * i;
                    // Initial position is the center of the sub-explosion
                    // Velocity spreads out slightly from THAT center
                    const speed = Math.random() * 1.5 + 0.5; 
                    const velocity = {
                        x: Math.cos(angle) * speed,
                        y: Math.sin(angle) * speed
                    };
                    // Slight random offset to make it look organic
                    const px = centerX + Math.cos(angle) * (Math.random() * radius * 0.2); // Start slightly spread
                    const py = centerY + Math.sin(angle) * (Math.random() * radius * 0.2);
                    
                    this.particles.push(new Particle(px, py, this.color, velocity, 'standard'));
                }
            }
        }

        let fireworks = [];

        const animate = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // Slower trail fade (was 0.2)
            ctx.fillRect(0, 0, width, height);

            if (Math.random() < 0.008) { // Lowered spawn rate (was 0.02)
                fireworks.push(new Firework());
            }

            fireworks.forEach((fw, index) => {
                fw.update();
                fw.draw();
                if (fw.exploded && fw.particles.length === 0) {
                    fireworks.splice(index, 1);
                }
            });

            requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
};

const BackupProposal = () => {
    const navigate = useNavigate();
    const [clickedWrong, setClickedWrong] = useState(0);

    const handleCorrectOption = () => {
        // Add a small delay for a transition effect if desired, or instant
        navigate('/');
    };

    return (
        <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center text-white">
            {/* Background Image */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ 
                    backgroundImage: 'url("https://images.unsplash.com/photo-1498931299472-f7a63a029763?q=80&w=2070&auto=format&fit=crop")',
                    filter: 'brightness(0.6)'
                }}
            />
            
            {/* Overlay Gradient for better text readability */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

            {/* Fireworks Effect */}
            <Fireworks />

            {/* Content */}
            <div className="relative z-10 text-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="mb-12"
                >
                    <h1 className="text-4xl md:text-7xl font-bold mb-6 font-serif tracking-wide leading-relaxed bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(236,72,153,0.6)]">
                        你愿意开启<br className="md:hidden" />和我的故事嘛？
                    </h1>
                    <p className="text-lg md:text-2xl text-pink-100/90 font-light tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                        2025.12.31 · Hong Kong Disneyland
                    </p>
                </motion.div>

                <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                    {/* Option 1: No Reaction */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setClickedWrong(prev => prev + 1)}
                        className="px-8 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all text-lg font-medium min-w-[160px]"
                    >
                        好~
                    </motion.button>

                    {/* Option 2: No Reaction */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setClickedWrong(prev => prev + 1)}
                        className="px-8 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all text-lg font-medium min-w-[160px]"
                    >
                        好！
                    </motion.button>

                    {/* Option 3: The Real Deal */}
                    <motion.button
                        initial={{ scale: 1 }}
                        animate={{ 
                            scale: [1, 1.05, 1],
                            boxShadow: [
                                "0 0 0px rgba(236, 72, 153, 0)",
                                "0 0 20px rgba(236, 72, 153, 0.5)",
                                "0 0 0px rgba(236, 72, 153, 0)"
                            ]
                        }}
                        transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            repeatType: "reverse" 
                        }}
                        whileHover={{ scale: 1.1, backgroundColor: "rgba(236, 72, 153, 0.8)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCorrectOption}
                        className="px-10 py-4 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-[0_0_30px_rgba(236,72,153,0.4)] text-xl font-bold min-w-[200px] border border-white/20"
                    >
                        当然好！！！
                    </motion.button>
                </div>
            </div>
            
            {/* Floating particles effect (simple css based) */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-white rounded-full opacity-60"
                        style={{
                            width: Math.random() * 4 + 1 + 'px',
                            height: Math.random() * 4 + 1 + 'px',
                            left: Math.random() * 100 + '%',
                            top: Math.random() * 100 + '%',
                        }}
                        animate={{
                            y: [0, -100],
                            opacity: [0, 1, 0]
                        }}
                        transition={{
                            duration: Math.random() * 5 + 3,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 5
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default BackupProposal;
