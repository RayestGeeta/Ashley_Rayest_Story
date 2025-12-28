import React, { useState } from 'react';
import InteractiveMap from '../components/Map/InteractiveMap';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTravel } from '../context/TravelContext';

const Home = () => {
    const navigate = useNavigate();
    const { visitedPlaces } = useTravel();
    const [tooltipContent, setTooltipContent] = useState("");
    const [activeCountry, setActiveCountry] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleCountryClick = (countryName) => {
        // Set active country to trigger map focus and filter stories
        setActiveCountry(countryName);
    };

    const filteredPlaces = activeCountry
        ? visitedPlaces.filter(place => place.countryName === activeCountry)
        : visitedPlaces;

    const uniqueCountriesCount = new Set(visitedPlaces.map(p => p.countryName)).size;

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[var(--bg-primary)]">
            {/* Map Layer */}
            <div className="absolute inset-0 z-0">
                <InteractiveMap
                    setTooltipContent={setTooltipContent}
                    onCountryClick={handleCountryClick}
                    activeCountry={activeCountry}
                />
            </div>

            {/* Overlay UI - Header */}
            <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none">
                <div className="flex justify-between items-center pointer-events-auto">
                    <h1 className="text-3xl font-bold tracking-tighter text-white drop-shadow-lg pl-12 md:pl-0">
                        TRAVEL<span className="text-[var(--accent-color)]">MAP</span>
                    </h1>
                    <div className="glass-panel px-4 py-2 text-sm text-[var(--text-secondary)]">
                        {visitedPlaces.length} Stories • {uniqueCountriesCount} Countries
                    </div>
                </div>
            </div>

            {/* Overlay UI - Posts List */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: isSidebarOpen ? 0 : '100%' }}
                transition={{ duration: 0.5, type: 'spring', damping: 20 }}
                className="absolute right-0 top-0 h-full w-full max-w-md pointer-events-none flex flex-col justify-end md:justify-center p-4 md:p-8 z-20"
            >
                {/* Toggle Button - positioned relative to the panel */}
                <div className="absolute top-1/2 -left-12 -translate-y-1/2 pointer-events-auto">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="glass-panel p-3 text-white hover:text-[var(--accent-color)] transition-colors rounded-l-xl rounded-r-none border-r-0 shadow-xl"
                    >
                        {isSidebarOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
                    </button>
                </div>

                <div className="pointer-events-auto max-h-[80vh] overflow-y-auto glass-panel p-6 shadow-2xl flex flex-col gap-6 relative">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold text-white">
                            {activeCountry ? `Stories from ${activeCountry}` : "Recent Adventures"}
                        </h2>
                        {activeCountry && (
                            <button
                                onClick={() => setActiveCountry(null)}
                                className="text-xs text-[var(--text-secondary)] hover:text-white transition-colors"
                            >
                                Back to World View (Reset Zoom)
                            </button>
                        )}
                    </div>

                    {filteredPlaces.length === 0 ? (
                        <div className="text-[var(--text-secondary)] text-center py-10">
                            {activeCountry
                                ? "No stories written for this location yet."
                                : "Start your journey by clicking on a country!"}
                        </div>
                    ) : (
                        filteredPlaces.map(place => {
                            const coverImage = place.logs?.[0]?.image || `https://source.unsplash.com/random/800x600?${place.cityName}`;
                            return (
                                <Link to={`/post/${place.id}`} key={place.id} className="group block">
                                    <div className="relative aspect-video rounded-lg overflow-hidden mb-3 border border-[var(--glass-border)]">
                                        <img src={coverImage} alt={place.cityName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-xs text-[var(--accent-color)] mb-1">
                                            <MapPin size={12} /> {place.cityName}, {place.countryName}
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[var(--accent-color)] transition-colors line-clamp-1">{place.cityName}</h3>
                                        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                                            <span className="flex items-center gap-1"><Calendar size={12} /> {place.date}</span>
                                            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">Read <ArrowRight size={12} /></span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Home;
