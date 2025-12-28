import React from 'react';
import { useTravel } from '../context/TravelContext';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';

const AllPosts = () => {
    const { visitedPlaces } = useTravel();

    // Flatten all logs into a single array
    const allPosts = visitedPlaces.flatMap(place => 
        (place.logs || []).map(log => ({
            ...log,
            placeId: place.id,
            cityName: place.cityName,
            countryName: place.countryName,
            date: log.date || place.date
        }))
    ).sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="min-h-screen bg-[#021025] text-white p-8 md:p-12 ml-16">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-8">
                    All Travel Stories
                </h1>

                {allPosts.length === 0 ? (
                    <div className="text-gray-400 text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-xl">No stories written yet.</p>
                        <p className="mt-2 text-sm">Go to the map and add your first trip!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {allPosts.map((post, index) => (
                            <Link to={`/post/${post.placeId}`} key={`${post.placeId}-${index}`} className="group block">
                                <div className="glass-panel p-4 rounded-2xl hover:bg-white/10 transition-all border border-white/10 hover:border-blue-500/30 h-full flex flex-col">
                                    <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                                        <img 
                                            src={post.image || `https://source.unsplash.com/random/800x600?${post.cityName}`} 
                                            alt={post.title} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-xs text-blue-400 mb-2">
                                        <MapPin size={12} /> {post.cityName}, {post.countryName}
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
                                        {post.title || 'Untitled Story'}
                                    </h3>
                                    
                                    <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                                        {post.content}
                                    </p>
                                    
                                    <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4 border-t border-white/5">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                                        <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-blue-400">Read <ArrowRight size={12} /></span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllPosts;
