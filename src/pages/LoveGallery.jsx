import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Masonry from 'react-masonry-css';
import MessageWall from '../components/MessageWall';
import { Heart, Upload, X, Camera, Grid, Layout, MapPin, Calendar, Save, MessageSquare, Quote, Minus, Square, HeartHandshake, Cloud } from 'lucide-react';
import { fileToBase64 } from '../utils/fileHelpers';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import galleryDataJSON from '../data/galleryData.json';
import messagesData from '../data/messages.json';
import wordCloudData from '../data/wordCloudData.json';
import { IS_EDIT_MODE, USE_RANDOM_DATA_IF_EMPTY } from '../config';
import WordCloud from '../components/WordCloud';

const LoveGallery = () => {
    // Default to 'wall' view in View Mode
    const [viewMode, setViewMode] = useState('wall'); 
    const [messages, setMessages] = useState([]);
    const [messagePositions, setMessagePositions] = useState([]);

    // Generate random scattered positions
    const randomizePositions = (msgs) => {
        return msgs.map(msg => ({
            ...msg,
            x: Math.random() * 80, // 0-80%
            y: Math.random() * 60, // 0-60%
            zIndex: Math.floor(Math.random() * 10)
        }));
    };

    // Generate Heart Positions (Extracted for reuse)
    const generateHeartShape = (count) => {
        const positions = [];
        const numCandidates = 30; // Increased to find better spots

        // Heart boundary function
        const isInsideHeart = (x, y) => {
            y = y - 0.1;
            x = x * 1.2; 
            const a = x * x + y * y - 1;
            return a * a * a - x * x * y * y * y <= 0;
        };

        for (let i = 0; i < count; i++) {
            let bestCandidate = null;
            let maxDist = -1;

            for (let j = 0; j < numCandidates; j++) {
                let x, y, inside = false;
                for(let k=0; k<20; k++) {
                    x = (Math.random() * 4) - 2; 
                    y = (Math.random() * 4) - 2; 
                    if(isInsideHeart(x, -y)) { 
                        inside = true;
                        break;
                    }
                }
                
                if (!inside) continue; 

                let minDist = Number.MAX_VALUE;
                if (positions.length === 0) {
                    minDist = Number.MAX_VALUE;
                } else {
                    for (const p of positions) {
                        const d = Math.hypot(x - p.x, y - p.y);
                        if (d < minDist) minDist = d;
                    }
                }

                if (minDist > maxDist) {
                    maxDist = minDist;
                    bestCandidate = { x, y };
                }
            }
            if (bestCandidate) positions.push(bestCandidate);
            else positions.push({ x: 0, y: 0 });
        }
        return positions;
    };

    const applyDoubleHeartLayout = (currentMessages) => {
        // Split messages
        const meMsgs = currentMessages.filter(m => m.sender === 'Rayest');
        const youMsgs = currentMessages.filter(m => m.sender !== 'Rayest');

        // Generate relative positions
        const mePositions = generateHeartShape(meMsgs.length);
        const youPositions = generateHeartShape(youMsgs.length);

        // Map to screen coordinates
        // Left Heart (Me): Center ~ 25%, 50%
        // Right Heart (You): Center ~ 75%, 50%
        // Scale: ~12% per unit (fit within 0-50%)
        const scale = 12;
        
        const newMeMsgs = meMsgs.map((msg, i) => ({
            ...msg,
            x: 20 + (mePositions[i].x * scale), // Center X at 20%
            y: 40 + (mePositions[i].y * scale), // Center Y at 40%
            zIndex: i
        }));

        const newYouMsgs = youMsgs.map((msg, i) => ({
            ...msg,
            x: 70 + (youPositions[i].x * scale), // Center X at 70%
            y: 40 + (youPositions[i].y * scale), // Center Y at 40%
            zIndex: i
        }));

        setMessages([...newMeMsgs, ...newYouMsgs]);
    };

    const applySingleHeartLayout = (currentMessages, senderFilter = null) => {
        // Filter messages if sender is specified
        const msgsToDisplay = senderFilter 
            ? currentMessages.filter(m => senderFilter === 'Rayest' ? m.sender === 'Rayest' : m.sender !== 'Rayest')
            : currentMessages;

        // Generate positions for ALL messages together
        const positions = generateHeartShape(msgsToDisplay.length);
        
        // Center Heart: Center ~ 50%, 50%
        // Increase Scale further to spread them out
        // Previous: 25 -> New: 35 (Even larger heart)
        const scale = 35;
        
        // Adjust center slightly left as requested
        // Previous CenterX: 45 -> New CenterX: 40
        const newMsgs = msgsToDisplay.map((msg, i) => ({
            ...msg,
            x: 40 + (positions[i].x * scale), // Center X at 40%
            y: 50 + (positions[i].y * scale), // Center Y at 50%
            zIndex: i
        }));
        
        setMessages(newMsgs);
    };

    const applyMixedHeartLayout = (currentMessages) => {
        // Generate positions for ALL messages together
        const positions = generateHeartShape(currentMessages.length);
        
        // Center Heart: Center ~ 50%, 50%
        // Scale: ~35% per unit (match single heart size)
        const scale = 35;
        
        // Use adjusted center X to match single heart
        const newMsgs = currentMessages.map((msg, i) => ({
            ...msg,
            x: 40 + (positions[i].x * scale), // Center X at 40%
            y: 50 + (positions[i].y * scale), // Center Y at 50%
            zIndex: i
        }));
        
        setMessages(newMsgs);
    };

    useEffect(() => {
        const parsed = messagesData.map(m => ({ ...m, date: m.time }));
        // Take a random subset or first N to avoid performance issues if there are thousands
        // For the visual effect, let's take up to 100 random messages
        const shuffled = [...parsed].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 80);
        
        // Initial Layout (Mixed Heart by default now)
        applyMixedHeartLayout(selected);
    }, []);

    const bringToFront = (id) => {
        setMessages(prev => {
            const maxZ = Math.max(...prev.map(m => m.zIndex || 0));
            return prev.map(m => 
                m.id === id ? { ...m, zIndex: maxZ + 1 } : m
            );
        });
    };

    const handleClose = (id) => {
        setMessages(prev => prev.filter(msg => msg.id !== id));
    };

    
    // Generate 100 dummy photos for the romantic gallery (Fallback)
    const generatePhotos = (count) => {
        const locations = ["Paris", "Tokyo", "New York", "London", "Home", "Beach", "Mountains", "Park", "Cafe"];
        const captions = ["Sweet Memory", "Unforgettable", "Love You", "Happy Day", "Adventure", "Just Us", "Smile", "Forever"];
        
        return Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            src: `https://picsum.photos/seed/${i + 123}/400/500`, // Use seed for consistent random images
            caption: `${captions[i % captions.length]} #${i + 1}`,
            location: locations[i % locations.length],
            date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
        }));
    };

    // Initialize photos from data or fallback
    const initializePhotos = () => {
        if (galleryDataJSON && galleryDataJSON.length > 0) {
            return galleryDataJSON.map(p => ({
                ...p,
                date: p.date ? new Date(p.date) : new Date(), // Rehydrate dates
                // Add thumbnail path (derived from src)
                // Assuming thumbnails are in /gallery_images/thumbnails/filename.jpg
                thumbnail: p.src.replace('/gallery_images/', '/gallery_images/thumbnails/')
            }));
        }
        if (USE_RANDOM_DATA_IF_EMPTY) {
            return generatePhotos(50);
        }
        return [];
    };

    const [photos, setPhotos] = useState(initializePhotos());
    const [photoCount, setPhotoCount] = useState(photos.length); 

    // Sync state with imported data when it changes (HMR or subsequent loads)
    useEffect(() => {
        // Only run if photos is empty (first load) or if HMR updates the JSON
        if (galleryDataJSON && galleryDataJSON.length > 0) {
            // Check if we already have these photos to avoid loop
            if (photos.length === galleryDataJSON.length && photos[0]?.id === galleryDataJSON[0]?.id) {
                return;
            }
            
            const loadedPhotos = galleryDataJSON.map(p => ({
                ...p,
                date: p.date ? new Date(p.date) : new Date(),
                thumbnail: p.src.replace('/gallery_images/', '/gallery_images/thumbnails/')
            }));
            setPhotos(loadedPhotos);
            setPhotoCount(loadedPhotos.length);
        }
    }, [galleryDataJSON]);
    
    // Save function
    const saveGallery = async () => {
        if (!IS_EDIT_MODE) return;
        try {
            const response = await fetch('/__api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: 'gallery', data: photos })
            });
            
            if (response.ok) {
                alert('Gallery saved to src/data/galleryData.json!');
            } else {
                alert('Failed to save gallery.');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving gallery.');
        }
    }; 

    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [title, setTitle] = useState("Our Story");
    
    // Infinite Scroll State for Masonry View
    const [visibleCount, setVisibleCount] = useState(20);
    const observerTarget = React.useRef(null);

    useEffect(() => {
        if (viewMode !== 'masonry') return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => Math.min(prev + 20, photos.length));
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [viewMode, photos.length]);

    // Reset visible count when photos change or view mode changes
    useEffect(() => {
        setVisibleCount(20);
    }, [viewMode, photos.length]);

    const breakpointColumnsObj = {
        default: 3,
        1100: 2,
        700: 1
    };

    const handleUpload = async (e) => {
        if (!IS_EDIT_MODE) return;
        const file = e.target.files[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                setPhotos(prev => [{
                    id: Date.now(),
                    src: base64,
                    caption: "New Memory",
                    location: "Somewhere Special",
                    date: new Date()
                }, ...prev]);
            } catch (err) {
                console.error("Upload failed", err);
            }
        }
    };

    // Update photos when photoCount changes (Only in Edit Mode / Random Mode)
    useEffect(() => {
        // Only regenerate if we are strictly using random data and the count doesn't match
        // If we are using galleryDataJSON, we usually don't want to regenerate unless the user explicitly used the slider
        if (USE_RANDOM_DATA_IF_EMPTY && (!galleryDataJSON || galleryDataJSON.length === 0)) {
            setPhotos(generatePhotos(photoCount));
        }
    }, [photoCount]);

    // Generate photo positions using Mitchell's Best-Candidate Algorithm for uniform heart distribution
    // Memoize this to avoid expensive recalculations
    const generateHeartPositions = React.useCallback((count) => {
        const positions = [];
        const numCandidates = 20; 

        // Heart boundary function
        const isInsideHeart = (x, y) => {
            y = y - 0.1;
            x = x * 1.2; 
            const a = x * x + y * y - 1;
            return a * a * a - x * x * y * y * y <= 0;
        };

        for (let i = 0; i < count; i++) {
            let bestCandidate = null;
            let maxDist = -1;

            for (let j = 0; j < numCandidates; j++) {
                let x, y, inside = false;
                for(let k=0; k<20; k++) {
                    x = (Math.random() * 4) - 2; 
                    y = (Math.random() * 4) - 2; 
                    if(isInsideHeart(x, -y)) { 
                        inside = true;
                        break;
                    }
                }
                
                if (!inside) continue; 

                let minDist = Number.MAX_VALUE;
                if (positions.length === 0) {
                    minDist = Number.MAX_VALUE;
                } else {
                    for (const p of positions) {
                        const d = Math.hypot(x - p.x, y - p.y);
                        if (d < minDist) minDist = d;
                    }
                }

                if (minDist > maxDist) {
                    maxDist = minDist;
                    bestCandidate = { x, y };
                }
            }
            if (bestCandidate) positions.push(bestCandidate);
            else positions.push({ x: 0, y: 0 });
        }
        return positions;
    }, []);

    // Store positions in state to keep them stable during re-renders
    const [heartPositions, setHeartPositions] = useState([]);

    // Optimize initialization to avoid double renders
    useEffect(() => {
        // Calculate positions whenever photo count changes
        // Use a transition to avoid blocking UI
        React.startTransition(() => {
             const newPositions = generateHeartPositions(photoCount);
             setHeartPositions(newPositions);
        });
    }, [photoCount, generateHeartPositions]);

    // Helper to get position from pre-calculated array
    const getPhotoStyle = (index, totalCount) => {
        const pos = heartPositions[index] || { x: 0, y: 0 };
        
        const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

        // Map mathematical coordinates (-1.5 to 1.5) to CSS % (0 to 100)
        // Center is (50, 40)
        const centerX = 45; 
        const centerY = 50; 
        
        // Use uniform scale for PC and Mobile to keep the layout structure identical
        // PC scale is 42. Mobile scale should be the same RELATIVE to the container width.
        // This will result in the same "spread" percentage wise.
        const scale = 42; 

        const left = centerX + (pos.x * scale);
        const top = centerY + (pos.y * scale); 

        // Boundary Clamping
        // Relaxed clamping to 2-98%
        // Mobile photos are smaller (w-10), so they can go closer to edge (98%) without issue.
        const clampedLeft = Math.max(2, Math.min(98, left));
        const clampedTop = Math.max(2, Math.min(98, top));

        // Uniform size scaling based on total count
        // Adjusted back to balance density without being huge
        const baseSize = Math.sqrt(65 / totalCount);
        
        const randomSize = 0.9 + (Math.sin(index * 999) * 0.2); 

        return {
            left: `${clampedLeft}%`,
            top: `${clampedTop}%`,
            scale: baseSize * randomSize,
            rotation: ((index % 10) - 5) * 3 
        };
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-white p-4 md:p-8 pb-20 overflow-y-auto">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-8 md:mb-12 text-center relative">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block relative"
                >
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => IS_EDIT_MODE && setTitle(e.target.value)}
                        readOnly={!IS_EDIT_MODE}
                        className={`text-3xl md:text-5xl lg:text-7xl font-bold bg-transparent text-center outline-none border-b-2 ${IS_EDIT_MODE ? 'border-transparent hover:border-pink-500/30' : 'border-transparent'} transition-colors`}
                        style={{ fontFamily: "'Dancing Script', cursive, sans-serif" }} 
                    />
                </motion.div>
                <p className="text-pink-300/80 mt-4 text-lg italic">"Every picture tells a part of our story..."</p>
                
                {/* Controls - Always visible for View Toggle, but Upload/Slider hidden in Read-Only */}
                <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="flex flex-wrap justify-center items-center gap-4">
                        {/* View Toggle (Always visible) */}
                        <div className="bg-white/10 p-1 rounded-full flex items-center">
                            <button 
                                onClick={() => setViewMode('wall')}
                                className={`p-2 rounded-full transition-all ${viewMode === 'wall' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                title="Photo Wall View"
                            >
                                <Layout size={20} />
                            </button>
                            <button 
                                onClick={() => setViewMode('masonry')}
                                className={`p-2 rounded-full transition-all ${viewMode === 'masonry' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                title="Masonry View"
                            >
                                <Grid size={20} />
                            </button>
                            <button 
                                onClick={() => {
                                    setViewMode('messages');
                                    // Reset to Mixed Heart if coming from single heart
                                    const parsed = messagesData.map(m => ({ ...m, date: m.time }));
                                    const shuffled = [...parsed].sort(() => 0.5 - Math.random());
                                    const selected = shuffled.slice(0, 80);
                                    applyMixedHeartLayout(selected);
                                }}
                                className={`p-2 rounded-full transition-all ${viewMode === 'messages' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                title="Mixed Heart Message Wall"
                            >
                                <HeartHandshake size={20} />
                            </button>
                            <button 
                                onClick={() => {
                                    setViewMode('heart-messages-me');
                                    const parsed = messagesData.map(m => ({ ...m, date: m.time }));
                                    const shuffled = [...parsed].sort(() => 0.5 - Math.random());
                                    // We need enough messages to fill the heart, filter first then take N
                                    const meMsgs = shuffled.filter(m => m.sender === 'Rayest').slice(0, 80);
                                    applySingleHeartLayout(meMsgs, 'Rayest');
                                }}
                                className={`p-2 rounded-full transition-all ${viewMode === 'heart-messages-me' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                title="Blue Heart (Rayest)"
                            >
                                <Heart size={20} className="fill-blue-400 text-blue-400" />
                            </button>
                            <button 
                                onClick={() => {
                                    setViewMode('heart-messages-you');
                                    const parsed = messagesData.map(m => ({ ...m, date: m.time }));
                                    const shuffled = [...parsed].sort(() => 0.5 - Math.random());
                                    const youMsgs = shuffled.filter(m => m.sender !== 'Rayest').slice(0, 80);
                                    applySingleHeartLayout(youMsgs, 'Partner');
                                }}
                                className={`p-2 rounded-full transition-all ${viewMode === 'heart-messages-you' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                title="Pink Heart (Ashley)"
                            >
                                <Heart size={20} className="fill-pink-400 text-pink-400" />
                            </button>
                            <button 
                                onClick={() => setViewMode('cloud')}
                                className={`p-2 rounded-full transition-all ${viewMode === 'cloud' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                title="Word Cloud"
                            >
                                <Cloud size={20} />
                            </button>
                        </div>

                        {/* Upload Button - Only visible in Edit Mode */}
                        {IS_EDIT_MODE && (
                        <>
                            <label className="flex items-center gap-2 bg-pink-600/20 hover:bg-pink-600/40 text-pink-300 px-6 py-3 rounded-full cursor-pointer transition-all border border-pink-500/30 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                                <Upload size={18} />
                                <span>Add Memory</span>
                                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                            </label>
                            
                            <button 
                                onClick={saveGallery}
                                className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/40 text-green-300 px-6 py-2 rounded-full cursor-pointer transition-all border border-green-500/30 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                title="Save current photos to disk"
                            >
                                <Save size={18} />
                                <span className="font-medium">Save</span>
                            </button>
                        </>
                        )}
                    </div>

                    {/* Photo Count Slider (Only visible in Wall mode AND Edit Mode) */}
                    {viewMode === 'wall' && IS_EDIT_MODE && (
                        <div className="flex items-center gap-4 bg-black/30 px-6 py-2 rounded-full border border-white/5">
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Count: {photoCount}</span>
                            <input 
                                type="range" 
                                min="10" 
                                max="200" 
                                value={photoCount} 
                                onChange={(e) => setPhotoCount(parseInt(e.target.value))}
                                className="w-32 accent-pink-500 cursor-pointer"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Gallery Content */}
            <div className="max-w-7xl mx-auto min-h-[500px]">
                {viewMode.includes('messages') ? (
                    <MessageWall 
                        messages={messages} 
                        onBringToFront={bringToFront} 
                        onClose={handleClose} 
                    />
                ) : viewMode === 'cloud' ? (
                    <div className="w-full h-[80vh] flex items-center justify-center bg-gray-900/50 rounded-xl border border-white/10 shadow-2xl overflow-hidden">
                        <div className="w-full h-full p-8">
                             <WordCloud words={wordCloudData} />
                        </div>
                    </div>
                ) : viewMode === 'masonry' ? (
                    <>
                    <Masonry
                        breakpointCols={breakpointColumnsObj}
                        className="flex w-auto -ml-4"
                        columnClassName="pl-4 bg-clip-padding"
                    >
                        {photos.slice(0, visibleCount).map((photo, index) => (
                            <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(index * 0.05, 1.0) }} 
                                className="mb-4 break-inside-avoid"
                            >
                                <div 
                                    className="relative group cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-white/5"
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    <img 
                                        src={photo.src} 
                                        alt={photo.caption} 
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <p className="text-white font-medium">{photo.caption}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </Masonry>
                    {/* Sentinel for Infinite Scroll */}
                    {visibleCount < photos.length && (
                        <div ref={observerTarget} className="h-20 w-full flex items-center justify-center text-gray-500">
                            Loading more memories...
                        </div>
                    )}
                    </>
                ) : (
                    // Photo Wall View (Corkboard Style)
                    <div className="relative mx-auto max-w-6xl mt-8 p-4">
                        {/* The Corkboard */}
                        <div className="relative bg-[#d4b483] rounded-lg shadow-2xl border-[16px] border-[#8b5e3c] min-h-[80vh] overflow-hidden">
                             {/* Cork Texture Overlay */}
                             <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cork-board.png")' }}></div>
                            
                            <div className="absolute inset-0 p-8">
                                {photos.map((photo, index) => {
                                    const style = getPhotoStyle(index, photos.length);
                                    
                                    return (
                                    <motion.div
                                        key={photo.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ 
                                            opacity: 1, 
                                            scale: style.scale, 
                                            rotate: style.rotation,
                                            left: style.left,
                                            top: style.top
                                        }}
                                        whileHover={{ scale: style.scale * 1.2, zIndex: 50, rotate: 0 }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className="absolute group cursor-pointer"
                                        style={{ zIndex: index + 1 }} // Initial stack order
                                        onClick={() => setSelectedPhoto(photo)}
                                    >
                                        <div className="bg-white p-1 md:p-1 pb-3 md:pb-4 shadow-[1px_1px_4px_rgba(0,0,0,0.2)] w-16 xs:w-20 md:w-24 transform transition-transform duration-300">
                                            <div className="aspect-square overflow-hidden bg-gray-100 mb-0.5 border border-gray-200">
                                                <img 
                                                    src={photo.thumbnail || photo.src} 
                                                    alt={photo.caption} 
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="w-full h-full object-cover filter sepia-[.15] contrast-110 group-hover:sepia-0 transition-all duration-500"
                                                />
                                            </div>
                                            <div className="text-center px-0.5 overflow-hidden">
                                                <p className="font-handwriting text-gray-800 text-[6px] xs:text-[7px] md:text-[8px] font-bold truncate" style={{ fontFamily: "'Indie Flower', cursive" }}>
                                                    {photo.caption}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )})}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="relative max-w-6xl w-full max-h-[90vh] flex flex-col md:flex-row bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button 
                                onClick={() => setSelectedPhoto(null)}
                                className="absolute top-4 right-4 z-10 text-white/70 hover:text-white bg-black/50 p-2 rounded-full backdrop-blur-md transition-colors"
                            >
                                <X size={24} />
                            </button>

                            {/* Image Section */}
                            <div className="flex-1 bg-black flex items-center justify-center p-4">
                                <img 
                                    src={selectedPhoto.src} 
                                    alt={selectedPhoto.caption} 
                                    className="max-w-full max-h-[80vh] object-contain"
                                />
                            </div>

                            {/* Details Section */}
                            <div className="w-full md:w-96 bg-[#1e1e1e] p-6 flex flex-col gap-6 border-l border-white/10 overflow-y-auto">
                                <div>
                                    <label className="text-xs font-medium text-pink-400 uppercase tracking-wider mb-2 block">Caption</label>
                                    <textarea
                                        value={selectedPhoto.caption}
                                        onChange={(e) => {
                                            if (!IS_EDIT_MODE) return;
                                            const newVal = e.target.value;
                                            setSelectedPhoto(prev => ({ ...prev, caption: newVal }));
                                            setPhotos(prev => prev.map(p => p.id === selectedPhoto.id ? { ...p, caption: newVal } : p));
                                        }}
                                        readOnly={!IS_EDIT_MODE}
                                        className={`w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-pink-500 focus:outline-none transition-colors resize-none h-24 ${!IS_EDIT_MODE ? 'cursor-default focus:border-white/10' : ''}`}
                                        placeholder={IS_EDIT_MODE ? "Write a caption..." : ""}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-pink-400 uppercase tracking-wider mb-2 block">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            type="text"
                                            value={selectedPhoto.location || ''}
                                            onChange={(e) => {
                                                if (!IS_EDIT_MODE) return;
                                                const newVal = e.target.value;
                                                setSelectedPhoto(prev => ({ ...prev, location: newVal }));
                                                setPhotos(prev => prev.map(p => p.id === selectedPhoto.id ? { ...p, location: newVal } : p));
                                            }}
                                            readOnly={!IS_EDIT_MODE}
                                            className={`w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-3 py-3 text-white focus:border-pink-500 focus:outline-none transition-colors ${!IS_EDIT_MODE ? 'cursor-default focus:border-white/10' : ''}`}
                                            placeholder={IS_EDIT_MODE ? "Where was this?" : ""}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-pink-400 uppercase tracking-wider mb-2 block">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10" size={16} />
                                        <DatePicker
                                            selected={selectedPhoto.date instanceof Date ? selectedPhoto.date : new Date(selectedPhoto.date)}
                                            onChange={(date) => {
                                                if (!IS_EDIT_MODE) return;
                                                setSelectedPhoto(prev => ({ ...prev, date: date }));
                                                setPhotos(prev => prev.map(p => p.id === selectedPhoto.id ? { ...p, date: date } : p));
                                            }}
                                            readOnly={!IS_EDIT_MODE}
                                            disabled={!IS_EDIT_MODE}
                                            className={`w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-3 py-3 text-white focus:border-pink-500 focus:outline-none transition-colors ${!IS_EDIT_MODE ? 'cursor-default focus:border-white/10' : ''}`}
                                            dateFormat="MMMM d, yyyy"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoveGallery;
