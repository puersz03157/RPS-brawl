import React, { useState, useEffect, useRef } from 'react';
import { Zap, Sparkles, BookOpen, Home, Gamepad2, Coffee, MessageCircle, ArrowLeft, ShoppingCart, Star, Camera, X, Moon, Heart, HelpCircle, Info, AlertTriangle, Skull, ChevronLeft, ChevronRight, Lock, Trophy, CheckCircle } from 'lucide-react';

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
  { id: 'bear', name: '熊吉', icon: '🐻', title: '森林守護者', element: ELEMENTS.WOOD, image: 'avatar_bear.png', prefAction: 'snack', stats: { hp: 650, maxHp: 650, atk: 40, def: 30 }, desc: '依賴增益強化自身的爆發型戰士。', lore: '原本是守護森林神木的巨熊獸人。大星晶碎裂導致森林枯萎，為了解決異變而踏上旅程。超級喜歡蜂蜜，肚子餓的時候會變得暴躁。', skill1: { name: '熊吼之怒', cost: 20, desc: '自身隨機獲得一種增益：攻擊提升、防禦提升或再生 (3回合)。' }, skill2: { name: '魚竿甩擊', cost: 80, desc: '消耗身上所有增益，基礎 50 傷害 (每層增益+40)，並施加 🌿[寄生] 3回合。' } },
  { id: 'wolf', name: '白澤', icon: '🐺', title: '滄海孤狼', element: ELEMENTS.WATER, image: 'avatar_wolf.png', prefAction: 'gaming', stats: { hp: 500, maxHp: 500, atk: 55, def: 20 }, desc: '善用冰封護盾進行防禦與風險反擊。', lore: '來自極寒之地的冷酷劍客，奉命尋找失落的星晶。外表高冷，但其實是個會默默幫大家守夜的傲嬌，非常注重保暖。', skill1: { name: '冰封防禦', cost: 30, desc: '給予自身 50 護盾，並獲得「下一次猜拳戰敗時獲得 50 能量」狀態。' }, skill2: { name: '護盾攻擊', cost: 80, desc: '消耗所有護盾造成等量傷害，並自身恢復消耗護盾值一半的 HP。' } },
  { id: 'cat', name: '布提婭', icon: '🐈‍⬛', title: '夜靈貓', element: ELEMENTS.DARK, image: 'avatar_cat.png', prefAction: 'snack', stats: { hp: 400, maxHp: 400, atk: 70, def: 15 }, desc: '能施加多種負面狀態並吸取生命。', lore: '意外吞下了暗屬性的星晶碎片，化身為擁有強大魔力的夜靈貓。傲慢任性，覺得人類都是她的鏟屎官，但為了保護高級罐罐會拼盡全力。', skill1: { name: '奇異之光', cost: 40, desc: '必定降攻或降防(3回)，且必定附加封印或眩目(1回)。' }, skill2: { name: '黑暗之抓', cost: 75, desc: '無視護盾造成 80 傷害。對方每有一種負面狀態，自身恢復 30 HP。' } },
  { id: 'human', name: '普爾斯', icon: '🧑‍🚒', title: '烈焰鬥士', element: ELEMENTS.FIRE, image: 'avatar_human.png', prefAction: 'gaming', stats: { hp: 550, maxHp: 550, atk: 50, def: 20 }, desc: '能引爆燃燒造成毀滅性爆發與回復。', lore: '熱血的工會討伐者，以一把燃燒的大劍聞名。總是衝在最前線享受狩獵魔物的快感，不管遇到什麼困難都覺得「烤個肉吃就能解決」。', skill1: { name: '燃燒之劍', cost: 40, desc: '給予對方 30 傷害，並施加 🔥[燃燒] 3回合。' }, skill2: { name: '黑炎爆發', cost: 80, desc: '給予 70 傷害，立即結算對手燃燒，每結算一回合自身恢復 30 HP。' } },
  { id: 'elf', name: '布布', icon: '🧚', title: '光之精靈', element: ELEMENTS.LIGHT, image: 'avatar_elf.png', prefAction: 'chat', stats: { hp: 450, maxHp: 450, atk: 45, def: 25 }, desc: '運用能量反噬與葵花子戰鬥的奇兵。', lore: '誕生於光之星晶的精靈，負責引導夜行者們收集星晶。天然呆，喜歡收集發亮的東西和各種植物種子（尤其是葵花子）。', skill1: { name: '能量炸彈', cost: 50, desc: '清空雙方能量並造成各自能量傷害，自身恢復能量差值的 HP。' }, skill2: { name: '囤囤之力', cost: 35, desc: '獲得一個葵花子，每有一個葵花子給予對手 20 傷害 (不消耗)。' } },
  { id: 'kohaku', name: '琥珀', icon: '🦊', title: '商會會長', element: ELEMENTS.LIGHT, image: 'avatar_kohaku.png', prefAction: 'snack', stats: { hp: 750, maxHp: 750, atk: 55, def: 40 }, desc: '利用金幣與VIP狀態進行極致剝削。', lore: '艾歐蘭斯商會的最高負責人。看似笑瞇瞇其實精打細算，掌握著整個大陸的經濟命脈。用錢砸人是他的拿手好戲。', skill1: { name: '尊榮推銷', cost: 30, desc: '自身獲得 1 枚【商會金幣】與 50 盾，並強制對手成為 💳[VIP] 3回合。' }, skill2: { name: '資本鎮壓', cost: 80, desc: '基礎 80 傷。每消耗 1 枚金幣追加 50 真實傷害並回 30 HP。' } },
  { id: 'aldous', name: '奧爾德斯', icon: '🦉', title: '大長老', element: ELEMENTS.DARK, image: 'avatar_aldous.png', prefAction: 'chat', stats: { hp: 680, maxHp: 680, atk: 80, def: 30 }, desc: '擁有看破機制的極限單體爆發力。', lore: '黑羽公會大長老，實力深不可測的貓頭鷹獸人。雖然年事已高，但揮舞天羽斬的速度依舊無人能及。戰鬥時周身環繞睿智之風。', skill1: { name: '長老的威壓', cost: 40, desc: '施加 ❄️[封印] 1回、🤐[沉默] 2回與 📉[降防] 3回。' }, skill2: { name: '秘劍・天羽斬', cost: 60, desc: '無視護盾 80 傷。若對手處於沉默或封印，傷害變為 4 倍(320)並吸血 50%。' } }
];

const HIDDEN_CHARACTER = { 
  id: 'xiangxiang', name: '庠庠', icon: '🐯', title: '慵懶的白虎', element: ELEMENTS.LIGHT, isEmoji: false, image: 'avatar_xiangxiang.png', stats: { hp: 700, maxHp: 700, atk: 60, def: 35 }, prefAction: 'snack', desc: '全圖鑑收集獎勵。擁有強大的防禦與拘束力。', lore: '傳說中負責維持大陸夜間秩序的白虎神獸。因為大星晶碎裂導致魔物橫行，被迫瘋狂加班巡夜，導致他現在極度嗜睡。被柯特的訓獸之力與特製宵夜喚醒而加入。', skill1: { name: '軟萌肚肚', cost: 40, desc: '展現充滿彈性的肚子，獲得 50 護盾，並使對手 💫[強制] 下回出拳。' }, skill2: { name: '致命擁抱', cost: 90, desc: '無視護盾造成 100 傷害。若施放時有護盾，額外加 50 傷並 ❄️[封印]。' } 
};

const VARIANTS = [
  { id: 'newyear_bear', baseId: 'bear', name: '新年熊吉', icon: '🧧', title: '人人有魚', element: ELEMENTS.WOOD, isEmoji: false, image: 'avatar_newyear_bear.png', stats: { hp: 700, maxHp: 700, atk: 35, def: 35 }, desc: '分享祝福的森林大胃王。', lore: '換上喜氣洋洋的紅色和服，拿著釣竿到處分享漁獲與祝福的熊吉。', skill1: { name: '新春撒網', cost: 30, desc: '自身獲得 ⚡[亢奮] 3回合，對手陷入 💤[疲憊] 3回合。' }, skill2: { name: '年年有餘', cost: 80, desc: '消耗所有能量造成 80 基礎傷害。自身恢復 100 HP與80盾，對手僅恢復 30 HP。' }, unlockHint: '收集 50 個碎片於圖鑑合成解鎖。' },
  { id: 'harvest_elf', baseId: 'elf', name: '豐收節布布', icon: '🌻', title: '花開富貴', element: ELEMENTS.WOOD, isEmoji: false, image: 'avatar_harvest_elf.png', stats: { hp: 600, maxHp: 600, atk: 40, def: 30 }, desc: '生命再生與護盾雙修的生存輔助。', lore: '換上秋季豐收服飾的布布，口袋裡總是塞滿了剛採收的黃金葵花子。', skill1: { name: '黃金種子', cost: 30, desc: '獲得 1 顆葵花子(上限5)，並獲得再生(3回)。' }, skill2: { name: '萬物滋長', cost: 60, desc: '造成40傷(每顆種子+20傷)，總傷害的50%轉為護盾。' }, unlockHint: '收集 50 個碎片於圖鑑合成解鎖。' },
  { id: 'blackflame_human', baseId: 'human', name: '黑炎暴走普爾斯', icon: '🔥', title: '終焉煉獄', element: ELEMENTS.FIRE, isEmoji: false, image: 'avatar_blackflame_human.png', stats: { hp: 500, maxHp: 500, atk: 85, def: 15 }, desc: '燃燒結算與殘血狂化的極限輸出。', lore: '被深淵魔炎侵蝕的普爾斯。理智邊緣徘徊，但換來了能將一切焚燒殆盡的終焉之力。', skill1: { name: '餘燼枷鎖', cost: 40, desc: '造成35傷，施加燃燒與易傷(3回)。' }, skill2: { name: '終焉煉獄斬', cost: 85, desc: '基礎80傷。若目標有燃燒，立即結算其傷害，每剩餘回合使奧義傷害+20%。' }, unlockHint: '收集 50 個碎片於圖鑑合成解鎖。' },
  { id: 'valentine_wolf', baseId: 'wolf', name: '情人節白澤', icon: '💝', title: '冷酷甜心', element: ELEMENTS.WATER, isEmoji: false, image: 'avatar_valentine_wolf.png', stats: { hp: 550, maxHp: 550, atk: 50, def: 35 }, desc: '靈活護盾與封印控制的防禦反擊者。', lore: '罕見地穿上正裝，嘴裡刁著巧克力棒。雖然總是一臉嫌棄，但對於收到的心意都會好好珍惜。', skill1: { name: '糖衣護盾', cost: 45, desc: '獲得60點護盾，並賦予迴避(1次)。' }, skill2: { name: '心碎冰封', cost: 75, desc: '造成65傷，60%機率施加封印(1回)。' }, unlockHint: '收集 50 個碎片於圖鑑合成解鎖。' },
  { id: 'halloween_cat', baseId: 'cat', name: '萬聖節布提婭', icon: '🎃', title: '搗蛋貓咪', element: ELEMENTS.DARK, isEmoji: false, image: 'avatar_halloween_cat.png', stats: { hp: 450, maxHp: 450, atk: 65, def: 20 }, desc: '隨機擾亂與負面狀態增傷的惡作劇大師。', lore: '萬聖夜的絕對統治者。為了討要全大陸的高級貓草罐罐，她不介意用最惡劣的咒語來「拜訪」不給糖的傢伙。', skill1: { name: '不給糖就搗蛋', cost: 30, desc: '隨機賦予敵方一種屬性下降，且自身獲得亢奮或迴避。' }, skill2: { name: '萬聖影襲', cost: 80, desc: '無視護盾基礎50傷。目標每有一種負面狀態，傷害提升 1.5 倍(連乘)。' }, unlockHint: '收集 50 個碎片於圖鑑合成解鎖。' },
  { id: 'christmas_xiangxiang', baseId: 'xiangxiang', name: '聖誕節庠庠', icon: '🎁', title: '最棒的禮物', element: ELEMENTS.LIGHT, isEmoji: false, image: 'avatar_christmas_xiangxiang.png', stats: { hp: 850, maxHp: 850, atk: 70, def: 45 }, desc: '全圖鑑收集與異裝齊全的終極型態。', lore: '被柯特套上麋鹿裝的白虎。原本想在聖誕節好好補眠，卻因為收到太多禮物而難得精神百倍。', skill1: { name: '聖誕大禮包', cost: 40, desc: '隨機抽取三種增益狀態賦予自身(3回合)。' }, skill2: { name: '聖夜沉眠', cost: 90, desc: '造成100點光屬性傷害，並強制施加眩目/強制。' }, unlockHint: '收集齊其餘五件異裝後自動解鎖。' }
];

const NORMAL_MONSTERS = [
  { id: 'm1', name: '草原史萊姆', title: '黏糊糊的', element: ELEMENTS.WOOD, isEmoji: false, icon: '🍄', image: 'monster_slime.png', prefHand: 'PAPER', stats: { hp: 250, maxHp: 250, atk: 25, def: 5 }, lore: '最常見的低級魔物，喜歡寄生在別人身上吸取養分。被收服後意外地適合拿來當抱枕。', skill1: { name: '寄生孢子', cost: 30, desc: '造成 10 傷害並施加 🌿[寄生] 2回合。' }, skill2: { name: '光合作用', cost: 60, desc: '回復自己 60 點生命值。' } },
  { id: 'm2', name: '巨石蟹', title: '硬邦邦的', element: ELEMENTS.WATER, isEmoji: false, icon: '🦀', image: 'monster_crab.png', prefHand: 'SCISSORS', stats: { hp: 400, maxHp: 400, atk: 20, def: 25 }, lore: '全身覆蓋堅硬岩石的螃蟹，防禦力驚人。生氣時會吐出冰封泡泡。', skill1: { name: '硬化', cost: 30, desc: '獲得 50 點護盾。' }, skill2: { name: '泡泡光線', cost: 60, desc: '造成 40 傷害並施加 ❄️[封印] 1回合。' } },
  { id: 'm3', name: '爆炎犬', title: '熱騰騰的', element: ELEMENTS.FIRE, isEmoji: false, icon: '🐕', image: 'monster_dog.png', prefHand: 'ROCK', stats: { hp: 300, maxHp: 300, atk: 45, def: 10 }, lore: '性格暴躁的犬型魔物，全身燃燒著火焰，咬合力極強。收服後冬天可以用來當暖爐。', skill1: { name: '火焰牙', cost: 30, desc: '造成 20 傷害並施加 🔥[燃燒] 2回合。' }, skill2: { name: '地獄火', cost: 70, desc: '造成高達 80 點傷害。' } },
  { id: 'm4', name: '閃耀精靈', title: '刺眼的', element: ELEMENTS.LIGHT, isEmoji: false, icon: '🧚', image: 'monster_fairy.png', prefHand: 'PAPER', stats: { hp: 280, maxHp: 280, atk: 35, def: 15 }, lore: '被光之星晶過度影響而失去理智的精靈，會發出強光致盲對手。', skill1: { name: '致盲', cost: 40, desc: '施加 💫[眩目] 1回合。' }, skill2: { name: '神聖新星', cost: 70, desc: '造成 40 點傷害並回復自身 40 血。' } },
  { id: 'm5', name: '影魔眼', title: '陰森森的', element: ELEMENTS.DARK, isEmoji: false, icon: '👁️', image: 'monster_eye.png', prefHand: 'ROCK', stats: { hp: 220, maxHp: 220, atk: 55, def: 5 }, lore: '漂浮在空中的巨大眼球，凝視會讓人陷入恐懼與沉默。', skill1: { name: '恐懼凝視', cost: 40, desc: '施加 🤐[沉默] 2回合。' }, skill2: { name: '虛空射線', cost: 60, desc: '造成 70 點高額傷害。' } }
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
  { id: 't13', name: '極限爆發', cost: 5, desc: '所有造成的直接傷害無條件 x1.5 倍', icon: '💥', req: 'cost5' },
  { id: 't_harvest_elf', name: '豐饒之角', cost: 5, desc: '初始+2種子。再生狀態時受傷-15%，每回恢復5能量。(豐收節布布專屬)', icon: '🌽', req: 'cost5', exclusiveTo: 'harvest_elf' },
  { id: 't_blackflame_human', name: '狂化血脈', cost: 5, desc: 'HP低於40%時攻擊力提升30點，且無視目標15點防禦。(黑炎普爾斯專屬)', icon: '🩸', req: 'cost5', exclusiveTo: 'blackflame_human' },
  { id: 't_valentine_wolf', name: '苦甜回憶', cost: 5, desc: '護盾被破壞時，恢復20點能量並獲得攻擊提升3回合。(情人節白澤專屬)', icon: '💝', req: 'cost5', exclusiveTo: 'valentine_wolf' },
  { id: 't_halloween_cat', name: '幻夜貓蹤', cost: 5, desc: '回合結束對手每個Debuff造成15傷。對手有Debuff時減傷20%。(萬聖布提婭專屬)', icon: '🦇', req: 'cost5', exclusiveTo: 'halloween_cat' },
  { id: 't_christmas_xiangxiang', name: '最棒的禮物', cost: 5, desc: '每 3 回合自動恢復 10% 最大生命值並獲得 20 能量。(聖誕庠庠專屬)', icon: '🎄', req: 'cost5', exclusiveTo: 'christmas_xiangxiang' }
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
  { lv: 1, name: '廢棄礦道',   baseRate: 10, capBase: 50,  slots: 2, upgradeCost: 50  },
  { lv: 2, name: '開採礦坑',   baseRate: 15, capBase: 80,  slots: 2, upgradeCost: 120 },
  { lv: 3, name: '深層礦脈',   baseRate: 20, capBase: 110, slots: 3, upgradeCost: 250 },
  { lv: 4, name: '精煉礦場',   baseRate: 25, capBase: 140, slots: 3, upgradeCost: 500 },
  { lv: 5, name: '星晶核心礦', baseRate: 30, capBase: 200, slots: 4, upgradeCost: null },
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
  { id: 'egg',  name: '星紋鳥蛋', icon: '🥚', cost: 20 },
  { id: 'meat', name: '野獸魔肉', icon: '🥩', cost: 20 },
  { id: 'fish', name: '銀流溪魚', icon: '🐟', cost: 20 },
  { id: 'mush', name: '夜光孢菇', icon: '🍄', cost: 20 },
  { id: 'herb', name: '翠葉靈草', icon: '🌿', cost: 20 },
  { id: 'water',name: '元素靈水', icon: '💧', cost: 20 },
];

const RECIPES = [
  {
    id: 'grilled_fish', name: '溪魚鹽烤', grade: '普通', icon: '🍣', cost: 15,
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
];

const COOKING_PREF_BONUS = 1.2; // 偏好料理效果 +20%

const GUIDE_TERMS = [
    { term: '星晶 (Star Crystal)', desc: '核心貨幣，用於購買天賦與特殊型態。' },
    { term: 'AP (行動點數)', desc: '戰鬥勝利獲得，用於營地互動提升角色羈絆。' },
    { term: '專精等級', desc: '角色通關戰役累計，滿 3 星可解鎖專屬 CG。' },
    { term: '友誼之巔', desc: '任意雙人羈絆達滿級 (20點) 時解鎖的特殊雙人回憶。' }
];

// 【V2.6 成就系統定義】
const ACHIEVEMENTS = [
    { id: 'a_win_10', name: '初級夜行者', desc: '戰鬥勝利 10 場', target: 10, reward: 100, getProgress: (p) => p.battlesWon || 0 },
    { id: 'a_win_50', name: '猛漢町常客', desc: '戰鬥勝利 50 場', target: 50, reward: 300, getProgress: (p) => p.battlesWon || 0 },
    { id: 'a_cap_5', name: '訓獸見習生', desc: '成功收服 5 種魔物', target: 5, reward: 150, getProgress: (p) => (p.captured || []).length },
    { id: 'a_cap_all', name: '生態觀察家', desc: '收服所有一般與Boss魔物 (共10種)', target: 10, reward: 500, getProgress: (p) => (p.captured || []).length },
    { id: 'a_pull_10', name: '小試身手', desc: '在迷途酒館進行 10 次招募', target: 10, reward: 150, getProgress: (p) => p.gachaPulls || 0 },
    { id: 'a_pull_50', name: '資本的力量', desc: '在迷途酒館進行 50 次招募', target: 50, reward: 500, getProgress: (p) => p.gachaPulls || 0 },
    { id: 'a_mastery_1', name: '專精之路', desc: '將 1 名角色的專精提升至 3 星', target: 1, reward: 200, getProgress: (p) => Object.values(p.mastery || {}).filter(v => v >= 3).length },
    { id: 'a_mastery_all', name: '全職業制霸', desc: '將 5 名角色的專精提升至 3 星', target: 5, reward: 1000, getProgress: (p) => Object.values(p.mastery || {}).filter(v => v >= 3).length },
    { id: 'a_aff_1', name: '友誼之巔', desc: '解鎖 1 張雙人羈絆滿級CG', target: 1, reward: 200, getProgress: (p) => Object.values(p.affection || {}).filter(v => v >= 20).length },
    { id: 'a_aff_3', name: '柯特的宵夜常客', desc: '解鎖 3 張雙人羈絆滿級CG', target: 3, reward: 600, getProgress: (p) => Object.values(p.affection || {}).filter(v => v >= 20).length },
];

// ==========================================
// 3. 遊戲機制輔助函數
// ==========================================
const isBasicChar = (c) => ['bear', 'wolf', 'cat', 'human', 'elf'].includes(c?.id);
const isT0Char = (c) => ['xiangxiang', 'kohaku', 'aldous', 'christmas_xiangxiang'].includes(c?.id);
const isMonsterChar = (c) => NORMAL_MONSTERS.some(m => m.id === c?.id) || BOSS_MONSTERS.some(b => b.id === c?.id) || ADVANCED_MONSTERS.some(m => m.id === c?.id) || ADVANCED_BOSSES.some(b => b.id === c?.id);
const isVariantChar = (c) => VARIANTS.some(v => v.id === c?.id);
const isFullGallery = (capturedArr) => (capturedArr || []).length >= (NORMAL_MONSTERS.length + BOSS_MONSTERS.length);
const getActualCost = (cost, hasT8) => hasT8 ? Math.max(0, cost - 15) : cost;

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
    if (!char) return null;
    return (
        <div className={`${size} rounded-full border-2 border-stone-600 bg-stone-800 flex items-center justify-center overflow-hidden shrink-0 relative`}>
            {char.isEmoji ? (
                <span className={`text-3xl ${grayscale ? 'grayscale opacity-30' : ''}`}>{char.emoji}</span>
            ) : (
                <img src={char.image} className={`w-full h-full object-cover ${grayscale ? 'grayscale opacity-30' : ''}`} alt={char.name} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML += `<span class="text-xs">?</span>`; }} />
            )}
        </div>
    );
};
const NpcDialogue = ({ npcName, npcImage, npcImageFallback, dialogues }) => {
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
                    {npcImage ? (
                        <img src={npcImage} alt={npcName} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML += `<span class="text-5xl">${npcImageFallback}</span>`; }} />
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
  const [sysInfo, setSysInfo] = useState(null);
  const [toast, setToast] = useState(null);
  const [gachaResult, setGachaResult] = useState(null);
  const [shopTab, setShopTab] = useState('crystal');
  const [gachaPreviewIdx, setGachaPreviewIdx] = useState(0);

  // 【V2.6】加入 battlesWon, gachaPulls, claimedAchievements
  const [progress, setProgress] = useState({ crystals: 0, maxTalents: 3, unlocks: [], encountered: [], captured: [], mastery: {}, ap: 5, affection: {}, snackCount: 0, fragments: 0, charFragments: {}, usedCodes: [], charCostUpgrades: {}, battlesWon: 0, gachaPulls: 0, claimedAchievements: [], mine: { lv: 1, workers: [], lastCollect: null, pending: 0 }, ingredients: {}, unlockedRecipes: [], pendingMeal: null });
  const [isLoaded, setIsLoaded] = useState(false);

  const [player, setPlayer] = useState({ char: null, talents: [], hp: 0, maxHp: 0, energy: 0, atk: 0, def: 0, shield: 0, buffs: { dmgMult: 1, extraDmg: 0, energyOnLoss: false }, permaBuffs: { startEnergy: 0, startShield: 0, seeds: 0, coins: 0, turnCount: 0 }, status: [] });
  const [enemy, setEnemy] = useState({ char: null, talents: [], hp: 0, maxHp: 0, energy: 0, atk: 0, def: 0, shield: 0, buffs: { dmgMult: 1, extraDmg: 0, atkReduction: 0, energyOnLoss: false }, permaBuffs: { startEnergy: 0, startShield: 0, seeds: 0, coins: 0, turnCount: 0 }, status: [] });

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
                ingredients: p.ingredients || {}, unlockedRecipes: Array.isArray(p.unlockedRecipes) ? p.unlockedRecipes : [], pendingMeal: p.pendingMeal || null
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
    const healAmt = Math.max(1, Math.floor(actualHpDamage * 0.15));
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
        if (num === 1) applyStatus(atk, ['ATK_UP', 'DEF_UP', 'REGEN'][Math.floor(Math.random()*3)], 3, 20, null, buf, atkDeferred);
        else { const count = (atk.status||[]).filter(s => s && isBuffStatus(s.type)).length; dmgDealt = dealDirectDmg(50 + count * 40, atk, def, buf); applyStatus(def, 'PARASITE', 3, 15, null, buf, defDeferred); atk.status = Array.isArray(atk.status) ? atk.status.filter(s => s && !isBuffStatus(s.type)) : []; }
    } else if (id === 'newyear_bear') {
        if (num === 1) { applyStatus(atk, 'EXCITE', 3, 0, null, buf, atkDeferred); applyStatus(def, 'FATIGUE', 3, 0, null, buf, defDeferred); }
        else { dmgDealt = dealDirectDmg(80, atk, def, buf); atk.energy = 0; atk.hp = Math.min(atk.maxHp, atk.hp + 100); def.hp = Math.min(def.maxHp, def.hp + 30); atk.shield += 80; applyStatus(atk, 'EVADE', 1, 0, null, buf, atkDeferred); }
    } else if (id === 'wolf') {
        if (num === 1) { atk.shield += 50; if(!atk.buffs) atk.buffs={}; atk.buffs.energyOnLoss = true; }
        else { dmgDealt = dealDirectDmg(atk.shield, atk, def, buf); atk.hp = Math.min(atk.maxHp, atk.hp + Math.floor(atk.shield/2)); atk.shield = 0; }
    } else if (id === 'cat') {
        if (num === 1) { applyStatus(def, ['ATK_DOWN', 'DEF_DOWN'][Math.floor(Math.random()*2)], 3, 20, null, buf, defDeferred); applyStatus(def, ['FREEZE','DAZZLE'][Math.floor(Math.random()*2)], 1, 0, getRandomHand(), buf, defDeferred); }
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
            other.hp = Math.max(0, other.hp - dmg);
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
    }
    processEoR(p, e, buf); processEoR(e, p, buf);
    setPlayer(p); setEnemy(e); setLogs(prev => [...prev, ...buf]);
    if (p.hp <= 0) handleDeath('player'); else if (e.hp <= 0) handleDeath('enemy');
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
            permaBuffs: { startEnergy: 0, startShield: 0, seeds: pSeeds, coins: 0, turnCount: 0 }, status: [] 
        };
        if (tIds.includes('t_bear')) { const pool = shuffle(['ATK_UP', 'DEF_UP', 'REGEN']); pObj.status.push({ type: pool[0], duration: 3, value: 20, isNew: false, isDeferred: false }, { type: pool[1], duration: 3, value: 20, isNew: false, isDeferred: false }); }

        // 套用料理 Buff
        let mealLog = null;
        if (progress.pendingMeal) {
          const meal = RECIPES.find(r => r.id === progress.pendingMeal);
          if (meal) {
            const charBaseId = selectedChar.baseId || selectedChar.id;
            const isFavored = meal.favoredBy.includes(charBaseId);
            const mult = isFavored ? COOKING_PREF_BONUS : 1;
            const b = meal.buff;
            if (b.type === 'hp')         { const bonus = Math.floor(b.value * mult); pObj.maxHp += bonus; pObj.hp += bonus; }
            if (b.type === 'shield')     { pObj.shield += Math.floor(b.value * mult); }
            if (b.type === 'energy')     { pObj.energy = Math.min(100, pObj.energy + Math.floor(b.value * mult)); }
            if (b.type === 'regen')      { pObj.status.push({ type: 'REGEN', duration: 99, value: Math.floor(b.value * mult), isNew: false, isDeferred: false }); }
            if (b.type === 'hp_energy')  { const hb = Math.floor(b.hp * mult); pObj.maxHp += hb; pObj.hp += hb; pObj.energy = Math.min(100, pObj.energy + Math.floor(b.energy * mult)); }
            if (b.type === 'atk_shield') { pObj.atk += Math.floor(b.atk * mult); pObj.shield += Math.floor(b.shield * mult); }
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
        if (eT.includes('t_bear')) { const pool = shuffle(['ATK_UP', 'DEF_UP', 'REGEN']); eObj.status.push({ type: pool[0], duration: 3, value: 20, isNew: false, isDeferred: false }, { type: pool[1], duration: 3, value: 20, isNew: false, isDeferred: false }); }

        let np = { ...progress };
        if (!encountered.includes(eChar.id)) { np.encountered = [...encountered, eChar.id]; }
        if (progress.pendingMeal) { np.pendingMeal = null; }
        saveProgress(np);

        const initLogs = [{ text: `夜晚的艾歐蘭斯充滿危險，戰鬥開始！`, type: 'system' }];
        if (mealLog) initLogs.push({ text: mealLog, type: 'info' });
        setPlayer(pObj); setEnemy(eObj); setNewlyCaptured(null); setLogs(initLogs); setGameState('battle');

    } catch (e) {
        console.error(e);
        setSysError(`戰鬥引擎載入失敗: ${e.message}\n請檢查是否有舊存檔干擾。`);
    }
  };

  const handleDeath = (target) => {
    let np = { ...progress };
    const isAdvanced = gameMode === 'advanced_campaign';
    const maxStage = isAdvanced ? 4 : 2;

    if (target === 'player') { saveProgress(np); setGameState('game_over'); setWinner('enemy'); } 
    else {
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
        if (isAdvanced) { earned = campaignStage < maxStage ? 3 : 10; }
        else if (gameMode === 'campaign') { earned = campaignStage < maxStage ? 1 : 2; }
        else { earned = 3; } 
        
        np.crystals += earned; saveProgress(np); setRewardCrystals(earned);
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
    
    np.energy = Math.min(100, (np.permaBuffs?.startEnergy || 0) + (np.talents.includes('t3') ? 25 : 0) + (np.talents.some(t=>['t9','t10','t11'].includes(t)) ? 20 : 0)); 
    np.shield = (np.permaBuffs?.startShield || 0) + (np.talents.includes('t4') ? 80 : 0); 
    np.status = []; 
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
            msg += `\n\n🎄 奇蹟發生了！集齊五件異裝，解鎖了【聖誕節庠庠】！`;
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
      'NIGHTSHIFT2026': { desc: '夜班工程師的護肝補給 (100晶 + 5AP)', apply: (p) => { p.crystals += 100; p.ap += 5; } },
      'XIAOBU_MEOW': { desc: '賓士貓小布的特級罐罐 (200星晶碎片)', apply: (p) => { p.fragments = (p.fragments||0) + 200; } },
      'KERT_BENTO': { desc: '柯特的滿滿愛心宵夜 (新年熊吉碎片x20)', apply: (p) => { p.charFragments = {...p.charFragments}; p.charFragments['newyear_bear'] = (p.charFragments['newyear_bear']||0) + 20; } },
      'MHHUNTERXXL': { desc: '猛漢町討伐物資 (300晶)', apply: (p) => { p.crystals += 300; } },
      'FF14WARRIOR': { desc: '光之戰士的祝福 (10AP)', apply: (p) => { p.ap += 10; } }
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
          setSysInfo('🌟 全員專精 3 星、AP滿級！(無限測試碼)'); saveProgress(np); 
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
      np.crystals += ach.reward;
      np.claimedAchievements = [...np.claimedAchievements, ach.id];
      saveProgress(np);
      showToastMsg(`🏆 領取成就【${ach.name}】獎勵：💎 ${ach.reward} 星晶！`);
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
    const np = { ...progress, fragments: (progress.fragments || 0) + gained, mine: { ...mine, pending: 0, lastCollect: new Date().toISOString() } };
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
        const ing = INGREDIENTS.find(i => i.id === ingId);
        setSysError(`食材不足！缺少 ${ing?.icon} ${ing?.name} x${qty - (progress.ingredients[ingId] || 0)}`);
        return;
      }
    }
    const newIngredients = { ...progress.ingredients };
    for (const [ingId, qty] of Object.entries(recipe.ingredients)) {
      newIngredients[ingId] = (newIngredients[ingId] || 0) - qty;
    }
    const np = { ...progress, ingredients: newIngredients, pendingMeal: recipe.id };
    saveProgress(np);
    showToastMsg(`🍳 烹飪完成：${recipe.name}！下次戰鬥生效。`);
  };

  const discardMeal = () => {
    const np = { ...progress, pendingMeal: null };
    saveProgress(np);
    showToastMsg('料理已丟棄。');
  };

  // ========================== 渲染函數區 ==========================
  const renderIntro = () => {
    const isAdvancedUnlocked = Object.values(progress.mastery || {}).some(lvl => lvl >= 3);

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
          <div className="flex gap-4 mb-6 z-10 font-bold text-lg flex-wrap justify-center">
              <div className="bg-stone-800 border border-stone-700 px-6 py-2 rounded-full shadow-lg text-blue-300">💎 星晶：{progress.crystals}</div>
              <div className="bg-stone-800 border border-stone-700 px-6 py-2 rounded-full shadow-lg text-cyan-300">💠 碎片：{progress.fragments || 0}</div>
              <div className="bg-stone-800 border border-stone-700 px-6 py-2 rounded-full shadow-lg text-green-400">⚡ AP：{progress.ap}</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl mb-8 z-10">
              <button onClick={() => selectMode('campaign')} className="bg-stone-800 p-4 border-2 border-stone-700 hover:border-yellow-500 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center">
                  <div className="text-3xl mb-2">🗺️</div>
                  <h2 className="text-lg font-bold mb-1">夜巡戰役</h2>
                  <p className="text-stone-400 text-[10px] hidden md:block">連續討伐，挑戰深淵霸主。</p>
              </button>
              
              <button onClick={() => {
                  if (isAdvancedUnlocked) selectMode('advanced_campaign');
                  else setSysError('【權限不足】請先將任意一位角色的「專精等級」提升至 3 星 (完成普通夜巡3次)，以證明你有足夠的實力面對深淵的真正面貌！');
              }} className={`bg-stone-800 p-4 border-2 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center relative overflow-hidden ${isAdvancedUnlocked ? 'border-red-900 hover:border-red-500' : 'border-stone-800 opacity-60 grayscale cursor-not-allowed'}`}>
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

              <button onClick={() => selectMode('brawl')} className="bg-stone-800 p-4 border-2 border-stone-700 hover:border-blue-500 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center col-span-2 md:col-span-1">
                  <div className="text-3xl mb-2">🤺</div>
                  <h2 className="text-lg font-bold mb-1">無盡亂鬥</h2>
                  <p className="text-stone-400 text-[10px] hidden md:block">自由切磋，磨練戰鬥技巧。</p>
              </button>
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
              <button onClick={() => { setGameState('gacha'); setGachaResult(null); }} className="bg-stone-800 p-4 border-2 border-stone-700 hover:border-purple-500 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center">
                  <div className="text-3xl mb-2">🍻</div>
                  <h2 className="text-lg font-bold mb-1">迷途酒館</h2>
                  <p className="text-stone-400 text-[10px] hidden md:block">花費星晶招募夥伴碎片。</p>
              </button>
              <button onClick={() => setGameState('mine')} className="bg-stone-800 p-4 border-2 border-stone-700 hover:border-yellow-600 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center">
                  <div className="text-3xl mb-2">⛏️</div>
                  <h2 className="text-lg font-bold mb-1">星晶礦坑</h2>
                  <p className="text-stone-400 text-[10px] hidden md:block">掛機採集，自動產出碎片。</p>
              </button>
          </div>
          <div className="flex items-center gap-4 z-10">
              <button onClick={() => setGameState('gallery')} className="flex items-center gap-2 text-stone-400 hover:text-white bg-stone-800 px-6 py-3 rounded-full border border-stone-700 transition-all hover:shadow-lg"><BookOpen size={20}/> 艾歐蘭斯圖鑑 {isFullGallery(captured) && !unlocks.includes('xiangxiang') && <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>}</button>
              <div className="relative flex items-center">
                  <button onClick={() => setShowCheat(!showCheat)} className="text-stone-700 hover:text-stone-400 text-xl transition-colors bg-stone-800 p-3 rounded-full border border-stone-700 shadow-md">🎁</button>
                  {showCheat && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-stone-800 p-3 rounded-xl shadow-2xl flex gap-2 border border-stone-600 z-50 animate-fade-in w-max">
                          <input type="text" value={cheatCode} onChange={e=>setCheatCode(e.target.value)} className="w-36 bg-stone-900 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 uppercase" placeholder="輸入兌換碼" />
                          <button onClick={handleRedeemCode} className="bg-yellow-600 hover:bg-yellow-500 text-stone-900 px-4 py-2 rounded-lg text-sm font-bold shadow-lg active:scale-95 transition-transform">兌換</button>
                      </div>
                  )}
              </div>
          </div>
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
            <button onClick={()=>setGameState('select_char')} className="self-start mb-4 flex items-center gap-2 text-stone-400 hover:text-white"><ArrowLeft/> 返回選角</button>
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
                    <Sparkles /> 隨機遭遇未知的強敵！ <Sparkles />
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {pool.map(c => {
                    const isBoss = BOSS_MONSTERS.some(b=>b.id===c.id) || ADVANCED_BOSSES.some(b=>b.id===c.id);
                    return (
                    <div key={c.id} onClick={() => startBattleMode(player.char, selectedTalentIds, c)} className={`bg-stone-800 p-4 rounded-xl border-2 transition-all hover:-translate-y-1 cursor-pointer flex items-center gap-4 shadow-md ${isBoss ? 'border-red-900/50 hover:border-red-500' : 'border-stone-700 hover:border-blue-500'}`}>
                        <SpriteAvatar char={c} size="w-12 h-12" />
                        <div>
                            <div className={`font-bold text-sm truncate w-24 ${isBoss ? 'text-red-400' : 'text-stone-200'}`}>{c.name}</div>
                            <div className="text-[10px] text-stone-500 font-mono">HP {c.stats.maxHp} | ATK {c.stats.atk}</div>
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

    return (
        <div className="min-h-screen p-4 flex flex-col max-w-3xl mx-auto h-screen bg-stone-950 text-stone-200">
            <div className="text-center text-xs text-stone-500 mb-2 font-bold">
                {gameMode === 'campaign' ? `夜巡戰役 - 第 ${campaignStage + 1} 戰` : gameMode === 'advanced_campaign' ? `征戰夜巡 - 第 ${campaignStage + 1} 戰 (高階)` : '無盡亂鬥'}
            </div>
            
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
                                                const ing = INGREDIENTS.find(i => i.id === id);
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
                    {['companions', 'enemies', 'achievements', 'guide'].map(t=>(<button key={t} onClick={() => setGalleryTab(t)} className={`px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${galleryTab===t? 'bg-blue-600 shadow-lg' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}>
                        {t==='companions'?'夜行者':t==='enemies'?'深淵魔物':t==='achievements'?<><Trophy size={18}/> 成就勳章</>:'冒險指南'}
                    </button>))}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto animate-fade-in">
                        <div className="bg-stone-800 p-8 rounded-3xl border border-stone-700"><h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2"><HelpCircle size={24}/> 基礎術語</h3><div className="space-y-4">{GUIDE_TERMS.map((g,i)=>(<div className="bg-stone-900 p-4 rounded-xl border border-stone-800" key={i}><span className="text-blue-400 font-bold block mb-1 text-lg">{g.term}</span><p className="text-stone-400 text-sm leading-relaxed">{g.desc}</p></div>))}</div></div>
                        <div className="bg-stone-800 p-8 rounded-3xl border border-stone-700"><h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center gap-2"><Sparkles size={24}/> 狀態表</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{STATUS_DOCS.map((s,i)=>(<div className="bg-stone-900 p-4 rounded-xl border border-stone-800 flex items-start gap-3" key={i}><span className="text-2xl mt-1">{s.icon}</span><div><span className={`font-bold block ${s.color}`}>{s.name}</span><p className="text-stone-400 text-xs mt-1 leading-relaxed">{s.effect}</p></div></div>))}</div></div>
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
                                                    <span className="text-[10px] bg-stone-950 px-2 py-1 rounded text-cyan-300 font-mono">💎 {ach.reward} 星晶</span>
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
                                        <h3 className="font-bold text-stone-400 text-xl">聖誕節庠庠</h3><p className="text-stone-500 text-xs mt-1">(最棒的禮物)</p>
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
                                        <div className="flex items-center gap-4"><SpriteAvatar char={c} size="w-16 h-16" /><div><div className={`text-xs mb-0.5 ${isAdvBoss || isAdvMon ? 'text-red-400' : 'text-gray-400'}`}>{c.title}</div><div className="text-xl font-bold flex items-center gap-2">{c.isEmoji ? c.emoji : c.icon} {c.name}</div></div></div>
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

    const crystalItems = [
      { id: 'work', name: '公會打工', desc: '消耗 1 點 AP 協助公會處理雜務，獲得 5 顆星晶。', cost: 1, currency: 'ap', icon: '💼', canBuy: true, bought: false, isInfinite: true, onBuy: () => { let np={...progress, ap: progress.ap - 1, crystals: progress.crystals + 5}; saveProgress(np); showToastMsg('打工成功！'); } },
      { id: 'massage', name: '星晶按摩', desc: '花費 5 顆星晶享受魔力按摩，恢復 1 點 AP。', cost: 5, currency: 'crystal', icon: '💆', canBuy: true, bought: false, isInfinite: true, onBuy: () => { let np={...progress, crystals: progress.crystals - 5, ap: progress.ap + 1}; saveProgress(np); showToastMsg('AP 恢復了！'); } },
      { id: 'max4', name: '擴展天賦槽 (4點)', desc: '將天賦點數上限提升至 4 點。', cost: 15, currency: 'crystal', icon: '⬆️', canBuy: progress.maxTalents === 3, bought: progress.maxTalents >= 4, onBuy: () => { let np={...progress, crystals: progress.crystals - 15, maxTalents: 4}; saveProgress(np); } },
      { id: 'max5', name: '擴展天賦槽 (5點)', desc: '將天賦點數上限提升至 5 點。', cost: 30, currency: 'crystal', icon: '🌟', canBuy: progress.maxTalents === 4, bought: progress.maxTalents >= 5, onBuy: () => { let np={...progress, crystals: progress.crystals - 30, maxTalents: 5}; saveProgress(np); } },
      { id: 'cost4', name: '進階戰術書 (Cost 4)', desc: '解鎖 3 種增幅特定猜拳的高階天賦。', cost: 20, currency: 'crystal', icon: '📘', canBuy: !unlocks.includes('cost4'), bought: unlocks.includes('cost4'), onBuy: () => { let np={...progress, crystals: progress.crystals - 20}; np.unlocks=[...unlocks,'cost4']; saveProgress(np); } },
      { id: 'cost5', name: '終極奧義卷軸 (Cost 5)', desc: '解鎖 2 種擁有逆轉戰局能力的終極天賦。', cost: 40, currency: 'crystal', icon: '📙', canBuy: !unlocks.includes('cost5'), bought: unlocks.includes('cost5'), onBuy: () => { let np={...progress, crystals: progress.crystals - 40}; np.unlocks=[...unlocks,'cost5']; saveProgress(np); } },
      { id: 'char_talents', name: '專屬覺醒指南 (Cost 3)', desc: '解鎖所有角色的「專屬天賦」。', cost: 25, currency: 'crystal', icon: '✨', canBuy: !unlocks.includes('char_talents'), bought: unlocks.includes('char_talents'), onBuy: () => { let np={...progress, crystals: progress.crystals - 25}; np.unlocks=[...unlocks,'char_talents']; saveProgress(np); } },
      { id: 'tamer_kert', name: '訓獸師的心得', desc: '解鎖魔物收服機制！', cost: 60, currency: 'crystal', icon: '🐾', canBuy: !unlocks.includes('tamer_kert'), bought: unlocks.includes('tamer_kert'), onBuy: () => { let np={...progress, crystals: progress.crystals - 60}; np.unlocks=[...unlocks,'tamer_kert']; saveProgress(np); } }
    ];

    const fragmentItems = [
      { id: 'f_ap', name: '柯特的愛心便當', desc: '充滿愛心的手作料理，消耗 100 碎片恢復 1 點 AP。', cost: 100, currency: 'fragment', icon: '🍱', canBuy: true, bought: false, isInfinite: true, onBuy: () => { let np={...progress, ap: progress.ap + 1, fragments: (progress.fragments || 0) - 100}; saveProgress(np); showToastMsg('享用了愛心便當，AP 恢復了！'); } },
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

    const displayItems = shopTab === 'crystal' ? crystalItems : shopTab === 'fragment' ? fragmentItems : shopTab === 'recipe' ? recipeItems : ingredientItems;

    return (
        <div className="min-h-screen p-8 bg-stone-900 text-stone-200">
            <button onClick={()=>setGameState('intro')} className="mb-8 flex items-center gap-2 text-stone-400 hover:text-white transition-colors"><ArrowLeft/> 返回首頁</button>
            <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto"><h2 className="text-3xl font-bold text-cyan-400">星晶商店</h2>
                <div className="flex gap-4">
                    <div className="text-blue-300 font-bold bg-stone-800 px-4 py-2 rounded-full border border-stone-700 shadow-lg">💎 星晶：{progress.crystals}</div>
                    <div className="text-cyan-300 font-bold bg-stone-800 px-4 py-2 rounded-full border border-stone-700 shadow-lg">💠 碎片：{progress.fragments || 0}</div>
                </div>
            </div>
            
            <NpcDialogue 
                npcName="商會會長" 
                npcImage="avatar_kohaku.png"
                npcImageFallback="🦊" 
                dialogues={[
                    "歡迎來到星晶商店！只要有足夠的星晶，沒有什麼是我琥珀辦不到的。",
                    "打工可以賺星晶，按摩可以恢復 AP，合理分配資源吧！",
                    "現在開放星晶碎片交易了，想要誰的情報，用碎片來換吧。",
                    "成為我的 VIP 吧，保證讓你體會到什麼叫「財力就是力量」。"
                ]} 
            />

            <div className="flex justify-center gap-4 mb-8 flex-wrap">
                <button onClick={() => setShopTab('crystal')} className={`px-8 py-3 rounded-full font-bold transition-all shadow-md ${shopTab === 'crystal' ? 'bg-blue-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700 border border-stone-700'}`}>💎 星晶交易區</button>
                <button onClick={() => setShopTab('fragment')} className={`px-8 py-3 rounded-full font-bold transition-all shadow-md ${shopTab === 'fragment' ? 'bg-cyan-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700 border border-stone-700'}`}>💠 碎片補給區</button>
                <button onClick={() => setShopTab('recipe')} className={`px-8 py-3 rounded-full font-bold transition-all shadow-md ${shopTab === 'recipe' ? 'bg-orange-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700 border border-stone-700'}`}>📖 食譜商店</button>
                <button onClick={() => setShopTab('ingredient')} className={`px-8 py-3 rounded-full font-bold transition-all shadow-md ${shopTab === 'ingredient' ? 'bg-green-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700 border border-stone-700'}`}>🧺 食材補給</button>
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
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-yellow-400 tracking-widest drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">⛏️ 星晶礦坑</h2>
            <p className="text-stone-400 text-sm mt-2">派遣夥伴自動採集星晶碎片，離線時持續產出！</p>
          </div>

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

  const renderGacha = () => {
      const gachaCost = 30;
      const gachaTenCost = 250; 
      
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
          saveProgress(np);
          setGachaResult(results);
      };

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
                  
                  <div className="text-center mb-10">
                      <h2 className="text-5xl font-bold text-purple-400 mb-4 tracking-widest drop-shadow-[0_0_15px_rgba(192,132,252,0.4)]">迷途酒館</h2>
                      <p className="text-stone-400">「這杯算我請的！要來點特別的情報嗎？」—— 神秘酒保</p>
                  </div>

                  {!gachaResult ? (
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
                  )}
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
                  case 'mine': return renderMine();
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