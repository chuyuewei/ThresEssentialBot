// src/events/interactionCreate.js
const { Events, EmbedBuilder } = require('discord.js');
const Logger = require('../utils/logger');
const config = require('../../config');
const db = require('../database/models');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        Logger.warn(`Unknown command: ${interaction.commandName}`);
        return;
      }

      try {
        Logger.command(interaction.user.tag, interaction.commandName);
        await command.execute(interaction);
      } catch (error) {
        Logger.error(`Error executing /${interaction.commandName}: ${error.message}`);
        console.error(error);

        const errorEmbed = new EmbedBuilder()
          .setColor(config.bot.errorColor)
          .setTitle('❌ Command Execution Failed')
          .setDescription('An error occurred while executing the command, please try again later')
          .setTimestamp()
          .setFooter({ text: config.bot.name });

        const reply = { embeds: [errorEmbed], ephemeral: true };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply).catch(() => {});
        } else {
          await interaction.reply(reply).catch(() => {});
        }
      }
    }
    // Handle button interactions (check specific IDs first)
    else if (interaction.isButton()) {
      const { customId } = interaction;

      if (customId.startsWith('report_')) {
        await handleReportButton(interaction);
      } else if (customId.startsWith('ticket_')) {
        await handleTicketButton(interaction);
      } else {
        // Generic button handler (rules, etc.)
        await handleButtonInteraction(interaction);
      }
    }
    // Handle select menu interactions
    else if (interaction.isStringSelectMenu()) {
      await handleSelectMenuInteraction(interaction);
    }
    // Handle modal submissions
    else if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
    }
  },
};

async function handleButtonInteraction(interaction) {
  const { customId } = interaction;

  try {
    // Handle rules confirmation buttons
    if (customId === 'rules_accept') {
      await handleRulesAccept(interaction);
    } else if (customId === 'rules_decline') {
      await handleRulesDecline(interaction);
    } else {
      // Unknown button - acknowledge to prevent interaction timeout
      await interaction.reply({ content: 'This button is no longer active.', ephemeral: true }).catch(() => {});
    }
  } catch (error) {
    Logger.error(`Error handling button interaction ${customId}: ${error.message}`);
    console.error(error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'An error occurred.', ephemeral: true }).catch(() => {});
    }
  }
}

/**
 * Handle modal submissions
 */
async function handleModalSubmit(interaction) {
  const { customId } = interaction;

  try {
    if (customId === 'ticket_create_modal') {
      await handleTicketModalSubmit(interaction);
    } else {
      await interaction.reply({ content: 'Unknown modal submission.', ephemeral: true }).catch(() => {});
    }
  } catch (error) {
    Logger.error(`Error handling modal submission ${customId}: ${error.message}`);
    console.error(error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Failed to process submission.', ephemeral: true }).catch(() => {});
    }
  }
}

/**
 * Handle ticket creation modal submission
 */
async function handleTicketModalSubmit(interaction) {
  const subject = interaction.fields.getTextInputValue('subject');
  const description = interaction.fields.getTextInputValue('description') || 'No description';

  await interaction.deferReply({ ephemeral: true });

  try {
    const ticketConfig = config.ticketConfig?.[interaction.guild.id];
    if (!ticketConfig) {
      await interaction.editReply({ content: 'Ticket system is not set up. Please contact an administrator.' });
      return;
    }

    // Check if user already has an open ticket
    const existingTicket = await db.Tickets.findOne({
      where: { user_id: interaction.user.id, guild_id: interaction.guild.id, status: 'open' },
    });

    if (existingTicket) {
      await interaction.editReply({ content: `You already have an open ticket: <#${existingTicket.channel_id}>. Please close it first.` });
      return;
    }

    // Get ticket config
    const category = interaction.guild.channels.cache.get(ticketConfig.categoryId);
    if (!category) {
      await interaction.editReply({ content: 'Cannot find the ticket category. Please contact an administrator.' });
      return;
    }

    // Get next ticket number
    const lastTicket = await db.Tickets.findOne({
      where: { guild_id: interaction.guild.id },
      order: [['ticket_number', 'DESC']],
    });
    const ticketNumber = lastTicket ? lastTicket.ticket_number + 1 : 1;

    // Create ticket channel
    const channelName = `ticket-${ticketNumber}-${interaction.user.username}`.substring(0, 100).replace(/[^a-z0-9\-]/gi, '-').toLowerCase();
    const ticketChannel = await interaction.guild.channels.create({
      name: channelName,
      type: 0,
      parent: category,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: ['ViewChannel'] },
        { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
        { id: ticketConfig.supportRoleId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
        { id: interaction.client.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
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

    // Create ticket panel message in the channel
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

    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`ticket_close_${ticket.id}`).setLabel('🔒 Close Ticket').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`ticket_transcript_${ticket.id}`).setLabel('📄 Generate Transcript').setStyle(ButtonStyle.Secondary),
    );

    await ticketChannel.send({ content: `<@${interaction.user.id}> <@&${ticketConfig.supportRoleId}>`, embeds: [embed], components: [row] });

    await interaction.editReply({ content: `✅ Your ticket #${ticketNumber} has been created: <#${ticketChannel.id}>` });

    Logger.info(`Ticket #${ticketNumber} created by ${interaction.user.tag} (via modal)`);
  } catch (error) {
    Logger.error(`Failed to create ticket via modal: ${error.message}`);
    await interaction.editReply({ content: 'Failed to create ticket. Please try again.' }).catch(() => {});
  }
}

async function handleRulesAccept(interaction) {
  const { user, guild } = interaction;

  // Check if already accepted
  const existingUser = await db.Users.findOne({
    where: { user_id: user.id, guild_id: guild.id },
  });

  if (existingUser && existingUser.rules_accepted) {
    await interaction.reply({
      content: 'You have already confirmed the rules!',
      ephemeral: true,
    });
    return;
  }

  // Give role
  if (config.autoRoles.defaultRole) {
    try {
      const member = await guild.members.fetch(user.id);
      await member.roles.add(config.autoRoles.defaultRole);
    } catch (error) {
      Logger.error(`Failed to add role to ${user.tag}: ${error.message}`);
    }
  }

  // Update database
  if (existingUser) {
    await existingUser.update({ rules_accepted: true });
  } else {
    await db.Users.create({
      user_id: user.id,
      guild_id: guild.id,
      username: user.username,
      rules_accepted: true,
    });
  }

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ Rules Confirmed')
    .setDescription('Thank you for confirming the server rules! You now have full access to the community.')
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });

  Logger.info(`${user.tag} accepted rules in ${guild.name}`);
}

async function handleRulesDecline(interaction) {
  const { user, guild } = interaction;

  const embed = new EmbedBuilder()
    .setColor(config.bot.warnColor)
    .setTitle('⚠️ Rules Not Confirmed')
    .setDescription('You need to confirm the server rules to get full access. If you don\'t agree with the rules, please contact an administrator.')
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });

  Logger.info(`${user.tag} declined rules in ${guild.name}`);
}

async function handleSelectMenuInteraction(interaction) {
  const { customId, user, guild } = interaction;

  try {
    // Handle vote selection
    if (customId.startsWith('vote_')) {
      await handleVoteSelection(interaction);
    }
  } catch (error) {
    Logger.error(`Error handling select menu interaction ${customId}: ${error.message}`);
    console.error(error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'An error occurred.', ephemeral: true }).catch(() => {});
    }
  }
}

async function handleVoteSelection(interaction) {
  const { customId, user, values } = interaction;
  const voteId = parseInt(customId.replace('vote_', ''));

  try {
    const vote = await db.Votes.findOne({
      where: { id: voteId, guild_id: interaction.guild.id, is_active: true },
    });

    if (!vote) {
      await interaction.reply({
        content: 'Vote does not exist or has ended',
        ephemeral: true,
      });
      return;
    }

    // Check if expired
    if (vote.ends_at && new Date() > vote.ends_at) {
      await vote.update({ is_active: false });
      await interaction.reply({
        content: 'Vote has ended',
        ephemeral: true,
      });
      return;
    }

    // Check if multiple selections allowed
    if (!vote.allow_multiple && values.length > 1) {
      await interaction.reply({
        content: 'This vote does not support multiple selections',
        ephemeral: true,
      });
      return;
    }

    // Delete previous votes
    await db.VoteOptions.destroy({
      where: { vote_id: voteId, user_id: user.id },
    });

    // Add new votes
    for (const value of values) {
      await db.VoteOptions.create({
        vote_id: voteId,
        user_id: user.id,
        option_id: value,
      });
    }

    // Update vote count
    const allVotes = await db.VoteOptions.findAll({
      where: { vote_id: voteId },
    });

    const optionCounts = {};
    for (const v of allVotes) {
      optionCounts[v.option_id] = (optionCounts[v.option_id] || 0) + 1;
    }

    // Update vote options
    const updatedOptions = vote.options.map(opt => ({
      ...opt,
      count: optionCounts[opt.id] || 0,
    }));

    await vote.update({ options: updatedOptions });

    // Update message
    const message = await interaction.channel.messages.fetch(vote.message_id);
    const embed = EmbedBuilder.from(message.embeds[0]);

    // Update options display
    const optionsText = updatedOptions
      .map((opt, i) => `${i + 1}. ${opt.label} - ${opt.count} votes`)
      .join('\n');

    embed.data.fields.find(f => f.name === 'Options').value = optionsText;

    await message.edit({ embeds: [embed] });

    await interaction.reply({
      content: 'Vote submitted!',
      ephemeral: true,
    });

    Logger.info(`${user.tag} voted in poll ${voteId}`);
  } catch (error) {
    Logger.error(`Failed to handle vote selection: ${error.message}`);
    const errorMsg = { content: 'Failed to vote', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(errorMsg).catch(() => {});
    } else {
      await interaction.reply(errorMsg).catch(() => {});
    }
  }
}

async function handleReportButton(interaction) {
  const { customId, user } = interaction;
  const [action, reportId] = customId.split('_').slice(1);

  try {
    const report = await db.Reports.findOne({
      where: { id: parseInt(reportId), guild_id: interaction.guild.id },
    });

    if (!report) {
      await interaction.reply({
        content: 'Cannot find specified report',
        ephemeral: true,
      });
      return;
    }

    // Update report status
    const statusMap = {
      accept: 'investigating',
      reject: 'rejected',
      investigate: 'investigating',
    };

    await report.update({
      status: statusMap[action] || 'pending',
      handler_id: user.id,
    });

    const statusNames = {
      investigating: 'Investigating',
      rejected: 'Rejected',
      resolved: 'Resolved',
      pending: 'Pending',
    };

    const embed = new EmbedBuilder()
      .setColor(action === 'reject' ? config.bot.errorColor : config.bot.successColor)
      .setTitle(action === 'reject' ? '❌ Report Rejected' : '✅ Report Accepted')
      .setDescription(`Report ID: ${reportId}\nStatus: ${statusNames[statusMap[action]]}`)
      .addFields(
        { name: 'Handler', value: user.tag, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.update({
      embeds: [embed],
      components: [],
    });

    Logger.info(`Report ${reportId} ${action}ed by ${user.tag}`);
  } catch (error) {
    Logger.error(`Failed to handle report button: ${error.message}`);
    const errorMsg = { content: 'Failed to process', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(errorMsg).catch(() => {});
    } else {
      await interaction.reply(errorMsg).catch(() => {});
    }
  }
}

async function handleTicketButton(interaction) {
  const { customId, user } = interaction;
  const [action, ticketId] = customId.split('_').slice(1);

  try {
    if (action === 'create') {
      // Create ticket button
      const modal = {
        title: 'Create Ticket',
        custom_id: 'ticket_create_modal',
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: 'subject',
                label: 'Ticket Subject',
                style: 1,
                min_length: 1,
                max_length: 100,
                placeholder: 'Enter ticket subject',
                required: true,
              },
            ],
          },
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: 'description',
                label: 'Ticket Description',
                style: 2,
                min_length: 1,
                max_length: 1000,
                placeholder: 'Describe your issue in detail',
                required: true,
              },
            ],
          },
        ],
      };

      await interaction.showModal(modal);
    } else if (action === 'close') {
      // Close ticket button — defer since we do API calls
      await interaction.deferUpdate();

      const ticket = await db.Tickets.findOne({
        where: { id: parseInt(ticketId), guild_id: interaction.guild.id, status: 'open' },
      });

      if (!ticket) {
        await interaction.followUp({ content: 'Ticket does not exist or is already closed', ephemeral: true });
        return;
      }

      await ticket.update({
        status: 'closed',
        closed_at: new Date(),
        closed_by: user.id,
        close_reason: 'Manual close',
      });

      // Lock channel (non-critical, catch silently)
      await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false }).catch(() => {});
      await interaction.channel.permissionOverwrites.edit(ticket.user_id, { ViewChannel: false, SendMessages: false }).catch(() => {});

      const embed = new EmbedBuilder()
        .setColor(config.bot.warnColor)
        .setTitle('🔒 Ticket Closed')
        .setDescription(`Ticket #${ticket.ticket_number} has been closed`)
        .addFields(
          { name: 'Closed By', value: `${user}`, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await interaction.editReply({ embeds: [embed], components: [] });

      Logger.info(`Ticket #${ticket.ticket_number} closed by ${user.tag}`);
    } else if (action === 'transcript') {
      // Generate transcript button — defer since we fetch messages
      await interaction.deferReply();

      const ticket = await db.Tickets.findOne({
        where: { id: parseInt(ticketId), guild_id: interaction.guild.id },
      });

      if (!ticket) {
        await interaction.editReply({ content: 'Ticket does not exist' });
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

      await interaction.editReply({
        embeds: [embed],
        files: [
          {
            attachment: transcriptBuffer,
            name: `ticket-${ticket.ticket_number}-transcript.txt`,
          },
        ],
      });

      Logger.info(`Transcript generated for ticket #${ticket.ticket_number} by ${user.tag}`);
    }
  } catch (error) {
    Logger.error(`Failed to handle ticket button: ${error.message}`);
    const errorMsg = { content: 'Failed to process', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(errorMsg).catch(() => {});
    } else {
      await interaction.reply(errorMsg).catch(() => {});
    }
  }
}