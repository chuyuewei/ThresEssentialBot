// src/commands/moderation/warnings.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const WarnManager = require('../../utils/warnManager');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription(`${config.emojis.warn} View/manage user warnings`)
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('View all warnings for a user')
        .addUserOption((opt) => opt.setName('user').setDescription('Target user').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('clear')
        .setDescription('Clear all warnings for a user')
        .addUserOption((opt) => opt.setName('user').setDescription('Target user').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove a specific warning')
        .addUserOption((opt) => opt.setName('user').setDescription('Target user').setRequired(true))
        .addIntegerOption((opt) => opt.setName('warn-id').setDescription('Warning ID').setRequired(true).setMinValue(1))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user');

    if (sub === 'list') {
      const warnings = WarnManager.getWarnings(interaction.guild.id, target.id);

      if (warnings.length === 0) {
        return interaction.reply({
          embeds: [EmbedFactory.info('Warning Records', `**${target.tag}** has no warning records.`)],
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(config.bot.warnColor)
        .setTitle(`⚠️ Warning Records for ${target.tag}`)
        .setThumbnail(target.displayAvatarURL({ size: 128 }))
        .setDescription(`Total **${warnings.length}** warnings`)
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      for (const w of warnings) {
        embed.addFields({
          name: `#${w.id} — ${new Date(w.timestamp).toLocaleDateString()}`,
          value: `**Reason:** ${w.reason}\n**Moderator:** <@${w.moderatorId}>`,
          inline: false,
        });
      }

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'clear') {
      const count = WarnManager.clearWarnings(interaction.guild.id, target.id);
      return interaction.reply({
        embeds: [
          EmbedFactory.success('Warnings Cleared', `Cleared **${count}** warnings for **${target.tag}**.`),
        ],
      });
    }

    if (sub === 'remove') {
      const warnId = interaction.options.getInteger('warn-id');
      const success = WarnManager.removeWarning(interaction.guild.id, target.id, warnId);

      if (!success) {
        return interaction.reply({
          embeds: [EmbedFactory.error('Action Failed', `Warning **#${warnId}** not found.`)],
          ephemeral: true,
        });
      }

      return interaction.reply({
        embeds: [
          EmbedFactory.success('Warning Removed', `Removed warning **#${warnId}** for **${target.tag}**.`),
        ],
      });
    }
  },
};