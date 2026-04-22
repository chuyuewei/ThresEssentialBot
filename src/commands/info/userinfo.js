// src/commands/info/userinfo.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription(`${config.emojis.user} 查看用户信息`)
    .addUserOption((opt) => opt.setName('用户').setDescription('要查看的用户（留空为自己）').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('用户') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(member?.displayHexColor || config.bot.color)
      .setTitle(`${config.emojis.user} 用户信息 — ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: '🏷️ 用户名', value: user.tag, inline: true },
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '🤖 Bot', value: user.bot ? '是' : '否', inline: true },
        {
          name: '📅 账号创建时间',
          value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>\n(<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`,
          inline: true,
        },
      );

    if (member) {
      embed.addFields(
        {
          name: '📥 加入服务器时间',
          value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>\n(<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`,
          inline: true,
        },
        { name: '🎨 显示颜色', value: member.displayHexColor, inline: true },
        {
          name: `🏅 角色 [${member.roles.cache.size - 1}]`,
          value:
            member.roles.cache
              .filter((r) => r.id !== interaction.guild.id)
              .sort((a, b) => b.position - a.position)
              .map((r) => `${r}`)
              .slice(0, 15)
              .join(', ') || '无',
          inline: false,
        }
      );

      // 关键权限
      const keyPerms = [];
      if (member.permissions.has('Administrator')) keyPerms.push('管理员');
      if (member.permissions.has('ManageGuild')) keyPerms.push('管理服务器');
      if (member.permissions.has('ManageMessages')) keyPerms.push('管理消息');
      if (member.permissions.has('BanMembers')) keyPerms.push('封禁成员');
      if (member.permissions.has('KickMembers')) keyPerms.push('踢出成员');
      if (member.permissions.has('ModerateMembers')) keyPerms.push('管理成员');

      if (keyPerms.length > 0) {
        embed.addFields({ name: '🔑 关键权限', value: keyPerms.join(', '), inline: false });
      }
    }

    embed.setTimestamp().setFooter({ text: config.bot.name });

    await interaction.reply({ embeds: [embed] });
  },
};