// src/commands/utility/ping.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription(`${config.emojis.ping} 查看 Bot 延迟`),

  async execute(interaction) {
    const sent = await interaction.deferReply({ fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = interaction.client.ws.ping;

    const getLatencyColor = (ms) => {
      if (ms < 100) return '#57F287'; // 绿
      if (ms < 200) return '#FEE75C'; // 黄
      return '#ED4245'; // 红
    };

    const getLatencyEmoji = (ms) => {
      if (ms < 100) return '🟢';
      if (ms < 200) return '🟡';
      return '🔴';
    };

    const embed = new EmbedBuilder()
      .setColor(getLatencyColor(roundtrip))
      .setTitle(`${config.emojis.ping} Pong!`)
      .addFields(
        {
          name: `${getLatencyEmoji(roundtrip)} 往返延迟`,
          value: `\`${roundtrip}ms\``,
          inline: true,
        },
        {
          name: `${getLatencyEmoji(wsLatency)} WebSocket 延迟`,
          value: `\`${wsLatency}ms\``,
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.editReply({ embeds: [embed] });
  },
};