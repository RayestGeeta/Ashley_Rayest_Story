import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Edit3, Save, Trash2, Image as ImageIcon, Video, X, Eye, Grid } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTravel } from '../context/TravelContext';
import { fileToBase64 } from '../utils/fileHelpers';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import GallerySelector from '../components/GallerySelector';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { visitedPlaces, updatePlaceArticle, removePlace, saveToDisk } = useTravel();

    const place = visitedPlaces.find(p => p.id == id);

    const [isEditing, setIsEditing] = useState(false);
    
    // Editor State
    const [title, setTitle] = useState(place?.article?.title || '');
    const [content, setContent] = useState(place?.article?.content || '');
    const [coverImage, setCoverImage] = useState(place?.article?.coverImage || place?.coverImage || '');
    const [tripStartDate, setTripStartDate] = useState(place?.article?.tripStartDate || '');
    const [tripEndDate, setTripEndDate] = useState(place?.article?.tripEndDate || '');
    const [mediaItems, setMediaItems] = useState(place?.article?.media || []);

    // Gallery Selector State
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryMode, setGalleryMode] = useState('cover'); // 'cover' or 'content'

    if (!place) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white bg-[var(--bg-primary)]">
                <div className="text-center">
                    <h2 className="text-2xl mb-4">Location not found</h2>
                    <Link to="/" className="text-[var(--accent-color)] hover:underline">Return to Map</Link>
                </div>
            </div>
        );
    }

    const handleSave = async () => {
        // 1. Calculate new state locally to ensure we have it immediately for saving
        const updatedPlaces = visitedPlaces.map(p => 
            p.id === place.id 
                ? { 
                    ...p, 
                    // Sync cover to root
                    coverImage: coverImage || p.coverImage,
                    article: { 
                        ...p.article, 
                        title, 
                        content, 
                        coverImage, 
                        tripStartDate,
                        tripEndDate,
                        media: mediaItems 
                    } 
                  }
                : p
        );

        // 2. Update Context State (for UI)
        updatePlaceArticle(place.id, {
            title,
            content,
            coverImage,
            tripStartDate,
            tripEndDate,
            media: mediaItems
        });
        
        // 3. Trigger Disk Save immediately with the fresh data
        // This ensures that even if state update is batched/slow, the file writer gets the correct data
        await saveToDisk({ visitedPlaces: updatedPlaces });

        setIsEditing(false);
    };

    const handleAddMedia = async (e, type) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                // Insert into markdown
                const mediaTag = type === 'image' 
                    ? `\n\n![Image](${base64})\n\n`
                    : `\n\n[Video](${base64})\n\n`; // Simple link for now, or custom renderer later
                
                setContent(prev => prev + mediaTag);
            } catch (err) {
                console.error("Media upload failed", err);
            }
        }
    };

    const handleCoverImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                setCoverImage(base64);
            } catch (err) {
                console.error("Cover upload failed", err);
            }
        }
    };

    const handleGallerySelect = (photo) => {
        if (galleryMode === 'cover') {
            setCoverImage(photo.src);
        } else {
            const markdown = `\n\n![${photo.caption || 'Image'}](${photo.src})\n\n`;
            setContent(prev => prev + markdown);
        }
        setIsGalleryOpen(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen pb-20 bg-[var(--bg-primary)]"
        >
            <GallerySelector 
                isOpen={isGalleryOpen} 
                onClose={() => setIsGalleryOpen(false)} 
                onSelect={handleGallerySelect} 
            />

            {/* Hero Header */}
            <div className="relative h-[60vh] w-full overflow-hidden group">
                <img src={coverImage || `https://picsum.photos/1200/800`} alt={place.cityName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/40 to-black/30" />

                <div className="absolute top-6 left-6 z-20 flex gap-4">
                    <Link to="/" className="flex items-center gap-2 px-4 py-2 glass-panel text-white hover:bg-white/10 transition-colors">
                        <ArrowLeft size={16} /> Back to Map
                    </Link>
                    {!isEditing && (
                        <button
                            onClick={() => {
                                setTitle(place.article?.title || place.cityName + " Trip");
                                setContent(place.article?.content || "");
                                setIsEditing(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 glass-panel text-[var(--accent-color)] hover:bg-white/10 transition-colors"
                        >
                            <Edit3 size={16} /> Edit Article
                        </button>
                    )}
                    {isEditing && (
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-lg"
                        >
                            <Save size={16} /> Save Changes
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to delete this trip?")) {
                                removePlace(place.id);
                                navigate('/');
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 glass-panel text-red-400 hover:bg-black/40 hover:text-red-300 transition-colors border-red-500/30"
                    >
                        <Trash2 size={16} /> Delete Trip
                    </button>
                </div>

                {/* Cover Image Upload Overlay (Edit Mode) */}
                {isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity gap-4">
                        <label className="cursor-pointer bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105">
                            <ImageIcon size={20} /> Upload Cover
                            <input type="file" accept="image/*" onChange={handleCoverImageUpload} className="hidden" />
                        </label>
                        <button 
                            onClick={() => {
                                setGalleryMode('cover');
                                setIsGalleryOpen(true);
                            }}
                            className="cursor-pointer bg-pink-600/80 hover:bg-pink-600 text-white px-6 py-3 rounded-full backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-pink-600/20"
                        >
                            <Grid size={20} /> Select from Gallery
                        </button>
                    </div>
                )}

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-6xl mx-auto">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex flex-wrap items-center gap-4 text-[var(--accent-color)] mb-4"
                    >
                        <span className="flex items-center gap-1 bg-[var(--bg-secondary)] px-3 py-1 rounded-full text-sm border border-[var(--glass-border)]">
                            <MapPin size={14} /> {place.cityName}, {place.countryName}
                        </span>
                        
                        {isEditing ? (
                            <div className="flex items-center gap-2 bg-[var(--bg-secondary)] px-4 py-2 rounded-full text-sm border border-[var(--glass-border)] hover:bg-white/10 transition-colors z-50 relative">
                                <Calendar size={14} className="text-[var(--accent-color)]" />
                                <DatePicker
                                    selected={tripStartDate ? new Date(tripStartDate) : null}
                                    onChange={(dates) => {
                                        const [start, end] = dates;
                                        setTripStartDate(start ? start.toISOString().split('T')[0] : '');
                                        setTripEndDate(end ? end.toISOString().split('T')[0] : '');
                                    }}
                                    startDate={tripStartDate ? new Date(tripStartDate) : null}
                                    endDate={tripEndDate ? new Date(tripEndDate) : null}
                                    selectsRange
                                    placeholderText="Select start and end dates"
                                    className="bg-transparent border-none text-white focus:outline-none w-48 text-center font-mono cursor-pointer"
                                    dateFormat="yyyy-MM-dd"
                                    isClearable
                                />
                            </div>
                        ) : (
                            (place.article?.tripStartDate && place.article?.tripEndDate) ? (
                                <span className="flex items-center gap-1 bg-[var(--bg-secondary)] px-3 py-1 rounded-full text-sm border border-[var(--glass-border)]">
                                    <Calendar size={14} /> {place.article.tripStartDate} — {place.article.tripEndDate}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 bg-[var(--bg-secondary)] px-3 py-1 rounded-full text-sm border border-[var(--glass-border)]">
                                    <Calendar size={14} /> {place.startDate} — {place.endDate}
                                </span>
                            )
                        )}
                    </motion.div>
                    
                    {isEditing ? (
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-5xl md:text-7xl font-bold text-white bg-transparent border-b border-white/20 focus:border-[var(--accent-color)] outline-none w-full"
                            placeholder="Enter Article Title..."
                        />
                    ) : (
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight shadow-black drop-shadow-2xl"
                        >
                            {place.article?.title || place.cityName}
                        </motion.h1>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-4xl mx-auto px-6 mt-12">
                {isEditing ? (
                    <div className="glass-panel p-6 border border-white/10 rounded-xl">
                        {/* Toolbar */}
                        <div className="flex gap-2 mb-4 border-b border-white/10 pb-4 overflow-x-auto">
                            <label className="p-2 hover:bg-white/10 rounded cursor-pointer text-gray-300 transition-colors" title="Upload Image">
                                <ImageIcon size={20} />
                                <input type="file" accept="image/*" onChange={(e) => handleAddMedia(e, 'image')} className="hidden" />
                            </label>
                            <button 
                                onClick={() => {
                                    setGalleryMode('content');
                                    setIsGalleryOpen(true);
                                }}
                                className="p-2 hover:bg-white/10 rounded cursor-pointer text-pink-400 hover:text-pink-300 transition-colors" 
                                title="Select from Photo Wall"
                            >
                                <Grid size={20} />
                            </button>
                            {/* Add more toolbar items as needed */}
                            <div className="text-xs text-gray-500 flex items-center ml-auto">
                                Supports Markdown & GFM
                            </div>
                        </div>
                        
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-[600px] bg-transparent text-gray-200 resize-none outline-none font-mono text-lg leading-relaxed"
                            placeholder="Start writing your story... (Markdown supported)"
                        />
                    </div>
                ) : (
                    <div className="prose prose-invert prose-lg max-w-none">
                        {place.article?.content ? (
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    img: ({node, ...props}) => <img {...props} className="rounded-xl shadow-lg my-8 w-full" />,
                                    a: ({node, ...props}) => {
                                        // Simple video handler if link text is "Video"
                                        if (props.children?.[0] === "Video" && props.href.startsWith("data:video")) {
                                            return <video src={props.href} controls className="w-full rounded-xl shadow-lg my-8" />
                                        }
                                        return <a {...props} className="text-[var(--accent-color)] hover:underline" />
                                    }
                                }}
                            >
                                {place.article.content}
                            </ReactMarkdown>
                        ) : (
                            <div className="text-center py-20 border border-dashed border-gray-800 rounded-xl">
                                <p className="text-gray-400 text-lg mb-4">No article written yet.</p>
                                <button
                                    onClick={() => {
                                        setTitle(place.cityName + " Trip");
                                        setContent("# My Journey\n\nStart writing...");
                                        setIsEditing(true);
                                    }}
                                    className="bg-[var(--accent-color)] text-black font-bold px-6 py-3 rounded-full hover:opacity-90"
                                >
                                    Write Article
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default PostDetail;
