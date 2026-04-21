export const FORGE_PERMANENT = [
  { id: 'armor_burst',     name: '爆裂星晶', icon: '💠', cost: 80,  desc: '出拳獲勝時，額外造成 30 點真實傷害。' },
  { id: 'armor_corrosion', name: '腐蝕刃',   icon: '🗡️', cost: 120, desc: '出拳獲勝時，對敵隨機施加降攻或降防 2 回合。' },
  { id: 'armor_chaos',     name: '干擾符文', icon: '🌀', cost: 150, desc: '每回合結束有 30% 機率對敵施加隨機負面狀態。' },
  { id: 'armor_overload',  name: '超載電容', icon: '⚡', cost: 180, desc: '戰鬥開始時，對敵施加疲憊 3 回合。' },
  { id: 'armor_fishingrod', name: '熊吉的釣竿', icon: '🎣', cost: 30, currency: 'charFragment', fragmentCharId: 'bear', desc: '限定熊吉出戰：平手時有 50% 機率隨機獲得「攻擊提升／防禦提升／再生」其一（不重複）。' },
  { id: 'armor_icebarrier', name: '白澤的冰晶護盾', icon: '🧊', cost: 30, currency: 'charFragment', fragmentCharId: 'wolf', desc: '限定白澤出戰：護盾被打破或奧義主動清空護盾時，對敵造成 20 傷害。' },
  { id: 'armor_matchstick', name: '普爾斯的引火匣', icon: '🧯', cost: 30, currency: 'charFragment', fragmentCharId: 'human', desc: '限定普爾斯出戰：平手時有 50% 機率賦予或延長敵人 🔥[燃燒] 1回合。' },
  { id: 'armor_venomcharm', name: '布提婭的毒咒', icon: '🕸️', cost: 30, currency: 'charFragment', fragmentCharId: 'cat', desc: '限定布提婭出戰：戰技若對手已同時存在降攻/降防，改為施加 ☠️[中毒] 2回合（每回合遞增）。' },
  { id: 'armor_seedguard', name: '布布的葵花護符', icon: '🌻', cost: 30, currency: 'charFragment', fragmentCharId: 'elf', desc: '限定布布出戰：生命低於 50% 受到攻擊時消耗 1 顆葵花子，使當下受到傷害 -50%。' },
];

export const FORGE_CONSUMABLE = [
  { id: 'carm_pierce', name: '破甲符',   icon: '💢', cost: 20, desc: '出拳獲勝時，對敵施加易傷 1 回合。(消耗品)' },
  { id: 'carm_dark',   name: '暗晶碎塊', icon: '🌑', cost: 25, desc: '戰鬥開始時，對敵施加封印 2 回合。(消耗品)' },
  { id: 'carm_radar',  name: '寶物雷達', icon: '📡', cost: 30, desc: '戰鬥勝利時，獲得星晶加倍。(消耗品)' },
];

export const ALL_ARMORS = [...FORGE_PERMANENT, ...FORGE_CONSUMABLE];
