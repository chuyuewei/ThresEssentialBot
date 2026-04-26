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
    // Handle button interactions
    else if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    }
    // Handle select menu interactions
    else if (interaction.isStringSelectMenu()) {
      await handleSelectMenuInteraction(interaction);
    }
    // Handle report button interactions
    else if (interaction.isButton() && interaction.customId.startsWith('report_')) {
      await handleReportButton(interaction);
    }
    // Handle ticket button interactions
    else if (interaction.isButton() && interaction.customId.startsWith('ticket_')) {
      await handleTicketButton(interaction);
    }
  },
};

async function handleButtonInteraction(interaction) {
  const { customId, user, guild } = interaction;

  try {
    // Handle rules confirmation buttons
    if (customId === 'rules_accept') {
      await handleRulesAccept(interaction);
    } else if (customId === 'rules_decline') {
      await handleRulesDecline(interaction);
    }
  } catch (error) {
    Logger.error(`Error handling button interaction ${customId}: ${error.message}`);
    console.error(error);
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
    await interaction.reply({
      content: 'Failed to vote',
      ephemeral: true,
    });
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
    await interaction.reply({
      content: 'Failed to process',
      ephemeral: true,
    });
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
      // Close ticket button
      const ticket = await db.Tickets.findOne({
        where: { id: parseInt(ticketId), guild_id: interaction.guild.id, status: 'open' },
      });

      if (!ticket) {
        await interaction.reply({
          content: 'Ticket does not exist or is already closed',
          ephemeral: true,
        });
        return;
      }

      await ticket.update({
        status: 'closed',
        closed_at: new Date(),
        closed_by: user.id,
        close_reason: 'Manual close',
      });

      // Lock channel
      await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false });
      await interaction.channel.permissionOverwrites.edit(ticket.user_id, { ViewChannel: false, SendMessages: false });

      const embed = new EmbedBuilder()
        .setColor(config.bot.warnColor)
        .setTitle('🔒 Ticket Closed')
        .setDescription(`Ticket #${ticket.ticket_number} has been closed`)
        .addFields(
          { name: 'Closed By', value: `${user}`, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      await interaction.update({ embeds: [embed], components: [] });

      Logger.info(`Ticket #${ticket.ticket_number} closed by ${user.tag}`);
    } else if (action === 'transcript') {
      // Generate transcript button
      const ticket = await db.Tickets.findOne({
        where: { id: parseInt(ticketId), guild_id: interaction.guild.id },
      });

      if (!ticket) {
        await interaction.reply({
          content: 'Ticket does not exist',
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

      Logger.info(`Transcript generated for ticket #${ticket.ticket_number} by ${user.tag}`);
    }
  } catch (error) {
    Logger.error(`Failed to handle ticket button: ${error.message}`);
    await interaction.reply({
      content: 'Failed to process',
      ephemeral: true,
    });
  }
}