// src/commands/moderation/purge.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription(`${config.emojis.trash} 批量删除消息`)
    .addIntegerOption((opt) =>
      opt
        .setName('数量')
        .setDescription('要删除的消息数量 (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption((opt) => opt.setName('用户').setDescription('仅删除该用户的消息').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('数量');
    const targetUser = interaction.options.getUser('用户');

    await interaction.deferReply({ ephemeral: true });

    try {
      let messages = await interaction.channel.messages.fetch({ limit: amount });

      // 如果指定了用户，只删除该用户的消息
      if (targetUser) {
        messages = messages.filter((m) => m.author.id === targetUser.id);
      }

      // 过滤掉超过 14 天的消息（Discord API 限制）
      const now = Date.now();
      messages = messages.filter((m) => now - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);

      const deleted = await interaction.channel.bulkDelete(messages, true);

      const embed = EmbedFactory.success(
        '消息已清除',
        `已成功删除 **${deleted.size}** 条消息。${targetUser ? `\n仅删除 ${targetUser} 的消息。` : ''}`
      );

      await interaction.editReply({ embeds: [embed] });

      // 日志
      const logCh = interaction.guild.channels.cache.find((c) => c.name === config.logs.channelName);
      if (logCh) {
        logCh.send({
          embeds: [
            EmbedFactory.modLog({
              action: '清除消息 (Purge)',
              moderator: interaction.user,
              target: targetUser || interaction.user,
              reason: `在 #${interaction.channel.name} 清除了 ${deleted.size} 条消息`,
            }),
          ],
        }).catch(() => {});
      }
    } catch (error) {
      await interaction.editReply({
        embeds: [EmbedFactory.error('操作失败', `无法删除消息: ${error.message}`)],
      });
    }
  },
};