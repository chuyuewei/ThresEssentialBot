// src/events/guildMemberAdd.js
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const Logger = require('../utils/logger');
const { applyPrefixes } = require('../commands/utility/prefixconfig');
const { updateMemberCount } = require('../utils/memberCounter');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    Logger.info(`Member joined: ${member.user.tag} -> ${member.guild.name}`);

    // Auto apply prefixes
    await autoApplyPrefixes(member);

    // Update live member count
    await updateMemberCount(member.guild);

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

async function autoApplyPrefixes(member) {
  try {
    const guildConfig = config.prefixConfig?.[member.guild.id];
    if (!guildConfig || !guildConfig.enabled) return;

    const prefixes = guildConfig.prefixes || [];
    if (prefixes.length === 0) return;

    await applyPrefixes(member, prefixes);
    Logger.info(`Auto-applied prefixes to ${member.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to auto-apply prefixes to ${member.user.tag}: ${error.message}`);
  }
}