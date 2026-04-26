// src/commands/utility/rank.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const { getUserLevelInfo, getUserRank, getLevelName } = require('../../utils/levelSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View user rank card')
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
          .setTitle('🎯 Rank Card')
          .setDescription(`${target} has no rank record yet`)
          .setTimestamp()
          .setFooter({ text: config.bot.name });

        await interaction.reply({ embeds: [embed] });
        return;
      }

      // Get user rank
      const rank = await getUserRank(interaction.guild.id, target.id);

      // Get level name
      const levelName = await getLevelName(interaction.guild.id, levelInfo.level);

      // Create progress bar
      const progressBarLength = 20;
      const filledLength = Math.floor((levelInfo.progressPercent / 100) * progressBarLength);
      const progressBar = '█'.repeat(filledLength) + '░'.repeat(progressBarLength - filledLength);

      // Create beautiful rank card
      const embed = new EmbedBuilder()
        .setColor(config.bot.infoColor)
        .setTitle('🎯 Rank Card')
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .setDescription(`**${target.tag}**'s rank information`)
        .addFields(
          {
            name: '📊 Level',
            value: `**${levelInfo.level}** - ${levelName}`,
            inline: true,
          },
          {
            name: '🏆 Rank',
            value: `#${rank}`,
            inline: true,
          },
          {
            name: '✨ XP',
            value: `${levelInfo.xp} XP`,
            inline: true,
          },
          {
            name: '💬 Messages',
            value: levelInfo.messageCount.toString(),
            inline: true,
          },
          {
            name: '📈 Progress',
            value: `${progressBar} ${levelInfo.progressPercent}%`,
            inline: false,
          },
          {
            name: '📝 Next Level',
            value: `Need ${levelInfo.xpNeeded} XP`,
            inline: true,
          },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      Logger.error(`Failed to get rank: ${error.message}`);
      await interaction.reply({
        content: 'Failed to get rank card',
        ephemeral: true,
      });
    }
  },
};
