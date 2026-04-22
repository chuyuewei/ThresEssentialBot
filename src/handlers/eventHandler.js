// src/handlers/eventHandler.js
const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');

async function loadEvents(client) {
  const eventsPath = path.join(__dirname, '../events');
  const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'));
  let count = 0;

  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    count++;
  }

  Logger.success(`已加载 ${count} 个事件`);
}

module.exports = { loadEvents };