import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Masonry from 'react-masonry-css';
import { Heart, Upload, X, Camera, Grid, Layout, MapPin, Calendar, Save } from 'lucide-react';
import { fileToBase64 } from '../utils/fileHelpers';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import galleryDataJSON from '../data/galleryData.json';
import { IS_EDIT_MODE, USE_RANDOM_DATA_IF_EMPTY } from '../config';

const LoveGallery = () => {
    // Default to 'wall' view in View Mode, can start with 'masonry' if preferred but Wall is the main feature
    const [viewMode, setViewMode] = useState('wall'); 
    
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
                date: p.date ? new Date(p.date) : new Date() // Rehydrate dates
            }));
        }
        if (USE_RANDOM_DATA_IF_EMPTY) {
            return generatePhotos(50);
        }
        return [];
    };

    const [photos, setPhotos] = useState(initializePhotos());
    const [photoCount, setPhotoCount] = useState(photos.length); 
    
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
    // This runs only when count changes
    const generateHeartPositions = (count) => {
        const positions = [];
        const numCandidates = 20; // Increased from 10 to 20 for better shape definition

        // Heart boundary function (Cartesian inequality)
        // (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
        // Scaled to fit roughly -1.5 to 1.5 range
        const isInsideHeart = (x, y) => {
            // Shift y up slightly to center vertically in mathematical space
            y = y - 0.1;
            // Scale x to make it wider
            x = x * 1.2; // Adjusted to 1.2 to narrow it slightly (was 1.15), allowing larger overall scale
            
            const a = x * x + y * y - 1;
            return a * a * a - x * x * y * y * y <= 0;
        };

        for (let i = 0; i < count; i++) {
            let bestCandidate = null;
            let maxDist = -1;

            for (let j = 0; j < numCandidates; j++) {
                let x, y, inside = false;
                
                // Rejection sampling for a point inside heart
                // Try up to 20 times to find a point inside heart
                for(let k=0; k<20; k++) {
                    // Try to fill a larger area
                    x = (Math.random() * 4) - 2; // -2 to 2
                    y = (Math.random() * 4) - 2; // -2 to 2
                    
                    // We only check if it's inside the heart shape
                    // If we want to fill the "container", we need to scale the heart to fill the container first
                    if(isInsideHeart(x, -y)) { 
                        inside = true;
                        break;
                    }
                }
                
                if (!inside) continue; 

                // ... (rest of candidate logic)
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

    // Store positions in state to keep them stable during re-renders
    const [heartPositions, setHeartPositions] = useState([]);

    // Update photos and positions when photoCount changes
    React.useEffect(() => {
        const newPhotos = generatePhotos(photoCount);
        const newPositions = generateHeartPositions(photoCount);
        setPhotos(newPhotos);
        setHeartPositions(newPositions);
    }, [photoCount]);

    // Helper to get position from pre-calculated array
    const getPhotoStyle = (index, totalCount) => {
        const pos = heartPositions[index] || { x: 0, y: 0 };
        
        // Map mathematical coordinates (-1.5 to 1.5) to CSS % (0 to 100)
        // Center is (50, 40)
        const centerX = 45; // Shift left further to 45 (was 48)
        const centerY = 50; // Moved down from 45 to 50 to prevent top clipping
        
        // Increase scale to fill the board!
        // Previous was 28, now we bump it up significantly
        // Note: Mathematical heart roughly goes from y=-1 to y=1.5, x=-1.5 to 1.5
        // We want 1.5 units to map to roughly 45% (to fill 90% height)
        // So scale should be approx 45 / 1.5 = 30+
        const scale = 42; // Increased to 42 for maximum size

        const left = centerX + (pos.x * scale);
        const top = centerY + (pos.y * scale); 

        // Boundary Clamping
        // Ensure left is between 5% and 95%
        // Ensure top is between 5% and 95%
        // This squishes the heart slightly if it hits the edge, but keeps photos inside
        // Relaxed clamping to 2-98% to reduce "flat edge" look
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
        <div className="min-h-screen bg-[var(--bg-primary)] text-white p-8 pb-20 overflow-y-auto">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-12 text-center relative">
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
                        className={`text-5xl md:text-7xl font-bold bg-transparent text-center outline-none border-b-2 ${IS_EDIT_MODE ? 'border-transparent hover:border-pink-500/30' : 'border-transparent'} transition-colors`}
                        style={{ fontFamily: "'Dancing Script', cursive, sans-serif" }} 
                    />
                </motion.div>
                <p className="text-pink-300/80 mt-4 text-lg italic">"Every picture tells a part of our story..."</p>
                
                {/* Controls - Always visible for View Toggle, but Upload/Slider hidden in Read-Only */}
                <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4">
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
                {viewMode === 'masonry' ? (
                    <Masonry
                        breakpointCols={breakpointColumnsObj}
                        className="flex w-auto -ml-4"
                        columnClassName="pl-4 bg-clip-padding"
                    >
                        {photos.map((photo, index) => (
                            <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="mb-4 break-inside-avoid"
                            >
                                <div 
                                    className="relative group cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-white/5"
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    <img 
                                        src={photo.src} 
                                        alt={photo.caption} 
                                        className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <p className="text-white font-medium">{photo.caption}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </Masonry>
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
                                        initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                                        animate={{ 
                                            opacity: 1, 
                                            scale: style.scale, 
                                            rotate: style.rotation,
                                            left: style.left,
                                            top: style.top
                                        }}
                                        whileHover={{ scale: style.scale * 1.2, zIndex: 50, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        className="absolute group cursor-pointer"
                                        style={{ zIndex: index + 1 }} // Initial stack order
                                        onClick={() => setSelectedPhoto(photo)}
                                    >
                                        <div className="bg-white p-1 pb-4 shadow-[1px_1px_4px_rgba(0,0,0,0.2)] w-20 md:w-24 transform transition-transform duration-300">
                                            <div className="aspect-square overflow-hidden bg-gray-100 mb-0.5 border border-gray-200">
                                                <img 
                                                    src={photo.src} 
                                                    alt={photo.caption} 
                                                    className="w-full h-full object-cover filter sepia-[.15] contrast-110 group-hover:sepia-0 transition-all duration-500"
                                                />
                                            </div>
                                            <div className="text-center px-0.5 overflow-hidden">
                                                <p className="font-handwriting text-gray-800 text-[8px] font-bold truncate" style={{ fontFamily: "'Indie Flower', cursive" }}>
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
