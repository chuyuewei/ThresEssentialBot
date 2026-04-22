// src/handlers/commandHandler.js
const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');

async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');
  const categories = fs.readdirSync(commandsPath);
  let count = 0;

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const stat = fs.statSync(categoryPath);

    if (!stat.isDirectory()) continue;

    const commandFiles = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(path.join(categoryPath, file));

      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        count++;
      } else {
        Logger.warn(`命令 ${file} 缺少 "data" 或 "execute" 属性，已跳过`);
      }
    }
  }

  Logger.success(`已加载 ${count} 个命令`);
}

module.exports = { loadCommands };