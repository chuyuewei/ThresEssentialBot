// src/commands/utility/vote.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vote')
    .setDescription('Create vote')
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('Vote title')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('options')
        .setDescription('Vote options (comma separated, max 10)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('description')
        .setDescription('Vote description')
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('anonymous')
        .setDescription('Anonymous vote')
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName('multiple')
        .setDescription('Allow multiple selections')
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('duration')
        .setDescription('Vote duration in hours (0 for permanent)')
        .setRequired(false)
        .setMinValue(0)
    ),

  async execute(interaction) {
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description') || '';
    const optionsStr = interaction.options.getString('options');
    const isAnonymous = interaction.options.getBoolean('anonymous') || false;
    const allowMultiple = interaction.options.getBoolean('multiple') || false;
    const duration = interaction.options.getInteger('duration') || 0;

    // Parse options
    const options = optionsStr.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);

    if (options.length < 2) {
      await interaction.reply({
        content: 'At least 2 options are required',
        ephemeral: true,
      });
      return;
    }

    if (options.length > 10) {
      await interaction.reply({
        content: 'Maximum 10 options supported',
        ephemeral: true,
      });
      return;
    }

    try {
      // Create option objects
      const voteOptions = options.map((label, index) => ({
        id: `opt_${index}`,
        label: label,
        count: 0,
      }));

      // Calculate end time
      let endsAt = null;
      if (duration > 0) {
        endsAt = new Date(Date.now() + duration * 60 * 60 * 1000);
      }

      // Create vote message
      const embed = new EmbedBuilder()
        .setColor(config.bot.infoColor)
        .setTitle(`🗳️ ${title}`)
        .setDescription(description)
        .addFields(
          { name: 'Options', value: options.map((opt, i) => `${i + 1}. ${opt}`).join('\n'), inline: false },
          { name: 'Vote Type', value: isAnonymous ? 'Anonymous' : 'Public', inline: true },
          { name: 'Multiple', value: allowMultiple ? 'Allowed' : 'Not Allowed', inline: true },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      if (endsAt) {
        embed.addFields({
          name: 'End Time',
          value: `<t:${Math.floor(endsAt.getTime() / 1000)}:F>`,
          inline: true,
        });
      }

      // Create select menu
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`vote_${Date.now()}`)
        .setPlaceholder('Select your vote option')
        .addOptions(
          options.map((opt, index) => ({
            label: opt.substring(0, 100),
            value: `opt_${index}`,
            description: `Vote option ${index + 1}`,
          }))
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const message = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true,
      });

      // Save to database
      const vote = await db.Votes.create({
        guild_id: interaction.guild.id,
        channel_id: interaction.channelId,
        message_id: message.id,
        creator_id: interaction.user.id,
        title: title,
        description: description,
        options: voteOptions,
        is_anonymous: isAnonymous,
        allow_multiple: allowMultiple,
        ends_at: endsAt,
        is_active: true,
      });

      // Update select menu's customId
      selectMenu.setCustomId(`vote_${vote.id}`);

      await message.edit({
        components: [row],
      });

      Logger.info(`Vote created by ${interaction.user.tag}: ${title}`);
    } catch (error) {
      Logger.error(`Failed to create vote: ${error.message}`);
      await interaction.reply({
        content: 'Failed to create vote',
        ephemeral: true,
      });
    }
  },
};
