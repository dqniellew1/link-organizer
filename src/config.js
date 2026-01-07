require('dotenv').config();

module.exports = {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    port: process.env.PORT || 3000,
    dbPath: process.env.DB_PATH || 'database.sqlite',
    webAppUrl: process.env.WEB_APP_URL || 'http://localhost:3000',
};
