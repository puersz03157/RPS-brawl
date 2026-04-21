import { ELEMENTS } from './elements';

export const NORMAL_MONSTERS = [
  { id: 'm1', name: '草原史萊姆', title: '黏糊糊的', element: ELEMENTS.WOOD, isEmoji: false, icon: '🍄', image: 'monster_slime.png', prefHand: 'PAPER', stats: { hp: 500, maxHp: 500, atk: 33, def: 10 }, lore: '最常見的低級魔物，喜歡寄生在別人身上吸取養分。被收服後意外地適合拿來當抱枕。', skill1: { name: '寄生孢子', cost: 30, desc: '造成 25 傷害並施加 🌿[寄生] 2回合。' }, skill2: { name: '光合作用', cost: 60, desc: '回復自己 120 點生命值。' } },
  { id: 'm2', name: '巨石蟹', title: '硬邦邦的', element: ELEMENTS.WATER, isEmoji: false, icon: '🦀', image: 'monster_crab.png', prefHand: 'SCISSORS', stats: { hp: 650, maxHp: 650, atk: 35, def: 30 }, lore: '全身覆蓋堅硬岩石的螃蟹，防禦力驚人。生氣時會吐出冰封泡泡。', skill1: { name: '硬化', cost: 30, desc: '獲得 100 點護盾。' }, skill2: { name: '泡泡光線', cost: 60, desc: '造成 75 傷害並施加 ❄️[封印] 1回合。' } },
  { id: 'm3', name: '爆炎犬', title: '熱騰騰的', element: ELEMENTS.FIRE, isEmoji: false, icon: '🐕', image: 'monster_dog.png', prefHand: 'ROCK', stats: { hp: 540, maxHp: 540, atk: 60, def: 12 }, lore: '性格暴躁的犬型魔物，全身燃燒著火焰，咬合力極強。收服後冬天可以用來當暖爐。', skill1: { name: '火焰牙', cost: 30, desc: '施加 🔥[燃燒] 2回合。' }, skill2: { name: '地獄火', cost: 70, desc: '造成高達 140 點傷害。' } },
  { id: 'm4', name: '閃耀精靈', title: '刺眼的', element: ELEMENTS.LIGHT, isEmoji: false, icon: '🧚', image: 'monster_fairy.png', prefHand: 'PAPER', stats: { hp: 500, maxHp: 500, atk: 46, def: 18 }, lore: '被光之星晶過度影響而失去理智的精靈，會發出強光致盲對手。', skill1: { name: '致盲', cost: 40, desc: '施加 💫[眩目] 1回合。' }, skill2: { name: '神聖新星', cost: 70, desc: '造成 40 點傷害並回復自身 40 血。' } },
  { id: 'm5', name: '影魔眼', title: '陰森森的', element: ELEMENTS.DARK, isEmoji: false, icon: '👁️', image: 'monster_eye.png', prefHand: 'ROCK', stats: { hp: 450, maxHp: 450, atk: 70, def: 10 }, lore: '漂浮在空中的巨大眼球，凝視會讓人陷入恐懼與沉默。', skill1: { name: '恐懼凝視', cost: 40, desc: '施加 🤐[沉默] 2回合。' }, skill2: { name: '虛空射線', cost: 60, desc: '造成 70 點高額傷害。' } },
  { id: 'm6', name: '刺藤傀儡', title: '荊棘纏繞的', element: ELEMENTS.WOOD, isEmoji: false, icon: '🪴', image: 'monster_vine.png', prefHand: 'SCISSORS', stats: { hp: 630, maxHp: 630, atk: 35, def: 35 }, lore: '由魔力星晶滋養的藤蔓怪，渾身佈滿荊棘。行動遲緩，但能讓靠近的敵人越戰越弱。', skill1: { name: '荊棘纏繞', cost: 35, desc: '對敵施加 📉[降攻] 與 📉[降防] 各 2 回合。' }, skill2: { name: '蔓延怒刺', cost: 65, desc: '造成 30 傷害，敵方每個負面狀態額外追加 20 傷。' } },
  { id: 'm7', name: '海藍水母', title: '飄渺無形的', element: ELEMENTS.WATER, isEmoji: false, icon: '🪼', image: 'monster_jellyfish.png', prefHand: 'PAPER', stats: { hp: 460, maxHp: 460, atk: 46, def: 12 }, lore: '在深海中靜靜飄蕩的神秘水母，半透明的傘蓋能折射光線讓人難以捕捉。觸手帶有強力麻痺毒素。', skill1: { name: '幻象漂浮', cost: 30, desc: '獲得 💨[迴避] 1次，並奪取敵方 20 點能量。' }, skill2: { name: '電擊觸手', cost: 65, desc: '造成 60 傷害，施加 ❄️[封印] 1回合並再奪取 30 點能量。' } },
  { id: 'm8', name: '熔岩蜥蜴', title: '滾燙的', element: ELEMENTS.FIRE, isEmoji: false, icon: '🦎', image: 'monster_lizard.png', prefHand: 'ROCK', stats: { hp: 560, maxHp: 560, atk: 46, def: 18 }, lore: '棲息於火山岩漿地帶的蜥蜴型魔物。表皮由凝固岩漿構成，蓄積熱能後能引爆全身造成毀滅性衝擊。', skill1: { name: '熔甲防禦', cost: 35, desc: '獲得 120 點護盾。' }, skill2: { name: '熔岩爆裂', cost: 70, desc: '消耗所有護盾，造成 70 加護盾等量的真實傷害。' } },
  { id: 'm9', name: '星晶鷺鳥', title: '輕盈飛翔的', element: ELEMENTS.LIGHT, isEmoji: false, icon: '🦢', image: 'monster_heron.png', prefHand: 'SCISSORS', stats: { hp: 500, maxHp: 500, atk: 52, def: 12 }, lore: '翅膀結晶化的光屬性鳥型魔物，飛行速度極快。振翅產生的光芒能令對手陷入眩目。', skill1: { name: '星光羽翼', cost: 30, desc: '獲得 ⚡[亢奮] 3回合，並獲得 60 點護盾。' }, skill2: { name: '天光衝擊', cost: 60, desc: '造成 100 傷害，並強制對手下回 💫[強制出拳]。' } },
  { id: 'm10', name: '噬夢獸', title: '令人昏昏欲睡的', element: ELEMENTS.DARK, isEmoji: false, icon: '🦇', image: 'monster_bat.png', prefHand: 'PAPER', stats: { hp: 500, maxHp: 500, atk: 60, def: 12 }, lore: '在夜間悄悄侵入夢境吸食精神力的蝙蝠型魔物。讓對手陷入持續疲憊的同時，自身卻越來越精力充沛。', skill1: { name: '夢魘爪', cost: 35, desc: '施加 💤[疲憊] 3回合，並自身恢復 60 HP。' }, skill2: { name: '虛空侵蝕', cost: 70, desc: '無視護盾造成 110 傷害，敵方每個負面狀態額外吸血 35 HP。' } },
];

export const BOSS_MONSTERS = [
  { id: 'b1', name: '災厄黑龍', title: '深淵霸主', element: ELEMENTS.DARK, isEmoji: false, icon: '🐉', image: 'boss_dragon.png', prefHand: 'ROCK', stats: { hp: 1300, maxHp: 1300, atk: 80, def: 35 }, lore: '盤踞在廢棄古城的巨龍，擁有毀滅性的吐息，被認為是大星晶碎裂的罪魁禍首之一。', skill1: { name: '龍威', cost: 40, desc: '扣除 35 能量並施加 🤐[沉默] 1回合。' }, skill2: { name: '毀滅吐息', cost: 90, desc: '無視護盾造成 230 點傷害。' } },
  { id: 'b2', name: '耀光大天使', title: '天界審判', element: ELEMENTS.LIGHT, isEmoji: false, icon: '👼', image: 'boss_angel.png', prefHand: 'PAPER', stats: { hp: 1200, maxHp: 1200, atk: 85, def: 30 }, lore: '原本是守護神殿的天使，卻被過度純粹的光之能量逼瘋，對所有入侵者降下無差別的神罰。', skill1: { name: '致盲之光', cost: 40, desc: '施加 💫[眩目] 1回合，並獲得 60 護盾。' }, skill2: { name: '神罰', cost: 90, desc: '造成 200 點直接傷害。' } },
  { id: 'b3', name: '獄炎魔王', title: '焦熱地獄', element: ELEMENTS.FIRE, isEmoji: false, icon: '🌋', image: 'boss_demon.png', prefHand: 'ROCK', stats: { hp: 1350, maxHp: 1350, atk: 90, def: 25 }, lore: '從火山深處誕生的炎之惡魔，企圖將整個世界化為焦熱地獄。', skill1: { name: '沸騰之血', cost: 40, desc: '提升自身 20 攻擊力，並施加 🔥[燃燒] 2回合。' }, skill2: { name: '天地灰燼', cost: 100, desc: '造成 260 點毀滅性傷害。' } },
  { id: 'b4', name: '森之巨神', title: '萬古腐化', element: ELEMENTS.WOOD, isEmoji: false, icon: '🌳', image: 'boss_tree.png', prefHand: 'PAPER', stats: { hp: 1500, maxHp: 1500, atk: 70, def: 45 }, lore: '被腐化力量侵蝕的遠古樹神，其寄生藤蔓能瞬間吸乾整座森林的生命力。', skill1: { name: '寄生藤蔓', cost: 40, desc: '造成 60 傷害並施加 🌿[寄生] 3回合。' }, skill2: { name: '萬物歸一', cost: 80, desc: '瞬間回復 350 點生命值。' } },
  { id: 'b5', name: '冰霜巨龍', title: '絕對零度', element: ELEMENTS.WATER, isEmoji: false, icon: '❄️', image: 'boss_icedragon.png', prefHand: 'SCISSORS', stats: { hp: 1200, maxHp: 1200, atk: 75, def: 55 }, lore: '沉睡在冰川下的古老存在，其吐息能帶來絕對零度的冰河時代。', skill1: { name: '冰霜裝甲', cost: 40, desc: '獲得高達 140 點的護盾。' }, skill2: { name: '冰河時代', cost: 90, desc: '造成 170 傷害，清空能量並施加 ❄️[封印] 1回合。' } },
];

export const ADVANCED_MONSTERS = [
  { id: 'am1', name: '猩紅史萊姆', title: '沸騰的', element: ELEMENTS.FIRE, isEmoji: false, icon: '🩸', image: 'adv_slime.png', prefHand: 'ROCK', stats: { hp: 950, maxHp: 950, atk: 80, def: 30 }, lore: '吸收了過量火屬性星晶的變異體。', skill1: { name: '強酸腐蝕', cost: 40, desc: '造成20傷，施加防禦下降與易傷(3回)。' }, skill2: { name: '自爆', cost: 90, desc: '造成120點無視護盾的真實傷害。' }, isUncapturable: true },
  { id: 'am2', name: '極光護衛蟹', title: '堅不可摧', element: ELEMENTS.LIGHT, isEmoji: false, icon: '🛡️', image: 'adv_crab.png', prefHand: 'PAPER', stats: { hp: 1200, maxHp: 1200, atk: 60, def: 60 }, lore: '外殼已經完全星晶化的變異蟹。', skill1: { name: '星晶裝甲', cost: 30, desc: '獲得100點護盾。' }, skill2: { name: '極光制裁', cost: 80, desc: '造成80傷並施加眩目(1回)。' }, isUncapturable: true },
  { id: 'am3', name: '深淵監視者', title: '凝視者', element: ELEMENTS.DARK, isEmoji: false, icon: '🧿', image: 'adv_eye.png', prefHand: 'SCISSORS', stats: { hp: 900, maxHp: 900, atk: 95, def: 25 }, lore: '來自更深層的恐懼。', skill1: { name: '精神污染', cost: 40, desc: '施加沉默(2回)與疲憊(3回)。' }, skill2: { name: '湮滅射線', cost: 70, desc: '造成100點高額傷害。' }, isUncapturable: true },
];

export const ADVANCED_BOSSES = [
  { id: 'ab1', name: '混沌縫合怪', title: '人造惡意', element: ELEMENTS.WOOD, isEmoji: false, icon: '🧟', image: 'adv_boss_amalgam.png', prefHand: 'ROCK', stats: { hp: 2200, maxHp: 2200, atk: 95, def: 55 }, lore: '不知名法師拼湊出的恐怖怪物。', skill1: { name: '劇毒孢子', cost: 40, desc: '造成40傷並施加寄生與燃燒(3回)。' }, skill2: { name: '大地粉碎', cost: 100, desc: '造成200點傷害，並施加強制(1回)。' }, isUncapturable: true },
  { id: 'ab2', name: '星曜古龍', title: '星晶化身', element: ELEMENTS.LIGHT, isEmoji: false, icon: '🐲', image: 'adv_boss_dragon.png', prefHand: 'PAPER', stats: { hp: 2600, maxHp: 2600, atk: 105, def: 65 }, lore: '完全吞噬了大星晶核心的遠古巨龍，難以名狀的災厄。', skill1: { name: '星辰庇護', cost: 50, desc: '獲得150點護盾與再生(3回)。' }, skill2: { name: '星爆氣流', cost: 120, desc: '無視護盾造成250點真實傷害。' }, isUncapturable: true },
];

export const TUTORIAL_ENEMY = {
  id: 'tutorial_dummy', name: '訓練魔傀儡', title: '乖巧的', element: ELEMENTS.WOOD,
  isEmoji: true, emoji: '🪆', icon: '🪆',
  prefHand: 'ROCK',
  stats: { hp: 220, maxHp: 220, atk: 12, def: 5 },
  lore: '由教官以魔法製成的訓練用傀儡，不會造成致命傷害。',
  skill1: { name: '輕拍', cost: 999, desc: '造成 10 點傷害。' },
  skill2: { name: '搖晃', cost: 999, desc: '造成 20 點傷害。' },
  isUncapturable: true,
};

