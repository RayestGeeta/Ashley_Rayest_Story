import React, { useState, useMemo } from 'react';
import { X, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import galleryDataJSON from '../data/galleryData.json';

const GallerySelector = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const photos = useMemo(() => {
        if (!galleryDataJSON) return [];
        return galleryDataJSON.map(p => ({
            ...p,
            thumbnail: p.src.replace('/gallery_images/', '/gallery_images/thumbnails/')
        }));
    }, []);

    const filteredPhotos = photos.filter(photo => 
        photo.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1a1a1a] border border-white/10 w-full max-w-4xl h-[80vh] rounded-2xl flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Select from Photo Wall</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="text-gray-400 hover:text-white" size={24} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-white/10 bg-black/20">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search memories..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {filteredPhotos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <p>No photos found matching "{searchTerm}"</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredPhotos.map((photo) => (
                                <div 
                                    key={photo.id}
                                    onClick={() => onSelect(photo)}
                                    className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-white/5 hover:border-pink-500/50 transition-all"
                                >
                                    <img 
                                        src={photo.thumbnail || photo.src} 
                                        alt={photo.caption}
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all bg-pink-600 p-2 rounded-full text-white shadow-lg">
                                            <Check size={20} />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-xs text-white truncate">{photo.caption}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default GallerySelector;
