Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '木鱼', icon: '🐟' },
      { pagePath: '/pages/bubble/bubble', text: '捏泡', icon: '💥' },
      { pagePath: '/pages/whack/whack', text: '锤烦恼', icon: '🔨' },
      { pagePath: '/pages/fortune/fortune', text: '求签', icon: '🏮' },
      { pagePath: '/pages/mine/mine', text: '我的', icon: '👤' }
    ]
  },

  methods: {
    switchTab(e) {
      wx.switchTab({ url: e.currentTarget.dataset.path })
    }
  }
})
