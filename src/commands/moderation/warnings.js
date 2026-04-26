// src/commands/moderation/warnings.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Manage user warnings')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('View user warning list')
        .addUserOption((option) =>
          option
            .setName('target')
            .setDescription('User to view')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('clear')
        .setDescription('Clear all warnings for user')
        .addUserOption((option) =>
          option
            .setName('target')
            .setDescription('User to clear warnings for')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Delete specific warning')
        .addIntegerOption((option) =>
          option
            .setName('id')
            .setDescription('Warning ID')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'list':
        await listWarnings(interaction);
        break;
      case 'clear':
        await clearWarnings(interaction);
        break;
      case 'remove':
        await removeWarning(interaction);
        break;
    }
  },
};

async function listWarnings(interaction) {
  const target = interaction.options.getUser('target');

  try {
    const warnings = await db.Warnings.findAll({
      where: {
        user_id: target.id,
        guild_id: interaction.guild.id,
        is_active: true,
      },
      order: [['createdAt', 'DESC']],
    });

    const user = await db.Users.findOne({
      where: { user_id: target.id, guild_id: interaction.guild.id },
    });

    const totalWarnings = user ? user.warning_count : 0;

    if (warnings.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(config.bot.infoColor)
        .setTitle('📋 Warning List')
        .setDescription(`${target} has no active warnings`)
        .addFields(
          { name: 'User', value: `${target} (${target.tag})`, inline: true },
          { name: 'Total Warnings', value: totalWarnings.toString(), inline: true },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    const warningsList = warnings
      .map((warning, index) => {
        const moderator = interaction.client.users.cache.get(warning.moderator_id);
        const moderatorTag = moderator ? moderator.tag : 'Unknown';
        const date = new Date(warning.createdAt).toLocaleDateString();
        return `${index + 1}. **ID: ${warning.id}** - ${warning.reason}\n   └ Moderator: ${moderatorTag} | Date: ${date}`;
      })
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(config.bot.infoColor)
      .setTitle('📋 Warning List')
      .setDescription(warningsList.substring(0, 4000))
      .addFields(
        { name: 'User', value: `${target} (${target.tag})`, inline: true },
        { name: 'Active Warnings', value: warnings.length.toString(), inline: true },
        { name: 'Total Warnings', value: totalWarnings.toString(), inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    Logger.error(`Failed to list warnings: ${error.message}`);
    await interaction.reply({
      content: 'Failed to get warning list',
      ephemeral: true,
    });
  }
}

async function clearWarnings(interaction) {
  const target = interaction.options.getUser('target');

  try {
    await db.Warnings.update(
      { is_active: false },
      {
        where: {
          user_id: target.id,
          guild_id: interaction.guild.id,
        },
      }
    );

    await db.Users.update(
      { warning_count: 0 },
      {
        where: {
          user_id: target.id,
          guild_id: interaction.guild.id,
        },
      }
    );

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Warnings Cleared')
      .setDescription(`All warnings for ${target} have been cleared`)
      .addFields(
        { name: 'User', value: `${target} (${target.tag})`, inline: true },
        { name: 'Moderator', value: interaction.user.tag, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });

    Logger.info(`Cleared all warnings for ${target.tag} by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to clear warnings: ${error.message}`);
    await interaction.reply({
      content: 'Failed to clear warnings',
      ephemeral: true,
    });
  }
}

async function removeWarning(interaction) {
  const warningId = interaction.options.getInteger('id');

  try {
    const warning = await db.Warnings.findOne({
      where: { id: warningId, guild_id: interaction.guild.id },
    });

    if (!warning) {
      await interaction.reply({
        content: 'Cannot find specified warning',
        ephemeral: true,
      });
      return;
    }

    await warning.update({ is_active: false });

    // Update user warning count
    const user = await db.Users.findOne({
      where: { user_id: warning.user_id, guild_id: interaction.guild.id },
    });

    if (user && user.warning_count > 0) {
      await user.update({ warning_count: user.warning_count - 1 });
    }

    const target = await interaction.client.users.fetch(warning.user_id);

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Warning Deleted')
      .setDescription(`Warning ID: ${warningId} has been deleted`)
      .addFields(
        { name: 'User', value: `${target} (${target.tag})`, inline: true },
        { name: 'Reason', value: warning.reason, inline: true },
        { name: 'Moderator', value: interaction.user.tag, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });

    Logger.info(`Removed warning ${warningId} by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to remove warning: ${error.message}`);
    await interaction.reply({
      content: 'Failed to delete warning',
      ephemeral: true,
    });
  }
}