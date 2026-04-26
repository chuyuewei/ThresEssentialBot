// src/events/messageDelete.js
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const Logger = require('../utils/logger');

module.exports = {
  name: Events.MessageDelete,
  once: false,
  async execute(message) {
    // 忽略机器人消息
    if (message.author?.bot) return;

    // 忽略私信
    if (!message.guild) return;

    // 记录到日志
    if (config.logs.enabled) {
      await logMessageDelete(message);
    }

    Logger.info(`Message deleted by ${message.author?.tag || 'Unknown'} in ${message.guild.name}`);
  },
};

async function logMessageDelete(message) {
  const logChannel = message.guild.channels.cache.find(
    (ch) => ch.name === config.logs.channelName
  );

  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(config.bot.errorColor)
.setTitle('🗑️ Message Deleted')
      { name: 'User', value: message.author ? `${message.author} (${message.author.tag})` : 'Unknown', inline: true },
      { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
      { name: 'Message ID', value: message.id, inline: true },
      name: 'Deleted Content',
      name: 'Attachments',
      value: attachments.substring(0, 1000),
      inline: false,
    });
  }

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}
