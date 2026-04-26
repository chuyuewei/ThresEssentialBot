// src/commands/moderation/unmute.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute user')
    .addUserOption((option) =>
      option
        .setName('target')
        .setDescription('User to unmute')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Unmute reason')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'Manual unmute';
    const moderator = interaction.user;

    try {
      const member = await interaction.guild.members.fetch(target.id);

      // Check permissions
      if (!member.moderatable) {
        await interaction.reply({
          content: 'Cannot unmute this user (insufficient permissions)',
          ephemeral: true,
        });
        return;
      }

      // Execute unmute
      await member.timeout(null, reason);

      // Update user status
      const user = await db.Users.findOne({
        where: { user_id: target.id, guild_id: interaction.guild.id },
      });

      if (user) {
        await user.update({
          is_muted: false,
          mute_until: null,
        });
      }

      // Send notification
      const unmuteEmbed = new EmbedBuilder()
        .setColor(config.bot.successColor)
        .setTitle('🔊 You Have Been Unmuted')
        .setDescription(`You have been unmuted in ${interaction.guild.name}`)
        .addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: 'Moderator', value: moderator.tag, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await member.send({ embeds: [unmuteEmbed] }).catch(() => {});

      // Reply to moderator
      const replyEmbed = new EmbedBuilder()
        .setColor(config.bot.successColor)
        .setTitle('✅ User Unmuted')
        .setDescription(`${target} has been unmuted`)
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
        await logUnmute(interaction, target, moderator, reason);
      }

      Logger.info(`Unmuted ${target.tag} by ${moderator.tag}: ${reason}`);
    } catch (error) {
      Logger.error(`Failed to unmute user: ${error.message}`);
      await interaction.reply({
        content: 'Failed to unmute user',
        ephemeral: true,
      });
    }
  },
};

async function logUnmute(interaction, target, moderator, reason) {
  const logChannel = interaction.guild.channels.cache.find(
    (ch) => ch.name === config.logs.channelName
  );

  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('🔊 User Unmute')
    .addFields(
      { name: 'User', value: `${target} (${target.tag})`, inline: true },
      { name: 'Moderator', value: `${moderator} (${moderator.tag})`, inline: true },
      { name: 'Reason', value: reason, inline: false },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}