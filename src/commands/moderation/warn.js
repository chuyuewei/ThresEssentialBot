// src/commands/moderation/warn.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const WarnManager = require('../../utils/warnManager');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription(`${config.emojis.warn} Warn a user`)
    .addUserOption((opt) => opt.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Warn reason').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Action Failed', 'This user is not in this server.')],
        ephemeral: true,
      });
    }

    if (target.bot) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Action Failed', 'You cannot warn a Bot.')],
        ephemeral: true,
      });
    }

    // Add warning
    const { warnings, count } = WarnManager.addWarning(
      interaction.guild.id,
      target.id,
      reason,
      interaction.user.id
    );

    const embed = EmbedFactory.warn(
      'User Warned',
      `**${target.tag}** has received a warning.`
    );
    embed.addFields(
      { name: '📝 Reason', value: reason, inline: false },
      { name: '⚠️ Total Warnings', value: `${count} / ${config.moderation.maxWarnings}`, inline: true },
      { name: '🛡️ Moderator', value: `${interaction.user}`, inline: true }
    );

    await interaction.reply({ embeds: [embed] });

    // DM
    try {
      await target.send({
        embeds: [
          EmbedFactory.warn(
            'You received a warning',
            `You received a warning in **${interaction.guild.name}**.\n**Reason:** ${reason}\n**Current warnings:** ${count} / ${config.moderation.maxWarnings}`
          ),
        ],
      });
    } catch {}

    // Check if max warnings reached
    if (count >= config.moderation.maxWarnings) {
      const action = config.moderation.autoActionOnMaxWarns;
      let actionText = '';

      try {
        if (action === 'kick' && member.kickable) {
          await member.kick(`Max warnings reached (${count})`);
          actionText = 'kicked';
        } else if (action === 'ban' && member.bannable) {
          await interaction.guild.members.ban(target, {
            reason: `Max warnings reached (${count})`,
          });
          actionText = 'banned';
        } else if (action === 'mute' && member.moderatable) {
          await member.timeout(24 * 60 * 60 * 1000, `Max warnings reached (${count})`);
          actionText = 'muted for 24 hours';
        }

        if (actionText) {
          await interaction.followUp({
            embeds: [
              EmbedFactory.error(
                'Auto Punishment',
                `**${target.tag}** has reached the maximum warning limit (${config.moderation.maxWarnings}). **${actionText}** has been automatically executed.`
              ),
            ],
          });

          // Clear warnings
          WarnManager.clearWarnings(interaction.guild.id, target.id);
        }
      } catch {}
    }

    // Log
    const logCh = interaction.guild.channels.cache.find((c) => c.name === config.logs.channelName);
    if (logCh) {
      logCh.send({
        embeds: [
          EmbedFactory.modLog({
            action: 'Warn',
            moderator: interaction.user,
            target,
            reason,
            extra: { '⚠️ Total Warnings': `${count} / ${config.moderation.maxWarnings}` },
          }),
        ],
      }).catch(() => {});
    }
  },
};