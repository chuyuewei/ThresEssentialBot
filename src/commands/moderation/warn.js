// src/commands/moderation/warn.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn user')
    .addUserOption((option) =>
      option
        .setName('target')
        .setDescription('User to warn')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Warning reason')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');
    const moderator = interaction.user;

    try {
      // Create warning record
      const warning = await db.Warnings.create({
        user_id: target.id,
        guild_id: interaction.guild.id,
        moderator_id: moderator.id,
        reason: reason,
        type: 'warning',
        is_active: true,
      });

      // Update user warning count
      const user = await db.Users.findOne({
        where: { user_id: target.id, guild_id: interaction.guild.id },
      });

      if (user) {
        await user.update({ warning_count: user.warning_count + 1 });
      } else {
        await db.Users.create({
          user_id: target.id,
          guild_id: interaction.guild.id,
          username: target.username,
          warning_count: 1,
        });
      }

      // Send warning notification
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      if (member) {
        const warnEmbed = new EmbedBuilder()
          .setColor(config.bot.warnColor)
          .setTitle('⚠️ You Received a Warning')
          .setDescription(`You received a warning in ${interaction.guild.name}`)
          .addFields(
            { name: 'Reason', value: reason, inline: false },
            { name: 'Warning ID', value: warning.id.toString(), inline: true },
            { name: 'Moderator', value: moderator.tag, inline: true },
          )
          .setTimestamp()
          .setFooter({ text: config.bot.name });

        await member.send({ embeds: [warnEmbed] }).catch(() => {});
      }

      // Reply to moderator
      const replyEmbed = new EmbedBuilder()
        .setColor(config.bot.successColor)
        .setTitle('✅ Warning Sent')
        .setDescription(`Warning has been sent to ${target}`)
        .addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: 'Warning ID', value: warning.id.toString(), inline: true },
          { name: 'User', value: `${target} (${target.tag})`, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await interaction.reply({ embeds: [replyEmbed] });

      // Log to logs
      if (config.logs.enabled) {
        await logWarning(interaction, target, moderator, reason, warning.id);
      }

      Logger.info(`Warning sent to ${target.tag} by ${moderator.tag}: ${reason}`);
    } catch (error) {
      Logger.error(`Failed to warn user: ${error.message}`);
      await interaction.reply({
        content: 'Failed to send warning',
        ephemeral: true,
      });
    }
  },
};

async function logWarning(interaction, target, moderator, reason, warningId) {
  const logChannel = interaction.guild.channels.cache.find(
    (ch) => ch.name === config.logs.channelName
  );

  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(config.bot.warnColor)
    .setTitle('⚠️ User Warning')
    .addFields(
      { name: 'User', value: `${target} (${target.tag})`, inline: true },
      { name: 'Moderator', value: `${moderator} (${moderator.tag})`, inline: true },
      { name: 'Warning ID', value: warningId.toString(), inline: true },
      { name: 'Reason', value: reason, inline: false },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}