// database/db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('kesapian', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;
