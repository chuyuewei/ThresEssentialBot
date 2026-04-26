// src/commands/moderation/kick.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick user')
    .addUserOption((option) =>
      option
        .setName('target')
        .setDescription('User to kick')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Kick reason')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const moderator = interaction.user;

    try {
      const member = await interaction.guild.members.fetch(target.id);

      // Check permissions
      if (!member.kickable) {
        await interaction.reply({
          content: 'Cannot kick this user (insufficient permissions)',
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
        type: 'kick',
        is_active: true,
      });

      // Send notification
      const kickEmbed = new EmbedBuilder()
        .setColor(config.bot.errorColor)
        .setTitle('👢 You Have Been Kicked')
        .setDescription(`You have been kicked from ${interaction.guild.name}`)
        .addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: 'Moderator', value: moderator.tag, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await member.send({ embeds: [kickEmbed] }).catch(() => {});

      // Execute kick
      await member.kick(reason);

      // Reply to moderator
      const replyEmbed = new EmbedBuilder()
        .setColor(config.bot.successColor)
        .setTitle('✅ User Kicked')
        .setDescription(`${target} has been kicked from the server`)
        .addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: 'User', value: `${target} (${target.tag})`, inline: true },
          { name: 'Moderator', value: moderator.tag, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await interaction.reply({ embeds: [replyEmbed] });

      // Log to logs
      if (config.logs.enabled) {
        await logKick(interaction, target, moderator, reason);
      }

      Logger.info(`Kicked ${target.tag} by ${moderator.tag}: ${reason}`);
    } catch (error) {
      Logger.error(`Failed to kick user: ${error.message}`);
      await interaction.reply({
        content: 'Failed to kick user',
        ephemeral: true,
      });
    }
  },
};

async function logKick(interaction, target, moderator, reason) {
  const logChannel = interaction.guild.channels.cache.find(
    (ch) => ch.name === config.logs.channelName
  );

  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(config.bot.errorColor)
    .setTitle('👢 User Kick')
    .addFields(
      { name: 'User', value: `${target} (${target.tag})`, inline: true },
      { name: 'Moderator', value: `${moderator} (${moderator.tag})`, inline: true },
      { name: 'Reason', value: reason, inline: false },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}
