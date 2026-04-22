// config.js
module.exports = {
  bot: {
    name: 'Thres // Essential',
    version: '1.0.0',
    color: '#5865F2', // Discord Blurple
    successColor: '#57F287', // Green
    errorColor: '#ED4245', // Red
    warnColor: '#FEE75C', // Yellow
    infoColor: '#5865F2', // Blue
  },
  emojis: {
    success: '✅',
    error: '❌',
    warn: '⚠️',
    info: 'ℹ️',
    ban: '🔨',
    kick: '👢',
    mute: '🔇',
    unmute: '🔊',
    trash: '🗑️',
    ping: '🏓',
    shield: '🛡️',
    user: '👤',
    server: '🏠',
    clock: '⏰',
  },
  moderation: {
    maxWarnings: 5, // 达到此数量自动执行操作
    autoActionOnMaxWarns: 'kick', // 'kick' | 'ban' | 'mute'
    defaultMuteDuration: 10, // 分钟
    maxPurgeAmount: 100,
  },
  logs: {
    enabled: true,
    channelName: 'mod-logs', // 日志频道名称
  },
};