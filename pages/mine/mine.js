const storage = require('../../utils/storage.js')
const sound = require('../../utils/sound.js')

Page({
  data: {
    stats: {},
    level: {},
    history: [],
    hasData: false,
    soundOn: true,
    achievements: [],
    achUnlocked: 0,
    achTotal: 0,
    celebrate: []
  },

  onShow() {
    this.syncTabBar()
    this.refresh()
    this.checkCelebrate()
  },

  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 })
    }
  },

  refresh() {
    const stats = storage.getStats()
    const history = storage.getDrawHistory()
      .slice(0, 10)
      .map(h => ({ ...h, timeText: storage.fmtTime(h.time) }))
    const hasData = stats.meritTotal + stats.bubblesTotal + stats.drawsTotal + (stats.whackTotal || 0) > 0
    const achievements = storage.getAchievements(stats)
    this.setData({
      stats,
      level: storage.getLevel(stats),
      history,
      hasData,
      soundOn: sound.isSoundOn(),
      achievements,
      achUnlocked: achievements.filter(a => a.unlocked).length,
      achTotal: achievements.length,
      celebrate: []
    })
  },

  checkCelebrate() {
    const fresh = storage.getNewUnlocks(this.data.stats)
    if (!fresh.length) return
    sound.play('egg')
    const ids = fresh.map(a => a.id)
    this.setData({
      celebrate: fresh,
      achievements: this.data.achievements.map(a => (ids.indexOf(a.id) !== -1 ? { ...a, isNew: true } : a))
    })
  },

  closeCelebrate() {
    storage.markAchievementsSeen(this.data.celebrate.map(a => a.id))
    this.setData({ celebrate: [] })
  },

  onSoundChange(e) {
    sound.setSoundOn(e.detail.value)
    this.setData({ soundOn: e.detail.value })
  },

  goFortune() {
    wx.switchTab({ url: '/pages/fortune/fortune' })
  },

  onReset() {
    if (!this.data.hasData) {
      wx.showToast({ title: '暂无数据可重置', icon: 'none' })
      return
    }
    wx.showModal({
      title: '重置数据',
      content: '将清空功德、捏泡和求签记录，确定吗？',
      confirmText: '重置',
      confirmColor: '#6C5CE7',
      success: res => {
        if (res.confirm) {
          storage.clearAll()
          this.refresh()
          wx.showToast({ title: '已重置', icon: 'success' })
        }
      }
    })
  }
})
