# Deployment Guide for Vercel

This guide will help you deploy the Water Permit Management System to Vercel.

## Prerequisites

1. A Vercel account
2. A PostgreSQL database (recommended: Neon or similar)
3. A cloud storage service for file uploads (recommended: AWS S3 or similar)

## Step 1: Database Setup

1. Create a PostgreSQL database using your preferred provider
2. Get the database connection string
3. Note down the connection string for later use

## Step 2: File Storage Setup

1. Create an S3 bucket or similar cloud storage
2. Configure CORS settings
3. Note down the access credentials

## Step 3: Vercel Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Set up environment variables in Vercel:
```bash
vercel env add SECRET_KEY
vercel env add DATABASE_URL
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY
vercel env add AWS_BUCKET_NAME
vercel env add AWS_REGION
```

4. Deploy the application:
```bash
vercel
```

## Step 4: Post-Deployment

1. Initialize the database:
```bash
vercel run python seed.py
```

2. Verify the deployment:
   - Check if the application is accessible
   - Test user login
   - Test file uploads
   - Test database operations

## Environment Variables

Required environment variables:

- `SECRET_KEY`: A secure random string for session encryption
- `DATABASE_URL`: PostgreSQL connection string
- `AWS_ACCESS_KEY_ID`: AWS access key for S3
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for S3
- `AWS_BUCKET_NAME`: S3 bucket name
- `AWS_REGION`: AWS region for S3

## Troubleshooting

1. Database Connection Issues:
   - Verify the DATABASE_URL format
   - Check if the database is accessible
   - Ensure proper network access

2. File Upload Issues:
   - Verify S3 credentials
   - Check CORS configuration
   - Ensure proper bucket permissions

3. Application Errors:
   - Check Vercel logs
   - Verify environment variables
   - Test locally with production settings

## Monitoring

1. Set up monitoring in Vercel:
   - Enable error tracking
   - Set up performance monitoring
   - Configure alerts

2. Regular maintenance:
   - Monitor database size
   - Check storage usage
   - Review error logs

## Security Considerations

1. Keep environment variables secure
2. Regularly rotate credentials
3. Monitor for suspicious activities
4. Keep dependencies updated
5. Enable HTTPS (automatic with Vercel)

## Backup Strategy

1. Database backups:
   - Set up automated backups
   - Store backups securely
   - Test restore procedures

2. File backups:
   - Enable versioning in S3
   - Set up cross-region replication
   - Regular backup testing

## Support

For deployment issues:
1. Check Vercel documentation
2. Review application logs
3. Contact system administrator
4. Create an issue in the repository 