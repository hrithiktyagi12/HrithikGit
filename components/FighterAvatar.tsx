
import React from 'react';
import { FighterID, MoveType } from '../types';
import { FIGHTERS_DATA } from '../constants';

interface FighterAvatarProps {
  id: FighterID;
  state: MoveType;
  direction: number;
  frame: number;
  isStunned: boolean;
  portraitUrl?: string;
}

const FighterAvatar: React.FC<FighterAvatarProps> = ({ id, state, direction, frame, isStunned, portraitUrl }) => {
  const data = FIGHTERS_DATA[id];
  
  const bob = state === MoveType.CROUCH ? 0 : Math.sin(frame * 0.2) * 2;
  const punchReach = state === MoveType.PUNCH ? Math.min(30, (frame % 15) * 6) : 0;
  const kickReach = state === MoveType.KICK ? Math.min(35, (frame % 15) * 7) : 0;
  const hitShake = state === MoveType.HIT ? Math.sin(frame * 0.8) * 8 : 0;
  
  // Height and vertical offset adjustments for crouching
  const crouchOffset = state === MoveType.CROUCH ? 40 : 0;

  return (
    <div 
      className={`relative transition-transform duration-75 ${isStunned ? 'opacity-70 grayscale' : ''}`}
      style={{ transform: `scaleX(${direction}) translateX(${hitShake}px) translateY(${crouchOffset}px)` }}
    >
      {/* Sprite Container */}
      <div className="relative w-32 h-40 flex items-center justify-center">
        {/* Glow behind character */}
        <div 
          className="absolute inset-0 blur-3xl opacity-20 rounded-full"
          style={{ backgroundColor: data.color }}
        />

        {/* Character Base Body (Stylized) */}
        <div className="absolute inset-0 flex flex-col items-center">
          {/* AI Generated Head */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 shadow-lg z-20" style={{ transform: `translateY(${bob}px)` }}>
            {portraitUrl ? (
              <img src={portraitUrl} className="w-full h-full object-cover scale-150" alt="fighter head" />
            ) : (
              <div className="w-full h-full bg-gray-800" />
            )}
          </div>

          {/* Torso & Arms */}
          <div className="relative mt-[-10px] w-20 h-24 z-10">
            {/* Body Shape */}
            <div 
              className="absolute inset-0 rounded-xl shadow-xl transition-all duration-300"
              style={{ 
                backgroundColor: data.color, 
                clipPath: state === MoveType.CROUCH 
                  ? 'polygon(20% 40%, 80% 40%, 100% 100%, 0% 100%)' 
                  : 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' 
              }}
            />
            
            {/* Dynamic Arms */}
            <div 
              className="absolute left-[-20px] top-4 w-24 h-6 rounded-full origin-right transition-all"
              style={{ 
                backgroundColor: data.color, 
                width: 24 + punchReach,
                opacity: state === MoveType.PUNCH ? 1 : 0.6,
                transform: state === MoveType.BLOCK 
                  ? 'rotate(45deg) translateY(-10px)' 
                  : `rotate(${state === MoveType.PUNCH ? '-5deg' : '20deg'})`
              }} 
            />
            <div 
              className="absolute right-[-10px] top-4 w-24 h-6 rounded-full origin-left opacity-60 transition-all"
              style={{ 
                backgroundColor: data.color,
                transform: state === MoveType.BLOCK ? 'rotate(-45deg) translateY(-10px)' : 'none'
              }} 
            />
          </div>

          {/* Legs */}
          <div className="flex gap-4 mt-[-5px]">
            <div 
              className="w-6 h-12 bg-gray-900 rounded-b-lg border-x-2 transition-all" 
              style={{ 
                borderColor: data.color,
                height: state === MoveType.CROUCH ? 8 : 12 
              }} 
            />
            <div 
              className="w-6 h-12 bg-gray-900 rounded-b-lg border-x-2 transition-all"
              style={{ 
                borderColor: data.color,
                height: state === MoveType.CROUCH ? 8 : (12 + (state === MoveType.KICK ? 15 : 0)),
                transform: state === MoveType.KICK ? 'rotate(-60deg) translateX(10px)' : 'none'
              }} 
            />
          </div>
        </div>

        {/* Visual Effects */}
        {state === MoveType.SPECIAL && (
          <div className="absolute inset-0 border-4 border-white rounded-full animate-ping opacity-30" />
        )}
      </div>

      {/* Ground Shadow */}
      <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-24 h-4 bg-black/40 blur-md rounded-full" />
    </div>
  );
};

export default FighterAvatar;
