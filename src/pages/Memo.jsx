import React, { useState, useEffect } from 'react';
import { StickyNote, Save } from 'lucide-react';
import { useTravel } from '../context/TravelContext';
import { IS_EDIT_MODE } from '../config';
import memoData from '../data/memoData.json';

const Memo = () => {
    const { saveMemoToDisk } = useTravel();
    const [memo, setMemo] = useState(() => {
        // Prioritize data from disk, then localStorage
        if (memoData && typeof memoData.content === 'string' && memoData.content.length > 0) {
            return memoData.content;
        }
        return localStorage.getItem('travel_blog_memo') || '';
    });
    const [lastSaved, setLastSaved] = useState(null);
    const [isSavingToDisk, setIsSavingToDisk] = useState(false);

    const handleChange = (e) => {
        setMemo(e.target.value);
    };

    // Auto-save logic (Local Storage)
    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem('travel_blog_memo', memo);
            setLastSaved(new Date());
        }, 1000);

        return () => clearTimeout(timer);
    }, [memo]);

    // Manual Save to Disk
    const handleSaveToDisk = async () => {
        if (!IS_EDIT_MODE) return;
        setIsSavingToDisk(true);
        const success = await saveMemoToDisk(memo);
        setIsSavingToDisk(false);
        if (success) {
            alert('Memo saved to disk successfully!');
        } else {
            alert('Failed to save memo to disk.');
        }
    };

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
                    <div className="flex items-center gap-4">
                        {lastSaved && (
                            <div className="text-xs text-gray-500 flex items-center gap-1 animate-pulse">
                                <Save size={12} /> Auto-saved locally at {lastSaved.toLocaleTimeString()}
                            </div>
                        )}
                        {IS_EDIT_MODE && (
                            <button
                                onClick={handleSaveToDisk}
                                disabled={isSavingToDisk}
                                className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/40 text-green-300 px-4 py-2 rounded-full cursor-pointer transition-all border border-green-500/30 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50"
                                title="Save memo to disk (memoData.json)"
                            >
                                <Save size={18} />
                                <span className="font-medium">{isSavingToDisk ? 'Saving...' : 'Save to Disk'}</span>
                            </button>
                        )}
                    </div>
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
