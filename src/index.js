// src/index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const Logger = require('./utils/logger');
const config = require('../config');

// ═══════════════════════════════════════════════
// Thres // Essential — Discord Moderation Bot
// ═══════════════════════════════════════════════

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
  ],
});

// 命令集合
client.commands = new Collection();
client.config = config;

// 加载模块
(async () => {
  Logger.banner();
  await loadCommands(client);
  await loadEvents(client);

  // 登录
  client.login(process.env.DISCORD_TOKEN).catch((err) => {
    Logger.error(`登录失败: ${err.message}`);
    process.exit(1);
  });
})();

// 全局错误处理
process.on('unhandledRejection', (err) => {
  Logger.error(`未捕获的 Promise 异常: ${err.message}`);
  console.error(err);
});

process.on('uncaughtException', (err) => {
  Logger.error(`未捕获的异常: ${err.message}`);
  console.error(err);
});