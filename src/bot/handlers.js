const { Markup } = require('telegraf');
const Link = require('../db/models/Link');
const Tag = require('../db/models/Tag');
const scraper = require('../services/scraper');
const claude = require('../services/claude');

// Helper to validate URL
const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

const handleStart = async (ctx) => {
    const webAppUrl = process.env.WEB_APP_URL || 'http://localhost:3000';

    await ctx.reply(
        'Welcome to Link Organizer! 📚\n\nSend me any link to save it, or use /search to find saved links.\n\n📱 Open your library with the button below:',
        Markup.keyboard([
            [Markup.button.webApp('📚 Open My Library', webAppUrl)]
        ]).resize()
    );
};

const handleURL = async (ctx) => {
    const url = ctx.message.text;

    if (!isValidUrl(url)) {
        return ctx.reply('Please send a valid URL.');
    }

    const processingMsg = await ctx.reply('🔍 Processing link...');

    try {
        // 1. Scrape Content
        const article = await scraper.fetchAndParse(url);

        // 2. Generate Summary & Tags
        await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, null, '🧠 Generating summary with Claude...');
        const aiData = await claude.generateSummary(article.content);

        // 3. Save to DB
        const [link, created] = await Link.findOrCreate({
            where: { url: url },
            defaults: {
                title: article.title,
                content_text: article.content,
                summary: aiData.summary,
                media_type: 'article' // Simple detection for now
            }
        });

        if (!created) {
            // Setup update logic if needed, for now just notify exist
            await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, null, '⚠️ Link already exists!');
            return ctx.reply(`*${link.title}*\n\n${link.summary}`, { parse_mode: 'Markdown' });
        }

        // 4. Handle Tags
        if (aiData.tags && aiData.tags.length > 0) {
            for (const tagName of aiData.tags) {
                const [tag] = await Tag.findOrCreate({ where: { name: tagName } });
                await link.addTag(tag);
            }
        }

        // 5. Success Reply
        const tagsStr = aiData.tags.map(t => `#${t.replace(/\s+/g, '')}`).join(', ');
        const dateStr = new Date().toLocaleString();

        // Extract hostname for cleaner link display
        let hostname = '';
        try { hostname = new URL(link.url).hostname; } catch (e) { }

        const replyText =
            `✅ **Saved successfully!**

📎 **ID:** ${link.id}

📄 **${link.title}**

${link.summary}

🔗 **Link**
🌐 ${hostname}
[Open Link](${link.url})

🏷️ **Tags**
${tagsStr}

📅 ${dateStr}`;

        await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, null, replyText, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error(error);
        await ctx.telegram.editMessageText(ctx.chat.id, processingMsg.message_id, null, `❌ Error processing link: ${error.message}`);
    }
};

const handleSearch = async (ctx) => {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) {
        return ctx.reply('Usage: /search <keyword>');
    }

    const { Op } = require('sequelize');
    const results = await Link.findAll({
        where: {
            [Op.or]: [
                { title: { [Op.like]: `%${query}%` } },
                { summary: { [Op.like]: `%${query}%` } }
            ]
        },
        limit: 5
    });

    if (results.length === 0) {
        return ctx.reply('No links found.');
    }

    let msg = `🔍 *Search Results for "${query}"*:\n\n`;
    results.forEach(link => {
        msg += `• [${link.title}](${link.url})\n`;
    });

    ctx.reply(msg, { parse_mode: 'Markdown' });
};

const handleTag = async (ctx) => {
    const replyTo = ctx.message.reply_to_message;
    if (!replyTo) {
        return ctx.reply('⚠️ Reply to a link message to tag it.');
    }

    // Extract URL from the replied message
    let text = replyTo.text || replyTo.caption || '';
    const entities = replyTo.entities || replyTo.caption_entities || [];
    let url = null;

    if (isValidUrl(text)) {
        url = text;
    } else {
        const linkEntity = entities.find(e => e.type === 'url' || e.type === 'text_link');
        if (linkEntity) {
            if (linkEntity.type === 'text_link') {
                url = linkEntity.url;
            } else {
                url = text.substring(linkEntity.offset, linkEntity.offset + linkEntity.length);
            }
        }
    }

    if (!url && text.startsWith('http')) {
        url = text.split('\n')[0].trim();
    }

    if (!url) {
        return ctx.reply('⚠️ Could not find a URL in the replied message.');
    }

    const tagNames = ctx.message.text.split(' ').slice(1);
    if (tagNames.length === 0) {
        return ctx.reply('Usage: /tag <tag1> <tag2> ...');
    }

    try {
        const link = await Link.findOne({ where: { url: url } });
        if (!link) {
            return ctx.reply('⚠️ Link not found in database. Ensure you are replying to a message with a saved link.');
        }

        for (const name of tagNames) {
            const cleanName = name.replace('#', '');
            const [tag] = await Tag.findOrCreate({ where: { name: cleanName } });
            await link.addTag(tag);
        }

        ctx.reply(`✅ Added tags: ${tagNames.map(t => '#' + t.replace('#', '')).join(' ')}`);

    } catch (err) {
        console.error(err);
        ctx.reply('❌ Error adding tags.');
    }
};

const handleRemove = async (ctx) => {
    const replyTo = ctx.message.reply_to_message;
    let url = null;
    let text = '';

    if (replyTo) {
        text = replyTo.text || replyTo.caption || '';
        const entities = replyTo.entities || replyTo.caption_entities || [];
        if (isValidUrl(text)) {
            url = text;
        } else {
            const linkEntity = entities.find(e => e.type === 'url' || e.type === 'text_link');
            if (linkEntity) {
                if (linkEntity.type === 'text_link') {
                    url = linkEntity.url;
                } else {
                    url = text.substring(linkEntity.offset, linkEntity.offset + linkEntity.length);
                }
            }
        }
        if (!url && text && text.startsWith('http')) {
            url = text.split('\n')[0].trim();
        }
    } else {
        // Check if user sent /remove <url>
        const args = ctx.message.text.split(' ');
        if (args.length > 1) {
            url = args[1];
        }
    }

    if (!url) {
        return ctx.reply('⚠️ To remove a link, reply to it with /remove, or use /remove <url>.');
    }

    try {
        const link = await Link.findOne({ where: { url: url } });
        if (!link) {
            return ctx.reply('⚠️ Link not found in database.');
        }

        await link.destroy();
        ctx.reply(`🗑️ Deleted: ${link.title}`);
    } catch (err) {
        console.error(err);
        ctx.reply('❌ Error deleting link.');
    }
};

module.exports = {
    handleStart,
    handleURL,
    handleSearch,
    handleTag,
    handleRemove
};

