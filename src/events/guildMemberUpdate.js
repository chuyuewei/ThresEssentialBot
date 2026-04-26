// src/events/guildMemberUpdate.js
const { Events } = require('discord.js');
const config = require('../../config');
const Logger = require('../utils/logger');
const { applyPrefixes } = require('../commands/utility/prefixconfig');

module.exports = {
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(oldMember, newMember) {
// Check if roles changed

    // If roles haven't changed, return

    // Apply prefixes
    await applyPrefixesOnRoleChange(newMember);
  },
};

async function applyPrefixesOnRoleChange(member) {
  try {
    const guildConfig = config.prefixConfig?.[member.guild.id];
    if (!guildConfig || !guildConfig.enabled) return;

    const prefixes = guildConfig.prefixes || [];
    if (prefixes.length === 0) return;

    const result = await applyPrefixes(member, prefixes);
    if (result) {
      Logger.info(`Applied prefixes to ${member.user.tag} on role change`);
    }
  } catch (error) {
    Logger.error(`Failed to apply prefixes on role change for ${member.user.tag}: ${error.message}`);
  }
}
