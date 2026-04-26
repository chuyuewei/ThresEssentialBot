// src/commands/moderation/antispam.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antispam')
    .setDescription('Manage anti-spam detection settings')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('show')
        .setDescription('Show current anti-spam settings')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('toggle')
        .setDescription('Toggle anti-spam detection')
        .addBooleanOption((option) =>
          option
            .setName('enabled')
            .setDescription('Enable or disable')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('links')
        .setDescription('Set link detection')
        .addBooleanOption((option) =>
          option
            .setName('enabled')
            .setDescription('Enable or disable link detection')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('action')
            .setDescription('Action when link is detected')
            .setRequired(true)
            .addChoices(
              { name: 'Delete Message', value: 'delete' },
              { name: 'Warn', value: 'warn' },
              { name: 'Mute', value: 'mute' },
              { name: 'Kick', value: 'kick' },
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('invites')
        .setDescription('Set invite detection')
        .addBooleanOption((option) =>
          option
            .setName('enabled')
            .setDescription('Enable or disable invite detection')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('action')
            .setDescription('Action when invite is detected')
            .setRequired(true)
            .addChoices(
              { name: 'Delete Message', value: 'delete' },
              { name: 'Warn', value: 'warn' },
              { name: 'Mute', value: 'mute' },
              { name: 'Kick', value: 'kick' },
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('spam')
        .setDescription('Set spam detection')
        .addBooleanOption((option) =>
          option
            .setName('enabled')
            .setDescription('Enable or disable spam detection')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('action')
            .setDescription('Action when spam is detected')
            .setRequired(true)
            .addChoices(
              { name: 'Warn', value: 'warn' },
              { name: 'Mute', value: 'mute' },
              { name: 'Kick', value: 'kick' },
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('keywords')
        .setDescription('Manage banned keywords')
        .addStringOption((option) =>
          option
            .setName('action')
            .setDescription('Add or remove keyword')
            .setRequired(true)
            .addChoices(
              { name: 'Add', value: 'add' },
              { name: 'Remove', value: 'remove' },
              { name: 'List', value: 'list' },
            )
        )
        .addStringOption((option) =>
          option
            .setName('keyword')
            .setDescription('Keyword (required for add or remove)')
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('exempt')
        .setDescription('Set exempt roles or channels')
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('Exemption type')
            .setRequired(true)
            .addChoices(
              { name: 'Role', value: 'role' },
              { name: 'Channel', value: 'channel' },
            )
        )
        .addStringOption((option) =>
          option
            .setName('action')
            .setDescription('Add or remove exemption')
            .setRequired(true)
            .addChoices(
              { name: 'Add', value: 'add' },
              { name: 'Remove', value: 'remove' },
              { name: 'List', value: 'list' },
            )
        )
        .addStringOption((option) =>
          option
            .setName('id')
            .setDescription('Role or channel ID (required for add or remove)')
            .setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'show':
        await showSettings(interaction);
        break;
      case 'toggle':
        await toggleAntiSpam(interaction);
        break;
      case 'links':
        await setLinks(interaction);
        break;
      case 'invites':
        await setInvites(interaction);
        break;
      case 'spam':
        await setSpam(interaction);
        break;
      case 'keywords':
        await manageKeywords(interaction);
        break;
      case 'exempt':
        await manageExemptions(interaction);
        break;
    }
  },
};

async function showSettings(interaction) {
  const embed = new EmbedBuilder()
    .setColor(config.bot.infoColor)
    .setTitle('🛡️ Anti-Spam Settings')
    .addFields(
      { name: 'Status', value: config.antiSpam.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
      { name: 'Link Detection', value: config.antiSpam.blockLinks ? '✅' : '❌', inline: true },
      { name: 'Invite Detection', value: config.antiSpam.blockInvites ? '✅' : '❌', inline: true },
      { name: 'Spam Detection', value: config.antiSpam.blockSpam ? '✅' : '❌', inline: true },
      { name: 'Caps Detection', value: config.antiSpam.blockExcessiveCaps ? '✅' : '❌', inline: true },
      { name: 'Emoji Detection', value: config.antiSpam.blockExcessiveEmojis ? '✅' : '❌', inline: true },
      { name: 'Mute Duration', value: `${config.antiSpam.muteDuration} minutes`, inline: true },
      { name: 'Log Channel', value: config.antiSpam.logChannel || 'Not set', inline: true },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  if (config.antiSpam.blockedKeywords.length > 0) {
    embed.addFields({
      name: 'Banned Keywords',
      value: config.antiSpam.blockedKeywords.join(', ').substring(0, 1000),
      inline: false,
    });
  }

  if (config.antiSpam.exemptRoles.length > 0) {
    embed.addFields({
      name: 'Exempt Roles',
      value: config.antiSpam.exemptRoles.join(', ').substring(0, 1000),
      inline: false,
    });
  }

  if (config.antiSpam.exemptChannels.length > 0) {
    embed.addFields({
      name: 'Exempt Channels',
      value: config.antiSpam.exemptChannels.join(', ').substring(0, 1000),
      inline: false,
    });
  }

  await interaction.reply({ embeds: [embed] });
}

async function toggleAntiSpam(interaction) {
  const enabled = interaction.options.getBoolean('enabled');
  config.antiSpam.enabled = enabled;

  const embed = new EmbedBuilder()
    .setColor(enabled ? config.bot.successColor : config.bot.warnColor)
    .setTitle(enabled ? '✅ Anti-Spam Enabled' : '⚠️ Anti-Spam Disabled')
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
}

async function setLinks(interaction) {
  const enabled = interaction.options.getBoolean('enabled');
  const action = interaction.options.getString('action');

  config.antiSpam.blockLinks = enabled;
  config.antiSpam.linkAction = action;

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ Link Detection Updated')
    .setDescription(`Status: ${enabled ? 'Enabled' : 'Disabled'}\nAction: ${action}`)
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
}

async function setInvites(interaction) {
  const enabled = interaction.options.getBoolean('enabled');
  const action = interaction.options.getString('action');

  config.antiSpam.blockInvites = enabled;
  config.antiSpam.inviteAction = action;

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ Invite Detection Updated')
    .setDescription(`Status: ${enabled ? 'Enabled' : 'Disabled'}\nAction: ${action}`)
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
}

async function setSpam(interaction) {
  const enabled = interaction.options.getBoolean('enabled');
  const action = interaction.options.getString('action');

  config.antiSpam.blockSpam = enabled;
  config.antiSpam.spamAction = action;

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ Spam Detection Updated')
    .setDescription(`Status: ${enabled ? 'Enabled' : 'Disabled'}\nAction: ${action}`)
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
}

async function manageKeywords(interaction) {
  const action = interaction.options.getString('action');
  const keyword = interaction.options.getString('keyword');

  if (action === 'list') {
    const embed = new EmbedBuilder()
      .setColor(config.bot.infoColor)
      .setTitle('📋 Banned Keywords List')
      .setDescription(
        config.antiSpam.blockedKeywords.length > 0
          ? config.antiSpam.blockedKeywords.join('\n')
          : 'No banned keywords'
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
    return;
  }

  if (!keyword) {
    await interaction.reply({ content: 'Please provide a keyword', ephemeral: true });
    return;
  }

  if (action === 'add') {
    if (!config.antiSpam.blockedKeywords.includes(keyword)) {
      config.antiSpam.blockedKeywords.push(keyword);
    }

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Keyword Added')
      .setDescription(`Keyword: ${keyword}`)
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
  } else if (action === 'remove') {
    const index = config.antiSpam.blockedKeywords.indexOf(keyword);
    if (index > -1) {
      config.antiSpam.blockedKeywords.splice(index, 1);
    }

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Keyword Removed')
      .setDescription(`Keyword: ${keyword}`)
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
  }
}

async function manageExemptions(interaction) {
  const type = interaction.options.getString('type');
  const action = interaction.options.getString('action');
  const id = interaction.options.getString('id');

  const targetArray = type === 'role' ? config.antiSpam.exemptRoles : config.antiSpam.exemptChannels;
  const typeName = type === 'role' ? 'Role' : 'Channel';

  if (action === 'list') {
    const embed = new EmbedBuilder()
      .setColor(config.bot.infoColor)
      .setTitle(`📋 Exempt ${typeName}s List`)
      .setDescription(
        targetArray.length > 0
          ? targetArray.join('\n')
          : `No exempt ${typeName.toLowerCase()}s`
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
    return;
  }

  if (!id) {
    await interaction.reply({ content: `Please provide ${typeName} ID`, ephemeral: true });
    return;
  }

  if (action === 'add') {
    if (!targetArray.includes(id)) {
      targetArray.push(id);
    }

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle(`✅ Exempt ${typeName} Added`)
      .setDescription(`${typeName} ID: ${id}`)
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
  } else if (action === 'remove') {
    const index = targetArray.indexOf(id);
    if (index > -1) {
      targetArray.splice(index, 1);
    }

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle(`✅ Exempt ${typeName} Removed`)
      .setDescription(`${typeName} ID: ${id}`)
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
  }
}