const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

async function fetchAndParse(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });

        const dom = new JSDOM(response.data, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article) {
            throw new Error('Could not parse article content');
        }

        return {
            title: article.title,
            content: article.textContent,
            excerpt: article.excerpt,
            siteName: article.siteName
        };
    } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
        throw error;
    }
}

module.exports = { fetchAndParse };
