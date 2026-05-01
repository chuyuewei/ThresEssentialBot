// deploy-commands.js
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Logger = require('./src/utils/logger');

// ──────────────────────────────────────────
// Mock: prevent native sqlite3 from loading
// deploy-commands doesn't need the database
// ──────────────────────────────────────────
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id.includes('database/models') || id.includes('database')) {
    // Return a harmless mock so Sequelize/sqlite3 never loads
    return {
      sequelize: { sync: () => Promise.resolve(), authenticate: () => Promise.resolve() },
      Sequelize: { Op: {} },
      Users: {},
      Warnings: {},
      Votes: {},
      VoteOptions: {},
      Reports: {},
      Events: {},
      EventParticipants: {},
      Levels: {},
      Tickets: {},
    };
  }
  return originalRequire.apply(this, arguments);
};

const commands = [];
const commandsPath = path.join(__dirname, 'src/commands');

// Recursively read all commands
function readCommands(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      readCommands(fullPath);
    } else if (entry.name.endsWith('.js')) {
      const command = require(fullPath);
      if ('data' in command) {
        commands.push(command.data.toJSON());
      }
    }
  }
}

readCommands(commandsPath);

// Restore original require
Module.prototype.require = originalRequire;

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    Logger.info(`Registering ${commands.length} slash commands...`);

    // Global registration (production)
    // await rest.put(
    //   Routes.applicationCommands(process.env.CLIENT_ID),
    //   { body: commands }
    // );

    // Guild registration (dev, instant)
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    Logger.success(`Successfully registered ${commands.length} slash commands!`);
  } catch (error) {
    Logger.error(`Failed to register commands: ${error.message}`);
    console.error(error);
  }
})();