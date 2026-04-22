// src/commands/moderation/warn.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const WarnManager = require('../../utils/warnManager');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription(`${config.emojis.warn} 警告一个用户`)
    .addUserOption((opt) => opt.setName('用户').setDescription('要警告的用户').setRequired(true))
    .addStringOption((opt) => opt.setName('原因').setDescription('警告原因').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('用户');
    const reason = interaction.options.getString('原因');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        embeds: [EmbedFactory.error('操作失败', '该用户不在此服务器中。')],
        ephemeral: true,
      });
    }

    if (target.bot) {
      return interaction.reply({
        embeds: [EmbedFactory.error('操作失败', '你不能警告一个 Bot。')],
        ephemeral: true,
      });
    }

    // 添加警告
    const { warnings, count } = WarnManager.addWarning(
      interaction.guild.id,
      target.id,
      reason,
      interaction.user.id
    );

    const embed = EmbedFactory.warn(
      '用户已被警告',
      `**${target.tag}** 收到了一条警告。`
    );
    embed.addFields(
      { name: '📝 原因', value: reason, inline: false },
      { name: '⚠️ 总警告数', value: `${count} / ${config.moderation.maxWarnings}`, inline: true },
      { name: '🛡️ 执行者', value: `${interaction.user}`, inline: true }
    );

    await interaction.reply({ embeds: [embed] });

    // 私信
    try {
      await target.send({
        embeds: [
          EmbedFactory.warn(
            '你收到了一条警告',
            `你在 **${interaction.guild.name}** 收到了一条警告。\n**原因：** ${reason}\n**当前警告数：** ${count} / ${config.moderation.maxWarnings}`
          ),
        ],
      });
    } catch {}

    // 检查是否达到最大警告数
    if (count >= config.moderation.maxWarnings) {
      const action = config.moderation.autoActionOnMaxWarns;
      let actionText = '';

      try {
        if (action === 'kick' && member.kickable) {
          await member.kick(`警告数达到上限 (${count})`);
          actionText = '踢出';
        } else if (action === 'ban' && member.bannable) {
          await interaction.guild.members.ban(target, {
            reason: `警告数达到上限 (${count})`,
          });
          actionText = '封禁';
        } else if (action === 'mute' && member.moderatable) {
          await member.timeout(24 * 60 * 60 * 1000, `警告数达到上限 (${count})`);
          actionText = '禁言 24 小时';
        }

        if (actionText) {
          await interaction.followUp({
            embeds: [
              EmbedFactory.error(
                '自动处罚',
                `**${target.tag}** 的警告数已达到上限 (${config.moderation.maxWarnings})，已自动执行 **${actionText}**。`
              ),
            ],
          });

          // 清除警告
          WarnManager.clearWarnings(interaction.guild.id, target.id);
        }
      } catch {}
    }

    // 日志
    const logCh = interaction.guild.channels.cache.find((c) => c.name === config.logs.channelName);
    if (logCh) {
      logCh.send({
        embeds: [
          EmbedFactory.modLog({
            action: '警告 (Warn)',
            moderator: interaction.user,
            target,
            reason,
            extra: { '⚠️ 总警告数': `${count} / ${config.moderation.maxWarnings}` },
          }),
        ],
      }).catch(() => {});
    }
  },
};