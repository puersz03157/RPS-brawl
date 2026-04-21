export const MINE_LEVELS = [
  { lv: 1, name: '廢棄礦道', baseRate: 10, capBase: 100, slots: 2, upgradeCost: 50 },
  { lv: 2, name: '開採礦坑', baseRate: 15, capBase: 150, slots: 2, upgradeCost: 120 },
  { lv: 3, name: '深層礦脈', baseRate: 20, capBase: 200, slots: 3, upgradeCost: 250 },
  { lv: 4, name: '精煉礦場', baseRate: 25, capBase: 250, slots: 3, upgradeCost: 500 },
  { lv: 5, name: '星晶核心', baseRate: 30, capBase: 300, slots: 4, upgradeCost: null },
];

export const MINE_CHAR_BONUS = {
  bear: { type: 'rate', value: 0.25, desc: '碎片產出 +25%（賣力挖礦）' },
  wolf: { type: 'cooldown', value: 0.15, desc: '累積速度 +15%（效率型）' },
  cat: { type: 'bonus', value: 0.10, desc: '10% 機率額外獲得 50% 碎片（竊取）' },
  human: { type: 'cap', value: 0.20, desc: '碎片上限 +20%（爆發型）' },
  elf: { type: 'combo', rate: 0.15, cap: 0.10, desc: '碎片產出 +15% 且上限 +10%（複合型）' },
};

