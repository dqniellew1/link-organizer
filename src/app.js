const express = require('express');
const path = require('path');
const config = require('./config');
const sequelize = require('./db/database');
const bot = require('./bot');
const webRoutes = require('./web/routes');

// Import models to ensure they are registered
const Link = require('./db/models/Link');
const Tag = require('./db/models/Tag');

// Setup associations
Link.belongsToMany(Tag, { through: 'LinkTag' });
Tag.belongsToMany(Link, { through: 'LinkTag' });

const app = express();

// Serve static files for Mini App
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// API Routes
app.use('/api', webRoutes);

async function start() {
    try {
        // Database Sync
        await sequelize.sync({ alter: true });
        console.log('✅ Database synced');

        // Start Bot
        if (config.telegramBotToken) {
            bot.launch();
            console.log('🤖 Bot started');
        } else {
            console.warn('⚠️ No Bot Token provided, bot will not start.');
        }

        // Start Web Server
        app.listen(config.port, () => {
            console.log(`🌍 Server running on http://localhost:${config.port}`);
        });

        // Graceful Stop
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));

    } catch (error) {
        console.error('Failed to start app:', error);
    }
}

start();
