// src/commands/utility/welcome.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Manage welcome messages')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('show')
        .setDescription('Show current welcome settings')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('channel')
        .setDescription('Set welcome channel')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Channel for welcome messages')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('message')
        .setDescription('Set welcome message')
        .addStringOption((option) =>
          option
            .setName('content')
            .setDescription('Welcome message content (variables: {user}, {memberCount}, {accountAge}, {server}, {username})')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('dm')
        .setDescription('Set DM welcome message')
        .addStringOption((option) =>
          option
            .setName('content')
            .setDescription('DM content (variables: {user}, {server}, {username}), set to "disable" to disable')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('toggle')
        .setDescription('Toggle welcome feature')
        .addBooleanOption((option) =>
          option
            .setName('enabled')
            .setDescription('Enable or disable')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'show':
        await showWelcomeSettings(interaction);
        break;
      case 'channel':
        await setWelcomeChannel(interaction);
        break;
      case 'message':
        await setWelcomeMessage(interaction);
        break;
      case 'dm':
        await setDmMessage(interaction);
        break;
      case 'toggle':
        await toggleWelcome(interaction);
        break;
    }
  },
};

async function showWelcomeSettings(interaction) {
  const embed = new EmbedBuilder()
    .setColor(config.bot.infoColor)
    .setTitle('📋 Welcome Settings')
    .addFields(
      { name: 'Status', value: config.welcome.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
      { name: 'Welcome Channel', value: config.welcome.channelName || 'Not set', inline: true },
      { name: 'DM Message', value: config.welcome.dmMessage ? '✅ Enabled' : '❌ Disabled', inline: true },
      { name: 'Welcome Message', value: config.welcome.message || 'Not set', inline: false },
      { name: 'DM Content', value: config.welcome.dmMessage || 'Not set', inline: false },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
}

async function setWelcomeChannel(interaction) {
  const channel = interaction.options.getChannel('channel');

  // Update config (in production, this should be saved to a database)
  config.welcome.channelName = channel.name;

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ Welcome Channel Updated')
    .setDescription(`Welcome messages will be sent to ${channel}`)
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
}

async function setWelcomeMessage(interaction) {
  const content = interaction.options.getString('content');

  // Update config
  config.welcome.message = content;

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ Welcome Message Updated')
    .setDescription('New message content:\n' + content)
    .addFields(
      { name: 'Available Variables', value: '{user} - User mention\n{memberCount} - Member count\n{accountAge} - Account age\n{server} - Server name\n{username} - Username', inline: false },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
}

async function setDmMessage(interaction) {
  const content = interaction.options.getString('content');

  if (content.toLowerCase() === 'disable') {
    config.welcome.dmMessage = null;
    const embed = new EmbedBuilder()
      .setColor(config.bot.warnColor)
      .setTitle('⚠️ DM Welcome Disabled')
      .setTimestamp()
      .setFooter({ text: config.bot.name });
    await interaction.reply({ embeds: [embed] });
    return;
  }

  config.welcome.dmMessage = content;

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ DM Welcome Updated')
    .setDescription('New DM content:\n' + content)
    .addFields(
      { name: 'Available Variables', value: '{user} - User mention\n{server} - Server name\n{username} - Username', inline: false },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
}

async function toggleWelcome(interaction) {
  const enabled = interaction.options.getBoolean('enabled');

  config.welcome.enabled = enabled;

  const embed = new EmbedBuilder()
    .setColor(enabled ? config.bot.successColor : config.bot.warnColor)
    .setTitle(enabled ? '✅ Welcome Enabled' : '⚠️ Welcome Disabled')
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
}
