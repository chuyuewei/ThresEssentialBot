// src/database/models/VoteOptions.js
const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const VoteOptions = sequelize.define('VoteOptions', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    vote_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    option_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'vote_options',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['vote_id', 'user_id', 'option_id'],
      },
    ],
  });

  return VoteOptions;
};
