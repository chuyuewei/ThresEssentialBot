// src/commands/utility/membercount.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const { updateMemberCount } = require('../../utils/memberCounter');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('membercount')
    .setDescription('Manage live member-count display channel')
    .addSubcommand(sub =>
      sub
        .setName('setup')
        .setDescription('Set the channel that displays live member count')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Voice channel to rename with member count')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildVoice)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('disable')
        .setDescription('Disable the member-count display')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel');
      if (!config.memberCount) config.memberCount = {};
      config.memberCount.channelId = channel.id;

      // immediately update
      await updateMemberCount(interaction.guild);

      const embed = new EmbedBuilder()
        .setColor(config.bot.successColor)
        .setTitle('✅ Member Count Channel Set')
        .setDescription(`Live member count will display in ${channel}`)
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await interaction.reply({ embeds: [embed] });
      Logger.info(`Member-count channel set to #${channel.name} by ${interaction.user.tag}`);
    }

    if (sub === 'disable') {
      if (config.memberCount) config.memberCount.channelId = null;
      const embed = new EmbedBuilder()
        .setColor(config.bot.warnColor)
        .setTitle('⚠️ Member Count Disabled')
        .setTimestamp()
        .setFooter({ text: config.bot.name });
      await interaction.reply({ embeds: [embed] });
    }
  },
};