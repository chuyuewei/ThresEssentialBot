// src/database/models/Votes.js
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Votes = sequelize.define('Votes', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    guild_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channel_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    creator_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    options: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of option objects {id, label, count}',
    },
    is_anonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    allow_multiple: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    ends_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'votes',
    timestamps: true,
  });

  return Votes;
};
