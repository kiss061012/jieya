const storage = require('../../utils/storage.js')
const sound = require('../../utils/sound.js')

Page({
  data: {
    state: 'idle', // idle | shaking | result
    fortune: null,
    history: [],
    stats: {},
    drawnToday: false
  },

  onShow() {
    this.syncTabBar()
    this.setData({ history: this.buildHistory(), stats: storage.getStats() })
    const drawnToday = !storage.canDrawToday()
    if (drawnToday) {
      const first = this.buildHistory()[0]
      this.setData({ drawnToday: true, state: 'result', fortune: first || null })
    } else {
      this.setData({ drawnToday: false, state: 'idle' })
    }
    this.startShakeWatch()
  },

  onHide() {
    this.stopShakeWatch()
  },

  onUnload() {
    this.stopShakeWatch()
  },

  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  buildHistory() {
    return storage.getDrawHistory().map(h => ({
      ...h,
      num: h.num || '—',
      gua: h.gua || '—',
      timeText: storage.fmtTime(h.time)
    }))
  },

  startShakeWatch() {
    if (this._watching) return
    this._watching = true
    this._lastShake = 0
    wx.startAccelerometer({
      interval: 'ui',
      fail: () => { this._watching = false }
    })
    wx.onAccelerometerChange(res => {
      if (this.data.drawnToday || this.data.state !== 'idle') return
      const now = Date.now()
      if (now - this._lastShake < 2000) return
      if (Math.abs(res.x) + Math.abs(res.y) + Math.abs(res.z) > 3.2) {
        this._lastShake = now
        this.draw()
      }
    })
  },

  stopShakeWatch() {
    if (!this._watching) return
    this._watching = false
    wx.stopAccelerometer({ fail: () => {} })
    if (wx.offAccelerometerChange) wx.offAccelerometerChange()
  },

  draw() {
    if (this.data.state !== 'idle') return
    if (!storage.canDrawToday()) {
      wx.showToast({ title: '今日已求过签，明日再来', icon: 'none' })
      return
    }
    this.setData({ state: 'shaking' })
    sound.play('rattle')
    setTimeout(() => {
      this.setData({ state: 'falling' })
      wx.vibrateShort({ type: 'light' })
      setTimeout(() => {
        wx.vibrateShort({ type: 'medium' })
        sound.play('land')
      }, 550)
    }, 900)
    setTimeout(() => {
      const fortune = storage.getRandomFortune()
      storage.addDraw(fortune)
      sound.play('egg')
      this.setData({
        state: 'result',
        fortune,
        drawnToday: true,
        history: this.buildHistory(),
        stats: storage.getStats()
      })
    }, 1900)
  }
})
