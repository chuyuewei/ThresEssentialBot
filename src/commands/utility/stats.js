// src/commands/utility/stats.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View server statistics'),

  async execute(interaction) {
    try {
      const guild = interaction.guild;

      // Get basic statistics
      const totalMembers = guild.memberCount;
      const totalChannels = guild.channels.cache.size;
      const totalRoles = guild.roles.cache.size;

      // Get user statistics
      const totalUsers = await db.Users.count({
        where: { guild_id: guild.id },
      });

      const activeUsers = await db.Users.count({
        where: {
          guild_id: guild.id,
          last_active: {
            [db.Sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Active in last 7 days
          },
        },
      });

      // Get warning statistics
      const totalWarnings = await db.Warnings.count({
        where: { guild_id: guild.id },
      });

      const activeWarnings = await db.Warnings.count({
        where: { guild_id: guild.id, is_active: true },
      });

      // Get vote statistics
      const totalVotes = await db.Votes.count({
        where: { guild_id: guild.id },
      });

      const activeVotes = await db.Votes.count({
        where: { guild_id: guild.id, is_active: true },
      });

      // Get report statistics
      const totalReports = await db.Reports.count({
        where: { guild_id: guild.id },
      });

      const pendingReports = await db.Reports.count({
        where: { guild_id: guild.id, status: 'pending' },
      });

      // Get event statistics
      const totalEvents = await db.Events.count({
        where: { guild_id: guild.id },
      });

      const upcomingEvents = await db.Events.count({
        where: {
          guild_id: guild.id,
          is_active: true,
          start_time: {
            [db.Sequelize.Op.gte]: new Date(),
          },
        },
      });

      // Get total XP and messages
      const stats = await db.Users.findOne({
        where: { guild_id: guild.id },
        attributes: [
          [db.sequelize.fn('SUM', db.sequelize.col('xp')), 'totalXP'],
          [db.sequelize.fn('SUM', db.sequelize.col('message_count')), 'totalMessages'],
        ],
      });

      const totalXP = stats?.dataValues?.totalXP || 0;
      const totalMessages = stats?.dataValues?.totalMessages || 0;

      // Create statistics embed
      const embed = new EmbedBuilder()
        .setColor(config.bot.infoColor)
        .setTitle('📊 Server Statistics')
        .setThumbnail(guild.iconURL({ size: 256 }))
        .addFields(
          { name: '👥 Members', value: totalMembers.toString(), inline: true },
          { name: '💬 Channels', value: totalChannels.toString(), inline: true },
          { name: '🎭 Roles', value: totalRoles.toString(), inline: true },
          { name: '📝 Registered Users', value: totalUsers.toString(), inline: true },
          { name: '🟢 Active Users (7 days)', value: activeUsers.toString(), inline: true },
          { name: '⚠️ Total Warnings', value: totalWarnings.toString(), inline: true },
          { name: '🔴 Active Warnings', value: activeWarnings.toString(), inline: true },
          { name: '🗳️ Total Votes', value: totalVotes.toString(), inline: true },
          { name: '🟢 Active Votes', value: activeVotes.toString(), inline: true },
          { name: '🚨 Total Reports', value: totalReports.toString(), inline: true },
          { name: '⏳ Pending Reports', value: pendingReports.toString(), inline: true },
          { name: '📅 Total Events', value: totalEvents.toString(), inline: true },
          { name: '🔜 Upcoming', value: upcomingEvents.toString(), inline: true },
          { name: '✨ Total XP', value: `${totalXP} XP`, inline: true },
          { name: '💬 Total Messages', value: totalMessages.toString(), inline: true },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      Logger.error(`Failed to get stats: ${error.message}`);
      await interaction.reply({
        content: 'Failed to get statistics',
        ephemeral: true,
      });
    }
  },
};
