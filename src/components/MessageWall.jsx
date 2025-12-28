import React from 'react';
import { motion } from 'framer-motion';
import { Heart, X } from 'lucide-react';

const MessageWall = ({ messages, onBringToFront, onClose }) => {
    return (
        <div className="relative w-full h-[80vh] overflow-hidden bg-gray-900/50 rounded-xl border border-white/10 shadow-2xl">
            {/* Windows Desktop Background */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            {messages.map((msg) => {
                const isMe = msg.sender === 'Rayest'; // Me (Rayest)
                
                // Romantic Theme Colors
                // Me: Soft Blue Gradient
                // You: Soft Pink Gradient
                const headerGradient = isMe 
                    ? 'bg-gradient-to-r from-blue-400 to-indigo-400' 
                    : 'bg-gradient-to-r from-pink-400 to-rose-400';
                
                const borderColor = isMe ? 'border-blue-200' : 'border-pink-200';
                const shadowColor = isMe ? 'shadow-blue-200/50' : 'shadow-pink-200/50';
                
                return (
                    <motion.div
                        key={msg.id}
                        drag
                        dragMomentum={false}
                        onDragStart={() => onBringToFront(msg.id)}
                        onMouseDown={() => onBringToFront(msg.id)}
                        layout={false} 
                        initial={{ opacity: 0, scale: 0.8, x: 0, y: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: 'absolute',
                            left: `${msg.x}%`,
                            top: `${msg.y}%`,
                            zIndex: msg.zIndex,
                        }}
                        className={`w-64 md:w-72 shadow-lg ${shadowColor} rounded-xl overflow-hidden border ${borderColor} bg-white/95 backdrop-blur-sm flex flex-col`}
                    >
                        {/* Romantic Header */}
                        <div className={`${headerGradient} px-3 py-2 flex items-center justify-between cursor-move select-none`}>
                            <div className="flex items-center gap-2">
                                <Heart size={12} className="text-white fill-white animate-pulse" />
                                <span className="text-xs font-medium text-white tracking-wide">
                                    {msg.date}
                                </span>
                            </div>
                            
                            {/* Close Button (Heart Break) */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose(msg.id);
                                }}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Message Content */}
                        <div className="p-4 flex flex-col gap-3">
                            <p className="text-gray-700 text-sm font-serif leading-relaxed tracking-wide italic">
                                "{msg.content}"
                            </p>
                            
                            <div className="flex justify-end">
                                <span className={`text-[10px] uppercase tracking-widest font-medium ${isMe ? 'text-blue-400' : 'text-pink-400'}`}>
                                    {isMe ? 'From Rayest' : 'From Ashley'}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default MessageWall;
