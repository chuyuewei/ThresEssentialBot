// src/commands/moderation/slowmode.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription(`${config.emojis.clock} 设置频道慢速模式`)
    .addIntegerOption((opt) =>
      opt
        .setName('秒数')
        .setDescription('慢速模式间隔（秒），0 = 关闭')
        .setMinValue(0)
        .setMaxValue(21600) // 6 小时
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('秒数');
    await interaction.channel.setRateLimitPerUser(seconds);

    if (seconds === 0) {
      return interaction.reply({
        embeds: [EmbedFactory.success('慢速模式已关闭', `#${interaction.channel.name} 的慢速模式已关闭。`)],
      });
    }

    return interaction.reply({
      embeds: [
        EmbedFactory.success(
          '慢速模式已设置',
          `#${interaction.channel.name} 的慢速模式已设置为 **${seconds} 秒**。`
        ),
      ],
    });
  },
};