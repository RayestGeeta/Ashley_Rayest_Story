import React, { useState, useMemo } from 'react';
import { useTravel } from '../context/TravelContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IS_EDIT_MODE } from '../config';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EMOJI_CATEGORIES = {
    Weather: ['🌞', '☁️', '🌧️', '❄️', '⛈️', '🌈', '🌬️'],
    Mood: ['😊', '😂', '😎', '😍', '😴', '🤔', '🥳'],
    Activity: ['🏃', '🏊', '🚴', '🎮', '📚', '🎬', '🎨'],
    Food: ['🍔', '🍕', '🍣', '🍦', '☕', '🍺', '🥂'],
    Travel: ['✈️', '🚗', '🚂', '⛺', '🏝️', '🗽', '🗺️']
};
const TravelCalendar = () => {
    const { visitedPlaces, calendarMarkers, toggleMarker, calendarNotes, setCalendarNote, saveToDisk } = useTravel();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [customEmoji, setCustomEmoji] = useState('');

    const handleAddCustomEmoji = () => {
        if (!customEmoji) return;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
        toggleMarker(dateStr, customEmoji);
        setCustomEmoji('');
    };

    // Get all logs flattened with their place info
    const allLogs = useMemo(() => {
        const logs = [];
        visitedPlaces.forEach(place => {
            if (place.logs) {
                place.logs.forEach(log => {
                    logs.push({
                        ...log,
                        placeId: place.id,
                        cityName: place.cityName,
                        countryName: place.countryName,
                        originalDate: log.date // YYYY-MM-DD
                    });
                });
            }
        });
        return logs;
    }, [visitedPlaces]);

    // Calendar Logic
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay, year, month };
    };

    const { days, firstDay, year, month } = getDaysInMonth(currentDate);

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
        setSelectedDate(null);
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
        setSelectedDate(null);
    };

    const getLogsForDay = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return allLogs.filter(log => log.originalDate === dateStr);
    };

    const getMarkersForDay = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return calendarMarkers.filter(m => m.date === dateStr);
    };

    const getNoteForDay = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return calendarNotes.find(n => n.date === dateStr)?.note || '';
    };

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    return (
        <div className="min-h-screen bg-[#050510] text-white p-8 md:p-12 ml-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-emerald-400 mb-2">
                            Travel Journal
                        </h1>
                        <p className="text-gray-400">Your adventures through time.</p>
                    </div>

                    <div className="flex gap-4">
                        {/* Save Button (Edit Mode) */}
                        {IS_EDIT_MODE && (
                            <button
                                onClick={saveToDisk}
                                className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/40 text-green-300 px-6 py-2 rounded-full cursor-pointer transition-all border border-green-500/30 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] h-full"
                                title="Save all data to disk"
                            >
                                <Save size={18} />
                                <span className="hidden md:inline font-medium">Save</span>
                            </button>
                        )}

                        {/* Month Navigator */}
                        <div className="flex items-center gap-6 glass-panel px-6 py-2 rounded-full">
                            <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <h2 className="text-xl font-bold min-w-[140px] text-center">
                                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h2>
                            <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Calendar Grid */}
                    <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5 bg-black/40">
                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 mb-4 text-center">
                            {daysOfWeek.map(d => (
                                <div key={d} className="text-gray-500 text-sm font-medium py-2 uppercase tracking-wider">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Days */}
                        <div className="grid grid-cols-7 gap-2">
                            {/* Empty cells for padding */}
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="h-24 md:h-32 rounded-xl bg-transparent" />
                            ))}

                            {/* Actual Days */}
                            {Array.from({ length: days }).map((_, i) => {
                                const day = i + 1;
                                const dayLogs = getLogsForDay(day);
                                const dayMarkers = getMarkersForDay(day);
                                const isSelected = selectedDate === day;

                                return (
                                    <motion.div
                                        key={day}
                                        onClick={() => setSelectedDate(day)}
                                        className={`
                                            h-24 md:h-32 rounded-xl p-3 relative cursor-pointer transition-all border
                                            ${isSelected
                                                ? 'bg-white/10 border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                                                : isToday(day)
                                                    ? 'bg-emerald-900/20 border-emerald-500/30'
                                                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                            }
                                        `}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className={`text-sm font-bold ${isToday(day) ? 'text-emerald-400' : 'text-gray-400'}`}>
                                                {day}
                                            </div>
                                            {/* Daily Markers (Top Right) */}
                                            <div className="flex gap-0.5 text-sm">
                                                {dayMarkers.map((m, idx) => (
                                                    <span key={m.id}>{m.icon}</span>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Simple Note Preview */}
                                        {getNoteForDay(day) && (
                                            <div className="text-[10px] text-emerald-300 italic truncate mt-1 opacity-70">
                                                "{getNoteForDay(day)}"
                                            </div>
                                        )}

                                        {/* Log Markers (Chips) */}
                                        <div className="mt-2 flex flex-wrap content-start gap-1 overflow-hidden h-[calc(100%-40px)]">
                                            {dayLogs.slice(0, 3).map((log, idx) => (
                                                <div
                                                    key={idx}
                                                    title={log.title}
                                                    className="w-full text-[10px] truncate px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                                                >
                                                    {log.cityName}
                                                </div>
                                            ))}
                                            {dayLogs.length > 3 && (
                                                <div className="text-[10px] text-gray-500">+{dayLogs.length - 3} more</div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sidebar / Details Panel */}
                    <div className="lg:col-span-1">
                        <AnimatePresence mode="wait">
                            {selectedDate ? (
                                <motion.div
                                    key="details"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="glass-panel p-6 rounded-2xl border border-white/10 h-full max-h-[800px] overflow-y-auto"
                                >
                                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center justify-between">
                                        <span className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
                                                {selectedDate}
                                            </div>
                                            {currentDate.toLocaleString('default', { month: 'long' })}
                                        </span>
                                    </h3>

                                    {/* Mood/Weather Selector */}
                                    <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/5">
                                        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Day Note</h4>
                                        <textarea 
                                            value={getNoteForDay(selectedDate)}
                                            onChange={(e) => {
                                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
                                                setCalendarNote(dateStr, e.target.value);
                                            }}
                                            placeholder="How was your day? (e.g., 'Feeling great!')"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-emerald-500 focus:outline-none resize-none h-20 mb-4"
                                        />

                                        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Add Day Marker</h4>

                                        <div className="space-y-4 mb-4 h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                                                <div key={category}>
                                                    <h5 className="text-[10px] text-emerald-500/80 uppercase font-bold mb-2">{category}</h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        {emojis.map(emoji => {
                                                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
                                                            const isActive = getMarkersForDay(selectedDate).some(m => m.icon === emoji);
                                                            return (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => toggleMarker(dateStr, emoji)}
                                                                    className={`
                                                                        w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all
                                                                        ${isActive
                                                                            ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)] scale-110'
                                                                            : 'bg-black/40 text-gray-400 hover:bg-white/10 hover:text-white hover:scale-105'
                                                                        }
                                                                    `}
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Custom Emoji Input */}
                                        <div className="flex gap-2 pt-2 border-t border-white/5">
                                            <input
                                                type="text"
                                                placeholder="Or type any emoji..."
                                                maxLength={2}
                                                value={customEmoji}
                                                onChange={(e) => setCustomEmoji(e.target.value)}
                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none w-full"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddCustomEmoji();
                                                }}
                                            />
                                            <button
                                                onClick={handleAddCustomEmoji}
                                                className="text-xs bg-white/10 hover:bg-white/20 px-3 rounded-lg text-gray-300 hover:text-white transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    {/* Logs List */}
                                    <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Memories</h4>
                                    <div className="space-y-4">
                                        {getLogsForDay(selectedDate).length > 0 ? (
                                            getLogsForDay(selectedDate).map(log => (
                                                <Link to={`/post/${log.placeId}`} key={log.id}>
                                                    <div className="group bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all mb-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-bold text-emerald-200 group-hover:text-emerald-300">{log.title}</h4>
                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Clock size={10} /> {log.originalDate}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                                                            <MapPin size={12} /> {log.cityName}, {log.countryName}
                                                        </div>
                                                        {log.image && (
                                                            <img src={log.image} alt={log.title} className="w-full h-32 object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                                                        )}
                                                        <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                                                            {log.content}
                                                        </p>
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                                                <CalendarIcon size={32} className="mx-auto mb-2 opacity-20" />
                                                <p className="text-sm">No stories written for this day.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-2xl"
                                >
                                    <CalendarIcon size={64} className="mb-4 text-emerald-900" />
                                    <p>Select a date to view memories</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TravelCalendar;
