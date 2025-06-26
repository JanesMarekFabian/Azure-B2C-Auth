# 🤖 AGENT MODE - DATABASE INTEGRATION TEST PLAN

## 🎯 WHAT WE'VE BUILT

### ✅ **Repository Layer** (`backend/src/repositories/userRepository.ts`)
- **Database Access Layer** - All SQL operations
- **User Management**: Create, Read, Update, Delete users
- **Azure B2C Integration**: Handle Azure user profiles
- **Session Support**: User lookup by ID for sessions
- **Security**: Parameterized queries, error handling

### ✅ **Service Layer** (`backend/src/services/userService.ts`)
- **Business Logic Layer** - Coordinates repository and controllers
- **User Registration/Authentication**: Handle new and existing users
- **Profile Management**: Update user information
- **Permission System**: Role-based access control
- **Data Sanitization**: Clean and validate user input

### ✅ **Updated Auth Routes** (`backend/src/routes/auth.ts`)
- **Real Database Integration**: No more mock users!
- **Azure B2C Callback**: Creates/updates users in PostgreSQL
- **Session Management**: Store real user data from database
- **Audit Trail**: Track user logins and registrations

### ✅ **Enhanced User Routes** (`backend/src/routes/user.ts`)
- **Profile Management**: GET/PUT user profiles
- **Admin Functions**: View all users (admin only)
- **Database-Backed**: All data from PostgreSQL
- **Error Handling**: Comprehensive error responses

### ✅ **Frontend Updates**
- **API Service**: New endpoints for profile updates
- **Type Definitions**: Match database schema
- **User Management**: Ready for profile editing

---

## 🧪 TESTING CHECKLIST

### **Phase 1: Database Connection Test**
- [x] ✅ PostgreSQL connection successful
- [x] ✅ Redis connection successful  
- [x] ✅ Database schema loaded
- [x] ✅ Backend starts without errors

### **Phase 2: Authentication Flow Test**
1. **Login Process**
   - [ ] Navigate to `http://localhost:3000/login`
   - [ ] Click "Login with Azure B2C"
   - [ ] Complete Azure authentication
   - [ ] Check backend logs for user creation/authentication
   - [ ] Verify redirect to dashboard

2. **Database Verification**
   - [ ] Check pgAdmin: New user appears in `users` table
   - [ ] Verify Azure claims stored in `azure_claims` JSONB field
   - [ ] Check `last_login` timestamp
   - [ ] Validate session data in Redis

3. **Session Management**
   - [ ] Dashboard loads user data from database
   - [ ] Profile page shows real user information
   - [ ] Session persists across browser refresh

### **Phase 3: API Endpoint Testing**

#### **User Profile Endpoints**
```bash
# Get user profile (requires authentication)
curl -X GET http://localhost:3001/api/user/profile \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Update user profile
curl -X PUT http://localhost:3001/api/user/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"firstName": "Updated", "lastName": "Name"}'
```

#### **Admin Endpoints** (Admin users only)
```bash
# Get all users
curl -X GET http://localhost:3001/api/user/all \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Premium content
curl -X GET http://localhost:3001/api/user/premium \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### **Phase 4: Database Operations Test**

#### **pgAdmin Queries to Run**
```sql
-- View all users
SELECT id, email, first_name, last_name, role, created_at, last_login 
FROM users ORDER BY created_at DESC;

-- View user sessions
SELECT session_id, user_id, created_at, expires_at 
FROM user_sessions ORDER BY created_at DESC;

-- View Azure claims for a user
SELECT email, azure_claims 
FROM users WHERE id = 1;

-- Check audit log
SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 10;
```

### **Phase 5: Error Handling Test**
- [ ] Test with invalid session
- [ ] Test profile update with invalid data
- [ ] Test admin endpoints as regular user
- [ ] Test database connection failure scenarios

---

## 🔍 MONITORING & DEBUGGING

### **Backend Logs to Watch**
```
✅ Database connected successfully
✅ Redis connected successfully  
🔍 Processing Azure user profile: { oid: "...", email: "..." }
🎉 New user registered and authenticated: user@example.com
✅ Existing user authenticated: user@example.com
💾 Session created for user: user@example.com
```

### **Database Monitoring**
- **pgAdmin**: Monitor user table growth
- **Redis Commander**: Check session storage
- **Portainer**: Monitor container health

### **Frontend Console**
- Check for API response errors
- Monitor authentication state
- Verify user data loading

---

## 🚀 NEXT STEPS AFTER TESTING

### **Immediate Enhancements**
1. **Profile Management UI**: Create user profile editing form
2. **Admin Panel**: User management interface
3. **Error Boundaries**: Better error handling in React
4. **Loading States**: Improve UX during API calls

### **Security Enhancements**
1. **JWT Signature Validation**: Implement proper Azure B2C token validation
2. **Rate Limiting**: Add API rate limiting
3. **Input Validation**: Strengthen server-side validation
4. **HTTPS Setup**: Configure SSL certificates

### **Production Readiness**
1. **Environment Variables**: Secure configuration management
2. **Logging**: Structured logging with Winston
3. **Monitoring**: Health checks and metrics
4. **Backup Strategy**: Database backup automation

---

## 🎉 SUCCESS CRITERIA

**✅ COMPLETE SUCCESS IF:**
- New users are created in PostgreSQL on first login
- Existing users are updated with latest Azure claims
- Sessions work across browser refresh
- Profile updates persist to database
- Admin functions work correctly
- All API endpoints respond appropriately

**🔥 BONUS POINTS IF:**
- Multiple users can login simultaneously
- Session cleanup works properly
- Error handling is graceful
- Performance is responsive

---

## 🛠️ TROUBLESHOOTING GUIDE

### **Common Issues**
1. **Port 3001 in use**: Kill node processes or change port
2. **Database connection failed**: Check Linux server IP and firewall
3. **Redis connection failed**: Verify Redis container is running
4. **Session not persisting**: Check cookie settings and CORS
5. **Azure B2C errors**: Verify client secret and redirect URI

### **Quick Fixes**
```bash
# Restart containers
docker-compose -f datenbank/docker-compose.yml restart

# Check container status
docker ps

# View backend logs
npm run dev

# Clear Redis sessions
docker exec -it redis-container redis-cli FLUSHALL
```

---

**🤖 AGENT MODE COMPLETE - DATABASE INTEGRATION READY FOR TESTING! 🚀** 