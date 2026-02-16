
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, GameMode, FighterID, Fighter, MoveType, AIInsight } from './types';
import { FIGHTERS_DATA, GRAVITY, JUMP_FORCE, WALK_SPEED, FRICTION, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT, HITBOXES, MOVE_DAMAGE } from './constants';
import { getAIStrategy, getCoachCommentary, getVictorySlogan } from './services/geminiService';
import { shout, playGeminiVoice } from './services/voiceService';
import { generateFighterPortrait } from './services/portraitService';
import HUD from './components/HUD';
import FighterAvatar from './components/FighterAvatar';

const createFighter = (id: FighterID, x: number, direction: number): Fighter => ({
  id,
  name: FIGHTERS_DATA[id].name,
  stats: { ...FIGHTERS_DATA[id].stats },
  position: { x, y: GROUND_Y },
  velocity: { x: 0, y: 0 },
  direction,
  currentState: MoveType.IDLE,
  animationFrame: 0,
  isGrounded: true,
  isStunned: false,
  lastActionTime: Date.now(),
  currentCombo: []
});

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.VS_CPU);
  const [p1, setP1] = useState<Fighter>(createFighter(FighterID.JIN, 200, 1));
  const [p2, setP2] = useState<Fighter>(createFighter(FighterID.PAUL, 800, -1));
  const [timer, setTimer] = useState(99);
  const [round, setRound] = useState(1);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [selectedP1, setSelectedP1] = useState<FighterID>(FighterID.JIN);
  const [selectedP2, setSelectedP2] = useState<FighterID>(FighterID.PAUL);
  const [aiLevel, setAiLevel] = useState<number>(5);
  const [aiStrategy, setAIStrategy] = useState<string>('NORMAL');
  const [difficulty, setDifficulty] = useState<'NORMAL' | 'AI_ADAPTIVE'>('AI_ADAPTIVE');
  const [portraits, setPortraits] = useState<Record<FighterID, string>>({} as any);
  const [isGeneratingPortraits, setIsGeneratingPortraits] = useState(false);

  const keysRef = useRef<Record<string, boolean>>({});
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const aiUpdateTimerRef = useRef<number>(0);

  useEffect(() => {
    const initPortraits = async () => {
      setIsGeneratingPortraits(true);
      const newPortraits = {} as Record<FighterID, string>;
      const promises = Object.values(FighterID).map(async (id) => {
        const url = await generateFighterPortrait(FIGHTERS_DATA[id].name, FIGHTERS_DATA[id].description);
        newPortraits[id] = url;
      });
      await Promise.all(promises);
      setPortraits(newPortraits);
      setIsGeneratingPortraits(false);
    };
    initPortraits();
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
  const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const triggerVictory = async (winner: Fighter) => {
    setGameState(GameState.GAME_OVER);
    const slogan = await getVictorySlogan(winner.name);
    shout("YES! I WON!");
    playGeminiVoice(slogan);
  };

  const updateAI = useCallback(async () => {
    if (gameMode !== GameMode.VS_CPU || difficulty !== 'AI_ADAPTIVE') return;
    const context = {
      playerHP: p1.stats.hp,
      opponentHP: p2.stats.hp,
      distance: Math.abs(p1.position.x - p2.position.x),
      playerLastMoves: p1.currentCombo.slice(-3),
      opponentLastMoves: p2.currentCombo.slice(-3),
      round
    };
    const result = await getAIStrategy(context);
    setAIStrategy(result.strategy);
    setAiLevel(result.level);
    const commentary = await getCoachCommentary(context);
    setInsights(prev => [...prev, { type: 'COACH' as const, message: commentary, timestamp: Date.now() }].slice(-5));
  }, [p1.stats.hp, p1.position.x, p1.currentCombo, p2.stats.hp, p2.position.x, p2.currentCombo, round, gameMode, difficulty]);

  const updateFighter = (f: Fighter, other: Fighter, pIdx: number, dt: number): Fighter => {
    const nextF = { ...f };
    nextF.animationFrame++;
    const isCurrentPlayerControlled = pIdx === 1 || (pIdx === 2 && gameMode === GameMode.VS_PLAYER);

    // Dynamic key mapping based on user request
    const controls = pIdx === 1 ? {
      left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', punch: 'KeyC', kick: 'KeyV', block: 'KeyB'
    } : {
      left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', punch: 'KeyU', kick: 'KeyI', block: 'KeyO'
    };

    if (isCurrentPlayerControlled && !f.isStunned) {
      // Attacks take precedence
      if (keysRef.current[controls.punch] && f.currentState !== MoveType.PUNCH) {
        nextF.currentState = MoveType.PUNCH;
        nextF.animationFrame = 0;
        shout("HIYAH!", 1.2);
      } else if (keysRef.current[controls.kick] && f.currentState !== MoveType.KICK) {
        nextF.currentState = MoveType.KICK;
        nextF.animationFrame = 0;
        shout("TAKE THIS!", 1.1);
      } else if (keysRef.current[controls.block]) {
        nextF.currentState = MoveType.BLOCK;
        nextF.velocity.x = 0;
      } else if (keysRef.current[controls.down] && f.isGrounded) {
        nextF.currentState = MoveType.CROUCH;
        nextF.velocity.x = 0;
      } else {
        // Movement
        if (keysRef.current[controls.left]) {
          nextF.velocity.x = -WALK_SPEED;
          nextF.currentState = MoveType.WALK;
        } else if (keysRef.current[controls.right]) {
          nextF.velocity.x = WALK_SPEED;
          nextF.currentState = MoveType.WALK;
        } else {
          nextF.velocity.x *= FRICTION;
          if (Math.abs(nextF.velocity.x) < 0.1) nextF.velocity.x = 0;
          if (f.currentState !== MoveType.PUNCH && f.currentState !== MoveType.KICK && f.currentState !== MoveType.HIT) {
             nextF.currentState = MoveType.IDLE;
          }
        }
      }

      if (keysRef.current[controls.up] && f.isGrounded) {
        nextF.velocity.y = JUMP_FORCE;
        nextF.isGrounded = false;
        nextF.currentState = MoveType.JUMP;
      }
    } else if (pIdx === 2 && gameMode === GameMode.VS_CPU && !f.isStunned) {
      // AI Logic
      const dist = other.position.x - nextF.position.x;
      const attackProb = (aiLevel / 10) * 0.15;
      const targetDist = aiStrategy === 'AGGRESSIVE' ? 60 : (aiStrategy === 'EVASIVE' ? 300 : 150);

      if (Math.abs(dist) > targetDist) {
        nextF.velocity.x = Math.sign(dist) * WALK_SPEED * (0.5 + aiLevel / 20);
        nextF.currentState = MoveType.WALK;
      } else {
        nextF.velocity.x *= FRICTION;
        if (Math.random() < attackProb) {
          nextF.currentState = Math.random() > 0.4 ? MoveType.PUNCH : MoveType.KICK;
          nextF.animationFrame = 0;
          if (Math.random() > 0.8) shout("RRAGH!", 0.8);
        } else if (other.currentState === MoveType.PUNCH || other.currentState === MoveType.KICK) {
          // React to player attack with block
          if (Math.random() < (aiLevel / 10)) {
            nextF.currentState = MoveType.BLOCK;
            nextF.velocity.x = 0;
          }
        }
      }
    }

    // Animation reset
    if ((f.currentState === MoveType.PUNCH || f.currentState === MoveType.KICK) && nextF.animationFrame > 20) {
      nextF.currentState = MoveType.IDLE;
    }

    // Physics
    nextF.velocity.y += GRAVITY;
    nextF.position.x += nextF.velocity.x;
    nextF.position.y += nextF.velocity.y;

    // Boundaries
    if (nextF.position.x < 50) nextF.position.x = 50;
    if (nextF.position.x > CANVAS_WIDTH - 50) nextF.position.x = CANVAS_WIDTH - 50;
    if (nextF.position.y >= GROUND_Y) {
      nextF.position.y = GROUND_Y;
      nextF.velocity.y = 0;
      nextF.isGrounded = true;
    }

    nextF.direction = nextF.position.x < other.position.x ? 1 : -1;
    return nextF;
  };

  const checkCollisions = (f1: Fighter, f2: Fighter) => {
    let nextF1 = { ...f1 };
    let nextF2 = { ...f2 };

    const checkHit = (attacker: Fighter, defender: Fighter) => {
      if (defender.currentState === MoveType.BLOCK) return { hit: false, damage: 0, blocked: true };
      
      const hitbox = HITBOXES[attacker.currentState] || { w: 0, h: 0 };
      const dist = Math.abs(attacker.position.x - defender.position.x);
      
      if ((attacker.currentState === MoveType.PUNCH || attacker.currentState === MoveType.KICK) && 
          attacker.animationFrame === 10 && dist < hitbox.w + 40) {
          const damage = MOVE_DAMAGE[attacker.currentState as keyof typeof MOVE_DAMAGE] || 0;
          return { hit: true, damage, blocked: false };
      }
      return { hit: false, damage: 0, blocked: false };
    };

    const h1 = checkHit(nextF1, nextF2);
    if (h1.hit) {
      nextF2.stats.hp -= h1.damage;
      nextF2.currentState = MoveType.HIT;
      nextF2.animationFrame = 0;
      nextF2.velocity.x = nextF1.direction * 10;
      shout("OUCH!", 0.9);
    } else if (h1.blocked) {
      // Small feedback for block
    }

    const h2 = checkHit(nextF2, nextF1);
    if (h2.hit) {
      nextF1.stats.hp -= h2.damage;
      nextF1.currentState = MoveType.HIT;
      nextF1.animationFrame = 0;
      nextF1.velocity.x = nextF2.direction * 10;
      shout("URGH!", 1.0);
    }

    return [nextF1, nextF2];
  };

  const gameLoop = useCallback((time: number) => {
    if (gameState !== GameState.FIGHTING) return;
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;
    aiUpdateTimerRef.current += dt;
    if (aiUpdateTimerRef.current > 4000) { updateAI(); aiUpdateTimerRef.current = 0; }
    setP1(prevP1 => {
      let currentP1 = prevP1;
      setP2(prevP2 => {
        const updatedP1 = updateFighter(currentP1, prevP2, 1, dt);
        const updatedP2 = updateFighter(prevP2, updatedP1, 2, dt);
        const [finalP1, finalP2] = checkCollisions(updatedP1, updatedP2);
        if (finalP1.stats.hp <= 0) triggerVictory(finalP2);
        else if (finalP2.stats.hp <= 0) triggerVictory(finalP1);
        currentP1 = finalP1;
        return finalP2;
      });
      return currentP1;
    });
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, updateAI, gameMode, aiLevel, aiStrategy]);

  useEffect(() => {
    if (gameState === GameState.FIGHTING) {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(gameLoop);
      const timerInt = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
      return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); clearInterval(timerInt); };
    }
  }, [gameState, gameLoop]);

  const startGame = () => {
    setP1(createFighter(selectedP1, 200, 1));
    setP2(createFighter(selectedP2, 800, -1));
    setTimer(99);
    setGameState(GameState.FIGHTING);
    shout("READY... FIGHT!", 1.5);
  };

  return (
    <div className="relative w-full h-screen bg-[#020202] overflow-hidden scanlines">
      {/* Loading Overlay for AI Assets */}
      {isGeneratingPortraits && (
        <div className="absolute inset-0 z-[200] bg-black flex flex-col items-center justify-center gap-6">
           <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
           <p className="font-game text-blue-500 animate-pulse text-xl uppercase">AI IS GENERATING CANDIDATES...</p>
        </div>
      )}

      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20" />
        <div className="absolute inset-0 bg-[url('https://picsum.photos/1024/600?grayscale')] bg-cover opacity-20 mix-blend-overlay" />
        <div className="absolute bottom-0 w-full h-[180px] bg-gradient-to-t from-blue-600/10 via-black to-transparent border-t border-blue-500/20" />
      </div>

      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center glass bg-black/40">
          <div className="mb-12 text-center">
            <h1 className="text-9xl font-black font-game neon-blue italic tracking-tighter select-none scale-y-110">TEKKEN AI</h1>
            <div className="h-2 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent my-2" />
            <p className="text-3xl font-game neon-gold italic uppercase">ADVANCED 2026 EDITION</p>
          </div>
          <div className="flex flex-col gap-5 w-72">
            <button 
              onClick={() => { setGameMode(GameMode.VS_CPU); setGameState(GameState.CHARACTER_SELECT_P1); }}
              className="group relative py-4 px-8 glass border-blue-500/50 text-blue-100 font-game hover:bg-blue-600/30 transition-all uppercase tracking-widest overflow-hidden"
            >
              <span className="relative z-10">Arcade Mode (VS AI)</span>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-blue-400 group-hover:w-full transition-all duration-300" />
            </button>
            <button 
              onClick={() => { setGameMode(GameMode.VS_PLAYER); setGameState(GameState.CHARACTER_SELECT_P1); }}
              className="group relative py-4 px-8 glass border-purple-500/50 text-purple-100 font-game hover:bg-purple-600/30 transition-all uppercase tracking-widest overflow-hidden"
            >
              <span className="relative z-10">Local Multiplayer (P1 vs P2)</span>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-purple-400 group-hover:w-full transition-all duration-300" />
            </button>
            <button className="py-4 px-8 glass border-yellow-500/50 text-yellow-100 font-game hover:bg-yellow-600/30 transition-all uppercase tracking-widest">
              AI Training Room
            </button>
          </div>
          <div className="mt-12 flex gap-4">
             <div className={`cursor-pointer px-4 py-1 rounded border ${difficulty === 'AI_ADAPTIVE' ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-gray-700 text-gray-500 font-game'}`} onClick={() => setDifficulty('AI_ADAPTIVE')}>ADAPTIVE AI ON</div>
             <div className={`cursor-pointer px-4 py-1 rounded border ${difficulty === 'NORMAL' ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-gray-700 text-gray-500 font-game'}`} onClick={() => setDifficulty('NORMAL')}>ADAPTIVE AI OFF</div>
          </div>
        </div>
      )}

      {(gameState === GameState.CHARACTER_SELECT_P1 || gameState === GameState.CHARACTER_SELECT_P2) && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center glass bg-black/60 p-8">
           <h2 className="text-5xl font-game neon-gold mb-12 italic uppercase tracking-widest">
             {gameState === GameState.CHARACTER_SELECT_P1 ? 'PLAYER 1 SELECT' : 'PLAYER 2 SELECT'}
           </h2>
           <div className="grid grid-cols-4 gap-8 mb-16">
             {Object.values(FighterID).map((id) => (
               <div 
                 key={id} 
                 onClick={() => {
                   if (gameState === GameState.CHARACTER_SELECT_P1) {
                     setSelectedP1(id);
                     if (gameMode === GameMode.VS_PLAYER) setGameState(GameState.CHARACTER_SELECT_P2);
                     else startGame();
                   } else {
                     setSelectedP2(id);
                     startGame();
                   }
                 }}
                 className={`relative w-56 h-80 glass cursor-pointer transition-all duration-300 overflow-hidden group
                   ${(gameState === GameState.CHARACTER_SELECT_P1 ? selectedP1 === id : selectedP2 === id) ? 'border-4 border-blue-400 scale-105 shadow-[0_0_40px_#3b82f6]' : 'opacity-60 hover:opacity-100 hover:scale-102'}
                 `}
               >
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                 <img src={portraits[id] || `https://picsum.photos/seed/${id}/400/600`} alt={id} className="object-cover w-full h-full mix-blend-screen group-hover:scale-110 transition-transform duration-700" />
                 <div className="absolute bottom-6 left-6 z-20">
                   <p className="font-game text-2xl italic text-white uppercase tracking-tighter">{FIGHTERS_DATA[id].name}</p>
                   <div className="h-1 w-12 bg-blue-500 mt-1" />
                 </div>
               </div>
             ))}
           </div>
           <div className="font-game text-gray-400 tracking-widest animate-pulse uppercase">AI Candidates Prepared</div>
        </div>
      )}

      {gameState === GameState.FIGHTING && (
        <>
          <HUD player1={p1} player2={p2} timer={timer} round={round} insights={insights} />
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
              <div className="absolute z-30" style={{ left: p1.position.x - 60, top: p1.position.y - 150 }}>
                <FighterAvatar id={p1.id} state={p1.currentState} direction={p1.direction} frame={p1.animationFrame} isStunned={p1.isStunned} portraitUrl={portraits[p1.id]} />
              </div>
              <div className="absolute z-20" style={{ left: p2.position.x - 60, top: p2.position.y - 150 }}>
                <FighterAvatar id={p2.id} state={p2.currentState} direction={p2.direction} frame={p2.animationFrame} isStunned={p2.isStunned} portraitUrl={portraits[p2.id]} />
              </div>
            </div>
          </div>
        </>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
           <div className="mb-4">
             <span className="text-9xl font-game text-white italic animate-pulse shadow-red-500 drop-shadow-2xl uppercase">K.O.</span>
           </div>
           <p className="text-4xl font-game neon-gold mb-12 uppercase italic tracking-widest">
             {p1.stats.hp > 0 ? `${p1.name} VICTORY` : `${p2.name} VICTORY`}
           </p>
           <button 
             onClick={() => setGameState(GameState.MENU)}
             className="py-5 px-16 glass border-white/50 text-white font-game hover:bg-white/20 transition-all uppercase tracking-widest hover:scale-105"
           >
             Continue to Menu
           </button>
        </div>
      )}

      {gameState === GameState.FIGHTING && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-12 glass px-10 py-3 text-[10px] text-gray-400 font-game z-[60] border-t-2 border-blue-500/30 rounded-full">
             <div className="flex flex-col items-center">
                <span className="text-blue-400 mb-1 uppercase">P1 Controls</span>
                <span>W/A/S/D: MOVE/JUMP | C: PUNCH | V: KICK | B: BLOCK</span>
             </div>
             {gameMode === GameMode.VS_PLAYER && (
               <div className="flex flex-col items-center border-l border-gray-700 pl-12">
                  <span className="text-purple-400 mb-1 uppercase">P2 Controls</span>
                  <span>ARROWS: MOVE/JUMP | U: PUNCH | I: KICK | O: BLOCK</span>
               </div>
             )}
             <div className="flex flex-col items-center border-l border-gray-700 pl-12">
                <span className="text-yellow-400 mb-1 uppercase font-bold tracking-widest">AI Intel</span>
                <span className="text-white text-lg font-bold">{aiLevel} - {aiStrategy}</span>
             </div>
          </div>
      )}
    </div>
  );
};

export default App;
