// src/database/models/Reports.js
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Reports = sequelize.define('Reports', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    guild_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reporter_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    target_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('spam', 'harassment', 'inappropriate', 'rule_violation', 'other'),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    evidence: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Links to evidence or additional context',
    },
    message_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID of the reported message',
    },
    channel_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID of the channel where the incident occurred',
    },
    status: {
      type: DataTypes.ENUM('pending', 'investigating', 'resolved', 'rejected'),
      defaultValue: 'pending',
    },
    handler_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID of the staff member handling the report',
    },
    resolution_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'reports',
    timestamps: true,
  });

  return Reports;
};
