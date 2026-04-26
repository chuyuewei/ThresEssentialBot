// src/commands/moderation/mute.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute user')
    .addUserOption((option) =>
      option
        .setName('target')
        .setDescription('User to mute')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('duration')
        .setDescription('Mute duration (minutes)')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Mute reason')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const moderator = interaction.user;

    try {
      const member = await interaction.guild.members.fetch(target.id);

      // Check permissions
      if (!member.moderatable) {
        await interaction.reply({
          content: 'Cannot mute this user (insufficient permissions)',
          ephemeral: true,
        });
        return;
      }

      // Execute mute
      const muteDuration = duration * 60 * 1000;
      const muteUntil = new Date(Date.now() + muteDuration);

      await member.timeout(muteDuration, reason);

      // Create warning record
      await db.Warnings.create({
        user_id: target.id,
        guild_id: interaction.guild.id,
        moderator_id: moderator.id,
        reason: reason,
        type: 'mute',
        duration: duration,
        is_active: true,
      });

      // Update user status
      const user = await db.Users.findOne({
        where: { user_id: target.id, guild_id: interaction.guild.id },
      });

      if (user) {
        await user.update({
          is_muted: true,
          mute_until: muteUntil,
          warning_count: user.warning_count + 1,
        });
      } else {
        await db.Users.create({
          user_id: target.id,
          guild_id: interaction.guild.id,
          username: target.username,
          is_muted: true,
          mute_until: muteUntil,
          warning_count: 1,
        });
      }

      // Send notification
      const muteEmbed = new EmbedBuilder()
        .setColor(config.bot.warnColor)
        .setTitle('🔇 You Have Been Muted')
        .setDescription(`You have been muted in ${interaction.guild.name}`)
        .addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: 'Duration', value: `${duration} minutes`, inline: true },
          { name: 'Moderator', value: moderator.tag, inline: true },
          { name: 'Unmute Time', value: `<t:${Math.floor(muteUntil.getTime() / 1000)}:F>`, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await member.send({ embeds: [muteEmbed] }).catch(() => {});

      // Reply to moderator
      const replyEmbed = new EmbedBuilder()
        .setColor(config.bot.successColor)
        .setTitle('✅ User Muted')
        .setDescription(`${target} has been muted for ${duration} minutes`)
        .addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: 'User', value: `${target} (${target.tag})`, inline: true },
          { name: 'Unmute Time', value: `<t:${Math.floor(muteUntil.getTime() / 1000)}:F>`, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await interaction.reply({ embeds: [replyEmbed] });

      // Log to logs
      if (config.logs.enabled) {
        await logMute(interaction, target, moderator, reason, duration, muteUntil);
      }

      Logger.info(`Muted ${target.tag} for ${duration} minutes by ${moderator.tag}: ${reason}`);
    } catch (error) {
      Logger.error(`Failed to mute user: ${error.message}`);
      await interaction.reply({
        content: 'Failed to mute user',
        ephemeral: true,
      });
    }
  },
};

async function logMute(interaction, target, moderator, reason, duration, muteUntil) {
  const logChannel = interaction.guild.channels.cache.find(
    (ch) => ch.name === config.logs.channelName
  );

  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(config.bot.warnColor)
    .setTitle('🔇 User Mute')
    .addFields(
      { name: 'User', value: `${target} (${target.tag})`, inline: true },
      { name: 'Moderator', value: `${moderator} (${moderator.tag})`, inline: true },
      { name: 'Duration', value: `${duration} minutes`, inline: true },
      { name: 'Unmute Time', value: `<t:${Math.floor(muteUntil.getTime() / 1000)}:F>`, inline: true },
      { name: 'Reason', value: reason, inline: false },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}