// src/events/guildMemberAdd.js
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const Logger = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    Logger.info(`新成员加入: ${member.user.tag} -> ${member.guild.name}`);

    // 尝试发送到日志频道
    if (!config.logs.enabled) return;

    const logChannel = member.guild.channels.cache.find(
      (ch) => ch.name === config.logs.channelName
    );
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('📥 成员加入')
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '用户', value: `${member} (${member.user.tag})`, inline: true },
        { name: 'ID', value: member.id, inline: true },
        { name: '账号创建时间', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '当前成员数', value: `${member.guild.memberCount}`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};