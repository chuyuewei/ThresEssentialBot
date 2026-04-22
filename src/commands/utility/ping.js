// src/commands/utility/ping.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription(`${config.emojis.ping} Check bot latency`),

  async execute(interaction) {
    const sent = await interaction.deferReply({ fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = interaction.client.ws.ping;

    const getLatencyColor = (ms) => {
      if (ms < 100) return '#57F287'; // Green
      if (ms < 200) return '#FEE75C'; // Yellow
      return '#ED4245'; // Red
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
          name: `${getLatencyEmoji(roundtrip)} Roundtrip Latency`,
          value: `\`${roundtrip}ms\``,
          inline: true,
        },
        {
          name: `${getLatencyEmoji(wsLatency)} WebSocket Latency`,
          value: `\`${wsLatency}ms\``,
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    await interaction.editReply({ embeds: [embed] });
  },
};