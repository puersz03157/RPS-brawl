export const REWARD_POOL = [
  { id: 'r1', name: '生命湧動', icon: '❤️', desc: '最大生命值 +150，並回復等量生命。', apply: (p, progRef) => { p.maxHp += 150; p.hp += 150; return p; } },
  { id: 'r2', name: '夜行者貓飯', icon: '🍗', desc: '攻擊力永久 +25。', apply: (p, progRef) => { p.atk += 25; return p; } },
  { id: 'r3', name: '防禦強化', icon: '🛡️', desc: '防禦力永久 +20。', apply: (p, progRef) => { p.def += 20; return p; } },
  { id: 'r4', name: '戰術護盾', icon: '🔰', desc: '每次戰鬥開始時，自動獲得 60 點護盾。', apply: (p, progRef) => { p.permaBuffs = { ...p.permaBuffs, startShield: (p.permaBuffs?.startShield || 0) + 60 }; return p; } },
  { id: 'r5', name: '能量充沛', icon: '⚡', desc: '每次戰鬥開始時，額外獲得 30 點能量。', apply: (p, progRef) => { p.permaBuffs = { ...p.permaBuffs, startEnergy: (p.permaBuffs?.startEnergy || 0) + 30 }; return p; } },
  { id: 'r6', name: '星晶餽贈', icon: '💎', desc: '立刻獲得 30 顆星晶。', apply: (p, progRef) => { if (progRef) progRef.crystals += 30; return p; } },
];

export const STATUS_DOCS = [
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
  { name: '沉默', effect: '無法使用戰技與奧義。', icon: '🤐', color: 'text-purple-400' },
];

