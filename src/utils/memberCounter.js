// src/utils/memberCounter.js
const Logger = require('./logger');
const config = require('../../config');

/**
 * Update the member-count display channel for a guild.
 * Call this on guildMemberAdd / guildMemberRemove.
 */
async function updateMemberCount(guild) {
  try {
    const channelId = config.memberCount?.channelId;
    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    const newName = `📊 Members: ${guild.memberCount}`;
    if (channel.name !== newName) {
      await channel.setName(newName).catch(() => {});
      Logger.info(`Updated member count channel in ${guild.name}: ${newName}`);
    }
  } catch (err) {
    Logger.error(`Failed to update member count for ${guild.name}: ${err.message}`);
  }
}

module.exports = { updateMemberCount };