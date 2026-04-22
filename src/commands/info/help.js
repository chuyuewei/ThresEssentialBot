// src/commands/info/help.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription(`${config.emojis.info} 显示帮助信息`),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.bot.color)
      .setTitle(`${config.emojis.shield} ${config.bot.name}`)
      .setDescription('一个功能强大的 Discord 基础管理 Bot。以下是所有可用命令：')
      .addFields(
        {
          name: '🔨 管理命令',
          value: [
            '`/ban` — 封禁用户',
            '`/kick` — 踢出用户',
            '`/mute` — 禁言用户 (Timeout)',
            '`/unmute` — 解除禁言',
            '`/warn` — 警告用户',
            '`/warnings list` — 查看警告',
            '`/warnings clear` — 清除警告',
            '`/warnings remove` — 移除单条警告',
            '`/purge` — 批量删除消息',
            '`/slowmode` — 设置慢速模式',
          ].join('\n'),
          inline: false,
        },
        {
          name: 'ℹ️ 信息命令',
          value: [
            '`/help` — 显示帮助',
            '`/userinfo` — 查看用户信息',
            '`/serverinfo` — 查看服务器信息',
          ].join('\n'),
          inline: false,
        },
        {
          name: '🔧 实用工具',
          value: [
            '`/ping` — 查看延迟',
            '`/avatar` — 查看头像',
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