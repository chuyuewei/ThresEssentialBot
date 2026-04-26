// src/database/models/Levels.js
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Levels = sequelize.define('Levels', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    guild_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    required_xp: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Role to assign when reaching this level',
    },
    rewards: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional rewards for reaching this level',
    },
  }, {
    tableName: 'levels',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['guild_id', 'level'],
      },
    ],
  });

  return Levels;
};
