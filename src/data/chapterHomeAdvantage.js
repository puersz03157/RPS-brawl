/**
 * 主線「主場優勢」：當該章可選角未選剋屬（較難打）時，給對應在地角色的數值補償。
 * 僅在 story 模式、且出戰角 (baseId||id) 等於 targetId 時套用。
 */
export const CHAPTER_HOME_ADVANTAGES = {
  1: {
    targetId: 'bear',
    log: '🌳 【主場優勢】回到熟悉的森林，戰意高漲！(攻擊力 +15)',
    apply: (p) => {
      p.atk += 15;
    },
  },
  2: {
    targetId: 'wolf',
    log: '❄️ 【主場優勢】極寒的氣候喚醒了孤狼本能！(開場護盾 +80，防禦力 +15)',
    apply: (p) => {
      p.shield += 80;
      p.def += 15;
    },
  },
  3: {
    targetId: 'human',
    log: '🔥 【主場優勢】烈焰鬥士在岩漿中如魚得水！(攻擊力 +20，開場能量 +30)',
    apply: (p) => {
      p.atk += 20;
      p.energy = Math.min(100, p.energy + 30);
    },
  },
  4: {
    targetId: 'cat',
    log: '🌑 【逆境激發】光芒的刺痛激發了夜靈貓的好勝心！(攻擊力 +25，開場護盾 +50)',
    apply: (p) => {
      p.atk += 25;
      p.shield += 50;
    },
  },
  5: {
    targetId: 'elf',
    log: '✨ 【主場優勢】光之精靈的決意驅散了深淵！(最大生命 +150，開場能量 +30)',
    apply: (p) => {
      p.maxHp += 150;
      p.hp += 150;
      p.energy = Math.min(100, p.energy + 30);
    },
  },
};
