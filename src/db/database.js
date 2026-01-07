const { Sequelize } = require('sequelize');
const config = require('../config');
const path = require('path');

let sequelize;

// Use PostgreSQL if DATABASE_URL is provided (production)
// Otherwise use SQLite (local development)
if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false,
    });
    console.log('📦 Using PostgreSQL database');
} else {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../../', config.dbPath),
        logging: false,
    });
    console.log('📦 Using SQLite database (local)');
}

module.exports = sequelize;
