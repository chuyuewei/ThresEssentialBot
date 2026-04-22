// src/events/ready.js
const { Events, ActivityType } = require('discord.js');
const Logger = require('../utils/logger');
const config = require('../../config');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    Logger.success(`${config.bot.name} is online!`);
    Logger.info(`Logged in as: ${client.user.tag}`);
    Logger.info(`Server count: ${client.guilds.cache.size}`);
    Logger.info(`User count: ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`);

    // Set status
    client.user.setPresence({
      activities: [
        {
          name: '🛡️ Protecting the server',
          type: ActivityType.Watching,
        },
      ],
      status: 'online',
    });

    // Rotate status every 30 seconds
    const statuses = [
      { name: '🛡️ Protecting the server', type: ActivityType.Watching },
      { name: `📊 ${client.guilds.cache.size} servers`, type: ActivityType.Watching },
      { name: '⚡ /help for help', type: ActivityType.Playing },
      { name: `👥 ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} users`, type: ActivityType.Watching },
    ];

    let i = 0;
    setInterval(() => {
      client.user.setActivity(statuses[i]);
      i = (i + 1) % statuses.length;
    }, 30000);
  },
};