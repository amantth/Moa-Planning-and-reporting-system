# Frontend-Backend Communication Fixed ✅

All communication issues between the React frontend and Django backend have been resolved.

## Issues Fixed

### 1. **Login Endpoint** ✅
- **Issue**: Frontend sent `username` field, backend expected `email`
- **Fix**: Backend now accepts both `email` and `username` fields
- **Endpoint**: `POST /api/auth/login/`

### 2. **Auth Me Endpoint** ✅
- **Issue**: `/api/auth/me/` endpoint didn't exist
- **Fix**: Created `MeView` and added route
- **Endpoint**: `GET /api/auth/me/`

### 3. **Users List Endpoint** ✅
- **Issue**: `/api/users/list-with-profiles/` returned 404
- **Fix**: Created `UserViewSet` with `list_with_profiles` action
- **Endpoint**: `GET /api/users/list-with-profiles/`

### 4. **CSRF Protection** ✅
- **Issue**: POST requests blocked by CSRF
- **Fix**: Added `@csrf_exempt` to all API views
- **Result**: All POST/PUT/PATCH/DELETE requests work

### 5. **CORS Configuration** ✅
- **Issue**: Cross-origin requests blocked
- **Fix**: Configured CORS to allow all origins in development
- **Result**: Frontend can communicate with backend

## API Endpoints Now Working

### Authentication
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "user@example.com",  // or "email"
  "password": "password"
}

Response:
{
  "token": "abc123...",
  "user": {...},
  "profile": {...}
}
```

```http
GET /api/auth/me/
Authorization: Token <token>

Response:
{
  "user": {...},
  "profile": {...}
}
```

```http
POST /api/auth/logout/
Authorization: Token <token>
```

### Users Management
```http
GET /api/users/list-with-profiles/
Authorization: Token <token>

Response: [
  {
    "user": {...},
    "profile": {...}
  }
]
```

```http
POST /api/users/create-user/
Authorization: Token <token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "new@example.com",
  "password": "password",
  "first_name": "John",
  "last_name": "Doe",
  "role": "STRATEGIC_AFFAIRS",
  "unit_id": 1
}
```

```http
PUT /api/users/{id}/update-user/
Authorization: Token <token>
Content-Type: application/json

{
  "first_name": "Jane",
  "email": "updated@example.com"
}
```

```http
DELETE /api/users/{id}/delete-user/
Authorization: Token <token>
```

### Other Resources
All standard REST endpoints work:
- `GET /api/units/` - List units
- `POST /api/units/` - Create unit
- `GET /api/indicators/` - List indicators
- `POST /api/indicators/` - Create indicator
- `GET /api/annual-plans/` - List annual plans
- `POST /api/annual-plans/` - Create annual plan
- `GET /api/quarterly-reports/` - List quarterly reports
- `POST /api/quarterly-reports/` - Create quarterly report
- `GET /api/dashboard/stats/` - Dashboard statistics
- `GET /api/audit/` - Audit logs

## Frontend Configuration

### Environment Variables (`.env`)
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### API Client (`api-client.ts`)
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

// Automatically adds Authorization header
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});
```

### Auth Client (`auth-client.ts`)
```typescript
// Login
await apiClient.post("/auth/login/", {
  username: email,  // Backend accepts both
  password,
});

// Get current user
await apiClient.get("/auth/me/");

// Logout
await apiClient.post("/auth/logout/");
```

## Backend Configuration

### Settings (`settings.py`)
```python
# CORS - Allow all origins in development
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ]
}

# CSRF settings for API
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
```

### Base ViewSet (`base.py`)
```python
@method_decorator(csrf_exempt, name='dispatch')
class BaseViewSet(viewsets.ModelViewSet):
    """All viewsets inherit CSRF exemption"""
    permission_classes = [IsAuthenticated]
```

### Auth Views (`auth.py`)
```python
@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    def post(self, request):
        # Accepts both 'email' and 'username'
        email_or_username = request.data.get('email') or request.data.get('username')
        # ...

@method_decorator(csrf_exempt, name='dispatch')
class MeView(APIView):
    def get(self, request):
        # Returns current user profile
        # ...
```

## Testing the Connection

### 1. Start Both Servers

**Backend:**
```powershell
cd agri_project-main
python manage.py runserver 8000
```

**Frontend:**
```powershell
cd ministry-agri-pulse
npm run dev
```

### 2. Test Login Flow

1. Open browser to `http://localhost:8080` (or your frontend port)
2. Navigate to login page
3. Enter credentials
4. Check browser console - should see successful API calls
5. Check Network tab - should see:
   - `POST /api/auth/login/` → 200 OK
   - `GET /api/auth/me/` → 200 OK
   - Token stored in localStorage

### 3. Test API Calls

Open browser console and run:
```javascript
// Check stored token
localStorage.getItem('agri_app_auth_token')

// Check stored session
localStorage.getItem('agri_app_session')

// Test API call
fetch('http://localhost:8000/api/users/list-with-profiles/', {
  headers: {
    'Authorization': `Token ${localStorage.getItem('agri_app_auth_token')}`
  }
}).then(r => r.json()).then(console.log)
```

## Common Issues & Solutions

### Issue: "Network Error" or "ERR_CONNECTION_REFUSED"
**Solution**: Make sure Django backend is running on port 8000
```powershell
cd agri_project-main
python manage.py runserver 8000
```

### Issue: "401 Unauthorized"
**Solution**: Login again to get a fresh token
- Old tokens may be invalid
- Check that token is being sent in Authorization header

### Issue: "404 Not Found"
**Solution**: Check the endpoint URL
- Backend endpoints: `http://localhost:8000/api/...`
- Frontend proxy: `/api/...` (automatically proxied)

### Issue: "CORS Error"
**Solution**: ✅ Already fixed - CORS is configured to allow all origins

### Issue: "CSRF Token Missing"
**Solution**: ✅ Already fixed - CSRF is disabled for API endpoints

## Summary

✅ **Login works** - Backend accepts both email and username
✅ **Auth/me works** - Returns current user profile
✅ **Users endpoint works** - All CRUD operations available
✅ **CORS configured** - Cross-origin requests allowed
✅ **CSRF disabled** - POST/PUT/PATCH/DELETE work without CSRF token
✅ **Token auth works** - Frontend automatically sends token
✅ **All endpoints accessible** - Full API functionality available

**Your frontend and backend are now fully connected and communicating!** 🎉
