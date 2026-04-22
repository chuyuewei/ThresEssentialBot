// src/commands/info/serverinfo.js
const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription(`${config.emojis.server} 查看服务器信息`),

  async execute(interaction) {
    const { guild } = interaction;
    await guild.members.fetch(); // 确保缓存是最新的

    const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
    const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size;
    const totalChannels = guild.channels.cache.size;

    const online = guild.members.cache.filter((m) => m.presence?.status === 'online').size;
    const humans = guild.members.cache.filter((m) => !m.user.bot).size;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;

    const verificationLevels = {
      0: '无',
      1: '低',
      2: '中',
      3: '高',
      4: '最高',
    };

    const embed = new EmbedBuilder()
      .setColor(config.bot.color)
      .setTitle(`${config.emojis.server} ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: '🆔 ID', value: guild.id, inline: true },
        { name: '👑 拥有者', value: `<@${guild.ownerId}>`, inline: true },
        {
          name: '📅 创建时间',
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
          inline: true,
        },
        {
          name: `👥 成员 [${guild.memberCount}]`,
          value: `👤 人类: ${humans}\n🤖 Bot: ${bots}`,
          inline: true,
        },
        {
          name: `💬 频道 [${totalChannels}]`,
          value: `📝 文字: ${textChannels}\n🔊 语音: ${voiceChannels}\n📁 分类: ${categories}`,
          inline: true,
        },
        { name: '🏅 角色数', value: `${guild.roles.cache.size}`, inline: true },
        { name: '😀 表情数', value: `${guild.emojis.cache.size}`, inline: true },
        { name: '🔒 验证等级', value: verificationLevels[guild.verificationLevel] || '未知', inline: true },
        {
          name: '🚀 助力',
          value: `等级 ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} 次助力)`,
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    if (guild.bannerURL()) {
      embed.setImage(guild.bannerURL({ size: 1024 }));
    }

    await interaction.reply({ embeds: [embed] });
  },
};