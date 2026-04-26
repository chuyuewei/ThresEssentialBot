// src/commands/moderation/ban.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban user')
    .addUserOption((option) =>
      option
        .setName('target')
        .setDescription('User to ban')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Ban reason')
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('delete_days')
        .setDescription('Delete user messages from past X days (0-7)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(7)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;
    const moderator = interaction.user;

    try {
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);

      // Check permissions
      if (member && !member.bannable) {
        await interaction.reply({
          content: 'Cannot ban this user (insufficient permissions)',
          ephemeral: true,
        });
        return;
      }

      // Create warning record
      await db.Warnings.create({
        user_id: target.id,
        guild_id: interaction.guild.id,
        moderator_id: moderator.id,
        reason: reason,
        type: 'ban',
        is_active: true,
      });

      // Send notification
      const banEmbed = new EmbedBuilder()
        .setColor(config.bot.errorColor)
        .setTitle('🔨 You Have Been Banned')
        .setDescription(`You have been banned from ${interaction.guild.name}`)
        .addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: 'Moderator', value: moderator.tag, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      if (member) {
        await member.send({ embeds: [banEmbed] }).catch(() => {});
      }

      // Execute ban
      await interaction.guild.bans.create(target.id, {
        reason: reason,
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
      });

      // Reply to moderator
      const replyEmbed = new EmbedBuilder()
        .setColor(config.bot.successColor)
        .setTitle('✅ User Banned')
        .setDescription(`${target} has been banned`)
        .addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: 'User', value: `${target} (${target.tag})`, inline: true },
          { name: 'Delete Message Days', value: deleteDays.toString(), inline: true },
          { name: 'Moderator', value: moderator.tag, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await interaction.reply({ embeds: [replyEmbed] });

      // Log to logs
      if (config.logs.enabled) {
        await logBan(interaction, target, moderator, reason, deleteDays);
      }

      Logger.info(`Banned ${target.tag} by ${moderator.tag}: ${reason}`);
    } catch (error) {
      Logger.error(`Failed to ban user: ${error.message}`);
      await interaction.reply({
        content: 'Failed to ban user',
        ephemeral: true,
      });
    }
  },
};

async function logBan(interaction, target, moderator, reason, deleteDays) {
  const logChannel = interaction.guild.channels.cache.find(
    (ch) => ch.name === config.logs.channelName
  );

  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(config.bot.errorColor)
    .setTitle('🔨 User Ban')
    .addFields(
      { name: 'User', value: `${target} (${target.tag})`, inline: true },
      { name: 'Moderator', value: `${moderator} (${moderator.tag})`, inline: true },
      { name: 'Delete Message Days', value: deleteDays.toString(), inline: true },
      { name: 'Reason', value: reason, inline: false },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}
