
import React from 'react';
import { Fighter, AIInsight } from '../types';
import { FIGHTERS_DATA } from '../constants';

interface HUDProps {
  player1: Fighter;
  player2: Fighter;
  timer: number;
  round: number;
  insights: AIInsight[];
}

const HUD: React.FC<HUDProps> = ({ player1, player2, timer, round, insights }) => {
  const p1Data = FIGHTERS_DATA[player1.id];
  const p2Data = FIGHTERS_DATA[player2.id];

  const p1HpPercent = (player1.stats.hp / player1.stats.maxHp) * 100;
  const p2HpPercent = (player2.stats.hp / player2.stats.maxHp) * 100;

  return (
    <div className="absolute top-0 left-0 w-full p-6 flex flex-col pointer-events-none z-50">
      <div className="flex justify-between items-start">
        {/* Player 1 Health */}
        <div className="w-1/3 flex flex-col gap-1">
          <div className="flex justify-between items-end mb-1">
            <span className="font-game text-2xl neon-blue italic">{p1Data.name}</span>
            <span className="font-game text-sm text-gray-400">P1</span>
          </div>
          <div className="h-8 w-full glass bg-gray-900 overflow-hidden skew-x-[-12deg] border-2 border-blue-500">
            <div 
              className="h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-300 shadow-[0_0_15px_#3b82f6]"
              style={{ width: `${p1HpPercent}%` }}
            />
          </div>
          <div className="text-right text-xs text-blue-300 mt-1 font-game">COMBO: {player1.currentCombo.length}</div>
        </div>

        {/* Timer and Round */}
        <div className="flex flex-col items-center gap-2 -mt-2">
          <div className="text-4xl font-game neon-gold bg-black/50 px-6 py-2 rounded-lg border-b-2 border-yellow-500">
            {timer.toString().padStart(2, '0')}
          </div>
          <div className="text-sm font-game text-gray-300">ROUND {round}</div>
        </div>

        {/* Player 2 Health */}
        <div className="w-1/3 flex flex-col gap-1 items-end">
          <div className="flex justify-between items-end mb-1 w-full">
            <span className="font-game text-sm text-gray-400">CPU</span>
            <span className="font-game text-2xl neon-purple italic">{p2Data.name}</span>
          </div>
          <div className="h-8 w-full glass bg-gray-900 overflow-hidden skew-x-[12deg] border-2 border-purple-500">
            <div 
              className="h-full bg-gradient-to-l from-purple-700 to-purple-400 transition-all duration-300 shadow-[0_0_15px_#a855f7] ml-auto"
              style={{ width: `${p2HpPercent}%` }}
            />
          </div>
          <div className="text-left text-xs text-purple-300 mt-1 font-game w-full">COMBO: {player2.currentCombo.length}</div>
        </div>
      </div>

      {/* AI Coach Insight */}
      {insights.length > 0 && (
        <div className="mt-8 self-center max-w-md w-full glass p-3 rounded-xl border border-blue-400/30 animate-pulse">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">AI</div>
             <p className="text-blue-100 text-sm font-medium italic">
                "{insights[insights.length - 1].message}"
             </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default HUD;
