const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

// Helper to check if URL is Twitter/X
function isTwitterUrl(url) {
    return url.includes('twitter.com') || url.includes('x.com');
}

// Helper to extract meta tags (for Twitter, etc.)
function extractMetaTags(dom) {
    const doc = dom.window.document;
    const metaTags = {};

    // Get Open Graph tags
    doc.querySelectorAll('meta[property^="og:"]').forEach(meta => {
        const property = meta.getAttribute('property').replace('og:', '');
        metaTags[property] = meta.getAttribute('content');
    });

    // Get Twitter Card tags
    doc.querySelectorAll('meta[name^="twitter:"]').forEach(meta => {
        const name = meta.getAttribute('name').replace('twitter:', '');
        metaTags[name] = meta.getAttribute('content');
    });

    return metaTags;
}

async function fetchAndParse(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });

        const dom = new JSDOM(response.data, { url });

        // Special handling for Twitter/X links
        if (isTwitterUrl(url)) {
            const metaTags = extractMetaTags(dom);

            // Extract tweet ID from URL
            const tweetIdMatch = url.match(/status\/(\d+)/);
            const tweetId = tweetIdMatch ? tweetIdMatch[1] : '';

            // Extract username from URL
            const usernameMatch = url.match(/(?:twitter\.com|x\.com)\/([^\/]+)/);
            const username = usernameMatch ? usernameMatch[1] : 'User';

            // Twitter blocks scraping, so we provide a basic placeholder
            const tweetText = metaTags.description ||
                            `Tweet from @${username}. Twitter/X content requires viewing on the platform.`;

            return {
                title: `Tweet by @${username}`,
                content: tweetText + `\n\nView original: ${url}`,
                excerpt: tweetText.substring(0, 200),
                siteName: 'Twitter/X'
            };
        }

        // Standard article parsing for other sites
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article) {
            // Fallback to meta tags if Readability fails
            const metaTags = extractMetaTags(dom);
            if (metaTags.description || metaTags.title) {
                return {
                    title: metaTags.title || 'Untitled',
                    content: metaTags.description || metaTags.title || '',
                    excerpt: metaTags.description?.substring(0, 200) || '',
                    siteName: metaTags['site_name'] || 'Website'
                };
            }
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
