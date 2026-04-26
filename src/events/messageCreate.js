// src/events/messageCreate.js
const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const Logger = require('../utils/logger');
const { detectSpamAndAds } = require('../utils/anti-spam/detectors');
const messageHistory = require('../utils/anti-spam/messageHistory');
const db = require('../database/models');
const { calculateLevel, checkAndAssignLevelRoles } = require('../utils/levelSystem');

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Ignore DMs
    if (!message.guild) return;

    // Add to message history
    messageHistory.addMessage(message);

    // Add experience
    await addExperience(message);

    // Return if anti-spam detection is disabled
    if (!config.antiSpam.enabled) return;

    // Check exempt roles
    const member = await message.guild.members.fetch(message.author.id);
    const hasExemptRole = member.roles.cache.some(role =>
      config.antiSpam.exemptRoles.includes(role.id) ||
      config.antiSpam.exemptRoles.includes(role.name)
    );

    if (hasExemptRole) return;

    // Check exempt channels
    const isExemptChannel = config.antiSpam.exemptChannels.includes(message.channelId) ||
      config.antiSpam.exemptChannels.includes(message.channel.name);

    if (isExemptChannel) return;

    // Execute detection
    const detections = detectSpamAndAds(message, config.antiSpam, messageHistory);

    if (detections.length === 0) return;

    // Process detection results
    for (const detection of detections) {
      await handleDetection(message, detection, member);
    }
  },
};

async function handleDetection(message, detection, member) {
  const { type, action, items } = detection;

  // Log to log channel
  await logDetection(message, detection);

  // Execute action based on detection type
  switch (action) {
    case 'delete':
      await message.delete().catch(() => {});
      await sendWarning(message, detection);
      break;

    case 'warn':
      await sendWarning(message, detection);
      await addWarning(member, detection);
      break;

    case 'mute':
      await message.delete().catch(() => {});
      await muteUser(member, detection);
      await addWarning(member, detection);
      break;

    case 'kick':
      await message.delete().catch(() => {});
      await kickUser(member, detection);
      await addWarning(member, detection);
      break;
  }
}

async function sendWarning(message, detection) {
  const warningMessages = {
    links: '⚠️ Your message contained a link and has been deleted',
    invites: '⚠️ Your message contained an invite link and has been deleted',
    spam: '⚠️ Detected spam behavior, please slow down your message sending',
    keywords: '⚠️ Your message contained banned keywords and has been deleted',
    caps: '⚠️ Please do not use excessive capital letters',
    emojis: '⚠️ Please do not use excessive emojis',
  };

  const warning = warningMessages[detection.type] || '⚠️ Your message violated community rules';

  await message.channel.send({
    content: `${message.author} ${warning}`,
    ephemeral: true,
  }).catch(() => {});
}

async function addWarning(member, detection) {
  try {
    const warning = await db.Warnings.create({
      user_id: member.id,
      guild_id: member.guild.id,
      moderator_id: member.client.user.id,
      reason: `Auto detection: ${detection.type} - ${JSON.stringify(detection)}`,
      type: 'warning',
      is_active: true,
    });

    // Update user warning count
    const user = await db.Users.findOne({
      where: { user_id: member.id, guild_id: member.guild.id },
    });

    if (user) {
      await user.update({ warning_count: user.warning_count + 1 });
    } else {
      await db.Users.create({
        user_id: member.id,
        guild_id: member.guild.id,
        username: member.user.username,
        warning_count: 1,
      });
    }

    Logger.info(`Added warning to ${member.user.tag} for ${detection.type}`);
  } catch (error) {
    Logger.error(`Failed to add warning: ${error.message}`);
  }
}

async function muteUser(member, detection) {
  try {
    const duration = config.antiSpam.muteDuration * 60 * 1000;
    const muteUntil = new Date(Date.now() + duration);

    await member.timeout(duration, `Auto mute: ${detection.type}`);

    // Update database
    const user = await db.Users.findOne({
      where: { user_id: member.id, guild_id: member.guild.id },
    });

    if (user) {
      await user.update({
        is_muted: true,
        mute_until: muteUntil,
      });
    }

    Logger.info(`Muted ${member.user.tag} for ${config.antiSpam.muteDuration} minutes (${detection.type})`);
  } catch (error) {
    Logger.error(`Failed to mute user: ${error.message}`);
  }
}

async function kickUser(member, detection) {
  try {
    await member.kick(`Auto kick: ${detection.type}`);
    Logger.info(`Kicked ${member.user.tag} (${detection.type})`);
  } catch (error) {
    Logger.error(`Failed to kick user: ${error.message}`);
  }
}

async function logDetection(message, detection) {
  if (!config.antiSpam.logChannel) return;

  const logChannel = message.guild.channels.cache.find(
    (ch) => ch.name === config.antiSpam.logChannel
  );

  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(config.bot.warnColor)
    .setTitle('🚫 Anti-Spam Detection')
    .addFields(
      { name: 'User', value: `${message.author} (${message.author.tag})`, inline: true },
      { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
      { name: 'Detection Type', value: detection.type, inline: true },
      { name: 'Action', value: detection.action, inline: true },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  if (detection.items && detection.items.length > 0) {
    embed.addFields({
      name: 'Detection Content',
      value: detection.items.join('\n').substring(0, 1000),
      inline: false,
    });
  }

  if (message.content) {
    embed.addFields({
      name: 'Message Content',
      value: message.content.substring(0, 500),
      inline: false,
    });
  }

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

async function addExperience(message) {
  try {
    const userId = message.author.id;
    const guildId = message.guild.id;

    // Find or create user record
    let user = await db.Users.findOne({
      where: { user_id: userId, guild_id: guildId },
    });

    if (!user) {
      user = await db.Users.create({
        user_id: userId,
        guild_id: guildId,
        username: message.author.username,
        level: 1,
        xp: 0,
        message_count: 0,
      });
    }

    // Calculate XP (based on message length)
    const baseXP = 10;
    const lengthBonus = Math.min(Math.floor(message.content.length / 10), 20);
    const totalXP = baseXP + lengthBonus;

    // Update user data
    const newXP = user.xp + totalXP;
    const newMessageCount = user.message_count + 1;

    // Calculate level
    const newLevel = calculateLevel(newXP);

    // Check if leveled up
    let leveledUp = false;
    if (newLevel > user.level) {
      leveledUp = true;
    }

    await user.update({
      xp: newXP,
      message_count: newMessageCount,
      level: newLevel,
      last_active: new Date(),
    });

    // If leveled up, send notification and assign roles
    if (leveledUp) {
      await checkAndAssignLevelRoles(message.guild, userId, newLevel);
    }
  } catch (error) {
    Logger.error(`Failed to add experience: ${error.message}`);
  }
}