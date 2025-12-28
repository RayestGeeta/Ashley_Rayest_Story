import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import { useTravel } from '../context/TravelContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L, { divIcon } from 'leaflet';
import { Settings, X } from 'lucide-react';

const StarMap = () => {
    const { visitedPlaces, futurePlans } = useTravel();
    const [geoJsonData, setGeoJsonData] = useState(null);
    
    // Star Size Configuration
    const [baseStarSize, setBaseStarSize] = useState(6);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        fetch('/world.json')
            .then(res => res.json())
            .then(data => setGeoJsonData(data))
            .catch(err => console.error("Error loading GeoJSON:", err));
    }, []);

    // Create a custom twinkling star icon
    const createStarIcon = (place, isFuture = false) => {
        // Weight factors
        const storyCount = place.logs ? place.logs.length : 0;
        
        // Calculate duration in days if dates exist
        let duration = 1;
        if (place.startDate && place.endDate) {
            const start = new Date(place.startDate);
            const end = new Date(place.endDate);
            const diffTime = Math.abs(end - start);
            duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include start date
        }

        // Base size logic
        // Formula: Base Size (Configurable) + (Duration * 0.5) + (Stories * 2)
        let size = baseStarSize + (duration * 0.5) + (storyCount * 2);
        
        // Cap size to avoid massive stars covering the map
        if (size > 30 + baseStarSize) size = 30 + baseStarSize; 
        if (size < baseStarSize) size = baseStarSize; // Min size

        // Future plans are smaller and dimmer
        if (isFuture) {
            size = baseStarSize; // Future stars use base size
        }

        // Randomize blink speed slightly
        const animationDuration = 2 + Math.random() * 2;
        
        // Future stars blink slower and are dimmer
        const opacity = isFuture ? 0.4 : 1;
        const color = isFuture ? '#a855f7' : 'white'; // Purple for future

        return divIcon({
            className: 'custom-star-icon-container', // Wrapper to avoid Leaflet conflicts
            html: `<div class="star-marker" style="width: ${size}px; height: ${size}px; animation-duration: ${animationDuration}s; opacity: ${opacity}; background: ${color}; box-shadow: 0 0 ${isFuture ? '4px' : '10px'} ${color};"></div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2]
        });
    };

    return (
        <div className="w-full h-screen bg-black relative overflow-hidden">
            {/* Subtle Galactic Core Glow */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(76,29,149,0.15)_0%,_transparent_60%)]" />

            <div className="absolute top-8 left-24 z-10">
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-400 to-purple-200 drop-shadow-[0_0_15px_rgba(192,132,252,0.6)] font-serif tracking-wider">
                    Galaxy of Memories
                </h1>
                <p className="text-purple-200/80 mt-2 text-lg italic tracking-wide">Where your stories shine like stars in the night sky.</p>
            </div>

            {/* Settings Control */}
            <div className="absolute top-8 right-8 z-[1000]">
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all shadow-lg"
                >
                    {showSettings ? <X size={24} /> : <Settings size={24} />}
                </button>
                
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="absolute right-0 mt-4 w-64 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl"
                        >
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Settings size={16} /> Map Settings
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                                        <span>Base Star Size</span>
                                        <span className="text-purple-400 font-mono">{baseStarSize}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="4"
                                        max="20"
                                        step="1"
                                        value={baseStarSize}
                                        onChange={(e) => setBaseStarSize(parseInt(e.target.value))}
                                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Tiny</span>
                                        <span>Massive</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <MapContainer
                center={[35, 105]} // Center on China
                zoom={3.5} // Zoom in slightly to show more detail
                scrollWheelZoom={true}
                zoomControl={false}
                style={{ height: "100%", width: "100%", background: "transparent" }}
                className="star-map-mode"
                minZoom={2}
                maxZoom={6}
                maxBounds={[[-90, -180], [90, 180]]} // Allow full world view
                maxBoundsViscosity={1.0}
            >
                {/* No TileLayer - Pure Space Background */}

                {/* Simplified World Map Overlay - Constellation Style */}
                {geoJsonData && (
                    <GeoJSON
                        data={geoJsonData}
                        style={{
                            fillColor: "transparent",
                            weight: 0.8,
                            opacity: 1,
                            color: "rgba(255, 255, 255, 0.08)", // Ghostly wireframe
                            fillOpacity: 0
                        }}
                    />
                )}

                {visitedPlaces.map((place) => (
                    <Marker
                        key={place.id}
                        position={[place.lat, place.lng]}
                        icon={createStarIcon(place)}
                    >
                        <Popup className="glass-popup">
                            <div className="text-center">
                                <h3 className="font-bold text-white mb-1">{place.cityName}</h3>
                                <Link to={`/post/${place.id}`} className="block text-purple-300 text-xs hover:text-white underline decoration-purple-500/50 hover:decoration-white transition-colors cursor-pointer">
                                    View {place.logs?.length || 0} Stories &rarr;
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {futurePlans.map((plan) => {
                    // Ensure coordinates are valid numbers
                    const lat = parseFloat(plan.lat);
                    const lng = parseFloat(plan.lng);
                    
                    if (isNaN(lat) || isNaN(lng)) {
                        console.warn(`Invalid coordinates for plan: ${plan.name}`, plan);
                        return null;
                    }

                    return (
                        <Marker
                            key={plan.id}
                            position={[lat, lng]}
                            icon={createStarIcon(plan, true)}
                        >
                            <Popup className="glass-popup">
                                <div className="text-center">
                                    <h3 className="font-bold text-purple-300 mb-1">
                                        {plan.name}
                                        {plan.nickname && (
                                            <span className="text-white/70 ml-1 text-xs font-normal">
                                                ({plan.nickname})
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-gray-400">Future Destination</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default StarMap;
