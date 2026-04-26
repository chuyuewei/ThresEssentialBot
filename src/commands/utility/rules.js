// src/commands/utility/rules.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Manage rules confirmation system')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setup')
        .setDescription('Setup rules confirmation message')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Channel for rules message')
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName('role')
            .setDescription('Role to give after accepting rules')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('title')
            .setDescription('Rules message title')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('content')
            .setDescription('Rules message content')
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('reset')
        .setDescription('Reset rules confirmation status (send notification to all users who haven\'t accepted)')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'setup':
        await setupRules(interaction);
        break;
      case 'reset':
        await resetRules(interaction);
        break;
    }
  },
};

async function setupRules(interaction) {
  const channel = interaction.options.getChannel('channel');
  const role = interaction.options.getRole('role');
  const title = interaction.options.getString('title') || '📜 Server Rules';
  const content = interaction.options.getString('content') || 'Please read the server rules carefully and click the button below to confirm and get full access.';

  // Update config
  config.autoRoles.enabled = true;
  config.autoRoles.rulesChannel = channel.name;
  config.autoRoles.defaultRole = role.id;

  // Create rules message
  const embed = new EmbedBuilder()
    .setColor(config.bot.infoColor)
    .setTitle(title)
    .setDescription(content)
    .addFields(
      { name: '⚠️ Important Notice', value: 'By confirming the rules, you agree to follow all server regulations', inline: false },
      { name: '🎁 After Confirmation', value: `You will receive the <@&${role.id}> role`, inline: false },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('rules_accept')
        .setLabel('✅ I have read and agree to the rules')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('rules_decline')
        .setLabel('❌ I do not agree')
        .setStyle(ButtonStyle.Danger),
    );

  const message = await channel.send({
    embeds: [embed],
    components: [row],
  });

  // Save message ID
  config.autoRoles.rulesMessageId = message.id;

  const replyEmbed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ Rules Confirmation System Setup')
    .setDescription(`Rules message has been sent to ${channel}`)
    .addFields(
      { name: 'Message ID', value: message.id, inline: true },
      { name: 'Channel', value: `<#${channel.id}>`, inline: true },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [replyEmbed] });

  Logger.info(`Rules setup completed in ${channel.name} by ${interaction.user.tag}`);
}

async function resetRules(interaction) {
  // Get all users who haven't accepted rules
  const users = await db.Users.findAll({
    where: {
      guild_id: interaction.guild.id,
      rules_accepted: false,
    },
  });

  if (users.length === 0) {
    await interaction.reply({ content: 'No users need to be reset', ephemeral: true });
    return;
  }

  // Send notification message
  const channel = interaction.guild.channels.cache.find(
    (ch) => ch.name === config.autoRoles.rulesChannel
  );

  if (!channel) {
    await interaction.reply({ content: 'Cannot find rules channel', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(config.bot.warnColor)
    .setTitle('⚠️ Please Confirm Server Rules')
    .setDescription(`We noticed you haven't confirmed the server rules yet. Please go to <#${channel.id}> to confirm the rules and get full access.`)
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    try {
      const member = await interaction.guild.members.fetch(user.user_id);
      await member.send({ embeds: [embed] }).catch(() => {});
      successCount++;
    } catch (error) {
      failCount++;
    }
  }

  const replyEmbed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ Rules Reset Complete')
    .setDescription(`Sent notifications to ${successCount} users\nFailed: ${failCount} users`)
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [replyEmbed] });

  Logger.info(`Rules reset completed by ${interaction.user.tag}: ${successCount} users notified`);
}
