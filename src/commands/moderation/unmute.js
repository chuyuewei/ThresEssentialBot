// src/commands/moderation/unmute.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription(`${config.emojis.unmute} Unmute a user`)
    .addUserOption((opt) => opt.setName('user').setDescription('User to unmute').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        embeds: [EmbedFactory.error('Action Failed', 'This user is not in this server.')],
        ephemeral: true,
      });
    }

    if (!member.isCommunicationDisabled()) {
      return interaction.reply({
        embeds: [EmbedFactory.warn('Notice', 'This user is not currently muted.')],
        ephemeral: true,
      });
    }

    await member.timeout(null, `${interaction.user.tag}: Unmuted`);

    const embed = EmbedFactory.success(
      'User Unmuted',
      `**${target.tag}** has been unmuted.`
    );
    embed.addFields({ name: '🛡️ Moderator', value: `${interaction.user}`, inline: true });

    await interaction.reply({ embeds: [embed] });
  },
};