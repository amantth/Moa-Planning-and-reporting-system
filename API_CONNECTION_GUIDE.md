# API Connection Guide - Frontend & Backend Integration

## Overview
This guide explains how the **Ministry Agri Pulse** (React frontend) connects to the **Agri Project** (Django backend) via REST API.

## Architecture

```
Frontend (React + Vite)          Backend (Django + DRF)
Port: 8080                       Port: 8000
├── ministry-agri-pulse/         ├── agri_project-main/
│   ├── src/services/            │   ├── plans/
│   │   ├── api-client.ts        │   │   ├── views/
│   │   ├── auth-client.ts       │   │   ├── serializers.py
│   │   ├── dashboard-service.ts │   │   └── urls.py
│   │   └── ...                  │   └── moa_agriplan_system/
│   └── .env                     │       └── settings.py
```

## Configuration

### Backend Configuration (Django)

**File:** `agri_project-main/moa_agriplan_system/settings.py`

```python
# Database: PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'agri_db',
        'USER': 'aman',
        'PASSWORD': 'ETHAMANT1',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8080",      # Frontend dev server
    "http://127.0.0.1:8080",
    "http://[::]:8080",           # IPv6 support
]

CORS_ALLOW_CREDENTIALS = True

# REST Framework Authentication
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ]
}
```

**API Base URL:** `http://localhost:8000/api/`

### Frontend Configuration (React)

**File:** `ministry-agri-pulse/.env`

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

**File:** `ministry-agri-pulse/vite.config.ts`

```typescript
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login/` | Login with username/email and password | No |
| POST | `/api/auth/logout/` | Logout and invalidate token | Yes |
| GET | `/api/auth/me/` | Get current user profile | Yes |

### Dashboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats/` | Get dashboard statistics |
| GET | `/api/dashboard/recent_activities/` | Get recent activities |
| GET | `/api/dashboard/pending_approvals/` | Get pending approvals |
| GET | `/api/dashboard/performance_summary/` | Get performance summary |

### Resource Endpoints

| Resource | Base Endpoint |
|----------|---------------|
| Users | `/api/users/` |
| Units | `/api/units/` |
| Indicators | `/api/indicators/` |
| Annual Plans | `/api/annual-plans/` |
| Quarterly Reports | `/api/quarterly-reports/` |
| Audit Logs | `/api/audit/` |

## Authentication Flow

### 1. Login Request

**Frontend:**
```typescript
// src/services/auth-client.ts
const { data } = await apiClient.post<LoginResponse>("/auth/login/", {
  username: email,
  password,
});
```

**Backend Response:**
```json
{
  "token": "abc123...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User"
  },
  "profile": {
    "id": 1,
    "role": "SUPERADMIN",
    "unit": {
      "id": 1,
      "name": "Strategic Affairs",
      "type": "STRATEGIC"
    }
  }
}
```

### 2. Token Storage

The frontend stores the token in localStorage:
```typescript
localStorage.setItem("agri_app_auth_token", token);
```

### 3. Authenticated Requests

All subsequent requests include the token in the Authorization header:
```typescript
config.headers.Authorization = `Token ${token}`;
```

## Starting the Application

### 1. Start Backend (Django)

```powershell
# Navigate to backend directory
cd c:\Users\HP\Desktop\Planning-Performance-System\agri_project-main

# Activate virtual environment (if using one)
# .\venv\Scripts\Activate.ps1

# Run migrations (first time only)
python manage.py migrate

# Create superuser (first time only)
python manage.py createsuperuser

# Setup default units and profiles (first time only)
python manage.py create_default_units
python manage.py setup_superuser_profile

# Start Django development server
python manage.py runserver 8000
```

**Backend will be available at:** `http://localhost:8000`

### 2. Start Frontend (React)

```powershell
# Navigate to frontend directory
cd c:\Users\HP\Desktop\Planning-Performance-System\ministry-agri-pulse

# Install dependencies (first time only)
npm install

# Start Vite development server
npm run dev
```

**Frontend will be available at:** `http://localhost:8080`

## Testing the Connection

### 1. Check Backend Health

Open browser and visit:
- `http://localhost:8000/admin/` - Django admin panel
- `http://localhost:8000/api/` - API root (should show available endpoints)

### 2. Test Login from Frontend

1. Open `http://localhost:8080`
2. Navigate to login page
3. Enter credentials
4. Check browser console for API calls
5. Verify token is stored in localStorage

### 3. Monitor Network Traffic

**In Browser DevTools:**
1. Open Network tab
2. Filter by "XHR" or "Fetch"
3. Look for requests to `http://localhost:8000/api/`
4. Check request headers for `Authorization: Token ...`
5. Verify response status codes (200, 201, etc.)

## Common Issues & Solutions

### Issue 1: CORS Error

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
- Verify `CORS_ALLOWED_ORIGINS` in Django settings includes `http://localhost:8080`
- Check that `corsheaders` middleware is enabled
- Restart Django server after changes

### Issue 2: 401 Unauthorized

**Error:** API returns 401 status

**Solution:**
- Check if token is present in localStorage
- Verify token format: `Token abc123...` (not `Bearer`)
- Check if user profile exists in database
- Verify REST_FRAMEWORK authentication settings

### Issue 3: Connection Refused

**Error:** `ERR_CONNECTION_REFUSED`

**Solution:**
- Ensure Django server is running on port 8000
- Check if PostgreSQL database is running
- Verify database credentials in settings.py

### Issue 4: Database Error

**Error:** `django.db.utils.OperationalError`

**Solution:**
```powershell
# Check PostgreSQL service is running
# Run migrations
python manage.py migrate

# Create database if it doesn't exist
# In PostgreSQL:
# CREATE DATABASE agri_db;
# GRANT ALL PRIVILEGES ON DATABASE agri_db TO aman;
```

### Issue 5: Missing User Profile

**Error:** `User profile not configured`

**Solution:**
```powershell
# Run the setup command
python manage.py setup_superuser_profile
```

## API Client Configuration

### Request Interceptor

Automatically adds authentication token to all requests:

```typescript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});
```

### Response Interceptor

Handles 401 errors by clearing invalid tokens:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);
```

## Development Workflow

1. **Backend First:** Start Django server and verify API endpoints work
2. **Test with Admin:** Use Django admin to create test data
3. **Frontend Integration:** Start React app and test API calls
4. **Monitor Logs:** Watch Django console for API requests
5. **Debug:** Use browser DevTools Network tab to inspect requests/responses

## Production Considerations

When deploying to production:

1. **Update ALLOWED_HOSTS** in Django settings
2. **Configure proper CORS_ALLOWED_ORIGINS** for production domain
3. **Use environment variables** for sensitive data
4. **Enable HTTPS** for secure token transmission
5. **Set DEBUG = False** in Django settings
6. **Use production-grade database** (not SQLite)
7. **Configure static file serving** properly
8. **Set up proper logging** and error monitoring

## Additional Resources

- **Django REST Framework Docs:** https://www.django-rest-framework.org/
- **Axios Documentation:** https://axios-http.com/
- **React Query Docs:** https://tanstack.com/query/latest
- **Vite Proxy Guide:** https://vitejs.dev/config/server-options.html#server-proxy

## Support

For issues or questions:
1. Check Django server logs in terminal
2. Check browser console for frontend errors
3. Verify database connection
4. Review this guide for common solutions
