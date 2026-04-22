// src/commands/moderation/mute.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription(`${config.emojis.mute} Mute a user (Timeout)`)
    .addUserOption((opt) => opt.setName('user').setDescription('User to mute').setRequired(true))
    .addIntegerOption((opt) =>
      opt
        .setName('duration')
        .setDescription('Mute duration (minutes)')
        .setMinValue(1)
        .setMaxValue(40320) // 28 days
        .setRequired(false)
    )
    .addStringOption((opt) => opt.setName('reason').setDescription('Mute reason').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const duration = interaction.options.getInteger('duration') || config.moderation.defaultMuteDuration;
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
        embeds: [EmbedFactory.error('Action Failed', 'You cannot mute yourself!')],
        ephemeral: true,
      });
    }

    if (!member.moderatable) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Action Failed', 'I cannot mute this user.')],
        ephemeral: true,
      });
    }

    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Permission Denied', 'You cannot mute a user with a role equal to or higher than yours.')],
        ephemeral: true,
      });
    }

    const durationMs = duration * 60 * 1000;
    await member.timeout(durationMs, `${interaction.user.tag}: ${reason}`);

    const embed = EmbedFactory.success(
      'User Muted',
      `**${target.tag}** has been muted for **${duration} minutes**.`
    );
    embed.addFields(
      { name: '📝 Reason', value: reason, inline: true },
      { name: '⏰ Duration', value: `${duration} minutes`, inline: true },
      { name: '🛡️ Moderator', value: `${interaction.user}`, inline: true }
    );

    await interaction.reply({ embeds: [embed] });

    // DM
    try {
      await target.send({
        embeds: [
          EmbedFactory.warn(
            'You have been muted',
            `You have been muted in **${interaction.guild.name}** for **${duration} minutes**.\n**Reason:** ${reason}`
          ),
        ],
      });
    } catch {}

    // Log
    const logCh = interaction.guild.channels.cache.find((c) => c.name === config.logs.channelName);
    if (logCh) {
      logCh.send({
        embeds: [
          EmbedFactory.modLog({
            action: 'Mute',
            moderator: interaction.user,
            target,
            reason,
            extra: { '⏰ Duration': `${duration} minutes` },
          }),
        ],
      }).catch(() => {});
    }
  },
};