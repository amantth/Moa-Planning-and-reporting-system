# Quick Start Guide - Start Both Servers

## Prerequisites Checklist

Before starting, ensure:
- [ ] PostgreSQL is installed and running
- [ ] Database `agri_db` exists
- [ ] Python 3.8+ is installed
- [ ] Node.js 16+ is installed
- [ ] Backend dependencies are installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies are installed (`npm install`)

## Step-by-Step Startup

### Option 1: Manual Start (Recommended for First Time)

#### Terminal 1: Start Backend

```powershell
# Navigate to backend directory
cd c:\Users\HP\Desktop\Planning-Performance-System\agri_project-main

# Activate virtual environment (if you have one)
# .\venv\Scripts\Activate.ps1

# Run migrations (first time or after model changes)
python manage.py migrate

# Create superuser (first time only - skip if already created)
# python manage.py createsuperuser

# Setup default organizational units (first time only)
# python manage.py create_default_units

# Setup superuser profile (first time only)
# python manage.py setup_superuser_profile

# Start Django server
python manage.py runserver 8000
```

**Expected Output:**
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

#### Terminal 2: Start Frontend

```powershell
# Navigate to frontend directory
cd c:\Users\HP\Desktop\Planning-Performance-System\ministry-agri-pulse

# Start Vite dev server
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:8080/
➜  Network: http://[::]:8080/
```

### Option 2: Quick Start (After Initial Setup)

Create a PowerShell script `start-dev.ps1`:

```powershell
# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\HP\Desktop\Planning-Performance-System\agri_project-main'; python manage.py runserver 8000"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\HP\Desktop\Planning-Performance-System\ministry-agri-pulse'; npm run dev"

# Open browser
Start-Sleep -Seconds 5
Start-Process "http://localhost:8080"
```

Run with:
```powershell
.\start-dev.ps1
```

## Verify Everything is Working

### 1. Check Backend (Django)

Open browser and visit:
- **API Root:** http://localhost:8000/api/
- **Admin Panel:** http://localhost:8000/admin/
- **Login Endpoint:** http://localhost:8000/api/auth/login/

You should see JSON responses or the Django admin interface.

### 2. Check Frontend (React)

Open browser and visit:
- **Frontend App:** http://localhost:8080/

You should see the Ministry Agri Pulse application.

### 3. Test API Connection

1. Open http://localhost:8080
2. Navigate to login page
3. Open Browser DevTools (F12)
4. Go to Network tab
5. Try to login
6. Look for request to `http://localhost:8000/api/auth/login/`
7. Check if response is 200 OK with token

## Default Login Credentials

After running `createsuperuser`, use the credentials you created.

**Example:**
- Username: `admin`
- Password: `[your-password]`

## Troubleshooting

### Backend Won't Start

**Error:** `django.db.utils.OperationalError: could not connect to server`

**Solution:**
1. Check PostgreSQL is running:
   ```powershell
   # Check PostgreSQL service
   Get-Service -Name postgresql*
   
   # Start if not running
   Start-Service postgresql-x64-14  # adjust version number
   ```

2. Verify database exists:
   ```sql
   -- In PostgreSQL command line (psql)
   \l  -- list databases
   -- If agri_db doesn't exist:
   CREATE DATABASE agri_db;
   GRANT ALL PRIVILEGES ON DATABASE agri_db TO aman;
   ```

**Error:** `ModuleNotFoundError: No module named 'rest_framework'`

**Solution:**
```powershell
pip install -r requirements.txt
```

### Frontend Won't Start

**Error:** `Cannot find module`

**Solution:**
```powershell
npm install
```

**Error:** `Port 8080 is already in use`

**Solution:**
```powershell
# Find and kill process using port 8080
netstat -ano | findstr :8080
taskkill /PID [PID_NUMBER] /F

# Or change port in vite.config.ts
```

### API Connection Issues

**Error:** `Network Error` or `CORS Error`

**Solution:**
1. Verify both servers are running
2. Check backend CORS settings in `settings.py`
3. Verify `.env` file has correct `VITE_API_BASE_URL`
4. Clear browser cache and localStorage
5. Restart both servers

### Authentication Issues

**Error:** `User profile not configured`

**Solution:**
```powershell
cd agri_project-main
python manage.py setup_superuser_profile
```

**Error:** `Invalid credentials`

**Solution:**
1. Verify username/email and password
2. Check user exists in Django admin
3. Reset password if needed:
   ```powershell
   python manage.py changepassword [username]
   ```

## Stopping the Servers

### Graceful Shutdown

In each terminal window:
- Press `Ctrl + C` to stop the server
- Wait for graceful shutdown

### Force Stop

If servers are unresponsive:

**Backend:**
```powershell
# Find Python process
Get-Process python | Stop-Process -Force
```

**Frontend:**
```powershell
# Find Node process
Get-Process node | Stop-Process -Force
```

## Development Tips

### 1. Hot Reload

- **Frontend:** Vite automatically reloads on file changes
- **Backend:** Django auto-reloads on Python file changes

### 2. Database Migrations

After changing models:
```powershell
cd agri_project-main
python manage.py makemigrations
python manage.py migrate
```

### 3. Clear Cache

If you encounter strange issues:
```powershell
# Frontend
cd ministry-agri-pulse
rm -r node_modules/.vite

# Browser
# Clear localStorage and cookies for localhost
```

### 4. View Logs

- **Backend:** Check terminal running Django server
- **Frontend:** Check browser console (F12)
- **Network:** Check browser DevTools Network tab

## Next Steps

After successful startup:

1. **Login** to the application
2. **Create test data** via Django admin or API
3. **Test features** in the frontend
4. **Monitor API calls** in browser DevTools
5. **Check logs** for any errors

## Production Deployment

For production deployment, see:
- `API_CONNECTION_GUIDE.md` - Production considerations
- Django deployment docs
- Vite build configuration

## Need Help?

1. Check `API_CONNECTION_GUIDE.md` for detailed information
2. Review Django server logs
3. Check browser console for errors
4. Verify database connection
5. Ensure all dependencies are installed
