export const FORGE_PERMANENT = [
  { id: 'armor_burst',     name: '爆裂星晶', icon: '💠', cost: 80,  desc: '出拳獲勝時，額外造成 30 點真實傷害。' },
  { id: 'armor_corrosion', name: '腐蝕刃',   icon: '🗡️', cost: 120, desc: '出拳獲勝時，對敵隨機施加降攻或降防 2 回合。' },
  { id: 'armor_chaos',     name: '干擾符文', icon: '🌀', cost: 150, desc: '每回合結束有 30% 機率對敵施加隨機負面狀態。' },
  { id: 'armor_overload',  name: '超載電容', icon: '⚡', cost: 180, desc: '戰鬥開始時，對敵施加疲憊 3 回合。' },
];

export const FORGE_CONSUMABLE = [
  { id: 'carm_pierce', name: '破甲符',   icon: '💢', cost: 20, desc: '出拳獲勝時，對敵施加易傷 1 回合。(消耗品)' },
  { id: 'carm_dark',   name: '暗晶碎塊', icon: '🌑', cost: 25, desc: '戰鬥開始時，對敵施加封印 2 回合。(消耗品)' },
];

export const ALL_ARMORS = [...FORGE_PERMANENT, ...FORGE_CONSUMABLE];
