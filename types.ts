
export enum GameState {
  MENU = 'MENU',
  CHARACTER_SELECT_P1 = 'CHARACTER_SELECT_P1',
  CHARACTER_SELECT_P2 = 'CHARACTER_SELECT_P2',
  FIGHTING = 'FIGHTING',
  PAUSED = 'PAUSED',
  ROUND_OVER = 'ROUND_OVER',
  GAME_OVER = 'GAME_OVER'
}

export enum GameMode {
  VS_CPU = 'VS_CPU',
  VS_PLAYER = 'VS_PLAYER',
  TRAINING = 'TRAINING'
}

export enum FighterID {
  JIN = 'JIN',
  PAUL = 'PAUL',
  LING = 'LING',
  KING = 'KING'
}

export enum MoveType {
  IDLE = 'IDLE',
  WALK = 'WALK',
  JUMP = 'JUMP',
  CROUCH = 'CROUCH',
  BLOCK = 'BLOCK',
  PUNCH = 'PUNCH',
  KICK = 'KICK',
  SPECIAL = 'SPECIAL',
  HIT = 'HIT',
  KO = 'KO'
}

export interface FighterStats {
  hp: number;
  maxHp: number;
  energy: number;
  speed: number;
  power: number;
}

export interface Fighter {
  id: FighterID;
  name: string;
  stats: FighterStats;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  direction: number; // 1 for right, -1 for left
  currentState: MoveType;
  animationFrame: number;
  isGrounded: boolean;
  isStunned: boolean;
  lastActionTime: number;
  currentCombo: string[];
}

export interface GameSettings {
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'AI_ADAPTIVE';
  volume: number;
  isCoachingEnabled: boolean;
}

export interface AIInsight {
  type: 'COACH' | 'OPPONENT';
  message: string;
  timestamp: number;
}
