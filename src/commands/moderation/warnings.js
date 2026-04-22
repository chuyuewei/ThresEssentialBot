// src/commands/moderation/warnings.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const EmbedFactory = require('../../utils/embed');
const WarnManager = require('../../utils/warnManager');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription(`${config.emojis.warn} 查看/管理用户的警告`)
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('查看用户的所有警告')
        .addUserOption((opt) => opt.setName('用户').setDescription('目标用户').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('clear')
        .setDescription('清除用户的所有警告')
        .addUserOption((opt) => opt.setName('用户').setDescription('目标用户').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('移除用户的指定警告')
        .addUserOption((opt) => opt.setName('用户').setDescription('目标用户').setRequired(true))
        .addIntegerOption((opt) => opt.setName('编号').setDescription('警告编号').setRequired(true).setMinValue(1))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('用户');

    if (sub === 'list') {
      const warnings = WarnManager.getWarnings(interaction.guild.id, target.id);

      if (warnings.length === 0) {
        return interaction.reply({
          embeds: [EmbedFactory.info('警告记录', `**${target.tag}** 没有任何警告记录。`)],
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(config.bot.warnColor)
        .setTitle(`⚠️ ${target.tag} 的警告记录`)
        .setThumbnail(target.displayAvatarURL({ size: 128 }))
        .setDescription(`共 **${warnings.length}** 条警告`)
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      for (const w of warnings) {
        embed.addFields({
          name: `#${w.id} — ${new Date(w.timestamp).toLocaleDateString('zh-CN')}`,
          value: `**原因：** ${w.reason}\n**执行者：** <@${w.moderatorId}>`,
          inline: false,
        });
      }

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'clear') {
      const count = WarnManager.clearWarnings(interaction.guild.id, target.id);
      return interaction.reply({
        embeds: [
          EmbedFactory.success('警告已清除', `已清除 **${target.tag}** 的 **${count}** 条警告。`),
        ],
      });
    }

    if (sub === 'remove') {
      const warnId = interaction.options.getInteger('编号');
      const success = WarnManager.removeWarning(interaction.guild.id, target.id, warnId);

      if (!success) {
        return interaction.reply({
          embeds: [EmbedFactory.error('操作失败', `未找到编号为 **#${warnId}** 的警告。`)],
          ephemeral: true,
        });
      }

      return interaction.reply({
        embeds: [
          EmbedFactory.success('警告已移除', `已移除 **${target.tag}** 的警告 **#${warnId}**。`),
        ],
      });
    }
  },
};