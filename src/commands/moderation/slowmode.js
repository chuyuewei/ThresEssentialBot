// src/commands/moderation/slowmode.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription(`${config.emojis.clock} Set channel slowmode`)
    .addIntegerOption((opt) =>
      opt
        .setName('seconds')
        .setDescription('Slowmode interval (seconds), 0 = off')
        .setMinValue(0)
        .setMaxValue(21600) // 6 hours
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('seconds');
    await interaction.channel.setRateLimitPerUser(seconds);

    if (seconds === 0) {
      return interaction.reply({
        embeds: [EmbedFactory.success('Slowmode Disabled', `Slowmode for #${interaction.channel.name} has been disabled.`)],
      });
    }

    return interaction.reply({
      embeds: [
        EmbedFactory.success(
          'Slowmode Enabled',
          `Slowmode for #${interaction.channel.name} has been set to **${seconds} seconds**.`
        ),
      ],
    });
  },
};