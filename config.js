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
    maxWarnings: 5, // Auto action when reaching this count
    autoActionOnMaxWarns: 'kick', // 'kick' | 'ban' | 'mute'
    defaultMuteDuration: 10, // Minutes
    maxPurgeAmount: 100,
  },
  logs: {
    enabled: true,
    channelName: 'mod-logs', // Log channel name
  },
  welcome: {
    enabled: true,
    channelName: 'welcome', // Welcome channel name
    message: 'Welcome {user} to the server!\n\nCurrent members: {memberCount}\nAccount created: {accountAge}',
    dmMessage: 'Welcome to {server}!\n\nPlease read the rules channel and enjoy your stay in the community!', // DM to new member (set to null to disable)
  },
  antiSpam: {
    enabled: true,
    blockLinks: true,
    linkAction: 'delete', // 'delete', 'warn', 'mute', 'kick'
    blockInvites: true,
    inviteAction: 'delete', // 'delete', 'warn', 'mute', 'kick'
    blockSpam: true,
    spamAction: 'mute', // 'warn', 'mute', 'kick'
    blockExcessiveCaps: false,
    capsAction: 'warn', // 'warn', 'delete'
    blockExcessiveEmojis: false,
    emojiAction: 'warn', // 'warn', 'delete'
    blockedKeywords: [], // Array of blocked keywords
    keywordAction: 'delete', // 'delete', 'warn', 'mute'
    exemptRoles: [], // Roles exempt from anti-spam
    exemptChannels: [], // Channels exempt from anti-spam
    muteDuration: 10, // Minutes
    logChannel: 'mod-logs', // Channel to log spam detections
  },
  autoRoles: {
    enabled: true,
    rulesChannel: 'rules', // Channel with rules message
    rulesMessageId: null, // Message ID with rules button
    defaultRole: null, // Role to give after accepting rules
    roles: [
      // { trigger: 'level', level: 5, roleId: 'role_id' },
      // { trigger: 'reaction', emoji: '🎮', roleId: 'role_id' },
    ],
  },
  memberCount: {
    channelId: null, // Voice channel ID for live member count display
  },
  inviteChannel: null, // Channel ID where invites are auto-posted (set via /invite setup)
};