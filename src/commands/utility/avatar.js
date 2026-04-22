// src/commands/utility/avatar.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription(`${config.emojis.user} View user avatar`)
    .addUserOption((opt) => opt.setName('user').setDescription('User to view avatar').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;

    const embed = new EmbedBuilder()
      .setColor(config.bot.color)
      .setTitle(`${user.tag}'s avatar`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setDescription(
        [
          `[PNG](${user.displayAvatarURL({ extension: 'png', size: 1024 })})`,
          `[JPG](${user.displayAvatarURL({ extension: 'jpg', size: 1024 })})`,
          `[WEBP](${user.displayAvatarURL({ extension: 'webp', size: 1024 })})`,
          user.avatar?.startsWith('a_') ? `[GIF](${user.displayAvatarURL({ extension: 'gif', size: 1024 })})` : null,
        ]
          .filter(Boolean)
          .join(' • ')
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
  },
};