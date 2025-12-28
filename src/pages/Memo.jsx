import React, { useState, useEffect } from 'react';
import { StickyNote, Save } from 'lucide-react';

const Memo = () => {
    const [memo, setMemo] = useState(() => {
        return localStorage.getItem('travel_blog_memo') || '';
    });
    const [lastSaved, setLastSaved] = useState(null);

    const handleChange = (e) => {
        setMemo(e.target.value);
    };

    // Auto-save logic
    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem('travel_blog_memo', memo);
            setLastSaved(new Date());
        }, 1000);

        return () => clearTimeout(timer);
    }, [memo]);

    return (
        <div className="min-h-screen bg-[#021025] text-white p-8 md:p-12 ml-16">
            <div className="max-w-4xl mx-auto h-[80vh] flex flex-col">
                <div className="flex justify-between items-end mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-600/20 rounded-full text-yellow-400">
                            <StickyNote size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-orange-400">
                                Travel Memo
                            </h1>
                            <p className="text-gray-400 mt-1">Quick notes, packing lists, or random thoughts.</p>
                        </div>
                    </div>
                    {lastSaved && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 animate-pulse">
                            <Save size={12} /> Saved at {lastSaved.toLocaleTimeString()}
                        </div>
                    )}
                </div>

                <div className="flex-1 glass-panel p-1 rounded-2xl border border-white/10 relative">
                    {/* Paper texture/lines effect could go here */}
                    <textarea
                        value={memo}
                        onChange={handleChange}
                        placeholder="Start typing your notes here..."
                        className="w-full h-full bg-transparent border-none focus:ring-0 resize-none p-6 text-lg leading-relaxed text-gray-200 custom-scrollbar placeholder-gray-600 focus:outline-none"
                        spellCheck={false}
                    />
                </div>
            </div>
        </div>
    );
};

export default Memo;
