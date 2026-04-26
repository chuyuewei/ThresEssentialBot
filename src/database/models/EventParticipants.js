// src/database/models/EventParticipants.js
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const EventParticipants = sequelize.define('EventParticipants', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('interested', 'going', 'maybe', 'not_going'),
      defaultValue: 'going',
    },
  }, {
    tableName: 'event_participants',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['event_id', 'user_id'],
      },
    ],
  });

  return EventParticipants;
};
