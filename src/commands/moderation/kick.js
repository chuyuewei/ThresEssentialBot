// src/commands/moderation/kick.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription(`${config.emojis.kick} Kick a user`)
    .addUserOption((opt) => opt.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Kick reason').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Action Failed', 'This user is not in this server.')],
        ephemeral: true,
      });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Action Failed', 'You cannot kick yourself!')],
        ephemeral: true,
      });
    }

    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Permission Denied', 'You cannot kick a user with a role equal to or higher than yours.')],
        ephemeral: true,
      });
    }

    if (!member.kickable) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Action Failed', 'I cannot kick this user. Please check my role permissions.')],
        ephemeral: true,
      });
    }

    // DM notification
    try {
      await target.send({
        embeds: [
          EmbedFactory.warn(
            'You have been kicked',
            `You have been kicked from **${interaction.guild.name}**.\n**Reason:** ${reason}`
          ),
        ],
      });
    } catch {}

    await member.kick(`${interaction.user.tag}: ${reason}`);

    const embed = EmbedFactory.success('User Kicked', `**${target.tag}** has been successfully kicked.`);
    embed.addFields(
      { name: '📝 Reason', value: reason, inline: true },
      { name: '🛡️ Moderator', value: `${interaction.user}`, inline: true }
    );

    await interaction.reply({ embeds: [embed] });

    // Log
    const logCh = interaction.guild.channels.cache.find((c) => c.name === config.logs.channelName);
    if (logCh) {
      logCh.send({
        embeds: [EmbedFactory.modLog({ action: 'Kick', moderator: interaction.user, target, reason })],
      }).catch(() => {});
    }
  },
};