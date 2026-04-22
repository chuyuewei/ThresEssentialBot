// src/commands/info/serverinfo.js
const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription(`${config.emojis.server} View server information`),

  async execute(interaction) {
    const { guild } = interaction;
    await guild.members.fetch(); // Ensure cache is fresh

    const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
    const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size;
    const totalChannels = guild.channels.cache.size;

    const online = guild.members.cache.filter((m) => m.presence?.status === 'online').size;
    const humans = guild.members.cache.filter((m) => !m.user.bot).size;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;

    const verificationLevels = {
      0: 'None',
      1: 'Low',
      2: 'Medium',
      3: 'High',
      4: 'Highest',
    };

    const embed = new EmbedBuilder()
      .setColor(config.bot.color)
      .setTitle(`${config.emojis.server} ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: '🆔 ID', value: guild.id, inline: true },
        { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
        {
          name: '📅 Created At',
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
          inline: true,
        },
        {
          name: `👥 Members [${guild.memberCount}]`,
          value: `👤 Humans: ${humans}\n🤖 Bots: ${bots}`,
          inline: true,
        },
        {
          name: `💬 Channels [${totalChannels}]`,
          value: `📝 Text: ${textChannels}\n🔊 Voice: ${voiceChannels}\n📁 Categories: ${categories}`,
          inline: true,
        },
        { name: '🏅 Roles', value: `${guild.roles.cache.size}`, inline: true },
        { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
        { name: '🔒 Verification Level', value: verificationLevels[guild.verificationLevel] || 'Unknown', inline: true },
        {
          name: '🚀 Boost Level',
          value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`,
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