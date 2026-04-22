// src/events/guildMemberAdd.js
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const Logger = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    Logger.info(`Member joined: ${member.user.tag} -> ${member.guild.name}`);

    // Try to send to log channel
    if (!config.logs.enabled) return;

    const logChannel = member.guild.channels.cache.find(
      (ch) => ch.name === config.logs.channelName
    );
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('📥 Member Joined')
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'User', value: `${member} (${member.user.tag})`, inline: true },
        { name: 'ID', value: member.id, inline: true },
        { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Current Members', value: `${member.guild.memberCount}`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};