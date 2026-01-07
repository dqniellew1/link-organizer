const { Telegraf } = require('telegraf');
const config = require('../config');
const handlers = require('./handlers');

const bot = new Telegraf(config.telegramBotToken);

bot.command('start', handlers.handleStart);
bot.command('search', handlers.handleSearch);
bot.command('tag', handlers.handleTag);
bot.command('remove', handlers.handleRemove);
bot.on('text', (ctx) => {
    // Simple check if it looks like a URL, otherwise ignore or handle as chat
    if (ctx.message.text.startsWith('http')) {
        return handlers.handleURL(ctx);
    }
});

bot.catch((err, ctx) => {
    console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
});

module.exports = bot;
