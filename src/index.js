// src/index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const Logger = require('./utils/logger');
const config = require('../config');
const db = require('./database/models');
const messageHistory = require('./utils/anti-spam/messageHistory');

// ═══════════════════════════════════════════════
// ThresEssential — Discord Moderation Bot
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

// Command collection
client.commands = new Collection();

// Load modules
const start = async () => {
  // Initialize database
  try {
    await db.sequelize.sync();
    Logger.success('Database synchronized successfully');
  } catch (error) {
    Logger.error(`Database initialization failed: ${error.message}`);
  }

  // Start message history cleanup
  messageHistory.startCleanup(60000); // Clean up every minute

  // Load commands and events
  await loadCommands(client);
  await loadEvents(client);

  // Login
  await client.login(process.env.DISCORD_TOKEN);
};

start().catch((err) => {
  Logger.error(`Login failed: ${err.message}`);
  process.exit(1);
});

// Global error handling
process.on('unhandledRejection', (err) => {
  Logger.error(`Unhandled Promise rejection: ${err.message}`);
  console.error(err);
});

process.on('uncaughtException', (err) => {
  Logger.error(`Unhandled exception: ${err.message}`);
  console.error(err);
});