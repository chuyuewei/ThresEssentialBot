// src/commands/utility/prefixconfig.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prefixconfig')
    .setDescription('Configure nickname prefix system')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('show')
        .setDescription('Show current prefix configuration')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add role prefix')
        .addRoleOption((option) =>
          option
            .setName('role')
            .setDescription('Role')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('prefix')
            .setDescription('Prefix (e.g., [CN])')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('position')
            .setDescription('Prefix position')
            .setRequired(true)
            .addChoices(
              { name: 'Before', value: 'before' },
              { name: 'After', value: 'after' },
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove role prefix')
        .addRoleOption((option) =>
          option
            .setName('role')
            .setDescription('Role')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('toggle')
        .setDescription('Toggle auto rename feature')
        .addBooleanOption((option) =>
          option
            .setName('enabled')
            .setDescription('Enable or disable')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('sync')
        .setDescription('Sync all user nicknames')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'show':
        await showPrefixConfig(interaction);
        break;
      case 'add':
        await addPrefix(interaction);
        break;
      case 'remove':
        await removePrefix(interaction);
        break;
      case 'toggle':
        await togglePrefixSystem(interaction);
        break;
      case 'sync':
        await syncPrefixes(interaction);
        break;
    }
  },
  applyPrefixes,
  removeExistingPrefixes,
};

async function showPrefixConfig(interaction) {
  try {
    const prefixConfig = config.prefixConfig?.[interaction.guild.id] || {
      enabled: false,
      prefixes: [],
    };

    const embed = new EmbedBuilder()
      .setColor(config.bot.infoColor)
      .setTitle('🏷️ Prefix Configuration')
      .addFields(
        { name: 'Status', value: prefixConfig.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
        { name: 'Configuration Count', value: prefixConfig.prefixes.length.toString(), inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    if (prefixConfig.prefixes.length > 0) {
      const prefixesList = prefixConfig.prefixes
        .map(p => {
          const role = interaction.guild.roles.cache.get(p.roleId);
          const roleName = role ? role.name : 'Unknown role';
          const position = p.position === 'before' ? 'Before' : 'After';
          return `**${roleName}**: ${p.prefix} (${position})`;
        })
        .join('\n');

      embed.addFields({
        name: 'Prefix List',
        value: prefixesList.substring(0, 4000),
        inline: false,
      });
    } else {
      embed.addFields({
        name: 'Prefix List',
        value: 'No configurations',
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    Logger.error(`Failed to show prefix config: ${error.message}`);
    await interaction.reply({
      content: 'Failed to get prefix configuration',
      ephemeral: true,
    });
  }
}

async function addPrefix(interaction) {
  const role = interaction.options.getRole('role');
  const prefix = interaction.options.getString('prefix');
  const position = interaction.options.getString('position');

  try {
    if (!config.prefixConfig) {
      config.prefixConfig = {};
    }
    if (!config.prefixConfig[interaction.guild.id]) {
      config.prefixConfig[interaction.guild.id] = {
        enabled: false,
        prefixes: [],
      };
    }

    const guildConfig = config.prefixConfig[interaction.guild.id];

    // Check if already exists
    const existingIndex = guildConfig.prefixes.findIndex(p => p.roleId === role.id);
    if (existingIndex >= 0) {
      guildConfig.prefixes[existingIndex] = {
        roleId: role.id,
        prefix: prefix,
        position: position,
      };
    } else {
      guildConfig.prefixes.push({
        roleId: role.id,
        prefix: prefix,
        position: position,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Prefix Added')
      .setDescription(`Prefix for role ${role} has been set`)
      .addFields(
        { name: 'Prefix', value: prefix, inline: true },
        { name: 'Position', value: position === 'before' ? 'Before' : 'After', inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });

    Logger.info(`Prefix added for role ${role.name}: ${prefix} (${position}) by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to add prefix: ${error.message}`);
    await interaction.reply({
      content: 'Failed to add prefix',
      ephemeral: true,
    });
  }
}

async function removePrefix(interaction) {
  const role = interaction.options.getRole('role');

  try {
    const guildConfig = config.prefixConfig?.[interaction.guild.id];
    if (!guildConfig) {
      await interaction.reply({
        content: 'No prefix configuration',
        ephemeral: true,
      });
      return;
    }

    const index = guildConfig.prefixes.findIndex(p => p.roleId === role.id);
    if (index < 0) {
      await interaction.reply({
        content: 'This role has no prefix configuration',
        ephemeral: true,
      });
      return;
    }

    guildConfig.prefixes.splice(index, 1);

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Prefix Removed')
      .setDescription(`Prefix for role ${role} has been removed`)
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });

    Logger.info(`Prefix removed for role ${role.name} by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to remove prefix: ${error.message}`);
    await interaction.reply({
      content: 'Failed to remove prefix',
      ephemeral: true,
    });
  }
}

async function togglePrefixSystem(interaction) {
  const enabled = interaction.options.getBoolean('enabled');

  try {
    if (!config.prefixConfig) {
      config.prefixConfig = {};
    }
    if (!config.prefixConfig[interaction.guild.id]) {
      config.prefixConfig[interaction.guild.id] = {
        enabled: false,
        prefixes: [],
      };
    }

    config.prefixConfig[interaction.guild.id].enabled = enabled;

    const embed = new EmbedBuilder()
      .setColor(enabled ? config.bot.successColor : config.bot.warnColor)
      .setTitle(enabled ? '✅ Prefix System Enabled' : '⚠️ Prefix System Disabled')
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });

    Logger.info(`Prefix system ${enabled ? 'enabled' : 'disabled'} by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to toggle prefix system: ${error.message}`);
    await interaction.reply({
      content: 'Failed to toggle prefix system',
      ephemeral: true,
    });
  }
}

async function syncPrefixes(interaction) {
  try {
    const guildConfig = config.prefixConfig?.[interaction.guild.id];
    if (!guildConfig || !guildConfig.enabled) {
      await interaction.reply({
        content: 'Prefix system not enabled',
        ephemeral: true,
      });
      return;
    }

    const members = await interaction.guild.members.fetch();
    let updatedCount = 0;
    let failedCount = 0;

    for (const member of members) {
      try {
        const result = await applyPrefixes(member, guildConfig.prefixes);
        if (result) updatedCount++;
      } catch (error) {
        failedCount++;
        Logger.error(`Failed to sync prefix for ${member.user.tag}: ${error.message}`);
      }
    }

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Prefix Sync Complete')
      .setDescription(`Updated ${updatedCount} user nicknames`)
      .addFields(
        { name: 'Total Users', value: members.size.toString(), inline: true },
        { name: 'Updated', value: updatedCount.toString(), inline: true },
        { name: 'Failed', value: failedCount.toString(), inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });

    Logger.info(`Prefix sync completed by ${interaction.user.tag}: ${updatedCount}/${members.size} updated`);
  } catch (error) {
    Logger.error(`Failed to sync prefixes: ${error.message}`);
    await interaction.reply({
      content: 'Failed to sync prefixes',
      ephemeral: true,
    });
  }
}

async function applyPrefixes(member, prefixes) {
  try {
    if (!member.manageable) return false;

    // Get user's base nickname (remove existing prefixes)
    const currentNickname = member.nickname || member.user.username;
    const baseNickname = removeExistingPrefixes(currentNickname, prefixes);

    // Find prefixes for user's roles
    const userPrefixes = [];
    for (const prefixConfig of prefixes) {
      if (member.roles.cache.has(prefixConfig.roleId)) {
        userPrefixes.push(prefixConfig);
      }
    }

    if (userPrefixes.length === 0) {
      // If no prefixes, restore base nickname
      if (member.nickname && member.nickname !== baseNickname) {
        await member.setNickname(baseNickname);
        return true;
      }
      return false;
    }

    // Group prefixes by position
    const beforePrefixes = userPrefixes.filter(p => p.position === 'before');
    const afterPrefixes = userPrefixes.filter(p => p.position === 'after');

    // Build new nickname
    const beforePart = beforePrefixes.map(p => p.prefix).join(' ');
    const afterPart = afterPrefixes.map(p => p.prefix).join(' ');

    let newNickname = baseNickname;
    if (beforePart) {
      newNickname = `${beforePart} ${newNickname}`;
    }
    if (afterPart) {
      newNickname = `${newNickname} ${afterPart}`;
    }

    // Check if update is needed
    if (member.nickname !== newNickname) {
      await member.setNickname(newNickname.substring(0, 32)); // Discord nickname limit is 32 characters
      return true;
    }

    return false;
  } catch (error) {
    Logger.error(`Failed to apply prefixes to ${member.user.tag}: ${error.message}`);
    return false;
  }
}

function removeExistingPrefixes(nickname, prefixes) {
  let result = nickname;

  for (const prefixConfig of prefixes) {
    const prefix = prefixConfig.prefix;
    if (prefixConfig.position === 'before') {
      // Remove prefix from beginning
      if (result.startsWith(prefix + ' ')) {
        result = result.substring(prefix.length + 1);
      } else if (result.startsWith(prefix)) {
        result = result.substring(prefix.length);
      }
    } else {
      // Remove prefix from end
      if (result.endsWith(' ' + prefix)) {
        result = result.substring(0, result.length - prefix.length - 1);
      } else if (result.endsWith(prefix)) {
        result = result.substring(0, result.length - prefix.length);
      }
    }
  }

  return result.trim();
}

}
