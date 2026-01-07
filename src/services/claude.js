const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

// Initialize conditionally to avoid crashing if key is missing during dev
const anthropic = config.anthropicApiKey ? new Anthropic({
    apiKey: config.anthropicApiKey,
}) : null;

async function generateSummary(text) {
    if (!anthropic) {
        return { summary: "AI Summary unavailable (No API Key)", tags: [] };
    }

    try {
        // Truncate text if too long to save tokens
        const truncatedText = text.slice(0, 15000);

        const msg = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 300,
            temperature: 0.5,
            system: "You are a helpful assistant that summarizes web content. Output ONLY valid JSON with keys: 'summary' (string, max 3 sentences) and 'tags' (array of strings, max 5 relevant tags).",
            messages: [
                {
                    "role": "user",
                    "content": `Please summarize the following text:\n\n${truncatedText}`
                }
            ]
        });

        try {
            // Find the JSON block in the response (handling potential non-JSON prefix/suffix even with strict system prompt)
            const content = msg.content[0].text;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return { summary: content, tags: [] };
        } catch (parseError) {
            console.error("Error parsing Claude response:", parseError);
            return { summary: msg.content[0].text, tags: [] };
        }

    } catch (error) {
        console.error("Claude API Error:", error);
        return { summary: "Error generating summary.", tags: [] };
    }
}

module.exports = { generateSummary };
