# UMSCC Permit Management System - Deployment Guide

## 🚀 Production Deployment Steps

### Phase 1: Prerequisites ✅ COMPLETED
- [x] Database schema created
- [x] Default users seeded
- [x] Code fixes applied (JWT, Email)

### Phase 2: Environment Setup

#### 2.1 Supabase Configuration
1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project: "UMSCC Permit Management"
   - Note down the project URL and API keys

2. **Database Setup** ✅ COMPLETED
   - Tables created successfully
   - Default users seeded
   - Indexes and triggers configured

#### 2.2 Vercel Blob Storage
1. **Setup File Storage**
   - Go to Vercel Dashboard
   - Navigate to Storage tab
   - Create new Blob store: "umscc-documents"
   - Copy the read/write token

#### 2.3 Email Configuration
1. **SMTP Setup Options**
   
   **Option A: Gmail (Recommended for testing)**
   \`\`\`
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASSWORD=your-app-password
   \`\`\`
   
   **Option B: Professional Email Service**
   \`\`\`
   SMTP_HOST=mail.umscc.co.zw
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=noreply@umscc.co.zw
   SMTP_PASSWORD=your-password
   \`\`\`

### Phase 3: Vercel Deployment

#### 3.1 Environment Variables
Set these in Vercel Dashboard → Settings → Environment Variables:

\`\`\`bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@umscc.co.zw

# File Storage
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
LOG_LEVEL=info
ENABLE_MONITORING=true

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
\`\`\`

#### 3.2 Deploy to Vercel
1. **Connect Repository**
   - Link your GitHub repository to Vercel
   - Configure build settings (auto-detected)

2. **Deploy**
   - Push code to main branch
   - Vercel will automatically deploy
   - Monitor build logs for any issues

### Phase 4: Post-Deployment Testing

#### 4.1 Health Check
Visit: `https://your-app.vercel.app/api/health`

Expected response:
\`\`\`json
{
  "status": "healthy",
  "services": [
    {"service": "Database", "status": "healthy"},
    {"service": "Email", "status": "healthy"},
    {"service": "File Storage", "status": "healthy"}
  ]
}
\`\`\`

#### 4.2 User Login Testing
Test each user type:
- **Permitting Officer**: `admin` / `admin123`
- **Chairperson**: `chairperson` / `admin123`
- **Catchment Manager**: `manager` / `admin123`
- **Catchment Chairperson**: `catchment_chair` / `admin123`
- **Permit Supervisor**: `supervisor` / `admin123`
- **ICT**: `umsccict2025` / `umsccict2025`

### Phase 5: Production Readiness

#### 5.1 Security Checklist
- [x] HTTPS enabled (automatic with Vercel)
- [x] Security headers configured
- [x] Rate limiting implemented
- [x] Input validation active
- [x] SQL injection protection
- [x] XSS protection

#### 5.2 Performance Optimization
- [x] Database indexes created
- [x] File compression enabled
- [x] CDN configured (Vercel Edge Network)
- [x] Caching strategies implemented

#### 5.3 Monitoring Setup
- [x] Error tracking configured
- [x] Performance monitoring active
- [x] Health checks available
- [x] Activity logging enabled

## 🎯 Go-Live Checklist

### Before Go-Live
- [ ] All environment variables configured
- [ ] Health check returns "healthy"
- [ ] All user types can login
- [ ] File upload/download working
- [ ] Email notifications sending
- [ ] PDF generation working
- [ ] Print functionality tested

### Go-Live Actions
1. **Announce System Availability**
   - Send email to all stakeholders
   - Provide login credentials
   - Share user manual/training materials

2. **Monitor Initial Usage**
   - Watch error logs closely
   - Monitor performance metrics
   - Be ready for quick fixes

3. **User Support**
   - Have technical support available
   - Monitor user feedback
   - Document any issues

## 📞 Support Information

**Technical Support:**
- Email: ict@umscc.co.zw
- System Health: https://your-app.vercel.app/api/health
- Admin Panel: ICT user has full system access

**Default Login Credentials:**
- See Phase 4.2 above for all user credentials
- **IMPORTANT**: Change default passwords after first login

## 🔄 Maintenance

### Regular Tasks
- Monitor system health daily
- Review activity logs weekly
- Update user passwords quarterly
- Backup database monthly
- Review and update security settings

### Updates
- Code updates deployed automatically via GitHub
- Database migrations require manual execution
- Environment variable changes require Vercel dashboard access
