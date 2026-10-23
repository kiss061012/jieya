const storage = require('../../utils/storage.js')
const sound = require('../../utils/sound.js')

const ROUND_MS = 30000
const HOLE_COUNT = 9
const WORRIES = ['💼', '📝', '🧾', '😤', '🦟', '💤']
const BONUS = '🍀'
const HIT_BURST = '💥'
const BONUS_BURST = '✨'

Page({
  data: {
    state: 'idle', // idle | playing | over
    score: 0,
    combo: 0,
    best: 0,
    timeLeft: 30,
    timePercent: 100,
    holes: [],
    bursts: [],
    hammers: [],
    result: null
  },

  onLoad() {
    const stats = storage.getStats()
    this.setData({ best: stats.whackBestScore || 0 })
  },

  onShow() {
    this.syncTabBar()
  },

  onHide() {
    this.stopGame()
  },

  onUnload() {
    this.stopGame()
  },

  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  startGame() {
    if (this.data.state === 'playing') return
    this.stopGame()
    const holes = []
    for (let i = 0; i < HOLE_COUNT; i++) {
      holes.push({ id: i, up: false, hit: false, emoji: '', bonus: false })
    }
    this.setData({
      state: 'playing',
      score: 0,
      combo: 0,
      timeLeft: 30,
      timePercent: 100,
      holes,
      bursts: [],
      hammers: [],
      result: null
    })
    this.startTime = Date.now()
    this.timer = setInterval(() => {
      const left = Math.max(0, ROUND_MS - (Date.now() - this.startTime))
      this.setData({
        timeLeft: Math.ceil(left / 1000),
        timePercent: Math.round(left / ROUND_MS * 100)
      })
      if (left <= 0) this.endGame()
    }, 200)
    this.spawnLoop()
  },

  spawnLoop() {
    if (this.data.state !== 'playing') return
    this.spawn()
    const progress = (Date.now() - this.startTime) / ROUND_MS
    const interval = 600 - 260 * progress
    this.spawnTimer = setTimeout(() => this.spawnLoop(), interval)
  },

  spawn() {
    if (this.data.state !== 'playing') return
    const holes = this.data.holes
    const idle = holes.filter(h => !h.up)
    if (!idle.length) return
    const hole = idle[Math.floor(Math.random() * idle.length)]
    const bonus = Math.random() < 0.12
    this.setData({
      ['holes[' + hole.id + '].up']: true,
      ['holes[' + hole.id + '].hit']: false,
      ['holes[' + hole.id + '].emoji']: bonus ? BONUS : WORRIES[Math.floor(Math.random() * WORRIES.length)],
      ['holes[' + hole.id + '].bonus']: bonus
    })
    const stay = 650 + Math.random() * 400
    hole.timer = setTimeout(() => {
      if (this.data.state !== 'playing') return
      const cur = this.data.holes[hole.id]
      if (cur && cur.up && !cur.hit) {
        this.setData({ ['holes[' + hole.id + '].up']: false, combo: 0 })
      }
    }, stay)
  },

  onHit(e) {
    if (this.data.state !== 'playing') return
    const id = e.currentTarget.dataset.id
    const touch = (e.touches && e.touches[0]) || {}
    const x = typeof touch.clientX === 'number' ? touch.clientX : (e.detail && e.detail.x)
    const y = typeof touch.clientY === 'number' ? touch.clientY : (e.detail && e.detail.y)
    if (typeof x === 'number' && typeof y === 'number') this.addHammer(x, y)

    const hole = this.data.holes[id]
    if (!hole || !hole.up || hole.hit) {
      if (!hole || !hole.up) this.missPuff(id)
      return
    }
    hole.hit = true
    clearTimeout(hole.timer)
    const bonus = hole.bonus
    const gain = bonus ? 5 : 1
    const burst = {
      id: Date.now() + '-' + Math.random(),
      emoji: bonus ? BONUS_BURST : HIT_BURST,
      left: (id % 3 + 0.5) * 100 / 3,
      top: (Math.floor(id / 3) + 0.5) * 100 / 3
    }
    this.setData({
      score: this.data.score + gain,
      combo: this.data.combo + 1,
      ['holes[' + id + '].hit']: true,
      bursts: this.data.bursts.concat(burst)
    })
    setTimeout(() => {
      this.setData({ bursts: this.data.bursts.filter(b => b.id !== burst.id) })
    }, 550)
    setTimeout(() => {
      if (this.data.state !== 'playing') return
      const cur = this.data.holes[id]
      if (cur && cur.up) this.setData({ ['holes[' + id + '].up']: false })
    }, 200)
    wx.vibrateShort({ type: bonus ? 'medium' : 'light' })
    sound.play(bonus ? 'egg' : 'whack')
    storage.addWhack(1)
  },

  missPuff(id) {
    const puff = {
      id: Date.now() + '-' + Math.random(),
      emoji: '👻',
      left: (id % 3 + 0.5) * 100 / 3,
      top: (Math.floor(id / 3) + 0.5) * 100 / 3
    }
    this.setData({ bursts: this.data.bursts.concat(puff) })
    setTimeout(() => {
      this.setData({ bursts: this.data.bursts.filter(b => b.id !== puff.id) })
    }, 550)
  },

  addHammer(x, y) {
    if (!this.windowWidth) {
      const sys = wx.getSystemInfoSync()
      this.windowWidth = sys.windowWidth
    }
    const k = 750 / this.windowWidth
    const hammer = { id: Date.now() + '-' + Math.random(), x: Math.round(x * k), y: Math.round(y * k) }
    this.setData({ hammers: this.data.hammers.concat(hammer) })
    setTimeout(() => {
      this.setData({ hammers: this.data.hammers.filter(h => h.id !== hammer.id) })
    }, 320)
  },

  endGame() {
    if (this.data.state !== 'playing') return
    this.stopTimers()
    const score = this.data.score
    let rating, title, emoji
    if (score >= 35) { rating = 'S'; title = '锤神降临'; emoji = '👑' }
    else if (score >= 25) { rating = 'A'; title = '烦恼克星'; emoji = '💪' }
    else if (score >= 15) { rating = 'B'; title = '小锤初成'; emoji = '😤' }
    else { rating = 'C'; title = '锤了个寂寞'; emoji = '🥱' }
    const rec = storage.updateWhackRecord(score)
    sound.play('win')
    const holes = this.data.holes.map(h => ({ ...h, up: false }))
    this.setData({
      state: 'over',
      holes,
      result: { score, rating, title, emoji, isNewBest: rec.isNewBest, best: rec.bestScore }
    })
  },

  stopTimers() {
    clearInterval(this.timer)
    clearTimeout(this.spawnTimer)
    this.timer = null
    this.spawnTimer = null
  },

  stopGame() {
    this.stopTimers()
    if (this.data.holes.length) {
      this.data.holes.forEach(h => clearTimeout(h.timer))
    }
  }
})
