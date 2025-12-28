import React from 'react';
import { Gamepad2 } from 'lucide-react';
import AircraftWarGame from '../components/Games/AircraftWarGame';

const Games = () => {
    return (
        <div className="min-h-screen bg-[#021025] text-white p-8 md:p-12 ml-16 flex flex-col items-center">
            <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-pink-600/20 rounded-full flex items-center justify-center text-pink-500">
                        <Gamepad2 size={24} />
                    </div>
                    <h1 className="text-3xl font-bold">Mini Games Arcade</h1>
                </div>
                <p className="text-gray-400">
                    Classic Aircraft War Game - Ported from C
                </p>
            </div>
            
            <AircraftWarGame />
        </div>
    );
};

export default Games;
