// src/commands/utility/levelconfig.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levelconfig')
    .setDescription('Configure level system')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('show')
        .setDescription('Show current level configuration')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('xprate')
        .setDescription('Set XP gain rate')
        .addIntegerOption((option) =>
          option
            .setName('rate')
            .setDescription('Rate (1-10)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('base')
        .setDescription('Set base XP')
        .addIntegerOption((option) =>
          option
            .setName('amount')
            .setDescription('Base XP per message')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('lengthbonus')
        .setDescription('Set length bonus rate')
        .addIntegerOption((option) =>
          option
            .setName('rate')
            .setDescription('Length bonus rate (XP per 10 characters)')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(50)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('cooldown')
        .setDescription('Set XP gain cooldown (seconds)')
        .addIntegerOption((option) =>
          option
            .setName('seconds')
            .setDescription('Cooldown time (seconds)')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(300)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('toggle')
        .setDescription('Toggle level system')
        .addBooleanOption((option) =>
          option
            .setName('enabled')
            .setDescription('Enable or disable')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('reset')
        .setDescription('Reset all user levels')
        .addBooleanOption((option) =>
          option
            .setName('confirm')
            .setDescription('Confirm reset')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'show':
        await showConfig(interaction);
        break;
      case 'xprate':
        await setXPRate(interaction);
        break;
      case 'base':
        await setBaseXP(interaction);
        break;
      case 'lengthbonus':
        await setLengthBonus(interaction);
        break;
      case 'cooldown':
        await setCooldown(interaction);
        break;
      case 'toggle':
        await toggleLevelSystem(interaction);
        break;
      case 'reset':
        await resetLevels(interaction);
        break;
    }
  },
};

async function showConfig(interaction) {
  // Get server-specific configuration
  const guildConfig = await getGuildConfig(interaction.guild.id);

  const embed = new EmbedBuilder()
    .setColor(config.bot.infoColor)
    .setTitle('⚙️ Level System Configuration')
    .addFields(
      { name: 'Status', value: guildConfig.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
      { name: 'XP Rate', value: `${guildConfig.xpRate}x`, inline: true },
      { name: 'Base XP', value: `${guildConfig.baseXP} XP`, inline: true },
      { name: 'Length Bonus', value: `${guildConfig.lengthBonus} XP/10 chars`, inline: true },
      { name: 'Cooldown', value: `${guildConfig.cooldown}s`, inline: true },
      { name: 'Level Formula', value: 'level = √(XP / 100) + 1', inline: false },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
}

async function setXPRate(interaction) {
  const rate = interaction.options.getInteger('rate');
  await updateGuildConfig(interaction.guild.id, { xpRate: rate });

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ XP Rate Updated')
    .setDescription(`XP gain rate set to ${rate}x`)
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
  Logger.info(`XP rate set to ${rate}x by ${interaction.user.tag}`);
}

async function setBaseXP(interaction) {
  const amount = interaction.options.getInteger('amount');
  await updateGuildConfig(interaction.guild.id, { baseXP: amount });

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ Base XP Updated')
    .setDescription(`Base XP per message set to ${amount} XP`)
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
  Logger.info(`Base XP set to ${amount} by ${interaction.user.tag}`);
}

async function setLengthBonus(interaction) {
  const rate = interaction.options.getInteger('rate');
  await updateGuildConfig(interaction.guild.id, { lengthBonus: rate });

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ Length Bonus Updated')
    .setDescription(`Length bonus rate set to ${rate} XP/10 characters`)
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
  Logger.info(`Length bonus set to ${rate} by ${interaction.user.tag}`);
}

async function setCooldown(interaction) {
  const seconds = interaction.options.getInteger('seconds');
  await updateGuildConfig(interaction.guild.id, { cooldown: seconds });

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ Cooldown Updated')
    .setDescription(`XP gain cooldown time set to ${seconds} seconds`)
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
  Logger.info(`Cooldown set to ${seconds}s by ${interaction.user.tag}`);
}

async function toggleLevelSystem(interaction) {
  const enabled = interaction.options.getBoolean('enabled');
  await updateGuildConfig(interaction.guild.id, { enabled });

  const embed = new EmbedBuilder()
    .setColor(enabled ? config.bot.successColor : config.bot.warnColor)
    .setTitle(enabled ? '✅ Level System Enabled' : '⚠️ Level System Disabled')
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
  Logger.info(`Level system ${enabled ? 'enabled' : 'disabled'} by ${interaction.user.tag}`);
}

async function resetLevels(interaction) {
  const confirm = interaction.options.getBoolean('confirm');

  if (!confirm) {
    await interaction.reply({
      content: 'Please confirm reset',
      ephemeral: true,
    });
    return;
  }

  try {
    await db.Users.update(
      {
        level: 1,
        xp: 0,
        message_count: 0,
      },
      {
        where: { guild_id: interaction.guild.id },
      }
    );

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Levels Reset')
      .setDescription('All user levels have been reset to initial state')
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
    Logger.info(`Levels reset by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to reset levels: ${error.message}`);
    await interaction.reply({
      content: 'Failed to reset levels',
      ephemeral: true,
    });
  }
}

// Helper function: Get server configuration
async function getGuildConfig(guildId) {
  // Here you can get server-specific configuration from database
  // Currently using default configuration
  return {
    enabled: true,
    xpRate: 1,
    baseXP: 10,
    lengthBonus: 1,
    cooldown: 0,
  };
}

// Helper function: Update server configuration
async function updateGuildConfig(guildId, updates) {
  // Here you can save configuration to database
  // Currently just updates in-memory configuration
  if (!config.levelConfig) {
    config.levelConfig = {};
  }
  if (!config.levelConfig[guildId]) {
    config.levelConfig[guildId] = {
      enabled: true,
      xpRate: 1,
      baseXP: 10,
      lengthBonus: 1,
      cooldown: 0,
    };
  }
  Object.assign(config.levelConfig[guildId], updates);
}
