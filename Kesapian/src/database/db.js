
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('kesapian', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: console.log,
});

module.exports = sequelize;
