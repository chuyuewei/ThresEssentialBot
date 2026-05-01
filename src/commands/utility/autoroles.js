// src/commands/utility/autoroles.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoroles')
    .setDescription('Manage auto-role assignment system')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('show')
        .setDescription('Show current auto-role settings')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add auto-role rule')
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('Trigger type')
            .setRequired(true)
            .addChoices(
              { name: 'Level', value: 'level' },
              { name: 'Reaction', value: 'reaction' },
            )
        )
        .addRoleOption((option) =>
          option
            .setName('role')
            .setDescription('Role to assign')
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('level')
            .setDescription('Level (required for level triggers)')
            .setRequired(false)
            .setMinValue(1)
        )
        .addStringOption((option) =>
          option
            .setName('emoji')
            .setDescription('Emoji (required for reaction triggers)')
            .setRequired(false)
        )
        )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Delete auto-role rule')
        .addIntegerOption((option) =>
          option
            .setName('index')
            .setDescription('Rule index (view with /autoroles show)')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('check')
        .setDescription('Manually check and assign roles')
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('User to check (check all users if not specified)')
            .setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'show':
        await showAutoRoles(interaction);
        break;
      case 'add':
        await addAutoRole(interaction);
        break;
      case 'remove':
        await removeAutoRole(interaction);
        break;
      case 'check':
        await checkAutoRoles(interaction);
        break;
    }
  },
};

async function showAutoRoles(interaction) {
  const embed = new EmbedBuilder()
    .setColor(config.bot.infoColor)
    .setTitle('🎭 Auto-Role Settings')
    .addFields(
      { name: 'Status', value: config.autoRoles.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
      { name: 'Rules Channel', value: config.autoRoles.rulesChannel || 'Not set', inline: true },
      { name: 'Default Role', value: config.autoRoles.defaultRole ? `<@&${config.autoRoles.defaultRole}>` : 'Not set', inline: true },
    )
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  if (config.autoRoles.roles && config.autoRoles.roles.length > 0) {
    const rolesList = config.autoRoles.roles
      .map((role, index) => {
        const trigger = role.trigger === 'level' ? `Level ${role.level}` : `Reaction ${role.emoji}`;
        return `${index + 1}. ${trigger} → <@&${role.roleId}>`;
      })
      .join('\n');

    embed.addFields({
      name: 'Auto-Role Rules',
      value: rolesList,
      inline: false,
    });
  } else {
    embed.addFields({
      name: 'Auto-Role Rules',
      value: 'No rules',
      inline: false,
    });
  }

  await interaction.reply({ embeds: [embed] });
}

async function addAutoRole(interaction) {
  const type = interaction.options.getString('type');
  const level = interaction.options.getInteger('level');
  const emoji = interaction.options.getString('emoji');
  const role = interaction.options.getRole('role');

  const newRule = {
    trigger: type,
    roleId: role.id,
  };

  if (type === 'level') {
    if (!level) {
      await interaction.reply({ content: 'Level trigger requires specifying a level', ephemeral: true });
      return;
    }
    newRule.level = level;
  } else if (type === 'reaction') {
    if (!emoji) {
      await interaction.reply({ content: 'Reaction trigger requires specifying an emoji', ephemeral: true });
      return;
    }
    newRule.emoji = emoji;
  }

  if (!config.autoRoles.roles) {
    config.autoRoles.roles = [];
  }

  config.autoRoles.roles.push(newRule);

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ Auto-Role Rule Added')
    .setDescription(`Type: ${type}\nRole: ${role}`)
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  if (type === 'level') {
    embed.addFields({ name: 'Trigger Condition', value: `Reach level ${level}`, inline: true });
  } else if (type === 'reaction') {
    embed.addFields({ name: 'Trigger Condition', value: `React ${emoji}`, inline: true });
  }

  await interaction.reply({ embeds: [embed] });

  Logger.info(`Auto-role rule added by ${interaction.user.tag}: ${type} -> ${role.name}`);
}

async function removeAutoRole(interaction) {
  const index = interaction.options.getInteger('index') - 1;

  if (!config.autoRoles.roles || index < 0 || index >= config.autoRoles.roles.length) {
    await interaction.reply({ content: 'Invalid rule index', ephemeral: true });
    return;
  }

  const removed = config.autoRoles.roles.splice(index, 1)[0];

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ Auto-Role Rule Deleted')
    .setDescription(`Type: ${removed.trigger}\nRole: <@&${removed.roleId}>`)
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });

  Logger.info(`Auto-role rule removed by ${interaction.user.tag}`);
}

async function checkAutoRoles(interaction) {
  const targetUser = interaction.options.getUser('user');
  let processedCount = 0;
  let successCount = 0;

  if (targetUser) {
    // Check single user
    const result = await processUserAutoRoles(interaction.guild, targetUser.id);
    processedCount = 1;
    successCount = result ? 1 : 0;
  } else {
    // Check all users
    const users = await db.Users.findAll({
      where: { guild_id: interaction.guild.id },
    });

    for (const user of users) {
      try {
        const result = await processUserAutoRoles(interaction.guild, user.user_id);
        processedCount++;
        if (result) successCount++;
      } catch (error) {
        Logger.error(`Failed to process auto-roles for ${user.user_id}: ${error.message}`);
      }
    }
  }

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ Auto-Role Check Complete')
    .setDescription(`Processed users: ${processedCount}\nSuccessfully assigned: ${successCount}`)
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });

  Logger.info(`Auto-role check completed by ${interaction.user.tag}: ${successCount}/${processedCount}`);
}

async function processUserAutoRoles(guild, userId) {
  if (!config.autoRoles.roles || config.autoRoles.roles.length === 0) {
    return false;
  }

  try {
    const member = await guild.members.fetch(userId);
    const user = await db.Users.findOne({
      where: { user_id: userId, guild_id: guild.id },
    });

    if (!user) return false;

    let assigned = false;

    for (const rule of config.autoRoles.roles) {
      if (rule.trigger === 'level' && user.level >= rule.level) {
        if (!member.roles.cache.has(rule.roleId)) {
          await member.roles.add(rule.roleId);
          assigned = true;
        }
      }
    }

    return assigned;
  } catch (error) {
    Logger.error(`Error processing auto-roles for ${userId}: ${error.message}`);
    return false;
  }
}