// src/commands/utility/setupranks.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setupranks')
    .setDescription('Setup 5-rank system (Initiate → Operative → Specialist → Veteran → Elite)')
    .addRoleOption((option) =>
      option
        .setName('initiate')
        .setDescription('Initiate rank role')
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName('operative')
        .setDescription('Operative rank role')
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName('specialist')
        .setDescription('Specialist rank role')
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName('veteran')
        .setDescription('Veteran rank role')
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName('elite')
        .setDescription('Elite rank role')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('operative_xp')
        .setDescription('XP required for Operative rank')
        .setRequired(false)
        .setMinValue(0)
    )
    .addIntegerOption((option) =>
      option
        .setName('specialist_xp')
        .setDescription('XP required for Specialist rank')
        .setRequired(false)
        .setMinValue(0)
    )
    .addIntegerOption((option) =>
      option
        .setName('veteran_xp')
        .setDescription('XP required for Veteran rank')
        .setRequired(false)
        .setMinValue(0)
    )
    .addIntegerOption((option) =>
      option
        .setName('elite_xp')
        .setDescription('XP required for Elite rank')
        .setRequired(false)
        .setMinValue(0)
    )
    .addBooleanOption((option) =>
      option
        .setName('sync')
        .setDescription('Whether to sync existing users\' rank roles')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const initiate = interaction.options.getRole('initiate');
    const operative = interaction.options.getRole('operative');
    const specialist = interaction.options.getRole('specialist');
    const veteran = interaction.options.getRole('veteran');
    const elite = interaction.options.getRole('elite');

    const operativeXP = interaction.options.getInteger('operative_xp') || 500;
    const specialistXP = interaction.options.getInteger('specialist_xp') || 2000;
    const veteranXP = interaction.options.getInteger('veteran_xp') || 5000;
    const eliteXP = interaction.options.getInteger('elite_xp') || 10000;

    const sync = interaction.options.getBoolean('sync') || false;

    // Defer if syncing (potentially long operation)
    if (sync) {
      await interaction.deferReply();
    }

    try {
      // Define 5 rank configurations
      const rankConfigs = [
        { level: 1, name: 'Initiate', required_xp: 0, role_id: initiate.id },
        { level: 2, name: 'Operative', required_xp: operativeXP, role_id: operative.id },
        { level: 3, name: 'Specialist', required_xp: specialistXP, role_id: specialist.id },
        { level: 4, name: 'Veteran', required_xp: veteranXP, role_id: veteran.id },
        { level: 5, name: 'Elite', required_xp: eliteXP, role_id: elite.id },
      ];

      let createdCount = 0;
      let updatedCount = 0;

      // Create or update rank configurations
      for (const rankConfig of rankConfigs) {
        const existing = await db.Levels.findOne({
          where: { guild_id: interaction.guild.id, level: rankConfig.level },
        });

        if (existing) {
          existing.name = rankConfig.name;
          existing.required_xp = rankConfig.required_xp;
          existing.role_id = rankConfig.role_id;
          await existing.save();
          updatedCount++;
        } else {
          await db.Levels.create({
            guild_id: interaction.guild.id,
            ...rankConfig,
          });
          createdCount++;
        }
      }

      // Sync existing users' rank roles
      let syncedCount = 0;
      if (sync) {
        const users = await db.Users.findAll({
          where: { guild_id: interaction.guild.id },
        });

        for (const user of users) {
          try {
            const result = await checkAndAssignRankRoles(interaction.guild, user);
            if (result) syncedCount++;
          } catch (err) {
            Logger.error(`Failed to sync ranks for ${user.user_id}: ${err.message}`);
          }
        }
      }

      // Create configuration summary
      const ranksSummary = rankConfigs
        .map(r => {
          const role = interaction.guild.roles.cache.get(r.role_id);
          const roleName = role ? role.name : 'Unknown role';
          return `**${r.name}** (Level ${r.level})\n   └ Role: ${roleName} | Required XP: ${r.required_xp}`;
        })
        .join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(config.bot.successColor)
        .setTitle('✅ 5-Rank System Setup Complete')
        .setDescription('Rank system configuration complete!')
        .addFields(
          { name: 'Created', value: createdCount.toString(), inline: true },
          { name: 'Updated', value: updatedCount.toString(), inline: true },
          { name: 'Users Synced', value: sync ? syncedCount.toString() : 'Not synced', inline: true },
        )
        .addFields({
          name: 'Rank Configuration',
          value: ranksSummary.substring(0, 4000),
          inline: false,
        })
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      if (sync) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed] });
      }

      Logger.info(`5-rank system setup by ${interaction.user.tag}: ${createdCount} created, ${updatedCount} updated, ${syncedCount} synced`);
    } catch (error) {
      Logger.error(`Failed to setup ranks: ${error.message}`);
      const errorMsg = { content: 'Failed to setup rank system', ephemeral: true };
      if (sync) {
        await interaction.editReply(errorMsg).catch(() => {});
      } else {
        await interaction.reply(errorMsg).catch(() => {});
      }
    }
  },
};

async function checkAndAssignRankRoles(guild, user) {
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
    Logger.error(`Failed to check rank roles for user ${user.user_id}: ${error.message}`);
    return false;
  }
}
