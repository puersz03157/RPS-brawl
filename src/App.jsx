import React, { useState, useEffect, useRef } from 'react';
import { Zap, Sparkles, BookOpen, Home, Gamepad2, Coffee, MessageCircle, ArrowLeft, ShoppingCart, Star, Camera, X, Moon, Heart, HelpCircle, Info, AlertTriangle, Skull, ChevronLeft, ChevronRight, Lock, Trophy, CheckCircle, Settings, Trash2 } from 'lucide-react';
import { ELEMENTS, RPS_CHOICES } from './data/elements';
import { STORY_CHAPTERS } from './data/storyChapters';
import { BATTLE_ITEMS } from './data/battleItems';
import { FORGE_PERMANENT, FORGE_CONSUMABLE, ALL_ARMORS } from './data/forge';
import { CHARACTERS, HIDDEN_CHARACTER, VARIANTS } from './data/characters';
import { NORMAL_MONSTERS, BOSS_MONSTERS, ADVANCED_MONSTERS, ADVANCED_BOSSES, TUTORIAL_ENEMY } from './data/monsters';
import { ALL_TALENTS } from './data/talents';
import { REWARD_POOL, STATUS_DOCS } from './data/rewards';
import { MINE_LEVELS, MINE_CHAR_BONUS } from './data/mine';
import { INGREDIENTS, RECIPES, COOKING_PREF_BONUS, GARDEN_INGREDIENTS, ALL_INGREDIENTS } from './data/cooking';
import { DAILY_QUEST_POOL, DAILY_QUEST_FULL_CLEAR, ALL_DAILY_QUESTS, ENCOUNTER_EVENTS } from './data/dailyQuests';
import { GUIDE_TERMS, GUIDE_SYSTEMS, ACHIEVEMENTS } from './data/guideAndAchievements';
import { CHAPTER_HOME_ADVANTAGES } from './data/chapterHomeAdvantage';

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
const shuffle = (array) => {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

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

const isBuffStatus = (type) => type && ['ATK_UP', 'DEF_UP', 'REGEN', 'EVADE', 'EXCITE', 'ITEM_REVERSE'].includes(type);
const isDebuffStatus = (type) => type && ['BURN', 'POISON', 'PARASITE', 'FREEZE', 'DAZZLE', 'SILENCE', 'ATK_DOWN', 'DEF_DOWN', 'VULNERABLE', 'FATIGUE', 'VIP'].includes(type);

const getStatusValueSum = (ent, type) => {
    if (!ent || !ent.status) return 0;
    return ent.status.filter(s => s && s.type === type).reduce((acc, curr) => acc + (curr.value || 0), 0);
};

/** 猜拳傷害第一步：面板攻防 + 狀態加減（與 playRound 一致） */
const getPanelAtk = (ent) => {
    if (!ent) return 0;
    return ent.atk + getStatusValueSum(ent, 'ATK_UP') - getStatusValueSum(ent, 'ATK_DOWN');
};
const getPanelDef = (ent) => {
    if (!ent) return 0;
    return ent.def + getStatusValueSum(ent, 'DEF_UP') - getStatusValueSum(ent, 'DEF_DOWN');
};

/**
 * 本側為「出拳獲勝的攻擊方」時的攻擊值推演（順序與 playRound 相同：狀態 → 黑炎+30 → t6×1.5）
 * lines 供戰鬥圖鑑說明，避免玩家誤以為面板數即最終傷害。
 */
const getAttackerAtkBreakdown = (ent) => {
    const panel = getPanelAtk(ent);
    const lines = [];
    let v = panel;
    if ((ent.talents || []).includes('t_blackflame_human') && ent.hp < ent.maxHp * 0.4) {
        v += 30;
        lines.push('狂化血脈（生命<40%）：攻擊 +30；命中時對手「防禦」結算 −15');
    }
    if ((ent.talents || []).includes('t6') && ent.hp < ent.maxHp * 0.3) {
        const before = v;
        v = Math.floor(v * 1.5);
        lines.push(`絕境反擊（生命<30%）：攻擊值×1.5（${before}→${v}）`);
    }
    return { panel, final: v, lines };
};

/** 攻擊方為黑炎暴走且生命<40% 時，對「防禦方」結算採用的防禦值（對方 def -15） */
const getDefValueVsBlackflameAttacker = (defender, attacker) => {
    if (!defender || !attacker) return null;
    if (!(attacker.talents || []).includes('t_blackflame_human')) return null;
    if (attacker.hp >= attacker.maxHp * 0.4) return null;
    return Math.max(0, getPanelDef(defender) - 15);
};

// ==========================================
// 2. 遊戲資料庫
// ==========================================
// （已拆分）元素 / 角色 / 魔物 / 天賦資料已搬到 `src/data/*`

// （已拆分）獎勵池 / 狀態說明已搬到 `src/data/rewards.js`

// ==========================================
// 礦坑系統設定
// ==========================================
// （已拆分）礦坑系統設定已搬到 `src/data/mine.js`

// ==========================================
// 烹飪系統設定
// ==========================================
// （已拆分）烹飪系統設定已搬到 `src/data/cooking.js`

// ==========================================
// 每日任務系統
// ==========================================
// （已拆分）每日任務池 / 奇遇事件已搬到 `src/data/dailyQuests.js`

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

// （已拆分）圖鑑用語 / 系統說明 / 成就定義已搬到 `src/data/guideAndAchievements.js`

// ==========================================
// 3. 遊戲機制輔助函數
// ==========================================
const isBasicChar = (c) => ['bear', 'wolf', 'cat', 'human', 'elf'].includes(c?.id);
const getCharTier = (c) => {
    if (!c) return 'unknown';
    // variants / 異裝型態（帶 baseId 的角色物件）
    if (c.baseId) return c.tier || 'rare';
    return c.tier || 'basic';
};
const isLegendaryChar = (c) => getCharTier(c) === 'legendary';
const isEpicChar = (c) => getCharTier(c) === 'epic';
const isMonsterChar = (c) => NORMAL_MONSTERS.some(m => m.id === c?.id) || BOSS_MONSTERS.some(b => b.id === c?.id) || ADVANCED_MONSTERS.some(m => m.id === c?.id) || ADVANCED_BOSSES.some(b => b.id === c?.id);
const isVariantChar = (c) => VARIANTS.some(v => v.id === c?.id);
const isFullGallery = (capturedArr) => (capturedArr || []).length >= (NORMAL_MONSTERS.length + BOSS_MONSTERS.length);
const getActualCost = (cost, hasT8) => hasT8 ? Math.max(0, Math.ceil(cost * 0.8)) : cost;

const getBaseTalents = (char) => {
    if (!char) return 3;
    if (isLegendaryChar(char)) return 5;
    if (isEpicChar(char)) return 4;
    if (BOSS_MONSTERS.some(b => b.id === char.id) || ADVANCED_BOSSES.some(b => b.id === char.id)) return 4;
    if (NORMAL_MONSTERS.some(m => m.id === char.id) || ADVANCED_MONSTERS.some(m => m.id === char.id)) return 4;
    return 3;
};

const getStatusName = (type) => {
    const map = { 'BURN': '燃燒', 'POISON': '中毒', 'PARASITE': '寄生', 'FREEZE': '封印', 'DAZZLE': '強制', 'SILENCE': '沉默', 'ATK_UP': '攻擊提升', 'DEF_UP': '防禦提升', 'REGEN': '再生', 'ATK_DOWN': '攻擊下降', 'DEF_DOWN': '防禦下降', 'VULNERABLE': '易傷', 'EVADE': '迴避', 'FATIGUE': '疲憊', 'EXCITE': '亢奮', 'VIP': 'VIP', 'ITEM_REVERSE': '道具反轉' };
    return map[type] || type;
};
const getStatusIcon = (type) => {
    const map = { 'VULNERABLE': '💢', 'EVADE': '💨', 'FATIGUE': '💤', 'EXCITE': '⚡', 'BURN': '🔥', 'POISON': '☠️', 'PARASITE': '🌿', 'FREEZE': '❄️', 'DAZZLE': '💫', 'SILENCE': '🤐', 'ATK_UP': '⚔️', 'DEF_UP': '🛡️', 'REGEN': '💖', 'ATK_DOWN': '📉', 'DEF_DOWN': '📉', 'VIP': '💳' };
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

// （已拆分）主線夜巡章節資料已搬到 `src/data/storyChapters.js`
// （已拆分）戰鬥道具列表已搬到 `src/data/battleItems.js`
// （已拆分）鍛造／護符資料已搬到 `src/data/forge.js`

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
  const [campaignPickerOpen, setCampaignPickerOpen] = useState(false);
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
  const [progress, setProgress] = useState({ crystals: 0, maxTalents: 3, unlocks: [], encountered: [], captured: [], mastery: {}, ap: 5, affection: {}, snackCount: 0, fragments: 0, charFragments: {}, usedCodes: [], charCostUpgrades: {}, battlesWon: 0, gachaPulls: 0, claimedAchievements: [], mine: { lv: 1, workers: [], lastCollect: null, pending: 0 }, ingredients: {}, unlockedRecipes: [], pendingMeal: null, tutorialDone: false, completedStoryChapters: [], items: {}, unlockedArmors: [], equippedArmor: null, consumableArmors: {}, pendingConsumableArmor: null, gardenDate: '', gardenPlays: { farm: 0, fishing: 0, hunting: 0, memory: 0 }, dailyQuestState: null, viewedEncounters: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [campaignRadarActive, setCampaignRadarActive] = useState(false); // 📡 寶物雷達：本次戰役全程星晶加倍
  const [singleRadarActive, setSingleRadarActive] = useState(false);     // 📡 寶物雷達：單場模式（如自訂對決）星晶加倍

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
    const pairA = memCards[a]?.pairId;
    const pairB = memCards[b]?.pairId;
    if (pairA && pairA === pairB) {
      setMemMatched((prev) => {
        const nm = [...prev, pairA];
        if (nm.length === 8) setMemPhase('result');
        return nm;
      });
      setMemFlipped([]);
    } else {
      const t = setTimeout(() => setMemFlipped([]), 900);
      return () => clearTimeout(t);
    }
  }, [memFlipped, memCards]);

  // 每日任務：登入初始化
  useEffect(() => {
    if (!isLoaded) return;
    const today = new Date().toISOString().slice(0, 10);
    saveProgress((prev) => {
      const dqs = prev.dailyQuestState;
      if (!dqs || dqs.date !== today) {
        return { ...prev, dailyQuestState: { date: today, progress: { dq_login: 1 }, claimed: [], fullClearClaimed: false } };
      }
      if ((dqs.progress?.dq_login || 0) < 1 && !dqs.claimed.includes('dq_login')) {
        return { ...prev, dailyQuestState: { ...dqs, progress: { ...dqs.progress, dq_login: 1 } } };
      }
      return prev;
    });
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
                viewedEncounters: Array.isArray(p.viewedEncounters) ? p.viewedEncounters : [],
            });
        }
    } catch(e) { console.warn("Save file invalid, starting fresh.", e); }
    setIsLoaded(true);
  }, []);

  const saveProgress = (nextOrUpdater) => {
    setProgress((prev) => {
      const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(prev) : nextOrUpdater;
      try { localStorage.setItem('starCrystalTales_V38_Stable', JSON.stringify(next)); } catch (e) {}
      return next;
    });
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

  // 🌻 [布布的葵花護符]：生命<50% 受擊時消耗葵花子，當下傷害 -50%
  const defBaseId0 = def?.char?.baseId || def?.char?.id;
  if (dmg > 0 && defBaseId0 === 'elf' && def?.permaBuffs?.armor === 'armor_seedguard' && def.hp < def.maxHp * 0.5) {
    const seeds = def.permaBuffs?.seeds || 0;
    if (seeds > 0) {
      def.permaBuffs = { ...(def.permaBuffs || {}), seeds: Math.max(0, seeds - 1) };
      dmg = Math.floor(dmg * 0.5);
      logBuffer.push({ text: `🌻 [布布的葵花護符] 消耗 1 顆葵花子，當下受到傷害減半！`, type: 'info' });
    }
  }
  
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
      const prevShield = def.shield;
      const remainingDmg = dmg - def.shield;
      logBuffer.push({ text: `護盾破裂！吸收了 ${def.shield} 點傷害。`, type: 'system' });
      def.shield = 0;
      
      if ((def.talents || []).includes('t_valentine_wolf')) {
          def.energy = Math.min(100, def.energy + 20);
          applyStatus(def, 'ATK_UP', 3, 20, null, logBuffer, false);
          logBuffer.push({ text: `💝 [苦甜回憶] 護盾破裂！恢復 20 點能量並提升攻擊！`, type: 'info' });
      }

      // 🧊 [白澤的冰晶護盾]：限定白澤出戰，護盾被打破時反擊 20 傷害
      const defBaseId = def.char?.baseId || def.char?.id;
      if (prevShield > 0 && defBaseId === 'wolf' && def.permaBuffs?.armor === 'armor_icebarrier') {
        dealDirectDmg(20, def, atk, logBuffer, true);
        logBuffer.push({ text: `🧊 [白澤的冰晶護盾] 護盾破裂反擊！對敵造成 20 傷害！`, type: 'info' });
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
        else {
            const prevShield = atk.shield;
            dmgDealt = dealDirectDmg(atk.shield, atk, def, buf);
            atk.hp = Math.min(atk.maxHp, atk.hp + Math.floor(atk.shield/2));
            atk.shield = 0;

            // 🧊 [白澤的冰晶護盾]：限定白澤出戰，奧義主動清空護盾時反擊 20 傷害
            const atkBaseId = atk.char?.baseId || atk.char?.id;
            if (prevShield > 0 && atkBaseId === 'wolf' && atk.permaBuffs?.armor === 'armor_icebarrier') {
                dealDirectDmg(20, atk, def, buf, true);
                buf.push({ text: `🧊 [白澤的冰晶護盾] 奧義清空護盾反擊！對敵造成 20 傷害！`, type: 'info' });
            }
        }
    } else if (id === 'cat') {
        if (num === 1) {
            const existDebufTypes = (def.status||[]).filter(s=>s).map(s=>s.type);
            const availStats = ['ATK_DOWN','DEF_DOWN'].filter(t=>!existDebufTypes.includes(t));
            const hasBothDown = existDebufTypes.includes('ATK_DOWN') && existDebufTypes.includes('DEF_DOWN');
            const atkBaseId = atk.char?.baseId || atk.char?.id;
            const hasVenomArmor = atkBaseId === 'cat' && atk.permaBuffs?.armor === 'armor_venomcharm';

            if (hasBothDown && hasVenomArmor) {
                applyStatus(def, 'POISON', 2, 10, null, buf, defDeferred);
                buf.push({ text: `🕸️ [布提婭的毒咒] 對手已同時降攻/降防，改為施加 ☠️[中毒] 2回合！`, type: 'info' });
            } else if (availStats.length > 0) {
                applyStatus(def, availStats[Math.floor(Math.random()*availStats.length)], 3, 20, null, buf, defDeferred);
            } else {
                buf.push({text:`對手已中所有屬性下降效果！`, type:'info'});
            }

            if (!existDebufTypes.includes('FREEZE')) applyStatus(def, 'FREEZE', 1, 0, getRandomHand(), buf, defDeferred);
            else buf.push({text:`對手已處於封印狀態！`, type:'info'});
        }
        else { dmgDealt = dealDirectDmg(80, atk, def, buf, true); const count = (def.status||[]).filter(s => s && isDebuffStatus(s.type)).length; atk.hp = Math.min(atk.maxHp, atk.hp + count * 30); }
    } else if (id === 'human') {
        if (num === 1) { dealDirectDmg(30, atk, def, buf); const existBurn = (def.status||[]).find(s=>s&&s.type==='BURN'); if (existBurn) { existBurn.duration += 3; buf.push({text:`🔥 燃燒延長了 3 回合！(剩餘 ${existBurn.duration} 回)`, type:'info'}); } else applyStatus(def, 'BURN', 3, 20, null, buf, defDeferred); }
        else { dealDirectDmg(70, atk, def, buf); const bIdx = (def.status||[]).findIndex(s => s && s.type === 'BURN'); if (bIdx >= 0) { const b = def.status[bIdx]; dealDirectDmg(b.duration * b.value, atk, def, buf, true); atk.hp = Math.min(atk.maxHp, atk.hp + b.duration * 30); def.status.splice(bIdx, 1); } }
    } else if (id === 'elf') {
        if (num === 1) { const diff = Math.abs(atk.energy - def.energy); dealDirectDmg(atk.energy, atk, def, buf, true); dealDirectDmg(def.energy, atk, def, buf, true); atk.hp = Math.min(atk.maxHp, atk.hp + diff); atk.energy = 0; def.energy = 0; }
        else { if(!atk.permaBuffs) atk.permaBuffs={}; atk.permaBuffs.seeds = (atk.permaBuffs.seeds || 0) + 1; dealDirectDmg(atk.permaBuffs.seeds * 20, atk, def, buf); }
    } else if (id === 'miner_char') {
        if (num === 1) {
            atk.shield += 80;
            applyStatus(atk, 'REGEN', 3, 0, null, buf, atkDeferred);
            buf.push({ text: `⛏️ [探礦嗅覺] 獲得 80 護盾並進入再生 3 回合。`, type: 'info' });
        } else {
            dealDirectDmg(90, atk, def, buf);
            applyStatus(def, 'POISON', 2, 10, null, buf, defDeferred);
            buf.push({ text: `⛏️ [鑿穿礦脈] 造成 90 傷害並施加中毒 2 回合！`, type: 'info' });
        }
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
    } else if (id === 'jack') {
        if (num === 1) {
            applyStatus(atk, 'ITEM_REVERSE', 3, 0, null, buf, atkDeferred);
            const restoreCount = atk.permaBuffs?.itemRestoreCount || 0;
            if (isPlayer && restoreCount < 2) {
                atk.permaBuffs = { ...atk.permaBuffs, itemRestoreCount: restoreCount + 1 };
                setBattleItemUses(prev => Math.min(3, prev + 1));
                buf.push({ text: `🃏 [盜影疾走] 自身獲得 🔄[道具反轉] 3 回合！道具使用次數 +1！`, type: 'info' });
            } else {
                buf.push({ text: `🃏 [盜影疾走] 自身獲得 🔄[道具反轉] 3 回合！${restoreCount >= 2 ? '（本場道具恢復已達上限）' : ''}`, type: 'info' });
            }
        } else {
            const hasReverse = (atk.status || []).some(s => s && !s.isDeferred && s.type === 'ITEM_REVERSE');
            if (hasReverse) {
                dealDirectDmg(80 + 60, atk, def, buf, true);
                const rIdx = (atk.status || []).findIndex(s => s && s.type === 'ITEM_REVERSE');
                if (rIdx >= 0) atk.status[rIdx].duration += 2;
                buf.push({ text: `🃏 [怪盜絕技·反轉強化] 無視護盾 140 真實傷！道具反轉延長 2 回合！`, type: 'damage' });
            } else {
                dealDirectDmg(80, atk, def, buf);
                buf.push({ text: `🃏 [怪盜絕技] 造成 80 傷害。`, type: 'damage' });
            }
        }
    } else if (id === 'moying') {
        if (num === 1) {
            const hasConsumable = !!(atk.permaBuffs?.consumableArmor);
            if (hasConsumable) {
                dealDirectDmg(65, atk, def, buf);
                applyStatus(def, 'DEF_DOWN', 2, 15, null, buf, defDeferred);
                applyStatus(atk, 'EVADE', 1, 0, null, buf, atkDeferred);
                buf.push({ text: `🌑 [影切·強化] 消耗武裝加持，65 傷 + 降防 + 迴避！`, type: 'info' });
            } else {
                dealDirectDmg(45, atk, def, buf);
                applyStatus(def, 'DEF_DOWN', 2, 15, null, buf, defDeferred);
                buf.push({ text: `🌑 [影切] 45 傷 + 施加降防 2 回合。`, type: 'info' });
            }
        } else {
            const hasDefDown = (def.status || []).some(s => s && !s.isDeferred && s.type === 'DEF_DOWN');
            const hasCC = (def.status || []).some(s => s && !s.isDeferred && ['FREEZE', 'SILENCE'].includes(s.type));
            const buffTypes = ['ATK_UP', 'DEF_UP', 'REGEN', 'EXCITE', 'EVADE'];
            const stealBuff = () => {
                const stolenIdx = (def.status || []).findIndex(s => s && !s.isDeferred && buffTypes.includes(s.type));
                if (stolenIdx >= 0) {
                    const stolen = def.status[stolenIdx];
                    def.status.splice(stolenIdx, 1);
                    atk.status = [...(atk.status || []), { ...stolen, isNew: false, isDeferred: false }];
                    buf.push({ text: `🌑 [影奪] 竊取對手的${getStatusName(stolen.type)}！`, type: 'info' });
                } else {
                    buf.push({ text: `🌑 [影奪] 對手無增益可竊取。`, type: 'info' });
                }
            };
            if (hasDefDown && hasCC) {
                dealDirectDmg(150, atk, def, buf, true);
                stealBuff();
                buf.push({ text: `🌑 [墨影絕斬·終極] 無視護盾 150 真實傷害！`, type: 'damage' });
            } else if (hasDefDown) {
                dealDirectDmg(130, atk, def, buf, true);
                buf.push({ text: `🌑 [墨影絕斬·破防] 無視護盾 130 真實傷害！`, type: 'damage' });
            } else if (hasCC) {
                dealDirectDmg(90, atk, def, buf);
                stealBuff();
                buf.push({ text: `🌑 [墨影絕斬·影奪] 90 傷害並竊取增益！`, type: 'damage' });
            } else {
                dealDirectDmg(80, atk, def, buf);
                applyStatus(def, 'SILENCE', 2, 0, null, buf, defDeferred);
                buf.push({ text: `🌑 [墨影絕斬] 80 傷害，施加沉默 2 回合。`, type: 'damage' });
            }
        }
    } else {
        if (id === 'm1') { if (num === 1) { dealDirectDmg(25, atk, def, buf); applyStatus(def, 'PARASITE', 2, 25, null, buf, defDeferred); } else atk.hp = Math.min(atk.maxHp, atk.hp + 120); }
        else if (id === 'm2') { if (num === 1) atk.shield += 100; else { dealDirectDmg(75, atk, def, buf); applyStatus(def, 'FREEZE', 1, 0, getRandomHand(), buf, defDeferred); } }
        else if (id === 'm3') { if (num === 1) applyStatus(def, 'BURN', 2, 30, null, buf, defDeferred); else dealDirectDmg(140, atk, def, buf); }
        else if (id === 'm4') { if (num === 1) applyStatus(def, 'DAZZLE', 1, 0, getRandomHand(), buf, defDeferred); else atk.hp = Math.min(atk.maxHp, atk.hp + 80); }
        else if (id === 'm5') { if (num === 1) applyStatus(def, 'SILENCE', 2, 0, null, buf, defDeferred); else dealDirectDmg(140, atk, def, buf); }
        else if (id === 'm6') { if (num === 1) { applyStatus(def, 'ATK_DOWN', 2, 30, null, buf, defDeferred); applyStatus(def, 'DEF_DOWN', 2, 30, null, buf, defDeferred); } else { const debuffCount = (def.status||[]).filter(s => s && isDebuffStatus(s.type)).length; dealDirectDmg(50 + debuffCount * 30, atk, def, buf); } }
        else if (id === 'm7') { if (num === 1) { applyStatus(atk, 'EVADE', 1, 0, null, buf, atkDeferred); def.energy = Math.max(0, def.energy - 20); buf.push({text: `💧 海藍水母奪取了 20 點能量！`, type: 'info'}); } else { dealDirectDmg(110, atk, def, buf); applyStatus(def, 'FREEZE', 1, 0, getRandomHand(), buf, defDeferred); def.energy = Math.max(0, def.energy - 30); buf.push({text: `💧 電擊觸手再奪取 30 點能量！`, type: 'info'}); } }
        else if (id === 'm8') { if (num === 1) { atk.shield += 120; buf.push({text: `🦎 熔甲防禦！獲得 120 點護盾。`, type: 'info'}); } else { const shieldAmt = atk.shield; atk.shield = 0; dealDirectDmg(70 + shieldAmt, atk, def, buf, true); buf.push({text: `🌋 熔岩爆裂！消耗 ${shieldAmt} 點護盾引爆！`, type: 'info'}); } }
        else if (id === 'm9') { if (num === 1) { applyStatus(atk, 'EXCITE', 3, 0, null, buf, atkDeferred); atk.shield += 60; buf.push({text: `🦢 星光羽翼！獲得亢奮與 60 護盾。`, type: 'info'}); } else { dealDirectDmg(100, atk, def, buf); applyStatus(def, 'DAZZLE', 1, 0, getRandomHand(), buf, defDeferred); } }
        else if (id === 'm10') { if (num === 1) { applyStatus(def, 'FATIGUE', 3, 0, null, buf, defDeferred); atk.hp = Math.min(atk.maxHp, atk.hp + 60); buf.push({text: `🦇 夢魘爪！恢復 60 HP。`, type: 'heal'}); } else { dealDirectDmg(110, atk, def, buf, true); const debuffCount = (def.status||[]).filter(s => s && isDebuffStatus(s.type)).length; const lifeSteal = debuffCount * 35; atk.hp = Math.min(atk.maxHp, atk.hp + lifeSteal); if (lifeSteal > 0) buf.push({text: `🦇 虛空侵蝕吸取了 ${lifeSteal} HP！`, type: 'heal'}); } }
        else if (id === 'b1') { if (num === 1) { def.energy = Math.max(0, def.energy - 35); applyStatus(def, 'SILENCE', 1, 0, null, buf, defDeferred); } else dealDirectDmg(230, atk, def, buf, true); }
        else if (id === 'b2') { if (num === 1) { atk.shield += 60; applyStatus(def, 'DAZZLE', 1, 0, getRandomHand(), buf, defDeferred); } else dealDirectDmg(200, atk, def, buf); }
        else if (id === 'b3') { if (num === 1) { atk.atk += 20; applyStatus(def, 'BURN', 2, 45, null, buf, defDeferred); } else dealDirectDmg(260, atk, def, buf); }
        else if (id === 'b4') { if (num === 1) { dealDirectDmg(60, atk, def, buf); applyStatus(def, 'PARASITE', 3, 35, null, buf, defDeferred); } else atk.hp = Math.min(atk.maxHp, atk.hp + 350); }
        else if (id === 'b5') { if (num === 1) atk.shield += 140; else { dealDirectDmg(170, atk, def, buf); def.energy = 0; applyStatus(def, 'FREEZE', 1, 0, getRandomHand(), buf, defDeferred); } }
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

    const hasMoyingTalent = (ent.talents || []).includes('t_moying');
    if (ent.permaBuffs?.armor === 'armor_chaos' && (hasMoyingTalent || Math.random() < 0.3)) {
        const debuffPool = ['BURN', 'PARASITE', 'SILENCE', 'ATK_DOWN', 'DEF_DOWN', 'FATIGUE'];
        const chosen = debuffPool[Math.floor(Math.random() * debuffPool.length)];
        applyStatus(other, chosen, 1, chosen === 'BURN' ? 35 : 0, null, buf);
        buf.push({text: `🌀 [干擾符文] 對敵觸發隨機負面狀態！`, type: 'info'});
    }

    for (let s of (ent.status || [])) {
        if (!s) continue;
        if (s.type === 'BURN') { const baseBDmg = s.value || 20; const bDmg = (other.talents||[]).includes('t_human') ? baseBDmg + 10 : baseBDmg; ent.hp = Math.max(0, ent.hp - bDmg); buf.push({text: `🔥 燃燒造成 ${bDmg} 傷害！`, type: 'damage'}); }
        if (s.type === 'POISON') {
            const pDmg = Math.max(0, s.value || 10);
            ent.hp = Math.max(0, ent.hp - pDmg);
            buf.push({text: `☠️ 中毒造成 ${pDmg} 傷害！`, type: 'damage'});
        }
        if (s.type === 'PARASITE') {
            const v = s.value || 25;
            ent.hp = Math.max(0, ent.hp - v);
            other.hp = Math.min(other.maxHp, other.hp + v);
            buf.push({text: `🌿 寄生吸取 ${v} HP！`, type: 'damage'});
        }
        if (s.type === 'REGEN') { ent.hp = Math.min(ent.maxHp, ent.hp + 20); buf.push({text: `💖 再生恢復 20 HP！`, type: 'heal'}); }
        
        if (s.isDeferred) {
            next.push({ ...s, isDeferred: false });
        } else {
            if (s.duration > 1) {
                if (s.type === 'POISON') {
                    // 每回合遞增：10 → 20 → 30 ...
                    next.push({ ...s, duration: s.duration - 1, value: (s.value || 10) + 10 });
                } else {
                    next.push({ ...s, duration: s.duration - 1 });
                }
            } 
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

        // 🎣 [熊吉的釣竿]（永久武裝）：限定熊吉出戰，平手 50% 隨機獲得增益（不重複）
        const pBaseId = p.char?.baseId || p.char?.id;
        if (pBaseId === 'bear' && p.permaBuffs?.armor === 'armor_fishingrod' && Math.random() < 0.5) {
            const existBufTypes = (p.status || []).filter(s => s).map(s => s.type);
            const availBufs = ['ATK_UP', 'DEF_UP', 'REGEN'].filter(t => !existBufTypes.includes(t));
            if (availBufs.length > 0) {
                const got = availBufs[Math.floor(Math.random() * availBufs.length)];
                applyStatus(p, got, 3, 20, null, buf, false);
                const nameMap = { ATK_UP: '攻擊提升', DEF_UP: '防禦提升', REGEN: '再生' };
                buf.push({ text: `🎣 [熊吉的釣竿] 平手觸發！獲得「${nameMap[got]}」3 回合！`, type: 'info' });
            } else {
                buf.push({ text: `🎣 [熊吉的釣竿] 平手觸發，但身上已有所有增益，未獲得新的效果。`, type: 'info' });
            }
        }

        // 🧯 [普爾斯的引火匣]（永久武裝）：限定普爾斯出戰，平手 50% 施加/延長燃燒 1 回合
        if (pBaseId === 'human' && p.permaBuffs?.armor === 'armor_matchstick' && Math.random() < 0.5) {
            const burn = (e.status || []).find(s => s && !s.isDeferred && s.type === 'BURN');
            if (burn) {
                burn.duration += 1;
                buf.push({ text: `🧯 [普爾斯的引火匣] 平手觸發！敵人燃燒延長 1 回合！(剩餘 ${burn.duration} 回)`, type: 'info' });
            } else {
                applyStatus(e, 'BURN', 1, 20, null, buf, false);
                buf.push({ text: `🧯 [普爾斯的引火匣] 平手觸發！敵人陷入 🔥[燃燒] 1 回合！`, type: 'info' });
            }
        }
    } else {
        const isPW = RPS_CHOICES[choice].beats === aiChoice;
        playSound(isPW ? 'rps_win' : 'rps_lose'); let atk = isPW ? p : e; let def = isPW ? e : p;
        if (def.buffs && def.buffs.energyOnLoss) { def.energy = Math.min(100, def.energy + 50); def.buffs.energyOnLoss = false; }
        let mult = getElementMultiplier(atk.char.element.id, def.char.element.id);

        let atkVal = getAttackerAtkBreakdown(atk).final;
        let defVal = getPanelDef(def);
        if ((atk.talents || []).includes('t_blackflame_human') && atk.hp < atk.maxHp * 0.4) {
            defVal = Math.max(0, defVal - 15);
            buf.push({ text: `🩸 [狂化血脈] 攻擊提升，無視部分防禦！`, type: 'info' });
        }

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
                const hasMT = (p.talents || []).includes('t_moying');
                const dtype = hasMT ? 'DEF_DOWN' : (Math.random() < 0.5 ? 'ATK_DOWN' : 'DEF_DOWN');
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

        // 📡 寶物雷達：進入戰鬥（尤其戰役）就先消耗 1 個，避免撤退/重整投機
        // - 戰役/征戰夜巡：啟動「本次戰役全程加倍」
        // - 自訂對決：啟動「單場加倍」
        let radarActivated = false;
        if (progress.pendingConsumableArmor === 'carm_radar') {
          const stock = progress.consumableArmors?.carm_radar || 0;
          if (stock <= 0) {
            // 避免舊存檔/異常狀態：備用但庫存為 0
            const npFix = { ...progress, pendingConsumableArmor: null };
            saveProgress(npFix);
            setProgress(npFix);
            setSysError('寶物雷達庫存不足，已自動取消備用。');
          } else {
            const charBaseId = selectedChar.baseId || selectedChar.id;
            const hasMinerRadarTalent = charBaseId === 'miner_char' && (tIds || []).includes('t_miner_radar_save');
            const noConsume = hasMinerRadarTalent && Math.random() < 0.5;
            const npUse = {
              ...progress,
              consumableArmors: { ...progress.consumableArmors, carm_radar: Math.max(0, stock - (noConsume ? 0 : 1)) },
              pendingConsumableArmor: null,
            };
            saveProgress(npUse);
            setProgress(npUse);
            radarActivated = true;
          }
        }
        const isCampaignRun = gameMode.includes('campaign');
        setCampaignRadarActive(radarActivated && isCampaignRun);
        setSingleRadarActive(radarActivated && !isCampaignRun && gameMode === 'brawl');

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
                let pool = CHARACTERS.filter(c => !isLegendaryChar(c) || unlocks.includes(c.id));
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

    let homeFieldLog = null;
    const adv = CHAPTER_HOME_ADVANTAGES[chapterId];
    const storyCharId = attackerChar.baseId || attackerChar.id;
    if (adv && storyCharId === adv.targetId) {
      adv.apply(pObj);
      homeFieldLog = adv.log;
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
    if (homeFieldLog) initLogs.push({ text: homeFieldLog, type: 'info' });
    setLogs(initLogs);
    setNewlyCaptured(null);
    setBattleItemUses(3); setShowItemPanel(false);
    setGameMode('story');
    setGameState('battle');
  };

  const NEGATIVE_STATUSES = ['BURN','POISON','PARASITE','FREEZE','DAZZLE','SILENCE','ATK_DOWN','DEF_DOWN','VULNERABLE','FATIGUE'];
  const handleUseItem = (itemId) => {
    if (battleItemUses <= 0) { setSysError('本場戰鬥道具使用次數已達上限（3次）！'); return; }
    if ((progress.items?.[itemId] || 0) <= 0) { setSysError('道具數量不足！'); return; }
    let newPlayer = { ...player, status: [...(player.status||[])] };
    let newEnemy = { ...enemy, status: [...(enemy.status||[])] };
    let logText = '';
    const enemyHasReverse = (newPlayer.status || []).some(s => s && !s.isDeferred && s.type === 'ITEM_REVERSE');
    const hasJackTalent = (newPlayer.talents || []).includes('t_jack');
    const extraLogs = [];

    if (enemyHasReverse) {
      const buf = [];
      switch (itemId) {
        case 'stardust':
          newEnemy.shield > 0
            ? (newEnemy.shield = Math.max(0, newEnemy.shield - 100), buf.push({ text: `🔄 [道具反轉] 星晶砂粉翻轉！100 傷害作用於對手護盾！`, type: 'damage' }))
            : (newEnemy.hp = Math.max(0, newEnemy.hp - 100), buf.push({ text: `🔄 [道具反轉] 星晶砂粉翻轉！對手受到 100 傷害！`, type: 'damage' }));
          break;
        case 'excite_potion':
          newEnemy.status = [...newEnemy.status.filter(s => s.type !== 'FATIGUE'), { type: 'FATIGUE', duration: 3, value: 0, isNew: true, isDeferred: false }];
          buf.push({ text: `🔄 [道具反轉] 亢奮藥劑翻轉！對手陷入 😩[疲憊] 3回合！`, type: 'damage' }); break;
        case 'smoke_bomb':
          newEnemy.status = [...newEnemy.status.filter(s => s.type !== 'DAZZLE'), { type: 'DAZZLE', duration: 1, value: 0, hand: ['ROCK','PAPER','SCISSORS'][Math.floor(Math.random()*3)], isNew: true, isDeferred: false }];
          buf.push({ text: `🔄 [道具反轉] 煙霧彈翻轉！對手被 💫[強制] 1回合！`, type: 'damage' }); break;
        case 'antidote':
          newEnemy.status = newEnemy.status.filter(s => !isBuffStatus(s.type));
          buf.push({ text: `🔄 [道具反轉] 萬能解藥翻轉！對手所有增益被清除！`, type: 'damage' }); break;
        case 'guard_potion':
          newEnemy.hp = Math.max(0, newEnemy.hp - 50);
          buf.push({ text: `🔄 [道具反轉] 防護藥水翻轉！無視護盾，對手受到 50 傷害！`, type: 'damage' }); break;
        case 'health_food':
          newEnemy.status = [...newEnemy.status.filter(s => s.type !== 'POISON'), { type: 'POISON', duration: 3, value: 10, isNew: true, isDeferred: false }];
          buf.push({ text: `🔄 [道具反轉] 保健食品翻轉！對手陷入 ☠️[中毒] 3回合！`, type: 'damage' }); break;
        default: break;
      }
      if (hasJackTalent) {
        newEnemy.hp = Math.max(0, newEnemy.hp - 30);
        buf.push({ text: `🎭 [贓物大師] 反轉加乘！對手再受 30 點真實傷害！`, type: 'damage' });
      }
      extraLogs.push(...buf);
      logText = `🃏 道具效果遭到反轉！`;
      playSound('hit');
    } else {
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
        case 'guard_potion':
          newPlayer.shield += 50;
          logText = '🛡️ 使用防護藥水！獲得 50 點護盾！'; break;
        case 'health_food':
          newPlayer.status = [...newPlayer.status.filter(s => s.type !== 'REGEN'), { type: 'REGEN', duration: 3, value: 0, isNew: true, isDeferred: false }];
          logText = '🥗 使用保健食品！獲得 💖[再生] 3回合！'; break;
        default: return;
      }
      playSound('heal');
    }

    setPlayer(newPlayer);
    setEnemy(newEnemy);
    setBattleItemUses(prev => prev - 1);
    setLogs(prev => [...prev, { text: logText, type: enemyHasReverse ? 'damage' : 'heal' }, ...extraLogs]);
    let np = { ...progress, items: { ...progress.items, [itemId]: Math.max(0, (progress.items?.[itemId] || 0) - 1) } };
    saveProgress(np);
    setShowItemPanel(false);
    if (newEnemy.hp <= 0) handleDeath('enemy');
  };

  const getBrawlReward = (eChar) => {
    if (!eChar) return 3;
    if (ADVANCED_BOSSES.some(b => b.id === eChar.id)) return 12;
    if (ADVANCED_MONSTERS.some(m => m.id === eChar.id)) return 6;
    if (BOSS_MONSTERS.some(b => b.id === eChar.id)) return 4;
    if (NORMAL_MONSTERS.some(m => m.id === eChar.id)) return 3;
    if (isLegendaryChar(eChar)) return 8;
    if (isEpicChar(eChar)) return 7;
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
          // 消耗型武裝在最終勝利後消耗（故事章節通關）
          if (np.pendingConsumableArmor) {
            const cId = np.pendingConsumableArmor;
            np.consumableArmors = { ...np.consumableArmors, [cId]: Math.max(0, (np.consumableArmors[cId] || 1) - 1) };
            np.pendingConsumableArmor = null;
          }
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

    if (target === 'player') {
      playSound('defeat');
      setCampaignRadarActive(false);
      setSingleRadarActive(false);
      saveProgress(updateDailyQuestProgress('battle_any', np));
      setGameState('game_over');
      setWinner('enemy');
    }
    else { playSound('victory');
        if (!enemy.char.isUncapturable && unlocks.includes('tamer_kert') && !captured.includes(enemy.char.id) && !enemy.char.baseId && !isLegendaryChar(enemy.char) && !isEpicChar(enemy.char)) {
            np.captured = [...captured, enemy.char.id]; setNewlyCaptured(enemy.char); 
        }
        
        np.ap = (np.ap || 0) + 1;
        // 【V2.6 成就追蹤】戰鬥勝利次數
        np.battlesWon = (np.battlesWon || 0) + 1;

        if (gameMode.includes('campaign') && campaignStage === maxStage) {
            const bid = player.char.baseId || player.char.id;
            if (isBasicChar(player.char) || isLegendaryChar(player.char) || bid === 'xiangxiang') { np.mastery = {...np.mastery}; np.mastery[bid] = Math.min(3, (np.mastery[bid] || 0) + 1); }
        }
        
        let earned = 0;
        if (isAdvanced) { earned = campaignStage < maxStage ? 8 : 20; }
        else if (gameMode === 'campaign') { earned = campaignStage < maxStage ? 3 : 8; }
        else { earned = getBrawlReward(enemy.char); }
        
        if (campaignRadarActive && gameMode.includes('campaign')) earned *= 2;
        if (singleRadarActive && gameMode === 'brawl') earned *= 2;
        
        np.crystals += earned;

        // 消耗型武裝在最終勝利後消耗
        const isFinalWin = gameMode === 'brawl' || (gameMode.includes('campaign') && campaignStage === maxStage);
        if (isFinalWin && np.pendingConsumableArmor) {
            const cId = np.pendingConsumableArmor;
            np.consumableArmors = { ...np.consumableArmors, [cId]: Math.max(0, (np.consumableArmors[cId] || 1) - 1) };
            np.pendingConsumableArmor = null;
        }

        // ⛏️ 礦工天賦：最終勝利額外 +5 通用碎片
        const pBaseId = player.char?.baseId || player.char?.id;
        if (isFinalWin && pBaseId === 'miner_char' && (player.talents || []).includes('t_miner_frag5')) {
            np.fragments = (np.fragments || 0) + 5;
            showToastMsg('⛏️ [碎片採集] 額外獲得 💠 5 通用碎片！');
        }

        np = updateDailyQuestProgress('battle_any', np);
        np = updateDailyQuestProgress('battle_win', np);
        if (isFinalWin && gameMode === 'campaign') np = updateDailyQuestProgress('campaign_clear', np);
        if (isFinalWin) { setCampaignRadarActive(false); setSingleRadarActive(false); }
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
      'gaming': { hostText: `深淵魔物開始躁動了，準備好去巡夜了嗎？`, guestReplies: { 'bear': '好啊！我來幫你們擋下襲擊！', 'wolf': '我負責觀察魔物弱點，你們專心斬殺。', 'cat': '喵... 沒有星晶貓條本小姐不幹！', 'human': '看我燃燒的大劍一刀斬斷深淵！', 'elf': '我會用聖光在後方護佑你們的～', 'xiangxiang': '吼... 剛輪完白班... 讓我再睡五分鐘...', 'kohaku': '看在金幣的面子上，我就陪你們活動一下筋骨吧。', 'aldous': '嗯...今夜的風，似乎透著一絲不尋常的氣息。', 'moying': '先觀察再動手。急著出劍的人，死得最快。', 'default': '(拿起了武器準備出發)' } },
      'snack': { hostText: `剛結束夜間討伐肚子好餓，火爐旁有留宵夜喔！`, guestReplies: { 'bear': '有蜂蜜嗎？加一點進去絕對好吃！', 'wolf': '清淡點的熱湯比較好消化。', 'cat': '喵嗚？不要想自己獨吞星晶碎屑！', 'human': '交給我！我用燃燒之刃幫你烤到七分熟！', 'elf': '我來為大家泡一杯安神花茶吧。', 'xiangxiang': '柯特的愛心宵夜... 吃飽才有力氣... 呼嚕...', 'kohaku': '哦？這食材的進貨管道是哪裡？說不定能做筆大生意。', 'aldous': '年輕人多吃點，老夫喝杯清茶足矣。', 'moying': '……（默默接過碗，喝了一口）不錯。', 'default': '(開心地接過分享的食物)' } },
      'chat': { hostText: `最近連續激戰有點累，星晶的干擾也讓人喘不過氣...`, guestReplies: { 'bear': '靠著我休息吧，我的毛皮很溫暖。', 'wolf': '如果你們累了，今晚我不介意守夜。', 'cat': '呼嚕呼嚕... 這個溫暖的位子歸我了！', 'human': '覺得寒氣重嗎？我放個火魔法取暖吧！', 'elf': '讓我施放治癒，緩解你身上的疲勞。', 'xiangxiang': '來抱抱吧，白虎的肚子很好抱的喔...', 'kohaku': '世上沒有什麼煩惱是星晶解決不了的，有的話，就是星晶不夠多。', 'aldous': '放下武器，凝神靜氣。黑夜終會過去，黎明必將到來。', 'moying': '累了就放下。劍放下了，腦子反而轉得快。', 'default': '(靜靜地聆聽，陪伴在你身邊)' } }
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
            if (isLegendaryChar({id})) ratio = 50;
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
      if (['xiangxiang', 'kohaku', 'aldous', 'christmas_xiangxiang', 'moying'].includes(id)) {
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
    },

    // 測試/開發用
    'MINER50': {
        desc: '礦工碎片 x50',
        apply: (p) => {
            p.charFragments = {...p.charFragments};
            p.charFragments['miner_char'] = (p.charFragments['miner_char'] || 0) + 50;
        }
    },
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

              {/* 夜巡戰役（入口合併：普通 / 征戰） */}
              {(() => {
                const ok = (progress.completedStoryChapters||[]).includes(5);
                return (
                  <>
                    <button
                      onClick={() => ok ? setCampaignPickerOpen(true) : setSysError('【章節鎖定】請先完成主線夜巡第五章，解鎖夜巡戰役！')}
                      className={`bg-stone-800 p-4 border-2 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95 text-center ${ok ? 'border-stone-700 hover:border-yellow-500' : 'border-stone-800 opacity-60 grayscale cursor-not-allowed'}`}
                    >
                      <div className="text-3xl mb-2">{ok ? '🗺️' : <Lock className="text-stone-500" size={32}/>}</div>
                      <h2 className={`text-lg font-bold mb-1 ${ok ? '' : 'text-stone-500'}`}>{ok ? '夜巡戰役' : '🔒 夜巡戰役'}</h2>
                      <p className="text-stone-400 text-[10px] hidden md:block">普通 / 高階 連戰模式</p>
                    </button>

                    {campaignPickerOpen && (
                      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setCampaignPickerOpen(false)}>
                        <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-yellow-400 flex items-center gap-2"><Gamepad2 size={18}/> 夜巡戰役</h2>
                            <button className="text-stone-500 hover:text-white text-xl leading-none" onClick={() => setCampaignPickerOpen(false)}>✕</button>
                          </div>

                          <div className="space-y-3">
                            <button
                              onClick={() => { setCampaignPickerOpen(false); selectMode('campaign'); }}
                              className="w-full bg-yellow-600 hover:bg-yellow-500 text-stone-900 font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
                            >
                              🗺️ 普通夜巡（3 連戰）
                            </button>

                            <button
                              onClick={() => {
                                if (isAdvancedUnlocked) { setCampaignPickerOpen(false); selectMode('advanced_campaign'); }
                                else setSysError('【權限不足】請先將任意一位角色的「專精等級」提升至 3 星 (完成普通夜巡3次)，以證明你有足夠的實力面對深淵的真正面貌！');
                              }}
                              className={`w-full font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform border ${
                                isAdvancedUnlocked
                                  ? 'bg-red-700 hover:bg-red-600 text-white border-red-500'
                                  : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                              }`}
                              disabled={!isAdvancedUnlocked}
                            >
                              💀 征戰夜巡（高階 5 連戰）
                              {!isAdvancedUnlocked && <div className="text-[10px] text-yellow-500 font-bold mt-1">需 1 名 3 星專精角色</div>}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

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

              {/* （已合併）征戰夜巡入口已併入夜巡戰役 */}
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
    let list = CHARACTERS.filter(c => !isLegendaryChar(c) || unlocks.includes(c.id));
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
                    const tier = getCharTier(c);
                    const isLegendary = tier === 'legendary';
                    const isEpic = tier === 'epic';
                    const isVariant = isVariantChar(c);
                    return (
                        <div key={c.id} onClick={()=>{
                            if (player.char?.id !== c.id) setSelectedTalentIds([]); 
                            setPlayer({...player, char: c});
                        }} className={`relative overflow-hidden bg-stone-800 p-6 rounded-3xl border-2 transition-all cursor-pointer ${player.char?.id === c.id ? 'border-yellow-500 scale-105 shadow-xl' : 'border-stone-700 opacity-80 hover:border-stone-500'}`}>
                            {isVariant && <div className="absolute top-0 right-0 bg-stone-600 px-3 py-1 rounded-bl-xl text-[10px] font-bold z-10 shadow-md">✨ 異裝</div>}
                            {isMonster && <div className="absolute top-0 right-0 bg-green-600 px-3 py-1 rounded-bl-xl text-[10px] font-bold z-10 shadow-md">🐾 已馴化</div>}
                            {isHidden && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 shadow-md">🌟 終極獎勵</div>}
                            {isLegendary && !isHidden && <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 shadow-md">🌟 傳說級</div>}
                            {isEpic && !isHidden && <div className="absolute top-0 right-0 bg-cyan-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 shadow-md">💎 史詩級</div>}
                            
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
                {isLegendaryChar(player.char) && <span className="ml-2 text-xs text-yellow-500 bg-stone-900 px-2 py-1 rounded-full border border-yellow-900/50">出廠滿潛能</span>}
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
    let pool = CHARACTERS.filter(c => !isLegendaryChar(c) || unlocks.includes(c.id));
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
        const ent = isEnemy ? enemy : player;
        const other = isEnemy ? player : enemy;
        const panelDef = getPanelDef(ent);
        const atkBreak = getAttackerAtkBreakdown(ent);
        const defVsBlackflame = other?.char ? getDefValueVsBlackflameAttacker(ent, other) : null;
        const elemIfEntWins = ent?.char?.element?.id && other?.char?.element?.id
            ? getElementMultiplier(ent.char.element.id, other.char.element.id) : null;
        const elemIfOtherWins = ent?.char?.element?.id && other?.char?.element?.id
            ? getElementMultiplier(other.char.element.id, ent.char.element.id) : null;

        return (
            <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 sm:p-4 min-h-0" onClick={() => setBattleInspect(null)}>
                <div
                    className="bg-stone-900 border-2 border-stone-700 rounded-2xl max-w-sm w-full max-h-[min(85dvh,720px)] shadow-2xl flex flex-col overflow-hidden min-h-0"
                    onClick={e => e.stopPropagation()}
                >
                    {(isEnemy || isPlayer) && (
                        <>
                            <div className="shrink-0 flex items-center gap-3 px-4 pt-4 pb-3 border-b border-stone-800 bg-stone-900">
                                <SpriteAvatar char={char} size="w-14 h-14" />
                                <div className="flex-1 min-w-0">
                                    <div className={`font-bold text-base truncate ${isEnemy ? 'text-red-400' : 'text-green-400'}`}>{char.name}</div>
                                    <div className="text-[10px] text-stone-400 leading-snug">{char.title || ''}{char.element ? ` · ${char.element.name}` : ''}</div>
                                </div>
                                <button type="button" className="text-stone-500 hover:text-white text-lg leading-none shrink-0 p-1" onClick={() => setBattleInspect(null)} aria-label="關閉">✕</button>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 py-3 touch-pan-y">
                            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
                                <div className="bg-stone-800 rounded-lg p-2">
                                    <div className={`font-bold ${isEnemy ? 'text-red-400' : 'text-green-400'}`}>HP</div>
                                    <div className="text-stone-100 font-mono tabular-nums">{ent.hp} / {ent.maxHp}</div>
                                    {(ent.shield || 0) > 0 && <div className="text-cyan-400 text-[10px] mt-0.5">護盾 {ent.shield}</div>}
                                </div>
                                <div className="bg-stone-800 rounded-lg p-2">
                                    <div className="font-bold text-orange-400">ATK</div>
                                    <div className="text-stone-400 text-[9px] leading-tight">含狀態</div>
                                    <div className="text-stone-100 font-mono tabular-nums">{atkBreak.panel}</div>
                                    {atkBreak.lines.length > 0 && (
                                        <div className="mt-1.5 space-y-1 text-[9px] text-amber-200/95 text-left leading-snug border-t border-stone-600/50 pt-1">
                                            {atkBreak.lines.map((line, i) => (
                                                <div key={i}>· {line}</div>
                                            ))}
                                            <div className="text-amber-300 font-bold text-center mt-0.5">出拳命中時攻擊值 {atkBreak.final}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-stone-800 rounded-lg p-2">
                                    <div className="font-bold text-blue-400">DEF</div>
                                    <div className="text-stone-400 text-[9px] leading-tight">含狀態</div>
                                    <div className="text-stone-100 font-mono tabular-nums">{panelDef}</div>
                                    {defVsBlackflame !== null && (
                                        <div className="mt-1.5 text-[9px] text-amber-200/95 text-left leading-snug border-t border-stone-600/50 pt-1">
                                            · 對方為黑炎暴走且對方生命低於40%並命中此單位時：本次結算採用防禦 <span className="text-amber-300 font-bold">{defVsBlackflame}</span>（-15）
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-stone-400 mb-2 px-0.5">
                                <span>⚡ 能量 <span className="text-stone-200 font-mono">{ent.energy}</span> / 100</span>
                            </div>
                            {elemIfEntWins != null && elemIfOtherWins != null && (
                                <div className="text-[10px] text-stone-500 mb-3 leading-relaxed border-t border-stone-700 pt-2">
                                    <div>此單位出拳獲勝時：元素對傷害倍率 <span className="text-stone-300">×{elemIfEntWins}</span></div>
                                    <div>對方出拳獲勝時：對此單位傷害元素倍率 <span className="text-stone-300">×{elemIfOtherWins}</span></div>
                                </div>
                            )}
                            <p className="text-[9px] text-stone-600 mb-3 leading-relaxed">
                                猜拳基礎段：max(10, 攻擊值×元素倍率 − 防禦值)。拳種天賦（t9/t10/t11 等）、易傷、真實傷害與技能效果另計，與上列數字分開結算。
                            </p>
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
                            </div>
                        </>
                    )}
                    {isSkill && (
                        <>
                            <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-stone-800">
                                <div className={`font-bold text-base min-w-0 pr-2 ${type === 'skill1' ? 'text-blue-300' : 'text-purple-300'}`}>{type === 'skill1' ? '戰技' : '奧義'} · {skill.name}</div>
                                <button type="button" className="text-stone-500 hover:text-white text-lg leading-none shrink-0 p-1" onClick={() => setBattleInspect(null)} aria-label="關閉">✕</button>
                            </div>
                            <div className="px-4 py-3 overflow-y-auto overscroll-y-contain max-h-[min(55vh,22rem)] touch-pan-y">
                                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${type === 'skill1' ? 'bg-blue-700' : 'bg-purple-700'}`}>{skillCost} 能量</div>
                                <p className="text-stone-200 text-sm leading-relaxed">{skill.desc}</p>
                            </div>
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
                            setCampaignRadarActive(false);
                            setSingleRadarActive(false);
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
    // 可當 Host 的角色：基本五人 + 已解鎖的虎吉/琥珀/奧爾德斯，排除墨影、傑克、所有異裝
    const HOST_BLOCKED = ['moying', 'jack'];
    const hostPool = CHARACTERS.filter(c => {
      if (HOST_BLOCKED.includes(c.id)) return false;
      return !isLegendaryChar(c) || unlocks.includes(c.id);
    });
    if (unlocks.includes('xiangxiang')) hostPool.push(HIDDEN_CHARACTER);

    // 可當 Guest 的角色：hostPool + 墨影/傑克（已解鎖）+ 異裝（已解鎖）
    const guestPool = [...hostPool];
    HOST_BLOCKED.forEach(id => {
      const c = CHARACTERS.find(x => x.id === id);
      if (c && unlocks.includes(id)) guestPool.push(c);
    });
    VARIANTS.forEach(v => { if (unlocks.includes(v.id) && !v.isPlaceholder) guestPool.push(v); });

    const canInvite = (hostBaseId, guestBaseId) => {
      if (guestBaseId === 'moying') return hostBaseId === 'wolf';
      if (guestBaseId === 'jack')   return hostBaseId === 'cat';
      if (guestBaseId === 'kohaku') return hostBaseId === 'aldous';
      if (guestBaseId === 'aldous') return hostBaseId === 'kohaku';
      if (hostBaseId === 'aldous')  return guestBaseId === 'kohaku';
      if (hostBaseId === 'kohaku')  return guestBaseId === 'aldous';
      return true;
    };

    return (
        <div className="min-h-screen p-8 bg-stone-950 text-stone-200">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8"><button onClick={()=>setGameState('intro')} className="flex items-center gap-2 text-stone-400 hover:text-white"><ArrowLeft/> 返回</button><div className="bg-stone-800 px-4 py-1.5 rounded-full border border-stone-700 text-green-400 font-bold shadow-lg">⚡ AP: {progress.ap}</div></div>
                {homeStep === 'select_host' && (
                    <div className="text-center animate-fade-in"><h2 className="text-3xl font-bold mb-8 text-green-400">選擇營地代表</h2><div className="grid grid-cols-2 md:grid-cols-5 gap-4">{hostPool.map(c=>(<div key={c.id} onClick={()=>{setHomeHost(c); setHomeStep('select_guest');}} className="bg-stone-800 p-4 rounded-xl cursor-pointer border-2 border-stone-700 hover:border-green-500 transition-all shadow-md hover:-translate-y-1"><SpriteAvatar char={c} size="w-16 h-16 mx-auto"/><p className="mt-2 text-sm font-bold">{c.name}</p></div>))}</div></div>
                )}
                {homeStep === 'select_guest' && (
                    <div className="text-center animate-fade-in"><h2 className="text-3xl font-bold mb-8 text-yellow-400">邀請巡夜夥伴</h2><div className="grid grid-cols-2 md:grid-cols-5 gap-4">{guestPool.map(c=>{ const hostBaseId = homeHost.baseId||homeHost.id; const guestBaseId = c.baseId||c.id; const isH = hostBaseId === guestBaseId; const allowed = !isH && canInvite(hostBaseId, guestBaseId); return (<div key={c.id} onClick={()=>{ if(allowed) {setHomeGuest(c); setHomeStep('room');} }} title={!allowed && !isH ? '與此夥伴尚無足夠的羈絆前往營地……' : undefined} className={`bg-stone-800 p-4 rounded-xl border-2 border-stone-700 transition-all relative ${allowed ? 'hover:border-yellow-500 cursor-pointer shadow-md hover:-translate-y-1' : 'opacity-25 cursor-not-allowed'}`}><SpriteAvatar char={c} size="w-16 h-16 mx-auto"/><p className="mt-2 text-sm font-bold">{c.name}</p>{!allowed && !isH && <span className="absolute top-1 right-1 text-[9px] text-stone-500">🔒</span>}</div>) })}</div></div>
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
                            const tier = getCharTier(c);
                            const isT0 = tier === 'legendary';
                            const isEpic = tier === 'epic';
                            const isUnlocked =
                                isBasic ||
                                encountered.includes(c.id) ||
                                ((isT0 || isEpic) && unlocks.includes(c.id)) ||
                                (!!c.baseId && unlocks.includes(c.id));
                            const isPlaceholderVariant = !!c.baseId && (!unlocks.includes(c.id) || c.isPlaceholder);
                            const showFragUI = ['newyear_bear', 'harvest_elf', 'blackflame_human', 'valentine_wolf', 'halloween_cat', 'kohaku', 'aldous', 'moying', 'jack', 'blacksmith', 'bartender', 'miner_char', 'xia_ke', 'manor'].includes(c.id) && !unlocks.includes(c.id);
                            
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
                                    {isEpic && <div className="absolute top-0 right-0 bg-cyan-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-widest z-10 shadow-md">💎 史詩級</div>}
                                    {!!c.baseId && !c.isPlaceholder && <div className="absolute top-0 right-0 bg-stone-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-widest z-10 shadow-md">✨ 異裝型態</div>}
                                    {captured.includes(c.id) && <div className="absolute top-0 left-0 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl tracking-widest z-10 shadow-md">🐾 已收服</div>}
                                    {c.isUncapturable && <div className="absolute top-0 left-0 bg-stone-700 text-stone-400 text-[10px] font-bold px-3 py-1 rounded-br-xl tracking-widest z-10 shadow-md">不可馴化</div>}
                                    
                                    <div className="flex items-center justify-between mb-4 mt-2">
                                        <div className="flex items-center gap-4"><SpriteAvatar char={c} size="w-16 h-16" /><div><div className={`text-xs mb-0.5 ${isAdvBoss || isAdvMon ? 'text-red-400' : 'text-gray-400'}`}>{c.title}</div><div className="text-xl font-bold flex items-center gap-2">{c.isEmoji ? c.emoji : c.icon} {c.name}</div>{c.element && <div className={`text-[11px] font-bold mt-1 ${c.element.color}`}>{c.element.icon} {c.element.name}屬性</div>}</div></div>
                                        { (isBasic || isT0 || isEpic || !!c.baseId) && (
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
      { id: 'guard_potion',  name: '道具製作：防護藥水', desc: `戰鬥中使用，獲得 50 點護盾。持有：${progress.items?.guard_potion||0} 個`,        cost: 2, currency: 'ap', icon: '🛡️', canBuy: progress.ap >= 2, bought: false, isInfinite: true, onBuy: craftItem('guard_potion',  '防護藥水', '🛡️') },
      { id: 'health_food',   name: '道具製作：保健食品', desc: `戰鬥中使用，獲得再生狀態 3 回合。持有：${progress.items?.health_food||0} 個`,     cost: 2, currency: 'ap', icon: '🥗', canBuy: progress.ap >= 2, bought: false, isInfinite: true, onBuy: craftItem('health_food',   '保健食品', '🥗') },
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
                    "自訂對決依對手強度給予不同獎勵：一般魔物 3 晶、魔王/基本角色 4 晶、進階魔物/異裝 6 晶、史詩角色 7 晶、傳說角色 8 晶、進階魔王 12 晶！",
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
        const currency = armor.currency || 'fragment';
        if (currency === 'charFragment') {
            const cid = armor.fragmentCharId;
            const cur = progress.charFragments?.[cid] || 0;
            if (cur < armor.cost) { setSysError('專屬碎片不足！'); return; }
        } else {
            if (progress.fragments < armor.cost) { setSysError('碎片不足！'); return; }
        }
        if (!isConsumable && progress.unlockedArmors.includes(armor.id)) { setSysError('已製作過此永久武裝！'); return; }
        let np = { ...progress };
        if (currency === 'charFragment') {
            const cid = armor.fragmentCharId;
            np.charFragments = { ...(progress.charFragments || {}) };
            np.charFragments[cid] = (np.charFragments[cid] || 0) - armor.cost;
        } else {
            np.fragments = (progress.fragments || 0) - armor.cost;
        }
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
            npcImage="avatar_forge.png"
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
                const currency = armor.currency || 'fragment';
                const craftable = currency === 'charFragment'
                  ? (progress.charFragments?.[armor.fragmentCharId] || 0) >= armor.cost
                  : (progress.fragments || 0) >= armor.cost;
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
                        <button onClick={() => forgeCraft(armor, false)} disabled={!craftable}
                          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${craftable ? 'bg-purple-700 hover:bg-purple-600 text-white' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}>
                          {currency === 'charFragment'
                            ? `${CHARACTERS.find(c => c.id === armor.fragmentCharId)?.icon || '🧩'} ${armor.cost} 專屬碎片 製作`
                            : `🧩 ${armor.cost} 碎片 製作`}
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
              <button onClick={() => {
                const alreadySeen = (progress.viewedEncounters || []).includes(ev.id);
                if (!alreadySeen) {
                  let np = { ...progress };
                  np.viewedEncounters = [...(np.viewedEncounters || []), ev.id];
                  if (ev.reward?.charFragments) {
                    np.charFragments = { ...np.charFragments };
                    Object.entries(ev.reward.charFragments).forEach(([cid, qty]) => {
                      np.charFragments[cid] = (np.charFragments[cid] || 0) + qty;
                    });
                  }
                  saveProgress(np);
                  showToast(`✦ 故事結束！獲得 ${ev.reward?.rewardDesc || ''}`);
                }
                setGameState('gacha'); setGachaTab('encounters');
              }} className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 active:scale-95 transition-all">
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
                        {ENCOUNTER_EVENTS.map(ev => {
                          const viewed = (progress.viewedEncounters || []).includes(ev.id);
                          return (
                          <div key={ev.id} className={`rounded-2xl border p-4 flex flex-col gap-2 transition-all relative ${ev.locked ? 'border-stone-800 bg-stone-900/40 opacity-50' : 'border-slate-700 bg-stone-900/70 hover:border-purple-500 cursor-pointer active:scale-95'}`}
                            onClick={() => { if (!ev.locked) { setEncounterEventId(ev.id); setEncounterDialogueIdx(0); setGameState('encounter_dialogue'); } }}>
                            {viewed && <span className="absolute top-3 right-3 text-[10px] bg-green-800 text-green-300 border border-green-700 px-2 py-0.5 rounded-full font-bold">✓ 已看過</span>}
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{ev.icon}</span>
                              <div>
                                <div className={`font-bold text-sm ${ev.locked ? 'text-stone-600' : 'text-white'}`}>{ev.title}</div>
                                {ev.subtitle && <div className="text-xs text-stone-500">{ev.subtitle}</div>}
                              </div>
                            </div>
                            <p className="text-xs text-stone-500 leading-relaxed">{ev.desc}</p>
                            {!ev.locked && (
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-purple-400 font-bold">▶ 點擊閱讀</span>
                                {ev.reward && <span className={`text-[10px] ${viewed ? 'text-stone-600 line-through' : 'text-yellow-500'}`}>{ev.reward.rewardDesc}</span>}
                              </div>
                            )}
                          </div>
                          );
                        })}
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