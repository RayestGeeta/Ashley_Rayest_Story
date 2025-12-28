import React, { useState } from 'react';
import { useTravel } from '../context/TravelContext';
import { Search, Plus, Trash2, MapPin, Rocket, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IS_EDIT_MODE } from '../config';

const FuturePlans = () => {
    const { futurePlans, addFuturePlan, removeFuturePlan, saveToDisk } = useTravel();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAdd = (result) => {
        const cityName = result.address?.city || result.address?.town || result.address?.village || result.name.split(',')[0];
        const countryName = result.address?.country || result.display_name.split(',').pop().trim();
        
        addFuturePlan({
            name: cityName,
            country: countryName,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            full_name: result.display_name
        });
        setSearchResults([]);
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen bg-[#021025] text-white p-8 md:p-12 ml-16">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8 justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-600/20 rounded-full text-purple-400">
                            <Rocket size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                                Future Travel Plans
                            </h1>
                            <p className="text-gray-400 mt-1">Dream destinations to visit next. These shine dimly in your Star Galaxy.</p>
                        </div>
                    </div>
                    {/* Save Button (Edit Mode) */}
                    {IS_EDIT_MODE && (
                        <button
                            onClick={saveToDisk}
                            className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/40 text-green-300 px-6 py-2 rounded-full cursor-pointer transition-all border border-green-500/30 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                            title="Save all data to disk"
                        >
                            <Save size={18} />
                            <span className="hidden md:inline font-medium">Save</span>
                        </button>
                    )}
                </div>

                {/* Search Section */}
                <div className="glass-panel p-6 rounded-2xl mb-12 border border-white/10">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for a city (e.g., Kyoto, Paris)..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <button 
                            type="submit"
                            disabled={isSearching}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {isSearching ? 'Searching...' : 'Search'}
                        </button>
                    </form>

                    {/* Search Results */}
                    <AnimatePresence>
                        {searchResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-4 bg-black/60 rounded-xl overflow-hidden border border-white/10"
                            >
                                {searchResults.slice(0, 5).map((result) => (
                                    <div 
                                        key={result.place_id}
                                        onClick={() => handleAdd(result)}
                                        className="p-3 hover:bg-purple-600/20 cursor-pointer flex justify-between items-center transition-colors border-b border-white/5 last:border-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <MapPin size={16} className="text-purple-400" />
                                            <span className="text-sm">{result.display_name}</span>
                                        </div>
                                        <Plus size={16} className="text-purple-400" />
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Plans List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {futurePlans.map((plan) => (
                            <motion.div
                                key={plan.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="glass-panel p-5 rounded-xl border border-white/5 flex justify-between items-center group hover:border-purple-500/30 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400">
                                        <Rocket size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{plan.name}</h3>
                                        <p className="text-xs text-gray-500">{plan.country}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeFuturePlan(plan.id)}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remove from plans"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {futurePlans.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 border border-dashed border-white/10 rounded-xl">
                            <Rocket size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No future plans yet. Search and add your dream destinations!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FuturePlans;
