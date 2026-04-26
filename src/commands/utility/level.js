// src/commands/utility/level.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const { getUserLevelInfo, getLevelName } = require('../../utils/levelSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('View user level')
    .addUserOption((option) =>
      option
        .setName('target')
        .setDescription('User to view (defaults to yourself)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('target') || interaction.user;

    try {
      const levelInfo = await getUserLevelInfo(interaction.guild.id, target.id);

      if (!levelInfo) {
        const embed = new EmbedBuilder()
          .setColor(config.bot.infoColor)
          .setTitle('📊 Level Information')
          .setDescription(`${target} has no level record yet`)
          .setTimestamp()
          .setFooter({ text: config.bot.name });

        await interaction.reply({ embeds: [embed] });
        return;
      }

      // Get level name
      const levelName = await getLevelName(interaction.guild.id, levelInfo.level);

      // Create progress bar
      const progressBarLength = 20;
      const filledLength = Math.floor((levelInfo.progressPercent / 100) * progressBarLength);
      const progressBar = '█'.repeat(filledLength) + '░'.repeat(progressBarLength - filledLength);

      const embed = new EmbedBuilder()
        .setColor(config.bot.infoColor)
        .setTitle('📊 Level Information')
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: 'User', value: `${target} (${target.tag})`, inline: true },
          { name: 'Level', value: `${levelInfo.level} - ${levelName}`, inline: true },
          { name: 'XP', value: `${levelInfo.xp} XP`, inline: true },
          { name: 'Messages', value: levelInfo.messageCount.toString(), inline: true },
          { name: 'Next Level', value: `Need ${levelInfo.xpNeeded} XP`, inline: true },
          { name: 'Progress', value: `${progressBar} ${levelInfo.progressPercent}%`, inline: false },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      Logger.error(`Failed to get level info: ${error.message}`);
      await interaction.reply({
        content: 'Failed to get level information',
        ephemeral: true,
      });
    }
  },
};
