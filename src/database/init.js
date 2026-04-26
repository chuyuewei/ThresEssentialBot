// src/database/init.js
const db = require('./models');
const Logger = require('../utils/logger');

async function initDatabase() {
  try {
    await db.sequelize.sync({ alter: true });
    Logger.success('Database synchronized successfully');

    // Create default levels if they don't exist
    const existingLevels = await db.Levels.findAll();
    if (existingLevels.length === 0) {
      await createDefaultLevels();
      Logger.success('Default levels created');
    }

    process.exit(0);
  } catch (error) {
    Logger.error(`Database initialization failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

async function createDefaultLevels() {
  const defaultLevels = [
    { level: 1, name: 'Initiate', required_xp: 0 },
    { level: 2, name: 'Operative', required_xp: 500 },
    { level: 3, name: 'Specialist', required_xp: 2000 },
    { level: 4, name: 'Veteran', required_xp: 5000 },
    { level: 5, name: 'Elite', required_xp: 10000 },
  ];

  for (const levelData of defaultLevels) {
    await db.Levels.create({
      guild_id: 'default',
      ...levelData,
    });
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase, createDefaultLevels };
