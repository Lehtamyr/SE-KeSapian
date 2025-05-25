const { Sequelize, DataTypes } = require('sequelize'); 
const sequelize = require('../database/db'); 
const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize; 

db.User = require('./user')(sequelize, DataTypes); 

module.exports = db; 
