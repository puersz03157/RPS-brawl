import React, { useState, useEffect, useRef } from 'react';
import { Zap, Sparkles, BookOpen, Home, Gamepad2, Coffee, MessageCircle, ArrowLeft, ShoppingCart, Star, Camera, X, Moon, Heart, HelpCircle, Info, AlertTriangle, Skull, ChevronLeft, ChevronRight, Lock, Trophy, CheckCircle, Settings, Trash2 } from 'lucide-react';

// ==========================================
// 0. 音效系統 (Web Audio API)
// ==========================================
let _audioCtx = null;
const getAudioCtx = () => {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
};

const playSound = (type) => {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;

    const tone = (freq, startT, dur, oscType = 'sine', vol = 0.25) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = oscType;
      o.frequency.setValueAtTime(freq, startT);
      g.gain.setValueAtTime(vol, startT);
      g.gain.exponentialRampToValueAtTime(0.001, startT + dur);
      o.start(startT); o.stop(startT + dur);
    };

    const slide = (freqFrom, freqTo, startT, dur, oscType = 'square', vol = 0.25) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = oscType;
      o.frequency.setValueAtTime(freqFrom, startT);
      o.frequency.exponentialRampToValueAtTime(freqTo, startT + dur);
      g.gain.setValueAtTime(vol, startT);
      g.gain.exponentialRampToValueAtTime(0.001, startT + dur);
      o.start(startT); o.stop(startT + dur);
    };

    switch (type) {
      case 'hit':
        slide(200, 60, now, 0.12, 'square', 0.3);
        break;
      case 'heavy_hit':
        slide(150, 40, now, 0.18, 'sawtooth', 0.35);
        tone(80, now, 0.2, 'sine', 0.2);
        break;
      case 'heal':
        tone(523, now, 0.15, 'sine', 0.18);
        tone(659, now + 0.1, 0.15, 'sine', 0.18);
        tone(784, now + 0.2, 0.2, 'sine', 0.18);
        break;
      case 'shield':
        slide(600, 900, now, 0.1, 'triangle', 0.2);
        tone(750, now + 0.05, 0.2, 'triangle', 0.15);
        break;
      case 'buff':
        tone(523, now, 0.1, 'sine', 0.15);
        tone(659, now + 0.08, 0.1, 'sine', 0.15);
        tone(784, now + 0.16, 0.15, 'sine', 0.15);
        break;
      case 'debuff':
        slide(400, 180, now, 0.2, 'sawtooth', 0.2);
        break;
      case 'skill':
        slide(400, 800, now, 0.08, 'sine', 0.2);
        slide(800, 1200, now + 0.08, 0.1, 'sine', 0.2);
        break;
      case 'rps_win':
        tone(660, now, 0.1, 'sine', 0.2);
        tone(880, now + 0.08, 0.15, 'sine', 0.2);
        break;
      case 'rps_draw':
        tone(440, now, 0.12, 'triangle', 0.15);
        break;
      case 'rps_lose':
        slide(330, 220, now, 0.15, 'triangle', 0.18);
        break;
      case 'victory':
        [523, 659, 784, 1047].forEach((f, i) => tone(f, now + i * 0.13, 0.25, 'sine', 0.25));
        break;
      case 'defeat':
        [400, 300, 220, 150].forEach((f, i) => tone(f, now + i * 0.18, 0.25, 'sawtooth', 0.18));
        break;
      case 'click':
        tone(1200, now, 0.04, 'sine', 0.08);
        break;
      case 'gacha_pull':
        slide(300, 800, now, 0.15, 'sine', 0.2);
        slide(800, 1200, now + 0.15, 0.2, 'sine', 0.2);
        tone(1000, now + 0.35, 0.15, 'triangle', 0.15);
        break;
      case 'gacha_normal':
        tone(440, now, 0.1, 'sine', 0.2);
        tone(550, now + 0.08, 0.15, 'sine', 0.2);
        break;
      case 'gacha_ssr':
        [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, now + i * 0.1, 0.25, 'sine', 0.28));
        slide(1319, 2000, now + 0.5, 0.3, 'triangle', 0.2);
        break;
      default: break;
    }
  } catch (_) {}
};

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
const isDebuffStatus = (type) => type && ['BURN', 'PARASITE', 'FREEZE', 'DAZZLE', 'SILENCE', 'ATK_DOWN', 'DEF_DOWN', 'VULNERABLE', 'FATIGUE', 'VIP'].includes(type);

const getStatusValueSum = (ent, type) => {
    if (!ent || !ent.status) return 0;
    return ent.status.filter(s => s && s.type === type).reduce((acc, curr) => acc + (curr.value || 0), 0);
};

// ==========================================
// 2. 遊戲資料庫
// ==========================================
const ELEMENTS = {
  WOOD:  { id: 'wood',  name: '木', icon: '🌿', color: 'text-green-400',  bg: 'bg-green-100',  border: 'border-green-500'  },
  WATER: { id: 'water', name: '水', icon: '💧', color: 'text-blue-400',   bg: 'bg-blue-100',   border: 'border-blue-500'   },
  FIRE:  { id: 'fire',  name: '火', icon: '🔥', color: 'text-red-400',    bg: 'bg-red-100',    border: 'border-red-500'    },
  LIGHT: { id: 'light', name: '光', icon: '✨', color: 'text-yellow-400', bg: 'bg-yellow-100', border: 'border-yellow-500' },
  DARK:  { id: 'dark',  name: '暗', icon: '🌑', color: 'text-purple-400', bg: 'bg-purple-100', border: 'border-purple-500' },
};

const RPS_CHOICES = {
  ROCK: { id: 'ROCK', icon: '✊', name: '石頭', beats: 'SCISSORS' },
  PAPER: { id: 'PAPER', icon: '🖐️', name: '布', beats: 'ROCK' },
  SCISSORS: { id: 'SCISSORS', icon: '✌️', name: '剪刀', beats: 'PAPER' }
};

const CHARACTERS = [
  { id: 'bear', name: '熊吉', icon: '🐻', title: '森林守護者', element: ELEMENTS.WOOD, image: 'avatar_bear.png', prefAction: 'snack', stats: { hp: 650, maxHp: 650, atk: 40, def: 30 }, desc: '依賴增益強化自身的爆發型戰士。', lore: '原本是守護森林神木的巨熊獸人。大星晶碎裂導致森林枯萎，為了解決異變而踏上旅程。超級喜歡蜂蜜，肚子餓的時候會變得暴躁。', skill1: { name: '熊吼之怒', cost: 20, desc: '自身隨機獲得一種增益：攻擊提升、防禦提升或再生 (3回合)。' }, skill2: { name: '魚竿甩擊', cost: 80, desc: '消耗身上所有增益，基礎 50 傷害 (每層增益+40)，並施加 🌿[寄生] 3回合。' } },
  { id: 'wolf', name: '白澤', icon: '🐺', title: '滄海孤狼', element: ELEMENTS.WATER, image: 'avatar_wolf.png', prefAction: 'gaming', stats: { hp: 500, maxHp: 500, atk: 55, def: 20 }, desc: '善用冰封護盾進行防禦與風險反擊。', lore: '來自極寒之地的冷酷劍客，奉命尋找失落的星晶。外表高冷，但其實是個會默默幫大家守夜的傲嬌，非常注重保暖。', skill1: { name: '冰封防禦', cost: 30, desc: '給予自身 50 護盾，並獲得「下一次猜拳戰敗時獲得 50 能量」狀態。' }, skill2: { name: '護盾攻擊', cost: 80, desc: '消耗所有護盾造成等量傷害，並自身恢復消耗護盾值一半的 HP。' } },
  { id: 'cat', name: '布提婭', icon: '🐈‍⬛', title: '夜靈貓', element: ELEMENTS.DARK, image: 'avatar_cat.png', prefAction: 'snack', stats: { hp: 400, maxHp: 400, atk: 70, def: 15 }, desc: '能施加多種負面狀態並吸取生命。', lore: '意外吞下了暗屬性的星晶碎片，化身為擁有強大魔力的夜靈貓。傲慢任性，覺得人類都是她的鏟屎官，但為了保護高級罐罐會拼盡全力。', skill1: { name: '奇異之光', cost: 40, desc: '施加降攻或降防(3回)，再施加封印(1回)。已有的效果不會重複疊加。' }, skill2: { name: '黑暗之抓', cost: 75, desc: '無視護盾造成 80 傷害。對方每有一種負面狀態，自身恢復 30 HP。' } },
  { id: 'human', name: '普爾斯', icon: '🧑‍🚒', title: '烈焰鬥士', element: ELEMENTS.FIRE, image: 'avatar_human.png', prefAction: 'gaming', stats: { hp: 550, maxHp: 550, atk: 50, def: 20 }, desc: '能引爆燃燒造成毀滅性爆發與回復。', lore: '熱血的工會討伐者，以一把燃燒的大劍聞名。總是衝在最前線享受狩獵魔物的快感，不管遇到什麼困難都覺得「烤個肉吃就能解決」。', skill1: { name: '燃燒之劍', cost: 40, desc: '給予對方 30 傷害，施加 🔥[燃燒] 3回合。目標已燃燒時，改為延長 3 回合。' }, skill2: { name: '黑炎爆發', cost: 80, desc: '給予 70 傷害，立即結算對手燃燒，每結算一回合自身恢復 30 HP。' } },
  { id: 'elf', name: '布布', icon: '🧚', title: '光之精靈', element: ELEMENTS.LIGHT, image: 'avatar_elf.png', prefAction: 'chat', stats: { hp: 450, maxHp: 450, atk: 45, def: 25 }, desc: '運用能量反噬與葵花子戰鬥的奇兵。', lore: '誕生於光之星晶的精靈，負責引導夜行者們收集星晶。天然呆，喜歡收集發亮的東西和各種植物種子（尤其是葵花子）。', skill1: { name: '能量炸彈', cost: 50, desc: '清空雙方能量並造成各自能量傷害，自身恢復能量差值的 HP。' }, skill2: { name: '囤囤之力', cost: 35, desc: '獲得一個葵花子，每有一個葵花子給予對手 20 傷害 (不消耗)。' } },
  { id: 'kohaku', name: '琥珀', icon: '🦊', title: '商會會長', element: ELEMENTS.LIGHT, image: 'avatar_kohaku.png', prefAction: 'snack', stats: { hp: 750, maxHp: 750, atk: 55, def: 40 }, desc: '利用金幣與VIP狀態進行極致剝削。', lore: '艾歐蘭斯商會的最高負責人。看似笑瞇瞇其實精打細算，掌握著整個大陸的經濟命脈。用錢砸人是他的拿手好戲。', skill1: { name: '尊榮推銷', cost: 30, desc: '自身獲得 1 枚【商會金幣】與 50 盾，並強制對手成為 💳[VIP] 3回合。' }, skill2: { name: '資本鎮壓', cost: 80, desc: '基礎 80 傷。每消耗 1 枚金幣追加 50 真實傷害並回 30 HP。' } },
  { id: 'aldous', name: '奧爾德斯', icon: '🦉', title: '大長老', element: ELEMENTS.DARK, image: 'avatar_aldous.png', prefAction: 'chat', stats: { hp: 680, maxHp: 680, atk: 80, def: 30 }, desc: '擁有看破機制的極限單體爆發力。', lore: '黑羽公會大長老，實力深不可測的貓頭鷹獸人。雖然年事已高，但揮舞天羽斬的速度依舊無人能及。戰鬥時周身環繞睿智之風。', skill1: { name: '長老的威壓', cost: 40, desc: '施加 ❄️[封印] 1回、🤐[沉默] 2回與 📉[降防] 3回。' }, skill2: { name: '秘劍・天羽斬', cost: 60, desc: '無視護盾 80 傷。若對手處於沉默或封印，傷害變為 4 倍(320)並吸血 50%。' } }
];

const HIDDEN_CHARACTER = { 
  id: 'xiangxiang', name: '虎吉', icon: '🐯', title: '慵懶的白虎', element: ELEMENTS.LIGHT, isEmoji: false, image: 'avatar_xiangxiang.png', stats: { hp: 700, maxHp: 700, atk: 60, def: 35 }, prefAction: 'snack', desc: '全圖鑑收集獎勵。擁有強大的防禦與拘束力。', lore: '傳說中負責維持大陸夜間秩序的白虎神獸。因為大星晶碎裂導致魔物橫行，被迫瘋狂加班巡夜，導致他現在極度嗜睡。被柯特的訓獸之力與特製宵夜喚醒而加入。', skill1: { name: '軟萌肚肚', cost: 40, desc: '展現充滿彈性的肚子，獲得 50 護盾，並使對手 💫[強制] 下回出拳。' }, skill2: { name: '致命擁抱', cost: 90, desc: '無視護盾造成 100 傷害。若施放時有護盾，額外加 50 傷並 ❄️[封印]。' } 
};

const VARIANTS = [
  { id: 'newyear_bear', baseId: 'bear', name: '新年熊吉', icon: '🧧', title: '人人有魚', element: ELEMENTS.WOOD, isEmoji: false, image: 'avatar_newyear_bear.png', stats: { hp: 700, maxHp: 700, atk: 35, def: 35 }, desc: '分享祝福的森林大胃王。', lore: '換上喜氣洋洋的紅色和服，拿著釣竿到處分享漁獲與祝福的熊吉。', skill1: { name: '新春撒網', cost: 30, desc: '自身獲得 ⚡[亢奮] 3回合，對手陷入 💤[疲憊] 3回合。' }, skill2: { name: '年年有餘', cost: 80, desc: '消耗所有能量造成 80 基礎傷害。自身恢復 100 HP與80盾，對手僅恢復 30 HP。' }, unlockHint: '收集 50 個碎片於圖鑑合成解鎖。' },
  { id: 'harvest_elf', baseId: 'elf', name: '豐收節布布', icon: '🌻', title: '花開富貴', element: ELEMENTS.WOOD, isEmoji: false, image: 'avatar_harvest_elf.png', stats: { hp: 600, maxHp: 600, atk: 40, def: 30 }, desc: '生命再生與護盾雙修的生存輔助。', lore: '換上秋季豐收服飾的布布，口袋裡總是塞滿了剛採收的黃金葵花子。', skill1: { name: '黃金種子', cost: 30, desc: '獲得 1 顆葵花子(上限5)，並獲得再生(3回)。' }, skill2: { name: '萬物滋長', cost: 60, desc: '造成40傷(每顆種子+20傷)，總傷害的50%轉為護盾。' }, unlockHint: '收集 50 個碎片於圖鑑合成解鎖。' },
  { id: 'blackflame_human', baseId: 'human', name: '黑炎暴走普爾斯', icon: '🔥', title: '終焉煉獄', element: ELEMENTS.FIRE, isEmoji: false, image: 'avatar_blackflame_human.png', stats: { hp: 500, maxHp: 500, atk: 85, def: 15 }, desc: '燃燒結算與殘血狂化的極限輸出。', lore: '被深淵魔炎侵蝕的普爾斯。理智邊緣徘徊，但換來了能將一切焚燒殆盡的終焉之力。', skill1: { name: '餘燼枷鎖', cost: 40, desc: '造成35傷，施加燃燒與易傷(3回)。' }, skill2: { name: '終焉煉獄斬', cost: 85, desc: '基礎80傷。若目標有燃燒，立即結算其傷害，每剩餘回合使奧義傷害+20%。' }, unlockHint: '收集 50 個碎片於圖鑑合成解鎖。' },
  { id: 'valentine_wolf', baseId: 'wolf', name: '情人節白澤', icon: '💝', title: '冷酷甜心', element: ELEMENTS.WATER, isEmoji: false, image: 'avatar_valentine_wolf.png', stats: { hp: 550, maxHp: 550, atk: 50, def: 35 }, desc: '靈活護盾與封印控制的防禦反擊者。', lore: '罕見地穿上正裝，嘴裡刁著巧克力棒。雖然總是一臉嫌棄，但對於收到的心意都會好好珍惜。', skill1: { name: '糖衣護盾', cost: 45, desc: '獲得60點護盾，並賦予迴避(1次)。' }, skill2: { name: '心碎冰封', cost: 75, desc: '造成65傷，60%機率施加封印(1回)。' }, unlockHint: '收集 50 個碎片於圖鑑合成解鎖。' },
  { id: 'halloween_cat', baseId: 'cat', name: '萬聖節布提婭', icon: '🎃', title: '搗蛋貓咪', element: ELEMENTS.DARK, isEmoji: false, image: 'avatar_halloween_cat.png', stats: { hp: 450, maxHp: 450, atk: 65, def: 20 }, desc: '隨機擾亂與負面狀態增傷的惡作劇大師。', lore: '萬聖夜的絕對統治者。為了討要全大陸的高級貓草罐罐，她不介意用最惡劣的咒語來「拜訪」不給糖的傢伙。', skill1: { name: '不給糖就搗蛋', cost: 30, desc: '隨機賦予敵方一種屬性下降，且自身獲得亢奮或迴避。' }, skill2: { name: '萬聖影襲', cost: 80, desc: '無視護盾基礎50傷。目標每有一種負面狀態，傷害提升 1.5 倍(連乘)。' }, unlockHint: '收集 50 個碎片於圖鑑合成解鎖。' },
  { id: 'christmas_xiangxiang', baseId: 'xiangxiang', name: '聖誕節虎吉', icon: '🎁', title: '最棒的禮物', element: ELEMENTS.LIGHT, isEmoji: false, image: 'avatar_christmas_xiangxiang.png', stats: { hp: 850, maxHp: 850, atk: 70, def: 45 }, desc: '全圖鑑收集與異裝齊全的終極型態。', lore: '被柯特套上麋鹿裝的白虎。原本想在聖誕節好好補眠，卻因為收到太多禮物而難得精神百倍。', skill1: { name: '聖誕大禮包', cost: 40, desc: '隨機抽取三種增益狀態賦予自身(3回合)。' }, skill2: { name: '聖夜沉眠', cost: 90, desc: '造成100點光屬性傷害，並強制施加眩目/強制。' }, unlockHint: '收集齊其餘五件異裝後自動解鎖。' }
];

const NORMAL_MONSTERS = [
  { id: 'm1', name: '草原史萊姆', title: '黏糊糊的', element: ELEMENTS.WOOD, isEmoji: false, icon: '🍄', image: 'monster_slime.png', prefHand: 'PAPER', stats: { hp: 250, maxHp: 250, atk: 25, def: 5 }, lore: '最常見的低級魔物，喜歡寄生在別人身上吸取養分。被收服後意外地適合拿來當抱枕。', skill1: { name: '寄生孢子', cost: 30, desc: '造成 10 傷害並施加 🌿[寄生] 2回合。' }, skill2: { name: '光合作用', cost: 60, desc: '回復自己 60 點生命值。' } },
  { id: 'm2', name: '巨石蟹', title: '硬邦邦的', element: ELEMENTS.WATER, isEmoji: false, icon: '🦀', image: 'monster_crab.png', prefHand: 'SCISSORS', stats: { hp: 400, maxHp: 400, atk: 20, def: 25 }, lore: '全身覆蓋堅硬岩石的螃蟹，防禦力驚人。生氣時會吐出冰封泡泡。', skill1: { name: '硬化', cost: 30, desc: '獲得 50 點護盾。' }, skill2: { name: '泡泡光線', cost: 60, desc: '造成 40 傷害並施加 ❄️[封印] 1回合。' } },
  { id: 'm3', name: '爆炎犬', title: '熱騰騰的', element: ELEMENTS.FIRE, isEmoji: false, icon: '🐕', image: 'monster_dog.png', prefHand: 'ROCK', stats: { hp: 300, maxHp: 300, atk: 45, def: 10 }, lore: '性格暴躁的犬型魔物，全身燃燒著火焰，咬合力極強。收服後冬天可以用來當暖爐。', skill1: { name: '火焰牙', cost: 30, desc: '造成 20 傷害並施加 🔥[燃燒] 2回合。' }, skill2: { name: '地獄火', cost: 70, desc: '造成高達 80 點傷害。' } },
  { id: 'm4', name: '閃耀精靈', title: '刺眼的', element: ELEMENTS.LIGHT, isEmoji: false, icon: '🧚', image: 'monster_fairy.png', prefHand: 'PAPER', stats: { hp: 280, maxHp: 280, atk: 35, def: 15 }, lore: '被光之星晶過度影響而失去理智的精靈，會發出強光致盲對手。', skill1: { name: '致盲', cost: 40, desc: '施加 💫[眩目] 1回合。' }, skill2: { name: '神聖新星', cost: 70, desc: '造成 40 點傷害並回復自身 40 血。' } },
  { id: 'm5', name: '影魔眼', title: '陰森森的', element: ELEMENTS.DARK, isEmoji: false, icon: '👁️', image: 'monster_eye.png', prefHand: 'ROCK', stats: { hp: 220, maxHp: 220, atk: 55, def: 5 }, lore: '漂浮在空中的巨大眼球，凝視會讓人陷入恐懼與沉默。', skill1: { name: '恐懼凝視', cost: 40, desc: '施加 🤐[沉默] 2回合。' }, skill2: { name: '虛空射線', cost: 60, desc: '造成 70 點高額傷害。' } },
  { id: 'm6', name: '刺藤傀儡', title: '荊棘纏繞的', element: ELEMENTS.WOOD, isEmoji: false, icon: '🪴', image: 'monster_vine.png', prefHand: 'SCISSORS', stats: { hp: 350, maxHp: 350, atk: 20, def: 30 }, lore: '由魔力星晶滋養的藤蔓怪，渾身佈滿荊棘。行動遲緩，但能讓靠近的敵人越戰越弱。', skill1: { name: '荊棘纏繞', cost: 35, desc: '對敵施加 📉[降攻] 與 📉[降防] 各 2 回合。' }, skill2: { name: '蔓延怒刺', cost: 65, desc: '造成 30 傷害，敵方每個負面狀態額外追加 20 傷。' } },
  { id: 'm7', name: '海藍水母', title: '飄渺無形的', element: ELEMENTS.WATER, isEmoji: false, icon: '🪼', image: 'monster_jellyfish.png', prefHand: 'PAPER', stats: { hp: 230, maxHp: 230, atk: 35, def: 10 }, lore: '在深海中靜靜飄蕩的神秘水母，半透明的傘蓋能折射光線讓人難以捕捉。觸手帶有強力麻痺毒素。', skill1: { name: '幻象漂浮', cost: 30, desc: '獲得 💨[迴避] 1次，並奪取敵方 20 點能量。' }, skill2: { name: '電擊觸手', cost: 65, desc: '造成 60 傷害，施加 ❄️[封印] 1回合並再奪取 30 點能量。' } },
  { id: 'm8', name: '熔岩蜥蜴', title: '滾燙的', element: ELEMENTS.FIRE, isEmoji: false, icon: '🦎', image: 'monster_lizard.png', prefHand: 'ROCK', stats: { hp: 320, maxHp: 320, atk: 35, def: 15 }, lore: '棲息於火山岩漿地帶的蜥蜴型魔物。表皮由凝固岩漿構成，蓄積熱能後能引爆全身造成毀滅性衝擊。', skill1: { name: '熔甲防禦', cost: 35, desc: '獲得 60 點護盾。' }, skill2: { name: '熔岩爆裂', cost: 70, desc: '消耗所有護盾，造成 40 加護盾等量的真實傷害。' } },
  { id: 'm9', name: '星晶鷺鳥', title: '輕盈飛翔的', element: ELEMENTS.LIGHT, isEmoji: false, icon: '🦢', image: 'monster_heron.png', prefHand: 'SCISSORS', stats: { hp: 260, maxHp: 260, atk: 40, def: 10 }, lore: '翅膀結晶化的光屬性鳥型魔物，飛行速度極快。振翅產生的光芒能令對手陷入眩目。', skill1: { name: '星光羽翼', cost: 30, desc: '獲得 ⚡[亢奮] 3回合，並獲得 30 點護盾。' }, skill2: { name: '天光衝擊', cost: 60, desc: '造成 55 傷害，並強制對手下回 💫[強制出拳]。' } },
  { id: 'm10', name: '噬夢獸', title: '令人昏昏欲睡的', element: ELEMENTS.DARK, isEmoji: false, icon: '🦇', image: 'monster_bat.png', prefHand: 'PAPER', stats: { hp: 280, maxHp: 280, atk: 45, def: 10 }, lore: '在夜間悄悄侵入夢境吸食精神力的蝙蝠型魔物。讓對手陷入持續疲憊的同時，自身卻越來越精力充沛。', skill1: { name: '夢魘爪', cost: 35, desc: '施加 💤[疲憊] 3回合，並自身恢復 30 HP。' }, skill2: { name: '虛空侵蝕', cost: 70, desc: '無視護盾造成 50 傷害，敵方每個負面狀態額外吸血 20 HP。' } }
];

const BOSS_MONSTERS = [
  { id: 'b1', name: '災厄黑龍', title: '深淵霸主', element: ELEMENTS.DARK, isEmoji: false, icon: '🐉', image: 'boss_dragon.png', prefHand: 'ROCK', stats: { hp: 800, maxHp: 800, atk: 55, def: 25 }, lore: '盤踞在廢棄古城的巨龍，擁有毀滅性的吐息，被認為是大星晶碎裂的罪魁禍首之一。', skill1: { name: '龍威', cost: 40, desc: '扣除 20 能量並施加 🤐[沉默] 1回合。' }, skill2: { name: '毀滅吐息', cost: 90, desc: '無視護盾造成 150 點傷害。' } },
  { id: 'b2', name: '耀光大天使', title: '天界審判', element: ELEMENTS.LIGHT, isEmoji: false, icon: '👼', image: 'boss_angel.png', prefHand: 'PAPER', stats: { hp: 750, maxHp: 750, atk: 60, def: 20 }, lore: '原本是守護神殿的天使，卻被過度純粹的光之能量逼瘋，對所有入侵者降下無差別的神罰。', skill1: { name: '致盲之光', cost: 40, desc: '施加 💫[眩目] 1回合，並獲得 30 護盾。' }, skill2: { name: '神罰', cost: 90, desc: '造成 130 點直接傷害。' } },
  { id: 'b3', name: '獄炎魔王', title: '焦熱地獄', element: ELEMENTS.FIRE, isEmoji: false, icon: '🌋', image: 'boss_demon.png', prefHand: 'ROCK', stats: { hp: 850, maxHp: 850, atk: 65, def: 15 }, lore: '從火山深處誕生的炎之惡魔，企圖將整個世界化為焦熱地獄。', skill1: { name: '沸騰之血', cost: 40, desc: '提升自身 10 攻擊力，並施加 🔥[燃燒] 2回合。' }, skill2: { name: '天地灰燼', cost: 100, desc: '造成 180 點毀滅性傷害。' } },
  { id: 'b4', name: '森之巨神', title: '萬古腐化', element: ELEMENTS.WOOD, isEmoji: false, icon: '🌳', image: 'boss_tree.png', prefHand: 'PAPER', stats: { hp: 1000, maxHp: 1000, atk: 45, def: 35 }, lore: '被腐化力量侵蝕的遠古樹神，其寄生藤蔓能瞬間吸乾整座森林的生命力。', skill1: { name: '寄生藤蔓', cost: 40, desc: '造成 30 傷害並施加 🌿[寄生] 3回合。' }, skill2: { name: '萬物歸一', cost: 80, desc: '瞬間回復 200 點生命值。' } },
  { id: 'b5', name: '冰霜巨龍', title: '絕對零度', element: ELEMENTS.WATER, isEmoji: false, icon: '❄️', image: 'boss_icedragon.png', prefHand: 'SCISSORS', stats: { hp: 700, maxHp: 700, atk: 50, def: 40 }, lore: '沉睡在冰川下的古老存在，其吐息能帶來絕對零度的冰河時代。', skill1: { name: '冰霜裝甲', cost: 40, desc: '獲得高達 80 點的護盾。' }, skill2: { name: '冰河時代', cost: 90, desc: '造成 100 傷害，清空能量並施加 ❄️[封印] 1回合。' } }
];

const ADVANCED_MONSTERS = [
  { id: 'am1', name: '猩紅史萊姆', title: '沸騰的', element: ELEMENTS.FIRE, isEmoji: false, icon: '🩸', image: 'adv_slime.png', prefHand: 'ROCK', stats: { hp: 600, maxHp: 600, atk: 55, def: 20 }, lore: '吸收了過量火屬性星晶的變異體。', skill1: { name: '強酸腐蝕', cost: 40, desc: '造成20傷，施加防禦下降與易傷(3回)。' }, skill2: { name: '自爆', cost: 90, desc: '造成120點無視護盾的真實傷害。' }, isUncapturable: true },
  { id: 'am2', name: '極光護衛蟹', title: '堅不可摧', element: ELEMENTS.LIGHT, isEmoji: false, icon: '🛡️', image: 'adv_crab.png', prefHand: 'PAPER', stats: { hp: 800, maxHp: 800, atk: 40, def: 50 }, lore: '外殼已經完全星晶化的變異蟹。', skill1: { name: '星晶裝甲', cost: 30, desc: '獲得100點護盾。' }, skill2: { name: '極光制裁', cost: 80, desc: '造成80傷並施加眩目(1回)。' }, isUncapturable: true },
  { id: 'am3', name: '深淵監視者', title: '凝視者', element: ELEMENTS.DARK, isEmoji: false, icon: '🧿', image: 'adv_eye.png', prefHand: 'SCISSORS', stats: { hp: 550, maxHp: 550, atk: 80, def: 15 }, lore: '來自更深層的恐懼。', skill1: { name: '精神污染', cost: 40, desc: '施加沉默(2回)與疲憊(3回)。' }, skill2: { name: '湮滅射線', cost: 70, desc: '造成100點高額傷害。' }, isUncapturable: true }
];

const ADVANCED_BOSSES = [
  { id: 'ab1', name: '混沌縫合怪', title: '人造惡意', element: ELEMENTS.WOOD, isEmoji: false, icon: '🧟', image: 'adv_boss_amalgam.png', prefHand: 'ROCK', stats: { hp: 1500, maxHp: 1500, atk: 75, def: 40 }, lore: '不知名法師拼湊出的恐怖怪物。', skill1: { name: '劇毒孢子', cost: 40, desc: '造成40傷並施加寄生與燃燒(3回)。' }, skill2: { name: '大地粉碎', cost: 100, desc: '造成200點傷害，並施加強制(1回)。' }, isUncapturable: true },
  { id: 'ab2', name: '星曜古龍', title: '星晶化身', element: ELEMENTS.LIGHT, isEmoji: false, icon: '🐲', image: 'adv_boss_dragon.png', prefHand: 'PAPER', stats: { hp: 2000, maxHp: 2000, atk: 90, def: 50 }, lore: '完全吞噬了大星晶核心的遠古巨龍，難以名狀的災厄。', skill1: { name: '星辰庇護', cost: 50, desc: '獲得150點護盾與再生(3回)。' }, skill2: { name: '星爆氣流', cost: 120, desc: '無視護盾造成250點真實傷害。' }, isUncapturable: true }
];

const TUTORIAL_ENEMY = {
    id: 'tutorial_dummy', name: '訓練魔傀儡', title: '乖巧的', element: ELEMENTS.WOOD,
    isEmoji: true, emoji: '🪆', icon: '🪆',
    prefHand: 'ROCK',
    stats: { hp: 220, maxHp: 220, atk: 12, def: 5 },
    lore: '由教官以魔法製成的訓練用傀儡，不會造成致命傷害。',
    skill1: { name: '輕拍', cost: 999, desc: '造成 10 點傷害。' },
    skill2: { name: '搖晃', cost: 999, desc: '造成 20 點傷害。' },
    isUncapturable: true
};

const ALL_TALENTS = [
  { id: 't1', name: '活力', cost: 1, desc: '最大生命值 +100', icon: '❤️' },
  { id: 't2', name: '怪力', cost: 1, desc: '攻擊力 +10', icon: '⚔️' },
  { id: 't3', name: '靈光', cost: 1, desc: '戰鬥開始時，初始能量 +25', icon: '⚡' },
  { id: 't4', name: '鐵壁', cost: 2, desc: '戰鬥開始時，獲得 80 點護盾', icon: '🛡️' },
  { id: 't5', name: '鬥氣', cost: 2, desc: '平手時，獲得能量提升為 30，並恢復 15 HP', icon: '🔄' },
  { id: 't6', name: '逆境', cost: 2, desc: '生命值低於 30% 時，攻擊力提升 50%', icon: '🔥' },
  { id: 't7', name: '嗜血', cost: 3, desc: '造成傷害時，回復等同傷害量 20% 的生命', icon: '🦇' },
  { id: 't8', name: '賢者', cost: 3, desc: '所有技能與奧義，耗能減少 20%', icon: '📖' },
  { id: 't_bear', name: '厚實脂肪', cost: 3, desc: '開場隨機獲得 2 種增益狀態(全場持續)。(熊吉專屬)', icon: '🍯', req: 'char_talents', exclusiveTo: 'bear' },
  { id: 't_wolf', name: '極寒護體', cost: 3, desc: '回合結束時，若有護盾則恢復 25 HP。(白澤專屬)', icon: '❄️', req: 'char_talents', exclusiveTo: 'wolf' },
  { id: 't_cat', name: '虐襲', cost: 3, desc: '回合結束時，對手每個負面狀態受 15 傷。(布提婭專屬)', icon: '🐾', req: 'char_talents', exclusiveTo: 'cat' },
  { id: 't_human', name: '助燃劑', cost: 3, desc: '敵人受到的燃燒傷害提升 50%。(普爾斯專屬)', icon: '🛢️', req: 'char_talents', exclusiveTo: 'human' },
  { id: 't_elf', name: '倉鼠性格', cost: 3, desc: '開場直接獲得 2 顆葵花子。(布布專屬)', icon: '🐹', req: 'char_talents', exclusiveTo: 'elf' },
  { id: 't_xiangxiang', name: '柯特的愛心宵夜', cost: 3, desc: 'HP低於50%時每回合回覆 20 HP 並獲 10 盾。(虎吉專屬)', icon: '🍜', req: 'char_talents', exclusiveTo: 'xiangxiang' },
  { id: 't9', name: '銳利', cost: 4, desc: '出剪刀獲勝傷害 x1.5，戰敗受傷減半。開場能量 +20。', icon: '✂️', req: 'cost4' },
  { id: 't10', name: '堅硬', cost: 4, desc: '出石頭獲勝傷害 x1.5，戰敗受傷減半。開場能量 +20。', icon: '🪨', req: 'cost4' },
  { id: 't11', name: '柔和', cost: 4, desc: '出布獲勝傷害 x1.5，戰敗受傷減半。開場能量 +20。', icon: '🧻', req: 'cost4' },
  { id: 't12', name: '神佑', cost: 5, desc: '絕對霸體免疫異常，且受到直接傷害減少 15%', icon: '👼', req: 'cost5' },
  { id: 't13', name: '極限爆發', cost: 5, desc: '所有造成的直接傷害無條件 x1.5 倍', icon: '💥', req: 'cost5' },
  { id: 't_harvest_elf', name: '豐饒之角', cost: 5, desc: '初始+2種子。再生狀態時受傷-15%，每回恢復5能量。(豐收節布布專屬)', icon: '🌽', req: 'cost5', exclusiveTo: 'harvest_elf' },
  { id: 't_blackflame_human', name: '狂化血脈', cost: 5, desc: 'HP低於40%時攻擊力提升30點，且無視目標15點防禦。(黑炎普爾斯專屬)', icon: '🩸', req: 'cost5', exclusiveTo: 'blackflame_human' },
  { id: 't_valentine_wolf', name: '苦甜回憶', cost: 5, desc: '護盾被破壞時，恢復20點能量並獲得攻擊提升3回合。(情人節白澤專屬)', icon: '💝', req: 'cost5', exclusiveTo: 'valentine_wolf' },
  { id: 't_halloween_cat', name: '幻夜貓蹤', cost: 5, desc: '回合結束對手每個Debuff造成15傷。對手有Debuff時減傷20%。(萬聖布提婭專屬)', icon: '🦇', req: 'cost5', exclusiveTo: 'halloween_cat' },
  { id: 't_christmas_xiangxiang', name: '最棒的禮物', cost: 5, desc: '每 3 回合自動恢復 10% 最大生命值並獲得 20 能量。(聖誕虎吉專屬)', icon: '🎄', req: 'cost5', exclusiveTo: 'christmas_xiangxiang' }
];

const REWARD_POOL = [
  { id: 'r1', name: '生命湧動', icon: '❤️', desc: '最大生命值 +150，並回復等量生命。', apply: (p, progRef) => { p.maxHp += 150; p.hp += 150; return p; } },
  { id: 'r2', name: '夜行者貓飯', icon: '🍗', desc: '攻擊力永久 +25。', apply: (p, progRef) => { p.atk += 25; return p; } },
  { id: 'r3', name: '防禦強化', icon: '🛡️', desc: '防禦力永久 +20。', apply: (p, progRef) => { p.def += 20; return p; } },
  { id: 'r4', name: '戰術護盾', icon: '🔰', desc: '每次戰鬥開始時，自動獲得 60 點護盾。', apply: (p, progRef) => { p.permaBuffs = {...p.permaBuffs, startShield: (p.permaBuffs?.startShield || 0) + 60}; return p; } },
  { id: 'r5', name: '能量充沛', icon: '⚡', desc: '每次戰鬥開始時，額外獲得 30 點能量。', apply: (p, progRef) => { p.permaBuffs = {...p.permaBuffs, startEnergy: (p.permaBuffs?.startEnergy || 0) + 30}; return p; } },
  { id: 'r6', name: '星晶餽贈', icon: '💎', desc: '立刻獲得 30 顆星晶。', apply: (p, progRef) => { if(progRef) progRef.crystals += 30; return p; } }
];

const STATUS_DOCS = [
    { name: '攻擊提升/下降', effect: '攻擊力增加/減少 20 點。', icon: '⚔️', color: 'text-orange-400' },
    { name: '防禦提升/下降', effect: '防禦力增加/減少 20 點。', icon: '🛡️', color: 'text-cyan-400' },
    { name: '再生', effect: '每回合結束恢復 20 點 HP。', icon: '💖', color: 'text-pink-400' },
    { name: '燃燒', effect: '每回合結束受到 20 點灼燒傷害。', icon: '🔥', color: 'text-red-500' },
    { name: '寄生', effect: '每回合結束被吸取 15 點生命轉移至對手。', icon: '🌿', color: 'text-green-500' },
    { name: '易傷', effect: '受到的傷害變為 1.2 倍。', icon: '💢', color: 'text-red-300' },
    { name: 'VIP', effect: '受到的最終傷害變為 1.3 倍，且每次受傷額外流失 5 點能量。', icon: '💳', color: 'text-yellow-300' },
    { name: '迴避', effect: '免除下一次受到的直接傷害。', icon: '💨', color: 'text-green-300' },
    { name: '疲憊', effect: '平手時無法獲得能量。', icon: '💤', color: 'text-stone-400' },
    { name: '亢奮', effect: '平手獲取的能量提升 50%。', icon: '⚡', color: 'text-yellow-500' },
    { name: '封印', effect: '下次出拳無法使用特定的手勢。', icon: '❄️', color: 'text-blue-400' },
    { name: '強制', effect: '下次出拳被強制固定為特定手勢。', icon: '💫', color: 'text-yellow-400' },
    { name: '沉默', effect: '無法使用戰技與奧義。', icon: '🤐', color: 'text-purple-400' }
];

// ==========================================
// 礦坑系統設定
// ==========================================
const MINE_LEVELS = [
  { lv: 1, name: '廢棄礦道',   baseRate: 10, capBase: 100, slots: 2, upgradeCost: 50  },
  { lv: 2, name: '開採礦坑',   baseRate: 15, capBase: 80,  slots: 2, upgradeCost: 120 },
  { lv: 3, name: '深層礦脈',   baseRate: 20, capBase: 110, slots: 3, upgradeCost: 250 },
  { lv: 4, name: '精煉礦場',   baseRate: 25, capBase: 140, slots: 3, upgradeCost: 500 },
  { lv: 5, name: '星晶核心',   baseRate: 30, capBase: 200, slots: 4, upgradeCost: null },
];

const MINE_CHAR_BONUS = {
  bear:  { type: 'rate',     value: 0.25, desc: '碎片產出 +25%（賣力挖礦）' },
  wolf:  { type: 'cooldown', value: 0.15, desc: '累積速度 +15%（效率型）' },
  cat:   { type: 'bonus',    value: 0.10, desc: '10% 機率額外獲得 50% 碎片（竊取）' },
  human: { type: 'cap',      value: 0.20, desc: '碎片上限 +20%（爆發型）' },
  elf:   { type: 'combo',    rate: 0.15, cap: 0.10, desc: '碎片產出 +15% 且上限 +10%（複合型）' },
};

// ==========================================
// 烹飪系統設定
// ==========================================
const INGREDIENTS = [
  { id: 'egg',  name: '星紋鳥蛋', icon: '🥚', cost: 10 },
  { id: 'meat', name: '野獸魔肉', icon: '🥩', cost: 10 },
  { id: 'fish', name: '銀流溪魚', icon: '🐟', cost: 10 },
  { id: 'mush', name: '夜光孢菇', icon: '🍄', cost: 10 },
  { id: 'herb', name: '翠葉靈草', icon: '🌿', cost: 10 },
  { id: 'water',name: '元素靈水', icon: '💧', cost: 10 },
];

const RECIPES = [
  {
    id: 'grilled_fish', name: '銀流鮮握', grade: '普通', icon: '🍣', cost: 15,
    ingredients: { fish: 2 },
    buff: { type: 'hp', value: 100, desc: '戰鬥開始時 HP +100' },
    favoredBy: ['bear', 'cat'],
  },
  {
    id: 'roast_meat', name: '烈焰炙肉', grade: '普通', icon: '🍖', cost: 15,
    ingredients: { meat: 2 },
    buff: { type: 'shield', value: 80, desc: '戰鬥開始時護盾 +80' },
    favoredBy: ['wolf'],
  },
  {
    id: 'egg_stir', name: '星蛋嫩炒', grade: '普通', icon: '🍳', cost: 15,
    ingredients: { egg: 2 },
    buff: { type: 'energy', value: 30, desc: '戰鬥開始時能量 +30' },
    favoredBy: ['human'],
  },
  {
    id: 'herb_salad', name: '靈草沙拉', grade: '普通', icon: '🥗', cost: 15,
    ingredients: { herb: 2 },
    buff: { type: 'regen', value: 10, desc: '戰鬥中每回合再生 +10' },
    favoredBy: ['elf'],
  },
  {
    id: 'mush_fish_soup', name: '孢菇燉魚湯', grade: '精良', icon: '🍲', cost: 30,
    ingredients: { fish: 1, mush: 1, water: 1 },
    buff: { type: 'hp_energy', hp: 80, energy: 20, desc: '戰鬥開始時 HP +80 且能量 +20' },
    favoredBy: ['bear', 'cat', 'elf'],
  },
  {
    id: 'meat_egg_roll', name: '魔肉蛋捲', grade: '精良', icon: '🌯', cost: 30,
    ingredients: { meat: 1, egg: 1 },
    buff: { type: 'atk_shield', atk: 15, shield: 50, desc: '戰鬥開始時攻擊 +15 且護盾 +50' },
    favoredBy: ['wolf', 'human'],
  },
  {
    id: 'veggie_mush_stew', name: '晨菇靈燉湯', grade: '絕品', icon: '🥣', cost: 80,
    ingredients: { veggie: 1, rare_mush: 1 },
    buff: { type: 'hp_regen', hp: 200, regen: 15, desc: '戰鬥開始時 HP +200 且每回合再生 +15' },
    favoredBy: ['bear', 'elf', 'cat'],
  },
  {
    id: 'deep_fish_sashimi', name: '深淵幻魚刺身', grade: '絕品', icon: '🍱', cost: 80,
    ingredients: { rare_fish: 2 },
    buff: { type: 'hp_energy', hp: 150, energy: 60, desc: '戰鬥開始時 HP +150 且能量 +60' },
    favoredBy: ['cat', 'human', 'wolf'],
  },
  {
    id: 'beast_supreme_roast', name: '魔獸至尊燒', grade: '絕品', icon: '🍢', cost: 80,
    ingredients: { prime_meat: 1, golden_egg: 1 },
    buff: { type: 'atk_shield', atk: 30, shield: 150, desc: '戰鬥開始時攻擊 +30 且護盾 +150' },
    favoredBy: ['wolf', 'bear', 'human'],
  },
];

const COOKING_PREF_BONUS = 1.2; // 偏好料理效果 +20%

// 悠活莊園高級食材（僅可從莊園小遊戲取得，不在商店販售）
const GARDEN_INGREDIENTS = [
  { id: 'veggie',     name: '晨露嫩蔬', icon: '🥬', source: '種植園' },
  { id: 'rare_mush',  name: '星晶靈菇', icon: '🍄', source: '種植園' },
  { id: 'rare_fish',  name: '深淵幻魚', icon: '🐡', source: '釣魚池' },
  { id: 'prime_meat', name: '魔獸精肉', icon: '🍗', source: '魔物狩獵' },
  { id: 'golden_egg', name: '金晶巨卵', icon: '🪺', source: '魔物狩獵' },
];
const ALL_INGREDIENTS = [...INGREDIENTS, ...GARDEN_INGREDIENTS];

// ==========================================
// 每日任務系統
// ==========================================
const DAILY_QUEST_POOL = {
  easy: [
    { id: 'dq_login',        name: '每日登入',           desc: '每天登入遊戲',                    target: 1, reward: { fragments: 20 }, rewardDesc: '💠 碎片 ×20', trigger: 'login'        },
    { id: 'dq_battle_any',   name: '踏上征途',           desc: '進行任意 1 場戰鬥（不限勝負）',    target: 1, reward: { fragments: 30 }, rewardDesc: '💠 碎片 ×30', trigger: 'battle_any'   },
    { id: 'dq_visit_garden', name: '莊園探訪',           desc: '訪問悠活莊園',                    target: 1, reward: { crystals: 10  }, rewardDesc: '💎 星晶 ×10',  trigger: 'visit_garden' },
    { id: 'dq_shop_work',    name: '勤勞工人',           desc: '在商店打工或製作任意道具 1 次',    target: 1, reward: { ap: 1          }, rewardDesc: '⚡ AP ×1',     trigger: 'shop_work'    },
  ],
  medium: [
    { id: 'dq_win_3',        name: '連戰連勝',           desc: '贏得 3 場戰鬥',                   target: 3, reward: { crystals: 30  }, rewardDesc: '💎 星晶 ×30',  trigger: 'battle_win'   },
    { id: 'dq_cook',         name: '篝火廚師',           desc: '在白晝營地完成 1 道料理',          target: 1, reward: { fragments: 50 }, rewardDesc: '💠 碎片 ×50',  trigger: 'cook'         },
    { id: 'dq_mine_collect', name: '礦脈採集',           desc: '在星晶礦坑收集碎片 1 次',          target: 1, reward: { crystals: 20  }, rewardDesc: '💎 星晶 ×20',  trigger: 'mine_collect' },
    { id: 'dq_garden_game',  name: '莊園玩家',           desc: '完成悠活莊園任意小遊戲 1 次',      target: 1, reward: { fragments: 40 }, rewardDesc: '💠 碎片 ×40',  trigger: 'garden_game'  },
  ],
  hard: [
    { id: 'dq_campaign',     name: '戰役征服者',         desc: '完成 1 場夜巡戰役（全3場通關）',   target: 1, reward: { crystals: 100 }, rewardDesc: '💎 星晶 ×100', trigger: 'campaign_clear'},
    { id: 'dq_gacha',        name: '酒館常客',           desc: '在迷途酒館進行 1 次招募',          target: 1, reward: { fragments: 60 }, rewardDesc: '💠 碎片 ×60',  trigger: 'gacha_pull'   },
    { id: 'dq_forge',        name: '鍛造師傅',           desc: '使用鍛造工坊製作任意武裝 1 次',    target: 1, reward: { crystals: 50  }, rewardDesc: '💎 星晶 ×50',  trigger: 'forge'        },
  ],
};
const DAILY_QUEST_FULL_CLEAR = { reward: { crystals: 50 }, rewardDesc: '💎 星晶 ×50' };
const ALL_DAILY_QUESTS = [...DAILY_QUEST_POOL.easy, ...DAILY_QUEST_POOL.medium, ...DAILY_QUEST_POOL.hard];

const ENCOUNTER_EVENTS = [
  {
    id: 'enc_001',
    title: '舊友的身影',
    subtitle: '白澤 × 墨影',
    themeGrad: 'from-slate-950 via-stone-950 to-stone-950',
    themeColor: 'text-slate-300',
    themeBorder: 'border-slate-600',
    icon: '🍶',
    desc: '夜深酒靜，一個熟悉的背影出現在迷途酒館的角落……',
    dialogue: [
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'left',  text: '……（環顧酒館）今晚客人還真多。' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'left',  text: '（角落那個背影——不，不可能。在這種地方？）' },
      { speaker: '墨影', icon: '🌑',    image: 'avatar_moying.png', side: 'right', text: '哈。真是稀奇，在這種地方碰見你，白澤。' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'left',  text: '……墨影前輩。你在艾歐蘭斯做什麼？' },
      { speaker: '墨影', icon: '🌑',    image: 'avatar_moying.png', side: 'right', text: '還不是跟你一樣？四處漂泊，碰巧路過了。' },
      { speaker: '墨影', icon: '🌑',    image: 'avatar_moying.png', side: 'right', text: '坐吧。難得遇見老鄉，今晚喝一杯。' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'left',  text: '……（沉默片刻，拉開了椅子）' },
      { speaker: '酒保', icon: '🐰',    image: null,               side: 'right', text: '兩位，今晚的特調——「孤星夜行」，請慢用。' },
      { speaker: '墨影', icon: '🌑',    image: 'avatar_moying.png', side: 'right', text: '好名字。（舉起酒杯）——為了故鄉的那片雪。' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'left',  text: '……（輕輕碰杯）——為了還沒走完的路。' },
      { speaker: '墨影', icon: '🌑',    image: 'avatar_moying.png', side: 'right', text: '聽說你現在在夜行者工會做事？不太像你的作風。' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'left',  text: '有件事得查清楚。' },
      { speaker: '墨影', icon: '🌑',    image: 'avatar_moying.png', side: 'right', text: '……跟星晶有關？（眼神銳利了一瞬）' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'left',  text: '前輩，你知道些什麼？' },
      { speaker: '墨影', icon: '🌑',    image: 'avatar_moying.png', side: 'right', text: '（放下酒杯，低笑）我只是個過路人。不過，有緣的話……也許能幫上你。' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'left',  text: '……你變了，前輩。' },
      { speaker: '墨影', icon: '🌑',    image: 'avatar_moying.png', side: 'right', text: '是嗎。（轉頭看向窗外夜空）——好好喝吧，今晚只是喝酒。' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'left',  text: '（沉默，再次舉杯）……也許。' },
    ],
  },
  { id: 'enc_002', title: '即將揭曉', subtitle: '', icon: '🔒', desc: '新的故事正在醞釀中……', locked: true, dialogue: [] },
  { id: 'enc_003', title: '即將揭曉', subtitle: '', icon: '🔒', desc: '新的故事正在醞釀中……', locked: true, dialogue: [] },
  { id: 'enc_004', title: '即將揭曉', subtitle: '', icon: '🔒', desc: '新的故事正在醞釀中……', locked: true, dialogue: [] },
  { id: 'enc_005', title: '即將揭曉', subtitle: '', icon: '🔒', desc: '新的故事正在醞釀中……', locked: true, dialogue: [] },
  { id: 'enc_006', title: '即將揭曉', subtitle: '', icon: '🔒', desc: '新的故事正在醞釀中……', locked: true, dialogue: [] },
];

const getDailyQuestIds = (dateStr) => {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) seed = (seed * 31 + dateStr.charCodeAt(i)) >>> 0;
  const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const seededShuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const easy   = seededShuffle(DAILY_QUEST_POOL.easy.map(q => q.id));
  const medium = seededShuffle(DAILY_QUEST_POOL.medium.map(q => q.id));
  const hard   = seededShuffle(DAILY_QUEST_POOL.hard.map(q => q.id));
  let selEasy = easy.slice(0, 2);
  let selMedium = medium.slice(0, 2);
  // 防止 battle_any 與 win_3 同時出現
  if (selEasy.includes('dq_battle_any') && selMedium.includes('dq_win_3')) {
    const alt = medium.find(id => id !== 'dq_win_3' && !selMedium.includes(id));
    if (alt) selMedium = selMedium.map(id => id === 'dq_win_3' ? alt : id);
  }
  return [...selEasy, ...selMedium, hard[0]];
};

const GUIDE_TERMS = [
    { term: '星晶 (Star Crystal)', desc: '核心貨幣，可在星晶商店購買天賦、特殊型態，或透過公會打工與成就獎勵取得。' },
    { term: 'AP (行動點數)', desc: '戰鬥勝利後獲得，用於日晝營地提升角色羈絆，也可在商店「打工專區」製作戰鬥道具。' },
    { term: '專精等級', desc: '角色在戰役通關時累積，最高 3 星，滿 3 星可解鎖該角色的專屬 CG。' },
    { term: '友誼之巔', desc: '任意雙人羈絆達滿級（20 點）時，解鎖的特殊雙人回憶 CG。' },
    { term: '平手能量', desc: '出拳平手時，雙方各獲得 20 點能量。裝備「鬥氣」天賦可提升至 30 點，並額外回復 15 HP。擁有「疲憊」狀態時平手能量歸零；擁有「亢奮」狀態時能量提升 50%。' },
    { term: '護盾', desc: '受到傷害時，護盾值優先被消耗，歸零後才扣除生命值。部分天賦（鐵壁）與料理可提供初始護盾。' },
    { term: '天賦配置', desc: '選角後進入天賦配置畫面，可裝備 3 個天賦（T0 角色 5 個，Boss/魔物角色 4 個）。效果持續整場戰鬥，視模式不同可攜帶入下一場。' },
    { term: '長按頭像', desc: '長按戰鬥畫面中的敵方或我方頭像，可查看詳細能力、技能說明，以及敵方出拳偏好——是預判對手行動的關鍵情報。' },
    { term: '戰技 / 奧義', desc: '能量達門檻時亮起，可主動發動。戰技耗能較低、效果穩定；奧義耗能較高、威力強大。「賢者」天賦可減少 20% 耗能。處於「沉默」狀態時無法發動。' },
];

const GUIDE_SYSTEMS = [
    { icon: '🍳', name: '料理系統', desc: '在日晝營地的料理台，以食材烹飪各種料理。效果（HP 上限、攻擊力、護盾、初始能量、每回合再生）於下一場戰鬥開始時生效，且在整個戰役／主線章節的所有戰鬥中持續有效。使用符合角色偏好的食材，效果可額外提升 20%。' },
    { icon: '🎒', name: '戰鬥道具', desc: '在星晶商店「打工專區」消耗 AP 製作道具後可攜入戰場。每場戰鬥最多使用 3 次，隨時可用。可用道具：✨ 星晶砂粉（回復 100 HP）、🧪 亢奮藥劑（亢奮 3 回合）、💨 煙霧彈（迴避 1 次）、💊 萬能解藥（清除所有負面狀態）。' },
    { icon: '📖', name: '主線夜巡', desc: '依章節推進劇情，每章可自由選擇出陣角色並配置天賦（非強制使用推薦角色）。料理加成於章節所有戰鬥中持續有效。完成每章可解鎖對應成就並獲得食材獎勵。' },
    { icon: '💼', name: '公會打工 / 打工專區', desc: '在星晶商店的「打工專區」分頁，可消耗 1 AP 完成公會打工（獲得 50 星晶），或消耗 AP 製作戰鬥道具備用。AP 來源為戰鬥勝利獎勵。' },
];

// 【V2.6 成就系統定義】
const ACHIEVEMENTS = [
    { id: 'a_win_10', name: '初級夜行者', desc: '戰鬥勝利 10 場', target: 10, reward: 100, getProgress: (p) => p.battlesWon || 0 },
    { id: 'a_win_50', name: '傳說夜行者', desc: '戰鬥勝利 50 場', target: 50, reward: 300, getProgress: (p) => p.battlesWon || 0 },
    { id: 'a_cap_5', name: '訓獸見習生', desc: '成功收服 5 種魔物', target: 5, reward: 150, getProgress: (p) => (p.captured || []).length },
    { id: 'a_cap_all', name: '生態觀察家', desc: '收服所有一般與Boss魔物 (共10種)', target: 10, reward: 500, getProgress: (p) => (p.captured || []).length },
    { id: 'a_pull_10', name: '小試身手', desc: '在迷途酒館進行 10 次招募', target: 10, reward: 150, getProgress: (p) => p.gachaPulls || 0 },
    { id: 'a_pull_50', name: '資本的力量', desc: '在迷途酒館進行 50 次招募', target: 50, reward: 500, getProgress: (p) => p.gachaPulls || 0 },
    { id: 'a_mastery_1', name: '專精之路', desc: '將 1 名角色的專精提升至 3 星', target: 1, reward: 200, getProgress: (p) => Object.values(p.mastery || {}).filter(v => v >= 3).length },
    { id: 'a_mastery_all', name: '全職業制霸', desc: '將 5 名角色的專精提升至 3 星', target: 5, reward: 1000, getProgress: (p) => Object.values(p.mastery || {}).filter(v => v >= 3).length },
    { id: 'a_aff_1', name: '最好的朋友', desc: '解鎖 1 張雙人羈絆滿級CG', target: 1, reward: 200, getProgress: (p) => Object.values(p.affection || {}).filter(v => v >= 20).length },
    { id: 'a_aff_3', name: '最棒的摯友', desc: '解鎖 3 張雙人羈絆滿級CG', target: 3, reward: 600, getProgress: (p) => Object.values(p.affection || {}).filter(v => v >= 20).length },
    { id: 'a_story_1', name: '翡翠森之獵手', desc: '完成主線夜巡第一章「翡翠森之徑」', target: 1, reward: 0, rewardIngredients: { herb: 3 }, rewardDesc: '🌿 翠葉靈草 ×3', getProgress: (p) => (p.completedStoryChapters||[]).includes(1) ? 1 : 0 },
    { id: 'a_story_2', name: '冰封湖的訪客', desc: '完成主線夜巡第二章「冰封星晶湖」', target: 1, reward: 0, rewardIngredients: { fish: 3 }, rewardDesc: '🐟 銀流溪魚 ×3', getProgress: (p) => (p.completedStoryChapters||[]).includes(2) ? 1 : 0 },
    { id: 'a_story_3', name: '煉獄山的試煉者', desc: '完成主線夜巡第三章「焦熱煉獄山」', target: 1, reward: 0, rewardIngredients: { meat: 3 }, rewardDesc: '🥩 野獸魔肉 ×3', getProgress: (p) => (p.completedStoryChapters||[]).includes(3) ? 1 : 0 },
    { id: 'a_story_4', name: '神殿遺忘的光', desc: '完成主線夜巡第四章「曦光遺忘神殿」', target: 1, reward: 0, rewardIngredients: { egg: 3 }, rewardDesc: '🥚 星紋鳥蛋 ×3', getProgress: (p) => (p.completedStoryChapters||[]).includes(4) ? 1 : 0 },
    { id: 'a_story_5', name: '深淵裂隙封鎖者', desc: '完成主線夜巡第五章「深淵星晶裂隙」', target: 1, reward: 0, rewardIngredients: { mush: 3, water: 3 }, rewardDesc: '🍄 夜光孢菇 ×3 + 💧 元素靈水 ×3', getProgress: (p) => (p.completedStoryChapters||[]).includes(5) ? 1 : 0 },
];

// ==========================================
// 3. 遊戲機制輔助函數
// ==========================================
const isBasicChar = (c) => ['bear', 'wolf', 'cat', 'human', 'elf'].includes(c?.id);
const isT0Char = (c) => ['xiangxiang', 'kohaku', 'aldous', 'christmas_xiangxiang'].includes(c?.id);
const isMonsterChar = (c) => NORMAL_MONSTERS.some(m => m.id === c?.id) || BOSS_MONSTERS.some(b => b.id === c?.id) || ADVANCED_MONSTERS.some(m => m.id === c?.id) || ADVANCED_BOSSES.some(b => b.id === c?.id);
const isVariantChar = (c) => VARIANTS.some(v => v.id === c?.id);
const isFullGallery = (capturedArr) => (capturedArr || []).length >= (NORMAL_MONSTERS.length + BOSS_MONSTERS.length);
const getActualCost = (cost, hasT8) => hasT8 ? Math.max(0, Math.ceil(cost * 0.8)) : cost;

const getBaseTalents = (char) => {
    if (!char) return 3;
    if (isT0Char(char)) return 5;
    if (BOSS_MONSTERS.some(b => b.id === char.id) || ADVANCED_BOSSES.some(b => b.id === char.id)) return 4;
    if (NORMAL_MONSTERS.some(m => m.id === char.id) || ADVANCED_MONSTERS.some(m => m.id === char.id)) return 4;
    return 3;
};

const getStatusName = (type) => {
    const map = { 'BURN': '燃燒', 'PARASITE': '寄生', 'FREEZE': '封印', 'DAZZLE': '強制', 'SILENCE': '沉默', 'ATK_UP': '攻擊提升', 'DEF_UP': '防禦提升', 'REGEN': '再生', 'ATK_DOWN': '攻擊下降', 'DEF_DOWN': '防禦下降', 'VULNERABLE': '易傷', 'EVADE': '迴避', 'FATIGUE': '疲憊', 'EXCITE': '亢奮', 'VIP': 'VIP' };
    return map[type] || type;
};
const getStatusIcon = (type) => {
    const map = { 'VULNERABLE': '💢', 'EVADE': '💨', 'FATIGUE': '💤', 'EXCITE': '⚡', 'BURN': '🔥', 'PARASITE': '🌿', 'FREEZE': '❄️', 'DAZZLE': '💫', 'SILENCE': '🤐', 'ATK_UP': '⚔️', 'DEF_UP': '🛡️', 'REGEN': '💖', 'ATK_DOWN': '📉', 'DEF_DOWN': '📉', 'VIP': '💳' };
    return map[type] || '✨';
};

const checkChristmasUnlock = (unlocksArray) => {
    const req = ['newyear_bear', 'harvest_elf', 'blackflame_human', 'valentine_wolf', 'halloween_cat'];
    return req.every(id => unlocksArray.includes(id)) && !unlocksArray.includes('christmas_xiangxiang');
};

// ==========================================
// 4. React 介面組件
// ==========================================
const SpriteAvatar = ({ char, size='w-16 h-16', grayscale=false }) => {
    const [imgError, setImgError] = useState(false);
    if (!char) return null;
    const showFallback = char.isEmoji || imgError;
    return (
        <div className={`${size} rounded-full border-2 border-stone-600 bg-stone-800 flex items-center justify-center overflow-hidden shrink-0 relative`}>
            {showFallback ? (
                <span className={`text-3xl ${grayscale ? 'grayscale opacity-30' : ''}`}>{char.emoji || char.icon || '?'}</span>
            ) : (
                <img src={char.image} className={`w-full h-full object-cover ${grayscale ? 'grayscale opacity-30' : ''}`} alt={char.name} onError={() => setImgError(true)} />
            )}
        </div>
    );
};
const DialogueAvatar = ({ src, fallback }) => {
    const [err, setErr] = useState(false);
    if (err) return <span className="text-3xl">{fallback}</span>;
    return <img src={src} alt="" className="w-full h-full object-cover" onError={() => setErr(true)} />;
};

const NpcDialogue = ({ npcName, npcImage, npcImageFallback, dialogues }) => {
    const [idx, setIdx] = useState(0);
    const [npcImgError, setNpcImgError] = useState(false);

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
                    {npcImage && !npcImgError ? (
                        <img src={npcImage} alt={npcName} className="w-full h-full object-cover" onError={() => setNpcImgError(true)} />
                    ) : (
                        <span className="text-5xl">{npcImageFallback}</span>
                    )}
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

const STORY_CHAPTERS = [
  {
    id: 1, name: '翡翠森之徑', elementIcon: '🌿', element: ELEMENTS.WOOD,
    themeGrad: 'from-green-950 via-stone-950 to-stone-950', themeColor: 'text-green-400', themeBorder: 'border-green-700',
    charOptions: ['human', 'bear'], recommendedCharId: 'human',
    attackerCharId: 'human',
    unlockLabel: '角色解鎖', unlockName: '🐻 熊吉', unlockDesc: '守護翡翠森林的熊族戰士，從此踏上夜行者旅途。',
    enemyIds: ['m1', 'm6', 'b4'],
    dialogue: [
      { speaker: '普爾斯', charId: 'human', image: 'avatar_human.png', side: 'left', text: '星晶調查報告，第七頁。翡翠森林的異變比預期嚴重得多……' },
      { speaker: '普爾斯', charId: 'human', image: 'avatar_human.png', side: 'left', text: '魔物數量暴增，植被開始結晶化。能量的根源，就藏在森林深處。' },
      { speaker: '熊吉', charId: 'bear', image: 'avatar_bear.png', side: 'right', text: '站住！這裡不是你能進來的地方，人類！' },
      { speaker: '普爾斯', charId: 'human', image: 'avatar_human.png', side: 'left', text: '我沒有惡意。我是夜行者工會的調查員，普爾斯。你是這片森林的守護者？' },
      { speaker: '熊吉', charId: 'bear', image: 'avatar_bear.png', side: 'right', text: '……哼。守護者？現在哪算什麼守護。神木快枯死了，我連那些魔物都趕不走。' },
      { speaker: '普爾斯', charId: 'human', image: 'avatar_human.png', side: 'left', text: '那就讓我們合力解決。不過首先——讓我確認你的實力。' },
      { speaker: '熊吉', charId: 'bear', image: 'avatar_bear.png', side: 'right', text: '你想幹什麼！？' },
      { speaker: '普爾斯', charId: 'human', image: 'avatar_human.png', side: 'left', text: '放心，這是夜行者工會的例行測試。準備好了嗎？' },
    ],
  },
  {
    id: 2, name: '冰封星晶湖', elementIcon: '❄️', element: ELEMENTS.WATER,
    themeGrad: 'from-blue-950 via-stone-950 to-stone-950', themeColor: 'text-blue-400', themeBorder: 'border-blue-700',
    charOptions: ['human', 'bear', 'wolf'], recommendedCharId: 'bear',
    attackerCharId: 'bear',
    unlockLabel: '角色解鎖', unlockName: '🐺 白澤', unlockDesc: '來自極寒之地的孤狼劍客，冷漠外表下藏著羈絆。',
    enemyIds: ['m2', 'm7', 'b5'],
    dialogue: [
      { speaker: '熊吉', charId: 'bear', image: 'avatar_bear.png', side: 'left', text: '呼……終於到了。這就是傳說中永不結凍的星晶湖？' },
      { speaker: '熊吉', charId: 'bear', image: 'avatar_bear.png', side: 'left', text: '全結冰了……而且這種冰的味道不對，帶著濃烈的星晶氣息。' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'right', text: '……' },
      { speaker: '熊吉', charId: 'bear', image: 'avatar_bear.png', side: 'left', text: '欸？那邊有人！喂——你沒事吧！' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'right', text: '走開。' },
      { speaker: '熊吉', charId: 'bear', image: 'avatar_bear.png', side: 'left', text: '冰這麼厚，你一個人能解決嗎？需要幫手嗎？' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'right', text: '……不需要。' },
      { speaker: '熊吉', charId: 'bear', image: 'avatar_bear.png', side: 'left', text: '看你說話的樣子就知道需要！走，一起解決！但先讓我確認你的實力！' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'right', text: '……真是煩人的傢伙。' },
    ],
  },
  {
    id: 3, name: '焦熱煉獄山', elementIcon: '🔥', element: ELEMENTS.FIRE,
    themeGrad: 'from-red-950 via-stone-950 to-stone-950', themeColor: 'text-red-400', themeBorder: 'border-red-700',
    charOptions: ['human', 'bear', 'wolf'], recommendedCharId: 'wolf',
    attackerCharId: 'wolf',
    unlockLabel: '角色解鎖', unlockName: '🐈‍⬛ 布提婭', unlockDesc: '吞下暗星晶的夜靈貓，傲嬌地決定暫時同行。',
    enemyIds: ['m3', 'm8', 'b3'],
    dialogue: [
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'left', text: '焦熱煉獄山……果然名不虛傳。連空氣都在燃燒。' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'left', text: '能量通道就在山頂，必須在岩漿蔓延前封鎖。' },
      { speaker: '布提婭', charId: 'cat', image: 'avatar_cat.png', side: 'right', text: '喵嗚～這裡好熱，本大爺不喜歡。' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'left', text: '……貓？這種地方怎麼會有貓。' },
      { speaker: '布提婭', charId: 'cat', image: 'avatar_cat.png', side: 'right', text: '你才是貓！本大爺是夜靈貓，布提婭！這裡有重要的東西，來取回的。' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'left', text: '你一個人對付那些魔物？' },
      { speaker: '布提婭', charId: 'cat', image: 'avatar_cat.png', side: 'right', text: '哼，本大爺當然沒問題！你才需要擔心自己！' },
      { speaker: '白澤', charId: 'wolf', image: 'avatar_wolf.png', side: 'left', text: '這樣吧，先比試一下。輸的人聽另一個人的指揮。' },
      { speaker: '布提婭', charId: 'cat', image: 'avatar_cat.png', side: 'right', text: '有趣！來吧！' },
    ],
  },
  {
    id: 4, name: '曦光遺忘神殿', elementIcon: '✨', element: ELEMENTS.LIGHT,
    themeGrad: 'from-yellow-950 via-stone-950 to-stone-950', themeColor: 'text-yellow-400', themeBorder: 'border-yellow-700',
    charOptions: ['human', 'bear', 'wolf', 'cat'], recommendedCharId: 'cat',
    attackerCharId: 'cat',
    unlockLabel: '角色解鎖', unlockName: '🧚 布布', unlockDesc: '光之精靈重拾記憶，以嚮導之姿引領眾人前往終焉。',
    enemyIds: ['m4', 'm9', 'b2'],
    dialogue: [
      { speaker: '布提婭', charId: 'cat', image: 'avatar_cat.png', side: 'left', text: '喵嗚……好多光，刺眼。這就是曦光遺忘神殿？' },
      { speaker: '布提婭', charId: 'cat', image: 'avatar_cat.png', side: 'left', text: '裡面的魔物都是光屬性……對本大爺的暗魔法有點棘手呢。' },
      { speaker: '布布', charId: 'elf', image: 'avatar_elf.png', side: 'right', text: '……救……救我……' },
      { speaker: '布提婭', charId: 'cat', image: 'avatar_cat.png', side: 'left', text: '哎？誰在說話？出來！' },
      { speaker: '布布', charId: 'elf', image: 'avatar_elf.png', side: 'right', text: '嗚，我被困在這裡了，走不出去……我叫布布，是光之精靈，我、我忘了很多事……' },
      { speaker: '布提婭', charId: 'cat', image: 'avatar_cat.png', side: 'left', text: '失憶的精靈？在神殿深處被困著……這種事說出去誰信啊。' },
      { speaker: '布提婭', charId: 'cat', image: 'avatar_cat.png', side: 'left', text: '……算了，本大爺今天心情好，就救你一次。但先要確認你不是陷阱。' },
      { speaker: '布布', charId: 'elf', image: 'avatar_elf.png', side: 'right', text: '咦？等、等等！我沒有在騙你！……雖然我確實不太記得怎麼戰鬥了……' },
    ],
  },
  {
    id: 5, name: '深淵星晶裂隙', elementIcon: '🌑', element: ELEMENTS.DARK,
    themeGrad: 'from-purple-950 via-stone-950 to-stone-950', themeColor: 'text-purple-400', themeBorder: 'border-purple-700',
    charOptions: ['human', 'bear', 'wolf', 'cat', 'elf'], recommendedCharId: 'elf',
    attackerCharId: 'elf',
    unlockLabel: '解鎖遊戲模式', unlockName: '⚔️ 夜巡戰役 & 自訂對決', unlockDesc: '深淵裂隙封鎖。星晶異變的真相，在更遠的旅途等待著你們。',
    enemyIds: ['m5', 'm10', 'b1'],
    dialogue: [
      { speaker: '布布', charId: 'elf', image: 'avatar_elf.png', side: 'left', text: '……這裡就是大星晶碎裂的地方嗎？' },
      { speaker: '布布', charId: 'elf', image: 'avatar_elf.png', side: 'left', text: '黑暗能量好強……但我不害怕了。大家都在背後支持我。' },
      { speaker: '布布', charId: 'elf', image: 'avatar_elf.png', side: 'left', text: '普爾斯說過：「直視恐懼，才能超越它。」……熊吉說：「蜂蜜最好吃！」' },
      { speaker: '布布', charId: 'elf', image: 'avatar_elf.png', side: 'left', text: '……熊吉那個不算。不管了，往前衝！' },
      { speaker: '???', charId: null, image: null, side: 'right', text: '……很久沒有人類踏入這裡了。你就是那些夜行者？' },
      { speaker: '布布', charId: 'elf', image: 'avatar_elf.png', side: 'left', text: '是的！我是布布，光之精靈！我要封鎖這道裂隙！' },
      { speaker: '???', charId: null, image: null, side: 'right', text: '有趣。那就先通過我這關吧……' },
    ],
  },
];

const BATTLE_ITEMS = [
  { id: 'stardust',      icon: '✨', name: '星晶砂粉', effect: '恢復 100 HP' },
  { id: 'excite_potion', icon: '🧪', name: '亢奮藥劑', effect: '獲得 ⚡[亢奮] 3回合' },
  { id: 'smoke_bomb',    icon: '💨', name: '煙霧彈',   effect: '獲得 💨[迴避] 1次' },
  { id: 'antidote',      icon: '💊', name: '萬能解藥', effect: '清除所有負面狀態' },
];

const FORGE_PERMANENT = [
  { id: 'armor_burst',     name: '爆裂星晶', icon: '💠', cost: 80,  desc: '出拳獲勝時，額外造成 30 點真實傷害。' },
  { id: 'armor_corrosion', name: '腐蝕刃',   icon: '🗡️', cost: 120, desc: '出拳獲勝時，對敵隨機施加降攻或降防 2 回合。' },
  { id: 'armor_chaos',     name: '干擾符文', icon: '🌀', cost: 150, desc: '每回合結束有 30% 機率對敵施加隨機負面狀態。' },
  { id: 'armor_overload',  name: '超載電容', icon: '⚡', cost: 180, desc: '戰鬥開始時，對敵施加疲憊 3 回合。' },
];
const FORGE_CONSUMABLE = [
  { id: 'carm_pierce', name: '破甲符',   icon: '💢', cost: 20, desc: '出拳獲勝時，對敵施加易傷 1 回合。(消耗品)' },
  { id: 'carm_dark',   name: '暗晶碎塊', icon: '🌑', cost: 25, desc: '戰鬥開始時，對敵施加封印 2 回合。(消耗品)' },
];
const ALL_ARMORS = [...FORGE_PERMANENT, ...FORGE_CONSUMABLE];

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
  const longPressTimerRef = useRef(null);
  const longPressDetectedRef = useRef(false);
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
  const [sysInfo, setSysInfo] = useState(null);
  const [battleInspect, setBattleInspect] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetStep, setResetStep] = useState(0);
  const [resetInput, setResetInput] = useState('');
  const [tutorialStep, setTutorialStep] = useState(0);
  const [toast, setToast] = useState(null);
  const [gachaResult, setGachaResult] = useState(null);
  const [battleItemUses, setBattleItemUses] = useState(3);
  const [showItemPanel, setShowItemPanel] = useState(false);
  const [shopTab, setShopTab] = useState('crystal');
  const [gachaPreviewIdx, setGachaPreviewIdx] = useState(0);
  const [storyChapterId, setStoryChapterId] = useState(null);
  const [storyDialogueIdx, setStoryDialogueIdx] = useState(0);
  const [storyBattleStage, setStoryBattleStage] = useState(0);
  const [storySelectedCharId, setStorySelectedCharId] = useState(null);
  const [gachaTab, setGachaTab] = useState('gacha');
  const [encounterEventId, setEncounterEventId] = useState(null);
  const [encounterDialogueIdx, setEncounterDialogueIdx] = useState(0);

  // 悠活莊園 mini-game states
  const [gardenTab, setGardenTab] = useState('farm');
  const [farmPhase, setFarmPhase] = useState('idle');
  const [farmSeed, setFarmSeed] = useState('veggie');
  const [farmWaters, setFarmWaters] = useState(0);
  const [fishPhase, setFishPhase] = useState('idle');
  const [fishBarPos, setFishBarPos] = useState(0);
  const [fishResult, setFishResult] = useState(null);
  const fishDirRef = useRef(1);
  const [huntPhase, setHuntPhase] = useState('idle');
  const [huntTargets, setHuntTargets] = useState([]);
  const [huntScore, setHuntScore] = useState(0);
  const [huntTime, setHuntTime] = useState(20);
  const [memPhase, setMemPhase] = useState('idle');
  const [memCards, setMemCards] = useState([]);
  const [memFlipped, setMemFlipped] = useState([]);
  const [memMatched, setMemMatched] = useState([]);
  const [memMoves, setMemMoves] = useState(0);
  const [memTime, setMemTime] = useState(60);

  // 【V2.6】加入 battlesWon, gachaPulls, claimedAchievements
  const [progress, setProgress] = useState({ crystals: 0, maxTalents: 3, unlocks: [], encountered: [], captured: [], mastery: {}, ap: 5, affection: {}, snackCount: 0, fragments: 0, charFragments: {}, usedCodes: [], charCostUpgrades: {}, battlesWon: 0, gachaPulls: 0, claimedAchievements: [], mine: { lv: 1, workers: [], lastCollect: null, pending: 0 }, ingredients: {}, unlockedRecipes: [], pendingMeal: null, tutorialDone: false, completedStoryChapters: [], items: {}, unlockedArmors: [], equippedArmor: null, consumableArmors: {}, pendingConsumableArmor: null, gardenDate: '', gardenPlays: { farm: 0, fishing: 0, hunting: 0, memory: 0 }, dailyQuestState: null });
  const [isLoaded, setIsLoaded] = useState(false);

  const [player, setPlayer] = useState({ char: null, talents: [], hp: 0, maxHp: 0, energy: 0, atk: 0, def: 0, shield: 0, buffs: { dmgMult: 1, extraDmg: 0, energyOnLoss: false }, permaBuffs: { startEnergy: 0, startShield: 0, seeds: 0, coins: 0, turnCount: 0 }, status: [] });
  const [enemy, setEnemy] = useState({ char: null, talents: [], hp: 0, maxHp: 0, energy: 0, atk: 0, def: 0, shield: 0, buffs: { dmgMult: 1, extraDmg: 0, atkReduction: 0, energyOnLoss: false }, permaBuffs: { startEnergy: 0, startShield: 0, seeds: 0, coins: 0, turnCount: 0 }, status: [] });

  useEffect(() => {
    const onBtnClick = (e) => { if (e.target.closest('button')) playSound('click'); };
    document.addEventListener('click', onBtnClick);
    return () => document.removeEventListener('click', onBtnClick);
  }, []);

  // 釣魚池 bar animation
  useEffect(() => {
    if (fishPhase !== 'casting') return;
    const interval = setInterval(() => {
      setFishBarPos(pos => {
        let n = pos + fishDirRef.current * 3;
        if (n >= 100) { fishDirRef.current = -1; return 100; }
        if (n <= 0)   { fishDirRef.current = 1;  return 0;   }
        return n;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [fishPhase]);

  // 魔物狩獵 countdown
  useEffect(() => {
    if (huntPhase !== 'hunting') return;
    const timer = setInterval(() => {
      setHuntTime(t => { if (t <= 1) { setHuntPhase('result'); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [huntPhase]);

  // 魔物狩獵 target spawning
  useEffect(() => {
    if (huntPhase !== 'hunting') return;
    const MONSTERS = ['🐺','🐻','🐊','🦂','🕷️','🐗','🦁','🐉'];
    const spawn = () => ({ id: Math.random(), x: 5 + Math.random() * 80, y: 8 + Math.random() * 72, emoji: MONSTERS[Math.floor(Math.random() * MONSTERS.length)] });
    setHuntTargets(Array.from({ length: 4 }, spawn));
    const spawner = setInterval(() => setHuntTargets(prev => prev.length < 7 ? [...prev, spawn()] : prev), 2000);
    return () => { clearInterval(spawner); setHuntTargets([]); };
  }, [huntPhase]);

  // 記憶翻牌 countdown
  useEffect(() => {
    if (memPhase !== 'playing') return;
    const timer = setInterval(() => {
      setMemTime(t => { if (t <= 1) { setMemPhase('result'); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [memPhase]);

  // 記憶翻牌 match check
  useEffect(() => {
    if (memFlipped.length !== 2) return;
    const [a, b] = memFlipped;
    if (memCards[a]?.pairId === memCards[b]?.pairId) {
      const nm = [...memMatched, memCards[a].pairId];
      setMemMatched(nm);
      setMemFlipped([]);
      if (nm.length === 8) setMemPhase('result');
    } else {
      const t = setTimeout(() => setMemFlipped([]), 900);
      return () => clearTimeout(t);
    }
  }, [memFlipped]);

  // 每日任務：登入初始化
  useEffect(() => {
    if (!isLoaded) return;
    const today = new Date().toISOString().slice(0, 10);
    const dqs = progress.dailyQuestState;
    if (!dqs || dqs.date !== today) {
      saveProgress({ ...progress, dailyQuestState: { date: today, progress: { dq_login: 1 }, claimed: [], fullClearClaimed: false } });
    } else if ((dqs.progress.dq_login || 0) < 1 && !dqs.claimed.includes('dq_login')) {
      saveProgress({ ...progress, dailyQuestState: { ...dqs, progress: { ...dqs.progress, dq_login: 1 } } });
    }
  }, [isLoaded]);

  useEffect(() => {
    try {
        const saved = localStorage.getItem('starCrystalTales_V38_Stable');
        if (saved) {
            const p = JSON.parse(saved);
            setProgress({
                crystals: p.crystals || 0, maxTalents: p.maxTalents || 3,
                unlocks: Array.isArray(p.unlocks) ? p.unlocks : [], encountered: Array.isArray(p.encountered) ? p.encountered : [], captured: Array.isArray(p.captured) ? p.captured : [],
                mastery: p.mastery || {}, affection: p.affection || {}, ap: typeof p.ap === 'number' ? p.ap : 5, snackCount: p.snackCount || 0,
                fragments: p.fragments || 0, charFragments: p.charFragments || {},
                usedCodes: Array.isArray(p.usedCodes) ? p.usedCodes : [],
                charCostUpgrades: p.charCostUpgrades || {},
                battlesWon: p.battlesWon || 0, gachaPulls: p.gachaPulls || 0, claimedAchievements: Array.isArray(p.claimedAchievements) ? p.claimedAchievements : [],
                mine: p.mine || { lv: 1, workers: [], lastCollect: null, pending: 0 },
                ingredients: p.ingredients || {}, unlockedRecipes: Array.isArray(p.unlockedRecipes) ? p.unlockedRecipes : [], pendingMeal: p.pendingMeal || null,
                tutorialDone: p.tutorialDone || false,
                completedStoryChapters: Array.isArray(p.completedStoryChapters) ? p.completedStoryChapters : [],
                items: p.items || {},
                unlockedArmors: Array.isArray(p.unlockedArmors) ? p.unlockedArmors : [],
                equippedArmor: p.equippedArmor || null,
                consumableArmors: p.consumableArmors || {},
                pendingConsumableArmor: p.pendingConsumableArmor || null,
                gardenDate: p.gardenDate || '',
                gardenPlays: p.gardenPlays || { farm: 0, fishing: 0, hunting: 0, memory: 0 },
                dailyQuestState: p.dailyQuestState || null,
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
          const charId = player.char?.id;
          const charBaseId = player.char?.baseId || charId;
          if (charBaseId !== t.exclusiveTo && charId !== t.exclusiveTo) return false;
      }
      return true;
  });

  const toggleTalent = (tid) => {
    setSelectedTalentIds(prev => {
        if (prev.includes(tid)) return prev.filter(id => id !== tid);
        const talent = ALL_TALENTS.find(t => t.id === tid);
        const cost = prev.reduce((sum, id) => sum + ALL_TALENTS.find(t => t.id === id).cost, 0);
        const baseId = player.char?.baseId || player.char?.id;
        const specificUpgrade = progress.charCostUpgrades?.[baseId] || 0;
        const max = getBaseTalents(player.char) + (progress.maxTalents - 3) + specificUpgrade;
        if (cost + talent.cost <= max) return [...prev, tid];
        return prev;
    });
  };

  const applyStatus = (ent, type, duration, value = 0, hand = null, logBuffer, isDeferred = false) => {
    if (!ent.status) ent.status = [];
    if ((ent.talents || []).includes('t12') && isDebuffStatus(type)) {
        if(logBuffer) logBuffer.push({ text: `[神佑] ${ent.char.name} 免疫了狀態！`, type: 'info' }); return;
    }
    if (!isDeferred) playSound(isBuffStatus(type) ? 'buff' : 'debuff');
    const idx = ent.status.findIndex(s => s && s.type === type);
    if (idx >= 0) ent.status[idx] = { type, duration, value, hand, isDeferred };
    else ent.status.push({ type, duration, value, hand, isDeferred });
  };

const dealDirectDmg = (base, atk, def, logBuffer, ignoreShield = false) => {
  let dmg = base;
  
  if ((def.talents || []).includes('t_harvest_elf') && (def.status || []).some(s => s?.type === 'REGEN')) {
      dmg = Math.floor(dmg * 0.85);
  }
  if ((def.talents || []).includes('t_halloween_cat') && (atk.status || []).some(s => isDebuffStatus(s?.type))) {
      dmg = Math.floor(dmg * 0.8);
  }

  const evadeIdx = (def.status || []).findIndex(s => s && s.type === 'EVADE');
  if (evadeIdx !== -1) {
    logBuffer.push({ text: `[迴避] ${def.char?.name || '對手'} 閃避了這次攻擊！`, type: 'info' });
    def.status.splice(evadeIdx, 1);
    return 0;
  }
  if ((atk.talents || []).includes('t13')) dmg = Math.floor(dmg * 1.5);
  if ((def.status || []).some(s => s && s.type === 'VULNERABLE')) dmg = Math.floor(dmg * 1.2);
  
  if ((def.status || []).some(s => s && s.type === 'VIP')) {
      dmg = Math.floor(dmg * 1.3);
  }

  if ((def.talents || []).includes('t12')) dmg = Math.floor(dmg * 0.85);

  dmg = Math.max(0, dmg);
  let actualHpDamage = 0;

  if (dmg > 0) playSound(dmg >= 100 ? 'heavy_hit' : 'hit');

  if (!ignoreShield && def.shield > 0) {
    if (def.shield >= dmg) {
      def.shield -= dmg;
      logBuffer.push({ text: `護盾吸收了 ${dmg} 點傷害！`, type: 'system' });
    } else {
      const remainingDmg = dmg - def.shield;
      logBuffer.push({ text: `護盾破裂！吸收了 ${def.shield} 點傷害。`, type: 'system' });
      def.shield = 0;
      
      if ((def.talents || []).includes('t_valentine_wolf')) {
          def.energy = Math.min(100, def.energy + 20);
          applyStatus(def, 'ATK_UP', 3, 20, null, logBuffer, false);
          logBuffer.push({ text: `💝 [苦甜回憶] 護盾破裂！恢復 20 點能量並提升攻擊！`, type: 'info' });
      }

      def.hp -= remainingDmg;
      actualHpDamage = remainingDmg;
      logBuffer.push({ text: `${def.char?.name || '對手'} 受到 ${remainingDmg} 點直接傷害！`, type: 'damage' });
    }
  } else {
    def.hp -= dmg;
    actualHpDamage = dmg;
    const prefix = (ignoreShield && def.shield > 0) ? '無視護盾！' : '';
    logBuffer.push({ text: `${prefix}${def.char?.name || '對手'} 受到 ${dmg} 點直接傷害！`, type: 'damage' });
  }
  if (def.hp < 0) def.hp = 0;

  if (dmg > 0 && (def.status || []).some(s => s && s.type === 'VIP')) {
      def.energy = Math.max(0, def.energy - 5);
      logBuffer.push({ text: `💳 [VIP] 強制扣除了 ${def.char?.name || '對手'} 5 點能量！`, type: 'info' });
  }

  if ((atk.talents || []).includes('t7') && actualHpDamage > 0) {
    const healAmt = Math.max(1, Math.floor(actualHpDamage * 0.20));
    atk.hp = Math.min(atk.maxHp, atk.hp + healAmt);
    logBuffer.push({ text: `[嗜血] ${atk.char?.name || '攻擊方'} 吸收了 ${healAmt} 點生命！`, type: 'heal' });
  }

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
        if (num === 1) { const existBufTypes = (atk.status||[]).filter(s=>s).map(s=>s.type); const availBufs = ['ATK_UP','DEF_UP','REGEN'].filter(t=>!existBufTypes.includes(t)); if (availBufs.length > 0) applyStatus(atk, availBufs[Math.floor(Math.random()*availBufs.length)], 3, 20, null, buf, atkDeferred); else buf.push({text:`${atk.char.name} 身上已有所有增益，無法再獲得新的！`, type:'info'}); }
        else { const count = (atk.status||[]).filter(s => s && isBuffStatus(s.type)).length; dmgDealt = dealDirectDmg(50 + count * 40, atk, def, buf); applyStatus(def, 'PARASITE', 3, 15, null, buf, defDeferred); atk.status = Array.isArray(atk.status) ? atk.status.filter(s => s && !isBuffStatus(s.type)) : []; }
    } else if (id === 'newyear_bear') {
        if (num === 1) { applyStatus(atk, 'EXCITE', 3, 0, null, buf, atkDeferred); applyStatus(def, 'FATIGUE', 3, 0, null, buf, defDeferred); }
        else { dmgDealt = dealDirectDmg(80, atk, def, buf); atk.energy = 0; atk.hp = Math.min(atk.maxHp, atk.hp + 100); def.hp = Math.min(def.maxHp, def.hp + 30); atk.shield += 80; applyStatus(atk, 'EVADE', 1, 0, null, buf, atkDeferred); }
    } else if (id === 'wolf') {
        if (num === 1) { atk.shield += 50; if(!atk.buffs) atk.buffs={}; atk.buffs.energyOnLoss = true; }
        else { dmgDealt = dealDirectDmg(atk.shield, atk, def, buf); atk.hp = Math.min(atk.maxHp, atk.hp + Math.floor(atk.shield/2)); atk.shield = 0; }
    } else if (id === 'cat') {
        if (num === 1) { const existDebufTypes = (def.status||[]).filter(s=>s).map(s=>s.type); const availStats = ['ATK_DOWN','DEF_DOWN'].filter(t=>!existDebufTypes.includes(t)); if (availStats.length > 0) applyStatus(def, availStats[Math.floor(Math.random()*availStats.length)], 3, 20, null, buf, defDeferred); else buf.push({text:`對手已中所有屬性下降效果！`, type:'info'}); if (!existDebufTypes.includes('FREEZE')) applyStatus(def, 'FREEZE', 1, 0, getRandomHand(), buf, defDeferred); else buf.push({text:`對手已處於封印狀態！`, type:'info'}); }
        else { dmgDealt = dealDirectDmg(80, atk, def, buf, true); const count = (def.status||[]).filter(s => s && isDebuffStatus(s.type)).length; atk.hp = Math.min(atk.maxHp, atk.hp + count * 30); }
    } else if (id === 'human') {
        if (num === 1) { dealDirectDmg(30, atk, def, buf); const existBurn = (def.status||[]).find(s=>s&&s.type==='BURN'); if (existBurn) { existBurn.duration += 3; buf.push({text:`🔥 燃燒延長了 3 回合！(剩餘 ${existBurn.duration} 回)`, type:'info'}); } else applyStatus(def, 'BURN', 3, 20, null, buf, defDeferred); }
        else { dealDirectDmg(70, atk, def, buf); const bIdx = (def.status||[]).findIndex(s => s && s.type === 'BURN'); if (bIdx >= 0) { const b = def.status[bIdx]; dealDirectDmg(b.duration * b.value, atk, def, buf, true); atk.hp = Math.min(atk.maxHp, atk.hp + b.duration * 30); def.status.splice(bIdx, 1); } }
    } else if (id === 'elf') {
        if (num === 1) { const diff = Math.abs(atk.energy - def.energy); dealDirectDmg(atk.energy, atk, def, buf, true); dealDirectDmg(def.energy, atk, def, buf, true); atk.hp = Math.min(atk.maxHp, atk.hp + diff); atk.energy = 0; def.energy = 0; }
        else { if(!atk.permaBuffs) atk.permaBuffs={}; atk.permaBuffs.seeds = (atk.permaBuffs.seeds || 0) + 1; dealDirectDmg(atk.permaBuffs.seeds * 20, atk, def, buf); }
    } else if (id === 'xiangxiang') {
        if (num === 1) { atk.shield += 50; applyStatus(def, 'DAZZLE', 1, 0, getRandomHand(), buf, defDeferred); }
        else { dealDirectDmg(100, atk, def, buf, true); if (atk.shield > 0) { dealDirectDmg(50, atk, def, buf, true); applyStatus(def, 'FREEZE', 1, 0, getRandomHand(), buf, defDeferred); } }
    } else if (id === 'kohaku') {
        if (num === 1) { 
            if (!atk.permaBuffs) atk.permaBuffs = {};
            atk.permaBuffs.coins = (atk.permaBuffs.coins || 0) + 1;
            atk.shield += 50;
            applyStatus(def, 'VIP', 3, 0, null, buf, defDeferred);
        } else {
            let coins = atk.permaBuffs?.coins || 0;
            atk.permaBuffs.coins = 0;
            dealDirectDmg(80, atk, def, buf);
            if (coins > 0) {
                dealDirectDmg(50 * coins, atk, def, buf, true);
                const healAmt = 30 * coins;
                atk.hp = Math.min(atk.maxHp, atk.hp + healAmt);
                buf.push({ text: `[資本鎮壓] 消耗了 ${coins} 枚金幣，恢復 ${healAmt} 點生命！`, type: 'heal' });
            }
        }
    } else if (id === 'aldous') {
        if (num === 1) {
            applyStatus(def, 'FREEZE', 1, 0, getRandomHand(), buf, defDeferred);
            applyStatus(def, 'SILENCE', 2, 0, null, buf, defDeferred);
            applyStatus(def, 'DEF_DOWN', 3, 20, null, buf, defDeferred);
        } else {
            const isCC = (def.status||[]).some(s => s && !s.isDeferred && ['SILENCE', 'FREEZE'].includes(s.type));
            let dmg = isCC ? 320 : 80;
            let actualDmg = dealDirectDmg(dmg, atk, def, buf, true);
            if (isCC && actualDmg > 0) {
                const heal = Math.floor(actualDmg * 0.5);
                atk.hp = Math.min(atk.maxHp, atk.hp + heal);
                buf.push({ text: `[秘劍吸血] 吸收了 ${heal} 點生命！`, type: 'heal' });
            }
        }
    } else if (id === 'harvest_elf') {
        if (num === 1) {
            if (!atk.permaBuffs) atk.permaBuffs = {};
            atk.permaBuffs.seeds = Math.min(5, (atk.permaBuffs.seeds || 0) + 1);
            applyStatus(atk, 'REGEN', 3, 20, null, buf, atkDeferred);
        } else {
            let seeds = atk.permaBuffs?.seeds || 0;
            let dmg = 40 + seeds * 20; 
            let actual = dealDirectDmg(dmg, atk, def, buf);
            if (actual > 0) {
                let shieldAmt = Math.floor(actual * 0.5); 
                atk.shield += shieldAmt;
                buf.push({ text: `[萬物滋長] 傷害轉化，獲得 ${shieldAmt} 點護盾！`, type: 'shield' });
            }
        }
    } else if (id === 'blackflame_human') {
        if (num === 1) {
            dealDirectDmg(35, atk, def, buf);
            applyStatus(def, 'BURN', 3, 20, null, buf, defDeferred);
            applyStatus(def, 'VULNERABLE', 3, 0, null, buf, defDeferred);
        } else {
            let bIdx = (def.status||[]).findIndex(s => s && s.type === 'BURN');
            let dmg = 80;
            if (bIdx >= 0) {
                let b = def.status[bIdx];
                dmg = Math.floor(dmg * (1 + 0.2 * b.duration));
                dealDirectDmg(b.duration * b.value, atk, def, buf, true);
                def.status.splice(bIdx, 1);
                buf.push({ text: `[終焉結算] 燃燒爆發，奧義傷害提升！`, type: 'info' });
            }
            dealDirectDmg(dmg, atk, def, buf);
        }
    } else if (id === 'valentine_wolf') {
        if (num === 1) {
            atk.shield += 60;
            applyStatus(atk, 'EVADE', 1, 0, null, buf, atkDeferred);
        } else {
            dealDirectDmg(65, atk, def, buf);
            if (Math.random() < 0.6) {
                applyStatus(def, 'FREEZE', 1, 0, getRandomHand(), buf, defDeferred);
            }
        }
    } else if (id === 'halloween_cat') {
        if (num === 1) {
            const debuff = ['FATIGUE', 'ATK_DOWN', 'DEF_DOWN'][Math.floor(Math.random()*3)];
            applyStatus(def, debuff, 3, 20, null, buf, defDeferred);
            const buff = ['EXCITE', 'EVADE'][Math.floor(Math.random()*2)];
            applyStatus(atk, buff, buff === 'EVADE' ? 1 : 2, 0, null, buf, atkDeferred);
        } else {
            const dCount = (def.status||[]).filter(s => s && isDebuffStatus(s.type)).length;
            let dmg = Math.floor(50 * Math.pow(1.5, dCount));
            dealDirectDmg(dmg, atk, def, buf, true);
        }
    } else if (id === 'christmas_xiangxiang') {
        if (num === 1) {
            const pool = shuffle(['ATK_UP', 'DEF_UP', 'REGEN', 'EVADE', 'EXCITE']).slice(0, 3);
            pool.forEach(b => applyStatus(atk, b, b==='EVADE'?1:3, 20, null, buf, atkDeferred));
        } else {
            dealDirectDmg(100, atk, def, buf);
            applyStatus(def, 'DAZZLE', 1, 0, getRandomHand(), buf, defDeferred);
        }
    } else if (id === 'am1') { 
        if (num === 1) { dealDirectDmg(20, atk, def, buf); applyStatus(def, 'DEF_DOWN', 3, 20, null, buf, defDeferred); applyStatus(def, 'VULNERABLE', 3, 0, null, buf, defDeferred); }
        else { dealDirectDmg(120, atk, def, buf, true); }
    } else if (id === 'am2') { 
        if (num === 1) { atk.shield += 100; }
        else { dealDirectDmg(80, atk, def, buf); applyStatus(def, 'DAZZLE', 1, 0, getRandomHand(), buf, defDeferred); }
    } else if (id === 'am3') { 
        if (num === 1) { applyStatus(def, 'SILENCE', 2, 0, null, buf, defDeferred); applyStatus(def, 'FATIGUE', 3, 0, null, buf, defDeferred); }
        else { dealDirectDmg(100, atk, def, buf); }
    } else if (id === 'ab1') { 
        if (num === 1) { dealDirectDmg(40, atk, def, buf); applyStatus(def, 'PARASITE', 3, 20, null, buf, defDeferred); applyStatus(def, 'BURN', 3, 20, null, buf, defDeferred); }
        else { dealDirectDmg(200, atk, def, buf); applyStatus(def, 'DAZZLE', 1, 0, getRandomHand(), buf, defDeferred); }
    } else if (id === 'ab2') { 
        if (num === 1) { atk.shield += 150; applyStatus(atk, 'REGEN', 3, 30, null, buf, atkDeferred); }
        else { dealDirectDmg(250, atk, def, buf, true); }
    } else {
        if (id === 'm1') { if (num === 1) { dealDirectDmg(10, atk, def, buf); applyStatus(def, 'PARASITE', 2, 10, null, buf, defDeferred); } else atk.hp = Math.min(atk.maxHp, atk.hp + 60); }
        else if (id === 'm2') { if (num === 1) atk.shield += 50; else { dealDirectDmg(40, atk, def, buf); applyStatus(def, 'FREEZE', 1, 0, getRandomHand(), buf, defDeferred); } }
        else if (id === 'm3') { if (num === 1) applyStatus(def, 'BURN', 2, 15, null, buf, defDeferred); else dealDirectDmg(80, atk, def, buf); }
        else if (id === 'm4') { if (num === 1) applyStatus(def, 'DAZZLE', 1, 0, getRandomHand(), buf, defDeferred); else atk.hp = Math.min(atk.maxHp, atk.hp + 40); }
        else if (id === 'm5') { if (num === 1) applyStatus(def, 'SILENCE', 2, 0, null, buf, defDeferred); else dealDirectDmg(70, atk, def, buf); }
        else if (id === 'm6') { if (num === 1) { applyStatus(def, 'ATK_DOWN', 2, 20, null, buf, defDeferred); applyStatus(def, 'DEF_DOWN', 2, 20, null, buf, defDeferred); } else { const debuffCount = (def.status||[]).filter(s => s && isDebuffStatus(s.type)).length; dealDirectDmg(30 + debuffCount * 20, atk, def, buf); } }
        else if (id === 'm7') { if (num === 1) { applyStatus(atk, 'EVADE', 1, 0, null, buf, atkDeferred); def.energy = Math.max(0, def.energy - 20); buf.push({text: `💧 海藍水母奪取了 20 點能量！`, type: 'info'}); } else { dealDirectDmg(60, atk, def, buf); applyStatus(def, 'FREEZE', 1, 0, getRandomHand(), buf, defDeferred); def.energy = Math.max(0, def.energy - 30); buf.push({text: `💧 電擊觸手再奪取 30 點能量！`, type: 'info'}); } }
        else if (id === 'm8') { if (num === 1) { atk.shield += 60; buf.push({text: `🦎 熔甲防禦！獲得 60 點護盾。`, type: 'info'}); } else { const shieldAmt = atk.shield; atk.shield = 0; dealDirectDmg(40 + shieldAmt, atk, def, buf, true); buf.push({text: `🌋 熔岩爆裂！消耗 ${shieldAmt} 點護盾引爆！`, type: 'info'}); } }
        else if (id === 'm9') { if (num === 1) { applyStatus(atk, 'EXCITE', 3, 0, null, buf, atkDeferred); atk.shield += 30; buf.push({text: `🦢 星光羽翼！獲得亢奮與 30 護盾。`, type: 'info'}); } else { dealDirectDmg(55, atk, def, buf); applyStatus(def, 'DAZZLE', 1, 0, getRandomHand(), buf, defDeferred); } }
        else if (id === 'm10') { if (num === 1) { applyStatus(def, 'FATIGUE', 3, 0, null, buf, defDeferred); atk.hp = Math.min(atk.maxHp, atk.hp + 30); buf.push({text: `🦇 夢魘爪！恢復 30 HP。`, type: 'heal'}); } else { dealDirectDmg(50, atk, def, buf, true); const debuffCount = (def.status||[]).filter(s => s && isDebuffStatus(s.type)).length; const lifeSteal = debuffCount * 20; atk.hp = Math.min(atk.maxHp, atk.hp + lifeSteal); if (lifeSteal > 0) buf.push({text: `🦇 虛空侵蝕吸取了 ${lifeSteal} HP！`, type: 'heal'}); } }
        else if (id === 'b1') { if (num === 1) { def.energy = Math.max(0, def.energy - 20); applyStatus(def, 'SILENCE', 1, 0, null, buf, defDeferred); } else dealDirectDmg(150, atk, def, buf, true); }
        else if (id === 'b2') { if (num === 1) { atk.shield += 30; applyStatus(def, 'DAZZLE', 1, 0, getRandomHand(), buf, defDeferred); } else dealDirectDmg(130, atk, def, buf); }
        else if (id === 'b3') { if (num === 1) { atk.atk += 10; applyStatus(def, 'BURN', 2, 25, null, buf, defDeferred); } else dealDirectDmg(180, atk, def, buf); }
        else if (id === 'b4') { if (num === 1) { dealDirectDmg(30, atk, def, buf); applyStatus(def, 'PARASITE', 3, 20, null, buf, defDeferred); } else atk.hp = Math.min(atk.maxHp, atk.hp + 200); }
        else if (id === 'b5') { if (num === 1) atk.shield += 80; else { dealDirectDmg(100, atk, def, buf); def.energy = 0; applyStatus(def, 'FREEZE', 1, 0, getRandomHand(), buf, defDeferred); } }
    }
  };

  const processEoR = (ent, other, buf) => {
    let next = [];
    if ((ent.talents||[]).includes('t_wolf') && ent.shield > 0) { ent.hp = Math.min(ent.maxHp, ent.hp + 25); buf.push({text: `[極寒護體] 恢復 25 HP！`, type: 'heal'}); }
    if ((ent.talents||[]).includes('t_xiangxiang') && ent.hp < ent.maxHp * 0.5) { ent.hp = Math.min(ent.maxHp, ent.hp + 20); ent.shield += 10; buf.push({text: `[愛心宵夜] 恢復 20 HP 並獲得 10 護盾！`, type: 'heal'}); }
    if ((ent.talents||[]).includes('t_cat')) {
        const dCount = (other.status || []).filter(s => s && isDebuffStatus(s.type)).length;
        if (dCount > 0) {
            const dmg = dCount * 15;
            dealDirectDmg(dmg, ent, other, buf);
            buf.push({text: `🐾 [虐襲] 對手身上 ${dCount} 個負面狀態，受到 ${dmg} 點傷害！`, type: 'damage'});
        }
    }
    
    if (ent.char?.id === 'aldous') {
        ent.energy = Math.min(100, ent.energy + 5);
        buf.push({text: `[睿智之風] 恢復 5 點能量！`, type: 'info'});
    }

    if ((ent.talents||[]).includes('t_harvest_elf') && (ent.status||[]).some(s => s?.type === 'REGEN')) {
        ent.energy = Math.min(100, ent.energy + 5);
        buf.push({text: `🌽 [豐饒之角] 再生觸發，恢復 5 能量！`, type: 'info'});
    }

    if ((ent.talents||[]).includes('t_halloween_cat')) {
        const dCount = (other.status || []).filter(s => s && isDebuffStatus(s.type)).length;
        if (dCount > 0) {
            const dmg = dCount * 15;
            dealDirectDmg(dmg, ent, other, buf);
            buf.push({text: `🦇 [幻夜貓蹤] 對手恐懼，受到 ${dmg} 點傷害！`, type: 'damage'});
        }
    }

    if ((ent.talents||[]).includes('t_christmas_xiangxiang')) {
        ent.permaBuffs.turnCount = (ent.permaBuffs.turnCount || 0) + 1;
        if (ent.permaBuffs.turnCount % 3 === 0) {
            const heal = Math.floor(ent.maxHp * 0.1);
            ent.hp = Math.min(ent.maxHp, ent.hp + heal);
            ent.energy = Math.min(100, ent.energy + 20);
            buf.push({text: `🎁 [最棒的禮物] 恢復 ${heal} 點生命與 20 點能量！`, type: 'heal'});
        }
    }

    if (ent.permaBuffs?.armor === 'armor_chaos' && Math.random() < 0.3) {
        const debuffPool = ['BURN', 'PARASITE', 'SILENCE', 'ATK_DOWN', 'DEF_DOWN', 'FATIGUE'];
        const chosen = debuffPool[Math.floor(Math.random() * debuffPool.length)];
        applyStatus(other, chosen, 1, chosen === 'BURN' ? 20 : 0, null, buf);
        buf.push({text: `🌀 [干擾符文] 對敵觸發隨機負面狀態！`, type: 'info'});
    }

    for (let s of (ent.status || [])) {
        if (!s) continue;
        if (s.type === 'BURN') { const baseBDmg = s.value || 20; const bDmg = (other.talents||[]).includes('t_human') ? baseBDmg + 10 : baseBDmg; ent.hp = Math.max(0, ent.hp - bDmg); buf.push({text: `🔥 燃燒造成 ${bDmg} 傷害！`, type: 'damage'}); }
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
    playSound('skill');
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
        playSound('rps_draw');
        const ce = (ent) => { if ((ent.status||[]).some(s => s && s.type === 'FATIGUE')) return 0; let b = (ent.talents||[]).includes('t5') ? 30 : 20; if ((ent.status||[]).some(s => s && s.type === 'EXCITE')) b = Math.floor(b * 1.5); return b; };
        p.energy = Math.min(100, p.energy + ce(p)); e.energy = Math.min(100, e.energy + ce(e));
        if ((p.talents||[]).includes('t5')) p.hp = Math.min(p.maxHp, p.hp + 15);
        buf.push({ text: '平手！雙方各退一步。', type: 'info' });
    } else {
        const isPW = RPS_CHOICES[choice].beats === aiChoice;
        playSound(isPW ? 'rps_win' : 'rps_lose'); let atk = isPW ? p : e; let def = isPW ? e : p;
        if (def.buffs && def.buffs.energyOnLoss) { def.energy = Math.min(100, def.energy + 50); def.buffs.energyOnLoss = false; }
        let mult = getElementMultiplier(atk.char.element.id, def.char.element.id);
        
        let atkVal = atk.atk + getStatusValueSum(atk, 'ATK_UP') - getStatusValueSum(atk, 'ATK_DOWN');
        let defVal = def.def + getStatusValueSum(def, 'DEF_UP') - getStatusValueSum(def, 'DEF_DOWN');
        
        if ((atk.talents||[]).includes('t_blackflame_human') && atk.hp < atk.maxHp * 0.4) {
            atkVal += 30;
            defVal = Math.max(0, defVal - 15);
            buf.push({text: `🩸 [狂化血脈] 攻擊提升，無視部分防禦！`, type: 'info'});
        }

        if ((atk.talents||[]).includes('t6') && atk.hp < atk.maxHp * 0.3) atkVal = Math.floor(atkVal * 1.5);

        let d = Math.max(10, Math.floor(atkVal * mult - defVal));
        
        if ((isPW ? choice : aiChoice) === 'SCISSORS' && (atk.talents||[]).includes('t9')) d = Math.floor(d * 1.5);
        if ((isPW ? choice : aiChoice) === 'ROCK' && (atk.talents||[]).includes('t10')) d = Math.floor(d * 1.5);
        if ((isPW ? choice : aiChoice) === 'PAPER' && (atk.talents||[]).includes('t11')) d = Math.floor(d * 1.5);
        if ((!isPW ? choice : aiChoice) === 'SCISSORS' && (def.talents||[]).includes('t9')) d = Math.floor(d * 0.5);
        if ((!isPW ? choice : aiChoice) === 'ROCK' && (def.talents||[]).includes('t10')) d = Math.floor(d * 0.5);
        if ((!isPW ? choice : aiChoice) === 'PAPER' && (def.talents||[]).includes('t11')) d = Math.floor(d * 0.5);
        
        dealDirectDmg(d, atk, def, buf);

        // 武裝出拳獲勝效果（玩家勝出時）
        if (isPW) {
            const aId = p.permaBuffs?.armor;
            if (aId === 'armor_burst') {
                dealDirectDmg(30, p, e, buf, true);
                buf.push({ text: `💠 [爆裂星晶] 追加 30 點真實傷害！`, type: 'damage' });
            } else if (aId === 'armor_corrosion') {
                const dtype = Math.random() < 0.5 ? 'ATK_DOWN' : 'DEF_DOWN';
                applyStatus(e, dtype, 2, 15, null, buf);
                buf.push({ text: `🗡️ [腐蝕刃] 施加${dtype === 'ATK_DOWN' ? '降攻' : '降防'} 2 回合！`, type: 'info' });
            }
            const cId = p.permaBuffs?.consumableArmor;
            if (cId === 'carm_pierce') {
                applyStatus(e, 'VULNERABLE', 1, 0, null, buf);
                buf.push({ text: `💢 [破甲符] 施加易傷 1 回合！`, type: 'info' });
            }
        }
    }
    processEoR(p, e, buf); processEoR(e, p, buf);
    setPlayer(p); setEnemy(e); setLogs(prev => [...prev, ...buf]);
    if (tutorialStep === 3) setTutorialStep(4);
    if (p.hp <= 0) handleDeath('player'); else if (e.hp <= 0) handleDeath('enemy');
  };

  const startTutorial = () => {
    const tutChar = CHARACTERS[0];
    const pObj = {
        char: tutChar, talents: [], hp: tutChar.stats.maxHp, maxHp: tutChar.stats.maxHp,
        atk: tutChar.stats.atk, def: tutChar.stats.def, energy: 0, shield: 0,
        buffs: { dmgMult: 1, extraDmg: 0, energyOnLoss: false },
        permaBuffs: { startEnergy: 0, startShield: 0, seeds: 0, coins: 0, turnCount: 0 }, status: []
    };
    const eObj = {
        char: TUTORIAL_ENEMY, talents: [], hp: TUTORIAL_ENEMY.stats.maxHp, maxHp: TUTORIAL_ENEMY.stats.maxHp,
        atk: TUTORIAL_ENEMY.stats.atk, def: TUTORIAL_ENEMY.stats.def, energy: 0, shield: 0,
        buffs: { dmgMult: 1, extraDmg: 0, atkReduction: 0, energyOnLoss: false },
        permaBuffs: { startEnergy: 0, startShield: 0, seeds: 0, coins: 0, turnCount: 0 }, status: []
    };
    setGameMode('tutorial');
    setPlayer(pObj);
    setEnemy(eObj);
    setLogs([{ text: '【訓練場】教官為你安排了一場模擬戰鬥！', type: 'system' }]);
    setWinner(null);
    setTutorialStep(1);
    setGameState('battle');
  };

  const startBattleMode = (selectedChar, tIds, specificEnemy = null) => {
    try {
        if (!selectedChar) throw new Error("未選擇出戰角色！");

        let pMax = selectedChar.stats.maxHp + (tIds.includes('t1') ? 100 : 0);
        let initE = tIds.includes('t3') ? 25 : 0; if (tIds.some(t=>['t9','t10','t11'].includes(t))) initE += 20;
        
        let pSeeds = tIds.includes('t_elf') ? 2 : 0;
        if (tIds.includes('t_harvest_elf')) pSeeds += 2; 
        
        if (selectedChar.id === 'aldous') initE = Math.min(100, initE + 50);

        let pObj = {
            char: selectedChar, talents: tIds, hp: pMax, maxHp: pMax,
            atk: selectedChar.stats.atk + (tIds.includes('t2') ? 10 : 0),
            def: selectedChar.stats.def, energy: initE, shield: tIds.includes('t4') ? 80 : 0,
            buffs: { dmgMult: 1, extraDmg: 0, energyOnLoss: false },
            permaBuffs: { startEnergy: 0, startShield: 0, seeds: pSeeds, coins: 0, turnCount: 0, armor: progress.equippedArmor || null, consumableArmor: progress.pendingConsumableArmor || null }, status: []
        };
        if (tIds.includes('t_bear')) { const pool = shuffle(['ATK_UP', 'DEF_UP', 'REGEN']); pObj.status.push({ type: pool[0], duration: 99, value: 20, isNew: false, isDeferred: false }, { type: pool[1], duration: 99, value: 20, isNew: false, isDeferred: false }); }

        // 套用料理 Buff
        let mealLog = null;
        if (progress.pendingMeal) {
          const meal = RECIPES.find(r => r.id === progress.pendingMeal);
          if (meal) {
            const charBaseId = selectedChar.baseId || selectedChar.id;
            const isFavored = meal.favoredBy.includes(charBaseId);
            const mult = isFavored ? COOKING_PREF_BONUS : 1;
            const b = meal.buff;
            let mShield = 0, mEnergy = 0, mRegen = 0;
            if (b.type === 'hp')         { const bonus = Math.floor(b.value * mult); pObj.maxHp += bonus; pObj.hp += bonus; }
            if (b.type === 'shield')     { mShield = Math.floor(b.value * mult); pObj.shield += mShield; }
            if (b.type === 'energy')     { mEnergy = Math.floor(b.value * mult); pObj.energy = Math.min(100, pObj.energy + mEnergy); }
            if (b.type === 'regen')      { mRegen = Math.floor(b.value * mult); pObj.status.push({ type: 'REGEN', duration: 99, value: mRegen, isNew: false, isDeferred: false }); }
            if (b.type === 'hp_energy')  { const hb = Math.floor(b.hp * mult); pObj.maxHp += hb; pObj.hp += hb; mEnergy = Math.floor(b.energy * mult); pObj.energy = Math.min(100, pObj.energy + mEnergy); }
            if (b.type === 'atk_shield') { pObj.atk += Math.floor(b.atk * mult); mShield = Math.floor(b.shield * mult); pObj.shield += mShield; }
            if (b.type === 'hp_regen')   { const hb = Math.floor(b.hp * mult); pObj.maxHp += hb; pObj.hp += hb; mRegen = Math.floor(b.regen * mult); pObj.status.push({ type: 'REGEN', duration: 99, value: mRegen, isNew: false, isDeferred: false }); }
            if (mShield || mEnergy || mRegen) pObj.permaBuffs = { ...pObj.permaBuffs, meal: { shield: mShield, energy: mEnergy, regen: mRegen } };
            mealLog = isFavored ? `🍽️ ${selectedChar.name} 享用了最愛的${meal.name}！Buff 效果提升20%！` : `🍽️ 料理「${meal.name}」的效果生效了！`;
          }
        }
        
        let eChar; 
        if (gameMode === 'brawl') {
            if (specificEnemy && specificEnemy !== 'random') {
                eChar = specificEnemy;
            } else {
                let pool = CHARACTERS.filter(c => !isT0Char(c) || unlocks.includes(c.id));
                pool = [...pool, ...NORMAL_MONSTERS, ...BOSS_MONSTERS];
                if (unlocks.includes('xiangxiang')) pool.push(HIDDEN_CHARACTER);
                VARIANTS.forEach(v => { if (unlocks.includes(v.id) && !v.isPlaceholder) pool.push(v); });
                pool = [...pool, ...ADVANCED_MONSTERS.filter(m => encountered.includes(m.id)), ...ADVANCED_BOSSES.filter(m => encountered.includes(m.id))];
                eChar = pool[Math.floor(Math.random() * pool.length)];
            }
        } else if (gameMode === 'advanced_campaign') {
            let cRoute = [...shuffle([...ADVANCED_MONSTERS]).slice(0, 3), ...shuffle([...ADVANCED_BOSSES]).slice(0, 2)];
            let cStage = 0;
            setCampaignRoute(cRoute);
            setCampaignStage(cStage);
            eChar = cRoute[cStage];
        } else {
            let cRoute = [...shuffle([...NORMAL_MONSTERS]).slice(0, 2), shuffle([...BOSS_MONSTERS])[0]];
            let cStage = 0;
            setCampaignRoute(cRoute);
            setCampaignStage(cStage);
            eChar = cRoute[cStage];
        }
        
        if (!eChar) throw new Error("敵方魔物生成失敗！");

        let validETalents = ALL_TALENTS.filter(t => {
            if (t.req && !unlocks.includes(t.req)) return false;
            if (t.exclusiveTo) {
                const bId = eChar.baseId || eChar.id;
                if (bId !== t.exclusiveTo && eChar.id !== t.exclusiveTo) return false;
            }
            return true;
        });
        let eT = getRandomTalents(getBaseTalents(eChar), validETalents);
        let eMax = eChar.stats.maxHp + (eT.includes('t1') ? 100 : 0);
        let eInitE = eT.includes('t3') ? 25 : 0; if (eT.some(t=>['t9','t10','t11'].includes(t))) eInitE += 20;
        let eSeeds = eT.includes('t_elf') ? 2 : 0;
        if (eT.includes('t_harvest_elf')) eSeeds += 2;

        if (eChar.id === 'aldous') eInitE = Math.min(100, eInitE + 50);

        let eObj = { 
            char: eChar, talents: eT, hp: eMax, maxHp: eMax, 
            atk: eChar.stats.atk + (eT.includes('t2') ? 10 : 0), 
            def: eChar.stats.def, energy: eInitE, shield: eT.includes('t4') ? 80 : 0, 
            buffs: { dmgMult: 1, extraDmg: 0, atkReduction: 0, energyOnLoss: false }, 
            permaBuffs: { startEnergy: 0, startShield: 0, seeds: eSeeds, coins: 0, turnCount: 0 }, status: [] 
        };
        if (eT.includes('t_bear')) { const pool = shuffle(['ATK_UP', 'DEF_UP', 'REGEN']); eObj.status.push({ type: pool[0], duration: 99, value: 20, isNew: false, isDeferred: false }, { type: pool[1], duration: 99, value: 20, isNew: false, isDeferred: false }); }

        let np = { ...progress };
        if (!encountered.includes(eChar.id)) { np.encountered = [...encountered, eChar.id]; }
        if (progress.pendingMeal) { np.pendingMeal = null; }
        saveProgress(np);

        const initLogs = [{ text: `夜晚的艾歐蘭斯充滿危險，戰鬥開始！`, type: 'system' }];
        if (mealLog) initLogs.push({ text: mealLog, type: 'info' });

        // 武裝戰鬥開始效果
        const armorId = progress.equippedArmor;
        const cArmorId = progress.pendingConsumableArmor;
        if (armorId === 'armor_overload') {
            applyStatus(eObj, 'FATIGUE', 3, 0, null, initLogs, false);
            initLogs.push({ text: `⚡ [超載電容] 戰鬥開始，對敵施加疲憊 3 回合！`, type: 'info' });
        }
        if (cArmorId === 'carm_dark') {
            applyStatus(eObj, 'SILENCE', 2, 0, null, initLogs, false);
            initLogs.push({ text: `🌑 [暗晶碎塊] 戰鬥開始，對敵施加封印 2 回合！`, type: 'info' });
        }

        setPlayer(pObj); setEnemy(eObj); setNewlyCaptured(null); setLogs(initLogs); setBattleItemUses(3); setShowItemPanel(false); setGameState('battle');

    } catch (e) {
        console.error(e);
        setSysError(`戰鬥引擎載入失敗: ${e.message}\n請檢查是否有舊存檔干擾。`);
    }
  };

  const startStoryChapter = (chapterId) => {
    setStoryChapterId(chapterId);
    setStoryDialogueIdx(0);
    setStoryBattleStage(0);
    setGameState('story_dialogue');
  };

  const startStoryBattle = (chapterId, battleStage) => {
    const chapter = STORY_CHAPTERS.find(c => c.id === chapterId);
    if (!chapter) return;
    const attackerChar = player.char || CHARACTERS.find(c => c.id === chapter.attackerCharId);
    const enemyId = chapter.enemyIds[battleStage];
    const eChar = [...NORMAL_MONSTERS, ...BOSS_MONSTERS].find(m => m.id === enemyId);
    if (!attackerChar || !eChar) return;

    const validP = ALL_TALENTS.filter(t => !t.req && !t.exclusiveTo);
    const pTalents = selectedTalentIds.length > 0 ? selectedTalentIds : getRandomTalents(3, validP);
    const pMax = attackerChar.stats.maxHp + (pTalents.includes('t1') ? 100 : 0);
    const pInitE = (pTalents.includes('t3') ? 25 : 0) + (pTalents.some(t => ['t9','t10','t11'].includes(t)) ? 20 : 0);
    const pObj = {
      char: attackerChar, talents: pTalents,
      hp: pMax, maxHp: pMax,
      atk: attackerChar.stats.atk + (pTalents.includes('t2') ? 10 : 0),
      def: attackerChar.stats.def, energy: pInitE,
      shield: pTalents.includes('t4') ? 80 : 0,
      buffs: { dmgMult: 1, extraDmg: 0, energyOnLoss: false },
      permaBuffs: { startEnergy: 0, startShield: 0, seeds: 0, coins: 0, turnCount: 0 }, status: []
    };
    if (pTalents.includes('t_bear')) { const pool = shuffle(['ATK_UP','DEF_UP','REGEN']); pObj.status.push({ type: pool[0], duration: 99, value: 20, isNew: false, isDeferred: false }, { type: pool[1], duration: 99, value: 20, isNew: false, isDeferred: false }); }

    // 套用料理 Buff（第1戰消耗，後續繼承）
    let mealLog = null;
    if (battleStage === 0 && progress.pendingMeal) {
      const meal = RECIPES.find(r => r.id === progress.pendingMeal);
      if (meal) {
        const charBaseId = attackerChar.baseId || attackerChar.id;
        const isFavored = meal.favoredBy.includes(charBaseId);
        const mult = isFavored ? COOKING_PREF_BONUS : 1;
        const b = meal.buff;
        let mHp = 0, mAtk = 0, mShield = 0, mEnergy = 0, mRegen = 0;
        if (b.type === 'hp')         { mHp = Math.floor(b.value * mult); pObj.maxHp += mHp; pObj.hp += mHp; }
        if (b.type === 'shield')     { mShield = Math.floor(b.value * mult); pObj.shield += mShield; }
        if (b.type === 'energy')     { mEnergy = Math.floor(b.value * mult); pObj.energy = Math.min(100, pObj.energy + mEnergy); }
        if (b.type === 'regen')      { mRegen = Math.floor(b.value * mult); pObj.status.push({ type: 'REGEN', duration: 99, value: mRegen, isNew: false, isDeferred: false }); }
        if (b.type === 'hp_energy')  { mHp = Math.floor(b.hp * mult); pObj.maxHp += mHp; pObj.hp += mHp; mEnergy = Math.floor(b.energy * mult); pObj.energy = Math.min(100, pObj.energy + mEnergy); }
        if (b.type === 'atk_shield') { mAtk = Math.floor(b.atk * mult); pObj.atk += mAtk; mShield = Math.floor(b.shield * mult); pObj.shield += mShield; }
        pObj.permaBuffs = { ...pObj.permaBuffs, meal: { hp: mHp, atk: mAtk, shield: mShield, energy: mEnergy, regen: mRegen } };
        mealLog = isFavored ? `🍽️ ${attackerChar.name} 享用了最愛的${meal.name}！Buff 效果提升20%！` : `🍽️ 料理「${meal.name}」的效果生效了！`;
      }
    } else if (battleStage > 0) {
      const m = player.permaBuffs?.meal;
      if (m) {
        pObj.maxHp += (m.hp || 0); pObj.hp += (m.hp || 0);
        pObj.atk += (m.atk || 0);
        pObj.shield += (m.shield || 0);
        pObj.energy = Math.min(100, pObj.energy + (m.energy || 0));
        if (m.regen) pObj.status.push({ type: 'REGEN', duration: 99, value: m.regen, isNew: false, isDeferred: false });
        pObj.permaBuffs = { ...pObj.permaBuffs, meal: m };
      }
    }

    const validE = ALL_TALENTS.filter(t => !t.req && !t.exclusiveTo);
    const eT = getRandomTalents(getBaseTalents(eChar), validE);
    const eMax = eChar.stats.maxHp + (eT.includes('t1') ? 100 : 0);
    const eInitE = eT.includes('t3') ? 25 : 0;
    const eObj = {
      char: eChar, talents: eT, hp: eMax, maxHp: eMax,
      atk: eChar.stats.atk + (eT.includes('t2') ? 10 : 0),
      def: eChar.stats.def, energy: eInitE, shield: 0,
      buffs: { dmgMult: 1, extraDmg: 0, atkReduction: 0, energyOnLoss: false },
      permaBuffs: { startEnergy: 0, startShield: 0, seeds: 0, coins: 0, turnCount: 0 }, status: []
    };
    if (eT.includes('t_bear')) { const pool = shuffle(['ATK_UP','DEF_UP','REGEN']); eObj.status.push({ type: pool[0], duration: 99, value: 20, isNew: false, isDeferred: false }, { type: pool[1], duration: 99, value: 20, isNew: false, isDeferred: false }); }

    let np = { ...progress };
    if (!np.encountered.includes(eChar.id)) np.encountered = [...np.encountered, eChar.id];
    if (battleStage === 0 && np.pendingMeal) np.pendingMeal = null;
    saveProgress(np);

    setPlayer(pObj);
    setEnemy(eObj);
    setSelectedTalentIds(pTalents);
    const initLogs = [{ text: `⚔️ 第 ${battleStage + 1}/3 戰！對手：${eChar.name}`, type: 'info' }];
    if (mealLog) initLogs.push({ text: mealLog, type: 'info' });
    setLogs(initLogs);
    setNewlyCaptured(null);
    setBattleItemUses(3); setShowItemPanel(false);
    setGameMode('story');
    setGameState('battle');
  };

  const NEGATIVE_STATUSES = ['BURN','PARASITE','FREEZE','DAZZLE','SILENCE','ATK_DOWN','DEF_DOWN','VULNERABLE','FATIGUE'];
  const handleUseItem = (itemId) => {
    if (battleItemUses <= 0) { setSysError('本場戰鬥道具使用次數已達上限（3次）！'); return; }
    if ((progress.items?.[itemId] || 0) <= 0) { setSysError('道具數量不足！'); return; }
    let newPlayer = { ...player, status: [...(player.status||[])] };
    let logText = '';
    switch (itemId) {
      case 'stardust':
        newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + 100);
        logText = '✨ 使用星晶砂粉！恢復 100 HP！'; break;
      case 'excite_potion':
        newPlayer.status = [...newPlayer.status.filter(s => s.type !== 'EXCITE'), { type: 'EXCITE', duration: 3, value: 0, isNew: true, isDeferred: false }];
        logText = '🧪 使用亢奮藥劑！獲得 ⚡[亢奮] 3回合！'; break;
      case 'smoke_bomb':
        newPlayer.status = [...newPlayer.status.filter(s => s.type !== 'EVADE'), { type: 'EVADE', duration: 1, value: 0, isNew: true, isDeferred: false }];
        logText = '💨 使用煙霧彈！獲得 💨[迴避] 1次！'; break;
      case 'antidote':
        newPlayer.status = newPlayer.status.filter(s => !NEGATIVE_STATUSES.includes(s.type));
        logText = '💊 使用萬能解藥！清除所有負面狀態！'; break;
      default: return;
    }
    setPlayer(newPlayer);
    setBattleItemUses(prev => prev - 1);
    setLogs(prev => [...prev, { text: logText, type: 'heal' }]);
    let np = { ...progress, items: { ...progress.items, [itemId]: Math.max(0, (progress.items?.[itemId] || 0) - 1) } };
    saveProgress(np);
    setShowItemPanel(false);
    playSound('heal');
  };

  const getBrawlReward = (eChar) => {
    if (!eChar) return 3;
    if (ADVANCED_BOSSES.some(b => b.id === eChar.id)) return 12;
    if (ADVANCED_MONSTERS.some(m => m.id === eChar.id)) return 6;
    if (BOSS_MONSTERS.some(b => b.id === eChar.id)) return 4;
    if (NORMAL_MONSTERS.some(m => m.id === eChar.id)) return 3;
    if (isT0Char(eChar)) return 8;
    if (VARIANTS.some(v => v.id === eChar.id)) return 6;
    return 4;
  };

  const handleDeath = (target) => {
    if (gameMode === 'story') {
      if (target === 'player') {
        playSound('defeat');
        setPlayer(prev => ({ ...prev, hp: prev.maxHp, energy: 0, shield: 0, status: [], buffs: { dmgMult: 1, extraDmg: 0, energyOnLoss: false }, permaBuffs: { ...prev.permaBuffs, turnCount: 0 } }));
        setEnemy(prev => ({ ...prev, hp: prev.maxHp, energy: prev.talents.includes('t3') ? 25 : 0, shield: 0, status: [], buffs: { dmgMult: 1, extraDmg: 0, atkReduction: 0, energyOnLoss: false }, permaBuffs: { ...prev.permaBuffs, turnCount: 0 } }));
        setLogs([{ text: '💪 不要放棄！繼續挑戰！', type: 'info' }]);
        return;
      } else {
        playSound('victory');
        let np = { ...progress };
        np.battlesWon = (np.battlesWon || 0) + 1;
        np.ap = (np.ap || 0) + 1;
        const earned = [3, 5, 10][storyBattleStage] ?? 5;
        np.crystals += earned;
        setRewardCrystals(earned);
        const nextStage = storyBattleStage + 1;
        if (nextStage < 3) {
          saveProgress(np);
          setStoryBattleStage(nextStage);
          startStoryBattle(storyChapterId, nextStage);
        } else {
          np.completedStoryChapters = [...new Set([...(np.completedStoryChapters || []), storyChapterId])];
          saveProgress(np);
          setGameState('story_victory');
        }
        return;
      }
    }
    if (gameMode === 'tutorial') {
        if (target === 'player') {
            setEnemy(prev => ({ ...prev, hp: TUTORIAL_ENEMY.stats.maxHp, shield: 0, status: [], energy: 0 }));
            setLogs(prev => [...prev, { text: '💪 別灰心！傀儡恢復了血量，繼續挑戰！', type: 'info' }]);
            return;
        }
        if (target === 'enemy') {
            playSound('victory');
            const np2 = { ...progress, crystals: (progress.crystals || 0) + 50, fragments: (progress.fragments || 0) + 50, tutorialDone: true };
            saveProgress(np2);
            setTutorialStep(8);
            return;
        }
    }
    let np = { ...progress };
    const isAdvanced = gameMode === 'advanced_campaign';
    const maxStage = isAdvanced ? 4 : 2;

    if (target === 'player') { playSound('defeat'); saveProgress(updateDailyQuestProgress('battle_any', np)); setGameState('game_over'); setWinner('enemy'); }
    else { playSound('victory');
        if (!enemy.char.isUncapturable && unlocks.includes('tamer_kert') && !captured.includes(enemy.char.id) && !enemy.char.baseId && !isT0Char(enemy.char)) { 
            np.captured = [...captured, enemy.char.id]; setNewlyCaptured(enemy.char); 
        }
        
        np.ap = (np.ap || 0) + 1;
        // 【V2.6 成就追蹤】戰鬥勝利次數
        np.battlesWon = (np.battlesWon || 0) + 1;

        if (gameMode.includes('campaign') && campaignStage === maxStage) {
            const bid = player.char.baseId || player.char.id;
            if (isBasicChar(player.char) || isT0Char(player.char) || bid === 'xiangxiang') { np.mastery = {...np.mastery}; np.mastery[bid] = Math.min(3, (np.mastery[bid] || 0) + 1); }
        }
        
        let earned = 0;
        if (isAdvanced) { earned = campaignStage < maxStage ? 8 : 20; }
        else if (gameMode === 'campaign') { earned = campaignStage < maxStage ? 3 : 8; }
        else { earned = getBrawlReward(enemy.char); }
        
        np.crystals += earned;
        // 消耗型武裝在最終勝利後消耗
        const isFinalWin = gameMode === 'brawl' || (gameMode.includes('campaign') && campaignStage === maxStage);
        if (isFinalWin && np.pendingConsumableArmor) {
            const cId = np.pendingConsumableArmor;
            np.consumableArmors = { ...np.consumableArmors, [cId]: Math.max(0, (np.consumableArmors[cId] || 1) - 1) };
            np.pendingConsumableArmor = null;
        }
        np = updateDailyQuestProgress('battle_any', np);
        np = updateDailyQuestProgress('battle_win', np);
        if (isFinalWin && gameMode === 'campaign') np = updateDailyQuestProgress('campaign_clear', np);
        saveProgress(np); setRewardCrystals(earned);
        if (gameMode.includes('campaign') && campaignStage < maxStage) { setAvailableRewards(shuffle([...REWARD_POOL]).slice(0, 3)); setGameState('select_reward'); }
        else { setGameState('game_over'); setWinner('player'); }
    }
  };

  const handleReward = (r) => {
    let prog = { ...progress }; 
    let np = r.apply(player, prog); 
    const ns = campaignStage + 1; const ne = campaignRoute[ns];
    if (!prog.encountered.includes(ne.id)) { prog.encountered.push(ne.id); }
    saveProgress(prog); 
    
    np.energy = Math.min(100, (np.permaBuffs?.startEnergy || 0) + (np.permaBuffs?.meal?.energy || 0) + (np.talents.includes('t3') ? 25 : 0) + (np.talents.some(t=>['t9','t10','t11'].includes(t)) ? 20 : 0));
    np.shield = (np.permaBuffs?.startShield || 0) + (np.talents.includes('t4') ? 80 : 0) + (np.permaBuffs?.meal?.shield || 0);
    np.status = [];
    if (np.permaBuffs?.meal?.regen) np.status.push({ type: 'REGEN', duration: 99, value: np.permaBuffs.meal.regen, isNew: false, isDeferred: false });
    np.buffs = { dmgMult: 1, extraDmg: 0, energyOnLoss: false };
    
    let pSeeds = np.talents.includes('t_elf') ? 2 : 0;
    if (np.talents.includes('t_harvest_elf')) pSeeds += 2;
    np.permaBuffs = { ...np.permaBuffs, seeds: (np.permaBuffs?.seeds || 0) + pSeeds };
    
    setPlayer(np); 
    setCampaignStage(ns); 
    
    let validETalents = ALL_TALENTS.filter(t => {
        if (t.req && !unlocks.includes(t.req)) return false;
        if (t.exclusiveTo) {
            const bId = ne.baseId || ne.id;
            if (bId !== t.exclusiveTo && ne.id !== t.exclusiveTo) return false;
        }
        return true;
    });
    let eT = getRandomTalents(getBaseTalents(ne), validETalents);
    let eMax = ne.stats.maxHp + (eT.includes('t1') ? 100 : 0);
    let eInitE = eT.includes('t3') ? 25 : 0; if (eT.some(t=>['t9','t10','t11'].includes(t))) eInitE += 20;
    
    let eSeeds = eT.includes('t_elf') ? 2 : 0;
    if (eT.includes('t_harvest_elf')) eSeeds += 2;
    if (ne.id === 'aldous') eInitE = Math.min(100, eInitE + 50);

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
        permaBuffs: { startEnergy: 0, startShield: 0, seeds: eSeeds, coins: 0, turnCount: 0 }
    };
    if (eT.includes('t_bear')) { const pool = shuffle(['ATK_UP', 'DEF_UP', 'REGEN']); eObj.status.push({ type: pool[0], duration: 3, value: 20, isNew: false, isDeferred: false }, { type: pool[1], duration: 3, value: 20, isNew: false, isDeferred: false }); }
    
    setEnemy(eObj);
    setBattleItemUses(3); setShowItemPanel(false);
    setLogs([{ text: `深淵的 ${ne.name} 出現了！`, type: 'system' }]);
    setGameState('battle');
  };

  const handleHomeActivity = (topic) => {
    if (!homeHost || !homeGuest) return;
    if (progress.ap < 1) { setSysError('AP 不足！請至夜巡或自訂對決中獲取行動點數。'); return; }
    
    let np = { ...progress, ap: progress.ap - 1 };
    const hId = homeHost.baseId || homeHost.id; const gId = homeGuest.baseId || homeGuest.id;
    const key = [hId, gId].sort().join('_');
    np.affection = {...np.affection};
    np.affection[key] = Math.min(20, (np.affection[key] || 0) + (homeGuest.prefAction === topic ? 3 : 1));
    
    if (topic === 'snack') {
        np.snackCount = (np.snackCount || 0) + 1;
    }
    saveProgress(np);
    
    const dialogs = {
      'gaming': { hostText: `深淵魔物開始躁動了，準備好去巡夜了嗎？`, guestReplies: { 'bear': '好啊！我來幫你們擋下襲擊！', 'wolf': '我負責觀察魔物弱點，你們專心斬殺。', 'cat': '喵... 沒有星晶貓條本小姐不幹！', 'human': '看我燃燒的大劍一刀斬斷深淵！', 'elf': '我會用聖光在後方護佑你們的～', 'xiangxiang': '吼... 剛輪完白班... 讓我再睡五分鐘...', 'kohaku': '看在金幣的面子上，我就陪你們活動一下筋骨吧。', 'aldous': '嗯...今夜的風，似乎透著一絲不尋常的氣息。', 'default': '(拿起了武器準備出發)' } },
      'snack': { hostText: `剛結束夜間討伐肚子好餓，火爐旁有留宵夜喔！`, guestReplies: { 'bear': '有蜂蜜嗎？加一點進去絕對好吃！', 'wolf': '清淡點的熱湯比較好消化。', 'cat': '喵嗚？不要想自己獨吞星晶碎屑！', 'human': '交給我！我用燃燒之刃幫你烤到七分熟！', 'elf': '我來為大家泡一杯安神花茶吧。', 'xiangxiang': '柯特的愛心宵夜... 吃飽才有力氣... 呼嚕...', 'kohaku': '哦？這食材的進貨管道是哪裡？說不定能做筆大生意。', 'aldous': '年輕人多吃點，老夫喝杯清茶足矣。', 'default': '(開心地接過分享的食物)' } },
      'chat': { hostText: `最近連續激戰有點累，星晶的干擾也讓人喘不過氣...`, guestReplies: { 'bear': '靠著我休息吧，我的毛皮很溫暖。', 'wolf': '如果你們累了，今晚我不介意守夜。', 'cat': '呼嚕呼嚕... 這個溫暖的位子歸我了！', 'human': '覺得寒氣重嗎？我放個火魔法取暖吧！', 'elf': '讓我施放治癒，緩解你身上的疲勞。', 'xiangxiang': '來抱抱吧，白虎的肚子很好抱的喔...', 'kohaku': '世上沒有什麼煩惱是星晶解決不了的，有的話，就是星晶不夠多。', 'aldous': '放下武器，凝神靜氣。黑夜終會過去，黎明必將到來。', 'default': '(靜靜地聆聽，陪伴在你身邊)' } }
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
    if (ent.permaBuffs?.coins > 0) bgs.push(<span key="coins" className="bg-yellow-700/80 text-yellow-100 border border-yellow-500 px-1.5 py-0.5 rounded shadow-md text-[10px]">🪙 商會金幣 x{ent.permaBuffs.coins}</span>);
    return bgs;
  };

  const synthesizeChar = (id) => {
    let np = { ...progress };
    np.charFragments = { ...np.charFragments };
    const reqFrags = 50;
    const currentFrags = np.charFragments[id] || 0;

    if (currentFrags >= reqFrags) {
        const excess = currentFrags - reqFrags;
        np.unlocks = [...np.unlocks, id];
        np.charFragments[id] = 0; 
        
        let msg = `✨ 合成成功！恭喜獲得新夥伴！\n`;
        if (excess > 0) {
            let ratio = 5; 
            if (isT0Char({id})) ratio = 50;
            else if (isVariantChar({id})) ratio = 20;

            const convertedFrags = excess * ratio;
            np.fragments = (np.fragments || 0) + convertedFrags;
            msg += `\n♻️ 溢出的 ${excess} 片專屬碎片，已套用尊榮匯率 (1:${ratio})，自動轉化為 ${convertedFrags} 個「通用星晶碎片」！`;
        }

        if (checkChristmasUnlock(np.unlocks)) {
            np.unlocks.push('christmas_xiangxiang');
            msg += `\n\n🎄 奇蹟發生了！集齊五件異裝，解鎖了【聖誕節虎吉】！`;
        }
        
        saveProgress(np);
        setSysInfo(msg);
    } else {
        setSysError('碎片數量不足，無法合成！');
    }
  };

  const upgradeCharCost = (id) => {
      if (['xiangxiang', 'kohaku', 'aldous', 'christmas_xiangxiang'].includes(id)) {
          setSysError('此角色已經登峰造極，無法進行潛能突破！');
          return;
      }

      let np = { ...progress };
      np.charFragments = { ...np.charFragments };
      np.charCostUpgrades = { ...np.charCostUpgrades };
      
      const currentFrags = np.charFragments[id] || 0;
      const currentUpgrades = np.charCostUpgrades[id] || 0;

      if (currentUpgrades >= 3) {
          setSysError('此角色已達到潛能強化上限！');
          return;
      }
      
      if (currentFrags >= 30) {
          np.charFragments[id] -= 30;
          np.charCostUpgrades[id] = currentUpgrades + 1;
          saveProgress(np);
          const charName = CHARACTERS.find(c => c.id === id)?.name || id;
          setSysInfo(`✨ 潛能突破成功！\n\n【${charName}】的專屬 Cost 上限增加了 1 點！\n(目前突破進度：${currentUpgrades + 1}/3)`);
      } else {
          setSysError('專屬碎片數量不足 (需要 30 片)，無法進行強化！');
      }
  };

  const ONE_TIME_CODES = {
      'STARTBONUS': { desc: '新手禮包 (100晶 + 5AP)', apply: (p) => { p.crystals += 100; p.ap += 5; } },
      'XIAOBU': { desc: '小布的餽贈 (200星晶碎片)', apply: (p) => { p.fragments = (p.fragments||0) + 200; } },
      // 節慶異裝系列
    'NEWYEAR': { 
        desc: '新年快樂！ (新年熊吉碎片x30)', 
        apply: (p) => { 
            p.charFragments = {...p.charFragments}; 
            p.charFragments['newyear_bear'] = (p.charFragments['newyear_bear'] || 0) + 30; 
        } 
    },
    'VALENTINE': { 
        desc: '濃情蜜意的餽贈 (情人節白澤碎片x30)', 
        apply: (p) => { 
            p.charFragments = {...p.charFragments}; 
            p.charFragments['valentine_wolf'] = (p.charFragments['valentine_wolf'] || 0) + 30; 
        } 
    },
    'HARVEST': { 
        desc: '感恩豐收的季節 (豐收節布布碎片x30)', 
        apply: (p) => { 
            p.charFragments = {...p.charFragments}; 
            p.charFragments['harvest_elf'] = (p.charFragments['harvest_elf'] || 0) + 30; 
        } 
    },
    'HALLOWEEN': { 
        desc: '不給糖就搗蛋！ (萬聖節布提婭碎片x30)', 
        apply: (p) => { 
            p.charFragments = {...p.charFragments}; 
            p.charFragments['halloween_cat'] = (p.charFragments['halloween_cat'] || 0) + 30; 
        } 
    },
    
    // 特殊/隱藏形態
    'BLACKFLAME_AWAKEN': { 
        desc: '深淵之火已然覺醒 (黑炎普爾斯碎片x30)', 
        apply: (p) => { 
            p.charFragments = {...p.charFragments}; 
            p.charFragments['blackflame_human'] = (p.charFragments['blackflame_human'] || 0) + 30; 
        } 
    }
  };

  const handleRedeemCode = () => {
      const code = cheatCode.trim().toUpperCase();
      let np = { ...progress };

      if (code === '315') { 
          np.crystals += 5000; 
          np.fragments = (np.fragments || 0) + 5000; 
          setSysInfo('✨ 星晶與碎片獲取成功！(無限測試碼) 💎💠'); 
          saveProgress(np); 
      }
      else if (code === '520') { 
          const pool = [...NORMAL_MONSTERS, ...BOSS_MONSTERS, ...ADVANCED_MONSTERS, ...ADVANCED_BOSSES].map(m=>m.id); 
          np.captured = [...new Set([...captured, ...pool])]; 
          np.encountered = [...new Set([...encountered, ...pool])]; 
          np.unlocks = [...new Set([...unlocks, 'xiangxiang', 'newyear_bear', 'harvest_elf', 'blackflame_human', 'valentine_wolf', 'halloween_cat', 'christmas_xiangxiang', 'kohaku', 'aldous'])]; 
          setSysInfo('🐾 全圖鑑收服！解鎖所有異裝、大獎與高階魔物！(無限測試碼) 🧧'); 
          saveProgress(np); 
      }
      else if (code === '828') {
          [...CHARACTERS.map(c=>c.id), 'xiangxiang'].forEach(id => { np.mastery = {...np.mastery}; np.mastery[id] = 3; });
          np.ap = 99;
          np.completedStoryChapters = [1, 2, 3, 4, 5];
          setSysInfo('🌟 全員專精 3 星、AP滿級、主線全章節解鎖！(無限測試碼)'); saveProgress(np);
      }
      else if (ONE_TIME_CODES[code]) {
          if (np.usedCodes.includes(code)) {
              setSysError('此兌換碼已經被使用過囉！');
          } else {
              ONE_TIME_CODES[code].apply(np);
              np.usedCodes = [...np.usedCodes, code];
              setSysInfo(`🎉 兌換成功！\n\n您獲得了：\n🎁 ${ONE_TIME_CODES[code].desc}`);
              saveProgress(np);
          }
      } 
      else {
          setSysError('無效的兌換碼！請檢查是否輸入正確。');
      }
      
      setShowCheat(false); 
      setCheatCode('');
  };

  // 【V2.6 成就領取系統】
  const claimAchievement = (ach) => {
      let np = { ...progress };
      np.claimedAchievements = [...np.claimedAchievements, ach.id];
      if (ach.reward > 0) np.crystals += ach.reward;
      if (ach.rewardIngredients) {
          const ing = { ...np.ingredients };
          Object.entries(ach.rewardIngredients).forEach(([id, qty]) => { ing[id] = (ing[id] || 0) + qty; });
          np.ingredients = ing;
      }
      saveProgress(np);
      const rewardText = ach.reward > 0 ? `💎 ${ach.reward} 星晶` : ach.rewardDesc || '食材獎勵';
      showToastMsg(`🏆 領取成就【${ach.name}】獎勵：${rewardText}！`);
  };

  // ========================== 礦坑系統函數 ==========================

  const getMineInfo = () => progress.mine || { lv: 1, workers: [], lastCollect: null, pending: 0 };

  const calcMinePending = (mine) => {
    const lvData = MINE_LEVELS[mine.lv - 1];
    if (!mine.workers || mine.workers.length === 0) return mine.pending || 0;
    const now = Date.now();
    const last = mine.lastCollect ? new Date(mine.lastCollect).getTime() : now;
    const elapsedHours = (now - last) / 3600000;
    let rate = lvData.baseRate;
    let capMultiplier = 1;
    let speedMultiplier = 1;
    mine.workers.forEach(charId => {
      const bonus = MINE_CHAR_BONUS[charId];
      if (!bonus) return;
      if (bonus.type === 'rate')     rate *= (1 + bonus.value);
      if (bonus.type === 'cap')      capMultiplier += bonus.value;
      if (bonus.type === 'cooldown') speedMultiplier += bonus.value;
      if (bonus.type === 'combo')    { rate *= (1 + bonus.rate); capMultiplier += bonus.cap; }
    });
    const cap = Math.floor(lvData.capBase * capMultiplier);
    const gained = Math.floor(elapsedHours * rate * speedMultiplier);
    return Math.min((mine.pending || 0) + gained, cap);
  };

  const getMineCapacity = (mine) => {
    const lvData = MINE_LEVELS[mine.lv - 1];
    let capMultiplier = 1;
    (mine.workers || []).forEach(charId => {
      const bonus = MINE_CHAR_BONUS[charId];
      if (bonus?.type === 'cap')   capMultiplier += bonus.value;
      if (bonus?.type === 'combo') capMultiplier += bonus.cap;
    });
    return Math.floor(lvData.capBase * capMultiplier);
  };

  const toggleMineWorker = (charId) => {
    const mine = getMineInfo();
    const lvData = MINE_LEVELS[mine.lv - 1];
    const currentPending = calcMinePending(mine);
    let newWorkers;
    if (mine.workers.includes(charId)) {
      newWorkers = mine.workers.filter(id => id !== charId);
    } else {
      if (mine.workers.length >= lvData.slots) {
        setSysError(`目前礦坑等級只有 ${lvData.slots} 個工作名額！`);
        return;
      }
      newWorkers = [...mine.workers, charId];
    }
    const np = { ...progress, mine: { ...mine, workers: newWorkers, pending: currentPending, lastCollect: new Date().toISOString() } };
    saveProgress(np);
  };

  const collectMine = () => {
    const mine = getMineInfo();
    const total = calcMinePending(mine);
    if (total <= 0) { showToastMsg('目前沒有可領取的碎片！'); return; }
    let catBonus = 0;
    if (mine.workers.includes('cat') && Math.random() < MINE_CHAR_BONUS.cat.value) {
      catBonus = Math.floor(total * 0.5);
      showToastMsg(`布提婭悄悄多摸了 ${catBonus} 顆碎片！`);
    }
    const gained = total + catBonus;
    let np = { ...progress, fragments: (progress.fragments || 0) + gained, mine: { ...mine, pending: 0, lastCollect: new Date().toISOString() } };
    np = updateDailyQuestProgress('mine_collect', np);
    saveProgress(np);
    showToastMsg(`⛏️ 領取了 ${gained} 顆星晶碎片！`);
  };

  const upgradeMine = () => {
    const mine = getMineInfo();
    if (mine.lv >= 5) { setSysError('礦坑已達滿級！'); return; }
    const lvData = MINE_LEVELS[mine.lv - 1];
    if (progress.crystals < lvData.upgradeCost) { setSysError(`星晶不足！需要 ${lvData.upgradeCost} 顆。`); return; }
    const currentPending = calcMinePending(mine);
    const np = { ...progress, crystals: progress.crystals - lvData.upgradeCost, mine: { ...mine, lv: mine.lv + 1, pending: currentPending, lastCollect: new Date().toISOString() } };
    saveProgress(np);
    showToastMsg(`⛏️ 礦坑升級至 Lv${mine.lv + 1}！`);
  };

  // ========================== 烹飪系統函數 ==========================

  const buyRecipe = (recipe) => {
    if (progress.unlockedRecipes.includes(recipe.id)) { showToastMsg('已擁有此食譜！'); return; }
    if (progress.crystals < recipe.cost) { setSysError(`星晶不足！需要 ${recipe.cost} 顆。`); return; }
    const np = { ...progress, crystals: progress.crystals - recipe.cost, unlockedRecipes: [...progress.unlockedRecipes, recipe.id] };
    saveProgress(np);
    showToastMsg(`📖 獲得食譜：${recipe.name}！`);
  };

  const buyIngredient = (ingId) => {
    const ing = INGREDIENTS.find(i => i.id === ingId);
    if (!ing) return;
    if ((progress.fragments || 0) < ing.cost) { setSysError(`碎片不足！需要 ${ing.cost} 顆。`); return; }
    const np = { ...progress, fragments: (progress.fragments || 0) - ing.cost, ingredients: { ...progress.ingredients, [ingId]: (progress.ingredients[ingId] || 0) + 1 } };
    saveProgress(np);
    showToastMsg(`🛒 購入 ${ing.icon} ${ing.name}！`);
  };

  const cookMeal = (recipe) => {
    if (progress.pendingMeal) { setSysError('你已有一道料理待生效，請先出戰使用！'); return; }
    for (const [ingId, qty] of Object.entries(recipe.ingredients)) {
      if ((progress.ingredients[ingId] || 0) < qty) {
        const ing = ALL_INGREDIENTS.find(i => i.id === ingId);
        setSysError(`食材不足！缺少 ${ing?.icon} ${ing?.name} x${qty - (progress.ingredients[ingId] || 0)}`);
        return;
      }
    }
    const newIngredients = { ...progress.ingredients };
    for (const [ingId, qty] of Object.entries(recipe.ingredients)) {
      newIngredients[ingId] = (newIngredients[ingId] || 0) - qty;
    }
    let np = { ...progress, ingredients: newIngredients, pendingMeal: recipe.id };
    np = updateDailyQuestProgress('cook', np);
    saveProgress(np);
    showToastMsg(`🍳 烹飪完成：${recipe.name}！下次戰鬥生效。`);
  };

  const discardMeal = () => {
    const np = { ...progress, pendingMeal: null };
    saveProgress(np);
    showToastMsg('料理已丟棄。');
  };

  // ========================== 每日任務 Helper ==========================

  const updateDailyQuestProgress = (trigger, np) => {
    const today = new Date().toISOString().slice(0, 10);
    const dqs = np.dailyQuestState;
    if (!dqs || dqs.date !== today) return np;
    const activeIds = getDailyQuestIds(today);
    const newProg = { ...dqs.progress };
    let changed = false;
    activeIds.forEach(id => {
      if (dqs.claimed.includes(id)) return;
      const quest = ALL_DAILY_QUESTS.find(q => q.id === id);
      if (!quest || quest.trigger !== trigger) return;
      if ((newProg[id] || 0) >= quest.target) return;
      newProg[id] = (newProg[id] || 0) + 1;
      changed = true;
    });
    return changed ? { ...np, dailyQuestState: { ...dqs, progress: newProg } } : np;
  };

  const claimDailyQuest = (questId) => {
    const today = new Date().toISOString().slice(0, 10);
    const dqs = progress.dailyQuestState;
    if (!dqs || dqs.date !== today) return;
    const quest = ALL_DAILY_QUESTS.find(q => q.id === questId);
    if (!quest || dqs.claimed.includes(questId)) return;
    if ((dqs.progress[questId] || 0) < quest.target) return;
    let np = { ...progress };
    if (quest.reward.crystals) np.crystals = (np.crystals || 0) + quest.reward.crystals;
    if (quest.reward.fragments) np.fragments = (np.fragments || 0) + quest.reward.fragments;
    if (quest.reward.ap) np.ap = (np.ap || 0) + quest.reward.ap;
    const newClaimed = [...dqs.claimed, questId];
    const activeIds = getDailyQuestIds(today);
    const allDone = activeIds.every(id => newClaimed.includes(id));
    const fcBonus = allDone && !dqs.fullClearClaimed;
    if (fcBonus) np.crystals += DAILY_QUEST_FULL_CLEAR.reward.crystals;
    np.dailyQuestState = { ...dqs, claimed: newClaimed, fullClearClaimed: dqs.fullClearClaimed || fcBonus };
    saveProgress(np);
    showToastMsg(`✅ ${quest.name}完成！獲得 ${quest.rewardDesc}`);
    if (fcBonus) setTimeout(() => showToastMsg('🎉 全勤達成！額外獲得 💎 50 星晶！'), 1500);
  };

  // ========================== 渲染函數區 ==========================

  const renderGarden = () => {
    const today = new Date().toISOString().slice(0, 10);
    const isNewDay = progress.gardenDate !== today;
    const plays = isNewDay ? { farm: 0, fishing: 0, hunting: 0, memory: 0 } : (progress.gardenPlays || { farm: 0, fishing: 0, hunting: 0, memory: 0 });
    const MAX = 3;
    const FISH_ZONE = { min: 35, max: 55 };

    const consumePlay = (tab, extraChanges = {}) => {
      const newPlays = { ...plays, [tab]: (plays[tab] || 0) + 1 };
      let np = { ...progress, gardenDate: today, gardenPlays: newPlays, ...extraChanges };
      np = updateDailyQuestProgress('garden_game', np);
      saveProgress(np);
    };

    const startFarm = () => { setFarmPhase('growing'); setFarmWaters(0); };
    const waterFarm = () => { const w = farmWaters + 1; setFarmWaters(w); if (w >= 3) setFarmPhase('ready'); };
    const harvestFarm = () => {
      const newIngredients = { ...progress.ingredients, [farmSeed]: (progress.ingredients[farmSeed] || 0) + 1 };
      consumePlay('farm', { ingredients: newIngredients });
      setFarmPhase('idle'); setFarmWaters(0);
      const ing = GARDEN_INGREDIENTS.find(i => i.id === farmSeed);
      showToastMsg(`✅ 收成了 ${ing.icon} ${ing.name} ×1！`);
    };

    const startFishing = () => { setFishPhase('casting'); setFishBarPos(0); setFishResult(null); fishDirRef.current = 1; };
    const castRod = () => {
      if (fishPhase !== 'casting') return;
      const success = fishBarPos >= FISH_ZONE.min && fishBarPos <= FISH_ZONE.max;
      setFishResult(success ? 'success' : 'miss');
      setFishPhase('result');
      if (success) {
        const newIngredients = { ...progress.ingredients, rare_fish: (progress.ingredients.rare_fish || 0) + 1 };
        consumePlay('fishing', { ingredients: newIngredients });
        showToastMsg('✅ 釣到了 🐡 深淵幻魚 ×1！');
      } else {
        consumePlay('fishing');
      }
    };

    const startHunt = () => { setHuntPhase('hunting'); setHuntScore(0); setHuntTime(20); };
    const hitTarget = (id) => { setHuntTargets(prev => prev.filter(t => t.id !== id)); setHuntScore(prev => prev + 1); };
    const claimHuntReward = () => {
      const newIng = { ...progress.ingredients };
      if (huntScore >= 5) { newIng.prime_meat = (newIng.prime_meat || 0) + 1; newIng.golden_egg = (newIng.golden_egg || 0) + 1; }
      else if (huntScore >= 3) { newIng.prime_meat = (newIng.prime_meat || 0) + 1; }
      consumePlay('hunting', { ingredients: newIng });
      setHuntPhase('idle');
    };

    const MEM_PAIRS = [
      { pairId: 0, icon: '🐻' }, { pairId: 1, icon: '🐺' }, { pairId: 2, icon: '🐱' }, { pairId: 3, icon: '🧑‍🚒' },
      { pairId: 4, icon: '🧚' }, { pairId: 5, icon: '🦊' }, { pairId: 6, icon: '🦉' }, { pairId: 7, icon: '🐊' },
    ];
    const startMemory = () => {
      const shuffled = shuffle([...MEM_PAIRS, ...MEM_PAIRS].map((c, i) => ({ ...c, cardIdx: i })));
      setMemCards(shuffled); setMemFlipped([]); setMemMatched([]); setMemMoves(0); setMemTime(60); setMemPhase('playing');
    };
    const flipCard = (idx) => {
      if (memFlipped.length >= 2 || memFlipped.includes(idx) || memMatched.includes(memCards[idx].pairId)) return;
      setMemFlipped(prev => [...prev, idx]);
      setMemMoves(prev => prev + 1);
    };
    const claimMemReward = () => {
      if (memMatched.length === 8) {
        const bonus = memMoves <= 12 ? 30 : memMoves <= 20 ? 20 : 10;
        const newPlays = { ...plays, memory: (plays.memory || 0) + 1 };
        saveProgress({ ...progress, crystals: progress.crystals + bonus, gardenDate: today, gardenPlays: newPlays });
        showToastMsg(`🎉 配對成功！獲得 💎 ${bonus} 星晶！`);
      } else {
        consumePlay('memory');
      }
      setMemPhase('idle');
    };

    const tabs = [
      { id: 'farm',    label: '種植園',   icon: '🌱', color: 'green'  },
      { id: 'fishing', label: '釣魚池',   icon: '🎣', color: 'blue'   },
      { id: 'hunting', label: '魔物狩獵', icon: '⚔️', color: 'red'    },
      { id: 'memory',  label: '記憶翻牌', icon: '🃏', color: 'purple' },
    ];
    const tabColor = { green: 'bg-green-700', blue: 'bg-blue-700', red: 'bg-red-700', purple: 'bg-purple-700' };
    const tabBorder = { green: 'border-green-600', blue: 'border-blue-600', red: 'border-red-600', purple: 'border-purple-600' };

    return (
      <div className="min-h-screen p-6 bg-stone-950 text-stone-200">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setGameState('intro')} className="mb-6 flex items-center gap-2 text-stone-400 hover:text-white transition-colors"><ArrowLeft /> 返回首頁</button>

          <NpcDialogue
            npcName="莊園管理員 · 莉莉"
            npcImage={null}
            npcImageFallback="🌻"
            dialogues={[
              "歡迎來到悠活莊園！在這裡可以種菜、釣魚、狩獵、翻牌，每日各 3 次哦！",
              "高級食材只有莊園才能取得，料理效果比普通食材強大許多！",
              "種植園：澆三次水就能收成蔬菜或靈菇。",
              "釣魚池：把握時機按下收竿，綠色區域才算命中！",
              "魔物狩獵：20秒內點擊魔物擊倒牠們，三隻以上有獎勵！",
              "記憶翻牌：找出所有配對，步數越少星晶越多！",
            ]}
          />

          {/* 高級食材庫存 */}
          <div className="bg-stone-800/50 rounded-2xl border border-stone-700 p-4 mb-5">
            <div className="text-xs font-bold text-yellow-400 mb-2">📦 高級食材庫存</div>
            <div className="flex flex-wrap gap-2">
              {GARDEN_INGREDIENTS.map(ing => (
                <div key={ing.id} className="flex items-center gap-1.5 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-700 text-sm">
                  <span>{ing.icon}</span>
                  <span className="text-stone-300 text-xs">{ing.name}</span>
                  <span className="text-yellow-300 font-bold">×{progress.ingredients[ing.id] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tab bar */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setGardenTab(tab.id)}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all flex flex-col items-center gap-0.5 border-2 ${gardenTab === tab.id ? `${tabColor[tab.color]} text-white border-transparent shadow-lg` : `bg-stone-800 text-stone-400 hover:bg-stone-700 ${plays[tab.id] >= MAX ? 'opacity-50' : ''} border-stone-700`}`}>
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className="text-[10px] opacity-70">{plays[tab.id] || 0}/{MAX}</span>
              </button>
            ))}
          </div>

          {/* ---- 種植園 ---- */}
          {gardenTab === 'farm' && (
            <div className="bg-stone-800 rounded-3xl border border-stone-700 p-6 shadow-xl">
              <h3 className="text-xl font-bold text-green-400 mb-1">🌱 種植園</h3>
              <p className="text-stone-400 text-xs mb-5">選擇作物 → 澆水3次 → 收成，獲得高級食材。每日 {MAX} 次。</p>
              {plays.farm >= MAX ? (
                <div className="text-center py-10 text-stone-500">今日種植次數已用完，明天再來吧！🌙</div>
              ) : farmPhase === 'idle' ? (
                <div>
                  <p className="text-sm text-stone-300 mb-4">選擇想種植的作物：</p>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[{ id: 'veggie', name: '晨露嫩蔬', icon: '🥬', desc: '富含清晨靈氣的嫩蔬' }, { id: 'rare_mush', name: '星晶靈菇', icon: '🍄', desc: '吸收星晶能量的珍稀菇' }].map(s => (
                      <button key={s.id} onClick={() => setFarmSeed(s.id)}
                        className={`p-4 rounded-2xl border-2 transition-all text-left ${farmSeed === s.id ? 'border-green-500 bg-green-900/20' : 'border-stone-700 bg-stone-900 hover:border-stone-500'}`}>
                        <div className="text-3xl mb-2">{s.icon}</div>
                        <div className="font-bold text-sm text-white">{s.name}</div>
                        <div className="text-xs text-stone-400 mt-1">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                  <button onClick={startFarm} className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95">
                    🌱 開始種植
                  </button>
                </div>
              ) : farmPhase === 'growing' ? (
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-bounce">{farmSeed === 'veggie' ? '🥬' : '🍄'}</div>
                  <p className="text-stone-300 font-bold mb-5">作物正在生長，請澆水 3 次！</p>
                  <div className="flex justify-center gap-3 mb-6">
                    {[0, 1, 2].map(i => (
                      <div key={i} className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl ${i < farmWaters ? 'border-blue-500 bg-blue-900/40 text-white' : 'border-stone-600 bg-stone-900 text-stone-600'}`}>
                        {i < farmWaters ? '✓' : '💧'}
                      </div>
                    ))}
                  </div>
                  <button onClick={waterFarm} className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-10 py-3 rounded-xl transition-all active:scale-95 text-lg">
                    💧 澆水 ({farmWaters}/3)
                  </button>
                </div>
              ) : farmPhase === 'ready' ? (
                <div className="text-center">
                  <div className="text-7xl mb-4 animate-bounce">{farmSeed === 'veggie' ? '🥬' : '🍄'}</div>
                  <p className="text-green-400 font-bold text-xl mb-2">✨ 作物成熟了！</p>
                  <p className="text-stone-400 text-sm mb-6">可以收成囉！</p>
                  <button onClick={harvestFarm} className="bg-yellow-600 hover:bg-yellow-500 text-stone-900 font-bold px-10 py-3 rounded-xl text-lg transition-all active:scale-95">
                    🌾 收成！
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* ---- 釣魚池 ---- */}
          {gardenTab === 'fishing' && (
            <div className="bg-stone-800 rounded-3xl border border-stone-700 p-6 shadow-xl">
              <h3 className="text-xl font-bold text-blue-400 mb-1">🎣 釣魚池</h3>
              <p className="text-stone-400 text-xs mb-5">指針進入🟩綠色區域時按下收竿，釣起深淵幻魚！每日 {MAX} 次。</p>
              {plays.fishing >= MAX ? (
                <div className="text-center py-10 text-stone-500">今日釣魚次數已用完，明天見！🌙</div>
              ) : fishPhase === 'idle' ? (
                <div className="text-center">
                  <div className="text-6xl mb-6">🎣</div>
                  <p className="text-stone-400 text-sm mb-4">觀察移動指針，在綠色區域時按下收竿！</p>
                  <button onClick={startFishing} className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-xl text-lg transition-all active:scale-95">
                    🎣 拋竿！
                  </button>
                </div>
              ) : fishPhase === 'casting' ? (
                <div>
                  <p className="text-center text-stone-300 font-bold mb-4">指針進入🟩區域時，按下收竿！</p>
                  <div className="relative w-full h-14 bg-stone-900 rounded-xl overflow-hidden border border-stone-700 mb-6 select-none">
                    <div className="absolute top-0 bottom-0 bg-green-700/50 border-x-2 border-green-500" style={{ left: `${FISH_ZONE.min}%`, width: `${FISH_ZONE.max - FISH_ZONE.min}%` }}></div>
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-stone-600 pointer-events-none">← →</div>
                    <div className="absolute top-2 bottom-2 w-3 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.9)]"
                      style={{ left: `calc(${fishBarPos}% - 6px)`, transition: 'none' }}></div>
                  </div>
                  <button onClick={castRod} className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-800 text-white font-bold py-4 rounded-xl text-xl transition-colors">
                    🎣 收竿！
                  </button>
                </div>
              ) : fishPhase === 'result' ? (
                <div className="text-center">
                  <div className={`text-6xl mb-4 ${fishResult === 'success' ? 'animate-bounce' : ''}`}>{fishResult === 'success' ? '🐡' : '💦'}</div>
                  <p className={`text-xl font-bold mb-2 ${fishResult === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {fishResult === 'success' ? '✅ 釣到深淵幻魚了！' : '❌ 落空了…'}
                  </p>
                  <p className="text-stone-400 text-sm mb-6">
                    {fishResult === 'success' ? '獲得 🐡 深淵幻魚 ×1！' : '下次要準確一點！'}
                    {plays.fishing + 1 < MAX && ` (剩餘 ${MAX - plays.fishing - 1} 次)`}
                  </p>
                  <button onClick={() => { setFishPhase('idle'); setFishResult(null); }} className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-xl transition-all active:scale-95">
                    {plays.fishing + 1 < MAX ? '再試一次' : '結束釣魚'}
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* ---- 魔物狩獵 ---- */}
          {gardenTab === 'hunting' && (
            <div className="bg-stone-800 rounded-3xl border border-stone-700 p-6 shadow-xl">
              <h3 className="text-xl font-bold text-red-400 mb-1">⚔️ 魔物狩獵</h3>
              <p className="text-stone-400 text-xs mb-5">20秒內點擊魔物將其擊倒，3隻獲精肉，5隻以上再加金卵！每日 {MAX} 次。</p>
              {plays.hunting >= MAX ? (
                <div className="text-center py-10 text-stone-500">今日狩獵次數已用完，明天見！🌙</div>
              ) : huntPhase === 'idle' ? (
                <div className="text-center">
                  <div className="text-5xl mb-4">⚔️</div>
                  <div className="bg-stone-900 rounded-xl p-4 text-sm mb-6 text-left inline-block">
                    <div className="text-stone-300 mb-1">🏅 <span className="text-green-400 font-bold">3 隻以上</span>：🍗 魔獸精肉 ×1</div>
                    <div className="text-stone-300">🏆 <span className="text-yellow-400 font-bold">5 隻以上</span>：🍗 ×1 + 🪺 金晶巨卵 ×1</div>
                  </div>
                  <br />
                  <button onClick={startHunt} className="bg-red-700 hover:bg-red-600 text-white font-bold px-8 py-3 rounded-xl text-lg transition-all active:scale-95">
                    ⚔️ 開始狩獵！
                  </button>
                </div>
              ) : huntPhase === 'hunting' ? (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-stone-300 font-bold text-sm">擊倒：<span className="text-yellow-400">{huntScore}</span> 隻</span>
                    <span className={`font-bold text-lg ${huntTime <= 5 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>⏱ {huntTime}s</span>
                  </div>
                  <div className="relative w-full bg-stone-900 rounded-2xl border border-stone-700 overflow-hidden" style={{ height: '260px' }}>
                    {huntTargets.map(t => (
                      <button key={t.id} onClick={() => hitTarget(t.id)}
                        className="absolute text-3xl hover:scale-125 active:scale-75 transition-transform cursor-pointer select-none leading-none"
                        style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%,-50%)' }}>
                        {t.emoji}
                      </button>
                    ))}
                    {huntTargets.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-stone-600 text-sm">等待魔物出現...</div>}
                  </div>
                </div>
              ) : huntPhase === 'result' ? (
                <div className="text-center">
                  <div className="text-6xl mb-4">{huntScore >= 5 ? '🏆' : huntScore >= 3 ? '✅' : '😔'}</div>
                  <p className="text-xl font-bold text-yellow-400 mb-2">狩獵結束！擊倒 {huntScore} 隻</p>
                  <div className="bg-stone-900 rounded-xl p-4 mb-6 text-sm">
                    {huntScore >= 5 && <p className="text-green-400">🍗 魔獸精肉 ×1 + 🪺 金晶巨卵 ×1 獲得！</p>}
                    {huntScore >= 3 && huntScore < 5 && <p className="text-green-400">🍗 魔獸精肉 ×1 獲得！</p>}
                    {huntScore < 3 && <p className="text-stone-500">未達獎勵（需擊倒 3 隻以上）</p>}
                  </div>
                  <button onClick={claimHuntReward} className="bg-red-700 hover:bg-red-600 text-white font-bold px-8 py-3 rounded-xl transition-all active:scale-95">領取獎勵</button>
                </div>
              ) : null}
            </div>
          )}

          {/* ---- 記憶翻牌 ---- */}
          {gardenTab === 'memory' && (
            <div className="bg-stone-800 rounded-3xl border border-stone-700 p-6 shadow-xl">
              <h3 className="text-xl font-bold text-purple-400 mb-1">🃏 記憶翻牌</h3>
              <p className="text-stone-400 text-xs mb-5">翻開全部8組配對，60秒內完成可獲得星晶獎勵！每日 {MAX} 次。</p>
              {plays.memory >= MAX ? (
                <div className="text-center py-10 text-stone-500">今日翻牌次數已用完，明天見！🌙</div>
              ) : memPhase === 'idle' ? (
                <div className="text-center">
                  <div className="text-5xl mb-4">🃏</div>
                  <div className="bg-stone-900 rounded-xl p-4 text-sm mb-6 text-left inline-block">
                    <div className="text-stone-300 mb-1">≤ 12步：<span className="text-yellow-400 font-bold">💎 30 星晶</span></div>
                    <div className="text-stone-300 mb-1">≤ 20步：<span className="text-yellow-400 font-bold">💎 20 星晶</span></div>
                    <div className="text-stone-300">21步以上：<span className="text-yellow-400 font-bold">💎 10 星晶</span></div>
                  </div>
                  <br />
                  <button onClick={startMemory} className="bg-purple-700 hover:bg-purple-600 text-white font-bold px-8 py-3 rounded-xl text-lg transition-all active:scale-95">
                    🃏 開始翻牌！
                  </button>
                </div>
              ) : memPhase === 'playing' ? (
                <div>
                  <div className="flex justify-between items-center mb-4 text-sm">
                    <span className="text-stone-300 font-bold">步數：<span className="text-white">{memMoves}</span></span>
                    <span className="text-stone-300 font-bold">配對：<span className="text-green-400">{memMatched.length}</span>/8</span>
                    <span className={`font-bold ${memTime <= 10 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>⏱ {memTime}s</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {memCards.map((card, idx) => {
                      const isFlipped = memFlipped.includes(idx);
                      const isMatched = memMatched.includes(card.pairId);
                      return (
                        <button key={idx} onClick={() => flipCard(idx)}
                          className={`aspect-square rounded-xl border-2 text-2xl flex items-center justify-center transition-all select-none ${isMatched ? 'border-green-500 bg-green-900/40 cursor-default' : isFlipped ? 'border-purple-500 bg-purple-900/40' : 'border-stone-600 bg-stone-900 hover:border-stone-400 active:scale-95'}`}>
                          {isFlipped || isMatched ? card.icon : '❓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : memPhase === 'result' ? (
                <div className="text-center">
                  <div className="text-6xl mb-4">{memMatched.length === 8 ? '🎉' : '⏰'}</div>
                  <p className={`text-xl font-bold mb-2 ${memMatched.length === 8 ? 'text-green-400' : 'text-red-400'}`}>
                    {memMatched.length === 8 ? '全部配對成功！' : '時間到了！'}
                  </p>
                  {memMatched.length === 8 && (
                    <p className="text-yellow-400 font-bold text-lg mb-2">💎 {memMoves <= 12 ? 30 : memMoves <= 20 ? 20 : 10} 星晶 獲得！</p>
                  )}
                  <p className="text-stone-400 text-sm mb-6">使用了 {memMoves} 步，配對 {memMatched.length}/8 組</p>
                  <button onClick={claimMemReward} className="bg-purple-700 hover:bg-purple-600 text-white font-bold px-8 py-3 rounded-xl transition-all active:scale-95">
                    {memMatched.length === 8 ? '領取星晶！' : '確認'}
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* 高級食譜提示 */}
          <div className="mt-5 bg-stone-900/60 rounded-2xl border border-stone-700 p-4">
            <p className="text-xs font-bold text-yellow-400 mb-3">🍽️ 絕品食譜（前往星晶商店 → 食譜商店解鎖）</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {RECIPES.filter(r => r.grade === '絕品').map(r => (
                <div key={r.id} className="bg-stone-800 rounded-xl p-3 border border-yellow-900/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{r.icon}</span>
                    <span className="font-bold text-sm text-white">{r.name}</span>
                    <span className="text-[9px] bg-yellow-700 text-yellow-100 px-1.5 py-0.5 rounded-full font-bold ml-auto">{r.grade}</span>
                  </div>
                  <div className="text-xs text-stone-400 mb-1">
                    {Object.entries(r.ingredients).map(([id, qty]) => {
                      const ing = GARDEN_INGREDIENTS.find(i => i.id === id);
                      return ing ? <span key={id} className="mr-2">{ing.icon}{ing.name}×{qty}</span> : null;
                    })}
                  </div>
                  <div className="text-xs text-green-400">{r.buff.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  };

  const renderIntro = () => {
    const isAdvancedUnlocked = Object.values(progress.mastery || {}).some(lvl => lvl >= 3);

    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center bg-stone-950 text-stone-200 relative overflow-hidden">
          <div className="absolute top-10 left-10 text-yellow-500/10"><Moon size={120} /></div>
          <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-8 tracking-widest text-center z-10 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">⚔️ 星晶物語：獸之夜行者 ⚔️</h1>
          <div className="w-full max-w-4xl mb-8 z-10">
              <div className="w-full h-48 md:h-72 bg-stone-900 border-2 border-stone-800 rounded-3xl overflow-hidden shadow-2xl relative flex items-center justify-center mb-6">
                  <img src="title_cg.png" alt="" className="w-full h-full object-cover absolute inset-0 opacity-80" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <div className="bg-stone-800/60 p-6 rounded-2xl border border-stone-700 text-stone-300 text-sm leading-relaxed relative mt-4">
                  <div className="absolute -top-3 -left-3 bg-indigo-900 border border-indigo-500 text-indigo-200 px-3 py-1 rounded-lg text-xs font-bold transform -rotate-2 shadow-lg">PROLOGUE</div>
                  <p className="mb-3 mt-2">「艾歐蘭斯」——由五大元素維持平衡的奇幻大陸。然而，天際的「大星晶」於某夜驟然碎裂，化為無數以太星晶散落各地。</p>
                  <p className="mb-3">受到星晶能量的污染，原本溫馴的生物發生異變。每當<span className="text-purple-400 font-bold">夜幕低垂</span>，這些具備強大攻擊性的「狂化魔物」便會出沒肆虐。</p>
                  <p>白晝，我們在營地休養生息；夜晚，我們化身為<span className="text-yellow-400 font-bold">獸之夜行者</span>，踏上討伐深淵與奪回星晶的旅途......</p>
              </div>
          </div>
          <div className="flex gap-4 mb-6 z-10 font-bold text-lg flex-wrap justify-center">
              <div className="bg-stone-800 border border-stone-700 px-6 py-2 rounded-full shadow-lg text-blue-300">💎 星晶：{progress.crystals}</div>
              <div className="bg-stone-800 border border-stone-700 px-6 py-2 rounded-full shadow-lg text-cyan-300">💠 碎片：{progress.fragments || 0}</div>
              <div className="bg-stone-800 border border-stone-700 px-6 py-2 rounded-full shadow-lg text-green-400">⚡ AP：{progress.ap}</div>
          </div>
          {isLoaded && !progress.tutorialDone && (
              <div className="w-full max-w-4xl mb-4 z-10 animate-pulse">
                  <button onClick={startTutorial} className="w-full bg-yellow-600 hover:bg-yellow-500 text-stone-900 font-bold py-3 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-base transition-all active:scale-95 border-2 border-yellow-400">
                      <span className="text-xl">📖</span> 新手？點我開始互動教學！ <span className="text-xl">⚔️</span>
                  </button>
              </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl mb-8 z-10">
              {/* 主線夜巡 - 佔滿第一行 */}
              <button onClick={() => setGameState('story_chapters')} className="col-span-2 md:col-span-3 bg-stone-800 p-5 border-2 border-indigo-900 hover:border-indigo-500 rounded-2xl shadow-lg flex items-center justify-between transition-all active:scale-95 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-indigo-900/10 group-hover:bg-indigo-900/20 pointer-events-none transition-colors"></div>
                  <div className="flex items-center gap-4 z-10">
                      <div className="text-4xl">📖</div>
                      <div className="text-left">
                          <h2 className="text-xl font-bold text-indigo-300 mb-0.5">主線夜巡</h2>
                          <p className="text-stone-400 text-xs">跟隨故事推進，解開大星晶碎裂的真相。</p>
                      </div>
                  </div>
                  <div className="z-10 text-indigo-400 text-xs font-bold">{(progress.completedStoryChapters||[]).length} / {STORY_CHAPTERS.length} 章</div>
              </button>

              {/* 夜巡戰役 */}
              {(() => { const ok = (progress.completedStoryChapters||[]).includes(5); return (
              <button onClick={() => ok ? selectMode('campaign') : setSysError('【章節鎖定】請先完成主線夜巡第五章，解鎖夜巡戰役！')} className={`bg-stone-800 p-4 border-2 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center ${ok ? 'border-stone-700 hover:border-yellow-500' : 'border-stone-800 opacity-60 grayscale cursor-not-allowed'}`}>
                  <div className="text-3xl mb-2">{ok ? '🗺️' : <Lock className="text-stone-500" size={32}/>}</div>
                  <h2 className={`text-lg font-bold mb-1 ${ok ? '' : 'text-stone-500'}`}>{ok ? '夜巡戰役' : '🔒 夜巡戰役'}</h2>
                  <p className="text-stone-400 text-[10px] hidden md:block">連續討伐，挑戰深淵霸主。</p>
              </button>
              ); })()}

              {/* 自訂對決 */}
              {(() => { const ok = (progress.completedStoryChapters||[]).includes(5); return (
              <button onClick={() => ok ? selectMode('brawl') : setSysError('【章節鎖定】請先完成主線夜巡第五章，解鎖自訂對決！')} className={`bg-stone-800 p-4 border-2 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center ${ok ? 'border-stone-700 hover:border-blue-500' : 'border-stone-800 opacity-60 grayscale cursor-not-allowed'}`}>
                  <div className="text-3xl mb-2">{ok ? '🤺' : <Lock className="text-stone-500" size={32}/>}</div>
                  <h2 className={`text-lg font-bold mb-1 ${ok ? '' : 'text-stone-500'}`}>{ok ? '自訂對決' : '🔒 自訂對決'}</h2>
                  <p className="text-stone-400 text-[10px] hidden md:block">自選對手切磋，強敵獎勵更豐厚。</p>
              </button>
              ); })()}

              {/* 白晝營地 */}
              <button onClick={() => { setGameState('home'); setHomeStep('select_host'); setHomeHost(null); setHomeGuest(null); setActiveDialogue(null); }} className="bg-stone-800 p-4 border-2 border-stone-700 hover:border-green-500 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center">
                  <div className="text-3xl mb-2"><Home className="text-green-400" size={32}/></div>
                  <h2 className="text-lg font-bold mb-1">白晝營地</h2>
                  <p className="text-stone-400 text-[10px] hidden md:block">消耗 AP，培養角色羈絆。</p>
              </button>
              <button onClick={() => { setGameState('shop'); setShopTab('crystal'); }} className="bg-stone-800 p-4 border-2 border-stone-700 hover:border-cyan-500 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center">
                  <div className="text-3xl mb-2">💎</div>
                  <h2 className="text-lg font-bold mb-1">星晶商店</h2>
                  <p className="text-stone-400 text-[10px] hidden md:block">購買物資情報與碎片。</p>
              </button>
              <div className="relative">
              <button onClick={() => { setGameState('gacha'); setGachaResult(null); }} className="w-full bg-stone-800 p-4 border-2 border-stone-700 hover:border-purple-500 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center">
                  <div className="text-3xl mb-2">🍻</div>
                  <h2 className="text-lg font-bold mb-1">迷途酒館</h2>
                  <p className="text-stone-400 text-[10px] hidden md:block">花費星晶招募夥伴碎片。</p>
              </button>
              {(() => { const today=new Date().toISOString().slice(0,10); const dqs=progress.dailyQuestState; if(!dqs||dqs.date!==today) return null; const ids=getDailyQuestIds(today); const hasClaimable=ids.some(id=>{const q=ALL_DAILY_QUESTS.find(x=>x.id===id);return q&&(dqs.progress[id]||0)>=q.target&&!dqs.claimed.includes(id);}); return hasClaimable?<span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping pointer-events-none"></span>:null; })()}
              </div>
              <button onClick={() => setGameState('mine')} className="bg-stone-800 p-4 border-2 border-stone-700 hover:border-yellow-600 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center">
                  <div className="text-3xl mb-2">⛏️</div>
                  <h2 className="text-lg font-bold mb-1">星晶礦坑</h2>
                  <p className="text-stone-400 text-[10px] hidden md:block">掛機採集，自動產出碎片。</p>
              </button>
              <button onClick={() => setGameState('forge')} className="bg-stone-800 p-4 border-2 border-stone-700 hover:border-purple-600 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center">
                  <div className="text-3xl mb-2">🔨</div>
                  <h2 className="text-lg font-bold mb-1">鍛造工坊</h2>
                  <p className="text-stone-400 text-[10px] hidden md:block">用碎片打造戰鬥武裝。</p>
              </button>
              <button onClick={() => { let np = updateDailyQuestProgress('visit_garden', { ...progress }); if (np !== progress) saveProgress(np); setGameState('garden'); }} className="bg-stone-800 p-4 border-2 border-stone-700 hover:border-emerald-500 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center">
                  <div className="text-3xl mb-2">🌿</div>
                  <h2 className="text-lg font-bold mb-1">悠活莊園</h2>
                  <p className="text-stone-400 text-[10px] hidden md:block">種植釣魚狩獵，取得高級食材。</p>
              </button>

              {/* 征戰夜巡 - 最後 */}
              <button onClick={() => {
                  if (isAdvancedUnlocked) selectMode('advanced_campaign');
                  else setSysError('【權限不足】請先將任意一位角色的「專精等級」提升至 3 星 (完成普通夜巡3次)，以證明你有足夠的實力面對深淵的真正面貌！');
              }} className={`col-span-2 md:col-span-1 bg-stone-800 p-4 border-2 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center relative overflow-hidden ${isAdvancedUnlocked ? 'border-red-900 hover:border-red-500' : 'border-stone-800 opacity-60 grayscale cursor-not-allowed'}`}>
                  {isAdvancedUnlocked && <div className="absolute inset-0 bg-red-900/10 pointer-events-none"></div>}
                  <div className="text-3xl mb-2">
                      {isAdvancedUnlocked ? <Skull className="text-red-500" size={32} /> : <Lock className="text-stone-500" size={32} />}
                  </div>
                  <h2 className={`text-lg font-bold mb-1 ${isAdvancedUnlocked ? 'text-red-400' : 'text-stone-500'}`}>
                      {isAdvancedUnlocked ? '征戰夜巡' : '🔒 征戰夜巡'}
                  </h2>
                  <p className={`${isAdvancedUnlocked ? 'text-red-400/60' : 'text-stone-500'} text-[10px] hidden md:block`}>高階 5 連戰，更高回報。</p>
                  {!isAdvancedUnlocked && <div className="text-[9px] text-yellow-500 font-bold mt-1">需1名3星專精角色</div>}
              </button>
          </div>
          <div className="flex items-center gap-4 z-10">
              <div className="relative">
                  <button onClick={() => setGameState('gallery')} className="flex items-center gap-2 text-stone-400 hover:text-white bg-stone-800 px-6 py-3 rounded-full border border-stone-700 transition-all hover:shadow-lg"><BookOpen size={20}/> 艾歐蘭斯圖鑑</button>
                  {(ACHIEVEMENTS.some(a => a.getProgress(progress) >= a.target && !(progress.claimedAchievements||[]).includes(a.id)) || (isFullGallery(captured) && !unlocks.includes('xiangxiang'))) && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping pointer-events-none"></span>
                  )}
              </div>
              <div className="relative flex items-center">
                  <button onClick={() => setShowCheat(!showCheat)} className="text-stone-700 hover:text-stone-400 text-xl transition-colors bg-stone-800 p-3 rounded-full border border-stone-700 shadow-md">🎁</button>
                  {showCheat && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-stone-800 p-3 rounded-xl shadow-2xl flex gap-2 border border-stone-600 z-50 animate-fade-in w-max">
                          <input type="text" value={cheatCode} onChange={e=>setCheatCode(e.target.value)} className="w-36 bg-stone-900 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 uppercase" placeholder="輸入兌換碼" />
                          <button onClick={handleRedeemCode} className="bg-yellow-600 hover:bg-yellow-500 text-stone-900 px-4 py-2 rounded-lg text-sm font-bold shadow-lg active:scale-95 transition-transform">兌換</button>
                      </div>
                  )}
              </div>
              <button onClick={() => { setSettingsOpen(true); setResetStep(0); setResetInput(''); }} className="text-stone-600 hover:text-stone-300 transition-colors bg-stone-800 p-3 rounded-full border border-stone-700 shadow-md" title="設定"><Settings size={20}/></button>
          </div>

          {settingsOpen && (
              <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => { setSettingsOpen(false); setResetStep(0); setResetInput(''); }}>
                  <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-5">
                          <h2 className="text-lg font-bold text-stone-200 flex items-center gap-2"><Settings size={18}/> 設定</h2>
                          <button className="text-stone-500 hover:text-white text-xl leading-none" onClick={() => { setSettingsOpen(false); setResetStep(0); setResetInput(''); }}>✕</button>
                      </div>

                      {resetStep === 0 && (
                          <button onClick={() => setResetStep(1)} className="w-full bg-stone-800 hover:bg-red-950 border border-stone-700 hover:border-red-700 text-red-400 font-bold py-3 px-4 rounded-xl transition-all flex items-center gap-3">
                              <Trash2 size={18}/> 重置遊戲進度
                          </button>
                      )}

                      {resetStep === 1 && (
                          <div className="space-y-4">
                              <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-sm text-red-300 leading-relaxed">
                                  <p className="font-bold text-red-400 mb-2">⚠️ 警告</p>
                                  <p>此操作將清除<span className="font-bold text-white">所有遊戲進度</span>，包含星晶、角色、解鎖內容，且<span className="font-bold text-red-400">無法還原</span>。</p>
                                  <p className="mt-2">確定要繼續嗎？</p>
                              </div>
                              <div className="flex gap-3">
                                  <button onClick={() => setResetStep(0)} className="flex-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 font-bold py-2 rounded-xl transition-all">取消</button>
                                  <button onClick={() => setResetStep(2)} className="flex-1 bg-red-900 hover:bg-red-800 border border-red-700 text-red-200 font-bold py-2 rounded-xl transition-all">我確定，繼續</button>
                              </div>
                          </div>
                      )}

                      {resetStep === 2 && (
                          <div className="space-y-4">
                              <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-sm text-red-300">
                                  <p className="mb-3">請在下方輸入 <span className="font-mono font-bold text-white bg-stone-800 px-2 py-0.5 rounded">RESET</span> 以確認重置：</p>
                                  <input
                                      type="text"
                                      value={resetInput}
                                      onChange={e => setResetInput(e.target.value.toUpperCase())}
                                      placeholder="輸入 RESET"
                                      className="w-full bg-stone-900 border border-stone-600 focus:border-red-500 text-white font-mono font-bold text-center text-lg px-4 py-2 rounded-lg focus:outline-none tracking-widest"
                                      autoFocus
                                  />
                              </div>
                              <div className="flex gap-3">
                                  <button onClick={() => { setResetStep(0); setResetInput(''); }} className="flex-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 font-bold py-2 rounded-xl transition-all">取消</button>
                                  <button
                                      disabled={resetInput !== 'RESET'}
                                      onClick={() => {
                                          localStorage.removeItem('starCrystalTales_V38_Stable');
                                          window.location.reload();
                                      }}
                                      className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed border border-red-600 text-white font-bold py-2 rounded-xl transition-all"
                                  >
                                      確認重置
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          )}
      </div>
    );
  };

  const renderSelectChar = () => {
    let list = CHARACTERS.filter(c => !isT0Char(c) || unlocks.includes(c.id));
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
                    const isT0 = isT0Char(c);
                    const isVariant = isVariantChar(c);
                    return (
                        <div key={c.id} onClick={()=>{
                            if (player.char?.id !== c.id) setSelectedTalentIds([]); 
                            setPlayer({...player, char: c});
                        }} className={`relative overflow-hidden bg-stone-800 p-6 rounded-3xl border-2 transition-all cursor-pointer ${player.char?.id === c.id ? 'border-yellow-500 scale-105 shadow-xl' : 'border-stone-700 opacity-80 hover:border-stone-500'}`}>
                            {isVariant && <div className="absolute top-0 right-0 bg-stone-600 px-3 py-1 rounded-bl-xl text-[10px] font-bold z-10 shadow-md">✨ 異裝</div>}
                            {isMonster && <div className="absolute top-0 right-0 bg-green-600 px-3 py-1 rounded-bl-xl text-[10px] font-bold z-10 shadow-md">🐾 已馴化</div>}
                            {isHidden && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 shadow-md">🌟 終極獎勵</div>}
                            {isT0 && !isHidden && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 shadow-md">🌟 傳說級</div>}
                            
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
    const baseId = player.char.baseId || player.char.id;
    const specificUpgrade = progress.charCostUpgrades?.[baseId] || 0;
    const max = getBaseTalents(player.char) + (progress.maxTalents - 3) + specificUpgrade;
    const pLeft = max - cost;
    
    return (
        <div className="min-h-screen p-8 max-w-4xl mx-auto flex flex-col items-center bg-stone-900 text-stone-200">
            <button onClick={()=>setGameState(gameMode === 'story' ? 'story_select_char' : 'select_char')} className="self-start mb-4 flex items-center gap-2 text-stone-400 hover:text-white"><ArrowLeft/> {gameMode === 'story' ? '返回角色選擇' : '返回選角'}</button>
            <h2 className="text-3xl font-bold text-yellow-400 mb-2 mt-4">配置戰鬥天賦</h2>
            <div className="bg-stone-800 px-6 py-3 rounded-full font-bold text-lg mb-8 border border-stone-700 shadow-lg">
                剩餘點數：<span className={pLeft === 0 ? 'text-red-400' : 'text-yellow-400'}>{pLeft}</span> / {max}
                {specificUpgrade > 0 && <span className="ml-2 text-xs text-blue-400 bg-stone-900 px-2 py-1 rounded-full border border-blue-900/50">突破加成 +{specificUpgrade}</span>}
                {isT0Char(player.char) && <span className="ml-2 text-xs text-yellow-500 bg-stone-900 px-2 py-1 rounded-full border border-yellow-900/50">出廠滿潛能</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-10">
                {getAvailableTalents().map(t => {
                    const sel = selectedTalentIds.includes(t.id); 
                    const dis = !sel && pLeft < t.cost;
                    return <div key={t.id} onClick={() => !dis && toggleTalent(t.id)} className={`p-4 border-2 rounded-xl flex items-center gap-4 transition-all ${sel ? 'bg-blue-900/40 border-blue-500 shadow-md' : dis ? 'opacity-50 border-stone-800' : 'bg-stone-800 border-stone-700 hover:border-stone-500 cursor-pointer'}`}>
                        <div className="text-3xl">{t.icon}</div><div><div className="font-bold text-white">{t.name} <span className="text-[10px] bg-stone-700 px-2 py-0.5 rounded-full ml-2 text-stone-300 border border-stone-600">Cost {t.cost}</span></div><div className="text-xs text-stone-400 mt-1 leading-relaxed">{t.desc}</div></div>
                    </div>
                })}
            </div>
            
            {gameMode === 'brawl' ? (
                <button onClick={() => setGameState('select_brawl_enemy')} className="bg-purple-600 text-white px-16 py-4 rounded-full font-bold text-xl hover:bg-purple-500 shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"><Sparkles size={24}/> 選擇切磋對手</button>
            ) : gameMode === 'story' ? (
                <button onClick={() => startStoryBattle(storyChapterId, storyBattleStage)} className="bg-red-700 hover:bg-red-600 text-white px-16 py-4 rounded-full font-bold text-xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2">
                    ⚔️ 出陣！
                </button>
            ) : (
                <button onClick={() => startBattleMode(player.char, selectedTalentIds)} className={`${gameMode === 'advanced_campaign' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-yellow-600 hover:bg-yellow-500 text-stone-900'} px-16 py-4 rounded-full font-bold text-xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2`}>
                    {gameMode === 'advanced_campaign' ? <Skull size={24}/> : null} 踏入黑夜！
                </button>
            )}
        </div>
    );
  };

  const renderSelectBrawlEnemy = () => {
    let pool = CHARACTERS.filter(c => !isT0Char(c) || unlocks.includes(c.id));
    if (unlocks.includes('xiangxiang')) pool.push(HIDDEN_CHARACTER);
    VARIANTS.forEach(v => { if (unlocks.includes(v.id) && !v.isPlaceholder) pool.push(v); });
    pool = [...pool, ...NORMAL_MONSTERS.filter(m => encountered.includes(m.id)), ...BOSS_MONSTERS.filter(m => encountered.includes(m.id))];
    pool = [...pool, ...ADVANCED_MONSTERS.filter(m => encountered.includes(m.id)), ...ADVANCED_BOSSES.filter(m => encountered.includes(m.id))];

    return (
        <div className="min-h-screen p-8 bg-stone-900 text-stone-200">
            <button onClick={()=>setGameState('select_talent')} className="mb-8 flex items-center gap-2 text-stone-400 hover:text-white transition-colors"><ArrowLeft/> 返回天賦配置</button>
            <h2 className="text-3xl font-bold text-yellow-400 mb-8 text-center">選擇切磋對手</h2>
            
            <div className="max-w-4xl mx-auto mb-10">
                <button onClick={() => startBattleMode(player.char, selectedTalentIds, 'random')} className="w-full bg-stone-800 hover:bg-purple-900 text-purple-400 hover:text-white py-6 rounded-3xl font-bold text-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 border-2 border-stone-700 hover:border-purple-500">
                    <Sparkles /> 隨機遭遇未知的強敵！<span className="text-sm font-normal text-stone-400">（依對手類型給予 3～12 💎）</span> <Sparkles />
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {pool.map(c => {
                    const isBoss = BOSS_MONSTERS.some(b=>b.id===c.id) || ADVANCED_BOSSES.some(b=>b.id===c.id);
                    const reward = getBrawlReward(c);
                    return (
                    <div key={c.id} onClick={() => startBattleMode(player.char, selectedTalentIds, c)} className={`bg-stone-800 p-4 rounded-xl border-2 transition-all hover:-translate-y-1 cursor-pointer flex items-center gap-4 shadow-md ${isBoss ? 'border-red-900/50 hover:border-red-500' : 'border-stone-700 hover:border-blue-500'}`}>
                        <SpriteAvatar char={c} size="w-12 h-12" />
                        <div>
                            <div className={`font-bold text-sm truncate w-24 ${isBoss ? 'text-red-400' : 'text-stone-200'}`}>{c.name}</div>
                            <div className="text-[10px] text-stone-500 font-mono">HP {c.stats.maxHp} | ATK {c.stats.atk}</div>
                            <div className="text-[10px] text-blue-400 font-bold mt-0.5">💎 勝利 +{reward}</div>
                        </div>
                    </div>
                )})}
            </div>
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

    const tutHL = (...steps) => tutorialStep > 0 && steps.includes(tutorialStep)
        ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-stone-950 transition-all'
        : '';

    const TUTORIAL_MSGS = {
        1: { title: '⚔️ 歡迎來到夜行者訓練場！', body: '我是教官，讓我帶你熟悉艾歐蘭斯的戰鬥規則。先認識一下你的對手吧！', btn: '開始', next: 2 },
        2: { title: '👆 這是你的對手', body: '注意牠的血量（紅色血條）和能量（黃色能量條）。你的目標是把對手的血量打到 0！', btn: '知道了', next: 3 },
        3: { title: '✊ 選擇你的手勢出拳！', body: '石頭 ✊ 剋 剪刀 ✌️　剪刀 ✌️ 剋 布 🖐️　布 🖐️ 剋 石頭 ✊\n試著出任意一拳！', btn: null, next: 4 },
        4: { title: '📊 看看結果！', body: '✅ 贏了 → 對敵造成傷害　❌ 輸了 → 自己受傷　🤝 平手 → 雙方各獲得能量 ⚡\n能量是使用技能的關鍵！', btn: '知道了', next: 5 },
        5: { title: '⚡ 技能系統', body: '左側「戰技」和「奧義」在能量足夠時亮起。合適時機使用可以大幅扭轉戰局！', btn: '明白了', next: 6 },
        6: { title: '🔍 查看敵方情報', body: '長按敵方頭像可以查看牠的出拳偏好、技能說明，這是預判行動的關鍵資訊！', btn: '好的', next: 7 },
        7: { title: '🏆 教學完成！', body: '用你學到的知識打倒訓練魔傀儡，完成你的第一場勝利！', btn: null, next: null },
    };

    const TutorialOverlay = () => {
        if (tutorialStep === 0 || tutorialStep === 8) return null;
        const msg = TUTORIAL_MSGS[tutorialStep];
        if (!msg) return null;
        const isActionStep = tutorialStep === 3 || tutorialStep === 7;
        const posClass = isActionStep ? 'top-12' : 'bottom-0';
        return (
            <div className={`fixed inset-x-0 ${posClass} z-50 p-2 pointer-events-none`}>
                <div className="max-w-3xl mx-auto bg-stone-900/95 border border-yellow-500/60 rounded-xl shadow-2xl pointer-events-auto">
                    <div className={`flex items-center gap-2 ${isActionStep ? 'px-3 py-2' : 'p-4'}`}>
                        {isActionStep ? (
                            <>
                                <span className="text-yellow-400 text-xs font-bold shrink-0">{msg.title}</span>
                                <span className="text-stone-400 text-xs truncate">{msg.body.split('\n')[0]}</span>
                                <button onClick={() => setTutorialStep(tutorialStep === 3 ? 4 : 0)} className="ml-auto shrink-0 text-stone-500 hover:text-white text-base leading-none px-1">✕</button>
                            </>
                        ) : (
                            <>
                                <div className="flex-1">
                                    <div className="font-bold text-yellow-400 text-sm mb-1">{msg.title}</div>
                                    <div className="text-stone-300 text-xs leading-relaxed whitespace-pre-line">{msg.body}</div>
                                </div>
                                {msg.btn && (
                                    <button onClick={() => setTutorialStep(msg.next)} className="shrink-0 bg-yellow-500 hover:bg-yellow-400 text-stone-900 font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg">
                                        {msg.btn} →
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex gap-1 mt-3">
                        {[1,2,3,4,5,6,7].map(s => (
                            <div key={s} className={`h-1 flex-1 rounded-full ${s <= tutorialStep ? 'bg-yellow-400' : 'bg-stone-700'}`} />
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const TutorialReward = () => {
        if (tutorialStep !== 8) return null;
        return (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-stone-900 border-2 border-yellow-500 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
                    <div className="text-5xl mb-3">🎉</div>
                    <h2 className="text-xl font-bold text-yellow-400 mb-2">訓練完成！</h2>
                    <p className="text-stone-300 text-sm mb-4 leading-relaxed">你已掌握夜行者的基礎戰鬥技巧！<br/>以下是給你的入門獎勵：</p>
                    <div className="bg-stone-800 border border-yellow-600 rounded-xl py-3 mb-3 flex items-center justify-center gap-2">
                        <span className="text-2xl">💎</span>
                        <span className="text-yellow-400 font-bold text-xl">× 50 星晶</span>
                    </div>
                    <div className="bg-stone-800 border border-cyan-600 rounded-xl py-3 mb-5 flex items-center justify-center gap-2">
                        <span className="text-2xl">💠</span>
                        <span className="text-cyan-400 font-bold text-xl">× 50 碎片</span>
                    </div>
                    <p className="text-stone-400 text-xs mb-5">現在可以前往商店購買天賦，或到酒館招募夥伴碎片！</p>
                    <div className="flex flex-col gap-2">
                        <button onClick={() => { setTutorialStep(0); setGameState('shop'); setShopTab('crystal'); }} className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95">💎 前往星晶商店</button>
                        <button onClick={() => { setTutorialStep(0); setGameState('gacha'); setGachaResult(null); }} className="w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95">🍻 前往迷途酒館</button>
                        <button onClick={() => { setTutorialStep(0); setGameState('intro'); }} className="w-full bg-stone-700 hover:bg-stone-600 text-stone-300 font-bold py-2.5 rounded-xl transition-all active:scale-95">返回首頁</button>
                    </div>
                </div>
            </div>
        );
    };

    const startLongPress = (inspectData) => (e) => {
        longPressDetectedRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
            longPressDetectedRef.current = true;
            setBattleInspect(inspectData);
        }, 500);
    };
    const endLongPress = () => {
        if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
    };
    const lpProps = (inspectData) => ({
        onMouseDown: startLongPress(inspectData),
        onTouchStart: startLongPress(inspectData),
        onMouseUp: endLongPress,
        onMouseLeave: endLongPress,
        onTouchEnd: endLongPress,
        onTouchCancel: endLongPress,
    });

    const BattleInspectModal = () => {
        if (!battleInspect) return null;
        const { type } = battleInspect;
        const isEnemy = type === 'enemy';
        const isPlayer = type === 'player';
        const isSkill = type === 'skill1' || type === 'skill2';
        const char = isEnemy ? enemy.char : player.char;
        const skill = type === 'skill1' ? player.char.skill1 : player.char.skill2;
        const skillCost = type === 'skill1' ? skill1Cost : skill2Cost;

        return (
            <div className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center p-4" onClick={() => setBattleInspect(null)}>
                <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl mb-2" onClick={e => e.stopPropagation()}>
                    {(isEnemy || isPlayer) && (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <SpriteAvatar char={char} size="w-14 h-14" />
                                <div className="flex-1">
                                    <div className={`font-bold text-base ${isEnemy ? 'text-red-400' : 'text-green-400'}`}>{char.name}</div>
                                    <div className="text-[10px] text-stone-400">{char.title || ''}{char.element ? ` · ${char.element.name}` : ''}</div>
                                </div>
                                <button className="text-stone-500 hover:text-white text-lg leading-none" onClick={() => setBattleInspect(null)}>✕</button>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                                <div className="bg-stone-800 rounded-lg p-2"><div className={`font-bold ${isEnemy ? 'text-red-400' : 'text-green-400'}`}>HP</div><div>{isEnemy ? char.stats?.maxHp : player.maxHp}</div></div>
                                <div className="bg-stone-800 rounded-lg p-2"><div className="font-bold text-orange-400">ATK</div><div>{isEnemy ? char.stats?.atk : player.atk}</div></div>
                                <div className="bg-stone-800 rounded-lg p-2"><div className="font-bold text-blue-400">DEF</div><div>{isEnemy ? char.stats?.def : player.def}</div></div>
                            </div>
                            {isEnemy && char.prefHand && (
                                <div className="bg-stone-800 rounded-xl p-3 mb-3">
                                    <div className="text-yellow-400 font-bold text-xs mb-2">出拳偏好</div>
                                    <div className="flex gap-2">
                                        {Object.values(RPS_CHOICES).map(h => (
                                            <div key={h.id} className={`flex-1 rounded-lg p-2 text-center text-xs ${h.id === char.prefHand ? 'bg-yellow-600/30 border border-yellow-500' : 'bg-stone-700'}`}>
                                                <div className="text-xl">{h.icon}</div>
                                                <div>{h.name}</div>
                                                <div className={`font-bold ${h.id === char.prefHand ? 'text-yellow-300' : 'text-stone-400'}`}>{h.id === char.prefHand ? '50%' : '25%'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2 mb-3">
                                <div className="bg-blue-900/40 border border-blue-800 rounded-lg p-2 text-xs">
                                    <div className="flex items-center gap-2 mb-1"><span className="font-bold text-blue-300">戰技 · {char.skill1.name}</span><span className="text-stone-500">{isEnemy ? char.skill1.cost : skill1Cost}E</span></div>
                                    <p className="text-stone-300">{char.skill1.desc}</p>
                                </div>
                                <div className="bg-purple-900/40 border border-purple-800 rounded-lg p-2 text-xs">
                                    <div className="flex items-center gap-2 mb-1"><span className="font-bold text-purple-300">奧義 · {char.skill2.name}</span><span className="text-stone-500">{isEnemy ? char.skill2.cost : skill2Cost}E</span></div>
                                    <p className="text-stone-300">{char.skill2.desc}</p>
                                </div>
                            </div>
                            {char.lore && <p className="text-stone-500 text-[10px] italic leading-relaxed mb-3">{char.lore}</p>}
                            {isEnemy && enemy.talents && enemy.talents.length > 0 && (
                                <div className="bg-stone-800 rounded-xl p-3">
                                    <div className="text-yellow-400 font-bold text-xs mb-2">裝備天賦</div>
                                    <div className="flex flex-col gap-1.5">
                                        {enemy.talents.map(tid => {
                                            const t = ALL_TALENTS.find(t => t.id === tid);
                                            if (!t) return null;
                                            return (
                                                <div key={tid} className="flex items-center gap-2 text-xs">
                                                    <span>{t.icon}</span>
                                                    <span className="text-stone-200 font-bold">{t.name}</span>
                                                    <span className="text-stone-400">{t.desc}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {isPlayer && player.talents && player.talents.length > 0 && (
                                <div className="bg-stone-800 rounded-xl p-3 mb-2">
                                    <div className="text-yellow-400 font-bold text-xs mb-2">裝備天賦</div>
                                    <div className="flex flex-col gap-1.5">
                                        {player.talents.map(tid => {
                                            const t = ALL_TALENTS.find(t => t.id === tid);
                                            if (!t) return null;
                                            return (
                                                <div key={tid} className="flex items-center gap-2 text-xs">
                                                    <span>{t.icon}</span>
                                                    <span className="text-stone-200 font-bold">{t.name}</span>
                                                    <span className="text-stone-400">{t.desc}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {isPlayer && player.permaBuffs?.meal && Object.values(player.permaBuffs.meal).some(v => v > 0) && (
                                <div className="bg-stone-800 rounded-xl p-3">
                                    <div className="text-green-400 font-bold text-xs mb-2">🍽️ 料理加成中</div>
                                    <div className="flex flex-col gap-1 text-xs text-stone-300">
                                        {player.permaBuffs.meal.hp > 0 && <div>❤️ 最大 HP +{player.permaBuffs.meal.hp}</div>}
                                        {player.permaBuffs.meal.atk > 0 && <div>⚔️ 攻擊 +{player.permaBuffs.meal.atk}</div>}
                                        {player.permaBuffs.meal.shield > 0 && <div>🛡️ 初始護盾 +{player.permaBuffs.meal.shield}</div>}
                                        {player.permaBuffs.meal.energy > 0 && <div>⚡ 初始能量 +{player.permaBuffs.meal.energy}</div>}
                                        {player.permaBuffs.meal.regen > 0 && <div>💚 每回合再生 +{player.permaBuffs.meal.regen}</div>}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {isSkill && (
                        <>
                            <div className="flex items-center justify-between mb-3">
                                <div className={`font-bold text-base ${type === 'skill1' ? 'text-blue-300' : 'text-purple-300'}`}>{type === 'skill1' ? '戰技' : '奧義'} · {skill.name}</div>
                                <button className="text-stone-500 hover:text-white text-lg leading-none" onClick={() => setBattleInspect(null)}>✕</button>
                            </div>
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${type === 'skill1' ? 'bg-blue-700' : 'bg-purple-700'}`}>{skillCost} 能量</div>
                            <p className="text-stone-200 text-sm leading-relaxed">{skill.desc}</p>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen p-4 flex flex-col max-w-3xl mx-auto h-screen bg-stone-950 text-stone-200">
            <div className="flex items-center justify-between mb-2 gap-2">
                <div className="text-xs text-stone-500 font-bold truncate">
                    {gameMode === 'tutorial' ? '📖 新手訓練場' : gameMode === 'campaign' ? `夜巡戰役 - 第 ${campaignStage + 1} 戰` : gameMode === 'advanced_campaign' ? `征戰夜巡 - 第 ${campaignStage + 1} 戰 (高階)` : gameMode === 'story' ? `${STORY_CHAPTERS.find(c=>c.id===storyChapterId)?.name || '主線夜巡'} · 第 ${storyBattleStage + 1}/3 戰` : '自訂對決'}
                </div>
                <div className="flex gap-2 shrink-0">
                    <button onClick={() => setShowItemPanel(true)} className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition-colors select-none ${battleItemUses > 0 ? 'bg-stone-900 border-stone-700 text-stone-400 hover:bg-stone-700 hover:text-white' : 'bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed'}`}>
                        🎒 道具<span className={`text-[9px] ml-0.5 font-bold ${battleItemUses > 0 ? 'text-yellow-500' : 'text-stone-700'}`}>{battleItemUses}/3</span>
                    </button>
                    {gameMode !== 'tutorial' && (
                        <button onClick={() => {
                            if (gameMode === 'story') setGameState('story_chapters');
                            else if (gameMode === 'brawl') setGameState('intro');
                            else setGameState('select_char');
                        }} className="flex items-center gap-1 text-[11px] bg-stone-900 hover:bg-red-950 border border-stone-800 hover:border-red-900 text-stone-500 hover:text-red-400 px-2.5 py-1 rounded-lg transition-colors select-none">
                            <ArrowLeft size={11}/> 撤退
                        </button>
                    )}
                </div>
            </div>
            
            <div className={`p-4 rounded-xl mb-2 flex items-center gap-4 bg-stone-900 border-2 ${enemy.char.element.border} relative overflow-hidden shadow-lg ${tutHL(2)}`}>
                <div className={`relative cursor-pointer select-none shrink-0 rounded-full ${tutHL(6)}`} {...lpProps({ type: 'enemy' })}>
                    <SpriteAvatar char={enemy.char} size="w-20 h-20 md:w-24 md:h-24" />
                    <div className="absolute -bottom-1 -right-1 bg-stone-700 text-stone-300 text-[9px] font-bold px-1 py-0.5 rounded-full border border-stone-600 leading-none">長按</div>
                </div>
                <div className="flex-1 z-10">
                    <div className="flex justify-between font-bold text-red-400 mb-1"><span className="truncate">{enemy.char.isEmoji?enemy.char.emoji:enemy.char.icon} {enemy.char.name}</span><span className="text-[10px] bg-stone-800 px-2 rounded">HP {enemy.hp}/{enemy.maxHp}</span></div>
                    <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden relative"><div className="h-full bg-red-600 transition-all" style={{width:`${(enemy.hp/enemy.maxHp)*100}%`}}></div>{enemy.shield>0 && <div className="absolute top-0 left-0 h-full bg-blue-400/50" style={{width:`${(enemy.shield/enemy.maxHp)*100}%`}}></div>}</div>
                    <div className="flex items-center gap-2 mt-1"><Zap size={12} className="text-yellow-400"/><div className="w-full h-2 bg-stone-800 rounded-full"><div className="h-full bg-yellow-400 transition-all" style={{width:`${enemy.energy}%`}}></div></div><span className="text-[10px] text-yellow-400 font-mono shrink-0">{enemy.energy}</span></div>
                    <div className="flex flex-wrap gap-1 mt-2">{renderBadges(enemy)}</div>
                </div>
            </div>

            <div className="flex-1 bg-stone-900 border border-stone-800 p-4 rounded-xl overflow-y-auto mb-3 text-sm space-y-2 font-mono shadow-inner">
                {logs.length === 0 && <div className="text-stone-500 text-center mt-10">預判敵方的行動吧！</div>}
                {logs.map((l,i) => <div key={i} className={l.type==='damage'?'text-orange-400':l.type==='heal'?'text-green-300':l.type==='shield'?'text-blue-300':'text-stone-300'}>{l.text}</div>)}
                <div ref={logsEndRef} />
            </div>
            
            <div className="bg-stone-900 border-2 border-stone-700 p-4 rounded-xl relative overflow-hidden shadow-lg">
                <div className="flex gap-4 mb-4">
                <div className="relative cursor-pointer select-none shrink-0" {...lpProps({ type: 'player' })}>
                    <SpriteAvatar char={player.char} size="w-16 h-16 md:w-20 md:h-20" />
                    <div className="absolute -bottom-1 -right-1 bg-stone-700 text-stone-300 text-[9px] font-bold px-1 py-0.5 rounded-full border border-stone-600 leading-none">長按</div>
                </div>
                    <div className="flex-1 z-10">
                        <div className="flex justify-between font-bold text-green-400 mb-1"><span className="truncate">{player.char.isEmoji?player.char.emoji:player.char.icon} {player.char.name} (你)</span><span className="text-[10px] bg-stone-800 px-2 rounded">HP {player.hp}/{player.maxHp}</span></div>
                        <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden relative"><div className="h-full bg-green-500 transition-all" style={{width:`${(player.hp/player.maxHp)*100}%`}}></div>{player.shield>0 && <div className="absolute top-0 left-0 h-full bg-blue-400/50" style={{width:`${(player.shield/player.maxHp)*100}%`}}></div>}</div>
                        <div className="flex items-center gap-2 mt-1"><Zap size={12} className="text-yellow-400"/><div className="w-full h-2 bg-stone-800 rounded-full"><div className="h-full bg-yellow-400 transition-all" style={{width:`${player.energy}%`}}></div></div><span className="text-[10px] text-yellow-400 font-mono shrink-0">{player.energy}</span></div>
                        <div className="flex flex-wrap gap-1 mt-2">{renderBadges(player)}</div>
                    </div>
                </div>
                <div className="grid grid-cols-5 gap-2 relative z-10">
                    <div className={`col-span-2 flex flex-col gap-2 ${tutHL(5)}`}>
                        <button disabled={!canUseSkill1} onClick={()=>{ if(!longPressDetectedRef.current) handlePlayerSkill(1); longPressDetectedRef.current=false; }} {...lpProps({ type: 'skill1' })} className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 p-2 rounded-lg font-bold text-[11px] flex justify-between items-center shadow-md transition-colors select-none"><span>{player.char.skill1.name}</span><span className="bg-stone-900/50 px-1.5 py-0.5 rounded text-white">{skill1Cost}E</span></button>
                        <button disabled={!canUseSkill2} onClick={()=>{ if(!longPressDetectedRef.current) handlePlayerSkill(2); longPressDetectedRef.current=false; }} {...lpProps({ type: 'skill2' })} className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 p-2 rounded-lg font-bold text-[11px] flex justify-between items-center shadow-md transition-colors select-none"><span>{player.char.skill2.name}</span><span className="bg-stone-900/50 px-1.5 py-0.5 rounded text-white">{skill2Cost}E</span></button>
                    </div>
                    <div className={`col-span-3 grid grid-cols-3 gap-2 ${tutHL(3)}`}>
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
            <BattleInspectModal />
            {showItemPanel && (
                <div className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center p-4" onClick={() => setShowItemPanel(false)}>
                    <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl mb-2" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="font-bold text-white flex items-center gap-2">🎒 使用道具 <span className="text-xs text-yellow-400 bg-stone-800 px-2 py-0.5 rounded-full border border-stone-700">剩餘 {battleItemUses}/3 次</span></div>
                            <button className="text-stone-500 hover:text-white text-lg leading-none" onClick={() => setShowItemPanel(false)}>✕</button>
                        </div>
                        {BATTLE_ITEMS.every(bi => !(progress.items?.[bi.id] > 0)) ? (
                            <p className="text-stone-500 text-sm text-center py-4">背包是空的，前往商店打工區製作道具吧！</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {BATTLE_ITEMS.map(bi => {
                                    const count = progress.items?.[bi.id] || 0;
                                    if (count <= 0) return null;
                                    return (
                                        <div key={bi.id} className="flex items-center justify-between bg-stone-800 rounded-xl p-3 border border-stone-700">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{bi.icon}</span>
                                                <div>
                                                    <div className="font-bold text-sm text-stone-100">{bi.name} <span className="text-stone-500 text-xs">×{count}</span></div>
                                                    <div className="text-xs text-stone-400">{bi.effect}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleUseItem(bi.id)} disabled={battleItemUses <= 0}
                                                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${battleItemUses > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}>
                                                使用
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
            <TutorialOverlay />
            <TutorialReward />
        </div>
    );
  };

  const renderHome = () => {
    let hosts = CHARACTERS.filter(c => !isT0Char(c) || unlocks.includes(c.id)); 
    if(unlocks.includes('xiangxiang')) hosts.push(HIDDEN_CHARACTER);
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

                        <div className="bg-stone-900 min-h-[120px] p-6 rounded-xl flex flex-col justify-end text-sm italic text-stone-400 shadow-inner mb-6">
                            {activeDialogue ? (<><div className="text-green-400 text-left mb-3 bg-green-900/20 p-3 rounded-lg border border-green-900/50 max-w-[80%] self-start">「{activeDialogue.host}」</div><div className="text-yellow-400 text-right bg-stone-700/30 p-3 rounded-lg border border-stone-700/50 max-w-[80%] self-end">「{activeDialogue.guest}」</div></>) : "消耗 AP 互動以揭曉故事..."}
                        </div>
                        {/* 烹飪系統 */}
                        <div className="bg-stone-900 border border-stone-700 rounded-2xl p-5 mb-6 shadow-inner">
                          <h3 className="text-base font-bold text-orange-400 mb-3 flex items-center gap-2">🍳 篝火料理台
                            {progress.pendingMeal && <span className="text-xs bg-orange-700 text-white px-2 py-0.5 rounded-full animate-pulse ml-2">待生效</span>}
                          </h3>
                          {progress.pendingMeal ? (() => {
                            const meal = RECIPES.find(r => r.id === progress.pendingMeal);
                            return meal ? (
                              <div className="flex items-center justify-between bg-stone-800 p-4 rounded-xl border border-orange-700/50">
                                <div className="flex items-center gap-3">
                                  <span className="text-3xl">{meal.icon}</span>
                                  <div>
                                    <div className="font-bold text-orange-300">{meal.name}</div>
                                    <div className="text-xs text-stone-400 mt-0.5">{meal.buff.desc}</div>
                                  </div>
                                </div>
                                <button onClick={discardMeal} className="text-xs text-red-400 hover:text-red-300 border border-red-800 px-3 py-1.5 rounded-lg transition-colors">丟棄</button>
                              </div>
                            ) : null;
                          })() : (
                            <div>
                              {progress.unlockedRecipes.length === 0 ? (
                                <p className="text-stone-500 text-sm text-center py-3">尚未購買任何食譜。前往星晶商店 → 食譜商店購買！</p>
                              ) : (
                                <div className="grid grid-cols-1 gap-2">
                                  {RECIPES.filter(r => progress.unlockedRecipes.includes(r.id)).map(r => {
                                    const canCook = Object.entries(r.ingredients).every(([id, qty]) => (progress.ingredients[id] || 0) >= qty);
                                    const charBaseId = homeHost ? (homeHost.baseId || homeHost.id) : null;
                                    const isFavored = charBaseId && r.favoredBy.includes(charBaseId);
                                    return (
                                      <div key={r.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${canCook ? 'bg-stone-800 border-stone-600 hover:border-orange-500' : 'bg-stone-900 border-stone-800 opacity-60'}`}>
                                        <div className="flex items-center gap-3">
                                          <span className="text-2xl">{r.icon}</span>
                                          <div>
                                            <div className="font-bold text-sm text-white flex items-center gap-1">
                                              {r.name}
                                              {isFavored && <span className="text-[9px] bg-yellow-600 text-black px-1.5 py-0.5 rounded-full font-bold">偏好 +20%</span>}
                                            </div>
                                            <div className="text-[10px] text-stone-400 mt-0.5">
                                              {Object.entries(r.ingredients).map(([id, qty]) => {
                                                const ing = ALL_INGREDIENTS.find(i => i.id === id);
                                                const have = progress.ingredients[id] || 0;
                                                return <span key={id} className={`mr-2 ${have >= qty ? 'text-green-400' : 'text-red-400'}`}>{ing?.icon}{ing?.name} {have}/{qty}</span>;
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                        <button onClick={() => cookMeal(r)} disabled={!canCook}
                                          className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${canCook ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}>
                                          烹飪
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
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
                    {['companions', 'enemies', 'achievements', 'guide'].map(t=>{ const hasUnclaimedAch = t==='achievements' && ACHIEVEMENTS.some(a => a.getProgress(progress) >= a.target && !(progress.claimedAchievements||[]).includes(a.id)); return (<button key={t} onClick={() => setGalleryTab(t)} className={`relative px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${galleryTab===t? 'bg-blue-600 shadow-lg' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}>
                        {t==='companions'?'夜行者':t==='enemies'?'深淵魔物':t==='achievements'?<><Trophy size={18}/> 成就勳章</>:'冒險指南'}
                        {hasUnclaimedAch && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
                    </button>); })}
                </div>
                
                {galleryTab !== 'achievements' && (
                    <NpcDialogue 
                        npcName="公會會長" 
                        npcImage="avatar_aldous.png"
                        npcImageFallback="🦉" 
                        dialogues={[
                            "這裡是艾歐蘭斯公會，記錄著所有的魔物與夜行者情報。",
                            "多了解魔物的弱點，夜巡時才不會吃虧。",
                            "收集專屬碎片不僅能解鎖異裝，還能強化基礎角色的潛能！",
                            "集齊所有圖鑑，是每個夜行者的終極目標！",
                            "這本指南記錄了大陸所有的情報，出發前好好研讀吧。"
                        ]} 
                    />
                )}

                {galleryTab === 'guide' ? (
                    <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-stone-800 p-8 rounded-3xl border border-stone-700"><h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2"><HelpCircle size={24}/> 基礎術語</h3><div className="space-y-4">{GUIDE_TERMS.map((g,i)=>(<div className="bg-stone-900 p-4 rounded-xl border border-stone-800" key={i}><span className="text-blue-400 font-bold block mb-1">{g.term}</span><p className="text-stone-400 text-sm leading-relaxed">{g.desc}</p></div>))}</div></div>
                            <div className="bg-stone-800 p-8 rounded-3xl border border-stone-700"><h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-2"><Sparkles size={24}/> 狀態表</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{STATUS_DOCS.map((s,i)=>(<div className="bg-stone-900 p-4 rounded-xl border border-stone-800 flex items-start gap-3" key={i}><span className="text-2xl mt-1">{s.icon}</span><div><span className={`font-bold block ${s.color}`}>{s.name}</span><p className="text-stone-400 text-xs mt-1 leading-relaxed">{s.effect}</p></div></div>))}</div></div>
                        </div>
                        <div className="bg-stone-800 p-8 rounded-3xl border border-stone-700">
                            <h3 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-2"><BookOpen size={24}/> 系統說明</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {GUIDE_SYSTEMS.map((s,i)=>(
                                    <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 flex items-start gap-3" key={i}>
                                        <span className="text-3xl mt-0.5 shrink-0">{s.icon}</span>
                                        <div><span className="text-purple-300 font-bold block mb-1">{s.name}</span><p className="text-stone-400 text-sm leading-relaxed">{s.desc}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : galleryTab === 'achievements' ? (
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <div className="bg-stone-800 p-8 rounded-3xl border border-stone-700 shadow-xl mb-8">
                            <h3 className="text-3xl font-bold text-yellow-400 mb-2 flex items-center gap-3"><Trophy size={32}/> 光榮的軌跡</h3>
                            <p className="text-stone-400 text-sm mb-8">達成特定里程碑，領取公會發放的星晶獎勵吧！</p>
                            <div className="space-y-4">
                                {ACHIEVEMENTS.map(ach => {
                                    const currentProg = ach.getProgress(progress);
                                    const isCompleted = currentProg >= ach.target;
                                    const isClaimed = (progress.claimedAchievements || []).includes(ach.id);
                                    
                                    return (
                                        <div key={ach.id} className={`flex flex-col md:flex-row items-center justify-between p-4 rounded-2xl border-2 transition-all ${isClaimed ? 'bg-stone-900/50 border-stone-800 opacity-60' : isCompleted ? 'bg-stone-800 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-stone-800 border-stone-700'}`}>
                                            <div className="flex-1 w-full md:w-auto mb-4 md:mb-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className={`font-bold text-lg ${isClaimed ? 'text-stone-500' : isCompleted ? 'text-yellow-400' : 'text-stone-200'}`}>{ach.name}</span>
                                                    <span className="text-[10px] bg-stone-950 px-2 py-1 rounded text-cyan-300 font-mono">{ach.rewardDesc || `💎 ${ach.reward} 星晶`}</span>
                                                </div>
                                                <div className="text-sm text-stone-400 mb-3">{ach.desc}</div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-700">
                                                        <div className={`h-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (currentProg / ach.target) * 100)}%`}}></div>
                                                    </div>
                                                    <span className="text-xs font-mono text-stone-500 w-12 text-right">{Math.min(currentProg, ach.target)} / {ach.target}</span>
                                                </div>
                                            </div>
                                            <div className="md:ml-6 w-full md:w-auto flex justify-end">
                                                {isClaimed ? (
                                                    <button disabled className="bg-stone-950 text-green-700 px-6 py-2 rounded-xl font-bold flex items-center gap-2 border border-stone-800 cursor-not-allowed"><CheckCircle size={16}/> 已領取</button>
                                                ) : isCompleted ? (
                                                    <button onClick={() => claimAchievement(ach)} className="w-full md:w-auto bg-yellow-600 hover:bg-yellow-500 text-stone-900 px-8 py-3 rounded-xl font-bold shadow-lg animate-pulse active:scale-95 transition-transform">領取獎勵</button>
                                                ) : (
                                                    <button disabled className="bg-stone-700 text-stone-500 px-6 py-2 rounded-xl font-bold cursor-not-allowed">未達成</button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {(galleryTab === 'companions' ? [...CHARACTERS, HIDDEN_CHARACTER, ...VARIANTS] : [...NORMAL_MONSTERS, ...BOSS_MONSTERS, ...ADVANCED_MONSTERS, ...ADVANCED_BOSSES]).map((c) => {
                            const isBasic = isBasicChar(c);
                            const isT0 = isT0Char(c);
                            const isUnlocked = isBasic || encountered.includes(c.id) || (isT0 && unlocks.includes(c.id)) || (!!c.baseId && unlocks.includes(c.id));
                            const isPlaceholderVariant = !!c.baseId && (!unlocks.includes(c.id) || c.isPlaceholder);
                            const showFragUI = ['newyear_bear', 'harvest_elf', 'blackflame_human', 'valentine_wolf', 'halloween_cat', 'kohaku', 'aldous'].includes(c.id) && !unlocks.includes(c.id);
                            
                            if (!isUnlocked && !showFragUI && !isPlaceholderVariant && c.id !== 'christmas_xiangxiang') return <div key={c.id} className="bg-stone-800 border-2 border-stone-700 opacity-60 rounded-3xl p-6 min-h-[300px] flex items-center justify-center text-4xl">❓</div>;
                            if (!isUnlocked && c.id === 'christmas_xiangxiang') {
                                return (
                                    <div key={c.id} className="relative overflow-hidden bg-stone-800 border-2 border-stone-700 opacity-80 rounded-3xl p-6 min-h-[300px] flex flex-col items-center justify-center text-center shadow-inner">
                                        <div className="w-20 h-20 rounded-full bg-stone-900 border-2 border-stone-700 flex items-center justify-center mb-4 opacity-50"><span className="text-4xl grayscale">🎁</span></div>
                                        <h3 className="font-bold text-stone-400 text-xl">聖誕節虎吉</h3><p className="text-stone-500 text-xs mt-1">(最棒的禮物)</p>
                                        <div className="mt-6 bg-stone-900/80 p-4 rounded-xl border border-stone-700 w-full">
                                            <span className="text-yellow-600 block mb-2 font-bold text-sm">🔒 解鎖預告</span>
                                            <p className="text-stone-400 text-xs">{c.unlockHint}</p>
                                        </div>
                                    </div>
                                );
                            }
                            
                            if (showFragUI || isPlaceholderVariant) {
                                const reqFrags = 50;
                                const curFrags = progress.charFragments?.[c.id] || 0;
                                return (
                                    <div key={c.id} className="relative overflow-hidden bg-stone-800 border-2 border-stone-700 opacity-80 rounded-3xl p-6 min-h-[300px] flex flex-col items-center justify-center text-center shadow-inner">
                                        <div className="w-20 h-20 rounded-full bg-stone-900 border-2 border-stone-700 flex items-center justify-center mb-4 opacity-50"><span className="text-4xl grayscale">{c.icon}</span></div>
                                        <h3 className="font-bold text-stone-400 text-xl">{c.name}</h3><p className="text-stone-500 text-xs mt-1">({c.title})</p>
                                        <div className="mt-6 bg-stone-900/80 p-4 rounded-xl border border-stone-700 w-full">
                                            <span className="text-yellow-600 block mb-2 font-bold text-sm">🔒 解鎖預告</span>
                                            <p className="text-stone-400 text-xs">{c.unlockHint || '收集 50 個專屬碎片於圖鑑合成解鎖。'}</p>
                                            { showFragUI && (
                                                <div className="mt-4 w-full">
                                                    <div className="flex justify-between text-xs mb-1 text-cyan-300"><span>碎片進度</span><span>{curFrags} / {reqFrags}</span></div>
                                                    <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-700">
                                                        <div className="h-full bg-cyan-500 transition-all" style={{ width: `${Math.min(100, (curFrags/reqFrags)*100)}%`}}></div>
                                                    </div>
                                                    {curFrags >= reqFrags && (
                                                        <button onClick={() => synthesizeChar(c.id)} className="w-full mt-3 bg-yellow-600 hover:bg-yellow-500 text-stone-900 font-bold py-2 rounded-lg shadow-lg animate-pulse transition-transform active:scale-95">合成解鎖！</button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            const curFrags = progress.charFragments?.[c.id] || 0;
                            const upgrades = progress.charCostUpgrades?.[c.id] || 0;
                            const isAdvBoss = ADVANCED_BOSSES.some(b=>b.id===c.id);
                            const isAdvMon = ADVANCED_MONSTERS.some(m=>m.id===c.id);

                            return (
                                <div key={c.id} className={`relative overflow-hidden bg-stone-800 border-2 rounded-3xl p-6 shadow-xl hover:-translate-y-1 transition-transform ${isAdvBoss?'border-red-600 shadow-red-900/20' : BOSS_MONSTERS.some(b=>b.id===c.id)?'border-purple-600 shadow-purple-900/20': isT0?'border-yellow-500 shadow-yellow-900/20': !!c.baseId?'border-stone-500':'border-stone-700'}`}>
                                    {isAdvBoss && <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-widest z-10 shadow-md">高階BOSS</div>}
                                    {!isAdvBoss && BOSS_MONSTERS.some(b=>b.id===c.id) && <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-widest z-10 shadow-md">BOSS</div>}
                                    {isT0 && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-widest z-10 shadow-md">🌟 傳說級</div>}
                                    {!!c.baseId && !c.isPlaceholder && <div className="absolute top-0 right-0 bg-stone-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-widest z-10 shadow-md">✨ 異裝型態</div>}
                                    {captured.includes(c.id) && <div className="absolute top-0 left-0 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl tracking-widest z-10 shadow-md">🐾 已收服</div>}
                                    {c.isUncapturable && <div className="absolute top-0 left-0 bg-stone-700 text-stone-400 text-[10px] font-bold px-3 py-1 rounded-br-xl tracking-widest z-10 shadow-md">不可馴化</div>}
                                    
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <div className="flex items-center gap-4"><SpriteAvatar char={c} size="w-16 h-16" /><div><div className={`text-xs mb-0.5 ${isAdvBoss || isAdvMon ? 'text-red-400' : 'text-gray-400'}`}>{c.title}</div><div className="text-xl font-bold flex items-center gap-2">{c.isEmoji ? c.emoji : c.icon} {c.name}</div>{c.element && <div className={`text-[11px] font-bold mt-1 ${c.element.color}`}>{c.element.icon} {c.element.name}屬性</div>}</div></div>
                                        { (isBasic || isT0 || !!c.baseId) && (
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

                                    {isBasic && !isT0 && (
                                        <div className="mt-4 bg-stone-900/80 p-3 rounded-xl border border-stone-700 w-full">
                                            <div className="flex justify-between text-xs mb-1 text-blue-300 font-bold">
                                                <span>🌟 潛能突破 (Cost +{upgrades}/3)</span>
                                                <span>{curFrags} / 30 碎片</span>
                                            </div>
                                            <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-700 mb-2">
                                                <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (curFrags/30)*100)}%`}}></div>
                                            </div>
                                            {upgrades < 3 ? (
                                                <button onClick={() => upgradeCharCost(c.id)} disabled={curFrags < 30} className={`w-full py-2 rounded-lg font-bold text-xs shadow-md transition-transform ${curFrags >= 30 ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}>
                                                    消耗 30 碎片強化 Cost上限
                                                </button>
                                            ) : (
                                                <div className="text-center text-xs text-yellow-500 font-bold py-2 bg-stone-800 rounded-lg">MAX 潛能已滿</div>
                                            )}
                                        </div>
                                    )}

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
    const buyFrag = (charId, cost, amt) => {
        let np = {...progress, fragments: (progress.fragments || 0) - cost};
        np.charFragments = {...np.charFragments};
        np.charFragments[charId] = (np.charFragments[charId] || 0) + amt;
        saveProgress(np);
        showToastMsg(`成功購買 ${amt} 個碎片！`);
    };

    const craftItem = (id, name, icon) => () => {
      let np = { ...progress, ap: progress.ap - workItems.find(w => w.id === id)?.cost };
      np.items = { ...np.items, [id]: (np.items?.[id] || 0) + 1 };
      np = updateDailyQuestProgress('shop_work', np);
      saveProgress(np);
      showToastMsg(`✅ 製作完成：${icon} ${name}！`);
    };

    const workItems = [
      { id: 'guild_work', name: '公會打工', desc: '消耗 1 點 AP 協助公會處理雜務，獲得 5 顆星晶。', cost: 1, currency: 'ap', icon: '💼', canBuy: progress.ap >= 1, bought: false, isInfinite: true, onBuy: () => { let np={...progress, ap: progress.ap - 1, crystals: progress.crystals + 5}; np = updateDailyQuestProgress('shop_work', np); saveProgress(np); showToastMsg('打工成功！獲得 5 💎'); } },
      { id: 'stardust',      name: '道具製作：星晶砂粉', desc: `戰鬥中使用，立即回復 100 HP。持有：${progress.items?.stardust||0} 個`,      cost: 1, currency: 'ap', icon: '✨', canBuy: progress.ap >= 1, bought: false, isInfinite: true, onBuy: craftItem('stardust',      '星晶砂粉', '✨') },
      { id: 'excite_potion', name: '道具製作：亢奮藥劑', desc: `戰鬥中使用，獲得亢奮狀態 3 回合。持有：${progress.items?.excite_potion||0} 個`, cost: 2, currency: 'ap', icon: '🧪', canBuy: progress.ap >= 2, bought: false, isInfinite: true, onBuy: craftItem('excite_potion', '亢奮藥劑', '🧪') },
      { id: 'smoke_bomb',    name: '道具製作：煙霧彈',   desc: `戰鬥中使用，獲得迴避效果 1 次。持有：${progress.items?.smoke_bomb||0} 個`,    cost: 3, currency: 'ap', icon: '💨', canBuy: progress.ap >= 3, bought: false, isInfinite: true, onBuy: craftItem('smoke_bomb',    '煙霧彈',   '💨') },
      { id: 'antidote',      name: '道具製作：萬能解藥', desc: `戰鬥中使用，清除自身所有負面狀態。持有：${progress.items?.antidote||0} 個`,      cost: 3, currency: 'ap', icon: '💊', canBuy: progress.ap >= 3, bought: false, isInfinite: true, onBuy: craftItem('antidote',      '萬能解藥', '💊') },
    ];

    const crystalItems = [
      { id: 'massage', name: '星晶按摩', desc: '花費 5 顆星晶享受魔力按摩，恢復 1 點 AP。', cost: 5, currency: 'crystal', icon: '💆', canBuy: true, bought: false, isInfinite: true, onBuy: () => { let np={...progress, crystals: progress.crystals - 5, ap: progress.ap + 1}; saveProgress(np); showToastMsg('AP 恢復了！'); } },
      { id: 'max4', name: '擴展天賦槽 (4點)', desc: '將天賦點數上限提升至 4 點。', cost: 15, currency: 'crystal', icon: '⬆️', canBuy: progress.maxTalents === 3, bought: progress.maxTalents >= 4, onBuy: () => { let np={...progress, crystals: progress.crystals - 15, maxTalents: 4}; saveProgress(np); } },
      { id: 'max5', name: '擴展天賦槽 (5點)', desc: '將天賦點數上限提升至 5 點。', cost: 30, currency: 'crystal', icon: '🌟', canBuy: progress.maxTalents === 4, bought: progress.maxTalents >= 5, onBuy: () => { let np={...progress, crystals: progress.crystals - 30, maxTalents: 5}; saveProgress(np); } },
      { id: 'cost4', name: '進階戰術書 (Cost 4)', desc: '解鎖 3 種增幅特定猜拳的高階天賦。', cost: 20, currency: 'crystal', icon: '📘', canBuy: !unlocks.includes('cost4'), bought: unlocks.includes('cost4'), onBuy: () => { let np={...progress, crystals: progress.crystals - 20}; np.unlocks=[...unlocks,'cost4']; saveProgress(np); } },
      { id: 'cost5', name: '終極奧義卷軸 (Cost 5)', desc: '解鎖 2 種擁有逆轉戰局能力的終極天賦。', cost: 40, currency: 'crystal', icon: '📙', canBuy: !unlocks.includes('cost5'), bought: unlocks.includes('cost5'), onBuy: () => { let np={...progress, crystals: progress.crystals - 40}; np.unlocks=[...unlocks,'cost5']; saveProgress(np); } },
      { id: 'char_talents', name: '專屬覺醒指南 (Cost 3)', desc: '解鎖所有角色的「專屬天賦」。', cost: 25, currency: 'crystal', icon: '✨', canBuy: !unlocks.includes('char_talents'), bought: unlocks.includes('char_talents'), onBuy: () => { let np={...progress, crystals: progress.crystals - 25}; np.unlocks=[...unlocks,'char_talents']; saveProgress(np); } },
      { id: 'tamer_kert', name: '訓獸師的心得', desc: '解鎖魔物收服機制！', cost: 60, currency: 'crystal', icon: '🐾', canBuy: !unlocks.includes('tamer_kert'), bought: unlocks.includes('tamer_kert'), onBuy: () => { let np={...progress, crystals: progress.crystals - 60}; np.unlocks=[...unlocks,'tamer_kert']; saveProgress(np); } }
    ];

    const fragmentItems = [
      { id: 'f_bear', name: '熊吉碎片 x5', desc: '用於基礎角色潛能突破。', cost: 50, currency: 'fragment', icon: '🐻', canBuy: true, bought: false, isInfinite: true, onBuy: () => buyFrag('bear', 50, 5) },
      { id: 'f_wolf', name: '白澤碎片 x5', desc: '用於基礎角色潛能突破。', cost: 50, currency: 'fragment', icon: '🐺', canBuy: true, bought: false, isInfinite: true, onBuy: () => buyFrag('wolf', 50, 5) },
      { id: 'f_cat', name: '布提婭碎片 x5', desc: '用於基礎角色潛能突破。', cost: 50, currency: 'fragment', icon: '🐈‍⬛', canBuy: true, bought: false, isInfinite: true, onBuy: () => buyFrag('cat', 50, 5) },
      { id: 'f_human', name: '普爾斯碎片 x5', desc: '用於基礎角色潛能突破。', cost: 50, currency: 'fragment', icon: '🧑‍🚒', canBuy: true, bought: false, isInfinite: true, onBuy: () => buyFrag('human', 50, 5) },
      { id: 'f_elf', name: '布布碎片 x5', desc: '用於基礎角色潛能突破。', cost: 50, currency: 'fragment', icon: '🧚', canBuy: true, bought: false, isInfinite: true, onBuy: () => buyFrag('elf', 50, 5) },
      { id: 'f_nybear', name: '新年熊吉碎片 x5', desc: '高階情報，用於圖鑑合成解鎖。', cost: 150, currency: 'fragment', icon: '🧧', canBuy: true, bought: false, isInfinite: true, onBuy: () => buyFrag('newyear_bear', 150, 5) },
      { id: 'f_harvest', name: '豐收節布布碎片 x5', desc: '高階情報，用於圖鑑合成解鎖。', cost: 150, currency: 'fragment', icon: '🌻', canBuy: true, bought: false, isInfinite: true, onBuy: () => buyFrag('harvest_elf', 150, 5) },
      { id: 'f_blackflame', name: '黑炎普爾斯碎片 x5', desc: '高階情報，用於圖鑑合成解鎖。', cost: 150, currency: 'fragment', icon: '🔥', canBuy: true, bought: false, isInfinite: true, onBuy: () => buyFrag('blackflame_human', 150, 5) },
      { id: 'f_valentine', name: '情人節白澤碎片 x5', desc: '高階情報，用於圖鑑合成解鎖。', cost: 150, currency: 'fragment', icon: '💝', canBuy: true, bought: false, isInfinite: true, onBuy: () => buyFrag('valentine_wolf', 150, 5) },
      { id: 'f_halloween', name: '萬聖布提婭碎片 x5', desc: '高階情報，用於圖鑑合成解鎖。', cost: 150, currency: 'fragment', icon: '🎃', canBuy: true, bought: false, isInfinite: true, onBuy: () => buyFrag('halloween_cat', 150, 5) },
      { id: 'f_kohaku', name: '琥珀碎片 x5', desc: '傳說情報，商會會長的專屬碎片。', cost: 300, currency: 'fragment', icon: '🦊', canBuy: true, bought: false, isInfinite: true, onBuy: () => buyFrag('kohaku', 300, 5) },
      { id: 'f_aldous', name: '奧爾德斯碎片 x5', desc: '傳說情報，大長老的專屬碎片。', cost: 300, currency: 'fragment', icon: '🦉', canBuy: true, bought: false, isInfinite: true, onBuy: () => buyFrag('aldous', 300, 5) },
    ];

    const recipeItems = RECIPES.map(r => ({
      id: `recipe_${r.id}`, name: `📖 ${r.name}`, desc: `【${r.grade}】${r.buff.desc}`, cost: r.cost, currency: 'crystal', icon: r.icon,
      canBuy: !progress.unlockedRecipes.includes(r.id), bought: progress.unlockedRecipes.includes(r.id), isInfinite: false,
      onBuy: () => buyRecipe(r)
    }));

    const ingredientItems = INGREDIENTS.map(ing => ({
      id: `ing_${ing.id}`, name: ing.name, desc: `目前持有：${progress.ingredients[ing.id] || 0} 個`, cost: ing.cost, currency: 'fragment', icon: ing.icon,
      canBuy: true, bought: false, isInfinite: true,
      onBuy: () => buyIngredient(ing.id)
    }));

    const displayItems = shopTab === 'crystal' ? crystalItems : shopTab === 'fragment' ? fragmentItems : shopTab === 'recipe' ? recipeItems : shopTab === 'ingredient' ? ingredientItems : workItems;

    return (
        <div className="min-h-screen p-8 bg-stone-900 text-stone-200">
            <button onClick={()=>setGameState('intro')} className="mb-8 flex items-center gap-2 text-stone-400 hover:text-white transition-colors"><ArrowLeft/> 返回首頁</button>
            <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto"><h2 className="text-3xl font-bold text-cyan-400">星晶商店</h2>
                <div className="flex gap-3 flex-wrap justify-end">
                    <div className="text-blue-300 font-bold bg-stone-800 px-4 py-2 rounded-full border border-stone-700 shadow-lg">💎 {progress.crystals}</div>
                    <div className="text-cyan-300 font-bold bg-stone-800 px-4 py-2 rounded-full border border-stone-700 shadow-lg">💠 {progress.fragments || 0}</div>
                    <div className="text-green-400 font-bold bg-stone-800 px-4 py-2 rounded-full border border-stone-700 shadow-lg">⚡ AP {progress.ap}</div>
                </div>
            </div>
            
            <NpcDialogue
                key={shopTab}
                npcName="商會會長-琥珀"
                npcImage="avatar_kohaku.png"
                npcImageFallback="🦊"
                dialogues={shopTab === 'crystal' ? [
                    "歡迎來到星晶商店！只要有足夠的星晶，沒有什麼是我琥珀辦不到的。",
                    "星晶怎麼取得？很簡單——打夜巡戰役，每場至少 3 顆，通關還有 8 顆額外獎勵。",
                    "自訂對決依對手強度給予不同獎勵：一般魔物 3 晶、魔王/基本角色 4 晶、進階魔物/SR異裝 6 晶、SSR角色 8 晶、進階魔王 12 晶！",
                    "成就也能換大量星晶，圖鑑裡查一下自己差哪些條件，說不定快達成了。"
                ] : shopTab === 'fragment' ? [
                    "集滿 50 個特定角色的碎片，就能在圖鑑解鎖他的異裝型態！",
                    "碎片還能用來突破天賦槽位",
                    "迷途酒館每次抽卡都有機率掉碎片，是穩定累積的管道。",
                    "想要特定角色的碎片？直接在這裡購買最有效率。"
                ] : shopTab === 'recipe' ? [
                    "先在這裡買下食譜，再到白晝營地的營火烹飪台製作料理。",
                    "料理可以在戰鬥前給角色加持 Buff，效果相當可觀。",
                    "每種料理都有「偏好角色」，對應角色使用效果提升 20%！",
                    "投資食譜是一次性的，買下之後可以反覆製作。。"
                ] : shopTab === 'ingredient' ? [
                    "礦坑掛機採集會自動產出星晶碎片，可在我這購入一些珍貴食材。",
                    "囤好各類食材，回到白晝營地就能靈活搭配不同料理！"
                ] : [
                    "缺星晶的時候就來這裡打個工，雖然薪水不多但聊勝於無。",
                    "道具可以在戰鬥中使用，說不定能扭轉局面。",
                    "製作道具需要消耗 AP，請好好規劃你的行動力！"
                ]}
            />

            <div className="flex justify-center gap-4 mb-8 flex-wrap">
                <button onClick={() => setShopTab('crystal')} className={`px-8 py-3 rounded-full font-bold transition-all shadow-md ${shopTab === 'crystal' ? 'bg-blue-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700 border border-stone-700'}`}>💎 星晶交易區</button>
                <button onClick={() => setShopTab('fragment')} className={`px-8 py-3 rounded-full font-bold transition-all shadow-md ${shopTab === 'fragment' ? 'bg-cyan-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700 border border-stone-700'}`}>💠 碎片補給區</button>
                <button onClick={() => setShopTab('recipe')} className={`px-8 py-3 rounded-full font-bold transition-all shadow-md ${shopTab === 'recipe' ? 'bg-orange-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700 border border-stone-700'}`}>📖 食譜商店</button>
                <button onClick={() => setShopTab('ingredient')} className={`px-8 py-3 rounded-full font-bold transition-all shadow-md ${shopTab === 'ingredient' ? 'bg-green-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700 border border-stone-700'}`}>🧺 食材補給</button>
                <button onClick={() => setShopTab('work')} className={`px-8 py-3 rounded-full font-bold transition-all shadow-md ${shopTab === 'work' ? 'bg-yellow-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700 border border-stone-700'}`}>💼 打工專區</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto animate-fade-in">
                {displayItems.map(item => {
                    const affordable = item.currency === 'ap' ? progress.ap >= item.cost : item.currency === 'fragment' ? (progress.fragments || 0) >= item.cost : progress.crystals >= item.cost;
                    return (
                    <div key={item.id} className={`bg-stone-800 p-6 rounded-2xl border-2 flex flex-col items-center transition-all shadow-xl ${item.bought && !item.isInfinite ? 'border-green-600/30 opacity-60' : 'border-stone-700 hover:border-cyan-600/50 hover:-translate-y-1'}`}>
                        <div className="text-5xl mb-4">{item.icon}</div><h3 className="font-bold text-white mb-2">{item.name}</h3><p className="text-xs text-stone-400 text-center h-8 mb-6">{item.desc}</p>
                        {item.bought && !item.isInfinite ? <button disabled className="w-full bg-green-900/30 py-3 rounded-xl text-green-500 font-bold border border-green-800/50">已購入</button> : !item.canBuy ? <button disabled className="w-full bg-stone-700 py-3 rounded-xl text-stone-500 font-bold">條件不足</button> : <button onClick={item.onBuy} disabled={!affordable} className={`w-full py-3 rounded-xl font-bold transition-colors shadow-md ${affordable ? (item.currency === 'fragment' ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-blue-600 hover:bg-blue-500') + ' text-white' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}>{item.currency === 'ap' ? `⚡ ${item.cost} AP 兌換` : item.currency === 'fragment' ? `💠 ${item.cost} 碎片購買` : `💎 ${item.cost} 星晶購買`}</button>}
                    </div>
                )})}
            </div>
        </div>
    );
  };

  const renderStorySelectChar = () => {
    const chapter = STORY_CHAPTERS.find(c => c.id === storyChapterId);
    if (!chapter) return null;
    const options = (chapter.charOptions || [chapter.attackerCharId]).map(id => CHARACTERS.find(c => c.id === id)).filter(Boolean);
    return (
      <div className={`min-h-screen bg-gradient-to-b ${chapter.themeGrad} text-stone-200 flex flex-col`}>
        <div className="p-4 flex items-center gap-3 border-b border-stone-800/60">
          <button onClick={() => setGameState('story_dialogue')} className="text-stone-500 hover:text-white transition-colors"><ArrowLeft size={18}/></button>
          <span className={`text-sm font-bold ${chapter.themeColor}`}>{chapter.elementIcon} 第{chapter.id}章 · {chapter.name}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <h2 className="text-2xl font-bold text-white">選擇出陣角色</h2>
          <p className="text-stone-400 text-sm">推薦角色不代表強制，選擇你喜歡的夥伴上場！</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-lg">
            {options.map(c => {
              const isRec = c.id === chapter.recommendedCharId;
              const isSel = storySelectedCharId === c.id;
              return (
                <div key={c.id} onClick={() => setStorySelectedCharId(c.id)}
                  className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${isSel ? `bg-stone-900/80 ${chapter.themeBorder} shadow-xl scale-105` : 'bg-stone-900/50 border-stone-700 hover:border-stone-500 hover:-translate-y-0.5'}`}>
                  {isRec && <div className={`absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${chapter.themeColor} bg-stone-900 border ${chapter.themeBorder}`}>推薦</div>}
                  <SpriteAvatar char={c} size="w-16 h-16"/>
                  <div className="font-bold text-sm text-stone-100 text-center">{c.name}</div>
                  <div className="text-[10px] text-stone-500">{c.element?.name || ''}屬性</div>
                </div>
              );
            })}
          </div>
          <button
            disabled={!storySelectedCharId}
            onClick={() => {
              const chosen = CHARACTERS.find(c => c.id === storySelectedCharId);
              if (chosen) { setPlayer(prev => ({ ...prev, char: chosen })); setSelectedTalentIds([]); setGameState('select_talent'); }
            }}
            className={`mt-2 px-14 py-4 rounded-full font-bold text-xl shadow-lg transition-all ${storySelectedCharId ? 'bg-red-700 hover:bg-red-600 text-white hover:scale-105 active:scale-95' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}>
            ⚔️ 配置天賦！
          </button>
        </div>
      </div>
    );
  };

  const renderStoryDialogue = () => {
    const chapter = STORY_CHAPTERS.find(c => c.id === storyChapterId);
    if (!chapter) return null;
    const safeIdx = Math.min(storyDialogueIdx, chapter.dialogue.length - 1);
    const line = chapter.dialogue[safeIdx];
    if (!line) return null;
    const isLast = safeIdx >= chapter.dialogue.length - 1;
    const isLeft = line.side === 'left';
    const speakerChar = line.charId ? CHARACTERS.find(c => c.id === line.charId) : null;

    return (
      <div className={`min-h-screen bg-gradient-to-b ${chapter.themeGrad} text-stone-200 flex flex-col`}>
        <div className="p-4 flex items-center gap-3 border-b border-stone-800/60">
          <button onClick={() => setGameState('story_chapters')} className="text-stone-500 hover:text-white transition-colors"><ArrowLeft size={18}/></button>
          <span className={`text-sm font-bold ${chapter.themeColor}`}>{chapter.elementIcon} 第{chapter.id}章 · {chapter.name}</span>
          <div className="ml-auto flex gap-1.5 items-center">
            {chapter.dialogue.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i < safeIdx ? chapter.themeColor.replace('text-','bg-') + ' opacity-50' : i === safeIdx ? chapter.themeColor.replace('text-','bg-') : 'bg-stone-700'}`}/>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end p-4 pb-10 max-w-2xl mx-auto w-full gap-6">
          <div className={`flex gap-4 items-end ${isLeft ? '' : 'flex-row-reverse'}`}>
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className={`w-20 h-20 rounded-2xl overflow-hidden bg-stone-900 border-2 ${chapter.themeBorder} shadow-xl flex items-center justify-center`}>
                {line.image
                  ? <DialogueAvatar src={line.image} fallback={speakerChar?.icon || '❓'} />
                  : <span className="text-3xl">{speakerChar?.icon || '❓'}</span>
                }
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full bg-stone-900/80 border ${chapter.themeBorder} ${chapter.themeColor}`}>{line.speaker}</span>
            </div>
            <div className={`flex-1 bg-stone-900/90 border-2 ${chapter.themeBorder} rounded-2xl p-4 shadow-2xl`}>
              <p className="text-stone-100 text-base leading-relaxed">「{line.text}」</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-stone-600 text-xs">{safeIdx + 1} / {chapter.dialogue.length}</span>
            {isLast ? (
              <button onClick={() => {
                setStorySelectedCharId(null);
                setStoryBattleStage(0);
                setGameMode('story');
                setGameState('story_select_char');
              }} className="bg-red-700 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 active:scale-95 transition-all">
                ⚔️ 選擇出陣角色！
              </button>
            ) : (
              <button onClick={() => setStoryDialogueIdx(prev => prev + 1)} className="bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-all">
                下一句 ▶
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStoryVictory = () => {
    const chapter = STORY_CHAPTERS.find(c => c.id === storyChapterId);
    if (!chapter) return null;
    const nextChapter = STORY_CHAPTERS.find(c => c.id === storyChapterId + 1);
    return (
      <div className={`min-h-screen bg-gradient-to-b ${chapter.themeGrad} flex items-center justify-center p-6`}>
        <div className="bg-stone-900/95 border-2 border-stone-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
          <div className="text-6xl mb-3">✨</div>
          <div className={`text-xs font-bold ${chapter.themeColor} mb-1 tracking-widest`}>第 {chapter.id} 章 完成</div>
          <h2 className="text-2xl font-bold text-white mb-5">{chapter.name}</h2>

          <div className={`bg-stone-800 border-2 ${chapter.themeBorder} rounded-2xl p-5 mb-6`}>
            <div className={`text-xs font-bold ${chapter.themeColor} mb-3 flex items-center justify-center gap-1`}>🔓 {chapter.unlockLabel}</div>
            <div className="text-xl font-bold text-stone-100 mb-2">{chapter.unlockName}</div>
            <p className="text-stone-400 text-xs leading-relaxed">{chapter.unlockDesc}</p>
          </div>

          <div className="bg-stone-800/60 rounded-xl p-3 mb-6 flex justify-center gap-6 text-sm">
            <div className="text-center"><div className="text-blue-300 font-bold">💎 {[3,5,10].reduce((a,b)=>a+b,0)}</div><div className="text-stone-500 text-xs">獲得星晶</div></div>
            <div className="text-center"><div className="text-green-400 font-bold">⚡ 3</div><div className="text-stone-500 text-xs">獲得 AP</div></div>
          </div>

          {nextChapter && (
            <button onClick={() => startStoryChapter(nextChapter.id)} className="w-full bg-indigo-700 hover:bg-indigo-600 text-white py-3 rounded-xl font-bold mb-3 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
              {nextChapter.elementIcon} 前往第{nextChapter.id}章 · {nextChapter.name}
            </button>
          )}
          <button onClick={() => setGameState('story_chapters')} className="w-full bg-stone-700 hover:bg-stone-600 py-3 rounded-xl font-bold text-stone-300 transition-colors">
            返回主線選單
          </button>
        </div>
      </div>
    );
  };

  const renderStoryChapters = () => {
    const completed = progress.completedStoryChapters || [];
    return (
      <div className="min-h-screen bg-stone-950 text-stone-200 p-6">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setGameState('intro')} className="mb-6 flex items-center gap-2 text-stone-400 hover:text-white transition-colors">
            <ArrowLeft size={18}/> 返回主選單
          </button>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-indigo-300 mb-2">📖 主線夜巡</h1>
            <p className="text-stone-400 text-sm">跟隨夜行者們的旅程，解開大星晶碎裂的真相。</p>
            <div className="mt-3 text-xs text-stone-500">{completed.length} / {STORY_CHAPTERS.length} 章節完成</div>
          </div>
          <div className="flex flex-col gap-4">
            {STORY_CHAPTERS.map((ch) => {
              const isDone = completed.includes(ch.id);
              const isLocked = ch.id > 1 && !completed.includes(ch.id - 1);
              const attackerChar = CHARACTERS.find(c => c.id === ch.attackerCharId);
              return (
                <div key={ch.id} onClick={() => !isLocked && startStoryChapter(ch.id)}
                  className={`relative bg-gradient-to-r ${ch.themeGrad} border-2 ${isDone ? ch.themeBorder : isLocked ? 'border-stone-800' : 'border-stone-700'} rounded-2xl overflow-hidden shadow-xl transition-all ${isLocked ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-2xl active:scale-[0.99]'}`}>
                  <div className="relative z-10 p-5 flex gap-4 items-start">
                    <div className="text-4xl shrink-0 mt-1">{isLocked ? '🔒' : ch.elementIcon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-stone-500 text-xs font-bold">第 {ch.id} 章</span>
                        <h2 className={`font-bold text-lg ${isLocked ? 'text-stone-500' : ch.themeColor}`}>{ch.name}</h2>
                        {!isLocked && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ch.themeBorder} ${ch.themeColor} bg-stone-900/50`}>{ch.element.name}屬性</span>}
                      </div>
                      {!isLocked && <div className="flex items-center gap-4 text-xs flex-wrap mt-2">
                        <div className="flex items-center gap-1 text-stone-400">
                          <span>攻略角色：</span>
                          <span className="text-stone-200 font-bold">{attackerChar?.icon} {attackerChar?.name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-stone-400">
                          <span>通關解鎖：</span>
                          <span className="text-yellow-400 font-bold">{ch.unlockName}</span>
                        </div>
                      </div>}
                      {isLocked && <p className="text-stone-600 text-xs mt-1">完成第 {ch.id - 1} 章後解鎖</p>}
                    </div>
                    <div className="shrink-0 flex flex-col items-center gap-1 pt-1">
                      {isDone
                        ? <><span className="text-2xl">✅</span><span className={`text-[10px] font-bold ${ch.themeColor}`}>已完成</span></>
                        : isLocked
                          ? <><Lock size={20} className="text-stone-600"/><span className="text-stone-600 text-[10px]">鎖定</span></>
                          : <><span className="text-stone-400 text-sm font-bold">▶ 開始</span><span className="text-stone-500 text-[10px]">3連戰</span></>
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMine = () => {
    const mine = getMineInfo();
    const lvData = MINE_LEVELS[mine.lv - 1];
    const nextLvData = mine.lv < 5 ? MINE_LEVELS[mine.lv] : null;
    const pending = calcMinePending(mine);
    const cap = getMineCapacity(mine);
    const pendingPct = Math.min(100, cap > 0 ? Math.floor((pending / cap) * 100) : 0);
    const slots = lvData.slots;

    const basicChars = [
      CHARACTERS.find(c => c.id === 'bear'),
      CHARACTERS.find(c => c.id === 'wolf'),
      CHARACTERS.find(c => c.id === 'cat'),
      CHARACTERS.find(c => c.id === 'human'),
      CHARACTERS.find(c => c.id === 'elf'),
    ].filter(Boolean);

    return (
      <div className="min-h-screen p-8 bg-stone-900 text-stone-200">
        <div className="max-w-3xl mx-auto pb-10">
          <button onClick={() => setGameState('intro')} className="mb-8 flex items-center gap-2 text-stone-400 hover:text-white transition-colors">
            <ArrowLeft /> 返回首頁
          </button>
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-yellow-400 tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">⛏️ 星晶礦坑</h2>
            <p className="text-stone-400 text-sm mt-2">派遣夥伴自動採集星晶碎片，離線時持續產出！</p>
          </div>

          <NpcDialogue
            npcName="礦坑監工"
            npcImage={null}
            npcImageFallback="🐆"
            dialogues={[
              "歡迎來到礦坑！把你的夥伴派遣進去，他們會自動幫你挖碎片。",
              "每個夥伴都有採集加成：熊吉爆發產量、布提婭偷偷多拿一點……嘿嘿。",
              "礦坑有容量上限，記得定期回來收取，別讓碎片積滿浪費了！",
              "升級礦坑等級可以提升每小時產量和容量上限，早點投資早點賺。",
              "派遣的夥伴數量依礦坑等級決定，等級越高坑道越多。",
              "離線也能產出！關掉遊戲去睡一覺，醒來就有碎片等你收。",
            ]}
          />

          {/* 礦坑狀態卡片 */}
          <div className="bg-stone-800 border-2 border-yellow-800 rounded-3xl p-6 mb-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-xs text-stone-400 font-bold tracking-widest">Lv{mine.lv}</span>
                <h3 className="text-xl font-bold text-yellow-300">{lvData.name}</h3>
              </div>
              <div className="text-right text-sm text-stone-400 space-y-1">
                <div>⚡ 基礎產率：<span className="text-white font-bold">{lvData.baseRate}/hr</span></div>
                <div>📦 碎片上限：<span className="text-white font-bold">{cap}</span></div>
                <div>👷 工作名額：<span className="text-white font-bold">{mine.workers.length}/{slots}</span></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-stone-400 mb-1">
              <span>💠 累積碎片</span><span>{pending} / {cap}</span>
            </div>
            <div className="w-full h-4 bg-stone-950 rounded-full overflow-hidden border border-stone-700 mb-4">
              <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-700 rounded-full" style={{ width: `${pendingPct}%` }} />
            </div>
            <button onClick={collectMine} disabled={pending <= 0 || mine.workers.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 ${pending > 0 && mine.workers.length > 0 ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}>
              {mine.workers.length === 0 ? '尚未派遣任何夥伴' : pending > 0 ? `⛏️ 領取 ${pending} 顆碎片` : '碎片槽已空，等待中...'}
            </button>
          </div>

          {/* 派遣區 */}
          <div className="bg-stone-800 border-2 border-stone-700 rounded-3xl p-6 mb-6 shadow-xl">
            <h3 className="text-lg font-bold text-stone-200 mb-1">👷 派遣夥伴</h3>
            <p className="text-xs text-stone-400 mb-4">點擊角色派遣或撤回。每位角色有獨特的礦坑增益。</p>
            <div className="grid grid-cols-1 gap-3">
              {basicChars.map(c => {
                const bonus = MINE_CHAR_BONUS[c.id];
                const isWorking = mine.workers.includes(c.id);
                const isFull = !isWorking && mine.workers.length >= slots;
                return (
                  <div key={c.id} onClick={() => !isFull && toggleMineWorker(c.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isWorking ? 'bg-cyan-900/30 border-cyan-500 shadow-md cursor-pointer' : isFull ? 'opacity-40 border-stone-800 cursor-not-allowed' : 'bg-stone-900 border-stone-700 hover:border-stone-500 cursor-pointer'}`}>
                    <div className="text-3xl">{c.icon}</div>
                    <div className="flex-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        {c.name}
                        {isWorking && <span className="text-[10px] bg-cyan-700 text-white px-2 py-0.5 rounded-full animate-pulse">工作中</span>}
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">{bonus?.desc}</div>
                    </div>
                    <div className={`text-xs font-bold px-3 py-1 rounded-full border ${isWorking ? 'border-red-500 text-red-400 bg-red-900/20' : 'border-cyan-700 text-cyan-400 bg-cyan-900/20'}`}>
                      {isWorking ? '撤回' : '派遣'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 升級區 */}
          {mine.lv < 5 ? (
            <div className="bg-stone-800 border-2 border-stone-700 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-stone-200 mb-1">🔨 礦坑升級</h3>
              <p className="text-xs text-stone-400 mb-4">升級提升產率與上限，Lv3 / Lv5 追加工作名額。</p>
              <div className="grid grid-cols-3 gap-4 text-center text-xs mb-6">
                <div className="bg-stone-900 rounded-xl p-3 border border-stone-700">
                  <div className="text-stone-400 mb-1">產率</div>
                  <div className="font-bold text-white">{lvData.baseRate} → <span className="text-green-400">{nextLvData?.baseRate}</span><span className="text-stone-500">/hr</span></div>
                </div>
                <div className="bg-stone-900 rounded-xl p-3 border border-stone-700">
                  <div className="text-stone-400 mb-1">上限</div>
                  <div className="font-bold text-white">{lvData.capBase} → <span className="text-green-400">{nextLvData?.capBase}</span></div>
                </div>
                <div className="bg-stone-900 rounded-xl p-3 border border-stone-700">
                  <div className="text-stone-400 mb-1">名額</div>
                  <div className="font-bold text-white">{lvData.slots} → <span className={nextLvData?.slots > lvData.slots ? 'text-yellow-400' : 'text-white'}>{nextLvData?.slots}</span></div>
                </div>
              </div>
              <button onClick={upgradeMine} disabled={progress.crystals < lvData.upgradeCost}
                className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 ${progress.crystals >= lvData.upgradeCost ? 'bg-yellow-600 hover:bg-yellow-500 text-stone-900' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}>
                💎 {lvData.upgradeCost} 星晶 升級至 Lv{mine.lv + 1}
              </button>
              <div className="text-xs text-stone-500 text-center mt-2">目前星晶：{progress.crystals}</div>
            </div>
          ) : (
            <div className="bg-yellow-900/20 border-2 border-yellow-600 rounded-3xl p-6 text-center shadow-xl">
              <div className="text-4xl mb-2">🌟</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-1">星晶核心礦 — 滿級</h3>
              <p className="text-stone-400 text-sm">礦坑已達最高等級，盡情享受豐厚的碎片產出吧！</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderForge = () => {
    const forgeEquip = (armorId) => {
        const np = { ...progress, equippedArmor: progress.equippedArmor === armorId ? null : armorId };
        saveProgress(np);
    };
    const forgeCraft = (armor, isConsumable) => {
        if (progress.fragments < armor.cost) { setSysError('碎片不足！'); return; }
        if (!isConsumable && progress.unlockedArmors.includes(armor.id)) { setSysError('已製作過此永久武裝！'); return; }
        let np = { ...progress, fragments: progress.fragments - armor.cost };
        if (isConsumable) {
            np.consumableArmors = { ...progress.consumableArmors, [armor.id]: (progress.consumableArmors[armor.id] || 0) + 1 };
        } else {
            np.unlockedArmors = [...progress.unlockedArmors, armor.id];
        }
        np = updateDailyQuestProgress('forge', np);
        saveProgress(np);
        showToastMsg(`✅ 製作完成：${armor.name}！`);
    };
    const setConsumableForBattle = (armorId) => {
        const np = { ...progress, pendingConsumableArmor: progress.pendingConsumableArmor === armorId ? null : armorId };
        saveProgress(np);
    };

    return (
      <div className="min-h-screen p-8 bg-stone-950 text-stone-200">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setGameState('intro')} className="mb-8 flex items-center gap-2 text-stone-400 hover:text-white transition-colors"><ArrowLeft /> 返回首頁</button>

          <NpcDialogue
            npcName="鍛造師葛魯"
            npcImage={null}
            npcImageFallback="🐂"
            dialogues={[
              "歡迎來到鍛造工坊！我是礦坑老頭葛魯的徒弟，專門幫夜行者製作武裝。",
              "用碎片換成武裝，能在戰鬥中給你帶來意外之喜。",
              "永久武裝只需製作一次，可隨時切換裝備。",
              "消耗型武裝效果更爆發，但用完就沒了，記得補貨！",
              "碎片去礦坑或打魔物都能拿到，別忘了多存一點！",
            ]}
          />

          <div className="bg-stone-800 px-5 py-3 rounded-2xl border border-stone-700 text-center mb-6 font-bold text-lg">
            🧩 持有碎片：<span className="text-yellow-400">{progress.fragments}</span>
            {progress.equippedArmor && (() => {
                const a = ALL_ARMORS.find(x => x.id === progress.equippedArmor);
                return a ? <span className="ml-4 text-sm text-purple-400">裝備中：{a.icon} {a.name}</span> : null;
            })()}
            {progress.pendingConsumableArmor && (() => {
                const a = ALL_ARMORS.find(x => x.id === progress.pendingConsumableArmor);
                return a ? <span className="ml-4 text-sm text-orange-400">消耗備用：{a.icon} {a.name}</span> : null;
            })()}
          </div>

          {/* 永久武裝 */}
          <div className="bg-stone-800 rounded-3xl border border-stone-700 p-6 mb-6 shadow-xl">
            <h3 className="text-xl font-bold text-purple-400 mb-4">⚔️ 永久武裝</h3>
            <p className="text-stone-400 text-sm mb-5">製作後永久擁有，每次戰鬥只能裝備一件。</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FORGE_PERMANENT.map(armor => {
                const owned = progress.unlockedArmors.includes(armor.id);
                const equipped = progress.equippedArmor === armor.id;
                return (
                  <div key={armor.id} className={`bg-stone-900 rounded-2xl p-4 border-2 transition-all ${equipped ? 'border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]' : 'border-stone-700'}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl shrink-0">{armor.icon}</span>
                      <div>
                        <div className="font-bold text-white">{armor.name}</div>
                        <div className="text-xs text-stone-400 mt-1">{armor.desc}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!owned ? (
                        <button onClick={() => forgeCraft(armor, false)} disabled={progress.fragments < armor.cost}
                          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${progress.fragments >= armor.cost ? 'bg-purple-700 hover:bg-purple-600 text-white' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}>
                          🧩 {armor.cost} 碎片 製作
                        </button>
                      ) : (
                        <button onClick={() => forgeEquip(armor.id)}
                          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${equipped ? 'bg-stone-600 text-stone-300 hover:bg-stone-500' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}>
                          {equipped ? '✓ 卸除裝備' : '裝備'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 消耗型武裝 */}
          <div className="bg-stone-800 rounded-3xl border border-stone-700 p-6 shadow-xl">
            <h3 className="text-xl font-bold text-orange-400 mb-4">💥 消耗型武裝</h3>
            <p className="text-stone-400 text-sm mb-5">每場勝利消耗一個，可選一件備用於下次戰鬥。</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FORGE_CONSUMABLE.map(armor => {
                const stock = progress.consumableArmors[armor.id] || 0;
                const pending = progress.pendingConsumableArmor === armor.id;
                return (
                  <div key={armor.id} className={`bg-stone-900 rounded-2xl p-4 border-2 transition-all ${pending ? 'border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.3)]' : 'border-stone-700'}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl shrink-0">{armor.icon}</span>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">{armor.name} <span className="text-xs text-stone-400">×{stock}</span></div>
                        <div className="text-xs text-stone-400 mt-1">{armor.desc}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => forgeCraft(armor, true)} disabled={progress.fragments < armor.cost}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${progress.fragments >= armor.cost ? 'bg-orange-700 hover:bg-orange-600 text-white' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}>
                        🧩 {armor.cost} 製作
                      </button>
                      <button onClick={() => setConsumableForBattle(armor.id)} disabled={stock <= 0}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${stock > 0 ? (pending ? 'bg-stone-600 text-stone-300 hover:bg-stone-500' : 'bg-orange-600 hover:bg-orange-500 text-white') : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}>
                        {pending ? '✓ 取消備用' : '備用'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEncounterDialogue = () => {
    const ev = ENCOUNTER_EVENTS.find(e => e.id === encounterEventId);
    if (!ev || ev.locked) return null;
    const safeIdx = Math.min(encounterDialogueIdx, ev.dialogue.length - 1);
    const line = ev.dialogue[safeIdx];
    if (!line) return null;
    const isLast = safeIdx >= ev.dialogue.length - 1;
    const isLeft = line.side === 'left';
    const speakerChar = line.charId ? CHARACTERS.find(c => c.id === line.charId) : null;
    const speakerIcon = line.icon || speakerChar?.icon || '❓';
    return (
      <div className={`min-h-screen bg-gradient-to-b ${ev.themeGrad} text-stone-200 flex flex-col`}>
        <div className="p-4 flex items-center gap-3 border-b border-stone-800/60">
          <button onClick={() => { setGameState('gacha'); setGachaTab('encounters'); }} className="text-stone-500 hover:text-white transition-colors"><ArrowLeft size={18}/></button>
          <span className={`text-sm font-bold ${ev.themeColor}`}>{ev.icon} {ev.title}</span>
          {ev.subtitle && <span className="text-xs text-stone-600">{ev.subtitle}</span>}
          <div className="ml-auto flex gap-1.5 items-center">
            {ev.dialogue.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i < safeIdx ? 'bg-slate-500 opacity-50' : i === safeIdx ? 'bg-slate-300' : 'bg-stone-700'}`}/>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-end p-4 pb-10 max-w-2xl mx-auto w-full gap-6">
          <div className={`flex gap-4 items-end ${isLeft ? '' : 'flex-row-reverse'}`}>
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className={`w-20 h-20 rounded-2xl overflow-hidden bg-stone-900 border-2 ${ev.themeBorder} shadow-xl flex items-center justify-center`}>
                {line.image
                  ? <DialogueAvatar src={line.image} fallback={speakerIcon} />
                  : <span className="text-3xl">{speakerIcon}</span>}
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full bg-stone-900/80 border ${ev.themeBorder} ${ev.themeColor}`}>{line.speaker}</span>
            </div>
            <div className={`flex-1 bg-stone-900/90 border-2 ${ev.themeBorder} rounded-2xl p-4 shadow-2xl`}>
              <p className="text-stone-100 text-base leading-relaxed">「{line.text}」</p>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-stone-600 text-xs">{safeIdx + 1} / {ev.dialogue.length}</span>
            {isLast ? (
              <button onClick={() => { setGameState('gacha'); setGachaTab('encounters'); }}
                className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 active:scale-95 transition-all">
                ✦ 故事結束
              </button>
            ) : (
              <button onClick={() => setEncounterDialogueIdx(prev => prev + 1)}
                className="bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-all">
                下一句 ▶
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGacha = () => {
      const gachaCost = 20;
      const gachaTenCost = 150;
      
      const featuredPrizes = [
        { char: CHARACTERS.find(c=>c.id==='kohaku'), rarity: 'SSR' },
        { char: CHARACTERS.find(c=>c.id==='aldous'), rarity: 'SSR' },
        { char: VARIANTS.find(v=>v.id==='newyear_bear'), rarity: 'SR' },
        { char: VARIANTS.find(v=>v.id==='harvest_elf'), rarity: 'SR' },
        { char: VARIANTS.find(v=>v.id==='blackflame_human'), rarity: 'SR' },
        { char: VARIANTS.find(v=>v.id==='valentine_wolf'), rarity: 'SR' },
        { char: VARIANTS.find(v=>v.id==='halloween_cat'), rarity: 'SR' }
      ];

      const nextPreview = () => setGachaPreviewIdx((prev) => (prev + 1) % featuredPrizes.length);
      const prevPreview = () => setGachaPreviewIdx((prev) => (prev - 1 + featuredPrizes.length) % featuredPrizes.length);
      const currentPrize = featuredPrizes[gachaPreviewIdx];

      const pull = () => {
          const roll = Math.random() * 100;
          if (roll < 50) { 
              if (Math.random() < 0.5) {
                  return { type: 'ap', name: '行動點數', amt: Math.floor(Math.random() * 3) + 1, icon: '⚡', rarity: 'N', color: 'text-green-400' };
              } else {
                  return { type: 'fragment', name: '星晶碎片', amt: Math.floor(Math.random() * 20) + 10, icon: '💠', rarity: 'N', color: 'text-cyan-400' };
              }
          } else if (roll < 80) { 
              const basics = ['bear', 'wolf', 'cat', 'human', 'elf'];
              const bId = basics[Math.floor(Math.random() * basics.length)];
              const cData = CHARACTERS.find(c => c.id === bId);
              return { type: 'char_frag', id: bId, name: `${cData.name}碎片`, amt: Math.floor(Math.random() * 11) + 5, icon: cData.icon, rarity: 'R', color: 'text-blue-400' };
          } else if (roll < 95) { 
              const vPool = ['newyear_bear', 'harvest_elf', 'blackflame_human', 'valentine_wolf', 'halloween_cat'];
              const picked = vPool[Math.floor(Math.random() * vPool.length)];
              const vData = VARIANTS.find(v => v.id === picked);
              return { type: 'char_frag', id: picked, name: `${vData.name}碎片`, amt: Math.floor(Math.random() * 11) + 5, icon: vData.icon, rarity: 'SR', color: 'text-purple-400' };
          } else { 
              const t0Pool = ['kohaku', 'aldous'];
              const picked = t0Pool[Math.floor(Math.random() * t0Pool.length)];
              const cData = CHARACTERS.find(c => c.id === picked);
              return { type: 'char_frag', id: picked, name: `${cData.name}碎片`, amt: Math.floor(Math.random() * 11) + 5, icon: cData.icon, rarity: 'SSR', color: 'text-yellow-400' };
          }
      };

      const handlePull = (times) => {
          const cost = times === 10 ? gachaTenCost : gachaCost;
          if (progress.crystals < cost) {
              setSysError(`星晶不足！需要 ${cost} 顆。`);
              return;
          }
          let np = { ...progress, crystals: progress.crystals - cost };
          np.charFragments = { ...np.charFragments };
          np.charCostUpgrades = { ...np.charCostUpgrades };
          np.gachaPulls = (np.gachaPulls || 0) + times; // 記錄成就：抽卡次數
          let results = [];
          
          for (let i = 0; i < times; i++) {
              const res = pull();
              
              if (res.type === 'ap') np.ap += res.amt;
              if (res.type === 'fragment') np.fragments = (np.fragments || 0) + res.amt;
              if (res.type === 'char_frag') {
                  const isOneTimeOnly = ['newyear_bear', 'harvest_elf', 'blackflame_human', 'valentine_wolf', 'halloween_cat', 'kohaku', 'aldous', 'christmas_xiangxiang'].includes(res.id);
                  const currentUpgrades = np.charCostUpgrades[res.id] || 0;
                  
                  let ratio = 5; 
                  if (res.rarity === 'SSR') ratio = 50;
                  else if (res.rarity === 'SR') ratio = 20;

                  if ((isOneTimeOnly && np.unlocks.includes(res.id)) || (!isOneTimeOnly && currentUpgrades >= 3)) {
                      const convertedAmt = res.amt * ratio;
                      np.fragments = (np.fragments || 0) + convertedAmt;
                      res.converted = convertedAmt;
                      if (!isOneTimeOnly) res.convertedMsg = '潛能已滿';
                  } else {
                      np.charFragments[res.id] = (np.charFragments[res.id] || 0) + res.amt;
                  }
              }
              results.push(res);
          }
          np = updateDailyQuestProgress('gacha_pull', np);
          saveProgress(np);
          setGachaResult(results);
          playSound('gacha_pull');
          const hasSSR = results.some(r => r.rarity === 'SSR');
          setTimeout(() => playSound(hasSSR ? 'gacha_ssr' : 'gacha_normal'), 400);
      };

      const today = new Date().toISOString().slice(0, 10);
      const dqs = progress.dailyQuestState;
      const isToday = dqs && dqs.date === today;
      const activeQuestIds = isToday ? getDailyQuestIds(today) : [];
      const dqProgress = isToday ? (dqs.progress || {}) : {};
      const dqClaimed  = isToday ? (dqs.claimed  || []) : [];
      const claimedCount = activeQuestIds.filter(id => dqClaimed.includes(id)).length;
      const difficultyLabel = { easy: '🟢 簡單', medium: '🟡 中等', hard: '🔴 困難' };

      return (
          <div className="min-h-screen p-8 bg-stone-950 text-stone-200 relative overflow-hidden">
              <div className="max-w-4xl mx-auto z-10 relative">
                  <div className="flex justify-between items-center mb-8">
                      <button onClick={()=>{setGameState('intro'); setGachaResult(null);}} className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors"><ArrowLeft/> 返回首頁</button>
                      <div className="flex gap-4">
                          <div className="text-blue-300 font-bold bg-stone-800 px-4 py-2 rounded-full border border-stone-700 shadow-lg">💎 星晶：{progress.crystals}</div>
                          <div className="text-cyan-300 font-bold bg-stone-800 px-4 py-2 rounded-full border border-stone-700 shadow-lg">💠 碎片：{progress.fragments || 0}</div>
                      </div>
                  </div>
                  
                  <div className="text-center mb-6">
                      <h2 className="text-5xl font-bold text-purple-400 mb-2 tracking-widest drop-shadow-[0_0_15px_rgba(192,132,252,0.4)]">迷途酒館</h2>
                  </div>

                  <NpcDialogue
                      npcName="神秘酒保"
                      npcImage={null}
                      npcImageFallback="🐰"
                      dialogues={[
                          "這杯算我請的！要來點特別的情報嗎？",
                          "單抽一次 20 晶，十連抽 150 晶，十連必出至少一張 SR 以上喔！",
                          "SSR 機率是 5%，SR 機率 25%，剩下的是碎片或 AP。運氣好的話……嘿嘿。",
                          "抽到已有的角色？別擔心，會轉換成對應的碎片哦。",
                          "碎片集滿 50 個能在圖鑑合成解鎖異裝型態，別小看這些邊角料。",
                          "今晚的大獎是那位傳說中的商會會長……不過我沒辦法保證你抽得到。",
                      ]}
                  />

                  {/* Tab bar */}
                  <div className="flex gap-3 mb-6">
                    {[{ id: 'gacha', label: '🍻 招募', }, { id: 'quests', label: '📋 每日任務', badge: activeQuestIds.some(id => { const q = ALL_DAILY_QUESTS.find(x=>x.id===id); return q&&(dqProgress[id]||0)>=q.target&&!dqClaimed.includes(id); }) }, { id: 'encounters', label: '✨ 奇遇邂逅' }].map(t => (
                      <button key={t.id} onClick={() => setGachaTab(t.id)}
                        className={`relative px-5 py-2 rounded-full font-bold transition-all ${gachaTab === t.id ? 'bg-purple-700 text-white shadow-lg' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}>
                        {t.label}
                        {t.badge && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping pointer-events-none"></span>}
                      </button>
                    ))}
                  </div>

                  {/* Daily Quests Panel */}
                  {gachaTab === 'quests' && (
                    <div className="animate-fade-in">
                      <div className="bg-stone-800/60 rounded-2xl border border-stone-700 p-5 mb-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-yellow-400 text-lg">📋 每日任務</h3>
                          <div className="text-sm text-stone-400">完成 <span className="text-white font-bold">{claimedCount}</span>/5　全勤獎：💎 50星晶 {dqs?.fullClearClaimed ? <span className="text-green-400 text-xs">（已領）</span> : ''}</div>
                        </div>
                        <div className="space-y-3">
                          {activeQuestIds.map(id => {
                            const quest = ALL_DAILY_QUESTS.find(q => q.id === id);
                            if (!quest) return null;
                            const prog = dqProgress[id] || 0;
                            const done = prog >= quest.target;
                            const claimed = dqClaimed.includes(id);
                            const tier = DAILY_QUEST_POOL.easy.some(q=>q.id===id) ? 'easy' : DAILY_QUEST_POOL.medium.some(q=>q.id===id) ? 'medium' : 'hard';
                            return (
                              <div key={id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${claimed ? 'border-stone-700 bg-stone-900/30 opacity-60' : done ? 'border-yellow-600/50 bg-yellow-900/10' : 'border-stone-700 bg-stone-900/50'}`}>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-bold opacity-60">{difficultyLabel[tier]}</span>
                                    <span className="font-bold text-sm text-white">{quest.name}</span>
                                    {claimed && <span className="text-xs text-green-400">✓ 已領取</span>}
                                  </div>
                                  <p className="text-xs text-stone-400 mb-1">{quest.desc}</p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-stone-700 rounded-full h-1.5 max-w-[120px]">
                                      <div className="bg-yellow-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (prog / quest.target) * 100)}%` }}></div>
                                    </div>
                                    <span className="text-xs text-stone-400">{Math.min(prog, quest.target)}/{quest.target}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-xs text-stone-400 mb-1">{quest.rewardDesc}</div>
                                  <button onClick={() => claimDailyQuest(id)} disabled={!done || claimed}
                                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${done && !claimed ? 'bg-yellow-600 hover:bg-yellow-500 text-stone-900 active:scale-95' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}>
                                    {claimed ? '已領取' : done ? '領取！' : '進行中'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-center text-stone-600 text-xs">每日 00:00 更新任務</p>
                    </div>
                  )}

                  {gachaTab === 'encounters' && (
                    <div className="animate-fade-in">
                      <p className="text-stone-500 text-xs mb-4 text-center">在這裡欣賞角色們在旅途中的特別邂逅故事。</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {ENCOUNTER_EVENTS.map(ev => (
                          <div key={ev.id} className={`rounded-2xl border p-4 flex flex-col gap-2 transition-all ${ev.locked ? 'border-stone-800 bg-stone-900/40 opacity-50' : 'border-slate-700 bg-stone-900/70 hover:border-purple-500 cursor-pointer active:scale-95'}`}
                            onClick={() => { if (!ev.locked) { setEncounterEventId(ev.id); setEncounterDialogueIdx(0); setGameState('encounter_dialogue'); } }}>
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{ev.icon}</span>
                              <div>
                                <div className={`font-bold text-sm ${ev.locked ? 'text-stone-600' : 'text-white'}`}>{ev.title}</div>
                                {ev.subtitle && <div className="text-xs text-stone-500">{ev.subtitle}</div>}
                              </div>
                            </div>
                            <p className="text-xs text-stone-500 leading-relaxed">{ev.desc}</p>
                            {!ev.locked && <div className="text-xs text-purple-400 font-bold mt-1">▶ 點擊閱讀</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {gachaTab === 'gacha' && (!gachaResult ? (
                      <div className="flex flex-col items-center justify-center animate-fade-in">
                          <div className="bg-stone-900 border-4 border-stone-800 p-8 rounded-3xl shadow-2xl mb-8 flex flex-col items-center max-w-md w-full relative overflow-hidden">
                              <div className="text-6xl mb-6 drop-shadow-xl animate-pulse">🍻</div>
                              
                              {/* 大獎預覽區 */}
                              <div className="w-full bg-stone-950 p-3 rounded-2xl border border-stone-700 mb-4 flex items-center justify-between relative shadow-inner">
                                  <button onClick={prevPreview} className="text-stone-500 hover:text-white transition-colors"><ChevronLeft size={24}/></button>
                                  <div className="flex-1 flex items-center gap-3 px-3">
                                      <div className="relative shrink-0">
                                          <SpriteAvatar char={currentPrize.char} size="w-12 h-12" />
                                          <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded text-[8px] font-bold shadow ${currentPrize.rarity==='SSR'?'bg-yellow-500 text-black':'bg-purple-500 text-white'}`}>{currentPrize.rarity}</span>
                                      </div>
                                      <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                              <span className={`font-bold ${currentPrize.rarity==='SSR'?'text-yellow-400':'text-purple-400'}`}>{currentPrize.char.name}</span>
                                              <span className="text-[10px] text-stone-500 truncate">({currentPrize.char.title})</span>
                                          </div>
                                          <div className="text-[10px] text-stone-400 mt-1 line-clamp-1">{currentPrize.char.desc}</div>
                                      </div>
                                  </div>
                                  <button onClick={nextPreview} className="text-stone-500 hover:text-white transition-colors"><ChevronRight size={24}/></button>
                                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-stone-800 text-stone-300 text-[10px] px-3 py-0.5 rounded-full border border-stone-600 font-bold tracking-widest">本期情報一覽</div>
                              </div>

                              {/* 機率公示表 */}
                              <div className="grid grid-cols-2 text-[10px] text-stone-400 bg-stone-950 p-3 rounded-xl border border-stone-800 w-full mb-6 gap-y-2 gap-x-4 shadow-inner">
                                  <div><span className="text-stone-300 font-bold">💠 50%</span> 基礎資源 (AP/碎片)</div>
                                  <div><span className="text-blue-400 font-bold">🧩 30%</span> 基礎角色碎片</div>
                                  <div><span className="text-purple-400 font-bold">🧧 15%</span> 異裝角色碎片</div>
                                  <div><span className="text-yellow-400 font-bold">🌟 5%</span> 傳說大獎碎片</div>
                              </div>

                              <div className="flex gap-4 w-full">
                                  <button onClick={() => handlePull(1)} className="flex-1 bg-purple-700 hover:bg-purple-600 py-4 rounded-2xl font-bold shadow-lg transition-transform active:scale-95 flex flex-col items-center border border-purple-500">
                                      <span>招募 1 次</span>
                                      <span className="text-xs text-purple-300 mt-1">💎 {gachaCost}</span>
                                  </button>
                                  <button onClick={() => handlePull(10)} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-stone-900 py-4 rounded-2xl font-bold shadow-lg transition-transform active:scale-95 flex flex-col items-center border border-yellow-400">
                                      <span>招募 10 次</span>
                                      <span className="text-xs text-yellow-900 mt-1">💎 {gachaTenCost}</span>
                                  </button>
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="animate-fade-in flex flex-col items-center">
                          <h3 className="text-3xl font-bold text-yellow-400 mb-8">招募結果</h3>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 max-w-4xl w-full">
                              {gachaResult.map((r, i) => (
                                  <div key={i} className={`bg-stone-800 p-4 rounded-2xl border-2 flex flex-col items-center justify-center shadow-xl transition-transform relative`} style={{ animationDelay: `${i * 50}ms` }}>
                                      <div className={`absolute top-0 left-0 px-2 py-0.5 rounded-br-lg text-[10px] font-bold shadow ${r.rarity==='SSR'?'bg-yellow-500 text-black':r.rarity==='SR'?'bg-purple-500 text-white':r.rarity==='R'?'bg-blue-500 text-white':'bg-stone-600 text-white'}`}>{r.rarity}</div>
                                      <div className="text-4xl mb-2 mt-3">{r.icon}</div>
                                      <div className={`font-bold text-sm text-center ${r.color}`}>{r.name}</div>
                                      <div className="text-xl font-bold text-white mt-1">x{r.amt}</div>
                                      {r.converted && <div className="text-[10px] text-cyan-300 mt-2 bg-stone-900 px-2 py-1 rounded w-full text-center border border-cyan-900/50">♻️ {r.convertedMsg || '已解鎖轉化'} +{r.converted}💠</div>}
                                  </div>
                              ))}
                          </div>
                          <button onClick={() => setGachaResult(null)} className="bg-stone-700 hover:bg-stone-600 px-8 py-3 rounded-full font-bold text-white transition-colors shadow-lg">繼續招募</button>
                      </div>
                  ) )}
              </div>
          </div>
      );
  };

  if (sysError) {
      return (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8">
               <div className="bg-stone-900 border-2 border-red-500 p-8 rounded-3xl max-w-lg w-full text-white font-mono text-sm shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-2 bg-red-600 animate-pulse"></div>
                   <div className="flex items-center gap-3 mb-6 text-red-400"><AlertTriangle size={32}/> <h3 className="text-2xl font-bold">系統攔截</h3></div>
                   <p className="mb-8 text-stone-300 leading-relaxed bg-stone-950 p-4 rounded-lg border border-stone-800">{sysError}</p>
                   <button onClick={() => { setSysError(null); }} className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-red-900/20">確認</button>
               </div>
           </div>
      );
  }

  if (sysInfo) {
      return (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8">
               <div className="bg-stone-900 border-2 border-yellow-500 p-8 rounded-3xl max-w-lg w-full text-white font-mono text-sm shadow-2xl relative overflow-hidden animate-fade-in">
                   <div className="flex items-center gap-3 mb-6 text-yellow-400"><Sparkles size={32}/> <h3 className="text-2xl font-bold">系統提示</h3></div>
                   <p className="mb-8 text-stone-300 leading-relaxed bg-stone-950 p-4 rounded-lg border border-stone-800 whitespace-pre-wrap">{sysInfo}</p>
                   <button onClick={() => { setSysInfo(null); }} className="w-full bg-yellow-600 hover:bg-yellow-500 text-stone-900 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-yellow-900/20">太棒了！</button>
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
                  case 'select_brawl_enemy': return renderSelectBrawlEnemy();
                  case 'battle': return renderBattle();
                  case 'home': return renderHome();
                  case 'gallery': return renderGallery();
                  case 'shop': return renderShop();
                  case 'gacha': return renderGacha();
                  case 'encounter_dialogue': return renderEncounterDialogue();
                  case 'mine': return renderMine();
                  case 'forge': return renderForge();
                  case 'garden': return renderGarden();
                  case 'story_chapters': return renderStoryChapters();
                  case 'story_select_char': return renderStorySelectChar();
                  case 'story_dialogue': return renderStoryDialogue();
                  case 'story_victory': return renderStoryVictory();
                  case 'select_reward': return (
                      <div className="min-h-screen p-8 flex flex-col items-center justify-center bg-stone-900 text-stone-200">
                          <h2 className="text-4xl font-bold text-yellow-500 mb-8 animate-bounce">🎁 戰鬥勝利！</h2>
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
                              <h2 className="text-3xl font-bold text-white mb-6">{winner==='player'?'討伐成功！':'力竭倒下...'}</h2>
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