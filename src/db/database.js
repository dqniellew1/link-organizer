const { Sequelize } = require('sequelize');
const config = require('../config');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../', config.dbPath),
    logging: false,
});

module.exports = sequelize;
