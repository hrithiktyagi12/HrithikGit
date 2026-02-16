
import { FighterID, MoveType } from './types';

export const GRAVITY = 0.6;
export const JUMP_FORCE = -15;
export const WALK_SPEED = 5;
export const FRICTION = 0.85;
export const GROUND_Y = 500;
export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 600;

export const FIGHTERS_DATA = {
  [FighterID.JIN]: {
    name: 'Jin Kazama',
    color: '#3b82f6',
    description: 'Japanese male, athletic build, spiked black hair, wearing black and red flame-patterned karate gi trousers, metal gauntlets.',
    stats: { hp: 1000, maxHp: 1000, energy: 0, speed: 7, power: 8 }
  },
  [FighterID.PAUL]: {
    name: 'Paul Phoenix',
    color: '#eab308',
    description: 'American male, muscular, extremely tall flat-top blonde hair, wearing a red sleeveless judo gi, scarred face, determined look.',
    stats: { hp: 1100, maxHp: 1100, energy: 0, speed: 5, power: 10 }
  },
  [FighterID.LING]: {
    name: 'Ling Xiaoyu',
    color: '#ec4899',
    description: 'Chinese female, petite but agile, double pigtails, wearing a vibrant orange and yellow traditional Chinese fighting dress (Cheongsam style), playful expression.',
    stats: { hp: 900, maxHp: 900, energy: 0, speed: 10, power: 6 }
  },
  [FighterID.KING]: {
    name: 'King',
    color: '#8b5cf6',
    description: 'Tall muscular male wearing a realistic jaguar mask, wrestling trunks, blue cape, professional wrestler physique, intense feline eyes visible through mask.',
    stats: { hp: 1200, maxHp: 1200, energy: 0, speed: 4, power: 9 }
  }
};

export const MOVE_DAMAGE = {
  [MoveType.PUNCH]: 30,
  [MoveType.KICK]: 45,
  [MoveType.SPECIAL]: 80
};

export const HITBOXES = {
  [MoveType.IDLE]: { w: 60, h: 140 },
  [MoveType.PUNCH]: { w: 100, h: 140 },
  [MoveType.KICK]: { w: 110, h: 140 },
  [MoveType.SPECIAL]: { w: 130, h: 140 }
};
