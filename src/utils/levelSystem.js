// src/utils/levelSystem.js
const db = require('../database/models');
const Logger = require('./logger');

/**
 * Calculate user level
 * @param {number} xp - User XP
 * @returns {number} Level
 */
function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Calculate required XP for a level
 * @param {number} level - Level
 * @returns {number} Required XP
 */
function calculateRequiredXP(level) {
  return Math.pow(level - 1, 2) * 100;
}

/**
 * Get user level information
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @returns {Object|null} User level information
 */
async function getUserLevelInfo(guildId, userId) {
  try {
    const user = await db.Users.findOne({
      where: { user_id: userId, guild_id: guildId },
    });

    if (!user) return null;

    const currentLevelXP = calculateRequiredXP(user.level);
    const nextLevelXP = calculateRequiredXP(user.level + 1);
    const xpNeeded = nextLevelXP - user.xp;
    const xpProgress = user.xp - currentLevelXP;
    const xpTotal = nextLevelXP - currentLevelXP;
    const progressPercent = ((xpProgress / xpTotal) * 100).toFixed(1);

    return {
      level: user.level,
      xp: user.xp,
      messageCount: user.message_count,
      currentLevelXP,
      nextLevelXP,
      xpNeeded,
      xpProgress,
      xpTotal,
      progressPercent,
    };
  } catch (error) {
    Logger.error(`Failed to get user level info: ${error.message}`);
    return null;
  }
}

/**
 * Get user rank
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @returns {number} Rank
 */
async function getUserRank(guildId, userId) {
  try {
    const users = await db.Users.findAll({
      where: { guild_id: guildId },
      order: [['level', 'DESC'], ['xp', 'DESC']],
    });

    const rank = users.findIndex(u => u.user_id === userId) + 1;
    return rank > 0 ? rank : users.length + 1;
  } catch (error) {
    Logger.error(`Failed to get user rank: ${error.message}`);
    return 0;
  }
}

/**
 * Get level name
 * @param {string} guildId - Guild ID
 * @param {number} level - Level
 * @returns {string} Level name
 */
async function getLevelName(guildId, level) {
  try {
    const levelConfig = await db.Levels.findOne({
      where: { guild_id: guildId, level: level },
    });

    if (levelConfig) {
      return levelConfig.name;
    }

    // Default level names
    const defaultLevels = {
      1: 'Initiate',
      2: 'Operative',
      3: 'Specialist',
      4: 'Veteran',
      5: 'Elite',
    };

    return defaultLevels[level] || `Level ${level}`;
  } catch (error) {
    Logger.error(`Failed to get level name: ${error.message}`);
    return `Level ${level}`;
  }
}

/**
 * Check and assign level roles
 * @param {Guild} guild - Discord guild object
 * @param {string} userId - User ID
 * @param {number} level - User level
 * @returns {boolean} Whether roles were updated
 */
async function checkAndAssignLevelRoles(guild, userId, level) {
  try {
    const levelRoles = await db.Levels.findAll({
      where: { guild_id: guild.id },
      order: [['level', 'ASC']],
    });

    let updated = false;

    for (const levelConfig of levelRoles) {
      if (level >= levelConfig.level && levelConfig.role_id) {
        try {
          const member = await guild.members.fetch(userId);
          if (!member.roles.cache.has(levelConfig.role_id)) {
            await member.roles.add(levelConfig.role_id);
            updated = true;

            // Get level name
            const levelName = levelConfig.name || `Level ${levelConfig.level}`;

            // Send level up notification
            const config = require('../../config');
            const { EmbedBuilder } = require('discord.js');

            const embed = new EmbedBuilder()
              .setColor(config.bot.successColor)
              .setTitle('🎉 Level Up!')
              .setDescription(`Congratulations ${member}, you have reached **${levelName}** level!`)
              .addFields(
                { name: 'New Level', value: `${levelName} (${levelConfig.level})`, inline: true },
                { name: 'Role Earned', value: `<@&${levelConfig.role_id}>`, inline: true },
              )
              .setTimestamp()
              .setFooter({ text: config.bot.name });

            // Try to send to level-up notification channel or current channel
            const notificationChannel = guild.channels.cache.find(
              (ch) => ch.name === 'level-up' || ch.name === 'announcements'
            );

            if (notificationChannel) {
              await notificationChannel.send({ embeds: [embed] }).catch(() => {});
            }

            Logger.info(`User ${userId} reached level ${levelName} and got role ${levelConfig.role_id}`);
          }
        } catch (error) {
          Logger.error(`Failed to add level role: ${error.message}`);
        }
      }
    }

    return updated;
  } catch (error) {
    Logger.error(`Failed to check level roles: ${error.message}`);
    return false;
  }
}

/**
 * Sync all users' level roles
 * @param {Guild} guild - Discord guild object
 * @returns {Object} Sync results
 */
async function syncAllLevelRoles(guild) {
  try {
    const users = await db.Users.findAll({
      where: { guild_id: guild.id },
    });

    let updatedCount = 0;
    let failedCount = 0;

    for (const user of users) {
      try {
        const result = await checkAndAssignLevelRoles(guild, user.user_id, user.level);
        if (result) updatedCount++;
      } catch (error) {
        failedCount++;
        Logger.error(`Failed to sync roles for user ${user.user_id}: ${error.message}`);
      }
    }

    return {
      total: users.length,
      updated: updatedCount,
      failed: failedCount,
    };
  } catch (error) {
    Logger.error(`Failed to sync level roles: ${error.message}`);
    return {
      total: 0,
      updated: 0,
      failed: 0,
    };
  }
}

/**
 * Get guild level statistics
 * @param {string} guildId - Guild ID
 * @returns {Object} Level statistics
 */
async function getGuildLevelStats(guildId) {
  try {
    const users = await db.Users.findAll({
      where: { guild_id: guildId },
    });

    const levelDistribution = {};
    let totalXP = 0;
    let totalMessages = 0;

    for (const user of users) {
      const level = user.level;
      levelDistribution[level] = (levelDistribution[level] || 0) + 1;
      totalXP += user.xp;
      totalMessages += user.message_count;
    }

    return {
      totalUsers: users.length,
      levelDistribution,
      totalXP,
      totalMessages,
      averageLevel: users.length > 0 ? (users.reduce((sum, u) => sum + u.level, 0) / users.length).toFixed(2) : 0,
    };
  } catch (error) {
    Logger.error(`Failed to get guild level stats: ${error.message}`);
    return null;
  }
}

module.exports = {
  calculateLevel,
  calculateRequiredXP,
  getUserLevelInfo,
  getUserRank,
  getLevelName,
  checkAndAssignLevelRoles,
  syncAllLevelRoles,
  getGuildLevelStats,
};