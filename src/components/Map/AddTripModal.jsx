import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Search, MapPin, Upload, Image as ImageIcon, Calendar } from 'lucide-react';
import { useTravel } from '../../context/TravelContext';
import { fileToBase64 } from '../../utils/fileHelpers';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AddTripModal = () => {
    const { isModalOpen, closeModal, modalPrefilledCountry, addPlace } = useTravel();
    
    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Selection State
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [selectedLat, setSelectedLat] = useState(null);
    const [selectedLng, setSelectedLng] = useState(null);

    // Date Range State
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;

    // Trip Title State
    const [tripTitle, setTripTitle] = useState('');

    const [coverImage, setCoverImage] = useState(null); // Base64 string
    
    // Optional Log Fields - REMOVED
    // const [showLogFields, setShowLogFields] = useState(false);
    // const [logTitle, setLogTitle] = useState('');
    // const [logContent, setLogContent] = useState('');
    // const [logMedia, setLogMedia] = useState([]); 

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isModalOpen) {
            resetForm();
        } else {
            resetForm();
            if (modalPrefilledCountry) {
                setSearchQuery(modalPrefilledCountry);
            }
        }
    }, [isModalOpen, modalPrefilledCountry]);

    const resetForm = () => {
        setCity('');
        setCountry('');
        setSelectedLat(null);
        setSelectedLng(null);
        setSearchQuery('');
        setSearchResults([]);
        setDateRange([null, null]);
        setTripTitle('');
        setCoverImage(null);
        // setShowLogFields(false);
        // setLogTitle('');
        // setLogContent('');
        // setLogMedia([]);
        setIsSubmitting(false);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(searchQuery)}`
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectLocation = (result) => {
        const cityName = result.address?.city || result.address?.town || result.address?.village || result.name.split(',')[0];
        const countryName = result.address?.country || result.display_name.split(',').pop().trim();

        setCity(cityName || result.name);
        setCountry(countryName);
        setSelectedLat(parseFloat(result.lat));
        setSelectedLng(parseFloat(result.lon));
        
        setSearchResults([]);
        setSearchQuery(`${cityName || result.name}, ${countryName}`);
    };

    const handleCoverImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                setCoverImage(base64);
            } catch (err) {
                console.error("Image upload failed", err);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        
        if (!city || !country || !selectedLat || !selectedLng) {
            alert("Please search and select a valid location.");
            return;
        }

        setIsSubmitting(true);

        try {
            const newPlace = {
                cityName: city,
                countryName: country,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                lat: selectedLat,
                lng: selectedLng,
                coverImage: coverImage,
                article: {
                    title: tripTitle || `${city} Trip`,
                    content: `# ${city}, ${country}\n\nStart writing your amazing journey here...\n\nYou can use **Markdown**!\n\n- [ ] Visit key spots\n- [ ] Try local food`,
                    coverImage: coverImage,
                    media: []
                }
            };

            addPlace(newPlace);
            closeModal();
        } catch (error) {
            console.error("Error adding place:", error);
            alert("Failed to add place. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isModalOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto"
                        >
                            <button
                                onClick={closeModal}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Start a New Journey</h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    
                                    {/* Search Section */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-400">Search Location</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search for a city (e.g. Tokyo, Paris)..."
                                                className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-20 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors"
                                            />
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                            <button 
                                                type="button"
                                                onClick={handleSearch}
                                                disabled={isSearching}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                                            >
                                                {isSearching ? '...' : 'Search'}
                                            </button>
                                        </div>

                                        {/* Search Results Dropdown */}
                                        <AnimatePresence>
                                            {searchResults.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="bg-black/80 border border-white/10 rounded-lg overflow-hidden max-h-48 overflow-y-auto mt-2"
                                                >
                                                    {searchResults.map((result) => (
                                                        <div 
                                                            key={result.place_id}
                                                            onClick={() => handleSelectLocation(result)}
                                                            className="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                                                        >
                                                            <MapPin size={16} className="text-pink-500 flex-shrink-0" />
                                                            <span className="text-sm text-gray-200 truncate">{result.display_name}</span>
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Selected Location Display */}
                                        {city && country && (
                                            <div className="flex items-center gap-2 p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                                                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">
                                                    <MapPin size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">{city}</div>
                                                    <div className="text-xs text-pink-300">{country}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dates Section */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Travel Dates</label>
                                        <div className="relative">
                                            <DatePicker
                                                selectsRange={true}
                                                startDate={startDate}
                                                endDate={endDate}
                                                onChange={(update) => {
                                                    setDateRange(update);
                                                }}
                                                isClearable={true}
                                                placeholderText="Select start and end dates"
                                                className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors cursor-pointer"
                                                calendarClassName="bg-[#1e1e1e] border border-white/10 text-white rounded-lg shadow-2xl"
                                                dayClassName={(date) => "text-gray-200 hover:bg-pink-600 rounded-full"}
                                                wrapperClassName="w-full"
                                                dateFormat="yyyy/MM/dd"
                                            />
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                                        </div>
                                    </div>

                                    {/* Trip Title Section */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Trip Title</label>
                                        <input
                                            type="text"
                                            value={tripTitle}
                                            onChange={(e) => setTripTitle(e.target.value)}
                                            placeholder="Name your adventure (e.g. Summer in Paris)"
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors"
                                        />
                                    </div>

                                    {/* Cover Image Section */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Trip Cover Image</label>
                                        <div className="relative group cursor-pointer">
                                            <div className={`w-full h-32 rounded-lg border-2 border-dashed ${coverImage ? 'border-pink-500' : 'border-white/20'} flex items-center justify-center bg-black/30 overflow-hidden`}>
                                                {coverImage ? (
                                                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center text-gray-400">
                                                        <ImageIcon size={24} className="mb-2" />
                                                        <span className="text-sm">Click to upload cover</span>
                                                    </div>
                                                )}
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={handleCoverImageUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !city || !country || !startDate || !endDate}
                                        className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? "Creating..." : "Start Journey"}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AddTripModal;
