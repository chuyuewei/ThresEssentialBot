// src/database/models/Tickets.js
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Tickets = sequelize.define('Tickets', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    guild_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channel_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('open', 'closed', 'pending'),
      defaultValue: 'open',
    },
    ticket_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closed_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    close_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'tickets',
    timestamps: true,
  });

  return Tickets;
};
