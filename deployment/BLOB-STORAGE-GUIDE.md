# 📁 Vercel Blob Storage Setup Guide

## 🎯 Quick Setup (5 minutes)

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign in to your account
3. Select your UMSCC Permit Management project

### Step 2: Enable Blob Storage
1. Click on the **"Storage"** tab in your project
2. Click **"Create Database"**
3. Select **"Blob"** from the options
4. Choose your preferred region (closest to Zimbabwe)
5. Click **"Create"**

### Step 3: Get Your Access Token
1. After creation, you'll see your Blob storage dashboard
2. Click **"Settings"** or **"Access Tokens"**
3. Copy the **BLOB_READ_WRITE_TOKEN**
4. It should look like: `vercel_blob_rw_xxxxxxxxxx`

### Step 4: Add Environment Variable
1. Go to **Settings** → **Environment Variables**
2. Click **"Add New"**
3. **Key**: `BLOB_READ_WRITE_TOKEN`
4. **Value**: Your copied token
5. **Environments**: Select all (Production, Preview, Development)
6. Click **"Save"**

### Step 5: Redeploy
1. Go to **Deployments** tab
2. Click **"Redeploy"** on your latest deployment
3. Wait for deployment to complete (2-3 minutes)

## ✅ Verification
After setup, test at: `your-app.vercel.app/api/blob/setup-test`

## 🔧 Troubleshooting
- **Token not working**: Ensure it starts with `vercel_blob_rw_`
- **Upload fails**: Check token permissions
- **Access denied**: Verify token is added to Production environment

## 📊 Storage Limits
- **Free Plan**: 1GB storage, 1GB bandwidth/month
- **Pro Plan**: 100GB storage, 1TB bandwidth/month
- **File Size**: Up to 500MB per file (our system limits to 10MB)
