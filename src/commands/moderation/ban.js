// src/commands/moderation/ban.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription(`${config.emojis.ban} 封禁一个用户`)
    .addUserOption((opt) => opt.setName('用户').setDescription('要封禁的用户').setRequired(true))
    .addStringOption((opt) => opt.setName('原因').setDescription('封禁原因').setRequired(false))
    .addIntegerOption((opt) =>
      opt
        .setName('删除消息天数')
        .setDescription('删除该用户最近 N 天的消息 (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('用户');
    const reason = interaction.options.getString('原因') || '未提供原因';
    const deleteDays = interaction.options.getInteger('删除消息天数') || 0;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    // 检查：不能封禁自己
    if (target.id === interaction.user.id) {
      return interaction.reply({
        embeds: [EmbedFactory.error('操作失败', '你不能封禁自己！')],
        ephemeral: true,
      });
    }

    // 检查：不能封禁 Bot 自身
    if (target.id === interaction.client.user.id) {
      return interaction.reply({
        embeds: [EmbedFactory.error('操作失败', '我不能封禁自己！')],
        ephemeral: true,
      });
    }

    // 检查：权限层级
    if (member) {
      if (member.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({
          embeds: [EmbedFactory.error('权限不足', '你不能封禁一个角色等级 ≥ 你的用户。')],
          ephemeral: true,
        });
      }
      if (!member.bannable) {
        return interaction.reply({
          embeds: [EmbedFactory.error('操作失败', '我无法封禁此用户，请检查我的角色权限。')],
          ephemeral: true,
        });
      }
    }

    // 尝试私信通知被封禁用户
    try {
      await target.send({
        embeds: [
          EmbedFactory.error(
            `你已被封禁`,
            `你已被 **${interaction.guild.name}** 封禁。\n**原因：** ${reason}`
          ),
        ],
      });
    } catch {
      // 无法私信，忽略
    }

    // 执行封禁
    await interaction.guild.members.ban(target, {
      reason: `${interaction.user.tag}: ${reason}`,
      deleteMessageSeconds: deleteDays * 86400,
    });

    // 回复
    const embed = EmbedFactory.success(
      '用户已封禁',
      `**${target.tag}** 已被成功封禁。`
    );
    embed.addFields(
      { name: '📝 原因', value: reason, inline: true },
      { name: '🛡️ 执行者', value: `${interaction.user}`, inline: true },
    );
    await interaction.reply({ embeds: [embed] });

    // 日志
    await sendModLog(interaction, '封禁 (Ban)', target, reason);
  },
};

async function sendModLog(interaction, action, target, reason) {
  const logChannel = interaction.guild.channels.cache.find(
    (ch) => ch.name === config.logs.channelName
  );
  if (!logChannel) return;

  const logEmbed = EmbedFactory.modLog({
    action,
    moderator: interaction.user,
    target,
    reason,
  });

  logChannel.send({ embeds: [logEmbed] }).catch(() => {});
}