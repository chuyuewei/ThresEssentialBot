// src/commands/moderation/mute.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription(`${config.emojis.mute} 禁言一个用户 (Timeout)`)
    .addUserOption((opt) => opt.setName('用户').setDescription('要禁言的用户').setRequired(true))
    .addIntegerOption((opt) =>
      opt
        .setName('时长')
        .setDescription('禁言时长（分钟）')
        .setMinValue(1)
        .setMaxValue(40320) // 28 天
        .setRequired(false)
    )
    .addStringOption((opt) => opt.setName('原因').setDescription('禁言原因').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('用户');
    const duration = interaction.options.getInteger('时长') || config.moderation.defaultMuteDuration;
    const reason = interaction.options.getString('原因') || '未提供原因';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        embeds: [EmbedFactory.error('操作失败', '该用户不在此服务器中。')],
        ephemeral: true,
      });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({
        embeds: [EmbedFactory.error('操作失败', '你不能禁言自己！')],
        ephemeral: true,
      });
    }

    if (!member.moderatable) {
      return interaction.reply({
        embeds: [EmbedFactory.error('操作失败', '我无法禁言此用户。')],
        ephemeral: true,
      });
    }

    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        embeds: [EmbedFactory.error('权限不足', '你不能禁言一个角色等级 ≥ 你的用户。')],
        ephemeral: true,
      });
    }

    const durationMs = duration * 60 * 1000;
    await member.timeout(durationMs, `${interaction.user.tag}: ${reason}`);

    const embed = EmbedFactory.success(
      '用户已禁言',
      `**${target.tag}** 已被禁言 **${duration} 分钟**。`
    );
    embed.addFields(
      { name: '📝 原因', value: reason, inline: true },
      { name: '⏰ 时长', value: `${duration} 分钟`, inline: true },
      { name: '🛡️ 执行者', value: `${interaction.user}`, inline: true }
    );

    await interaction.reply({ embeds: [embed] });

    // 私信
    try {
      await target.send({
        embeds: [
          EmbedFactory.warn(
            '你已被禁言',
            `你在 **${interaction.guild.name}** 被禁言了 **${duration} 分钟**。\n**原因：** ${reason}`
          ),
        ],
      });
    } catch {}

    // 日志
    const logCh = interaction.guild.channels.cache.find((c) => c.name === config.logs.channelName);
    if (logCh) {
      logCh.send({
        embeds: [
          EmbedFactory.modLog({
            action: '禁言 (Mute)',
            moderator: interaction.user,
            target,
            reason,
            extra: { '⏰ 时长': `${duration} 分钟` },
          }),
        ],
      }).catch(() => {});
    }
  },
};