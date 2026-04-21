export const GUIDE_TERMS = [
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

export const GUIDE_SYSTEMS = [
  { icon: '🍳', name: '料理系統', desc: '在日晝營地的料理台，以食材烹飪各種料理。效果（HP 上限、攻擊力、護盾、初始能量、每回合再生）於下一場戰鬥開始時生效，且在整個戰役／主線章節的所有戰鬥中持續有效。使用符合角色偏好的食材，效果可額外提升 20%。' },
  { icon: '🎒', name: '戰鬥道具', desc: '在星晶商店「打工專區」消耗 AP 製作道具後可攜入戰場。每場戰鬥最多使用 3 次，隨時可用。可用道具：✨ 星晶砂粉（回復 100 HP）、🧪 亢奮藥劑（亢奮 3 回合）、💨 煙霧彈（迴避 1 次）、💊 萬能解藥（清除所有負面狀態）。' },
  { icon: '📖', name: '主線夜巡', desc: '依章節推進劇情，每章可自由選擇出陣角色並配置天賦（非強制使用推薦角色）。料理加成於章節所有戰鬥中持續有效。完成每章可解鎖對應成就並獲得食材獎勵。' },
  { icon: '💼', name: '公會打工 / 打工專區', desc: '在星晶商店的「打工專區」分頁，可消耗 1 AP 完成公會打工（獲得 50 星晶），或消耗 AP 製作戰鬥道具備用。AP 來源為戰鬥勝利獎勵。' },
];

// 【V2.6 成就系統定義】
export const ACHIEVEMENTS = [
  { id: 'a_win_10', name: '初級夜行者', desc: '戰鬥勝利 10 場', target: 10, reward: 100, getProgress: (p) => p.battlesWon || 0 },
  { id: 'a_win_50', name: '傳說夜行者', desc: '戰鬥勝利 50 場', target: 50, reward: 300, getProgress: (p) => p.battlesWon || 0 },
  { id: 'a_cap_5', name: '訓獸見習生', desc: '成功收服 5 種魔物', target: 5, reward: 150, getProgress: (p) => (p.captured || []).length },
  { id: 'a_cap_all', name: '生態觀察家', desc: '收服所有一般與Boss魔物 (共10種)', target: 10, reward: 500, getProgress: (p) => (p.captured || []).length },
  { id: 'a_pull_10', name: '小試身手', desc: '在迷途酒館進行 10 次招募', target: 10, reward: 150, getProgress: (p) => p.gachaPulls || 0 },
  { id: 'a_pull_50', name: '資本的力量', desc: '在迷途酒館進行 50 次招募', target: 50, reward: 500, getProgress: (p) => p.gachaPulls || 0 },
  { id: 'a_mastery_1', name: '專精之路', desc: '將 1 名角色的專精提升至 3 星', target: 1, reward: 200, getProgress: (p) => Object.values(p.mastery || {}).filter((v) => v >= 3).length },
  { id: 'a_mastery_all', name: '全職業制霸', desc: '將 5 名角色的專精提升至 3 星', target: 5, reward: 1000, getProgress: (p) => Object.values(p.mastery || {}).filter((v) => v >= 3).length },
  { id: 'a_aff_1', name: '最好的朋友', desc: '解鎖 1 張雙人羈絆滿級CG', target: 1, reward: 200, getProgress: (p) => Object.values(p.affection || {}).filter((v) => v >= 20).length },
  { id: 'a_aff_3', name: '最棒的摯友', desc: '解鎖 3 張雙人羈絆滿級CG', target: 3, reward: 600, getProgress: (p) => Object.values(p.affection || {}).filter((v) => v >= 20).length },
  { id: 'a_story_1', name: '翡翠森之獵手', desc: '完成主線夜巡第一章「翡翠森之徑」', target: 1, reward: 0, rewardIngredients: { herb: 3 }, rewardDesc: '🌿 翠葉靈草 ×3', getProgress: (p) => ((p.completedStoryChapters || []).includes(1) ? 1 : 0) },
  { id: 'a_story_2', name: '冰封湖的訪客', desc: '完成主線夜巡第二章「冰封星晶湖」', target: 1, reward: 0, rewardIngredients: { fish: 3 }, rewardDesc: '🐟 銀流溪魚 ×3', getProgress: (p) => ((p.completedStoryChapters || []).includes(2) ? 1 : 0) },
  { id: 'a_story_3', name: '煉獄山的試煉者', desc: '完成主線夜巡第三章「焦熱煉獄山」', target: 1, reward: 0, rewardIngredients: { meat: 3 }, rewardDesc: '🥩 野獸魔肉 ×3', getProgress: (p) => ((p.completedStoryChapters || []).includes(3) ? 1 : 0) },
  { id: 'a_story_4', name: '神殿遺忘的光', desc: '完成主線夜巡第四章「曦光遺忘神殿」', target: 1, reward: 0, rewardIngredients: { egg: 3 }, rewardDesc: '🥚 星紋鳥蛋 ×3', getProgress: (p) => ((p.completedStoryChapters || []).includes(4) ? 1 : 0) },
  { id: 'a_story_5', name: '深淵裂隙封鎖者', desc: '完成主線夜巡第五章「深淵星晶裂隙」', target: 1, reward: 0, rewardIngredients: { mush: 3, water: 3 }, rewardDesc: '🍄 夜光孢菇 ×3 + 💧 元素靈水 ×3', getProgress: (p) => ((p.completedStoryChapters || []).includes(5) ? 1 : 0) },
];
