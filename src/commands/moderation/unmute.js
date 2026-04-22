// src/commands/moderation/unmute.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription(`${config.emojis.unmute} 解除用户禁言`)
    .addUserOption((opt) => opt.setName('用户').setDescription('要解除禁言的用户').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('用户');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        embeds: [EmbedFactory.error('操作失败', '该用户不在此服务器中。')],
        ephemeral: true,
      });
    }

    if (!member.isCommunicationDisabled()) {
      return interaction.reply({
        embeds: [EmbedFactory.warn('提示', '该用户当前没有被禁言。')],
        ephemeral: true,
      });
    }

    await member.timeout(null, `${interaction.user.tag}: 解除禁言`);

    const embed = EmbedFactory.success(
      '已解除禁言',
      `**${target.tag}** 的禁言已被解除。`
    );
    embed.addFields({ name: '🛡️ 执行者', value: `${interaction.user}`, inline: true });

    await interaction.reply({ embeds: [embed] });
  },
};