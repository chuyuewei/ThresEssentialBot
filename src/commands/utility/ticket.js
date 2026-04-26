// src/commands/utility/ticket.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket system')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setup')
        .setDescription('Setup ticket system')
        .addChannelOption((option) =>
          option
            .setName('category')
            .setDescription('Ticket category')
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName('support_role')
            .setDescription('Support role')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('title')
            .setDescription('Ticket panel title')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('description')
            .setDescription('Ticket panel description')
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create ticket')
        .addStringOption((option) =>
          option
            .setName('subject')
            .setDescription('Ticket subject')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('description')
            .setDescription('Ticket description')
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('close')
        .setDescription('Close ticket')
        .addStringOption((option) =>
          option
            .setName('reason')
            .setDescription('Close reason')
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add user to ticket')
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('User to add')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove user from ticket')
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('User to remove')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('transcript')
        .setDescription('Generate ticket transcript')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'setup':
        await setupTicketSystem(interaction);
        break;
      case 'create':
        await createTicket(interaction);
        break;
      case 'close':
        await closeTicket(interaction);
        break;
      case 'add':
        await addUserToTicket(interaction);
        break;
      case 'remove':
        await removeUserFromTicket(interaction);
        break;
      case 'transcript':
        await generateTranscript(interaction);
        break;
    }
  },
};

async function setupTicketSystem(interaction) {
  const category = interaction.options.getChannel('category');
  const supportRole = interaction.options.getRole('support_role');
  const title = interaction.options.getString('title') || '🎫 Need Help?';
  const description = interaction.options.getString('description') || 'Click the button below to create a new ticket, our support team will respond as soon as possible';

  try {
    // Save configuration to database or config file
    if (!config.ticketConfig) {
      config.ticketConfig = {};
    }
    config.ticketConfig[interaction.guild.id] = {
      categoryId: category.id,
      supportRoleId: supportRole.id,
      title: title,
      description: description,
    };

    // Create ticket panel
    const embed = new EmbedBuilder()
      .setColor(config.bot.infoColor)
      .setTitle(title)
      .setDescription(description)
      .addFields(
        { name: '📝 How to Use', value: 'Click the button below to create a ticket, support staff will respond to you as soon as possible', inline: false },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_create')
          .setLabel('🎫 Create Ticket')
          .setStyle(ButtonStyle.Primary),
      );

    const message = await interaction.channel.send({
      embeds: [embed],
      components: [row],
    });

    const replyEmbed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Ticket System Setup')
      .setDescription('Ticket panel has been created')
      .addFields(
        { name: 'Category', value: `<#${category.id}>`, inline: true },
        { name: 'Support Role', value: `${supportRole}`, inline: true },
        { name: 'Panel Message ID', value: message.id, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [replyEmbed] });

    Logger.info(`Ticket system setup by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to setup ticket system: ${error.message}`);
    await interaction.reply({
      content: 'Failed to setup ticket system',
      ephemeral: true,
    });
  }
}

async function createTicket(interaction) {
  const subject = interaction.options.getString('subject');
  const description = interaction.options.getString('description') || 'No description';

  try {
    const ticketConfig = config.ticketConfig?.[interaction.guild.id];
    if (!ticketConfig) {
      await interaction.reply({
        content: 'Ticket system not set up, please contact an administrator',
        ephemeral: true,
      });
      return;
    }

    // Check if user already has a ticket
    const existingTicket = await db.Tickets.findOne({
      where: {
        user_id: interaction.user.id,
        guild_id: interaction.guild.id,
        status: 'open',
      },
    });

    if (existingTicket) {
      await interaction.reply({
        content: `You already have a ticket <#${existingTicket.channel_id}>, please close it or wait for it to be processed`,
        ephemeral: true,
      });
      return;
    }

    // Create ticket channel
    const category = interaction.guild.channels.cache.get(ticketConfig.categoryId);
    if (!category) {
      await interaction.reply({
        content: 'Cannot find ticket category',
        ephemeral: true,
      });
      return;
    }

    const ticketNumber = await getNextTicketNumber(interaction.guild.id);
    const channelName = `ticket-${ticketNumber}-${interaction.user.username}`;

    const ticketChannel = await interaction.guild.channels.create({
      name: channelName,
      type: 0, // Text channel
      parent: category,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: ['ViewChannel'],
        },
        {
          id: interaction.user.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
        {
          id: ticketConfig.supportRoleId,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
        {
          id: interaction.client.user.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
      ],
    });

    // Save ticket to database
    const ticket = await db.Tickets.create({
      guild_id: interaction.guild.id,
      user_id: interaction.user.id,
      channel_id: ticketChannel.id,
      subject: subject,
      description: description,
      status: 'open',
      ticket_number: ticketNumber,
    });

    // Create ticket message
    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle(`🎫 Ticket #${ticketNumber}`)
      .setDescription(`**Subject**: ${subject}\n**Description**: ${description}`)
      .addFields(
        { name: 'Creator', value: `${interaction.user}`, inline: true },
        { name: 'Status', value: '🟢 Open', inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_close_${ticket.id}`)
          .setLabel('🔒 Close Ticket')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`ticket_transcript_${ticket.id}`)
          .setLabel('📄 Generate Transcript')
          .setStyle(ButtonStyle.Secondary),
      );

    await ticketChannel.send({
      content: `<@${interaction.user.id}> <@&${ticketConfig.supportRoleId}>`,
      embeds: [embed],
      components: [row],
    });

    const replyEmbed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ Ticket Created')
      .setDescription(`Your ticket #${ticketNumber} has been created`)
      .addFields(
        { name: 'Channel', value: `<#${ticketChannel.id}>`, inline: true },
        { name: 'Subject', value: subject, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [replyEmbed] });

    Logger.info(`Ticket #${ticketNumber} created by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to create ticket: ${error.message}`);
    await interaction.reply({
      content: 'Failed to create ticket',
      ephemeral: true,
    });
  }
}

async function closeTicket(interaction) {
  const reason = interaction.options.getString('reason') || 'Ticket closed';

  try {
    // Check if in ticket channel
    const ticket = await db.Tickets.findOne({
      where: {
        channel_id: interaction.channelId,
        guild_id: interaction.guild.id,
        status: 'open',
      },
    });

    if (!ticket) {
      await interaction.reply({
        content: 'This channel is not a ticket channel or ticket is already closed',
        ephemeral: true,
      });
      return;
    }

    // Update ticket status
    await ticket.update({
      status: 'closed',
      closed_at: new Date(),
      closed_by: interaction.user.id,
      close_reason: reason,
    });

    // Lock channel
    await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false });
    await interaction.channel.permissionOverwrites.edit(ticket.user_id, { ViewChannel: false, SendMessages: false });

    const embed = new EmbedBuilder()
      .setColor(config.bot.warnColor)
      .setTitle('🔒 Ticket Closed')
      .setDescription(`Ticket #${ticket.ticket_number} has been closed`)
      .addFields(
        { name: 'Close Reason', value: reason, inline: false },
        { name: 'Closed By', value: `${interaction.user}`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });

    Logger.info(`Ticket #${ticket.ticket_number} closed by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to close ticket: ${error.message}`);
    await interaction.reply({
      content: 'Failed to close ticket',
      ephemeral: true,
    });
  }
}

async function addUserToTicket(interaction) {
  const user = interaction.options.getUser('user');

  try {
    const ticket = await db.Tickets.findOne({
      where: {
        channel_id: interaction.channelId,
        guild_id: interaction.guild.id,
        status: 'open',
      },
    });

    if (!ticket) {
      await interaction.reply({
        content: 'This channel is not a ticket channel or ticket is already closed',
        ephemeral: true,
      });
      return;
    }

    // Add user to channel
    await interaction.channel.permissionOverwrites.edit(user.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ User Added')
      .setDescription(`${user} has been added to this ticket`)
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });

    Logger.info(`User ${user.tag} added to ticket #${ticket.ticket_number} by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to add user to ticket: ${error.message}`);
    await interaction.reply({
      content: 'Failed to add user',
      ephemeral: true,
    });
  }
}

async function removeUserFromTicket(interaction) {
  const user = interaction.options.getUser('user');

  try {
    const ticket = await db.Tickets.findOne({
      where: {
        channel_id: interaction.channelId,
        guild_id: interaction.guild.id,
        status: 'open',
      },
    });

    if (!ticket) {
      await interaction.reply({
        content: 'This channel is not a ticket channel or ticket is already closed',
        ephemeral: true,
      });
      return;
    }

    // Remove user from channel
    await interaction.channel.permissionOverwrites.edit(user.id, {
      ViewChannel: false,
      SendMessages: false,
    });

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('✅ User Removed')
      .setDescription(`${user} has been removed from this ticket`)
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });

    Logger.info(`User ${user.tag} removed from ticket #${ticket.ticket_number} by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to remove user from ticket: ${error.message}`);
    await interaction.reply({
      content: 'Failed to remove user',
      ephemeral: true,
    });
  }
}

async function generateTranscript(interaction) {
  try {
    const ticket = await db.Tickets.findOne({
      where: {
        channel_id: interaction.channelId,
        guild_id: interaction.guild.id,
      },
    });

    if (!ticket) {
      await interaction.reply({
        content: 'This channel is not a ticket channel',
        ephemeral: true,
      });
      return;
    }

    // Get channel messages
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const transcript = messages
      .reverse()
      .map(msg => {
        const timestamp = new Date(msg.createdTimestamp).toLocaleString();
        const author = msg.author.tag;
        const content = msg.content || '[Attachment or embed]';
        return `[${timestamp}] ${author}: ${content}`;
      })
      .join('\n');

    // Create transcript file
    const transcriptBuffer = Buffer.from(transcript, 'utf-8');

    const embed = new EmbedBuilder()
      .setColor(config.bot.infoColor)
      .setTitle('📄 Ticket Transcript')
      .setDescription(`Transcript for ticket #${ticket.ticket_number} has been generated`)
      .addFields(
        { name: 'Ticket Subject', value: ticket.subject, inline: true },
        { name: 'Message Count', value: messages.size.toString(), inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({
      embeds: [embed],
      files: [
        {
          attachment: transcriptBuffer,
          name: `ticket-${ticket.ticket_number}-transcript.txt`,
        },
      ],
    });

    Logger.info(`Transcript generated for ticket #${ticket.ticket_number} by ${interaction.user.tag}`);
  } catch (error) {
    Logger.error(`Failed to generate transcript: ${error.message}`);
    await interaction.reply({
      content: 'Failed to generate transcript',
      ephemeral: true,
    });
  }
}

async function getNextTicketNumber(guildId) {
  try {
    const lastTicket = await db.Tickets.findOne({
      where: { guild_id: guildId },
      order: [['ticket_number', 'DESC']],
    });

    return lastTicket ? lastTicket.ticket_number + 1 : 1;
  } catch (error) {
    Logger.error(`Failed to get next ticket number: ${error.message}`);
    return 1;
  }
}
