# Link Organizer Bot - Detailed Implementation Plan (Node.js Edition)

## Overview
A Telegram Bot to store, organize, and search links.
Features:
-   **Save Links**: User sends URL -> Bot extracts content.
-   **AI Intelligence**: Uses **Claude API** to summarize content and auto-tag.
-   **Search**: Text & Tag search via Bot and Mini App.
-   **UI**: Telegram Mini App (Web) for browsing.

## Technology Stack
-   **Language**: Node.js
-   **Bot Framework**: `telegraf` (Modern, middleware-based Telegram bot framework)
-   **Server**: `express` (To serve the Mini App / Webhook)
-   **Database**: `SQLite` (via `sequelize` ORM)
-   **AI**: `anthropic` (Claude 3.5 Sonnet / Haiku for fast summaries)
-   **Scraper**: `@mozilla/readability` + `jsdom` + `axios`

## Database Schema (Sequelize Models)

**Link**
-   `id`: INTEGER PK
-   `url`: STRING UNIQUE
-   `title`: STRING
-   `summary`: TEXT
-   `content_text`: TEXT (for full-text search)
-   `media_type`: ENUM('article', 'video', 'tweet')
-   `created_at`: DATE

**Tag**
-   `id`: INTEGER PK
-   `name`: STRING UNIQUE

**LinkTag** (Junction Table)
-   `link_id`: FK -> Link
-   `tag_id`: FK -> Tag

## Folder Structure

```
link_organizer/
├── .env                  # Secrets (BOT_TOKEN, ANTHROPIC_API_KEY)
├── package.json
├── src/
│   ├── config.js         # Env vars loader
│   ├── app.js            # Express App entry point
│   ├── bot/
│   │   ├── index.js      # Telegraf Bot setup
│   │   ├── handlers.js   # Command handlers
│   │   └── scenes.js     # (Optional) conversational flows
│   ├── db/
│   │   ├── database.js   # Sequelize init
│   │   └── models/
│   │       ├── Link.js
│   │       └── Tag.js
│   ├── services/
│   │   ├── scraper.js    # Readability logic
│   │   └── claude.js     # Anthropic API logic
│   └── web/              # Mini App routes
│       └── routes.js
└── public/               # Static files for Mini App
    ├── index.html
    ├── style.css
    └── script.js
```

## Step-by-Step Implementation Tasks

### Phase 1: Setup & Database
1.  Initialize project: `npm init -y`.
2.  Install dependencies: `npm install telegraf sequelize sqlite3 anthropic @mozilla/readability jsdom axios express dotenv`.
3.  Dev dependencies: `npm install --save-dev nodemon`.
4.  Setup `src/db/database.js`: Initialize Sequelize with SQLite dialect.
5.  Define Models (`Link`, `Tag`) and associations (`Link.belongsToMany(Tag)`).

### Phase 2: Core Services
1.  **Scraper (`src/services/scraper.js`)**:
    -   `fetchAndParse(url)`: Use axios to get HTML, JSDOM to parse, Readability to extract main content.
2.  **AI (`src/services/claude.js`)**:
    -   `summarize(text)`: Send prompt to Claude: "Summarize this text in 3 sentences and provide 5 relevant tags (JSON format)."

### Phase 3: Bot Implementation
1.  **Telegraf Setup (`src/bot/index.js`)**:
    -   Initialize bot with `process.env.TELEGRAM_BOT_TOKEN`.
    -   Middleware: `session()`.
2.  **Handlers**:
    -   `/start`: Welcome + "My Links" web app button.
    -   **URL Listener**: Regex or text handler to detect URLs.
        -   Trigger `scraper.fetchAndParse`.
        -   Trigger `claude.summarize`.
        -   Save to DB.
        -   Reply with card.
    -   `/search <query>`: query DB models.

### Phase 4: Web UI (Telegram Mini App)
1.  **Express**: Serve `public` folder.
2.  **Frontend (`public/index.html`)**:
    -   `Telegram.WebApp.ready()`.
    -   Fetch user's links from API.
    -   Display grid of content cards.
    -   Search bar filter.

## Configuration Requirements
-   `TELEGRAM_BOT_TOKEN`: From @BotFather.
-   `ANTHROPIC_API_KEY`: From Anthropic Console.
