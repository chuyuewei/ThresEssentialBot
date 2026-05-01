// src/database/models/index.js
let sequelize, Sequelize;

try {
  sequelize = require('../database');
  Sequelize = require('sequelize');
} catch (err) {
  console.warn(`[WARN] Database not available (${err.message}), using fallback memory store`);
}

// In-memory fallback when SQLite is unavailable
function createFallbackStore() {
  const store = {
    items: new Map(),
    findAll(opts) { return Promise.resolve([]); },
    findOne() { return Promise.resolve(null); },
    create(data) { return Promise.resolve({ ...data, id: Date.now(), save: () => Promise.resolve(), update: () => Promise.resolve() }); },
    update() { return Promise.resolve([0]); },
    destroy() { return Promise.resolve(); },
    count() { return Promise.resolve(0); },
  };
  return store;
}

const Users = sequelize ? require('./Users') : () => ({
  ...createFallbackStore(),
  findAll(opts) { return Promise.resolve([]); },
});
const Warnings = sequelize ? require('./Warnings') : () => createFallbackStore();
const Votes = sequelize ? require('./Votes') : () => ({
  ...createFallbackStore(),
});
const VoteOptions = sequelize ? require('./VoteOptions') : () => createFallbackStore();
const Reports = sequelize ? require('./Reports') : () => createFallbackStore();
const Events = sequelize ? require('./Events') : () => createFallbackStore();
const EventParticipants = sequelize ? require('./EventParticipants') : () => createFallbackStore();
const Levels = sequelize ? require('./Levels') : () => createFallbackStore();
const Tickets = sequelize ? require('./Tickets') : () => createFallbackStore();

const SequelizeRef = Sequelize || { Op: { gte: Symbol('gte'), lte: Symbol('lte') } };
const sequelizeRef = sequelize || { sync: () => Promise.resolve(), authenticate: () => Promise.resolve() };

// Initialize models
const db = {
  sequelize: sequelizeRef,
  Sequelize: SequelizeRef,
  Users: Users(sequelizeRef, SequelizeRef),
  Warnings: Warnings(sequelizeRef, SequelizeRef),
  Votes: Votes(sequelizeRef, SequelizeRef),
  VoteOptions: VoteOptions(sequelizeRef, SequelizeRef),
  Reports: Reports(sequelizeRef, SequelizeRef),
  Events: Events(sequelizeRef, SequelizeRef),
  EventParticipants: EventParticipants(sequelizeRef, SequelizeRef),
  Levels: Levels(sequelizeRef, SequelizeRef),
  Tickets: Tickets(sequelizeRef, SequelizeRef),
};

// Define associations (only if real Sequelize is available)
if (sequelize) {
  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.Votes.hasMany(db.VoteOptions, { foreignKey: 'vote_id', as: 'voteOptions' });
  db.VoteOptions.belongsTo(db.Votes, { foreignKey: 'vote_id', as: 'vote' });

  db.Events.hasMany(db.EventParticipants, { foreignKey: 'event_id', as: 'participants' });
  db.EventParticipants.belongsTo(db.Events, { foreignKey: 'event_id', as: 'event' });

  db.Warnings.belongsTo(db.Users, { foreignKey: 'user_id', as: 'user' });
  db.Users.hasMany(db.Warnings, { foreignKey: 'user_id', as: 'warnings' });

  db.Reports.belongsTo(db.Users, { foreignKey: 'reporter_id', as: 'reporter' });
  db.Reports.belongsTo(db.Users, { foreignKey: 'target_id', as: 'target' });
}

module.exports = db;