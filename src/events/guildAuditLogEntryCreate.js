// src/events/guildAuditLogEntryCreate.js
const { Events, AuditLogEvent, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const Logger = require('../utils/logger');

module.exports = {
  name: Events.GuildAuditLogEntryCreate,
  once: false,
  async execute(auditLogEntry) {
    const { action, executorId, targetId, changes, extra } = auditLogEntry;

    // 只记录重要的事件
    const importantEvents = [
      AuditLogEvent.MemberKick,
      AuditLogEvent.MemberBanAdd,
      AuditLogEvent.MemberBanRemove,
      AuditLogEvent.MemberRoleUpdate,
      AuditLogEvent.MemberUpdate,
      AuditLogEvent.ChannelCreate,
      AuditLogEvent.ChannelDelete,
      AuditLogEvent.ChannelUpdate,
      AuditLogEvent.RoleCreate,
      AuditLogEvent.RoleDelete,
      AuditLogEvent.RoleUpdate,
    ];

    if (!importantEvents.includes(action)) return;

    try {
      const executor = await auditLogEntry.guild.members.fetch(executorId).catch(() => null);
      const target = await auditLogEntry.guild.members.fetch(targetId).catch(() => null);

      // 记录到日志
      if (config.logs.enabled) {
        await logAuditEvent(auditLogEntry, executor, target);
      }

      Logger.info(`Audit log entry: ${action} by ${executor?.user.tag || 'Unknown'}`);
    } catch (error) {
      Logger.error(`Failed to process audit log entry: ${error.message}`);
    }
  },
};

async function logAuditEvent(auditLogEntry, executor, target) {
  const logChannel = auditLogEntry.guild.channels.cache.find(
    (ch) => ch.name === config.logs.channelName
  );
  if (!logChannel) return;

  const { action, reason, changes, extra } = auditLogEntry;

  const actionNames = {
    [AuditLogEvent.MemberKick]: 'Member Kick',
    [AuditLogEvent.MemberBanAdd]: 'Member Ban',
    [AuditLogEvent.MemberBanRemove]: 'Member Unban',
    [AuditLogEvent.MemberRoleUpdate]: 'Role Change',
    [AuditLogEvent.MemberUpdate]: 'Member Update',
    [AuditLogEvent.ChannelCreate]: 'Channel Create',
    [AuditLogEvent.ChannelDelete]: 'Channel Delete',
    [AuditLogEvent.ChannelUpdate]: 'Channel Update',
    [AuditLogEvent.RoleCreate]: 'Role Create',
    [AuditLogEvent.RoleDelete]: 'Role Delete',
    [AuditLogEvent.RoleUpdate]: 'Role Update',
  };
  const actionName = actionNames[action] || 'Unknown Action';

  const embed = new EmbedBuilder()
    .setColor(config.bot.infoColor)
    .setTitle('Audit Log')
    .addFields(
      { name: 'Action', value: actionName, inline: true },
      { name: 'Executor', value: executor ? `${executor} (${executor.user.tag})` : 'Unknown', inline: true },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  if (target) {
    embed.addFields({ name: 'Target', value: `${target} (${target.user.tag})`, inline: true });
  }
  if (reason) {
    embed.addFields({ name: 'Reason', value: reason, inline: false });
  }
  if (changes && changes.length > 0) {
    const changesText = changes.map(c => `**${c.key}**: ${c.old || 'None'} → ${c.new || 'None'}`).join('\n').substring(0, 1000);
    embed.addFields({ name: 'Changes', value: changesText, inline: false });
  }

  await logChannel.send({ embeds: [embed] }).catch(() => {});
}
