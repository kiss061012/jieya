const KEY = 'relax.soundOn'
const BASE = '/sounds/'

const VOLUMES = {
  knock1: 0.85,
  knock2: 0.85,
  knock3: 0.9,
  knock4: 0.9,
  knock5: 0.95,
  pop: 0.6,
  egg: 0.8,
  rattle: 0.7,
  land: 0.8,
  win: 0.9,
  whack: 0.85
}

let soundOn = wx.getStorageSync(KEY) !== false

function isSoundOn() {
  return soundOn
}

function setSoundOn(on) {
  soundOn = !!on
  wx.setStorageSync(KEY, soundOn)
}

const cache = {}

function play(name) {
  if (!soundOn || !VOLUMES[name]) return
  let ctx = cache[name]
  if (!ctx) {
    ctx = wx.createInnerAudioContext()
    ctx.src = BASE + name + '.wav'
    ctx.volume = VOLUMES[name]
    cache[name] = ctx
  }
  ctx.stop()
  ctx.play()
}

// 木鱼敲击声随形态等级 1-5 进化
function playKnock(level) {
  const lv = Math.min(5, Math.max(1, level || 1))
  play('knock' + lv)
}

module.exports = { play, playKnock, isSoundOn, setSoundOn }
