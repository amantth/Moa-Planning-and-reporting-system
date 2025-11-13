# Backend-Frontend Connection Summary

## ✅ Configuration Complete

Your Ministry Agri Pulse application is now properly configured to connect the React frontend with the Django backend via REST API.

## 🔧 Changes Made

### 1. Frontend Configuration

**File:** `ministry-agri-pulse/.env`
```env
VITE_API_BASE_URL=http://localhost:8000/api
```
- Removed Supabase configuration
- Added Django backend API URL

### 2. Backend CORS Configuration

**File:** `agri_project-main/moa_agriplan_system/settings.py`
- Enhanced CORS settings to support frontend on port 8080
- Added IPv6 support for Vite dev server
- Configured proper CORS headers for API requests

### 3. Documentation Created

Created comprehensive guides:
- **API_CONNECTION_GUIDE.md** - Detailed API integration documentation
- **START_SERVERS.md** - Step-by-step server startup guide
- **start-dev.ps1** - PowerShell script for easy server startup

### 4. API Test Page

**File:** `ministry-agri-pulse/src/pages/ApiTest.tsx`
- Created interactive API connection test page
- Tests backend connection, API endpoints, and CORS
- Access at: `http://localhost:8080/api-test`

## 🚀 How to Start

### Quick Start (Recommended)

Run the PowerShell script:
```powershell
cd c:\Users\HP\Desktop\Planning-Performance-System
.\start-dev.ps1
```

This will:
1. Start Django backend on port 8000
2. Start React frontend on port 8080
3. Open browser automatically

### Manual Start

**Terminal 1 - Backend:**
```powershell
cd c:\Users\HP\Desktop\Planning-Performance-System\agri_project-main
python manage.py runserver 8000
```

**Terminal 2 - Frontend:**
```powershell
cd c:\Users\HP\Desktop\Planning-Performance-System\ministry-agri-pulse
npm run dev
```

## 🧪 Testing the Connection

### Option 1: Use the API Test Page

1. Start both servers
2. Open browser to `http://localhost:8080/api-test`
3. Click "Run All Tests"
4. Verify all tests pass

### Option 2: Manual Testing

1. Open `http://localhost:8080`
2. Open Browser DevTools (F12)
3. Go to Network tab
4. Try to login
5. Check for API requests to `http://localhost:8000/api/auth/login/`

## 📋 API Endpoints Available

### Authentication
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Get current user

### Dashboard
- `GET /api/dashboard/stats/` - Dashboard statistics
- `GET /api/dashboard/recent_activities/` - Recent activities
- `GET /api/dashboard/pending_approvals/` - Pending approvals
- `GET /api/dashboard/performance_summary/` - Performance summary

### Resources
- `/api/users/` - User management
- `/api/units/` - Organizational units
- `/api/indicators/` - Performance indicators
- `/api/annual-plans/` - Annual planning
- `/api/quarterly-reports/` - Quarterly reporting
- `/api/audit/` - Audit logs

## 🔐 Authentication Flow

1. **Login:** Frontend sends credentials to `/api/auth/login/`
2. **Token:** Backend returns authentication token
3. **Storage:** Token stored in localStorage as `agri_app_auth_token`
4. **Requests:** Token included in all API requests as `Authorization: Token <token>`

## 📁 Project Structure

```
Planning-Performance-System/
├── agri_project-main/              # Django Backend
│   ├── moa_agriplan_system/        # Project settings
│   │   ├── settings.py             # ✅ CORS configured
│   │   └── urls.py
│   ├── plans/                      # Main app
│   │   ├── views/                  # API views
│   │   ├── serializers.py          # Data serialization
│   │   └── urls.py                 # API routes
│   ├── manage.py
│   └── requirements.txt
│
├── ministry-agri-pulse/            # React Frontend
│   ├── src/
│   │   ├── services/
│   │   │   ├── api-client.ts       # ✅ Axios configuration
│   │   │   ├── auth-client.ts      # ✅ Authentication
│   │   │   └── *-service.ts        # API services
│   │   ├── pages/
│   │   │   └── ApiTest.tsx         # ✅ NEW: Test page
│   │   └── App.tsx                 # ✅ Updated routes
│   ├── .env                        # ✅ API URL configured
│   ├── vite.config.ts              # ✅ Proxy configured
│   └── package.json
│
├── API_CONNECTION_GUIDE.md         # ✅ NEW: Detailed guide
├── START_SERVERS.md                # ✅ NEW: Startup guide
├── start-dev.ps1                   # ✅ NEW: Startup script
└── BACKEND_FRONTEND_CONNECTION_SUMMARY.md  # This file
```

## ⚙️ Configuration Details

### Frontend API Client

**File:** `ministry-agri-pulse/src/services/api-client.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

// Automatically adds token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});
```

### Backend CORS Settings

**File:** `agri_project-main/moa_agriplan_system/settings.py`

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://[::]:8080",  # IPv6 support
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'authorization',
    'content-type',
    # ... other headers
]
```

## 🔍 Troubleshooting

### Backend Not Starting

**Issue:** `django.db.utils.OperationalError`

**Solution:**
```powershell
# Check PostgreSQL is running
Get-Service postgresql*

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### CORS Errors

**Issue:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
1. Verify CORS settings in `settings.py`
2. Check frontend is running on port 8080
3. Restart Django server after changes

### 401 Unauthorized

**Issue:** API returns 401

**Solution:**
1. Check token in localStorage
2. Verify user profile exists: `python manage.py setup_superuser_profile`
3. Try logging in again

### Connection Refused

**Issue:** `ERR_CONNECTION_REFUSED`

**Solution:**
1. Ensure Django is running on port 8000
2. Check PostgreSQL is running
3. Verify `.env` file has correct API URL

## 📊 Database Configuration

**PostgreSQL Database:**
- Database: `agri_db`
- User: `aman`
- Password: `ETHAMANT1`
- Host: `localhost`
- Port: `5432`

**First Time Setup:**
```powershell
cd agri_project-main
python manage.py migrate
python manage.py createsuperuser
python manage.py create_default_units
python manage.py setup_superuser_profile
```

## 🌐 Access Points

After starting both servers:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend App | http://localhost:8080 | Main application |
| API Test Page | http://localhost:8080/api-test | Connection testing |
| Backend API | http://localhost:8000/api/ | REST API root |
| Django Admin | http://localhost:8000/admin/ | Admin interface |

## 📝 Next Steps

1. **Start Servers:** Use `start-dev.ps1` or manual commands
2. **Test Connection:** Visit `http://localhost:8080/api-test`
3. **Login:** Use your superuser credentials
4. **Explore:** Navigate through the application
5. **Monitor:** Check browser console and Django logs

## 🎯 Key Features

- ✅ Token-based authentication
- ✅ Automatic token injection in requests
- ✅ CORS properly configured
- ✅ API proxy for development
- ✅ Comprehensive error handling
- ✅ Interactive API testing page

## 📚 Additional Resources

- **API Documentation:** See `API_CONNECTION_GUIDE.md`
- **Startup Guide:** See `START_SERVERS.md`
- **Django REST Framework:** https://www.django-rest-framework.org/
- **Axios Documentation:** https://axios-http.com/
- **Vite Configuration:** https://vitejs.dev/config/

## 🆘 Support

If you encounter issues:

1. Check the API test page at `/api-test`
2. Review browser console for errors
3. Check Django server logs in terminal
4. Verify database connection
5. Consult the troubleshooting guides

---

**Status:** ✅ Configuration Complete and Ready to Use

**Last Updated:** November 9, 2025
