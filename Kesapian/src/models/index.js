const Sequelize = require('sequelize');
const sequelize = require('../database/db'); 

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./user')(sequelize, Sequelize);
db.UserLocation = require('./location')(sequelize, Sequelize);
db.Friendship = require('./friendship')(sequelize, Sequelize);
db.Chat = require('./Chat')(sequelize, Sequelize)
db.SuggestionText = require('./SuggestionText')(sequelize, Sequelize); 
db.OffensiveWord = require('./OffensiveWord')(sequelize); 

// Define Associations
db.User.hasOne(db.UserLocation, {
    foreignKey: 'user_id',
    as: 'userLocation', 
    onDelete: 'CASCADE', 
});
db.UserLocation.belongsTo(db.User, {
    foreignKey: 'user_id',
    as: 'user',
});

// Friendship associations
db.Friendship.belongsTo(db.User, {
    as: 'Requester',
    foreignKey: 'requesterId',
    onDelete: 'CASCADE',
});

// A Friendship has an Addressee (User)
db.Friendship.belongsTo(db.User, {
    as: 'Addressee',
    foreignKey: 'addresseeId',
    onDelete: 'CASCADE',
});

// Define reverse associations on User for easier querying of friendships
db.User.hasMany(db.Friendship, {
    as: 'SentFriendRequests',
    foreignKey: 'requesterId',
});

db.User.hasMany(db.Friendship, {
    as: 'ReceivedFriendRequests',
    foreignKey: 'addresseeId',
});

db.Group = require('./Group')(sequelize, Sequelize);
db.GroupMember = require('./GroupMember')(sequelize, Sequelize);
db.GroupMessage = require('./GroupMessage')(sequelize, Sequelize);

db.Group.hasMany(db.GroupMember, { as: 'members', foreignKey: 'group_id' });
db.GroupMember.belongsTo(db.Group, { as: 'group', foreignKey: 'group_id' });

db.Group.hasMany(db.GroupMessage, { as: 'messages', foreignKey: 'group_id' });
db.GroupMessage.belongsTo(db.Group, { as: 'group', foreignKey: 'group_id' });

db.GroupMember.belongsTo(db.User, { as: 'user', foreignKey: 'user_id' });
db.User.hasMany(db.GroupMember, { as: 'groupMemberships', foreignKey: 'user_id' });

db.GroupMessage.belongsTo(db.User, { as: 'sender', foreignKey: 'sender_id' });
db.User.hasMany(db.GroupMessage, { as: 'sentGroupMessages', foreignKey: 'sender_id' });

module.exports = db;