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
      Logger.warn(`未知命令: ${interaction.commandName}`);
      return;
    }

    try {
      Logger.command(interaction.user.tag, interaction.commandName);
      await command.execute(interaction);
    } catch (error) {
      Logger.error(`执行命令 /${interaction.commandName} 时出错: ${error.message}`);
      console.error(error);

      const errorEmbed = EmbedFactory.error(
        '命令执行失败',
        '执行此命令时发生了一个意外错误，请稍后重试。'
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