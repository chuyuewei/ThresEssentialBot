// src/database/models/Warnings.js
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Warnings = sequelize.define('Warnings', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    guild_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    moderator_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('warning', 'mute', 'kick', 'ban'),
      defaultValue: 'warning',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in minutes for mutes',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'warnings',
    timestamps: true,
  });

  return Warnings;
};
