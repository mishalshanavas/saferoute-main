# Vercel Deployment Guide for SafeRoute

This guide will help you deploy both the backend and frontend of SafeRoute to Vercel as separate projects.

## Prerequisites

1. [Vercel account](https://vercel.com)
2. GitHub repository with your code
3. Vercel CLI (optional): `npm i -g vercel`

## Backend Deployment

### Step 1: Deploy Backend to Vercel

1. **Via Vercel Dashboard:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - **Important:** Set the **Root Directory** to `backend`
   - Framework Preset: "Other"
   - Click "Deploy"

2. **Via Vercel CLI:**
   ```bash
   cd backend
   vercel --prod
   ```

### Step 2: Configure Backend Environment Variables

In your Vercel project dashboard for the backend:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:
   ```
   MONGODB_URI=mongodb+srv://admin:admin@saferoute.mcdpkug.mongodb.net/?retryWrites=true&w=majority&appName=saferoute
   DATABASE_NAME=saferoute
   PORT=5000
   NODE_ENV=production
   ```

### Step 3: Note Your Backend URL

After deployment, note your backend URL (e.g., `https://your-backend-project.vercel.app`)

## Frontend Deployment

### Step 1: Deploy Frontend to Vercel

1. **Via Vercel Dashboard:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository (same repo, different project)
   - **Important:** Set the **Root Directory** to `frontend`
   - Framework Preset: "Create React App"
   - Click "Deploy"

2. **Via Vercel CLI:**
   ```bash
   cd frontend
   vercel --prod
   ```

### Step 2: Configure Frontend Environment Variables

In your Vercel project dashboard for the frontend:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:
   ```
   REACT_APP_API_URL=https://your-backend-project.vercel.app/api
   REACT_APP_APP_NAME=SafeRoute
   GENERATE_SOURCEMAP=false
   ```

   **Important:** Replace `your-backend-project.vercel.app` with your actual backend URL from Step 3 above.

### Step 3: Redeploy Frontend

After adding the environment variables, redeploy the frontend to apply the changes:

1. Go to **Deployments** tab in your frontend Vercel project
2. Click the three dots on the latest deployment and select "Redeploy"

## File Structure Created

The following files have been created for Vercel deployment:

### Backend Files:
- `backend/vercel.json` - Vercel configuration for Node.js backend
- `backend/.vercelignore` - Files to ignore during deployment
- `backend/.env.example` - Environment variables template

### Frontend Files:
- `frontend/vercel.json` - Vercel configuration for React app
- `frontend/.vercelignore` - Files to ignore during deployment  
- `frontend/.env.example` - Environment variables template

## Important Notes

1. **Root Directory:** When creating projects in Vercel, make sure to set the correct root directory (`backend` or `frontend`)

2. **Environment Variables:** The backend URL must be updated in the frontend environment variables after backend deployment

3. **CORS:** Make sure your backend CORS configuration allows requests from your frontend domain

4. **MongoDB:** Ensure your MongoDB Atlas cluster allows connections from Vercel's IP ranges

5. **Build Settings:** Vercel automatically detects build settings, but you can override them in the dashboard if needed

## Troubleshooting

### Common Issues:

1. **Build Fails:** Check the build logs in Vercel dashboard for detailed error messages

2. **API Calls Fail:** Verify the `REACT_APP_API_URL` environment variable is correctly set with your backend URL

3. **CORS Errors:** Update your backend CORS configuration to allow requests from your frontend domain

4. **Database Connection:** Ensure MongoDB URI is correct and network access is configured in MongoDB Atlas

## Custom Domain (Optional)

After successful deployment, you can add custom domains:

1. Go to **Settings** → **Domains** in your Vercel project
2. Add your custom domain
3. Configure DNS records as instructed by Vercel

## Monitoring

Monitor your deployments:
- Use Vercel Dashboard for deployment logs and analytics
- Check **Functions** tab for serverless function performance (backend)
- Monitor **Analytics** for frontend performance metrics