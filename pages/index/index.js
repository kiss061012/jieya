const storage = require('../../utils/storage.js')
const sound = require('../../utils/sound.js')

Page({
  data: {
    stats: { meritTotal: 0, meritToday: 0 },
    skin: { level: 1, emoji: '🐟', name: '小木鱼' },
    next: null,
    nextNeed: 0,
    skinProgress: 0,
    skinLevels: [],
    tip: { emoji: '☁️', text: '' },
    tipAnim: false,
    floats: [],
    waves: [],
    combo: 0,
    knocking: false
  },

  onShow() {
    this.syncTabBar()
    this.refresh()
  },

  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  refresh() {
    const stats = storage.getStats()
    const info = storage.getSkinInfo(stats.meritTotal)
    this.setData({
      stats,
      skin: info.skin,
      next: info.next,
      nextNeed: info.need,
      skinProgress: info.percent,
      skinLevels: this.buildSkinLevels(stats.meritTotal),
      tip: storage.getRandomTip()
    })
  },

  buildSkinLevels(merit) {
    return storage.getSkinLevels().map(l => ({ ...l, done: merit >= l.min }))
  },

  refreshTip() {
    this.setData({ tip: storage.getRandomTip(), tipAnim: false })
    setTimeout(() => this.setData({ tipAnim: true }), 30)
  },

  onKnock() {
    const now = Date.now()
    const combo = now - (this._lastKnock || 0) < 900 ? this.data.combo + 1 : 1
    this._lastKnock = now
    const stats = storage.addMerit(1)
    const info = storage.getSkinInfo(stats.meritTotal)
    const id = now + '-' + Math.floor(Math.random() * 10000)
    const x = 20 + Math.floor(Math.random() * 60)
    wx.vibrateShort({ type: 'heavy' })
    sound.playKnock(info.skin.level)
    this.setData({
      stats,
      skin: info.skin,
      next: info.next,
      nextNeed: info.need,
      skinProgress: info.percent,
      skinLevels: this.buildSkinLevels(stats.meritTotal),
      knocking: true,
      combo,
      floats: this.data.floats.concat([{ id, x }]),
      waves: this.data.waves.concat([{ id }])
    })
    clearTimeout(this._comboTimer)
    this._comboTimer = setTimeout(() => this.setData({ combo: 0 }), 900)
    setTimeout(() => this.setData({ knocking: false }), 160)
    setTimeout(() => {
      this.setData({ waves: this.data.waves.filter(w => w.id !== id) })
    }, 520)
    setTimeout(() => {
      this.setData({ floats: this.data.floats.filter(f => f.id !== id) })
    }, 950)
  }
})
