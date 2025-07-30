# Deployment Guide

This guide will help you deploy your LLM Document Chat application to Vercel with a Neon PostgreSQL database.

## Prerequisites

- A Vercel account
- A Neon account (free tier available)
- An OpenAI API key

## Step 1: Set up Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up for a free account
2. Create a new project
3. Copy the connection string from the dashboard (it will look like: `postgresql://username:password@host/database?sslmode=require`)

## Step 2: Deploy to Vercel

### Option A: Deploy from GitHub (Recommended)

1. Push your code to GitHub (already done!)
2. Go to [vercel.com](https://vercel.com) and import your GitHub repository
3. During the import process, add these environment variables:

```
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=your_neon_connection_string_here
LOG_LEVEL=info
DEBUG=false
```

### Option B: Deploy using Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts to deploy
4. Add environment variables using `vercel env add`

## Step 3: Set up Database Schema

After deployment, you'll need to run database migrations:

```bash
# If using Vercel CLI locally
vercel env pull .env.local
npx prisma migrate deploy

# Or run this command in Vercel's function environment
# Add this to your build command in Vercel: 
# npm run build && npx prisma migrate deploy
```

## Step 4: Configure Build Command

In your Vercel project settings, update the build command to:

```
npx prisma generate && npx prisma migrate deploy && npm run build
```

## Step 5: Test Your Deployment

1. Visit your deployed URL
2. Try uploading a document
3. Check that the database is working by viewing the documents list

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `LOG_LEVEL` | Logging level (info, debug, error) | No |
| `DEBUG` | Enable debug mode (true/false) | No |
| `DEFAULT_VECTOR_STORE_ID` | OpenAI vector store ID | No |

## Troubleshooting

### Database Connection Issues
- Ensure your DATABASE_URL includes `?sslmode=require`
- Check that your Neon database is not paused (free tier pauses after inactivity)

### Build Failures
- Make sure Prisma generate runs before the build
- Check that all environment variables are set correctly

### OpenAI API Issues
- Verify your API key has sufficient credits
- Check API key permissions include Files, Assistants, and Vision APIs

## Updating Your Deployment

To update your deployment:
1. Push changes to your GitHub repository
2. Vercel will automatically redeploy
3. Database migrations will run automatically if configured in build command

## Production Considerations

For production use, consider:
- Upgrading to Neon Pro for better performance and no auto-pause
- Setting up monitoring and alerting
- Configuring proper logging levels
- Adding rate limiting
- Setting up backup strategies 