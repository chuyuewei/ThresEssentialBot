// src/events/interactionCreate.js
const { Events } = require('discord.js');
const Logger = require('../utils/logger');
const EmbedFactory = require('../utils/embed');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      Logger.warn(`Unknown command: ${interaction.commandName}`);
      return;
    }

    try {
      Logger.command(interaction.user.tag, interaction.commandName);
      await command.execute(interaction);
    } catch (error) {
      Logger.error(`Error executing /${interaction.commandName}: ${error.message}`);
      console.error(error);

      const errorEmbed = EmbedFactory.error(
        'Command Failed',
        'An unexpected error occurred while executing this command. Please try again later.'
      );

      const reply = { embeds: [errorEmbed], ephemeral: true };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  },
};