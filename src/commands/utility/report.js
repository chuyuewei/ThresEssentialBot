// src/commands/utility/report.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report user or message')
    .addUserOption((option) =>
      option
        .setName('target')
        .setDescription('User to report')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Report type')
        .setRequired(true)
        .addChoices(
          { name: 'Spam', value: 'spam' },
          { name: 'Harassment', value: 'harassment' },
          { name: 'Inappropriate Content', value: 'inappropriate' },
          { name: 'Rule Violation', value: 'rule_violation' },
          { name: 'Other', value: 'other' },
        )
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Report reason')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('evidence')
        .setDescription('Evidence link or additional information')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('message_id')
        .setDescription('Related message ID (optional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const type = interaction.options.getString('type');
    const reason = interaction.options.getString('reason');
    const evidence = interaction.options.getString('evidence') || '';
    const messageId = interaction.options.getString('message_id') || '';

    try {
      // Create report record
      const report = await db.Reports.create({
        guild_id: interaction.guild.id,
        reporter_id: interaction.user.id,
        target_id: target.id,
        type: type,
        reason: reason,
        evidence: evidence,
        message_id: messageId,
        channel_id: messageId ? interaction.channelId : null,
        status: 'pending',
      });

      // Send confirmation message
      const embed = new EmbedBuilder()
        .setColor(config.bot.successColor)
        .setTitle('✅ Report Submitted')
        .setDescription('Your report has been submitted to the administrators for review')
        .addFields(
          { name: 'Report ID', value: report.id.toString(), inline: true },
          { name: 'Reported User', value: `${target} (${target.tag})`, inline: true },
          { name: 'Report Type', value: type, inline: true },
          { name: 'Reason', value: reason, inline: false },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await interaction.reply({ embeds: [embed], ephemeral: true });

      // Notify staff
      await notifyStaff(interaction, report, target);

      Logger.info(`Report submitted by ${interaction.user.tag} against ${target.tag}: ${type}`);
    } catch (error) {
      Logger.error(`Failed to submit report: ${error.message}`);
      await interaction.reply({
        content: 'Failed to submit report',
        ephemeral: true,
      });
    }
  },
};

async function notifyStaff(interaction, report, target) {
  // Find staff channel or log channel
  const staffChannel = interaction.guild.channels.cache.find(
    (ch) => ch.name === 'staff-reports' || ch.name === config.logs.channelName
  );

  if (!staffChannel) return;

  const typeNames = {
    spam: 'Spam',
    harassment: 'Harassment',
    inappropriate: 'Inappropriate Content',
    rule_violation: 'Rule Violation',
    other: 'Other',
  };

  const embed = new EmbedBuilder()
    .setColor(config.bot.warnColor)
    .setTitle('🚨 New Report')
    .addFields(
      { name: 'Report ID', value: report.id.toString(), inline: true },
      { name: 'Reporter', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
      { name: 'Reported User', value: `${target} (${target.tag})`, inline: true },
      { name: 'Type', value: typeNames[report.type] || report.type, inline: true },
      { name: 'Reason', value: report.reason, inline: false },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  if (report.evidence) {
    embed.addFields({
      name: 'Evidence',
      value: report.evidence,
      inline: false,
    });
  }

  if (report.message_id) {
    embed.addFields({
      name: 'Related Message',
      value: `[Click to view](https://discord.com/channels/${interaction.guild.id}/${report.channel_id}/${report.message_id})`,
      inline: false,
    });
  }

  // Add action buttons
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`report_accept_${report.id}`)
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`report_reject_${report.id}`)
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`report_investigate_${report.id}`)
        .setLabel('Investigate')
        .setStyle(ButtonStyle.Primary),
    );

  await staffChannel.send({
    embeds: [embed],
    components: [row],
  });
}
