const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../database/db'); // Pastikan ini path ke instance sequelize Anda

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = require('./User')(sequelize, DataTypes);
db.Friendship = require('./Friendship')(sequelize, DataTypes); // <-- Import model Friendship

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;