// src/utils/embed.js
const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

class EmbedFactory {
  /**
   * 创建成功类型的 Embed
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
   * 创建错误类型的 Embed
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
   * 创建警告类型的 Embed
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
   * 创建信息类型的 Embed
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
   * 创建管理日志 Embed
   */
  static modLog({ action, moderator, target, reason, extra = {} }) {
    const embed = new EmbedBuilder()
      .setColor(config.bot.warnColor)
      .setTitle(`${config.emojis.shield} 管理操作 — ${action}`)
      .addFields(
        { name: '👤 目标用户', value: `${target} (${target.id})`, inline: true },
        { name: '🛡️ 执行者', value: `${moderator} (${moderator.id})`, inline: true },
        { name: '📝 原因', value: reason || '未提供原因', inline: false },
      )
      .setTimestamp()
      .setFooter({ text: config.bot.name });

    // 添加额外字段
    for (const [key, value] of Object.entries(extra)) {
      embed.addFields({ name: key, value: String(value), inline: true });
    }

    return embed;
  }
}

module.exports = EmbedFactory;