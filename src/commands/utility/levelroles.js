// src/commands/utility/levelroles.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levelroles')
    .setDescription('Manage level roles')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('show')
        .setDescription('Show current level role configuration')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add level role')
        .addIntegerOption((option) =>
          option
            .setName('level')
            .setDescription('Level')
            .setRequired(true)
            .setMinValue(1)
        )
        .addStringOption((option) =>
          option
            .setName('name')
            .setDescription('Level name')
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName('role')
            .setDescription('Corresponding role')
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('required_xp')
            .setDescription('Required XP (auto-calculated if not specified)')
            .setRequired(false)
            .setMinValue(0)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Delete level role')
        .addIntegerOption((option) =>
          option
            .setName('level')
            .setDescription('Level to delete')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('update')
        .setDescription('Update level role')
        .addIntegerOption((option) =>
          option
            .setName('level')
            .setDescription('Level')
            .setRequired(true)
            .setMinValue(1)
        )
        .addStringOption((option) =>
          option
            .setName('name')
            .setDescription('New level name')
            .setRequired(false)
        )
        .addRoleOption((option) =>
          option
            .setName('role')
            .setDescription('New role')
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName('required_xp')
            .setDescription('New required XP')
            .setRequired(false)
            .setMinValue(0)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('sync')
        .setDescription('Sync all users\' level roles')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('import')
        .setDescription('Import default level configuration')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'show':
        await showLevelRoles(interaction);
        break;
      case 'add':
        await addLevelRole(interaction);
        break;
      case 'remove':
        await removeLevelRole(interaction);
        break;
      case 'update':
        await updateLevelRole(interaction);
        break;
      case 'sync':
        await syncLevelRoles(interaction);
        break;
      case 'import':
        await importDefaultLevels(interaction);
        break;
    }
  },
};

async function showLevelRoles(interaction) {
  try {
    const levelRoles = await db.Levels.findAll({
      where: { guild_id: interaction.guild.id },
      order: [['level', 'ASC']],
    });

    if (levelRoles.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(config.bot.infoColor)
        .setTitle('🎭 Level Role Configuration')
        .setDescription('No level role configuration')
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    const rolesList = levelRoles
      .map(lr => {
        const role = interaction.guild.roles.cache.get(lr.role_id);
        const roleName = role ? role.name : 'Unknown role';
        return `**Level ${lr.level}** - ${lr.name}\n   └ Role: ${roleName} | Required XP: ${lr.required_xp}`;
      })
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(config.bot.infoColor)
      .setTitle('🎭 Level Role Configuration')
      .setDescription(rolesList.substring(0, 4000))
      .addFields(
        { name: 'Total Configurations', value: levelRoles.length.toString(), inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    Logger.error(`Failed to show level roles: ${error.message}`);
    await interaction.reply({
      content: 'Failed to get level role configuration',
      ephemeral: true,
    });
  }
}

async function addLevelRole(interaction) {
  const level = interaction.options.getInteger('level');
  const name = interaction.options.getString('name');
  const role = interaction.options.getRole('role');
  const requiredXP = interaction.options.getInteger('required_xp');

  try {
    // Check if already exists
    const existing = await db.Levels.findOne({
      where: { guild_id: interaction.guild.id, level: level },
    });

    if (existing) {
      await interaction.reply({
        content: 'This level already exists, please use /levelroles update to update',
        ephemeral: true,
      });
      return;
    }

    // Calculate required XP (if not specified)
    const calculatedXP = requiredXP || Math.pow(level - 1, 2) * 100;

    await db.Levels.create({
      guild_id: interaction.guild.id,
      level: level,
      name: name,
      required_xp: calculatedXP,
      role_id: role.id,
    });

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Level Role Added')
      .setDescription(`Level ${level} - ${name}`)
      .addFields(
        { name: 'Role', value: `${role}`, inline: true },
        { name: 'Required XP', value: calculatedXP.toString(), inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
    Logger.info(`Level role added: Level ${level} -> ${role.name} by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to add level role: ${error.message}`);
    await interaction.reply({
      content: 'Failed to add level role',
      ephemeral: true,
    });
  }
}

async function removeLevelRole(interaction) {
  const level = interaction.options.getInteger('level');

  try {
    const levelRole = await db.Levels.findOne({
      where: { guild_id: interaction.guild.id, level: level },
    });

    if (!levelRole) {
      await interaction.reply({
        content: 'Cannot find level configuration',
        ephemeral: true,
      });
      return;
    }

    await levelRole.destroy();

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Level Role Deleted')
      .setDescription(`Level ${level} configuration has been deleted`)
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
    Logger.info(`Level role removed: Level ${level} by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to remove level role: ${error.message}`);
    await interaction.reply({
      content: 'Failed to remove level role',
      ephemeral: true,
    });
  }
}

async function updateLevelRole(interaction) {
  const level = interaction.options.getInteger('level');
  const name = interaction.options.getString('name');
  const role = interaction.options.getRole('role');
  const requiredXP = interaction.options.getInteger('required_xp');

  try {
    const levelRole = await db.Levels.findOne({
      where: { guild_id: interaction.guild.id, level: level },
    });

    if (!levelRole) {
      await interaction.reply({
        content: 'Cannot find level configuration',
        ephemeral: true,
      });
      return;
    }

    // Update fields
    if (name) levelRole.name = name;
    if (role) levelRole.role_id = role.id;
    if (requiredXP !== null) levelRole.required_xp = requiredXP;

    await levelRole.save();

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Level Role Updated')
      .setDescription(`Level ${level} - ${levelRole.name}`)
      .addFields(
        { name: 'Role', value: `<@&${levelRole.role_id}>`, inline: true },
        { name: 'Required XP', value: levelRole.required_xp.toString(), inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
    Logger.info(`Level role updated: Level ${level} by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to update level role: ${error.message}`);
    await interaction.reply({
      content: 'Failed to update level role',
      ephemeral: true,
    });
  }
}

async function syncLevelRoles(interaction) {
  try {
    const users = await db.Users.findAll({
      where: { guild_id: interaction.guild.id },
    });

    let updatedCount = 0;

    for (const user of users) {
      const result = await checkAndAssignLevelRoles(interaction.guild, user);
      if (result) updatedCount++;
    }

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Level Roles Synced')
      .setDescription(`Updated ${updatedCount} users' level roles`)
      .addFields(
        { name: 'Total Users', value: users.length.toString(), inline: true },
        { name: 'Updated', value: updatedCount.toString(), inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
    Logger.info(`Level roles synced by ${interaction.user.tag}: ${updatedCount}/${users.length} users`);
  } catch (error) {
    Logger.error(`Failed to sync level roles: ${error.message}`);
    await interaction.reply({
      content: 'Failed to sync level roles',
      ephemeral: true,
    });
  }
}

async function importDefaultLevels(interaction) {
  try {
    const defaultLevels = [
      { level: 1, name: 'Initiate', required_xp: 0 },
      { level: 2, name: 'Operative', required_xp: 500 },
      { level: 3, name: 'Specialist', required_xp: 2000 },
      { level: 4, name: 'Veteran', required_xp: 5000 },
      { level: 5, name: 'Elite', required_xp: 10000 },
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const levelData of defaultLevels) {
      const existing = await db.Levels.findOne({
        where: { guild_id: interaction.guild.id, level: levelData.level },
      });

      if (existing) {
        existing.name = levelData.name;
        existing.required_xp = levelData.required_xp;
        await existing.save();
        updatedCount++;
      } else {
        await db.Levels.create({
          guild_id: interaction.guild.id,
          ...levelData,
        });
        createdCount++;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Default Level Configuration Imported')
      .setDescription(`Created ${createdCount} new configurations, updated ${updatedCount} existing configurations`)
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
    Logger.info(`Default levels imported by ${interaction.user.tag}: ${createdCount} created, ${updatedCount} updated`);
  } catch (error) {
    Logger.error(`Failed to import default levels: ${error.message}`);
    await interaction.reply({
      content: 'Failed to import default level configuration',
      ephemeral: true,
    });
  }
}

async function checkAndAssignLevelRoles(guild, user) {
  try {
    const levelRoles = await db.Levels.findAll({
      where: { guild_id: guild.id },
      order: [['level', 'ASC']],
    });

    let updated = false;

    for (const levelRole of levelRoles) {
      if (user.level >= levelRole.level && levelRole.role_id) {
        try {
          const member = await guild.members.fetch(user.user_id);
          if (!member.roles.cache.has(levelRole.role_id)) {
            await member.roles.add(levelRole.role_id);
            updated = true;
          }
        } catch (error) {
          Logger.error(`Failed to assign role ${levelRole.role_id} to user ${user.user_id}: ${error.message}`);
        }
      }
    }

    return updated;
  } catch (error) {
    Logger.error(`Failed to check level roles for user ${user.user_id}: ${error.message}`);
    return false;
  }
}
