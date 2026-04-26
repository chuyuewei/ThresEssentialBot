// src/commands/utility/leaderboard.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');
const { getLevelName } = require('../../utils/levelSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View leaderboard')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Leaderboard type')
        .setRequired(true)
        .addChoices(
          { name: 'Level', value: 'level' },
          { name: 'XP', value: 'xp' },
          { name: 'Messages', value: 'messages' },
        )
    )
    .addIntegerOption((option) =>
      option
        .setName('limit')
        .setDescription('Number to display')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(20)
    ),

  async execute(interaction) {
    const type = interaction.options.getString('type');
    const limit = interaction.options.getInteger('limit') || 10;

    try {
      let users;
      let title;
      let fieldName;

      switch (type) {
        case 'level':
          users = await db.Users.findAll({
            where: { guild_id: interaction.guild.id },
            order: [['level', 'DESC'], ['xp', 'DESC']],
            limit: limit,
          });
          title = '🏆 Level Leaderboard';
          fieldName = 'Level';
          break;
        case 'xp':
          users = await db.Users.findAll({
            where: { guild_id: interaction.guild.id },
            order: [['xp', 'DESC']],
            limit: limit,
          });
          title = '🏆 XP Leaderboard';
          fieldName = 'XP';
          break;
        case 'messages':
          users = await db.Users.findAll({
            where: { guild_id: interaction.guild.id },
            order: [['message_count', 'DESC']],
            limit: limit,
          });
          title = '🏆 Message Leaderboard';
          fieldName = 'Messages';
          break;
      }

      if (users.length === 0) {
        await interaction.reply({
          content: 'No data available',
          ephemeral: true,
        });
        return;
      }

      const leaderboard = await Promise.all(
        users.map(async (user, index) => {
          const discordUser = await interaction.client.users.fetch(user.user_id).catch(() => null);
          const userTag = discordUser ? discordUser.tag : user.username;
          const value = type === 'level' ? user.level : (type === 'xp' ? user.xp : user.message_count);

          const medal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : `${index + 1}.`));

          return `${medal} **${userTag}** - ${value}`;
        })
      );

      const embed = new EmbedBuilder()
        .setColor(config.bot.infoColor)
        .setTitle(title)
        .setDescription(leaderboard.join('\n'))
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      Logger.error(`Failed to get leaderboard: ${error.message}`);
      await interaction.reply({
        content: 'Failed to get leaderboard',
        ephemeral: true,
      });
    }
  },
};
