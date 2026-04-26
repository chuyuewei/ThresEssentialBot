// src/database/models/Events.js
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Events = sequelize.define('Events', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    guild_id: {
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
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    channel_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Voice channel or text channel for the event',
    },
    max_participants: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reminder_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'events',
    timestamps: true,
  });

  return Events;
};
