const STATS_KEY = 'relax.stats'
const HISTORY_KEY = 'relax.drawHistory'
const ACH_KEY = 'relax.achSeen'

// 木鱼形态：功德越多越进化
const SKINS = [
  { min: 300, level: 5, emoji: '🐉', name: '功德神龙' },
  { min: 100, level: 4, emoji: '🐳', name: '深渊巨鲸' },
  { min: 50, level: 3, emoji: '🐡', name: '气鼓鼓河豚' },
  { min: 10, level: 2, emoji: '🐠', name: '彩虹小鱼' },
  { min: 0, level: 1, emoji: '🐟', name: '小木鱼' }
]

const LEVELS = [
  { name: '入门解压师', min: 0 },
  { name: '见习解压师', min: 20 },
  { name: '解压达人', min: 60 },
  { name: '解压大师', min: 150 },
  { name: '解压宗师', min: 300 },
  { name: '人形木鱼', min: 600 }
]

const FORTUNES = [
  { level: 5, name: '大吉', text: '诸事顺遂，想做的事今天都能成', emoji: '🌟', gua: '地天泰' },
  { level: 5, name: '大吉', text: '好运爆棚，快去干件一直想干的大事', emoji: '🎉', gua: '火天大有' },
  { level: 4, name: '中吉', text: '好运正在路上，保持好心情', emoji: '😄', gua: '地山谦' },
  { level: 4, name: '中吉', text: '今天适合表白、提需求、要加薪', emoji: '💪', gua: '风雷益' },
  { level: 3, name: '小吉', text: '小确幸就在身边，抬头看看', emoji: '🍀', gua: '泽山咸' },
  { level: 3, name: '小吉', text: '今天会遇见一只可爱的小动物', emoji: '🐱', gua: '山雷颐' },
  { level: 2, name: '末吉', text: '平平淡淡才是真，早点睡', emoji: '🌙', gua: '水地比' },
  { level: 2, name: '末吉', text: '无事发生，就是好事', emoji: '☁️', gua: '雷火丰' },
  { level: 1, name: '小凶', text: '今日不宜熬夜，宜早睡', emoji: '😴', gua: '坎为水' },
  { level: 1, name: '小凶', text: '别点奶茶，会胖（骗你的，喝吧）', emoji: '🧋', gua: '艮为山' }
]

const TIPS = [
  { emoji: '🌬️', text: '深呼吸 4 秒，慢慢呼气 6 秒，重复 5 次' },
  { emoji: '🧘', text: '起来伸个懒腰，喝口水，看看窗外' },
  { emoji: '📝', text: '把烦恼写下来，烦恼就少了一半' },
  { emoji: '🎵', text: '听一首喜欢的歌，跟着节奏晃一晃' },
  { emoji: '💥', text: '捏泡泡纸真的很解压，不信去「捏泡」试试' },
  { emoji: '🔨', text: '有气没处撒？去「锤烦恼」把加班作业统统锤掉' },
  { emoji: '🐱', text: '摸摸小动物，或者看看它们的视频' },
  { emoji: '☁️', text: '把手机放远一点，发会儿呆也很好' },
  { emoji: '😊', text: '笑一笑，没什么大不了' },
  { emoji: '🍵', text: '泡一杯热茶，慢慢喝' },
  { emoji: '🍚', text: '今天也要记得按时吃饭' }
]

function todayStr() {
  const d = new Date()
  const p = n => (n < 10 ? '0' + n : '' + n)
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

function defaultStats() {
  return {
    meritTotal: 0,
    meritToday: 0,
    meritDate: '',
    bubblesTotal: 0,
    drawsTotal: 0,
    drawDate: '',
    bubbleBestScore: 0,
    bubbleBestTime: 0,
    bubbleBestRating: '',
    whackTotal: 0,
    whackBestScore: 0
  }
}

function getStats() {
  let s = wx.getStorageSync(STATS_KEY)
  if (!s || typeof s !== 'object') {
    s = defaultStats()
  }
  // 今日功德按天重置
  if (s.meritDate !== todayStr()) {
    s.meritDate = todayStr()
    s.meritToday = 0
    wx.setStorageSync(STATS_KEY, s)
  }
  return s
}

function addMerit(n) {
  const s = getStats()
  s.meritTotal += n
  s.meritToday += n
  wx.setStorageSync(STATS_KEY, s)
  return s
}

function addBubbles(n) {
  const s = getStats()
  s.bubblesTotal += n
  wx.setStorageSync(STATS_KEY, s)
  return s
}

const RATING_RANK = { S: 4, A: 3, B: 2, C: 1 }

// 捏泡泡一局结算：记录最高分、最快用时与最高评级
function updateBubbleRecord(score, timeMs, rating) {
  const s = getStats()
  let isNewBest = false
  if (score > (s.bubbleBestScore || 0)) {
    s.bubbleBestScore = score
    isNewBest = true
  }
  if (!s.bubbleBestTime || timeMs < s.bubbleBestTime) {
    s.bubbleBestTime = timeMs
    isNewBest = true
  }
  if (rating && (RATING_RANK[rating] || 0) > (RATING_RANK[s.bubbleBestRating] || 0)) {
    s.bubbleBestRating = rating
  }
  wx.setStorageSync(STATS_KEY, s)
  return { bestScore: s.bubbleBestScore, bestTime: s.bubbleBestTime, isNewBest }
}

// 锤爆烦恼：每锤中一次 +1
function addWhack(n) {
  const s = getStats()
  s.whackTotal = (s.whackTotal || 0) + n
  wx.setStorageSync(STATS_KEY, s)
  return s
}

// 锤爆烦恼一局结算：记录最高分
function updateWhackRecord(score) {
  const s = getStats()
  const isNewBest = score > (s.whackBestScore || 0)
  if (isNewBest) s.whackBestScore = score
  wx.setStorageSync(STATS_KEY, s)
  return { bestScore: s.whackBestScore || 0, isNewBest }
}

// 成就墙：全部由现有统计推导，无需额外落库
function achTotal(s) {
  return s.meritTotal + s.bubblesTotal + s.drawsTotal + (s.whackTotal || 0)
}

const ACHIEVEMENTS = [
  { id: 'fish1', emoji: '🐟', name: '初入空门', desc: '敲响木鱼 1 次', check: s => s.meritTotal >= 1 },
  { id: 'fish10', emoji: '🐠', name: '小鱼初长成', desc: '木鱼进化到 Lv.2', check: s => s.meritTotal >= 10 },
  { id: 'fish50', emoji: '🐡', name: '气鼓鼓', desc: '木鱼进化到 Lv.3', check: s => s.meritTotal >= 50 },
  { id: 'fish100', emoji: '🐳', name: '深渊巨鲸', desc: '木鱼进化到 Lv.4', check: s => s.meritTotal >= 100 },
  { id: 'fish300', emoji: '🐉', name: '功德神龙', desc: '木鱼进化到 Lv.5', check: s => s.meritTotal >= 300 },
  { id: 'bubble10', emoji: '💥', name: '泡泡初体验', desc: '累计捏爆 10 个泡泡', check: s => s.bubblesTotal >= 10 },
  { id: 'bubbleS', emoji: '🏆', name: '泡泡大师', desc: '捏泡单局 S 级', check: s => s.bubbleBestRating === 'S' },
  { id: 'whack20', emoji: '🔨', name: '锤子抡起来', desc: '累计锤中 20 次烦恼', check: s => (s.whackTotal || 0) >= 20 },
  { id: 'whackS', emoji: '👑', name: '锤神降临', desc: '锤烦恼单局 S 级', check: s => (s.whackBestScore || 0) >= 35 },
  { id: 'draw1', emoji: '🏮', name: '诚心求签', desc: '求第一支签', check: s => s.drawsTotal >= 1 },
  { id: 'draw5', emoji: '📿', name: '签签虔虔', desc: '累计求签 5 次', check: s => s.drawsTotal >= 5 },
  { id: 'lv20', emoji: '🧘', name: '解压新星', desc: '解压值达到 20', check: s => achTotal(s) >= 20 },
  { id: 'lv150', emoji: '🧘‍♂️', name: '解压大师', desc: '解压值达到 150', check: s => achTotal(s) >= 150 },
  { id: 'lv600', emoji: '😌', name: '人形木鱼', desc: '解压值达到 600', check: s => achTotal(s) >= 600 }
]

function getAchievements(stats) {
  const s = stats || getStats()
  return ACHIEVEMENTS.map(a => ({ ...a, unlocked: a.check(s) }))
}

function getNewUnlocks(stats) {
  const seen = wx.getStorageSync(ACH_KEY) || []
  return getAchievements(stats).filter(a => a.unlocked && seen.indexOf(a.id) === -1)
}

function markAchievementsSeen(ids) {
  const seen = wx.getStorageSync(ACH_KEY) || []
  ids.forEach(id => {
    if (seen.indexOf(id) === -1) seen.push(id)
  })
  wx.setStorageSync(ACH_KEY, seen)
}

// 每天只能求一签
function canDrawToday() {
  const s = getStats()
  return s.drawDate !== todayStr()
}

function getDrawHistory() {
  return wx.getStorageSync(HISTORY_KEY) || []
}

function addDraw(fortune) {
  const list = getDrawHistory()
  list.unshift({ ...fortune, time: Date.now() })
  const capped = list.slice(0, 30)
  wx.setStorageSync(HISTORY_KEY, capped)
  const s = getStats()
  s.drawsTotal += 1
  s.drawDate = todayStr()
  wx.setStorageSync(STATS_KEY, s)
  return capped
}

function getRandomFortune() {
  const f = FORTUNES[Math.floor(Math.random() * FORTUNES.length)]
  return { ...f, num: 1 + Math.floor(Math.random() * 100) }
}

function getSkinInfo(merit) {
  for (let i = 0; i < SKINS.length; i++) {
    if (merit >= SKINS[i].min) {
      const next = i > 0 ? SKINS[i - 1] : null
      const percent = next
        ? Math.min(100, Math.round((merit - SKINS[i].min) / (next.min - SKINS[i].min) * 100))
        : 100
      return { skin: SKINS[i], next, need: next ? next.min - merit : 0, percent }
    }
  }
}

function getSkinLevels() {
  return SKINS.slice().reverse()
}

function getLevel(stats) {
  const total = stats.meritTotal + stats.bubblesTotal + stats.drawsTotal + (stats.whackTotal || 0)
  let cur = LEVELS[0]
  let next = null
  for (let i = 0; i < LEVELS.length; i++) {
    if (total >= LEVELS[i].min) {
      cur = LEVELS[i]
      next = i < LEVELS.length - 1 ? LEVELS[i + 1] : null
    }
  }
  const percent = next
    ? Math.min(100, Math.round((total - cur.min) / (next.min - cur.min) * 100))
    : 100
  return {
    total,
    name: cur.name,
    percent,
    nextName: next ? next.name : '已达最高',
    need: next ? next.min - total : 0
  }
}

function getRandomTip() {
  return TIPS[Math.floor(Math.random() * TIPS.length)]
}

function fmtTime(ts) {
  const d = new Date(ts)
  const p = n => (n < 10 ? '0' + n : '' + n)
  return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
}

function clearAll() {
  wx.removeStorageSync(STATS_KEY)
  wx.removeStorageSync(HISTORY_KEY)
  wx.removeStorageSync(ACH_KEY)
}

module.exports = {
  getStats,
  addMerit,
  addBubbles,
  updateBubbleRecord,
  addWhack,
  updateWhackRecord,
  canDrawToday,
  getDrawHistory,
  addDraw,
  getRandomFortune,
  getSkinInfo,
  getSkinLevels,
  getLevel,
  getRandomTip,
  getAchievements,
  getNewUnlocks,
  markAchievementsSeen,
  fmtTime,
  clearAll
}
