// src/commands/utility/event.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Manage events')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create event')
        .addStringOption((option) =>
          option
            .setName('title')
            .setDescription('Event title')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('description')
            .setDescription('Event description')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('start_time')
            .setDescription('Start time (format: YYYY-MM-DD HH:mm)')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('end_time')
            .setDescription('End time (format: YYYY-MM-DD HH:mm)')
            .setRequired(false)
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Event channel')
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName('max_participants')
            .setDescription('Maximum participants')
            .setRequired(false)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('join')
        .setDescription('Join event')
        .addIntegerOption((option) =>
          option
            .setName('id')
            .setDescription('Event ID')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('leave')
        .setDescription('Leave event')
        .addIntegerOption((option) =>
          option
            .setName('id')
            .setDescription('Event ID')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription('List all events')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('info')
        .setDescription('View event details')
        .addIntegerOption((option) =>
          option
            .setName('id')
            .setDescription('Event ID')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'create':
        await createEvent(interaction);
        break;
      case 'join':
        await joinEvent(interaction);
        break;
      case 'leave':
        await leaveEvent(interaction);
        break;
      case 'list':
        await listEvents(interaction);
        break;
      case 'info':
        await showEventInfo(interaction);
        break;
    }
  },
};

async function createEvent(interaction) {
  const title = interaction.options.getString('title');
  const description = interaction.options.getString('description') || '';
  const startTimeStr = interaction.options.getString('start_time');
  const endTimeStr = interaction.options.getString('end_time');
  const channel = interaction.options.getChannel('channel');
  const maxParticipants = interaction.options.getInteger('max_participants');

  try {
    const startTime = new Date(startTimeStr);
    if (isNaN(startTime.getTime())) {
      await interaction.reply({
        content: 'Invalid start time format, please use YYYY-MM-DD HH:mm',
        ephemeral: true,
      });
      return;
    }

    let endTime = null;
    if (endTimeStr) {
      endTime = new Date(endTimeStr);
      if (isNaN(endTime.getTime())) {
        await interaction.reply({
          content: 'Invalid end time format, please use YYYY-MM-DD HH:mm',
          ephemeral: true,
        });
        return;
      }
    }

    const event = await db.Events.create({
      guild_id: interaction.guild.id,
      creator_id: interaction.user.id,
      title: title,
      description: description,
      start_time: startTime,
      end_time: endTime,
      channel_id: channel ? channel.id : null,
      max_participants: maxParticipants,
      is_active: true,
    });

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('📅 Event Created')
      .setDescription(`Event ID: ${event.id}`)
      .addFields(
        { name: 'Title', value: title, inline: false },
        { name: 'Start Time', value: `<t:${Math.floor(startTime.getTime() / 1000)}:F>`, inline: true },
        { name: 'Creator', value: interaction.user.tag, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    if (description) {
      embed.addFields({ name: 'Description', value: description, inline: false });
    }

    if (endTime) {
      embed.addFields({ name: 'End Time', value: `<t:${Math.floor(endTime.getTime() / 1000)}:F>`, inline: true });
    }

    if (channel) {
      embed.addFields({ name: 'Channel', value: `<#${channel.id}>`, inline: true });
    }

    if (maxParticipants) {
      embed.addFields({ name: 'Max Participants', value: maxParticipants.toString(), inline: true });
    }

    await interaction.reply({ embeds: [embed] });

    Logger.info(`Event created by ${interaction.user.tag}: ${title}`);
  } catch (error) {
    Logger.error(`Failed to create event: ${error.message}`);
    await interaction.reply({
      content: 'Failed to create event',
      ephemeral: true,
    });
  }
}

async function joinEvent(interaction) {
  const eventId = interaction.options.getInteger('id');

  try {
    const event = await db.Events.findOne({
      where: { id: eventId, guild_id: interaction.guild.id, is_active: true },
    });

    if (!event) {
      await interaction.reply({
        content: 'Cannot find specified event',
        ephemeral: true,
      });
      return;
    }

    // Check if already joined
    const existing = await db.EventParticipants.findOne({
      where: { event_id: eventId, user_id: interaction.user.id },
    });

    if (existing) {
      await interaction.reply({
        content: 'You have already joined this event',
        ephemeral: true,
      });
      return;
    }

    // Check participant limit
    if (event.max_participants) {
      const count = await db.EventParticipants.count({
        where: { event_id: eventId },
      });

      if (count >= event.max_participants) {
        await interaction.reply({
          content: 'Event is full',
          ephemeral: true,
        });
        return;
      }
    }

    await db.EventParticipants.create({
      event_id: eventId,
      user_id: interaction.user.id,
      status: 'going',
    });

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Joined Event')
      .setDescription(`You have successfully joined the event: ${event.title}`)
      .addFields(
        { name: 'Event ID', value: eventId.toString(), inline: true },
        { name: 'Start Time', value: `<t:${Math.floor(event.start_time.getTime() / 1000)}:F>`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });

    Logger.info(`${interaction.user.tag} joined event ${eventId}`);
  } catch (error) {
    Logger.error(`Failed to join event: ${error.message}`);
    await interaction.reply({
      content: 'Failed to join event',
      ephemeral: true,
    });
  }
}

async function leaveEvent(interaction) {
  const eventId = interaction.options.getInteger('id');

  try {
    const event = await db.Events.findOne({
      where: { id: eventId, guild_id: interaction.guild.id },
    });

    if (!event) {
      await interaction.reply({
        content: 'Cannot find specified event',
        ephemeral: true,
      });
      return;
    }

    await db.EventParticipants.destroy({
      where: { event_id: eventId, user_id: interaction.user.id },
    });

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Left Event')
      .setDescription(`You have left the event: ${event.title}`)
      .addFields(
        { name: 'Event ID', value: eventId.toString(), inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });

    Logger.info(`${interaction.user.tag} left event ${eventId}`);
  } catch (error) {
    Logger.error(`Failed to leave event: ${error.message}`);
    await interaction.reply({
      content: 'Failed to leave event',
      ephemeral: true,
    });
  }
}

async function listEvents(interaction) {
  try {
    const events = await db.Events.findAll({
      where: {
        guild_id: interaction.guild.id,
        is_active: true,
        start_time: {
          [db.Sequelize.Op.gte]: new Date(),
        },
      },
      order: [['start_time', 'ASC']],
    });

    if (events.length === 0) {
      await interaction.reply({
        content: 'No upcoming events',
        ephemeral: true,
      });
      return;
    }

    const eventsList = await Promise.all(
      events.map(async (event) => {
        const participantCount = await db.EventParticipants.count({
          where: { event_id: event.id },
        });

        return `${event.id}. **${event.title}**\n   └ Start: <t:${Math.floor(event.start_time.getTime() / 1000)}:F> | Participants: ${participantCount}`;
      })
    );

    const embed = new EmbedBuilder()
      .setColor(config.bot.infoColor)
      .setTitle('📅 Upcoming Events')
      .setDescription(eventsList.join('\n\n'))
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    Logger.error(`Failed to list events: ${error.message}`);
    await interaction.reply({
      content: 'Failed to get event list',
      ephemeral: true,
    });
  }
}

async function showEventInfo(interaction) {
  const eventId = interaction.options.getInteger('id');

  try {
    const event = await db.Events.findOne({
      where: { id: eventId, guild_id: interaction.guild.id },
    });

    if (!event) {
      await interaction.reply({
        content: 'Cannot find specified event',
        ephemeral: true,
      });
      return;
    }

    const participants = await db.EventParticipants.findAll({
      where: { event_id: eventId },
    });

    const embed = new EmbedBuilder()
      .setColor(config.bot.infoColor)
      .setTitle(`📅 ${event.title}`)
      .setDescription(event.description || 'No description')
      .addFields(
        { name: 'Event ID', value: event.id.toString(), inline: true },
        { name: 'Creator', value: `<@${event.creator_id}>`, inline: true },
        { name: 'Start Time', value: `<t:${Math.floor(event.start_time.getTime() / 1000)}:F>`, inline: true },
        { name: 'Participants', value: `${participants.length}`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    if (event.end_time) {
      embed.addFields({
        name: 'End Time',
        value: `<t:${Math.floor(event.end_time.getTime() / 1000)}:F>`,
        inline: true,
      });
    }

    if (event.channel_id) {
      embed.addFields({
        name: 'Channel',
        value: `<#${event.channel_id}>`,
        inline: true,
      });
    }

    if (event.max_participants) {
      embed.addFields({
        name: 'Max Participants',
        value: `${participants.length}/${event.max_participants}`,
        inline: true,
      });
    }

    if (participants.length > 0) {
      const participantList = participants
        .map(p => `<@${p.user_id}>`)
        .join(', ')
        .substring(0, 1000);

      embed.addFields({
        name: 'Participants',
        value: participantList,
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    Logger.error(`Failed to show event info: ${error.message}`);
    await interaction.reply({
      content: 'Failed to get event information',
      ephemeral: true,
    });
  }
}
