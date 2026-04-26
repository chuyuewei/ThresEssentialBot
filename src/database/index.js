// src/database/index.js
const sequelize = require('./database');
const Users = require('./models/Users');
const Warnings = require('./models/Warnings');
const Votes = require('./models/Votes');
const VoteOptions = require('./models/VoteOptions');
const Reports = require('./models/Reports');
const Events = require('./models/Events');
const EventParticipants = require('./models/EventParticipants');
const Levels = require('./models/Levels');

// Initialize models
const UsersModel = Users(sequelize, sequelize.Sequelize.DataTypes);
const WarningsModel = Warnings(sequelize, sequelize.Sequelize.DataTypes);
const VotesModel = Votes(sequelize, sequelize.Sequelize.DataTypes);
const VoteOptionsModel = VoteOptions(sequelize, sequelize.Sequelize.DataTypes);
const ReportsModel = Reports(sequelize, sequelize.Sequelize.DataTypes);
const EventsModel = Events(sequelize, sequelize.Sequelize.DataTypes);
const EventParticipantsModel = EventParticipants(sequelize, sequelize.Sequelize.DataTypes);
const LevelsModel = Levels(sequelize, sequelize.Sequelize.DataTypes);

// Define associations
VotesModel.hasMany(VoteOptionsModel, { foreignKey: 'vote_id', as: 'options' });
VoteOptionsModel.belongsTo(VotesModel, { foreignKey: 'vote_id', as: 'vote' });

EventsModel.hasMany(EventParticipantsModel, { foreignKey: 'event_id', as: 'participants' });
EventParticipantsModel.belongsTo(EventsModel, { foreignKey: 'event_id', as: 'event' });

WarningsModel.belongsTo(UsersModel, { foreignKey: 'user_id', targetKey: 'user_id', as: 'user' });
ReportsModel.belongsTo(UsersModel, { foreignKey: 'reporter_id', targetKey: 'user_id', as: 'reporter' });
ReportsModel.belongsTo(UsersModel, { foreignKey: 'target_id', targetKey: 'user_id', as: 'target' });

module.exports = {
  sequelize,
  Users: UsersModel,
  Warnings: WarningsModel,
  Votes: VotesModel,
  VoteOptions: VoteOptionsModel,
  Reports: ReportsModel,
  Events: EventsModel,
  EventParticipants: EventParticipantsModel,
  Levels: LevelsModel,
};
