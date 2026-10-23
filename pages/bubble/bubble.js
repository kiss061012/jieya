const storage = require('../../utils/storage.js')
const sound = require('../../utils/sound.js')

const TOTAL = 40
const EGG_COUNT = 4
const MILESTONES = {
  10: '手感不错，继续捏！',
  20: '压力正在消失…',
  30: '马上捏完啦！'
}
const FW_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF9F45', '#C780FA']
const BURSTS = ['💥', '💥', '✨', '💫']

Page({
  data: {
    bubbles: [],
    poppedCount: 0,
    total: TOTAL,
    allPopped: false,
    stats: {},
    score: 0,
    combo: 0,
    elapsedText: '0.0',
    progress: 0,
    eggFlash: false,
    praiseList: [],
    particles: [],
    ratingName: '',
    ratingClass: '',
    bestScore: 0,
    bestTimeText: '--',
    isNewBest: false
  },

  onLoad() {
    this.reset()
  },

  onShow() {
    this.syncTabBar()
    this.setData({ stats: storage.getStats() })
  },

  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  reset() {
    clearInterval(this._timer)
    this._timer = null
    this._startTime = 0
    this._lastPop = 0
    clearTimeout(this._comboTimer)
    const eggPos = new Set()
    while (eggPos.size < EGG_COUNT) eggPos.add(Math.floor(Math.random() * TOTAL))
    const bubbles = []
    for (let i = 0; i < TOTAL; i++) {
      bubbles.push({
        id: i,
        color: Math.floor(Math.random() * 3),
        egg: eggPos.has(i),
        burst: BURSTS[Math.floor(Math.random() * BURSTS.length)],
        popped: false
      })
    }
    this.setData({
      bubbles,
      poppedCount: 0,
      allPopped: false,
      praiseList: [],
      particles: [],
      score: 0,
      combo: 0,
      elapsedText: '0.0',
      progress: 0,
      eggFlash: false,
      isNewBest: false
    })
  },

  onPop(e) {
    const id = Number(e.currentTarget.dataset.id)
    const bubbles = this.data.bubbles.slice()
    const b = bubbles.find(x => x.id === id)
    if (!b || b.popped || this.data.allPopped) return
    b.popped = true

    const now = Date.now()
    if (!this._startTime) {
      this._startTime = now
      this._timer = setInterval(() => {
        const s = ((Date.now() - this._startTime) / 1000).toFixed(1)
        this.setData({ elapsedText: s })
      }, 100)
    }
    const combo = now - this._lastPop < 800 ? this.data.combo + 1 : 1
    this._lastPop = now
    clearTimeout(this._comboTimer)
    this._comboTimer = setTimeout(() => this.setData({ combo: 0 }), 800)

    const poppedCount = this.data.poppedCount + 1
    const patch = {
      bubbles,
      poppedCount,
      combo,
      score: this.data.score + (b.egg ? 10 : 1),
      progress: Math.round(poppedCount / TOTAL * 100)
    }
    wx.vibrateShort({ type: b.egg ? 'medium' : 'light' })
    sound.play(b.egg ? 'egg' : 'pop')

    if (b.egg) {
      patch.eggFlash = false
      const pid = Date.now()
      patch.praiseList = this.data.praiseList.concat([{ id: pid, text: '找到彩蛋！+10 分' }])
      setTimeout(() => {
        this.setData({ praiseList: this.data.praiseList.filter(p => p.id !== pid) })
      }, 1400)
      setTimeout(() => this.setData({ eggFlash: true }), 30)
    }
    if (combo === 5 || combo === 10) {
      const pid = Date.now() + 1
      patch.praiseList = (patch.praiseList || this.data.praiseList).concat([
        { id: pid, text: '连击 x' + combo + '，手速惊人！' }
      ])
      setTimeout(() => {
        this.setData({ praiseList: this.data.praiseList.filter(p => p.id !== pid) })
      }, 1400)
    }
    if (MILESTONES[poppedCount]) {
      const pid = Date.now() + 2
      patch.praiseList = (patch.praiseList || this.data.praiseList).concat([
        { id: pid, text: MILESTONES[poppedCount] }
      ])
      setTimeout(() => {
        this.setData({ praiseList: this.data.praiseList.filter(p => p.id !== pid) })
      }, 1400)
    }
    if (poppedCount === TOTAL) {
      clearInterval(this._timer)
      this._timer = null
      Object.assign(patch, this.finishRound())
    }
    this.setData(patch)
  },

  finishRound() {
    const elapsed = Date.now() - this._startTime
    const elapsedText = (elapsed / 1000).toFixed(1)
    let ratingName, ratingClass, bonus
    if (elapsed < 8000) {
      ratingName = 'S · 泡泡杀手'
      ratingClass = 's'
      bonus = 50
    } else if (elapsed < 12000) {
      ratingName = 'A · 解压大师'
      ratingClass = 'a'
      bonus = 30
    } else if (elapsed < 18000) {
      ratingName = 'B · 解压达人'
      ratingClass = 'b'
      bonus = 20
    } else {
      ratingName = 'C · 轻松捏泡'
      ratingClass = 'c'
      bonus = 10
    }
    const score = this.data.score + bonus
    const rec = storage.updateBubbleRecord(score, elapsed, ratingClass.toUpperCase())
    sound.play('win')
    return {
      score,
      elapsedText,
      ratingName,
      ratingClass,
      bestScore: rec.bestScore,
      bestTimeText: (rec.bestTime / 1000).toFixed(1),
      isNewBest: rec.isNewBest,
      allPopped: true,
      stats: storage.getStats(),
      particles: this.buildFireworks()
    }
  },

  buildFireworks() {
    const n = 18
    const particles = []
    for (let i = 0; i < n; i++) {
      particles.push({
        id: i,
        angle: Math.round(i * (360 / n) + Math.random() * 10),
        delay: (Math.random() * 0.25).toFixed(2),
        color: FW_COLORS[i % FW_COLORS.length]
      })
    }
    return particles
  },

  resetAll() {
    this.reset()
    wx.vibrateShort({ type: 'medium' })
  }
})
