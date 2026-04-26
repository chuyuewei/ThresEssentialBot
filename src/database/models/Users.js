// src/database/models/Users.js
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('Users', {
    user_id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    guild_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    xp: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    message_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    warning_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_muted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    mute_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rules_accepted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    last_active: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'users',
    timestamps: true,
  });

  return Users;
};
