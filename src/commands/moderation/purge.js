// src/commands/moderation/purge.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription(`${config.emojis.trash} Bulk delete messages`)
    .addIntegerOption((opt) =>
      opt
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption((opt) => opt.setName('user').setDescription('Only delete this user\'s messages').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      let messages = await interaction.channel.messages.fetch({ limit: amount });

      // If user specified, only delete that user's messages
      if (targetUser) {
        messages = messages.filter((m) => m.author.id === targetUser.id);
      }

      // Filter out messages older than 14 days (Discord API limit)
      const now = Date.now();
      messages = messages.filter((m) => now - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);

      const deleted = await interaction.channel.bulkDelete(messages, true);

      const embed = EmbedFactory.success(
        'Messages Purged',
        `Successfully deleted **${deleted.size}** messages.${targetUser ? `\nOnly deleted messages from ${targetUser}.` : ''}`
      );

      await interaction.editReply({ embeds: [embed] });

      // Log
      const logCh = interaction.guild.channels.cache.find((c) => c.name === config.logs.channelName);
      if (logCh) {
        logCh.send({
          embeds: [
            EmbedFactory.modLog({
              action: 'Purge',
              moderator: interaction.user,
              target: targetUser || interaction.user,
              reason: `Purged ${deleted.size} messages in #${interaction.channel.name}`,
            }),
          ],
        }).catch(() => {});
      }
    } catch (error) {
      await interaction.editReply({
        embeds: [EmbedFactory.error('Action Failed', `Cannot delete messages: ${error.message}`)],
      });
    }
  },
};