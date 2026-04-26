// src/commands/utility/rewards.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rewards')
    .setDescription('Manage level rewards')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('show')
        .setDescription('Show current reward configuration')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add level reward')
        .addIntegerOption((option) =>
          option
            .setName('level')
            .setDescription('Level')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('Reward type')
            .setRequired(true)
            .addChoices(
              { name: 'Role', value: 'role' },
              { name: 'Message', value: 'message' },
              { name: 'Custom', value: 'custom' },
            )
        )
        .addStringOption((option) =>
          option
            .setName('description')
            .setDescription('Reward description')
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName('role')
            .setDescription('Role (for role rewards)')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('message')
            .setDescription('Reward message (for message rewards)')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('data')
            .setDescription('Custom data (JSON format)')
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Delete reward')
        .addIntegerOption((option) =>
          option
            .setName('id')
            .setDescription('Reward ID')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('claim')
        .setDescription('Claim level reward')
        .addIntegerOption((option) =>
          option
            .setName('level')
            .setDescription('Level to claim reward for')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('List claimable rewards')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'show':
        await showRewards(interaction);
        break;
      case 'add':
        await addReward(interaction);
        break;
      case 'remove':
        await removeReward(interaction);
        break;
      case 'claim':
        await claimReward(interaction);
        break;
      case 'list':
        await listClaimableRewards(interaction);
        break;
    }
  },
};

async function showRewards(interaction) {
  try {
    const levelConfigs = await db.Levels.findAll({
      where: { guild_id: interaction.guild.id },
      order: [['level', 'ASC']],
    });

    if (levelConfigs.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(config.bot.infoColor)
        .setTitle('🎁 Reward Configuration')
        .setDescription('No reward configuration')
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    const rewardsList = levelConfigs
      .filter(lc => lc.rewards && lc.rewards.length > 0)
      .map(lc => {
        const rewardsText = lc.rewards
          .map(r => `• ${r.description}`)
          .join('\n');
        return `**Level ${lc.level}** - ${lc.name}\n${rewardsText}`;
      })
      .join('\n\n');

    if (!rewardsList) {
      await interaction.reply({
        content: 'No reward configuration',
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(config.bot.infoColor)
      .setTitle('🎁 Reward Configuration')
      .setDescription(rewardsList.substring(0, 4000))
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    Logger.error(`Failed to show rewards: ${error.message}`);
    await interaction.reply({
      content: 'Failed to get reward configuration',
      ephemeral: true,
    });
  }
}

async function addReward(interaction) {
  const level = interaction.options.getInteger('level');
  const type = interaction.options.getString('type');
  const description = interaction.options.getString('description');
  const role = interaction.options.getRole('role');
  const message = interaction.options.getString('message');
  const data = interaction.options.getString('data');

  try {
    let levelConfig = await db.Levels.findOne({
      where: { guild_id: interaction.guild.id, level: level },
    });

    if (!levelConfig) {
      await interaction.reply({
        content: 'This level does not exist, please use /levelroles add to create it first',
        ephemeral: true,
      });
      return;
    }

    // Create reward object
    const reward = {
      type: type,
      description: description,
    };

    if (type === 'role' && role) {
      reward.roleId = role.id;
    } else if (type === 'message' && message) {
      reward.message = message;
    } else if (type === 'custom' && data) {
      try {
        reward.data = JSON.parse(data);
      } catch (error) {
        await interaction.reply({
          content: 'Custom data must be valid JSON format',
          ephemeral: true,
        });
        return;
      }
    }

    // Add to rewards list
    if (!levelConfig.rewards) {
      levelConfig.rewards = [];
    }
    levelConfig.rewards.push(reward);
    await levelConfig.save();

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Reward Added')
      .setDescription(`Level ${level} - ${description}`)
      .addFields(
        { name: 'Type', value: type, inline: true },
        { name: 'Level', value: level.toString(), inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });

    Logger.info(`Reward added: Level ${level} - ${description} by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to add reward: ${error.message}`);
    await interaction.reply({
      content: 'Failed to add reward',
      ephemeral: true,
    });
  }
}

async function removeReward(interaction) {
  const rewardId = interaction.options.getInteger('id');

  try {
    // Find level containing the reward
    const levelConfigs = await db.Levels.findAll({
      where: { guild_id: interaction.guild.id },
    });

    let found = false;
    for (const levelConfig of levelConfigs) {
      if (levelConfig.rewards && levelConfig.rewards.length > rewardId) {
        const removed = levelConfig.rewards.splice(rewardId, 1)[0];
        await levelConfig.save();
        found = true;

        const embed = new EmbedBuilder()
          .setColor(config.bot.successColor)
          .setTitle('✅ Reward Deleted')
          .setDescription(`Level ${levelConfig.level} - ${removed.description}`)
          .setTimestamp()
          .setFooter({ text: config.bot.name });

        await interaction.reply({ embeds: [embed] });
        break;
      }
    }

    if (!found) {
      await interaction.reply({
        content: 'Cannot find specified reward',
        ephemeral: true,
      });
    }
  } catch (error) {
    Logger.error(`Failed to remove reward: ${error.message}`);
    await interaction.reply({
      content: 'Failed to remove reward',
      ephemeral: true,
    });
  }
}

async function claimReward(interaction) {
  const level = interaction.options.getInteger('level');

  try {
    const user = await db.Users.findOne({
      where: { user_id: interaction.user.id, guild_id: interaction.guild.id },
    });

    if (!user) {
      await interaction.reply({
        content: 'You don\'t have a level record yet',
        ephemeral: true,
      });
      return;
    }

    if (user.level < level) {
      await interaction.reply({
        content: `You need to reach level ${level} to claim this reward`,
        ephemeral: true,
      });
      return;
    }

    const levelConfig = await db.Levels.findOne({
      where: { guild_id: interaction.guild.id, level: level },
    });

    if (!levelConfig || !levelConfig.rewards || levelConfig.rewards.length === 0) {
      await interaction.reply({
        content: 'This level has no claimable rewards',
        ephemeral: true,
      });
      return;
    }

    // Process all rewards
    const claimedRewards = [];
    for (const reward of levelConfig.rewards) {
      try {
        if (reward.type === 'role' && reward.roleId) {
          const member = await interaction.guild.members.fetch(interaction.user.id);
          if (!member.roles.cache.has(reward.roleId)) {
            await member.roles.add(reward.roleId);
            claimedRewards.push(`Role: <@&${reward.roleId}>`);
          }
        } else if (reward.type === 'message' && reward.message) {
          claimedRewards.push(`Message: ${reward.message}`);
        } else if (reward.type === 'custom') {
          claimedRewards.push(`Custom: ${reward.description}`);
        }
      } catch (error) {
        Logger.error(`Failed to process reward: ${error.message}`);
      }
    }

    if (claimedRewards.length === 0) {
      await interaction.reply({
        content: 'You have already claimed this reward',
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('🎉 Reward Claimed')
      .setDescription(`Congratulations! You have claimed the level ${level} reward!`)
      .addFields(
        { name: 'Claimed Rewards', value: claimedRewards.join('\n'), inline: false },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });

    Logger.info(`${interaction.user.tag} claimed rewards for level ${level}`);
  } catch (error) {
    Logger.error(`Failed to claim reward: ${error.message}`);
    await interaction.reply({
      content: 'Failed to claim reward',
      ephemeral: true,
    });
  }
}

async function listClaimableRewards(interaction) {
  try {
    const user = await db.Users.findOne({
      where: { user_id: interaction.user.id, guild_id: interaction.guild.id },
    });

    if (!user) {
      await interaction.reply({
        content: 'You don\'t have a level record yet',
        ephemeral: true,
      });
      return;
    }

    const levelConfigs = await db.Levels.findAll({
      where: {
        guild_id: interaction.guild.id,
        level: { [db.Sequelize.Op.lte]: user.level },
      },
      order: [['level', 'ASC']],
    });

    const claimableRewards = levelConfigs
      .filter(lc => lc.rewards && lc.rewards.length > 0)
      .map(lc => {
        const rewardsText = lc.rewards
          .map(r => `• ${r.description}`)
          .join('\n');
        return `**Level ${lc.level}** - ${lc.name}\n${rewardsText}`;
      })
      .join('\n\n');

    if (!claimableRewards) {
      await interaction.reply({
        content: 'No claimable rewards',
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(config.bot.infoColor)
      .setTitle('🎁 Claimable Rewards')
      .setDescription(claimableRewards.substring(0, 4000))
      .addFields(
        { name: 'Current Level', value: user.level.toString(), inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    Logger.error(`Failed to list claimable rewards: ${error.message}`);
    await interaction.reply({
      content: 'Failed to get claimable rewards',
      ephemeral: true,
    });
  }
}
