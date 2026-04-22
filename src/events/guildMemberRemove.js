// src/events/guildMemberRemove.js
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const Logger = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberRemove,
  once: false,
  async execute(member) {
    Logger.info(`成员离开: ${member.user.tag} <- ${member.guild.name}`);

    if (!config.logs.enabled) return;

    const logChannel = member.guild.channels.cache.find(
      (ch) => ch.name === config.logs.channelName
    );
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(config.bot.errorColor)
      .setTitle('📤 成员离开')
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '用户', value: `${member.user.tag}`, inline: true },
        { name: 'ID', value: member.id, inline: true },
        { name: '加入时间', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : '未知', inline: true },
        { name: '当前成员数', value: `${member.guild.memberCount}`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};