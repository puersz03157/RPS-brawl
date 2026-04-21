export const INGREDIENTS = [
  { id: 'egg', name: '星紋鳥蛋', icon: '🥚', cost: 10 },
  { id: 'meat', name: '野獸魔肉', icon: '🥩', cost: 10 },
  { id: 'fish', name: '銀流溪魚', icon: '🐟', cost: 10 },
  { id: 'mush', name: '夜光孢菇', icon: '🍄', cost: 10 },
  { id: 'herb', name: '翠葉靈草', icon: '🌿', cost: 10 },
  { id: 'water', name: '元素靈水', icon: '💧', cost: 10 },
];

export const RECIPES = [
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

export const COOKING_PREF_BONUS = 1.2; // 偏好料理效果 +20%

// 悠活莊園高級食材（僅可從莊園小遊戲取得，不在商店販售）
export const GARDEN_INGREDIENTS = [
  { id: 'veggie', name: '晨露嫩蔬', icon: '🥬', source: '種植園' },
  { id: 'rare_mush', name: '星晶靈菇', icon: '🍄', source: '種植園' },
  { id: 'rare_fish', name: '深淵幻魚', icon: '🐡', source: '釣魚池' },
  { id: 'prime_meat', name: '魔獸精肉', icon: '🍗', source: '魔物狩獵' },
  { id: 'golden_egg', name: '金晶巨卵', icon: '🪺', source: '魔物狩獵' },
];

export const ALL_INGREDIENTS = [...INGREDIENTS, ...GARDEN_INGREDIENTS];
