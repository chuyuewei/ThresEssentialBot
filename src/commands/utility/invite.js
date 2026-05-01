// src/commands/utility/invite.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Manage server invites')
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Create a new invite link')
        .addIntegerOption(opt =>
          opt.setName('max_uses').setDescription('Max uses (0 = unlimited)').setRequired(false).setMinValue(0)
        )
        .addIntegerOption(opt =>
          opt.setName('max_age').setDescription('Expires in seconds (0 = never)').setRequired(false).setMinValue(0)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('List all active invites')
    )
    .addSubcommand(sub =>
      sub
        .setName('delete')
        .setDescription('Delete an invite')
        .addStringOption(opt =>
          opt.setName('code').setDescription('Invite code to delete').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('setup')
        .setDescription('Set a channel where new invites are automatically posted')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Channel for invite links').setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.CreateInstantInvite),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case 'create': return createInvite(interaction);
      case 'list':   return listInvites(interaction);
      case 'delete': return deleteInvite(interaction);
      case 'setup':  return setupInviteChannel(interaction);
    }
  },
};

// ─── create ────────────────────────────────────────
async function createInvite(interaction) {
  await interaction.deferReply();

  try {
    const maxUses = interaction.options.getInteger('max_uses') || 0;
    const maxAge  = interaction.options.getInteger('max_age')  || 0;

    const invite = await interaction.channel.createInvite({
      maxAge:   maxAge || 0,
      maxUses:  maxUses || 0,
      unique:   true,
      reason:   `Created by ${interaction.user.tag}`,
    });

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('🔗 Invite Created')
      .setDescription(`https://discord.gg/${invite.code}`)
      .addFields(
        { name: 'Max Uses',   value: invite.maxUses  ? invite.maxUses.toString()  : 'Unlimited', inline: true },
        { name: 'Expires',    value: invite.maxAge   ? `<t:${Math.floor(Date.now()/1000 + invite.maxAge)}:R>` : 'Never', inline: true },
        { name: 'Channel',    value: `<#${invite.channel.id}>`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.editReply({ embeds: [embed] });

    // if invite channel configured, post there too
    const inviteChan = config.inviteChannel;
    if (inviteChan) {
      const ch = interaction.guild.channels.cache.get(inviteChan);
      if (ch) await ch.send({ embeds: [embed] }).catch(() => {});
    }

    Logger.info(`Invite created by ${interaction.user.tag}: ${invite.code}`);
  } catch (err) {
    Logger.error(`Failed to create invite: ${err.message}`);
    await interaction.editReply({ content: 'Failed to create invite.' });
  }
}

// ─── list ──────────────────────────────────────────
async function listInvites(interaction) {
  await interaction.deferReply();

  try {
    const invites = await interaction.guild.invites.fetch();
    if (!invites.size) {
      return interaction.editReply({ content: 'No active invites.' });
    }

    const list = invites
      .map(i => `**${i.code}** — ${i.uses}/${i.maxUses || '∞'} uses — <#${i.channel.id}> — by ${i.inviter?.tag || 'Unknown'}`)
      .join('\n')
      .substring(0, 4000);

    const embed = new EmbedBuilder()
      .setColor(config.bot.infoColor)
      .setTitle('🔗 Active Invites')
      .setDescription(list)
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    Logger.error(`Failed to list invites: ${err.message}`);
    await interaction.editReply({ content: 'Failed to fetch invites.' });
  }
}

// ─── delete ────────────────────────────────────────
async function deleteInvite(interaction) {
  await interaction.deferReply();

  try {
    const code = interaction.options.getString('code');
    const invite = await interaction.guild.invites.fetch(code).catch(() => null);
    if (!invite) return interaction.editReply({ content: 'Invite not found.' });

    await invite.delete(`Deleted by ${interaction.user.tag}`);

    const embed = new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle('🗑️ Invite Deleted')
      .setDescription(`Invite \`${code}\` has been deleted.`)
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.editReply({ embeds: [embed] });
    Logger.info(`Invite ${code} deleted by ${interaction.user.tag}`);
  } catch (err) {
    Logger.error(`Failed to delete invite: ${err.message}`);
    await interaction.editReply({ content: 'Failed to delete invite.' });
  }
}

// ─── setup ─────────────────────────────────────────
async function setupInviteChannel(interaction) {
  const channel = interaction.options.getChannel('channel');
  config.inviteChannel = channel.id;

  const embed = new EmbedBuilder()
    .setColor(config.bot.successColor)
    .setTitle('✅ Invite Channel Set')
    .setDescription(`New invites will be posted in ${channel}`)
    .setTimestamp()
    .setFooter({ text: config.bot.name });

  await interaction.reply({ embeds: [embed] });
  Logger.info(`Invite channel set to #${channel.name} by ${interaction.user.tag}`);
}