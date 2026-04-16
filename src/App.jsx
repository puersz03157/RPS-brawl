import React, { useState, useEffect, useRef } from 'react';
import { Zap, Sparkles, BookOpen, Home, Gamepad2, Coffee, MessageCircle, ArrowLeft, ShoppingCart, Star, Camera, X, Moon, Heart, HelpCircle, Info, AlertTriangle } from 'lucide-react';

// ==========================================
// 1. 基礎工具函數 (絕對安全全域區)
// ==========================================
const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

const getRandomTalents = (budget, availableTalents) => {
  let talents = [];
  let currentBudget = budget;
  let pool = shuffle([...availableTalents]);
  for (let t of pool) {
      if (t.cost <= currentBudget) { talents.push(t.id); currentBudget -= t.cost; }
      if (currentBudget === 0) break;
  }
  return talents;
};

const getRandomHand = () => {
  const keys = ['ROCK', 'PAPER', 'SCISSORS'];
  return keys[Math.floor(Math.random() * keys.length)];
};

const getElementMultiplier = (atkElem, defElem) => {
  if (atkElem === 'wood' && defElem === 'water') return 1.5;
  if (atkElem === 'water' && defElem === 'fire') return 1.5;
  if (atkElem === 'fire' && defElem === 'wood') return 1.5;
  if (atkElem === 'wood' && defElem === 'fire') return 0.8;
  if (atkElem === 'water' && defElem === 'wood') return 0.8;
  if (atkElem === 'fire' && defElem === 'water') return 0.8;
  if (atkElem === 'light' && defElem === 'dark') return 1.5;
  if (atkElem === 'dark' && defElem === 'light') return 1.5;
  return 1.0;
};

const isBuffStatus = (type) => type && ['ATK_UP', 'DEF_UP', 'REGEN', 'EVADE', 'EXCITE'].includes(type);
const isDebuffStatus = (type) => type && ['BURN', 'PARASITE', 'FREEZE', 'DAZZLE', 'SILENCE', 'ATK_DOWN', 'DEF_DOWN', 'VULNERABLE', 'FATIGUE'].includes(type);

// 補回遺失的核心狀態計算函數
const getStatusValueSum = (ent, type) => {
    if (!ent || !ent.status) return 0;
    return ent.status.filter(s => s && s.type === type).reduce((acc, curr) => acc + (curr.value || 0), 0);
};

// ==========================================
// 2. 遊戲資料庫
// ==========================================
const ELEMENTS = {
  WOOD: { id: 'wood', name: '木', color: 'text-green-500', bg: 'bg-green-100', border: 'border-green-500' },
  WATER: { id: 'water', name: '水', color: 'text-blue-500', bg: 'bg-blue-100', border: 'border-blue-500' },
  FIRE: { id: 'fire', name: '火', color: 'text-red-500', bg: 'bg-red-100', border: 'border-red-500' },
  LIGHT: { id: 'light', name: '光', color: 'text-yellow-500', bg: 'bg-yellow-100', border: 'border-yellow-500' },
  DARK: { id: 'dark', name: '暗', color: 'text-purple-500', bg: 'bg-purple-100', border: 'border-purple-500' }
};

const RPS_CHOICES = {
  ROCK: { id: 'ROCK', icon: '✊', name: '石頭', beats: 'SCISSORS' },
  PAPER: { id: 'PAPER', icon: '🖐️', name: '布', beats: 'ROCK' },
  SCISSORS: { id: 'SCISSORS', icon: '✌️', name: '剪刀', beats: 'PAPER' }
};

const CHARACTERS = [
  { id: 'bear', name: '熊吉', icon: '🐻', title: '森林守護者', element: ELEMENTS.WOOD, image: '398997.png', prefAction: 'snack', stats: { hp: 650, maxHp: 650, atk: 40, def: 30 }, desc: '依賴增益強化自身的爆發型戰士。', lore: '原本是守護森林神木的巨熊獸人。大星晶碎裂導致森林枯萎，為了解決異變而踏上旅程。超級喜歡蜂蜜，肚子餓的時候會變得暴躁。', skill1: { name: '熊吼之怒', cost: 20, desc: '自身隨機獲得一種增益：攻擊提升、防禦提升或再生 (3回合)。' }, skill2: { name: '魚竿甩擊', cost: 80, desc: '消耗身上所有增益，基礎 50 傷害 (每層增益+40)，並施加 🌿[寄生] 3回合。' } },
  { id: 'wolf', name: '白澤', icon: '🐺', title: '滄海孤狼', element: ELEMENTS.WATER, image: '399000.png', prefAction: 'gaming', stats: { hp: 500, maxHp: 500, atk: 55, def: 20 }, desc: '善用冰封護盾進行防禦與風險反擊。', lore: '來自極寒之地的冷酷劍客，奉命尋找失落的星晶。外表高冷，但其實是個會默默幫大家守夜的傲嬌，非常注重保暖。', skill1: { name: '冰封防禦', cost: 30, desc: '給予自身 30 護盾，並獲得「下一次猜拳戰敗時獲得 50 能量」狀態。' }, skill2: { name: '護盾攻擊', cost: 80, desc: '消耗所有護盾造成等量傷害，並自身恢復消耗護盾值一半的 HP。' } },
  { id: 'cat', name: '布提婭', icon: '🐈‍⬛', title: '夜靈貓', element: ELEMENTS.DARK, image: '398999.png', prefAction: 'snack', stats: { hp: 400, maxHp: 400, atk: 70, def: 15 }, desc: '能施加多種負面狀態並吸取生命。', lore: '意外吞下了暗屬性的星晶碎片，化身為擁有強大魔力的夜靈貓。傲慢任性，覺得人類都是她的鏟屎官，但為了保護高級罐罐會拼盡全力。', skill1: { name: '奇異之光', cost: 40, desc: '必定降攻或降防(3回)，且 50% 機率額外附加封印或眩目(1回)。' }, skill2: { name: '黑暗之抓', cost: 75, desc: '無視護盾造成 80 傷害。對方每有一種負面狀態，自身恢復 30 HP。' } },
  { id: 'human', name: '普爾斯', icon: '🧑‍🚒', title: '烈焰鬥士', element: ELEMENTS.FIRE, image: '399001.png', prefAction: 'gaming', stats: { hp: 550, maxHp: 550, atk: 50, def: 20 }, desc: '能引爆燃燒造成毀滅性爆發與回復。', lore: '熱血的工會討伐者，以一把燃燒的大劍聞名。總是衝在最前線享受狩獵魔物的快感，不管遇到什麼困難都覺得「烤個肉吃就能解決」。', skill1: { name: '燃燒之劍', cost: 40, desc: '給予對方 30 傷害，並施加 🔥[燃燒] 3回合。' }, skill2: { name: '黑炎爆發', cost: 80, desc: '給予 70 傷害，立即結算對手燃燒，每結算一回合自身恢復 30 HP。' } },
  { id: 'elf', name: '布布', icon: '🧚', title: '光之精靈', element: ELEMENTS.LIGHT, image: '398996.png', prefAction: 'chat', stats: { hp: 450, maxHp: 450, atk: 45, def: 25 }, desc: '運用能量反噬與葵花子戰鬥的奇兵。', lore: '誕生於光之星晶的精靈，負責引導夜行者們收集星晶。天然呆，喜歡收集發亮的東西和各種植物種子（尤其是葵花子）。', skill1: { name: '能量炸彈', cost: 50, desc: '清空雙方能量並造成各自能量傷害，自身恢復能量差值的 HP。' }, skill2: { name: '囤囤之力', cost: 50, desc: '獲得一個葵花子，每有一個葵花子給予對手 20 傷害 (不消耗)。' } }
];

const HIDDEN_CHARACTER = { 
  id: 'xiangxiang', name: '庠庠', icon: '🐯', title: '慵懶的白虎', element: ELEMENTS.LIGHT, isEmoji: false, image: 'avatar_xiangxiang.png', 
  stats: { hp: 700, maxHp: 700, atk: 60, def: 35 }, prefAction: 'snack', desc: '全圖鑑收集獎勵。擁有強大的防禦與拘束力。',
  lore: '傳說中負責維持大陸夜間秩序的白虎神獸。因為大星晶碎裂導致魔物橫行，被迫瘋狂加班巡夜，導致他現在極度嗜睡。被柯特的訓獸之力與特製宵夜喚醒而加入。',
  skill1: { name: '軟萌肚肚', cost: 30, desc: '展現充滿彈性的肚子，獲得 50 護盾，並使對手 💫[強制] 下回出拳。' }, 
  skill2: { name: '致命擁抱', cost: 90, desc: '無視護盾造成 100 傷害。若施放時有護盾，額外加 50 傷並 ❄️[封印]。' } 
};

const VARIANTS = [
  { id: 'newyear_bear', baseId: 'bear', name: '新年熊吉', icon: '🧧', title: '人人有魚', element: ELEMENTS.WOOD, image: 'avatar_newyear_bear.png', stats: { hp: 700, maxHp: 700, atk: 35, def: 35 }, desc: '分享祝福的森林大胃王。', lore: '換上喜氣洋洋的紅色和服，拿著釣竿到處分享漁獲與祝福的熊吉。', skill1: { name: '新春撒網', cost: 30, desc: '自身獲得 ⚡[亢奮] 3回合，對手陷入 💤[疲憊] 3回合。' }, skill2: { name: '年年有餘', cost: 80, desc: '消耗所有能量造成 80 基礎傷害。雙方恢復 100 HP，自身獲 80 盾與 💨[迴避]。' }, unlockReq: 'newyear_bear', unlockHint: '於星晶商店花費 200 星晶購買解鎖。' },
  { id: 'harvest_elf', baseId: 'elf', name: '豐收節布布', icon: '🌻', title: '花開富貴', isPlaceholder: true, unlockHint: '在家園累積使用 15 次「分享營食」解鎖。' },
  { id: 'blackflame_human', baseId: 'human', name: '黑炎暴走普爾斯', icon: '🔥', title: '終焉煉獄', isPlaceholder: true, unlockHint: '挑戰隱藏關卡 Boss 解鎖。' },
  { id: 'valentine_wolf', baseId: 'wolf', name: '情人節白澤', icon: '💝', title: '冷酷甜心', isPlaceholder: true, unlockHint: '與任意角色友好度達 20 點解鎖。' },
  { id: 'halloween_cat', baseId: 'cat', name: '萬聖節布提婭', icon: '🎃', title: '搗蛋貓咪', isPlaceholder: true, unlockHint: '累計「收服」達 10 次解鎖。' },
  { id: 'christmas_xiangxiang', baseId: 'xiangxiang', name: '聖誕節庠庠', icon: '🎁', title: '最棒的禮物', isPlaceholder: true, unlockHint: '收集齊其餘所有異裝型態後解鎖。' }
];

const NORMAL_MONSTERS = [
  { id: 'm1', name: '草原史萊姆', title: '黏糊糊的', element: ELEMENTS.WOOD, isEmoji: true, emoji: '🍄', prefHand: 'PAPER', stats: { hp: 250, maxHp: 250, atk: 25, def: 5 }, lore: '最常見的低級魔物，喜歡寄生在別人身上吸取養分。被收服後意外地適合拿來當抱枕。', skill1: { name: '寄生孢子', cost: 30, desc: '造成 10 傷害並施加 🌿[寄生] 2回合。' }, skill2: { name: '光合作用', cost: 60, desc: '回復自己 60 點生命值。' } },
  { id: 'm2', name: '巨石蟹', title: '硬邦邦的', element: ELEMENTS.WATER, isEmoji: true, emoji: '🦀', prefHand: 'SCISSORS', stats: { hp: 400, maxHp: 400, atk: 20, def: 25 }, lore: '全身覆蓋堅硬岩石的螃蟹，防禦力驚人。生氣時會吐出冰封泡泡。', skill1: { name: '硬化', cost: 30, desc: '獲得 50 點護盾。' }, skill2: { name: '泡泡光線', cost: 60, desc: '造成 40 傷害並施加 ❄️[封印] 1回合。' } },
  { id: 'm3', name: '爆炎犬', title: '熱騰騰的', element: ELEMENTS.FIRE, isEmoji: true, emoji: '🐕', prefHand: 'ROCK', stats: { hp: 300, maxHp: 300, atk: 45, def: 10 }, lore: '性格暴躁的犬型魔物，全身燃燒著火焰，咬合力極強。收服後冬天可以用來當暖爐。', skill1: { name: '火焰牙', cost: 30, desc: '造成 20 傷害並施加 🔥[燃燒] 2回合。' }, skill2: { name: '地獄火', cost: 70, desc: '造成高達 80 點傷害。' } },
  { id: 'm4', name: '閃耀精靈', title: '刺眼的', element: ELEMENTS.LIGHT, isEmoji: true, emoji: '🧚', prefHand: 'PAPER', stats: { hp: 280, maxHp: 280, atk: 35, def: 15 }, lore: '被光之星晶過度影響而失去理智的精靈，會發出強光致盲對手。', skill1: { name: '致盲', cost: 40, desc: '施加 💫[眩目] 1回合。' }, skill2: { name: '神聖新星', cost: 70, desc: '造成 40 點傷害並回復自身 40 血。' } },
  { id: 'm5', name: '影魔眼', title: '陰森森的', element: ELEMENTS.DARK, isEmoji: true, emoji: '👁️', prefHand: 'ROCK', stats: { hp: 220, maxHp: 220, atk: 55, def: 5 }, lore: '漂浮在空中的巨大眼球，凝視會讓人陷入恐懼與沉默。', skill1: { name: '恐懼凝視', cost: 40, desc: '施加 🤐[沉默] 2回合。' }, skill2: { name: '虛空射線', cost: 60, desc: '造成 70 點高額傷害。' } }
];

const BOSS_MONSTERS = [
  { id: 'b1', name: '災厄黑龍', title: '深淵霸主', element: ELEMENTS.DARK, isEmoji: true, emoji: '🐉', prefHand: 'ROCK', stats: { hp: 800, maxHp: 800, atk: 55, def: 25 }, lore: '盤踞在廢棄古城的巨龍，擁有毀滅性的吐息，被認為是大星晶碎裂的罪魁禍首之一。', skill1: { name: '龍威', cost: 40, desc: '扣除 20 能量並施加 🤐[沉默] 1回合。' }, skill2: { name: '毀滅吐息', cost: 90, desc: '無視護盾造成 150 點傷害。' } },
  { id: 'b2', name: '耀光大天使', title: '天界審判', element: ELEMENTS.LIGHT, isEmoji: true, emoji: '👼', prefHand: 'PAPER', stats: { hp: 750, maxHp: 750, atk: 60, def: 20 }, lore: '原本是守護神殿的天使，卻被過度純粹的光之能量逼瘋，對所有入侵者降下無差別的神罰。', skill1: { name: '致盲之光', cost: 40, desc: '施加 💫[眩目] 1回合，並獲得 30 護盾。' }, skill2: { name: '神罰', cost: 90, desc: '造成 130 點直接傷害。' } },
  { id: 'b3', name: '獄炎魔王', title: '焦熱地獄', element: ELEMENTS.FIRE, isEmoji: true, emoji: '🌋', prefHand: 'ROCK', stats: { hp: 850, maxHp: 850, atk: 65, def: 15 }, lore: '從火山深處誕生的炎之惡魔，企圖將整個世界化為焦熱地獄。', skill1: { name: '沸騰之血', cost: 40, desc: '提升自身 10 攻擊力，並施加 🔥[燃燒] 2回合。' }, skill2: { name: '天地灰燼', cost: 100, desc: '造成 180 點毀滅性傷害。' } },
  { id: 'b4', name: '森之巨神', title: '萬古腐化', element: ELEMENTS.WOOD, isEmoji: true, emoji: '🌳', prefHand: 'PAPER', stats: { hp: 1000, maxHp: 1000, atk: 45, def: 35 }, lore: '被腐化力量侵蝕的遠古樹神，其寄生藤蔓能瞬間吸乾整座森林的生命力。', skill1: { name: '寄生藤蔓', cost: 40, desc: '造成 30 傷害並施加 🌿[寄生] 3回合。' }, skill2: { name: '萬物歸一', cost: 80, desc: '瞬間回復 200 點生命值。' } },
  { id: 'b5', name: '冰霜巨龍', title: '絕對零度', element: ELEMENTS.WATER, isEmoji: true, emoji: '❄️', prefHand: 'SCISSORS', stats: { hp: 700, maxHp: 700, atk: 50, def: 40 }, lore: '沉睡在冰川下的古老存在，其吐息能帶來絕對零度的冰河時代。', skill1: { name: '冰霜裝甲', cost: 40, desc: '獲得高達 80 點的護盾。' }, skill2: { name: '冰河時代', cost: 90, desc: '造成 100 傷害，清空能量並施加 ❄️[封印] 1回合。' } }
];

const ALL_TALENTS = [
  { id: 't1', name: '活力', cost: 1, desc: '最大生命值 +100', icon: '❤️' },
  { id: 't2', name: '怪力', cost: 1, desc: '攻擊力 +10', icon: '⚔️' },
  { id: 't3', name: '靈光', cost: 1, desc: '戰鬥開始時，初始能量 +25', icon: '⚡' },
  { id: 't4', name: '鐵壁', cost: 2, desc: '戰鬥開始時，獲得 80 點護盾', icon: '🛡️' },
  { id: 't5', name: '鬥氣', cost: 2, desc: '平手時，獲得能量提升為 40，並恢復 15 HP', icon: '🔄' },
  { id: 't6', name: '逆境', cost: 2, desc: '生命值低於 30% 時，攻擊力提升 50%', icon: '🔥' },
  { id: 't7', name: '嗜血', cost: 3, desc: '造成傷害時，回復等同傷害量 15% 的生命', icon: '🦇' },
  { id: 't8', name: '賢者', cost: 3, desc: '所有技能與奧義，耗能減少 15 點', icon: '📖' },
  { id: 't_bear', name: '厚實脂肪', cost: 3, desc: '開場隨機獲得 2 種增益狀態(3回合)。(熊吉專屬)', icon: '🍯', req: 'char_talents', exclusiveTo: 'bear' },
  { id: 't_wolf', name: '極寒護體', cost: 3, desc: '回合結束時，若有護盾則恢復 25 HP。(白澤專屬)', icon: '❄️', req: 'char_talents', exclusiveTo: 'wolf' },
  { id: 't_cat', name: '虐襲', cost: 3, desc: '回合結束時，對手每個負面狀態受 15 傷。(布提婭專屬)', icon: '🐾', req: 'char_talents', exclusiveTo: 'cat' },
  { id: 't_human', name: '助燃劑', cost: 3, desc: '敵人受到的燃燒傷害提升 50%。(普爾斯專屬)', icon: '🛢️', req: 'char_talents', exclusiveTo: 'human' },
  { id: 't_elf', name: '倉鼠性格', cost: 3, desc: '開場直接獲得 2 顆葵花子。(布布專屬)', icon: '🐹', req: 'char_talents', exclusiveTo: 'elf' },
  { id: 't_xiangxiang', name: '柯特的愛心宵夜', cost: 3, desc: 'HP低於50%時每回合回覆 20 HP 並獲 10 盾。(庠庠專屬)', icon: '🍜', req: 'char_talents', exclusiveTo: 'xiangxiang' },
  { id: 't9', name: '銳利', cost: 4, desc: '出剪刀獲勝傷害 x1.5，戰敗受傷減半。開場能量 +20。', icon: '✂️', req: 'cost4' },
  { id: 't10', name: '堅硬', cost: 4, desc: '出石頭獲勝傷害 x1.5，戰敗受傷減半。開場能量 +20。', icon: '🪨', req: 'cost4' },
  { id: 't11', name: '柔和', cost: 4, desc: '出布獲勝傷害 x1.5，戰敗受傷減半。開場能量 +20。', icon: '🧻', req: 'cost4' },
  { id: 't12', name: '神佑', cost: 5, desc: '絕對霸體免疫異常，且受到直接傷害減少 15%', icon: '👼', req: 'cost5' },
  { id: 't13', name: '極限爆發', cost: 5, desc: '所有造成的直接傷害無條件 x1.5 倍', icon: '💥', req: 'cost5' }
];

const REWARD_POOL = [
  { id: 'r1', name: '生命湧動', icon: '❤️', desc: '最大生命值 +150，並回復等量生命。', apply: (p) => ({ ...p, maxHp: p.maxHp + 150, hp: p.hp + 150 }) },
  { id: 'r2', name: '夜行者貓飯', icon: '🍗', desc: '攻擊力永久 +25。', apply: (p) => ({ ...p, atk: p.atk + 25 }) },
  { id: 'r3', name: '防禦強化', icon: '🛡️', desc: '防禦力永久 +20。', apply: (p) => ({ ...p, def: p.def + 20 }) },
  { id: 'r4', name: '戰術護盾', icon: '🔰', desc: '每次戰鬥開始時，自動獲得 60 點護盾。', apply: (p) => ({ ...p, permaBuffs: { ...p.permaBuffs, startShield: (p.permaBuffs?.startShield || 0) + 60 } }) },
  { id: 'r5', name: '星晶充能', icon: '⚡', desc: '每次戰鬥開始時，額外獲得 30 點能量。', apply: (p) => ({ ...p, permaBuffs: { ...p.permaBuffs, startEnergy: (p.permaBuffs?.startEnergy || 0) + 30 } }) }
];

const STATUS_DOCS = [
    { name: '攻擊提升/下降', effect: '攻擊力增加/減少 20 點。', icon: '⚔️', color: 'text-orange-400' },
    { name: '防禦提升/下降', effect: '防禦力增加/減少 20 點。', icon: '🛡️', color: 'text-cyan-400' },
    { name: '再生', effect: '每回合結束恢復 20 點 HP。', icon: '💖', color: 'text-pink-400' },
    { name: '燃燒', effect: '每回合結束受到 20 點灼燒傷害。', icon: '🔥', color: 'text-red-500' },
    { name: '寄生', effect: '每回合結束被吸取 15 點生命轉移至對手。', icon: '🌿', color: 'text-green-500' },
    { name: '易傷', effect: '受到的傷害變為 1.2 倍。', icon: '💢', color: 'text-red-300' },
    { name: '迴避', effect: '免除下一次受到的直接傷害。', icon: '💨', color: 'text-green-300' },
    { name: '疲憊', effect: '平手時無法獲得能量。', icon: '💤', color: 'text-stone-400' },
    { name: '亢奮', effect: '平手獲取的能量提升 50%。', icon: '⚡', color: 'text-yellow-500' },
    { name: '封印', effect: '下次出拳無法使用特定的手勢。', icon: '❄️', color: 'text-blue-400' },
    { name: '強制', effect: '下次出拳被強制固定為特定手勢。', icon: '💫', color: 'text-yellow-400' },
    { name: '沉默', effect: '無法使用戰技與奧義。', icon: '🤐', color: 'text-purple-400' }
];

const GUIDE_TERMS = [
    { term: '星晶 (Star Crystal)', desc: '核心貨幣，用於購買天賦與特殊型態。' },
    { term: 'AP (行動點數)', desc: '戰鬥勝利獲得，用於營地互動提升角色羈絆。' },
    { term: '專精等級', desc: '角色通關戰役累計，滿 3 星可解鎖專屬 CG。' },
    { term: '友誼之巔', desc: '任意雙人羈絆達滿級 (20點) 時解鎖的特殊雙人回憶。' }
];

// ==========================================
// 3. 遊戲機制輔助函數
// ==========================================
const isBasicChar = (c) => ['bear', 'wolf', 'cat', 'human', 'elf'].includes(c?.id);
const isMonsterChar = (c) => NORMAL_MONSTERS.some(m => m.id === c?.id) || BOSS_MONSTERS.some(b => b.id === c?.id);
const isVariantChar = (c) => VARIANTS.some(v => v.id === c?.id);
const isFullGallery = (capturedArr) => (capturedArr || []).length >= (NORMAL_MONSTERS.length + BOSS_MONSTERS.length);
const getActualCost = (cost, hasT8) => hasT8 ? Math.max(0, cost - 15) : cost;

const getBaseTalents = (char) => {
    if (!char) return 3;
    if (char.id === 'xiangxiang') return 5;
    if (BOSS_MONSTERS.some(b => b.id === char.id)) return 4;
    if (NORMAL_MONSTERS.some(m => m.id === char.id)) return 4;
    return 3;
};

const getStatusName = (type) => {
    const map = { 'BURN': '燃燒', 'PARASITE': '寄生', 'FREEZE': '封印', 'DAZZLE': '強制', 'SILENCE': '沉默', 'ATK_UP': '攻擊提升', 'DEF_UP': '防禦提升', 'REGEN': '再生', 'ATK_DOWN': '攻擊下降', 'DEF_DOWN': '防禦下降', 'VULNERABLE': '易傷', 'EVADE': '迴避', 'FATIGUE': '疲憊', 'EXCITE': '亢奮' };
    return map[type] || type;
};
const getStatusIcon = (type) => {
    const map = { 'VULNERABLE': '💢', 'EVADE': '💨', 'FATIGUE': '💤', 'EXCITE': '⚡', 'BURN': '🔥', 'PARASITE': '🌿', 'FREEZE': '❄️', 'DAZZLE': '💫', 'SILENCE': '🤐', 'ATK_UP': '⚔️', 'DEF_UP': '🛡️', 'REGEN': '💖', 'ATK_DOWN': '📉', 'DEF_DOWN': '📉' };
    return map[type] || '✨';
};

// ==========================================
// 4. React 介面組件
// ==========================================
const SpriteAvatar = ({ char, size='w-16 h-16', grayscale=false }) => {
    if (!char) return null;
    return (
        <div className={`${size} rounded-full border-2 border-stone-600 bg-stone-800 flex items-center justify-center overflow-hidden shrink-0 relative`}>
            {char.isEmoji ? <span className={`text-3xl ${grayscale ? 'grayscale opacity-30' : ''}`}>{char.emoji}</span> : <img src={char.image} className={`w-full h-full object-cover ${grayscale ? 'grayscale opacity-30' : ''}`} alt={char.name} />}
        </div>
    );
};

const NpcDialogue = ({ npcName, npcImageFallback, dialogues }) => {
    const [idx, setIdx] = useState(0);

    const handleChat = () => {
        if (dialogues.length <= 1) return;
        let nextIdx;
        do {
            nextIdx = Math.floor(Math.random() * dialogues.length);
        } while (nextIdx === idx);
        setIdx(nextIdx);
    };

    return (
        <div className="flex flex-col md:flex-row gap-5 items-center bg-stone-800/60 p-6 rounded-3xl border border-stone-700 mb-8 shadow-xl max-w-4xl mx-auto">
            <div className="flex flex-col items-center shrink-0">
                <div className="w-24 h-24 bg-stone-900 border-2 border-stone-600 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
                    <span className="text-5xl">{npcImageFallback}</span>
                </div>
                <span className="text-xs font-bold text-yellow-400 mt-3 bg-stone-900 px-4 py-1.5 rounded-full border border-stone-700 shadow-md tracking-widest">
                    {npcName}
                </span>
            </div>

            <div className="flex-1 w-full bg-stone-900 p-6 rounded-2xl border border-stone-700 relative text-sm text-stone-300 min-h-[110px] flex items-center shadow-inner leading-relaxed">
                <div className="italic text-base">「{dialogues[idx]}」</div>
                <button
                    onClick={handleChat}
                    className="absolute -bottom-4 -right-2 md:bottom-4 md:right-4 bg-blue-600 hover:bg-blue-500 text-white text-xs px-5 py-2 rounded-full shadow-lg font-bold transition-transform active:scale-95 flex items-center gap-1.5 border border-blue-400/50"
                >
                    <MessageCircle size={16}/> 對話
                </button>
            </div>
        </div>
    );
};

export default function App() {
  const [gameState, setGameState] = useState('intro'); 
  const [gameMode, setGameMode] = useState('campaign'); 
  const [campaignRoute, setCampaignRoute] = useState([]); 
  const [campaignStage, setCampaignStage] = useState(0); 
  const [availableRewards, setAvailableRewards] = useState([]);
  const [galleryTab, setGalleryTab] = useState('companions');
  const [selectedTalentIds, setSelectedTalentIds] = useState([]);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);
  const [winner, setWinner] = useState(null);
  const [rewardCrystals, setRewardCrystals] = useState(0);
  const [newlyCaptured, setNewlyCaptured] = useState(null);
  const [homeStep, setHomeStep] = useState('select_host');
  const [homeHost, setHomeHost] = useState(null);
  const [homeGuest, setHomeGuest] = useState(null);
  const [activeDialogue, setActiveDialogue] = useState(null);
  const [showCG, setShowCG] = useState(null); 
  const [showCheat, setShowCheat] = useState(false);
  const [cheatCode, setCheatCode] = useState('');
  
  const [sysError, setSysError] = useState(null);
  const [toast, setToast] = useState(null);

  const [progress, setProgress] = useState({ crystals: 0, maxTalents: 3, unlocks: [], encountered: [], captured: [], mastery: {}, ap: 5, affection: {}, snackCount: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const [player, setPlayer] = useState({ char: null, talents: [], hp: 0, maxHp: 0, energy: 0, atk: 0, def: 0, shield: 0, buffs: { dmgMult: 1, extraDmg: 0, energyOnLoss: false }, permaBuffs: { startEnergy: 0, startShield: 0, seeds: 0 }, status: [] });
  const [enemy, setEnemy] = useState({ char: null, talents: [], hp: 0, maxHp: 0, energy: 0, atk: 0, def: 0, shield: 0, buffs: { dmgMult: 1, extraDmg: 0, atkReduction: 0, energyOnLoss: false }, permaBuffs: { startEnergy: 0, startShield: 0, seeds: 0 }, status: [] });

  useEffect(() => {
    try {
        const saved = localStorage.getItem('starCrystalTales_V38_Stable');
        if (saved) {
            const p = JSON.parse(saved);
            setProgress({
                crystals: p.crystals || 0, maxTalents: p.maxTalents || 3,
                unlocks: Array.isArray(p.unlocks) ? p.unlocks : [], encountered: Array.isArray(p.encountered) ? p.encountered : [], captured: Array.isArray(p.captured) ? p.captured : [],
                mastery: p.mastery || {}, affection: p.affection || {}, ap: typeof p.ap === 'number' ? p.ap : 5, snackCount: p.snackCount || 0
            });
        }
    } catch(e) { console.warn("Save file invalid, starting fresh.", e); }
    setIsLoaded(true);
  }, []);

  const saveProgress = (np) => {
    setProgress(np);
    try { localStorage.setItem('starCrystalTales_V38_Stable', JSON.stringify(np)); } catch(e) {}
  };

  useEffect(() => { if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const showToastMsg = (msg) => {
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
  };

  if (!isLoaded) return <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-500 font-bold text-xl">載入艾歐蘭斯大陸中...</div>;

  const unlocks = Array.isArray(progress.unlocks) ? progress.unlocks : [];
  const captured = Array.isArray(progress.captured) ? progress.captured : [];
  const encountered = Array.isArray(progress.encountered) ? progress.encountered : [];
  const mastery = progress.mastery || {};
  const affection = progress.affection || {};

  const selectMode = (mode) => { 
      setGameMode(mode); 
      setCampaignStage(0); 
      setCampaignRoute([]); 
      setSelectedTalentIds([]); 
      setGameState('select_char'); 
  };

  const getAvailableTalents = () => ALL_TALENTS.filter(t => {
      if (t.req && !unlocks.includes(t.req)) return false;
      if (t.exclusiveTo) {
          const charBaseId = player.char?.baseId || player.char?.id;
          if (charBaseId !== t.exclusiveTo) return false;
      }
      return true;
  });

  const toggleTalent = (tid) => {
    setSelectedTalentIds(prev => {
        if (prev.includes(tid)) return prev.filter(id => id !== tid);
        const talent = ALL_TALENTS.find(t => t.id === tid);
        const cost = prev.reduce((sum, id) => sum + ALL_TALENTS.find(t => t.id === id).cost, 0);
        const max = getBaseTalents(player.char) + (progress.maxTalents - 3);
        if (cost + talent.cost <= max) return [...prev, tid];
        return prev;
    });
  };

  const applyStatus = (ent, type, duration, value = 0, hand = null, logBuffer, isDeferred = false) => {
    if (!ent.status) ent.status = [];
    if ((ent.talents || []).includes('t12') && isDebuffStatus(type)) {
        if(logBuffer) logBuffer.push({ text: `[神佑] ${ent.char.name} 免疫了狀態！`, type: 'info' }); return;
    }
    const idx = ent.status.findIndex(s => s && s.type === type);
    if (idx >= 0) ent.status[idx] = { type, duration, value, hand, isDeferred };
    else ent.status.push({ type, duration, value, hand, isDeferred });
  };

  const dealDirectDmg = (base, atk, def, logBuffer, ignoreShield = false) => {
    let dmg = base;
    if ((atk.talents||[]).includes('t13')) dmg = Math.floor(dmg * 1.5);
    if ((def.status||[]).some(s => s && s.type === 'VULNERABLE')) dmg = Math.floor(dmg * 1.2);
    if ((def.talents||[]).includes('t12')) dmg = Math.floor(dmg * 0.85);

    if ((def.status||[]).some(s => s && s.type === 'EVADE')) {
        def.status = def.status.filter(s => s && s.type !== 'EVADE');
        logBuffer.push({ text: `${def.char.name} 閃避了攻擊！`, type: 'shield' }); return 0;
    }
    if (!ignoreShield && def.shield > 0) {
        const absorbed = Math.min(def.shield, dmg);
        def.shield -= absorbed;
        logBuffer.push({ text: `🛡️ 護盾吸收了 ${absorbed} 點傷害！`, type: 'shield' });
        dmg -= absorbed;
        if (dmg <= 0) return 0;
    }
    def.hp = Math.max(0, def.hp - dmg);
    logBuffer.push({ text: `${atk.char.name} 造成了 ${dmg} 點傷害！`, type: 'damage' });
    return dmg;
  };

  const executeSkill = (atk, def, num, buf, isPlayer) => {
    const skill = num === 1 ? atk.char.skill1 : atk.char.skill2;
    atk.energy -= getActualCost(skill.cost, atk.talents.includes('t8'));
    buf.push({ text: `${atk.char.name} 使用 【${skill.name}】！`, type: 'system' });
    
    let dmgDealt = 0; const id = atk.char.id;
    const defDeferred = !isPlayer; 
    const atkDeferred = false;

    if (id === 'bear') {
        if (num === 1) applyStatus(atk, ['ATK_UP', 'DEF_UP', 'REGEN'][Math.floor(Math.random()*3)], 3, 20, null, buf, atkDeferred);
        else { const count = (atk.status||[]).filter(s => s && isBuffStatus(s.type)).length; dmgDealt = dealDirectDmg(50 + count * 40, atk, def, buf); applyStatus(def, 'PARASITE', 3, 15, null, buf, defDeferred); atk.status = Array.isArray(atk.status) ? atk.status.filter(s => s && !isBuffStatus(s.type)) : []; }
    } else if (id === 'newyear_bear') {
        if (num === 1) { applyStatus(atk, 'EXCITE', 3, 0, null, buf, atkDeferred); applyStatus(def, 'FATIGUE', 3, 0, null, buf, defDeferred); }
        else { dmgDealt = dealDirectDmg(80, atk, def, buf); atk.energy = 0; atk.hp = Math.min(atk.maxHp, atk.hp + 100); def.hp = Math.min(def.maxHp, def.hp + 100); atk.shield += 80; applyStatus(atk, 'EVADE', 1, 0, null, buf, atkDeferred); }
    } else if (id === 'wolf') {
        if (num === 1) { atk.shield += 30; if(!atk.buffs) atk.buffs={}; atk.buffs.energyOnLoss = true; }
        else { dmgDealt = dealDirectDmg(atk.shield, atk, def, buf); atk.hp = Math.min(atk.maxHp, atk.hp + Math.floor(atk.shield/2)); atk.shield = 0; }
    } else if (id === 'cat') {
        if (num === 1) { applyStatus(def, ['ATK_DOWN', 'DEF_DOWN'][Math.floor(Math.random()*2)], 3, 20, null, buf, defDeferred); if (Math.random() < 0.5) applyStatus(def, Math.random()<0.5?'FREEZE':'DAZZLE', 1, 0, getRandomHand(), buf, defDeferred); }
        else { dmgDealt = dealDirectDmg(80, atk, def, buf, true); const count = (def.status||[]).filter(s => s && isDebuffStatus(s.type)).length; atk.hp = Math.min(atk.maxHp, atk.hp + count * 30); }
    } else if (id === 'human') {
        if (num === 1) { dealDirectDmg(30, atk, def, buf); applyStatus(def, 'BURN', 3, 20, null, buf, defDeferred); }
        else { dealDirectDmg(70, atk, def, buf); const bIdx = (def.status||[]).findIndex(s => s && s.type === 'BURN'); if (bIdx >= 0) { const b = def.status[bIdx]; dealDirectDmg(b.duration * b.value, atk, def, buf, true); atk.hp = Math.min(atk.maxHp, atk.hp + b.duration * 30); def.status.splice(bIdx, 1); } }
    } else if (id === 'elf') {
        if (num === 1) { const diff = Math.abs(atk.energy - def.energy); dealDirectDmg(atk.energy, atk, atk, buf, true); dealDirectDmg(def.energy, atk, def, buf, true); atk.hp = Math.min(atk.maxHp, atk.hp + diff); atk.energy = 0; def.energy = 0; }
        else { if(!atk.permaBuffs) atk.permaBuffs={}; atk.permaBuffs.seeds = (atk.permaBuffs.seeds || 0) + 1; dealDirectDmg(atk.permaBuffs.seeds * 20, atk, def, buf); }
    } else if (id === 'xiangxiang') {
        if (num === 1) { atk.shield += 50; applyStatus(def, 'DAZZLE', 1, 0, getRandomHand(), buf, defDeferred); }
        else { dealDirectDmg(100, atk, def, buf, true); if (atk.shield > 0) { dealDirectDmg(50, atk, def, buf, true); applyStatus(def, 'FREEZE', 1, 0, getRandomHand(), buf, defDeferred); } }
    } else {
        if (id === 'm1') { if (num === 1) { dealDirectDmg(10, atk, def, buf); applyStatus(def, 'PARASITE', 2, 10, null, buf, defDeferred); } else atk.hp = Math.min(atk.maxHp, atk.hp + 60); }
        else if (id === 'm2') { if (num === 1) atk.shield += 50; else { dealDirectDmg(40, atk, def, buf); applyStatus(def, 'FREEZE', 1, 0, getRandomHand(), buf, defDeferred); } }
        else if (id === 'm3') { if (num === 1) applyStatus(def, 'BURN', 2, 15, null, buf, defDeferred); else dealDirectDmg(80, atk, def, buf); }
        else if (id === 'm4') { if (num === 1) applyStatus(def, 'DAZZLE', 1, 0, getRandomHand(), buf, defDeferred); else atk.hp = Math.min(atk.maxHp, atk.hp + 40); }
        else if (id === 'm5') { if (num === 1) applyStatus(def, 'SILENCE', 2, 0, null, buf, defDeferred); else dealDirectDmg(70, atk, def, buf); }
        else if (id === 'b1') { if (num === 1) { def.energy = Math.max(0, def.energy - 20); applyStatus(def, 'SILENCE', 1, 0, null, buf, defDeferred); } else dealDirectDmg(150, atk, def, buf, true); }
        else if (id === 'b2') { if (num === 1) { atk.shield += 30; applyStatus(def, 'DAZZLE', 1, 0, getRandomHand(), buf, defDeferred); } else dealDirectDmg(130, atk, def, buf); }
        else if (id === 'b3') { if (num === 1) { atk.atk += 10; applyStatus(def, 'BURN', 2, 25, null, buf, defDeferred); } else dealDirectDmg(180, atk, def, buf); }
        else if (id === 'b4') { if (num === 1) { dealDirectDmg(30, atk, def, buf); applyStatus(def, 'PARASITE', 3, 20, null, buf, defDeferred); } else atk.hp = Math.min(atk.maxHp, atk.hp + 200); }
        else if (id === 'b5') { if (num === 1) atk.shield += 80; else { dealDirectDmg(100, atk, def, buf); def.energy = 0; applyStatus(def, 'FREEZE', 1, 0, getRandomHand(), buf, defDeferred); } }
    }
    
    if ((atk.talents||[]).includes('t7') && dmgDealt > 0) {
        const heal = Math.floor(dmgDealt * 0.15); atk.hp = Math.min(atk.maxHp, atk.hp + heal); buf.push({ text: `[嗜血] 吸收了 ${heal} 點生命！`, type: 'heal' });
    }
  };

  const processEoR = (ent, other, buf) => {
    let next = [];
    if ((ent.talents||[]).includes('t_wolf') && ent.shield > 0) { ent.hp = Math.min(ent.maxHp, ent.hp + 25); buf.push({text: `[極寒護體] 恢復 25 HP！`, type: 'heal'}); }
    if ((ent.talents||[]).includes('t_xiangxiang') && ent.hp < ent.maxHp * 0.5) { ent.hp = Math.min(ent.maxHp, ent.hp + 20); ent.shield += 10; buf.push({text: `[愛心宵夜] 恢復 20 HP 並獲得 10 護盾！`, type: 'heal'}); }
    
    for (let s of (ent.status || [])) {
        if (!s) continue;
        if (s.type === 'BURN') { const bDmg = (other.talents||[]).includes('t_human') ? 30 : 20; ent.hp = Math.max(0, ent.hp - bDmg); buf.push({text: `🔥 燃燒造成 ${bDmg} 傷害！`, type: 'damage'}); }
        if (s.type === 'PARASITE') { ent.hp = Math.max(0, ent.hp - 15); other.hp = Math.min(other.maxHp, other.hp + 15); buf.push({text: `🌿 寄生吸取 15 HP！`, type: 'damage'}); }
        if (s.type === 'REGEN') { ent.hp = Math.min(ent.maxHp, ent.hp + 20); buf.push({text: `💖 再生恢復 20 HP！`, type: 'heal'}); }
        
        if (s.isDeferred) {
            next.push({ ...s, isDeferred: false });
        } else {
            if (s.duration > 1) { next.push({ ...s, duration: s.duration - 1 }); } 
            else { buf.push({text: `[狀態解除] ${getStatusName(s.type)} 效果結束。`, type: 'info'}); }
        }
    }
    ent.status = next;
  };

  const handlePlayerSkill = (num) => {
    let p = { ...player, status: [...player.status], buffs: {...player.buffs}, permaBuffs: {...player.permaBuffs} };
    let e = { ...enemy, status: [...enemy.status], buffs: {...enemy.buffs}, permaBuffs: {...enemy.permaBuffs} };
    let buf = [];
    executeSkill(p, e, num, buf, true);
    setPlayer(p); setEnemy(e); setLogs(prev => [...prev, ...buf]);
    if (p.hp <= 0) handleDeath('player'); else if (e.hp <= 0) handleDeath('enemy');
  };

  const playRound = (choice) => {
    if (gameState !== 'battle') return;
    let p = JSON.parse(JSON.stringify(player)); let e = JSON.parse(JSON.stringify(enemy)); let buf = [];

    if (!(e.status||[]).some(s => s && s.type === 'SILENCE')) {
        const c2 = getActualCost(e.char.skill2.cost, (e.talents||[]).includes('t8'));
        const c1 = getActualCost(e.char.skill1.cost, (e.talents||[]).includes('t8'));
        if (e.energy >= c2 && Math.random() > 0.4) executeSkill(e, p, 2, buf, false);
        else if (e.energy >= c1 && Math.random() > 0.5) executeSkill(e, p, 1, buf, false);
    }

    const getAiHand = () => {
        const eD = (e.status||[]).find(s => s && s.type === 'DAZZLE' && !s.isDeferred);
        if (eD && RPS_CHOICES[eD.hand]) return eD.hand;

        let available = ['ROCK', 'PAPER', 'SCISSORS'];
        const eF = (e.status||[]).find(s => s && s.type === 'FREEZE' && !s.isDeferred);
        if (eF) available = available.filter(k => k !== eF.hand);

        if (available.length === 0) return 'ROCK';

        if (e.char.prefHand && available.includes(e.char.prefHand)) {
            const roll = Math.random();
            if (roll < 0.5) return e.char.prefHand;
            else {
                const others = available.filter(h => h !== e.char.prefHand);
                if (others.length > 0) return others[Math.floor(Math.random() * others.length)];
                return e.char.prefHand;
            }
        }
        return available[Math.floor(Math.random() * available.length)];
    };

    let aiChoice = getAiHand();

    buf.push({ text: `你出 【${RPS_CHOICES[choice].icon}】，對手出 【${RPS_CHOICES[aiChoice].icon}】`, type: 'info' });

    if (choice === aiChoice) {
        const ce = (ent) => { if ((ent.status||[]).some(s => s && s.type === 'FATIGUE')) return 0; let b = (ent.talents||[]).includes('t5') ? 40 : 20; if ((ent.status||[]).some(s => s && s.type === 'EXCITE')) b = Math.floor(b * 1.5); return b; };
        p.energy = Math.min(100, p.energy + ce(p)); e.energy = Math.min(100, e.energy + ce(e));
        if ((p.talents||[]).includes('t5')) p.hp = Math.min(p.maxHp, p.hp + 15);
        buf.push({ text: '平手！雙方各退一步。', type: 'info' });
    } else {
        const isPW = RPS_CHOICES[choice].beats === aiChoice; let atk = isPW ? p : e; let def = isPW ? e : p;
        if (def.buffs && def.buffs.energyOnLoss) { def.energy = Math.min(100, def.energy + 50); def.buffs.energyOnLoss = false; }
        let mult = getElementMultiplier(atk.char.element.id, def.char.element.id);
        
        let atkVal = atk.atk + getStatusValueSum(atk, 'ATK_UP') - getStatusValueSum(atk, 'ATK_DOWN');
        let defVal = def.def + getStatusValueSum(def, 'DEF_UP') - getStatusValueSum(def, 'DEF_DOWN');
        if ((atk.talents||[]).includes('t6') && atk.hp < atk.maxHp * 0.3) atkVal = Math.floor(atkVal * 1.5);

        let d = Math.max(10, Math.floor(atkVal * mult - defVal));
        
        if ((isPW ? choice : aiChoice) === 'SCISSORS' && (atk.talents||[]).includes('t9')) d = Math.floor(d * 1.5);
        if ((isPW ? choice : aiChoice) === 'ROCK' && (atk.talents||[]).includes('t10')) d = Math.floor(d * 1.5);
        if ((isPW ? choice : aiChoice) === 'PAPER' && (atk.talents||[]).includes('t11')) d = Math.floor(d * 1.5);
        if ((!isPW ? choice : aiChoice) === 'SCISSORS' && (def.talents||[]).includes('t9')) d = Math.floor(d * 0.5);
        if ((!isPW ? choice : aiChoice) === 'ROCK' && (def.talents||[]).includes('t10')) d = Math.floor(d * 0.5);
        if ((!isPW ? choice : aiChoice) === 'PAPER' && (def.talents||[]).includes('t11')) d = Math.floor(d * 0.5);
        
        dealDirectDmg(d, atk, def, buf);
    }
    processEoR(p, e, buf); processEoR(e, p, buf);
    setPlayer(p); setEnemy(e); setLogs(prev => [...prev, ...buf]);
    if (p.hp <= 0) handleDeath('player'); else if (e.hp <= 0) handleDeath('enemy');
  };

  const startBattleMode = (selectedChar, tIds) => {
    try {
        if (!selectedChar) throw new Error("未選擇出戰角色！");

        let pMax = selectedChar.stats.maxHp + (tIds.includes('t1') ? 100 : 0);
        let initE = tIds.includes('t3') ? 25 : 0; if (tIds.some(t=>['t9','t10','t11'].includes(t))) initE += 20;
        let pSeeds = tIds.includes('t_elf') ? 2 : 0;
        
        let pObj = { 
            char: selectedChar, talents: tIds, hp: pMax, maxHp: pMax, 
            atk: selectedChar.stats.atk + (tIds.includes('t2') ? 10 : 0), 
            def: selectedChar.stats.def, energy: initE, shield: tIds.includes('t4') ? 80 : 0, 
            buffs: { dmgMult: 1, extraDmg: 0, energyOnLoss: false }, 
            permaBuffs: { startEnergy: 0, startShield: 0, seeds: pSeeds }, status: [] 
        };
        if (tIds.includes('t_bear')) { const pool = shuffle(['ATK_UP', 'DEF_UP', 'REGEN']); pObj.status.push({ type: pool[0], duration: 3, value: 20, isNew: false, isDeferred: false }, { type: pool[1], duration: 3, value: 20, isNew: false, isDeferred: false }); }
        
        let eChar; 
        if (gameMode === 'brawl') {
            const pool = [...CHARACTERS, ...NORMAL_MONSTERS, ...BOSS_MONSTERS];
            if (unlocks.includes('xiangxiang')) pool.push(HIDDEN_CHARACTER);
            if (unlocks.includes('newyear_bear')) pool.push(VARIANTS[0]);
            eChar = pool[Math.floor(Math.random() * pool.length)];
        } else {
            let cRoute = [...shuffle([...NORMAL_MONSTERS]).slice(0, 2), shuffle([...BOSS_MONSTERS])[0]];
            let cStage = 0;
            setCampaignRoute(cRoute);
            setCampaignStage(cStage);
            eChar = cRoute[cStage];
        }
        
        if (!eChar) throw new Error("敵方魔物生成失敗！");

        let validETalents = ALL_TALENTS.filter(t => !t.exclusiveTo || t.exclusiveTo === (eChar.baseId || eChar.id));
        let eT = getRandomTalents(getBaseTalents(eChar), validETalents);
        let eMax = eChar.stats.maxHp + (eT.includes('t1') ? 100 : 0);
        let eInitE = eT.includes('t3') ? 25 : 0; if (eT.some(t=>['t9','t10','t11'].includes(t))) eInitE += 20;
        let eSeeds = eT.includes('t_elf') ? 2 : 0;
        let eObj = { 
            char: eChar, talents: eT, hp: eMax, maxHp: eMax, 
            atk: eChar.stats.atk + (eT.includes('t2') ? 10 : 0), 
            def: eChar.stats.def, energy: eInitE, shield: eT.includes('t4') ? 80 : 0, 
            buffs: { dmgMult: 1, extraDmg: 0, atkReduction: 0, energyOnLoss: false }, 
            permaBuffs: { startEnergy: 0, startShield: 0, seeds: eSeeds }, status: [] 
        };
        if (eT.includes('t_bear')) { const pool = shuffle(['ATK_UP', 'DEF_UP', 'REGEN']); eObj.status.push({ type: pool[0], duration: 3, value: 20, isNew: false, isDeferred: false }, { type: pool[1], duration: 3, value: 20, isNew: false, isDeferred: false }); }

        let np = { ...progress };
        if (!encountered.includes(eChar.id)) { np.encountered = [...encountered, eChar.id]; saveProgress(np); }
        
        setPlayer(pObj); setEnemy(eObj); setNewlyCaptured(null); setLogs([{ text: `夜晚的艾歐蘭斯充滿危險，戰鬥開始！`, type: 'system' }]); setGameState('battle');

    } catch (e) {
        console.error(e);
        setSysError(`戰鬥引擎載入失敗: ${e.message}\n請檢查是否有舊存檔干擾。`);
    }
  };

  const handleDeath = (target) => {
    let np = { ...progress };
    if (target === 'player') { saveProgress(np); setGameState('game_over'); setWinner('enemy'); } 
    else {
        if (unlocks.includes('tamer_kert') && !captured.includes(enemy.char.id) && !enemy.char.baseId && enemy.char.id !== 'xiangxiang') { np.captured = [...captured, enemy.char.id]; setNewlyCaptured(enemy.char); }
        np.ap = (np.ap || 0) + 1;
        if (gameMode === 'campaign' && campaignStage === 2) {
            const bid = player.char.baseId || player.char.id;
            if (isBasicChar(player.char) || bid === 'xiangxiang') { np.mastery = {...np.mastery}; np.mastery[bid] = Math.min(3, (np.mastery[bid] || 0) + 1); }
        }
        let earned = gameMode === 'campaign' ? (campaignStage < 2 ? 1 : 2) : 3;
        np.crystals += earned; saveProgress(np); setRewardCrystals(earned);
        if (gameMode === 'campaign' && campaignStage < 2) { setAvailableRewards(shuffle([...REWARD_POOL]).slice(0, 3)); setGameState('select_reward'); } 
        else { setGameState('game_over'); setWinner('player'); }
    }
  };

  const handleReward = (r) => {
    let np = r.apply(player); const ns = campaignStage + 1; const ne = campaignRoute[ns];
    let prog = { ...progress }; if (!prog.encountered.includes(ne.id)) { prog.encountered.push(ne.id); saveProgress(prog); }
    
    np.energy = Math.min(100, (np.permaBuffs?.startEnergy || 0) + (np.talents.includes('t3') ? 25 : 0) + (np.talents.some(t=>['t9','t10','t11'].includes(t)) ? 20 : 0)); 
    np.shield = (np.permaBuffs?.startShield || 0) + (np.talents.includes('t4') ? 80 : 0); 
    np.status = []; 
    np.buffs = { dmgMult: 1, extraDmg: 0, energyOnLoss: false };
    
    let pSeeds = np.talents.includes('t_elf') ? 2 : 0;
    np.permaBuffs = { ...np.permaBuffs, seeds: (np.permaBuffs?.seeds || 0) + pSeeds };
    
    setPlayer(np); 
    setCampaignStage(ns); 
    
    let validETalents = ALL_TALENTS.filter(t => !t.exclusiveTo || t.exclusiveTo === (ne.baseId || ne.id));
    let eT = getRandomTalents(getBaseTalents(ne), validETalents);
    let eMax = ne.stats.maxHp + (eT.includes('t1') ? 100 : 0);
    let eInitE = eT.includes('t3') ? 25 : 0; if (eT.some(t=>['t9','t10','t11'].includes(t))) eInitE += 20;
    
    let eSeeds = eT.includes('t_elf') ? 2 : 0;
    let eObj = { 
        char: ne, 
        talents: eT, 
        hp: eMax, 
        maxHp: eMax, 
        atk: ne.stats.atk + (eT.includes('t2') ? 10 : 0), 
        def: ne.stats.def, 
        energy: eInitE, 
        shield: eT.includes('t4') ? 80 : 0, 
        status: [],
        buffs: { dmgMult: 1, extraDmg: 0, atkReduction: 0, energyOnLoss: false }, 
        permaBuffs: { startEnergy: 0, startShield: 0, seeds: eSeeds }
    };
    if (eT.includes('t_bear')) { const pool = shuffle(['ATK_UP', 'DEF_UP', 'REGEN']); eObj.status.push({ type: pool[0], duration: 3, value: 20, isNew: false, isDeferred: false }, { type: pool[1], duration: 3, value: 20, isNew: false, isDeferred: false }); }
    
    setEnemy(eObj); 
    setLogs([{ text: `深淵的 ${ne.name} 出現了！`, type: 'system' }]); 
    setGameState('battle');
  };

  const handleHomeActivity = (topic) => {
    if (!homeHost || !homeGuest) return;
    if (progress.ap < 1) { setSysError('AP 不足！請至夜巡或亂鬥中獲取行動點數。'); return; }
    
    let np = { ...progress, ap: progress.ap - 1 };
    const hId = homeHost.baseId || homeHost.id; const gId = homeGuest.baseId || homeGuest.id;
    const key = [hId, gId].sort().join('_');
    np.affection = {...np.affection};
    np.affection[key] = Math.min(20, (np.affection[key] || 0) + (homeGuest.prefAction === topic ? 3 : 1));
    
    if (topic === 'snack') {
        np.snackCount = (np.snackCount || 0) + 1;
        if (np.snackCount >= 15 && !unlocks.includes('harvest_elf')) { 
            np.unlocks = [...unlocks, 'harvest_elf']; 
            showToastMsg('吃飽飽才能豐收！解鎖了異裝【豐收節布布】！🌻'); 
        }
    }
    saveProgress(np);
    
    const dialogs = {
      'gaming': { hostText: `深淵魔物開始躁動了，準備好去巡夜了嗎？`, guestReplies: { 'bear': '好啊！我來幫你們擋下襲擊！', 'wolf': '我負責觀察魔物弱點，你們專心斬殺。', 'cat': '喵... 沒有星晶貓條本小姐不幹！', 'human': '看我燃燒的大劍一刀斬斷深淵！', 'elf': '我會用聖光在後方護佑你們的～', 'xiangxiang': '吼... 剛輪完白班... 讓我再睡五分鐘...', 'default': '(拿起了武器準備出發)' } },
      'snack': { hostText: `剛結束夜間討伐肚子好餓，火爐旁有留宵夜喔！`, guestReplies: { 'bear': '有蜂蜜嗎？加一點進去絕對好吃！', 'wolf': '清淡點的熱湯比較好消化。', 'cat': '喵嗚？不要想自己獨吞星晶碎屑！', 'human': '交給我！我用燃燒之刃幫你烤到七分熟！', 'elf': '我來為大家泡一杯安神花茶吧。', 'xiangxiang': '柯特的愛心宵夜... 吃飽才有力氣... 呼嚕...', 'default': '(開心地接過分享的食物)' } },
      'chat': { hostText: `最近連續激戰有點累，星晶的干擾也讓人喘不過氣...`, guestReplies: { 'bear': '靠著我休息吧，我的毛皮很溫暖。', 'wolf': '如果你們累了，今晚我不介意守夜。', 'cat': '呼嚕呼嚕... 這個溫暖的位子歸我了！', 'human': '覺得寒氣重嗎？我放個火魔法取暖吧！', 'elf': '讓我施放治癒，緩解你身上的疲勞。', 'xiangxiang': '來抱抱吧，白虎的肚子很好抱的喔...', 'default': '(靜靜地聆聽，陪伴在你身邊)' } }
    };
    setActiveDialogue({ host: dialogs[topic].hostText, guest: dialogs[topic].guestReplies[gId] || dialogs[topic].guestReplies['default'] });
  };

  const renderBadges = (ent) => {
    const bgs = (ent.status||[]).filter(s=>s).map((s,i) => {
        let extra = '';
        if (s.type === 'DAZZLE' && s.hand && RPS_CHOICES[s.hand]) extra = `(${RPS_CHOICES[s.hand].icon})`;
        if (s.type === 'FREEZE' && s.hand && RPS_CHOICES[s.hand]) extra = `(禁${RPS_CHOICES[s.hand].icon})`;
        return <span key={`s${i}`} className={`bg-stone-800 text-white border px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 ${isBuffStatus(s.type)?'border-green-500':'border-red-500'} ${s.isDeferred?'opacity-50 border-dashed':''}`}>{getStatusIcon(s.type)} {getStatusName(s.type)}{extra}({s.duration})</span>;
    });
    if (ent.buffs?.energyOnLoss) bgs.push(<span key="eol" className="bg-teal-900/80 text-teal-100 border border-teal-400 px-1.5 py-0.5 rounded shadow-md text-[10px]">❄️ 戰敗回能</span>);
    if (ent.permaBuffs?.seeds > 0) bgs.push(<span key="seeds" className="bg-yellow-700/80 text-yellow-100 border border-yellow-400 px-1.5 py-0.5 rounded shadow-md text-[10px]">🌻 葵花子 x{ent.permaBuffs.seeds}</span>);
    return bgs;
  };

  // ========================== 各畫面渲染函數 ==========================
  const renderIntro = () => {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center bg-stone-950 text-stone-200 relative overflow-hidden">
          <div className="absolute top-10 left-10 text-yellow-500/10"><Moon size={120} /></div>
          <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-8 tracking-widest text-center z-10 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">⚔️ 星晶物語：獸之夜行者 ⚔️</h1>
          <div className="w-full max-w-4xl mb-8 z-10">
              <div className="w-full h-48 md:h-72 bg-stone-900 border-2 border-stone-800 rounded-3xl overflow-hidden shadow-2xl relative flex items-center justify-center mb-6">
                  <img src="title_cg.png" alt="" className="w-full h-full object-cover absolute inset-0 opacity-80" onError={(e) => { e.target.style.display = 'none'; }} />
                  <div className="z-10 text-stone-600 text-xs font-mono">title_cg.png</div>
              </div>
              <div className="bg-stone-800/60 p-6 rounded-2xl border border-stone-700 text-stone-300 text-sm leading-relaxed relative mt-4">
                  <div className="absolute -top-3 -left-3 bg-indigo-900 border border-indigo-500 text-indigo-200 px-3 py-1 rounded-lg text-xs font-bold transform -rotate-2 shadow-lg">PROLOGUE</div>
                  <p className="mb-3 mt-2">「艾歐蘭斯」——由五大元素維持平衡的奇幻大陸。然而，天際的「大星晶」於某夜驟然碎裂，化為無數以太星晶散落各地。</p>
                  <p className="mb-3">受到星晶能量的污染，原本溫馴的生物發生異變。每當<span className="text-purple-400 font-bold">夜幕低垂</span>，這些具備強大攻擊性的「狂化魔物」便會出沒肆虐。</p>
                  <p>白晝，我們在營地休養生息；夜晚，我們化身為<span className="text-yellow-400 font-bold">獸之夜行者</span>，踏上討伐深淵與奪回星晶的旅途......</p>
              </div>
          </div>
          <div className="flex gap-4 mb-6 z-10 font-bold text-lg">
              <div className="bg-stone-800 border border-stone-700 px-6 py-2 rounded-full shadow-lg text-blue-300">💎 星晶：{progress.crystals}</div>
              <div className="bg-stone-800 border border-stone-700 px-6 py-2 rounded-full shadow-lg text-green-400">⚡ AP：{progress.ap}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-8 z-10">
              <button onClick={() => selectMode('campaign')} className="bg-stone-800 p-5 border-2 border-stone-700 hover:border-yellow-500 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center">
                  <div className="text-4xl mb-2">🗺️</div>
                  <h2 className="text-xl font-bold mb-1">夜巡戰役</h2>
                  <p className="text-stone-400 text-xs">連續討伐魔物，挑戰深淵霸主。</p>
              </button>
              <button onClick={() => selectMode('brawl')} className="bg-stone-800 p-5 border-2 border-stone-700 hover:border-blue-500 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center">
                  <div className="text-4xl mb-2">🤺</div>
                  <h2 className="text-xl font-bold mb-1">無盡亂鬥</h2>
                  <p className="text-stone-400 text-xs">單場無限制切磋，磨練戰鬥技巧。</p>
              </button>
              <button onClick={() => { setGameState('home'); setHomeStep('select_host'); setHomeHost(null); setHomeGuest(null); setActiveDialogue(null); }} className="bg-stone-800 p-5 border-2 border-stone-700 hover:border-green-500 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center">
                  <div className="text-4xl mb-2"><Home className="text-green-400" size={36}/></div>
                  <h2 className="text-xl font-bold mb-1">白晝營地</h2>
                  <p className="text-stone-400 text-xs">消耗 AP 與同伴互動，培養羈絆。</p>
              </button>
              <button onClick={() => setGameState('shop')} className="bg-stone-800 p-5 border-2 border-stone-700 hover:border-cyan-500 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center">
                  <div className="text-4xl mb-2">💎</div>
                  <h2 className="text-xl font-bold mb-1">星晶商店</h2>
                  <p className="text-stone-400 text-xs">花費星晶購買天賦、異裝與物資。</p>
              </button>
          </div>
          <div className="flex items-center gap-4 z-10">
              <button onClick={() => setGameState('gallery')} className="flex items-center gap-2 text-stone-400 hover:text-white bg-stone-800 px-6 py-3 rounded-full border border-stone-700 transition-all hover:shadow-lg"><BookOpen size={20}/> 艾歐蘭斯圖鑑 {isFullGallery(captured) && !unlocks.includes('xiangxiang') && <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>}</button>
              <div className="relative flex items-center">
                  <button onClick={() => setShowCheat(!showCheat)} className="text-stone-700 hover:text-stone-400 text-xl transition-colors bg-stone-800 p-3 rounded-full border border-stone-700 shadow-md">🤫</button>
                  {showCheat && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-stone-800 p-2 rounded-lg shadow-xl flex gap-2 border border-stone-600 z-50 animate-fade-in w-max">
                          <input type="password" value={cheatCode} onChange={e=>setCheatCode(e.target.value)} className="w-24 bg-stone-900 text-white px-2 py-1 rounded text-sm focus:outline-none" placeholder="密語" />
                          <button onClick={()=>{
                              let np = {...progress};
                              if(cheatCode === '315') { np.crystals += 999; setSysError('星晶獲取成功！💎'); }
                              else if (cheatCode === '520') { const pool = [...NORMAL_MONSTERS, ...BOSS_MONSTERS].map(m=>m.id); np.captured = [...new Set([...captured, ...pool])]; np.encountered = [...new Set([...encountered, ...pool])]; np.unlocks = [...new Set([...unlocks, 'xiangxiang', 'newyear_bear'])]; setSysError('全圖鑑收服！解鎖新年熊吉！🐾🧧'); }
                              else if (cheatCode === '828') { [...CHARACTERS.map(c=>c.id), 'xiangxiang'].forEach(id => { np.mastery = {...np.mastery}; np.mastery[id] = 3; }); np.ap = 99; setSysError('全員專精 3 星、AP滿級！🌟'); }
                              saveProgress(np); setShowCheat(false); setCheatCode('');
                          }} className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm font-bold">送出</button>
                      </div>
                  )}
              </div>
          </div>
      </div>
    );
  };

  const renderSelectChar = () => {
    let list = [...CHARACTERS];
    if (unlocks.includes('xiangxiang')) list.push(HIDDEN_CHARACTER);
    VARIANTS.forEach(v => { if (unlocks.includes(v.id) && !v.isPlaceholder) list.push(v); });
    list = [...list, ...NORMAL_MONSTERS.filter(m => captured.includes(m.id)), ...BOSS_MONSTERS.filter(m => captured.includes(m.id))];
    
    return (
        <div className="min-h-screen p-8 bg-stone-900 text-stone-200">
            <button onClick={()=>setGameState('intro')} className="mb-8 flex items-center gap-2 text-stone-400 hover:text-white"><ArrowLeft/> 返回首頁</button>
            <h2 className="text-3xl font-bold text-yellow-400 mb-8 text-center">選擇出戰夜行者</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {list.map(c => {
                    const isMonster = isMonsterChar(c);
                    const isHidden = c.id === 'xiangxiang';
                    const isVariant = isVariantChar(c);
                    return (
                        <div key={c.id} onClick={()=>{
                            if (player.char?.id !== c.id) setSelectedTalentIds([]); // 切換角色時重置天賦
                            setPlayer({...player, char: c});
                        }} className={`relative overflow-hidden bg-stone-800 p-6 rounded-3xl border-2 transition-all cursor-pointer ${player.char?.id === c.id ? 'border-yellow-500 scale-105 shadow-xl' : 'border-stone-700 opacity-80 hover:border-stone-500'}`}>
                            {isVariant && <div className="absolute top-0 right-0 bg-stone-600 px-3 py-1 rounded-bl-xl text-[10px] font-bold z-10 shadow-md">✨ 異裝</div>}
                            {isMonster && <div className="absolute top-0 right-0 bg-green-600 px-3 py-1 rounded-bl-xl text-[10px] font-bold z-10 shadow-md">🐾 已馴化</div>}
                            {isHidden && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 shadow-md">🌟 終極獎勵</div>}
                            
                            <div className="flex gap-4 items-center mb-4"><SpriteAvatar char={c} size="w-16 h-16" /><div><div className="text-sm opacity-50">{c.title}</div><div className="font-bold text-xl">{c.isEmoji?c.emoji:c.icon} {c.name}</div></div></div>
                            <div className="bg-stone-900 p-4 rounded-xl text-xs space-y-3 shadow-inner">
                                <p><span className="text-blue-400 font-bold">戰技:</span> {c.skill1.name} <span className="bg-stone-800 px-1.5 py-0.5 rounded text-stone-400 border border-stone-700 float-right">{c.skill1.cost}E</span></p>
                                <p><span className="text-purple-400 font-bold">奧義:</span> {c.skill2.name} <span className="bg-stone-800 px-1.5 py-0.5 rounded text-stone-400 border border-stone-700 float-right">{c.skill2.cost}E</span></p>
                            </div>
                            {player.char?.id === c.id && <button onClick={(e)=>{e.stopPropagation(); setGameState('select_talent');}} className="w-full mt-4 bg-yellow-600 hover:bg-yellow-500 py-3 rounded-xl font-bold text-stone-900 shadow-md transition-colors">確認出陣</button>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const renderSelectTalent = () => {
    if (!player.char) return <div className="min-h-screen bg-stone-900 flex items-center justify-center"><button onClick={()=>setGameState('select_char')} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg">角色載入異常，點擊返回選角</button></div>;
    
    const cost = selectedTalentIds.reduce((sum, id) => sum + ALL_TALENTS.find(t => t.id === id).cost, 0);
    const max = getBaseTalents(player.char) + (progress.maxTalents - 3);
    const pLeft = max - cost;
    
    return (
        <div className="min-h-screen p-8 max-w-4xl mx-auto flex flex-col items-center bg-stone-900 text-stone-200">
            <button onClick={()=>setGameState('select_char')} className="self-start mb-4 flex items-center gap-2 text-stone-400 hover:text-white"><ArrowLeft/> 返回選角</button>
            <h2 className="text-3xl font-bold text-yellow-400 mb-2 mt-4">配置戰鬥天賦</h2>
            <div className="bg-stone-800 px-6 py-3 rounded-full font-bold text-lg mb-8 border border-stone-700 shadow-lg">剩餘點數：<span className={pLeft === 0 ? 'text-red-400' : 'text-yellow-400'}>{pLeft}</span> / {max}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {getAvailableTalents().map(t => {
                    const sel = selectedTalentIds.includes(t.id); 
                    const dis = !sel && pLeft < t.cost;
                    return <div key={t.id} onClick={() => !dis && toggleTalent(t.id)} className={`p-4 border-2 rounded-xl flex items-center gap-4 transition-all ${sel ? 'bg-blue-900/40 border-blue-500 shadow-md' : dis ? 'opacity-50 border-stone-800' : 'bg-stone-800 border-stone-700 hover:border-stone-500 cursor-pointer'}`}>
                        <div className="text-3xl">{t.icon}</div><div><div className="font-bold text-white">{t.name} <span className="text-[10px] bg-stone-700 px-2 py-0.5 rounded-full ml-2 text-stone-300 border border-stone-600">Cost {t.cost}</span></div><div className="text-xs text-stone-400 mt-1 leading-relaxed">{t.desc}</div></div>
                    </div>
                })}
            </div>
            <button onClick={() => startBattleMode(player.char, selectedTalentIds)} className="bg-yellow-600 text-stone-900 px-16 py-4 rounded-full font-bold text-xl mt-10 hover:bg-yellow-500 shadow-lg transition-transform hover:scale-105 active:scale-95">踏入黑夜！</button>
        </div>
    );
  };

  const renderBattle = () => {
    if (!player.char || !enemy.char) return <div className="min-h-screen bg-stone-950 flex items-center justify-center"><button className="text-white bg-red-600 px-6 py-3 rounded-xl font-bold shadow-lg" onClick={()=>setGameState('select_char')}>戰鬥載入異常，點擊返回選角</button></div>;

    const silenced = (player.status||[]).some(s => s && s.type === 'SILENCE' && !s.isDeferred);
    const dazzleStatus = (player.status||[]).find(s => s && s.type === 'DAZZLE' && !s.isDeferred);
    const freezeStatus = (player.status||[]).find(s => s && s.type === 'FREEZE' && !s.isDeferred);

    const skill1Cost = getActualCost(player.char.skill1.cost, (player.talents || []).includes('t8'));
    const skill2Cost = getActualCost(player.char.skill2.cost, (player.talents || []).includes('t8'));
    const canUseSkill1 = !silenced && player.energy >= skill1Cost;
    const canUseSkill2 = !silenced && player.energy >= skill2Cost;

    return (
        <div className="min-h-screen p-4 flex flex-col max-w-3xl mx-auto h-screen bg-stone-950 text-stone-200">
            <div className="text-center text-xs text-stone-500 mb-2 font-bold">{gameMode === 'campaign' ? `夜巡戰役 - 第 ${campaignStage + 1} 戰` : '無盡亂鬥'}</div>
            
            <div className={`p-4 rounded-xl mb-2 flex items-center gap-4 bg-stone-900 border-2 ${enemy.char.element.border} relative overflow-hidden shadow-lg`}>
                <SpriteAvatar char={enemy.char} size="w-20 h-20 md:w-24 md:h-24" />
                <div className="flex-1 z-10">
                    <div className="flex justify-between font-bold text-red-400 mb-1"><span className="truncate">{enemy.char.isEmoji?enemy.char.emoji:enemy.char.icon} {enemy.char.name}</span><span className="text-[10px] bg-stone-800 px-2 rounded">HP {enemy.hp}/{enemy.maxHp}</span></div>
                    <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden relative"><div className="h-full bg-red-600 transition-all" style={{width:`${(enemy.hp/enemy.maxHp)*100}%`}}></div>{enemy.shield>0 && <div className="absolute top-0 left-0 h-full bg-blue-400/50" style={{width:`${(enemy.shield/enemy.maxHp)*100}%`}}></div>}</div>
                    <div className="flex items-center gap-2 mt-1"><Zap size={12} className="text-yellow-400"/><div className="w-full h-2 bg-stone-800 rounded-full"><div className="h-full bg-yellow-400 transition-all" style={{width:`${enemy.energy}%`}}></div></div></div>
                    <div className="flex flex-wrap gap-1 mt-2">{renderBadges(enemy)}</div>
                </div>
            </div>
            
            <div className="flex-1 bg-stone-900 border border-stone-800 p-4 rounded-xl overflow-y-auto mb-3 text-sm space-y-2 font-mono shadow-inner">
                {logs.length === 0 && <div className="text-stone-500 text-center mt-10">預判敵方的行動吧！</div>}
                {logs.map((l,i) => <div key={i} className={l.type==='damage'?'text-orange-400':l.type==='heal'?'text-green-300':l.type==='shield'?'text-blue-300':'text-stone-300'}>{l.text}</div>)}
                <div ref={logsEndRef} />
            </div>
            
            <div className="bg-stone-900 border-2 border-stone-700 p-4 rounded-xl relative overflow-hidden shadow-lg">
                <div className="flex gap-4 mb-4"><SpriteAvatar char={player.char} size="w-16 h-16 md:w-20 md:h-20" />
                    <div className="flex-1 z-10">
                        <div className="flex justify-between font-bold text-green-400 mb-1"><span className="truncate">{player.char.isEmoji?player.char.emoji:player.char.icon} {player.char.name} (你)</span><span className="text-[10px] bg-stone-800 px-2 rounded">HP {player.hp}/{player.maxHp}</span></div>
                        <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden relative"><div className="h-full bg-green-500 transition-all" style={{width:`${(player.hp/player.maxHp)*100}%`}}></div>{player.shield>0 && <div className="absolute top-0 left-0 h-full bg-blue-400/50" style={{width:`${(player.shield/player.maxHp)*100}%`}}></div>}</div>
                        <div className="flex items-center gap-2 mt-1"><Zap size={12} className="text-yellow-400"/><div className="w-full h-2 bg-stone-800 rounded-full"><div className="h-full bg-yellow-400 transition-all" style={{width:`${player.energy}%`}}></div></div></div>
                        <div className="flex flex-wrap gap-1 mt-2">{renderBadges(player)}</div>
                    </div>
                </div>
                <div className="grid grid-cols-5 gap-2 relative z-10">
                    <div className="col-span-2 flex flex-col gap-2">
                        <button disabled={!canUseSkill1} onClick={()=>handlePlayerSkill(1)} className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 p-2 rounded-lg font-bold text-[11px] flex justify-between items-center shadow-md transition-colors"><span>{player.char.skill1.name}</span><span className="bg-stone-900/50 px-1.5 py-0.5 rounded text-white">{skill1Cost}E</span></button>
                        <button disabled={!canUseSkill2} onClick={()=>handlePlayerSkill(2)} className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 p-2 rounded-lg font-bold text-[11px] flex justify-between items-center shadow-md transition-colors"><span>奧義</span><span className="bg-stone-900/50 px-1.5 py-0.5 rounded text-white">{skill2Cost}E</span></button>
                    </div>
                    <div className="col-span-3 grid grid-cols-3 gap-2">
                        {Object.values(RPS_CHOICES).map(c => {
                            const isDazzledOut = dazzleStatus && dazzleStatus.hand !== c.id;
                            const isFreezedOut = freezeStatus && freezeStatus.hand === c.id;
                            const dis = isDazzledOut || isFreezedOut;
                            
                            return <button key={c.id} disabled={dis} onClick={()=>playRound(c.id)} className={`relative p-2 rounded-xl bg-stone-700 text-2xl border-b-4 border-stone-800 shadow-md ${dis?'opacity-40 cursor-not-allowed':'active:translate-y-1 active:border-b-0 hover:bg-stone-600 transition-colors'}`}>
                                {c.icon}<div className="text-[10px] mt-1">{c.name}</div>
                                {dis && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xl rounded-xl z-20">🔒</div>}
                            </button>
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const renderHome = () => {
    let hosts = [...CHARACTERS]; if(unlocks.includes('xiangxiang')) hosts.push(HIDDEN_CHARACTER);
    VARIANTS.forEach(v => { if(unlocks.includes(v.id) && !v.isPlaceholder) hosts.push(v); });
    return (
        <div className="min-h-screen p-8 bg-stone-950 text-stone-200">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8"><button onClick={()=>setGameState('intro')} className="flex items-center gap-2 text-stone-400 hover:text-white"><ArrowLeft/> 返回</button><div className="bg-stone-800 px-4 py-1.5 rounded-full border border-stone-700 text-green-400 font-bold shadow-lg">⚡ AP: {progress.ap}</div></div>
                {homeStep === 'select_host' && (
                    <div className="text-center animate-fade-in"><h2 className="text-3xl font-bold mb-8 text-green-400">選擇營地代表</h2><div className="grid grid-cols-2 md:grid-cols-5 gap-4">{hosts.map(c=>(<div key={c.id} onClick={()=>{setHomeHost(c); setHomeStep('select_guest');}} className="bg-stone-800 p-4 rounded-xl cursor-pointer border-2 border-stone-700 hover:border-green-500 transition-all shadow-md hover:-translate-y-1"><SpriteAvatar char={c} size="w-16 h-16 mx-auto"/><p className="mt-2 text-sm font-bold">{c.name}</p></div>))}</div></div>
                )}
                {homeStep === 'select_guest' && (
                    <div className="text-center animate-fade-in"><h2 className="text-3xl font-bold mb-8 text-yellow-400">邀請巡夜夥伴</h2><div className="grid grid-cols-2 md:grid-cols-5 gap-4">{hosts.map(c=>{ const isH = (homeHost.baseId||homeHost.id) === (c.baseId||c.id); return (<div key={c.id} onClick={()=>{ if(!isH) {setHomeGuest(c); setHomeStep('room');} }} className={`bg-stone-800 p-4 rounded-xl border-2 border-stone-700 transition-all ${isH ? 'opacity-20 cursor-not-allowed' : 'hover:border-yellow-500 cursor-pointer shadow-md hover:-translate-y-1'}`}><SpriteAvatar char={c} size="w-16 h-16 mx-auto"/><p className="mt-2 text-sm font-bold">{c.name}</p></div>) })}</div></div>
                )}
                {homeStep === 'room' && (
                    <div className="bg-stone-800 p-8 rounded-3xl border-4 border-stone-700 text-center shadow-2xl relative animate-fade-in">
                        <div className="flex justify-around items-center mb-8">
                            <div><SpriteAvatar char={homeHost} size="w-24 h-24"/><p className="mt-2 text-green-400 font-bold text-lg">{homeHost.name}</p></div>
                            <div className="text-5xl animate-pulse">🏕️</div>
                            <div className="relative"><SpriteAvatar char={homeGuest} size="w-24 h-24"/><p className="mt-2 text-yellow-400 font-bold text-lg">{homeGuest.name}</p>
                                { (() => {
                                    const currentMastery = mastery[homeGuest.baseId || homeGuest.id] || 0;
                                    return currentMastery >= 3 && (
                                        <button onClick={() => setShowCG(homeGuest.baseId || homeGuest.id)} className="absolute -top-4 -right-4 bg-purple-600 p-3 rounded-full border-2 border-purple-400 hover:scale-110 shadow-lg text-white transition-transform">
                                            <Camera size={20}/>
                                        </button>
                                    );
                                })() }
                            </div>
                        </div>
                        {(() => {
                            const key = [homeHost.baseId||homeHost.id, homeGuest.baseId||homeGuest.id].sort().join('_');
                            const aff = affection[key] || 0;
                            return (<div className="w-64 mx-auto mb-8"><div className="flex justify-between text-xs text-pink-300 font-bold mb-1"><span>羈絆</span><span>{aff}/20</span></div><div className="w-full h-3 bg-stone-900 rounded-full border border-stone-700 overflow-hidden"><div className="h-full bg-pink-500 transition-all duration-700" style={{width:`${(aff/20)*100}%`}}></div></div>{aff>=20 && (<button onClick={()=>setShowCG(`friendship_${key}`)} className="mt-4 bg-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold animate-bounce shadow-xl border-2 border-pink-400 flex items-center gap-2 mx-auto"><Heart size={16} fill="currentColor"/> 友誼之巔</button>)}</div>);
                        })()}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <button onClick={()=>handleHomeActivity('gaming')} className="bg-blue-900/50 p-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-blue-800 border border-blue-800/50 transition-colors shadow-md"><Gamepad2 size={20}/> 準備夜巡 (1 AP)</button>
                            <button onClick={()=>handleHomeActivity('snack')} className="bg-orange-900/50 p-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-orange-800 border border-orange-800/50 transition-colors shadow-md"><Coffee size={20}/> 分享營食 (1 AP)</button>
                            <button onClick={()=>handleHomeActivity('chat')} className="bg-purple-900/50 p-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-purple-800 border border-purple-800/50 transition-colors shadow-md"><MessageCircle size={20}/> 篝火閒聊 (1 AP)</button>
                        </div>
                        <div className="bg-stone-900 min-h-[120px] p-6 rounded-xl flex flex-col justify-end text-sm italic text-stone-400 shadow-inner">
                            {activeDialogue ? (<><div className="text-green-400 text-left mb-3 bg-green-900/20 p-3 rounded-lg border border-green-900/50 max-w-[80%] self-start">「{activeDialogue.host}」</div><div className="text-yellow-400 text-right bg-stone-700/30 p-3 rounded-lg border border-stone-700/50 max-w-[80%] self-end">「{activeDialogue.guest}」</div></>) : "消耗 AP 互動以揭曉故事..."}
                        </div>
                        <button onClick={()=>{setHomeStep('select_guest'); setActiveDialogue(null);}} className="mt-8 text-stone-500 hover:text-white transition-colors underline">邀請其他夥伴</button>
                    </div>
                )}
                {showCG && (<div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-fade-in"><button onClick={()=>setShowCG(null)} className="absolute top-6 right-6 text-white hover:text-stone-400 transition-colors"><X size={40}/></button><div className="max-w-4xl text-center relative"><img src={`cg_${showCG}.png`} className="max-h-[85vh] rounded-xl shadow-2xl border-4 border-stone-700 mx-auto" onError={e=>{e.target.onerror=null; e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%231c1917'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23444'%3E此圖尚未置入: cg_"+showCG+".png%3C/text%3E%3C/svg%3E";}} /><p className="text-yellow-400 mt-6 text-2xl font-bold tracking-widest bg-stone-900/80 inline-block px-8 py-2 rounded-full border border-yellow-900">★ 專屬回憶 ★</p></div></div>)}
            </div>
        </div>
    );
  };

  const renderGallery = () => {
    return (
        <div className="min-h-screen p-8 bg-stone-900 text-stone-200">
            <div className="max-w-6xl mx-auto pb-10">
                <button onClick={() => setGameState('intro')} className="mb-8 flex items-center gap-2 text-stone-400 hover:text-white transition-colors"><ArrowLeft/> 返回首頁</button>
                <div className="flex gap-4 justify-center mb-8 flex-wrap">
                    {['companions', 'enemies', 'guide'].map(t=>(<button key={t} onClick={() => setGalleryTab(t)} className={`px-8 py-3 rounded-full font-bold transition-all ${galleryTab===t? 'bg-blue-600 shadow-lg' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}>{t==='companions'?'夜行者':t==='enemies'?'深淵魔物':'冒險指南'}</button>))}
                </div>
                
                <NpcDialogue 
                    npcName="公會會長" 
                    npcImageFallback="🦉" 
                    dialogues={[
                        "這裡是艾歐蘭斯公會，記錄著所有的魔物與夜行者情報。",
                        "多了解魔物的弱點，夜巡時才不會吃虧。",
                        "你有遇到那隻傳說中的白虎神獸嗎？聽說他非常貪睡呢。",
                        "集齊所有圖鑑，是每個夜行者的終極目標！",
                        "這本指南記錄了大陸所有的情報，出發前好好研讀吧。"
                    ]} 
                />

                {galleryTab === 'guide' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto animate-fade-in">
                        <div className="bg-stone-800 p-8 rounded-3xl border border-stone-700"><h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2"><HelpCircle size={24}/> 基礎術語</h3><div className="space-y-4">{GUIDE_TERMS.map((g,i)=>(<div className="bg-stone-900 p-4 rounded-xl border border-stone-800" key={i}><span className="text-blue-400 font-bold block mb-1 text-lg">{g.term}</span><p className="text-stone-400 text-sm leading-relaxed">{g.desc}</p></div>))}</div></div>
                        <div className="bg-stone-800 p-8 rounded-3xl border border-stone-700"><h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-2"><Sparkles size={24}/> 狀態表</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{STATUS_DOCS.map((s,i)=>(<div className="bg-stone-900 p-4 rounded-xl border border-stone-800 flex items-start gap-3" key={i}><span className="text-2xl mt-1">{s.icon}</span><div><span className={`font-bold block ${s.color}`}>{s.name}</span><p className="text-stone-400 text-xs mt-1 leading-relaxed">{s.effect}</p></div></div>))}</div></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {(galleryTab === 'companions' ? [...CHARACTERS, HIDDEN_CHARACTER, ...VARIANTS] : [...NORMAL_MONSTERS, ...BOSS_MONSTERS]).map((c) => {
                            const isBasic = isBasicChar(c);
                            const isUnlocked = isBasic || encountered.includes(c.id) || (c.id === 'xiangxiang' && unlocks.includes('xiangxiang')) || (!!c.baseId && unlocks.includes(c.id));
                            const isPlaceholderVariant = !!c.baseId && (!unlocks.includes(c.id) || c.isPlaceholder);
                            
                            if (!isUnlocked && !isPlaceholderVariant) return <div key={c.id} className="bg-stone-800 border-2 border-stone-700 opacity-60 rounded-3xl p-6 min-h-[300px] flex items-center justify-center text-4xl">❓</div>;
                            
                            if (isPlaceholderVariant) return (
                                <div key={c.id} className="relative overflow-hidden bg-stone-800 border-2 border-stone-700 opacity-80 rounded-3xl p-6 min-h-[300px] flex flex-col items-center justify-center text-center shadow-inner">
                                    <div className="w-20 h-20 rounded-full bg-stone-900 border-2 border-stone-700 flex items-center justify-center mb-4 opacity-50"><span className="text-4xl grayscale">{c.icon}</span></div>
                                    <h3 className="font-bold text-stone-400 text-xl">{c.name}</h3><p className="text-stone-500 text-xs mt-1">({c.title})</p>
                                    <div className="mt-6 bg-stone-900/80 p-4 rounded-xl border border-stone-700 w-full"><span className="text-yellow-600 block mb-2 font-bold text-sm">🔒 解鎖預告</span><p className="text-stone-400 text-xs">{c.unlockHint}</p></div>
                                </div>
                            );

                            return (
                                <div key={c.id} className={`relative overflow-hidden bg-stone-800 border-2 rounded-3xl p-6 shadow-xl hover:-translate-y-1 transition-transform ${BOSS_MONSTERS.some(b=>b.id===c.id)?'border-purple-600 shadow-purple-900/20': c.id==='xiangxiang'?'border-yellow-500 shadow-yellow-900/20': !!c.baseId?'border-stone-500':'border-stone-700'}`}>
                                    {BOSS_MONSTERS.some(b=>b.id===c.id) && <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-widest z-10 shadow-md">BOSS</div>}
                                    {c.id==='xiangxiang' && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-widest z-10 shadow-md">🌟 終極獎勵</div>}
                                    {!!c.baseId && !c.isPlaceholder && <div className="absolute top-0 right-0 bg-stone-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-widest z-10 shadow-md">✨ 異裝型態</div>}
                                    {captured.includes(c.id) && <div className="absolute top-0 left-0 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl tracking-widest z-10 shadow-md">🐾 已收服</div>}
                                    
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <div className="flex items-center gap-4"><SpriteAvatar char={c} size="w-16 h-16" /><div><div className="text-xs text-gray-400 mb-0.5">{c.title}</div><div className="text-xl font-bold flex items-center gap-2">{c.isEmoji ? c.emoji : c.icon} {c.name}</div></div></div>
                                        { (isBasic || c.id === 'xiangxiang' || !!c.baseId) && (
                                            <div className="flex text-yellow-500">
                                                {[...Array(3)].map((_, i) => {
                                                    const currentMastery = mastery[c.baseId || c.id] || 0;
                                                    const isEarned = currentMastery > i;
                                                    return <Star key={i} size={16} fill={isEarned ? 'currentColor' : 'none'} className={isEarned ? '' : 'text-stone-600'} />;
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] mb-4 bg-stone-900 p-2 rounded-xl border border-stone-700 shadow-inner">
                                        <div><div className="text-gray-500 mb-1">血量</div><div className="font-bold text-green-400 text-sm">{c.stats.maxHp}</div></div>
                                        <div><div className="text-gray-500 mb-1">攻擊</div><div className="font-bold text-red-400 text-sm">{c.stats.atk}</div></div>
                                        <div><div className="text-gray-500 mb-1">防禦</div><div className="font-bold text-blue-400 text-sm">{c.stats.def}</div></div>
                                    </div>
                                    <div className="space-y-4 bg-stone-900 p-5 rounded-xl border border-stone-700 text-xs shadow-inner">
                                        <div><span className="text-blue-400 font-bold text-sm block mb-1">✦ 戰技：{c.skill1.name} <span className="text-[10px] font-normal text-stone-400 ml-1 bg-stone-800 px-2 py-0.5 rounded-full border border-stone-700 float-right text-white">耗能 {c.skill1.cost}E</span></span><p className="text-gray-400 mt-2 leading-relaxed">{c.skill1.desc}</p></div>
                                        <hr className="border-stone-800" />
                                        <div><span className="text-purple-400 font-bold text-sm block mb-1">❂ 奧義：{c.skill2.name} <span className="text-[10px] font-normal text-stone-400 ml-1 bg-stone-800 px-2 py-0.5 rounded-full border border-stone-700 float-right text-white">耗能 {c.skill2.cost}E</span></span><p className="text-gray-400 mt-2 leading-relaxed">{c.skill2.desc}</p></div>
                                    </div>
                                    <div className="mt-5"><span className="text-stone-400 font-bold text-xs mb-2 block flex justify-between"><span>📖 角色情報</span>{c.prefHand && <span className="text-yellow-400 bg-stone-900 px-2 py-0.5 rounded-md border border-stone-700">偏好: {RPS_CHOICES[c.prefHand].icon}</span>}</span><p className="text-stone-500 text-[11px] leading-relaxed">{c.lore}</p></div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderShop = () => {
    const shopItems = [
      { id: 'work', name: '公會打工', desc: '消耗 1 點 AP 協助公會處理雜務，獲得 5 顆星晶。', cost: 1, currency: 'ap', icon: '💼', canBuy: true, bought: false, isInfinite: true, onBuy: () => { let np={...progress, ap: progress.ap - 1, crystals: progress.crystals + 5}; saveProgress(np); } },
      { id: 'massage', name: '星晶按摩', desc: '花費 5 顆星晶享受魔力按摩，恢復 1 點 AP。', cost: 5, currency: 'crystal', icon: '💆', canBuy: true, bought: false, isInfinite: true, onBuy: () => { let np={...progress, crystals: progress.crystals - 5, ap: progress.ap + 1}; saveProgress(np); } },
      { id: 'newyear_bear', name: '異裝：新年熊吉', desc: '解鎖特殊型態「人人有魚」。', cost: 200, currency: 'crystal', icon: '🧧', canBuy: !unlocks.includes('newyear_bear'), bought: unlocks.includes('newyear_bear'), onBuy: () => { let np={...progress, crystals: progress.crystals - 200}; np.unlocks = [...unlocks, 'newyear_bear']; saveProgress(np); } },
      { id: 'max4', name: '擴展天賦槽 (4點)', desc: '將天賦點數上限提升至 4 點。', cost: 15, currency: 'crystal', icon: '⬆️', canBuy: progress.maxTalents === 3, bought: progress.maxTalents >= 4, onBuy: () => { let np={...progress, crystals: progress.crystals - 15, maxTalents: 4}; saveProgress(np); } },
      { id: 'max5', name: '擴展天賦槽 (5點)', desc: '將天賦點數上限提升至 5 點。', cost: 30, currency: 'crystal', icon: '🌟', canBuy: progress.maxTalents === 4, bought: progress.maxTalents >= 5, onBuy: () => { let np={...progress, crystals: progress.crystals - 30, maxTalents: 5}; saveProgress(np); } },
      { id: 'cost4', name: '進階戰術書 (Cost 4)', desc: '解鎖 3 種增幅特定猜拳的高階天賦。', cost: 20, currency: 'crystal', icon: '📘', canBuy: !unlocks.includes('cost4'), bought: unlocks.includes('cost4'), onBuy: () => { let np={...progress, crystals: progress.crystals - 20}; np.unlocks=[...unlocks,'cost4']; saveProgress(np); } },
      { id: 'cost5', name: '終極奧義卷軸 (Cost 5)', desc: '解鎖 2 種擁有逆轉戰局能力的終極天賦。', cost: 40, currency: 'crystal', icon: '📙', canBuy: !unlocks.includes('cost5'), bought: unlocks.includes('cost5'), onBuy: () => { let np={...progress, crystals: progress.crystals - 40}; np.unlocks=[...unlocks,'cost5']; saveProgress(np); } },
      { id: 'char_talents', name: '專屬覺醒指南 (Cost 3)', desc: '解鎖所有角色的「專屬天賦」。', cost: 25, currency: 'crystal', icon: '✨', canBuy: !unlocks.includes('char_talents'), bought: unlocks.includes('char_talents'), onBuy: () => { let np={...progress, crystals: progress.crystals - 25}; np.unlocks=[...unlocks,'char_talents']; saveProgress(np); } },
      { id: 'tamer_kert', name: '訓獸師的心得', desc: '解鎖魔物收服機制！', cost: 60, currency: 'crystal', icon: '🐾', canBuy: !unlocks.includes('tamer_kert'), bought: unlocks.includes('tamer_kert'), onBuy: () => { let np={...progress, crystals: progress.crystals - 60}; np.unlocks=[...unlocks,'tamer_kert']; saveProgress(np); } }
    ];
    return (
        <div className="min-h-screen p-8 bg-stone-900 text-stone-200">
            <button onClick={()=>setGameState('intro')} className="mb-8 flex items-center gap-2 text-stone-400 hover:text-white transition-colors"><ArrowLeft/> 返回首頁</button>
            <div className="flex justify-between items-center mb-8 max-w-4xl mx-auto"><h2 className="text-3xl font-bold text-cyan-400">星晶商店</h2><div className="text-blue-300 font-bold bg-stone-800 px-4 py-2 rounded-full border border-stone-700 shadow-lg">💎 星晶：{progress.crystals}</div></div>
            
            <NpcDialogue 
                npcName="商會會長" 
                npcImageFallback="🦊" 
                dialogues={[
                    "歡迎來到星晶商店！只要有足夠的星晶，連那隻貪睡的白虎都能請得動喔。",
                    "打工可以賺星晶，按摩可以恢復 AP，合理分配資源吧！",
                    "要買下這件新年和服嗎？熊吉穿起來一定很有福氣。",
                    "進階戰術書可是工會的珍藏，對戰鬥很有幫助的。",
                    "聽說最近深淵的魔物變多了，準備點物資準沒錯。"
                ]} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {shopItems.map(item => {
                    const affordable = item.currency === 'ap' ? progress.ap >= item.cost : progress.crystals >= item.cost;
                    return (
                    <div key={item.id} className={`bg-stone-800 p-6 rounded-2xl border-2 flex flex-col items-center transition-all shadow-xl ${item.bought && !item.isInfinite ? 'border-green-600/30 opacity-60' : 'border-stone-700 hover:border-cyan-600/50 hover:-translate-y-1'}`}>
                        <div className="text-5xl mb-4">{item.icon}</div><h3 className="font-bold text-white mb-2">{item.name}</h3><p className="text-xs text-stone-400 text-center h-8 mb-6">{item.desc}</p>
                        {item.bought && !item.isInfinite ? <button disabled className="w-full bg-green-900/30 py-3 rounded-xl text-green-500 font-bold border border-green-800/50">已購入</button> : !item.canBuy ? <button disabled className="w-full bg-stone-700 py-3 rounded-xl text-stone-500 font-bold">條件不足</button> : <button onClick={item.onBuy} disabled={!affordable} className={`w-full py-3 rounded-xl font-bold transition-colors shadow-md ${affordable ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}>{item.currency === 'ap' ? `⚡ ${item.cost} AP 兌換` : `💎 ${item.cost} 星晶購買`}</button>}
                    </div>
                )})}
            </div>
        </div>
    );
  };

  if (sysError) {
      return (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8">
               <div className="bg-stone-900 border-2 border-red-500 p-8 rounded-3xl max-w-lg w-full text-white font-mono text-sm shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-2 bg-red-600 animate-pulse"></div>
                   <div className="flex items-center gap-3 mb-6 text-red-400"><AlertTriangle size={32}/> <h3 className="text-2xl font-bold">系統異常攔截</h3></div>
                   <p className="mb-8 text-stone-300 leading-relaxed bg-stone-950 p-4 rounded-lg border border-stone-800">{sysError}</p>
                   <button onClick={() => { setSysError(null); setGameState('intro'); }} className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-red-900/20">確認並返回首頁</button>
               </div>
           </div>
      );
  }

  return (
      <>
          {toast && (
              <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-yellow-500 text-stone-900 px-6 py-3 rounded-full shadow-2xl z-[100] animate-bounce font-bold border-2 border-yellow-300">
                  {toast}
              </div>
          )}
          
          {(() => {
              switch (gameState) {
                  case 'intro': return renderIntro();
                  case 'select_char': return renderSelectChar();
                  case 'select_talent': return renderSelectTalent();
                  case 'battle': return renderBattle();
                  case 'home': return renderHome();
                  case 'gallery': return renderGallery();
                  case 'shop': return renderShop();
                  case 'select_reward': return (
                      <div className="min-h-screen p-8 flex flex-col items-center justify-center bg-stone-900 text-stone-200">
                          <h2 className="text-4xl font-bold text-yellow-500 mb-8 animate-bounce">🎁 夜巡勝利！</h2>
                          <div className="flex gap-4 mb-10"><div className="bg-stone-800 px-6 py-2 rounded-full border border-stone-700 shadow-xl font-bold text-lg">💎 星晶：{rewardCrystals}</div><div className="bg-stone-800 px-6 py-2 rounded-full border border-stone-700 shadow-xl text-green-400 font-bold text-lg">⚡ AP：1</div></div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                              {availableRewards.slice(0,3).map((r,i)=>(<div key={i} onClick={()=>handleReward(r)} className="bg-stone-800 p-8 border-2 border-stone-700 hover:border-yellow-500 rounded-3xl cursor-pointer text-center transition-all hover:-translate-y-2 shadow-lg"><div className="text-6xl mb-4">{r.icon}</div><div className="font-bold text-xl mb-2">{r.name}</div><div className="text-stone-400 text-xs leading-relaxed mt-2">{r.desc}</div></div>))}
                          </div>
                      </div>
                  );
                  case 'game_over': return (
                      <div className="min-h-screen flex items-center justify-center p-4 bg-stone-950">
                          <div className="bg-stone-800 p-10 rounded-3xl text-center border-4 border-stone-700 max-w-sm w-full shadow-2xl relative">
                              <h1 className="text-6xl mb-4">{winner==='player'?'🏆':'💀'}</h1>
                              <h2 className="text-3xl font-bold text-white mb-6">{winner==='player'?'夜巡大捷！':'力竭倒下...'}</h2>
                              {newlyCaptured && (<div className="mb-6 bg-green-900/50 border border-green-500 px-4 py-2 rounded-xl flex items-center justify-center gap-2"><span className="text-2xl">🐾</span><span className="text-green-400 font-bold text-sm">訓化了 {newlyCaptured.name}！</span></div>)}
                              <div className="bg-stone-900 p-5 rounded-xl mb-8 space-y-3 font-bold shadow-inner">
                                  <div className="text-blue-300 flex justify-between text-lg"><span>獲得星晶：</span><span>💎 {rewardCrystals}</span></div>
                                  {winner==='player' && <div className="text-green-400 flex justify-between text-lg"><span>獲得 AP：</span><span>⚡ 1</span></div>}
                              </div>
                              <button onClick={()=>startBattleMode(player.char, selectedTalentIds)} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold mb-4 shadow-lg active:scale-95 transition-all text-white">重整態勢再出發</button>
                              <button onClick={()=>setGameState('intro')} className="w-full bg-stone-700 hover:bg-stone-600 py-4 rounded-xl font-bold text-stone-300 transition-colors">返回首頁</button>
                          </div>
                      </div>
                  );
                  default: return null;
              }
          })()}
      </>
  );
}