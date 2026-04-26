// src/events/messageUpdate.js
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const Logger = require('../utils/logger');

module.exports = {
  name: Events.MessageUpdate,
  once: false,
  async execute(oldMessage, newMessage) {
    // 忽略机器人消息
    if (oldMessage.author.bot) return;

    // 忽略私信
    if (!oldMessage.guild) return;

    // 如果内容没有变化，忽略
    if (oldMessage.content === newMessage.content) return;

    // 记录到日志
    if (config.logs.enabled) {
      await logMessageEdit(oldMessage, newMessage);
    }

    Logger.info(`Message edited by ${oldMessage.author.tag} in ${oldMessage.guild.name}`);
  },
};

async function logMessageEdit(oldMessage, newMessage) {
  const logChannel = newMessage.guild.channels.cache.find(
    (ch) => ch.name === config.logs.channelName
  );

  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(config.bot.infoColor)
.setTitle('✏️ Message Edited')
      { name: 'User', value: `${newMessage.author} (${newMessage.author.tag})`, inline: true },
      { name: 'Channel', value: `<#${newMessage.channelId}>`, inline: true },
      { name: 'Message ID', value: newMessage.id, inline: true },
      name: 'Original Content',
      name: 'New Content',
      value: newMessage.content.substring(0, 1000),
      inline: false,
    });
  }

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}
