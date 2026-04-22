// src/utils/embed.js
const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

class EmbedFactory {
  /**
   * Create a success type Embed
   */
  static success(title, description) {
    return new EmbedBuilder()
      .setColor(config.bot.successColor)
      .setTitle(`${config.emojis.success} ${title}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: config.bot.name });
  }

  /**
   * Create an error type Embed
   */
  static error(title, description) {
    return new EmbedBuilder()
      .setColor(config.bot.errorColor)
      .setTitle(`${config.emojis.error} ${title}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: config.bot.name });
  }

  /**
   * Create a warning type Embed
   */
  static warn(title, description) {
    return new EmbedBuilder()
      .setColor(config.bot.warnColor)
      .setTitle(`${config.emojis.warn} ${title}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: config.bot.name });
  }

  /**
   * Create an info type Embed
   */
  static info(title, description) {
    return new EmbedBuilder()
      .setColor(config.bot.infoColor)
      .setTitle(`${config.emojis.info} ${title}`)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: config.bot.name });
  }

  /**
   * Create a moderation log Embed
   */
  static modLog({ action, moderator, target, reason, extra = {} }) {
    const embed = new EmbedBuilder()
      .setColor(config.bot.warnColor)
      .setTitle(`${config.emojis.shield} Moderation Action — ${action}`)
      .addFields(
        { name: '👤 Target User', value: `${target} (${target.id})`, inline: true },
        { name: '🛡️ Moderator', value: `${moderator} (${moderator.id})`, inline: true },
        { name: '📝 Reason', value: reason || 'No reason provided', inline: false },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    // Add extra fields
    for (const [key, value] of Object.entries(extra)) {
      embed.addFields({ name: key, value: String(value), inline: true });
    }

    return embed;
  }
}

module.exports = EmbedFactory;