# Railway Deployment Guide

This guide will help you deploy the backend API to Railway with native PDF processing support.

## Prerequisites

- Railway account ([railway.app](https://railway.app))
- GitHub repository with your code
- Neon PostgreSQL database connection string
- OpenAI API key

## Step 1: Deploy to Railway

1. **Go to [railway.app](https://railway.app)** and sign up/login with GitHub
2. **Click "Deploy from GitHub repo"**
3. **Select your repository**: `wolyslager/llm-document-chat`
4. **Railway will automatically**:
   - Detect the `Dockerfile`
   - Install Poppler utilities (including `pdftocairo`)
   - Build and deploy your application

## Step 2: Configure Environment Variables

In your Railway dashboard, add these environment variables:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_s6aqnSrYRg3w@ep-icy-term-ae8ss3w8-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
UPSTASH_REDIS_REST_URL=https://evolved-orca-62396.upstash.io
UPSTASH_REDIS_REST_TOKEN=AfO8AAIjcDE0MGUxYjdkNzNiYTA0ZTZjOGM2ZjBmZGZkNGYyMzAwMXAxMA
LOG_LEVEL=info
NODE_ENV=production
DEBUG=false
```

## Step 3: Run Database Migration

Railway will automatically run `npx prisma generate` during build. The database schema should already exist from your local migration.

## Step 4: Test Your Railway Deployment

Once deployed, Railway will give you a URL like `https://your-app-name.railway.app`.

Test it using our test script:

```bash
node test-deployment.js https://your-app-name.railway.app
```

## Step 5: Update Vercel Frontend

1. **Go to your Vercel dashboard**
2. **Navigate to your project settings**
3. **Add environment variable**:
   ```
   BACKEND_URL=https://your-app-name.railway.app
   ```
4. **Redeploy your Vercel frontend**

## Step 6: Verify PDF Processing

1. **Visit your Vercel frontend URL**
2. **Upload a PDF document**
3. **Verify that**:
   - PDF is converted to images successfully
   - Document classification works
   - Table extraction displays properly
   - No `pdftocairo: command not found` errors

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │
│   (Vercel)      │───▶│   (Railway)     │
│                 │    │                 │
│ • Next.js UI    │    │ • PDF Processing│
│ • Static Assets │    │ • OpenAI API    │
│ • Fast CDN      │    │ • Database      │
└─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   Database      │
                       │   (Neon)        │
                       │                 │
                       │ • PostgreSQL    │
                       │ • Managed       │
                       └─────────────────┘
```

## Benefits of This Setup

✅ **Native Binaries**: Railway supports `pdftocairo` and other system tools  
✅ **Scalable**: Backend can handle heavy PDF processing workloads  
✅ **Fast Frontend**: Vercel optimizes static assets and UI  
✅ **Cost Effective**: Railway has a generous free tier  
✅ **Easy Debugging**: Separate logs for frontend and backend  

## Troubleshooting

### Build Fails
- Check Railway build logs for specific errors
- Ensure all environment variables are set
- Verify Dockerfile syntax

### Database Connection Issues
- Confirm DATABASE_URL is correct
- Check if Neon database is active (free tier pauses after inactivity)
- Verify database schema exists

### PDF Processing Fails
- Check Railway runtime logs
- Verify Poppler utilities installed correctly
- Test with a simple PDF first

### Frontend Can't Reach Backend
- Confirm BACKEND_URL is set in Vercel
- Check CORS settings if needed
- Verify Railway app is running

## Monitoring

- **Railway Logs**: View real-time application logs
- **Railway Metrics**: Monitor CPU, memory, and network usage
- **Vercel Analytics**: Track frontend performance
- **Neon Dashboard**: Monitor database performance

## Next Steps

After successful deployment:

1. **Set up custom domain** (optional)
2. **Configure monitoring alerts**
3. **Set up automated deployments**
4. **Consider upgrading plans** for production use 