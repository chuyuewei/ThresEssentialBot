// src/commands/info/help.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription(`${config.emojis.info} Display help information`),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.bot.color)
      .setTitle(`${config.emojis.shield} ${config.bot.name}`)
      .setDescription('A powerful Discord moderation bot. Here are all available commands:')
      .addFields(
        {
          name: '🔨 Moderation Commands',
          value: [
            '`/ban` — Ban a user',
            '`/kick` — Kick a user',
            '`/mute` — Mute a user (Timeout)',
            '`/unmute` — Unmute a user',
            '`/warn` — Warn a user',
            '`/warnings list` — View warnings',
            '`/warnings clear` — Clear warnings',
            '`/warnings remove` — Remove a warning',
            '`/purge` — Bulk delete messages',
            '`/slowmode` — Set slowmode',
          ].join('\n'),
          inline: false,
        },
        {
          name: 'ℹ️ Info Commands',
          value: [
            '`/help` — Show help',
            '`/userinfo` — View user info',
            '`/serverinfo` — View server info',
          ].join('\n'),
          inline: false,
        },
        {
          name: '🔧 Utility',
          value: [
            '`/ping` — Check latency',
            '`/avatar` — View avatar',
          ].join('\n'),
          inline: false,
        }
      )
      .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
      .setTimestamp()
      .setFooter({ text: `${config.bot.name} v${config.bot.version}` });

    await interaction.reply({ embeds: [embed] });
  },
};