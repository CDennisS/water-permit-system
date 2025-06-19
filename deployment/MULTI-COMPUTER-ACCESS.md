# 🖥️ UMSCC Permit Management System - Multi-Computer Access Guide

## 🌐 **OPTION 1: ACCESS DEPLOYED SYSTEM (RECOMMENDED)**

### **For End Users (Easiest)**
If the system is already deployed to Vercel:

1. **Open any web browser** (Chrome, Firefox, Safari, Edge)
2. **Navigate to your production URL**: `https://your-app.vercel.app`
3. **Login with your credentials**:
   - Admin: `admin` / `admin123`
   - ICT: `umsccict2025` / `umsccict2025`
   - Other users: As provided by admin

**✅ Benefits:**
- No installation required
- Works on any device with internet
- Always up-to-date
- Secure and backed up
- Mobile-friendly

---

## 💻 **OPTION 2: RUN DEVELOPMENT VERSION LOCALLY**

### **For Developers/ICT Staff**

#### **Prerequisites:**
- Node.js 18+ installed
- Git installed
- Code editor (VS Code recommended)

#### **Step 1: Clone Repository**
\`\`\`bash
# Clone the repository
git clone https://github.com/your-username/umscc-permit-system.git
cd umscc-permit-system

# Or download ZIP and extract
\`\`\`

#### **Step 2: Install Dependencies**
\`\`\`bash
npm install
# or
yarn install
\`\`\`

#### **Step 3: Setup Environment Variables**
Create `.env.local` file:
\`\`\`bash
# Copy from production or use development values
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
BLOB_READ_WRITE_TOKEN=your_blob_token
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=debug
ENABLE_MONITORING=true
\`\`\`

#### **Step 4: Run Development Server**
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

#### **Step 5: Access System**
- Open browser: `http://localhost:3000`
- Login with default credentials

---

## 🏢 **OPTION 3: INTERNAL NETWORK DEPLOYMENT**

### **For Office/LAN Access**

#### **Setup Internal Server:**
1. **Designate a server computer** in the office
2. **Install Node.js and dependencies**
3. **Clone and configure the system**
4. **Run on internal network**:
   \`\`\`bash
   npm run build
   npm start -- --hostname 0.0.0.0 --port 3000
   \`\`\`

#### **Access from Other Computers:**
- Find server IP address: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Access from other computers: `http://192.168.1.XXX:3000`
- All office computers can access via internal IP

---

## 📱 **OPTION 4: MOBILE/TABLET ACCESS**

### **Mobile Browser Access:**
- Open mobile browser (Chrome, Safari)
- Navigate to production URL
- System is fully responsive
- Touch-friendly interface
- All features available

---

## 🔧 **OPTION 5: DOCKER DEPLOYMENT**

### **For Advanced Users:**

#### **Create Dockerfile:**
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

#### **Run with Docker:**
\`\`\`bash
docker build -t umscc-permit-system .
docker run -p 3000:3000 --env-file .env umscc-permit-system
\`\`\`

---

## 🌍 **RECOMMENDED APPROACH BY USER TYPE**

### **👥 Regular Staff (Permit Officers, Chairpersons):**
**✅ Use Production URL** - `https://your-app.vercel.app`
- No setup required
- Always available
- Automatic updates
- Secure and reliable

### **🔧 ICT Staff:**
**✅ Production URL + Local Development**
- Primary: Use production system
- Development: Local setup for testing/modifications

### **🏢 Office Manager:**
**✅ Production URL**
- Bookmark the URL
- Train staff on web access
- No IT maintenance required

### **📱 Field Staff:**
**✅ Mobile Browser Access**
- Use production URL on mobile
- Works offline with cached data
- Responsive design

---

## 🔐 **SECURITY CONSIDERATIONS**

### **Production Access:**
- ✅ HTTPS encryption
- ✅ Secure authentication
- ✅ Regular backups
- ✅ Monitoring and logging

### **Local Development:**
- ⚠️ HTTP only (not secure for production data)
- ⚠️ Use test data only
- ⚠️ Don't expose to internet

### **Internal Network:**
- ⚠️ Secure office network required
- ⚠️ Firewall configuration needed
- ⚠️ Regular security updates required

---

## 📞 **SUPPORT FOR MULTI-COMPUTER ACCESS**

### **Common Issues:**

#### **"Can't access the system"**
1. Check internet connection
2. Verify URL is correct
3. Try different browser
4. Clear browser cache

#### **"Login not working"**
1. Verify username/password
2. Check caps lock
3. Contact ICT for password reset

#### **"System is slow"**
1. Check internet speed
2. Close other browser tabs
3. Try different browser
4. Contact ICT if persistent

### **Contact Information:**
- **Technical Support**: ict@umscc.co.zw
- **User Support**: Contact your supervisor
- **Emergency**: ICT Helpdesk

---

## 📋 **QUICK REFERENCE**

### **Production Access (Recommended):**
- **URL**: `https://your-app.vercel.app`
- **Admin**: `admin` / `admin123`
- **ICT**: `umsccict2025` / `umsccict2025`

### **Local Development:**
- **URL**: `http://localhost:3000`
- **Setup**: Clone repo → Install deps → Run `npm run dev`

### **Mobile Access:**
- **Same URL** as production
- **Responsive design** works on all devices
- **Touch-friendly** interface
