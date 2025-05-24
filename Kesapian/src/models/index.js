// models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const User = require('./user')(sequelize, DataTypes);

module.exports = {
  sequelize,
  User,
};
