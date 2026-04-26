// src/commands/utility/voteresults.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config');
const Logger = require('../../utils/logger');
const db = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voteresults')
    .setDescription('View vote results')
    .addStringOption((option) =>
      option
        .setName('message_id')
        .setDescription('Vote message ID')
        .setRequired(true)
    ),

  async execute(interaction) {
    const messageId = interaction.options.getString('message_id');

    try {
      const vote = await db.Votes.findOne({
        where: {
          message_id: messageId,
          guild_id: interaction.guild.id,
        },
      });

      if (!vote) {
        await interaction.reply({
          content: 'Cannot find specified vote',
          ephemeral: true,
        });
        return;
      }

      // Get vote details
      const voteOptions = await db.VoteOptions.findAll({
        where: { vote_id: vote.id },
      });

      const totalVotes = voteOptions.length;
      const userVotes = {};

      for (const vo of voteOptions) {
        if (!userVotes[vo.user_id]) {
          userVotes[vo.user_id] = [];
        }
        userVotes[vo.user_id].push(vo.option_id);
      }

      // Create result embed
      const embed = new EmbedBuilder()
        .setColor(config.bot.infoColor)
        .setTitle(`📊 Vote Results: ${vote.title}`)
        .setDescription(vote.description || '')
        .addFields(
          { name: 'Total Votes', value: totalVotes.toString(), inline: true },
          { name: 'Participants', value: Object.keys(userVotes).length.toString(), inline: true },
          { name: 'Status', value: vote.is_active ? 'In Progress' : 'Ended', inline: true },
        )
        .setTimestamp()
        .setFooter({ text: config.bot.name });

      if (vote.ends_at) {
        const endTime = new Date(vote.ends_at);
        const isExpired = new Date() > endTime;
        embed.addFields({
          name: 'End Time',
          value: `<t:${Math.floor(endTime.getTime() / 1000)}:F> ${isExpired ? '(Expired)' : ''}`,
          inline: true,
        });
      }

      // Add option results
      const optionsResults = vote.options
        .map((opt, i) => {
          const percentage = totalVotes > 0 ? ((opt.count / totalVotes) * 100).toFixed(1) : 0;
          const bar = '█'.repeat(Math.floor(percentage / 5)) || '░';
          return `${i + 1}. ${opt.label}\n   ${opt.count} votes (${percentage}%)\n   ${bar}`;
        })
        .join('\n\n');

      embed.addFields({
        name: 'Option Results',
        value: optionsResults.substring(0, 4000),
        inline: false,
      });

      // If not anonymous vote, show voters
      if (!vote.is_anonymous && Object.keys(userVotes).length > 0) {
        const votersText = Object.entries(userVotes)
          .map(([userId, options]) => {
            const user = interaction.client.users.cache.get(userId);
            const userTag = user ? user.tag : userId;
            const optionLabels = options
              .map(optId => {
                const opt = vote.options.find(o => o.id === optId);
                return opt ? opt.label : optId;
              })
              .join(', ');
            return `${userTag}: ${optionLabels}`;
          })
          .join('\n');

        embed.addFields({
          name: 'Voters',
          value: votersText.substring(0, 1000),
          inline: false,
        });
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      Logger.error(`Failed to get vote results: ${error.message}`);
      await interaction.reply({
        content: 'Failed to get vote results',
        ephemeral: true,
      });
    }
  },
};
