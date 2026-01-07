# Deployment Guide - Link Organizer Telegram Mini App

## Quick Deploy Options

### Option 1: Render (Recommended - Free Tier Available)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create link-organizer --public --source=. --remote=origin --push
   ```

2. **Deploy on Render:**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Use these settings:
     - **Name:** link-organizer
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Environment Variables:**
       - `TELEGRAM_BOT_TOKEN`: Your bot token
       - `ANTHROPIC_API_KEY`: Your API key
       - `PORT`: 3000
       - `WEB_APP_URL`: (will be: https://link-organizer.onrender.com)

3. **Get Your URL:**
   - After deployment, Render gives you: `https://your-app-name.onrender.com`
   - Copy this URL

4. **Update Environment Variable:**
   - In Render dashboard, update `WEB_APP_URL` to your new URL
   - Click "Manual Deploy" to restart

### Option 2: Railway (Free $5 credit/month)

1. **Deploy:**
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   railway up
   ```

2. **Add Domain:**
   ```bash
   railway domain
   ```

3. **Set Environment Variables:**
   ```bash
   railway variables set TELEGRAM_BOT_TOKEN=your_token
   railway variables set ANTHROPIC_API_KEY=your_key
   railway variables set WEB_APP_URL=https://your-app.railway.app
   ```

### Option 3: Vercel (Serverless)

**Note:** Vercel requires modifications for the bot to work (webhook mode instead of polling).

### Option 4: Your Own VPS (DigitalOcean, AWS, etc.)

1. **SSH into server:**
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone & Setup:**
   ```bash
   git clone your-repo-url
   cd link-organizer
   npm install
   ```

4. **Setup PM2 (process manager):**
   ```bash
   npm install -g pm2
   pm2 start src/app.js --name link-organizer
   pm2 save
   pm2 startup
   ```

5. **Setup Nginx (reverse proxy):**
   ```bash
   sudo apt install nginx
   ```
   
   Create `/etc/nginx/sites-available/link-organizer`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Setup SSL with Certbot:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## After Deployment

### Configure Telegram Bot

1. **Set Web App URL in your .env on server:**
   ```bash
   WEB_APP_URL=https://your-deployed-url.com
   ```

2. **Test the Mini App:**
   - Send `/start` to your bot
   - Click the "📚 Open My Library" button
   - The web app should open inside Telegram!

### Optional: Set Menu Button

Use BotFather to add a persistent menu button:

```
/setmenubutton
@your_bot_name
[Paste this JSON]
{
  "text": "📚 My Library",
  "web_app": {
    "url": "https://your-deployed-url.com"
  }
}
```

## Troubleshooting

### Bot not responding after deployment:
- Check logs in your hosting platform
- Verify environment variables are set correctly
- Make sure PORT is set to what your host expects

### Mini App button not working:
- URL must be HTTPS (not HTTP)
- URL must be publicly accessible
- Check browser console for errors

### Database issues:
- SQLite file might not persist on some platforms (use PostgreSQL for production)
- For Render: Database resets on each deploy (free tier)

## Production Recommendations

1. **Use PostgreSQL instead of SQLite:**
   - Install: `npm install pg`
   - Update `src/db/database.js` to use PostgreSQL

2. **Add rate limiting:**
   - Install: `npm install express-rate-limit`

3. **Setup monitoring:**
   - Use Render/Railway built-in monitoring
   - Or setup Sentry for error tracking

4. **Enable CORS properly:**
   - Add CORS middleware in `src/app.js`

5. **Use webhook mode for the bot (optional):**
   - More efficient than polling for high traffic
   - Requires HTTPS endpoint
