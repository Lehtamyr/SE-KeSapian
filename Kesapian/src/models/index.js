const Sequelize = require('sequelize');
const sequelize = require('../database/db'); 

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./user')(sequelize, Sequelize);
db.UserLocation = require('./location')(sequelize, Sequelize);
db.Friendship = require('./friendship')(sequelize, Sequelize);

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


module.exports = db;