const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('kesapian', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;
