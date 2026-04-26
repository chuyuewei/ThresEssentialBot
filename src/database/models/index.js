// src/database/models/index.js
const sequelize = require('../database');
const Sequelize = require('sequelize');
const Users = require('./Users');
const Warnings = require('./Warnings');
const Votes = require('./Votes');
const VoteOptions = require('./VoteOptions');
const Reports = require('./Reports');
const Events = require('./Events');
const EventParticipants = require('./EventParticipants');
const Levels = require('./Levels');
const Tickets = require('./Tickets');

// Initialize models
const db = {
  sequelize,
  Sequelize,
  Users: Users(sequelize, Sequelize),
  Warnings: Warnings(sequelize, Sequelize),
  Votes: Votes(sequelize, Sequelize),
  VoteOptions: VoteOptions(sequelize, Sequelize),
  Reports: Reports(sequelize, Sequelize),
  Events: Events(sequelize, Sequelize),
  EventParticipants: EventParticipants(sequelize, Sequelize),
  Levels: Levels(sequelize, Sequelize),
  Tickets: Tickets(sequelize, Sequelize),
};

// Define associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Vote associations
db.Votes.hasMany(db.VoteOptions, { foreignKey: 'vote_id', as: 'voteOptions' });
db.VoteOptions.belongsTo(db.Votes, { foreignKey: 'vote_id', as: 'vote' });

// Event associations
db.Events.hasMany(db.EventParticipants, { foreignKey: 'event_id', as: 'participants' });
db.EventParticipants.belongsTo(db.Events, { foreignKey: 'event_id', as: 'event' });

// Warning associations
db.Warnings.belongsTo(db.Users, { foreignKey: 'user_id', as: 'user' });
db.Users.hasMany(db.Warnings, { foreignKey: 'user_id', as: 'warnings' });

// Report associations
db.Reports.belongsTo(db.Users, { foreignKey: 'reporter_id', as: 'reporter' });
db.Reports.belongsTo(db.Users, { foreignKey: 'target_id', as: 'target' });

module.exports = db;
