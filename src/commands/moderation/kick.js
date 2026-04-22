// src/commands/moderation/kick.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription(`${config.emojis.kick} 踢出一个用户`)
    .addUserOption((opt) => opt.setName('用户').setDescription('要踢出的用户').setRequired(true))
    .addStringOption((opt) => opt.setName('原因').setDescription('踢出原因').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('用户');
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
        embeds: [EmbedFactory.error('操作失败', '你不能踢出自己！')],
        ephemeral: true,
      });
    }

    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.reply({
        embeds: [EmbedFactory.error('权限不足', '你不能踢出一个角色等级 ≥ 你的用户。')],
        ephemeral: true,
      });
    }

    if (!member.kickable) {
      return interaction.reply({
        embeds: [EmbedFactory.error('操作失败', '我无法踢出此用户，请检查我的角色权限。')],
        ephemeral: true,
      });
    }

    // 私信通知
    try {
      await target.send({
        embeds: [
          EmbedFactory.warn(
            '你已被踢出',
            `你已被 **${interaction.guild.name}** 踢出。\n**原因：** ${reason}`
          ),
        ],
      });
    } catch {}

    await member.kick(`${interaction.user.tag}: ${reason}`);

    const embed = EmbedFactory.success('用户已踢出', `**${target.tag}** 已被成功踢出。`);
    embed.addFields(
      { name: '📝 原因', value: reason, inline: true },
      { name: '🛡️ 执行者', value: `${interaction.user}`, inline: true }
    );

    await interaction.reply({ embeds: [embed] });

    // 日志
    const logCh = interaction.guild.channels.cache.find((c) => c.name === config.logs.channelName);
    if (logCh) {
      logCh.send({
        embeds: [EmbedFactory.modLog({ action: '踢出 (Kick)', moderator: interaction.user, target, reason })],
      }).catch(() => {});
    }
  },
};