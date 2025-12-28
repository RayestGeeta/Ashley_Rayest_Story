import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTravel } from '../context/TravelContext';
import { ArrowLeft, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const CountryPage = () => {
    const { countryName } = useParams();
    const { visitedPlaces } = useTravel();

    // Filter places for this country
    const countryPlaces = visitedPlaces.filter(p => p.countryName === countryName);

    // Try to find ISO code from a place (if I added it to data model) 
    // or just rely on name for flag API which supports names often or stick to simple header
    // Ideally I should store ISO code, but for now just name.

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-6 md:p-12">

            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12">
                <Link to="/" className="inline-flex items-center gap-2 glass-panel px-4 py-2 text-white hover:bg-white/10 transition-colors mb-8">
                    <ArrowLeft size={16} /> Back to World
                </Link>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex flex-col md:flex-row items-baseline gap-6 border-b border-white/10 pb-8"
                >
                    <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg tracking-tight">
                        {countryName}
                    </h1>
                    <span className="text-2xl text-[var(--accent-color)] font-light">
                        {countryPlaces.length} {countryPlaces.length === 1 ? 'Destination' : 'Destinations'} Visited
                    </span>
                </motion.div>
            </div>

            {/* Grid of Places */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {countryPlaces.length > 0 ? (
                    countryPlaces.map((place, index) => {
                        const coverImage = place.logs?.[0]?.image || `https://source.unsplash.com/random/800x600?${place.cityName}`;

                        return (
                            <motion.div
                                key={place.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link to={`/post/${place.id}`} className="group block glass-panel overflow-hidden hover:border-[var(--accent-color)] transition-colors">
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <img
                                            src={coverImage}
                                            alt={place.cityName}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                        <div className="absolute bottom-4 left-4 right-4">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-white mb-1">{place.cityName}</h2>
                                                    <div className="flex items-center gap-2 text-sm text-[var(--accent-color)]">
                                                        <Calendar size={14} /> {place.date}
                                                    </div>
                                                </div>
                                                <div className="bg-white/20 p-2 rounded-full backdrop-blur-md group-hover:bg-[var(--accent-color)] group-hover:text-black transition-colors">
                                                    <ArrowRight size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <p className="text-gray-400 text-sm line-clamp-2">
                                            {place.logs && place.logs.length > 0
                                                ? place.logs[0].content
                                                : "No entries yet. Click to start writing..."}
                                        </p>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="col-span-full text-center py-20">
                        <p className="text-xl text-gray-500">No places found. Use the map to add visited cities.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CountryPage;
