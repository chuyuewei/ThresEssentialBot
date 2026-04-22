// src/commands/moderation/ban.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription(`${config.emojis.ban} Ban a user`)
    .addUserOption((opt) => opt.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Ban reason').setRequired(false))
    .addIntegerOption((opt) =>
      opt
        .setName('delete-message-days')
        .setDescription('Delete messages from the last N days (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete-message-days') || 0;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    // Check: cannot ban yourself
    if (target.id === interaction.user.id) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Action Failed', 'You cannot ban yourself!')],
        ephemeral: true,
      });
    }

    // Check: cannot ban the bot itself
    if (target.id === interaction.client.user.id) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Action Failed', 'I cannot ban myself!')],
        ephemeral: true,
      });
    }

    // Check: permission hierarchy
    if (member) {
      if (member.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({
          embeds: [EmbedFactory.error('Permission Denied', 'You cannot ban a user with a role equal to or higher than yours.')],
          ephemeral: true,
        });
      }
      if (!member.bannable) {
        return interaction.reply({
          embeds: [EmbedFactory.error('Action Failed', 'I cannot ban this user. Please check my role permissions.')],
          ephemeral: true,
        });
      }
    }

    // Try to DM the banned user
    try {
      await target.send({
        embeds: [
          EmbedFactory.error(
            `You have been banned`,
            `You have been banned from **${interaction.guild.name}**.\n**Reason:** ${reason}`
          ),
        ],
      });
    } catch {
      // Cannot DM, ignore
    }

    // Execute ban
    await interaction.guild.members.ban(target, {
      reason: `${interaction.user.tag}: ${reason}`,
      deleteMessageSeconds: deleteDays * 86400,
    });

    // Reply
    const embed = EmbedFactory.success(
      'User Banned',
      `**${target.tag}** has been successfully banned.`
    );
    embed.addFields(
      { name: '📝 Reason', value: reason, inline: true },
      { name: '🛡️ Moderator', value: `${interaction.user}`, inline: true },
    );
    await interaction.reply({ embeds: [embed] });

    // Log
    await sendModLog(interaction, 'Ban', target, reason);
  },
};

async function sendModLog(interaction, action, target, reason) {
  const logChannel = interaction.guild.channels.cache.find(
    (ch) => ch.name === config.logs.channelName
  );
  if (!logChannel) return;

  const logEmbed = EmbedFactory.modLog({
    action,
    moderator: interaction.user,
    target,
    reason,
  });

  logChannel.send({ embeds: [logEmbed] }).catch(() => {});
}