// src/commands/info/userinfo.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription(`${config.emojis.user} View user information`)
    .addUserOption((opt) => opt.setName('user').setDescription('User to view (leave empty for yourself)').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor || config.bot.color)
      .setTitle(`${config.emojis.user} User Info — ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: '🏷️ Username', value: user.tag, inline: true },
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '🤖 Bot', value: user.bot ? 'Yes' : 'No', inline: true },
        {
          name: '📅 Account Created',
          value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>\n(<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`,
          inline: true,
        },
      );

    if (member) {
      embed.addFields(
        {
          name: '📥 Joined Server',
          value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>\n(<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`,
          inline: true,
        },
        { name: '🎨 Display Color', value: member.displayHexColor, inline: true },
        {
          name: `🏅 Roles [${member.roles.cache.size - 1}]`,
          value:
            member.roles.cache
              .filter((r) => r.id !== interaction.guild.id)
              .sort((a, b) => b.position - a.position)
              .map((r) => `${r}`)
              .slice(0, 15)
              .join(', ') || 'None',
          inline: false,
        }
      );

      // Key permissions
      const keyPerms = [];
      if (member.permissions.has('Administrator')) keyPerms.push('Administrator');
      if (member.permissions.has('ManageGuild')) keyPerms.push('Manage Server');
      if (member.permissions.has('ManageMessages')) keyPerms.push('Manage Messages');
      if (member.permissions.has('BanMembers')) keyPerms.push('Ban Members');
      if (member.permissions.has('KickMembers')) keyPerms.push('Kick Members');
      if (member.permissions.has('ModerateMembers')) keyPerms.push('Moderate Members');

      if (keyPerms.length > 0) {
        embed.addFields({ name: '🔑 Key Permissions', value: keyPerms.join(', '), inline: false });
      }
    }

    embed.setTimestamp().setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
  },
};