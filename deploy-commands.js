// deploy-commands.js
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Logger = require('./src/utils/logger');

const commands = [];
const commandsPath = path.join(__dirname, 'src/commands');

// 递归读取所有命令
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

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    Logger.info(`开始注册 ${commands.length} 个斜杠命令...`);

    // 全局注册（生产环境）
    // await rest.put(
    //   Routes.applicationCommands(process.env.CLIENT_ID),
    //   { body: commands }
    // );

    // 测试服务器注册（开发环境，即时生效）
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    Logger.success(`成功注册 ${commands.length} 个斜杠命令！`);
  } catch (error) {
    Logger.error(`注册命令失败: ${error.message}`);
    console.error(error);
  }
})();