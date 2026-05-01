// src/events/guildMemberRemove.js
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const Logger = require('../utils/logger');
const { updateMemberCount } = require('../utils/memberCounter');

module.exports = {
  name: Events.GuildMemberRemove,
  once: false,
  async execute(member) {
    Logger.info(`Member left: ${member.user.tag} <- ${member.guild.name}`);

    // Update live member count
    await updateMemberCount(member.guild);

    if (!config.logs.enabled) return;

    const logChannel = member.guild.channels.cache.find(
      (ch) => ch.name === config.logs.channelName
    );
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(config.bot.errorColor)
      .setTitle('📤 Member Left')
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'User', value: `${member.user.tag}`, inline: true },
        { name: 'ID', value: member.id, inline: true },
        { name: 'Joined At', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
        { name: 'Current Members', value: `${member.guild.memberCount}`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    logChannel.send({ embeds: [embed] }).catch(() => {});
  },
};