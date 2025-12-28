import React from 'react';
import { NavLink } from 'react-router-dom';
import { Globe, Sparkles, Calendar, Plus, BookOpen, Rocket, StickyNote, Gamepad2, Heart } from 'lucide-react';
import { useTravel } from '../context/TravelContext';
import { IS_EDIT_MODE } from '../config';

const Sidebar = () => {
    const { openModal } = useTravel();

    return (
        <div className="fixed left-0 top-0 h-full w-16 bg-black/80 backdrop-blur-md border-r border-white/10 z-[2000] flex flex-col items-center py-8 gap-6 overflow-y-auto custom-scrollbar">
            {/* New Romantic Tab */}
            <NavLink
                to="/gallery"
                className={({ isActive }) =>
                    `p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-pink-600 text-white shadow-[0_0_15px_#db2777]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`
                }
                title="Our Gallery"
            >
                {({ isActive }) => (
                    <Heart size={24} fill="currentColor" className={isActive ? "animate-pulse" : ""} />
                )}
            </NavLink>

            {/* Travel Map (formerly Travel Log) */}
            <NavLink
                to="/"
                className={({ isActive }) =>
                    `p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-cyan-600 text-white shadow-[0_0_15px_#0891b2]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`
                }
                title="Travel Map"
            >
                <Globe size={24} />
            </NavLink>

            <NavLink
                to="/star-map"
                className={({ isActive }) =>
                    `p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-purple-600 text-white shadow-[0_0_15px_#9333ea]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`
                }
                title="Star Galaxy"
            >
                <Sparkles size={24} />
            </NavLink>

            {IS_EDIT_MODE && (
                <button
                    onClick={() => openModal()}
                    className="p-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg hover:scale-110 transition-transform"
                    title="Add New Trip"
                >
                    <Plus size={24} />
                </button>
            )}

            <div className="w-8 h-px bg-white/10 my-2" />

            <NavLink
                to="/all-posts"
                className={({ isActive }) =>
                    `p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-600 text-white shadow-[0_0_15px_#2563eb]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`
                }
                title="All Travel Stories"
            >
                <BookOpen size={24} />
            </NavLink>

            <NavLink
                to="/future-plans"
                className={({ isActive }) =>
                    `p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-[0_0_15px_#4f46e5]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`
                }
                title="Future Plans"
            >
                <Rocket size={24} />
            </NavLink>

            <NavLink
                to="/calendar"
                className={({ isActive }) =>
                    `p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-emerald-600 text-white shadow-[0_0_15px_#10b981]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`
                }
                title="Travel Calendar"
            >
                <Calendar size={24} />
            </NavLink>

            <div className="w-8 h-px bg-white/10 my-2" />

            <NavLink
                to="/memo"
                className={({ isActive }) =>
                    `p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-yellow-600 text-white shadow-[0_0_15px_#ca8a04]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`
                }
                title="Memo"
            >
                <StickyNote size={24} />
            </NavLink>

            <NavLink
                to="/games"
                className={({ isActive }) =>
                    `p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-pink-600 text-white shadow-[0_0_15px_#db2777]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`
                }
                title="Mini Games"
            >
                <Gamepad2 size={24} />
            </NavLink>
        </div>
    );
};

export default Sidebar;
