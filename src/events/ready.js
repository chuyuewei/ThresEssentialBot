// src/events/ready.js
const { Events, ActivityType } = require('discord.js');
const Logger = require('../utils/logger');
const config = require('../../config');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    Logger.success(`${config.bot.name} 已上线！`);
    Logger.info(`登录为: ${client.user.tag}`);
    Logger.info(`服务器数量: ${client.guilds.cache.size}`);
    Logger.info(`用户数量: ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`);

    // 设置状态
    client.user.setPresence({
      activities: [
        {
          name: '🛡️ 守护服务器安全',
          type: ActivityType.Watching,
        },
      ],
      status: 'online',
    });

    // 每 30 秒轮换状态
    const statuses = [
      { name: '🛡️ 守护服务器安全', type: ActivityType.Watching },
      { name: `📊 ${client.guilds.cache.size} 个服务器`, type: ActivityType.Watching },
      { name: '⚡ /help 获取帮助', type: ActivityType.Playing },
      { name: `👥 ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} 位用户`, type: ActivityType.Watching },
    ];

    let i = 0;
    setInterval(() => {
      client.user.setActivity(statuses[i]);
      i = (i + 1) % statuses.length;
    }, 30000);
  },
};