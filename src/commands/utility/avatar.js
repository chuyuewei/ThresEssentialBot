// src/commands/utility/avatar.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription(`${config.emojis.user} 查看用户头像`)
    .addUserOption((opt) => opt.setName('用户').setDescription('要查看头像的用户').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('用户') || interaction.user;

    const embed = new EmbedBuilder()
      .setColor(config.bot.color)
      .setTitle(`${user.tag} 的头像`)
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