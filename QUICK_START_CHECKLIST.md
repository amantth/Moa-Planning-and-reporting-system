# 🚀 Quick Start Checklist

Use this checklist to get your application running quickly.

## ☑️ Prerequisites

Before starting, verify these are installed and running:

- [ ] **PostgreSQL** installed and running
  ```powershell
  Get-Service postgresql*
  ```

- [ ] **Python 3.8+** installed
  ```powershell
  python --version
  ```

- [ ] **Node.js 16+** installed
  ```powershell
  node --version
  npm --version
  ```

- [ ] **Database created**
  ```sql
  -- In PostgreSQL (psql):
  CREATE DATABASE agri_db;
  GRANT ALL PRIVILEGES ON DATABASE agri_db TO aman;
  ```

## ☑️ First Time Setup

### Backend Setup

- [ ] Navigate to backend directory
  ```powershell
  cd c:\Users\HP\Desktop\Planning-Performance-System\agri_project-main
  ```

- [ ] Install Python dependencies
  ```powershell
  pip install -r requirements.txt
  ```

- [ ] Run database migrations
  ```powershell
  python manage.py migrate
  ```

- [ ] Create superuser account
  ```powershell
  python manage.py createsuperuser
  # Follow prompts to create admin user
  ```

- [ ] Create default organizational units
  ```powershell
  python manage.py create_default_units
  ```

- [ ] Setup superuser profile
  ```powershell
  python manage.py setup_superuser_profile
  ```

### Frontend Setup

- [ ] Navigate to frontend directory
  ```powershell
  cd c:\Users\HP\Desktop\Planning-Performance-System\ministry-agri-pulse
  ```

- [ ] Install Node dependencies
  ```powershell
  npm install
  ```

- [ ] Verify .env file exists with correct configuration
  ```powershell
  cat .env
  # Should show: VITE_API_BASE_URL=http://localhost:8000/api
  ```

## ☑️ Starting the Application

### Option 1: Automated Start (Easiest)

- [ ] Run the startup script
  ```powershell
  cd c:\Users\HP\Desktop\Planning-Performance-System
  .\start-dev.ps1
  ```

- [ ] Wait for both servers to start (browser will open automatically)

### Option 2: Manual Start

- [ ] **Terminal 1:** Start Django backend
  ```powershell
  cd c:\Users\HP\Desktop\Planning-Performance-System\agri_project-main
  python manage.py runserver 8000
  ```
  Wait for: `Starting development server at http://127.0.0.1:8000/`

- [ ] **Terminal 2:** Start React frontend
  ```powershell
  cd c:\Users\HP\Desktop\Planning-Performance-System\ministry-agri-pulse
  npm run dev
  ```
  Wait for: `Local: http://localhost:8080/`

## ☑️ Verify Connection

- [ ] Open browser to http://localhost:8080/api-test

- [ ] Click "Run All Tests" button

- [ ] Verify all 4 tests pass:
  - ✅ Backend Connection
  - ✅ API Root
  - ✅ Authentication Endpoint
  - ✅ CORS Configuration

## ☑️ Test Login

- [ ] Navigate to http://localhost:8080

- [ ] Click "Login" or go to http://localhost:8080/auth

- [ ] Enter your superuser credentials

- [ ] Verify successful login and redirect to dashboard

- [ ] Open Browser DevTools (F12) → Network tab

- [ ] Verify API calls to http://localhost:8000/api/

## ☑️ Verify Features

- [ ] **Dashboard:** Check statistics and recent activities

- [ ] **Units:** View organizational units

- [ ] **Indicators:** View performance indicators

- [ ] **Users:** View user list

- [ ] **Plans:** Access annual planning

- [ ] **Reports:** Access quarterly reports

## 🔧 Troubleshooting Checklist

If something doesn't work:

### Backend Issues

- [ ] PostgreSQL service is running
  ```powershell
  Get-Service postgresql* | Start-Service
  ```

- [ ] Database exists and is accessible
  ```powershell
  # In psql:
  \l  # list databases
  \c agri_db  # connect to database
  ```

- [ ] Migrations are up to date
  ```powershell
  python manage.py migrate
  ```

- [ ] Django server is running on port 8000
  ```powershell
  netstat -ano | findstr :8000
  ```

### Frontend Issues

- [ ] Node modules are installed
  ```powershell
  npm install
  ```

- [ ] .env file has correct API URL
  ```powershell
  cat .env
  ```

- [ ] Frontend server is running on port 8080
  ```powershell
  netstat -ano | findstr :8080
  ```

- [ ] Browser cache is cleared
  - Press Ctrl+Shift+Delete
  - Clear cache and cookies for localhost

### Connection Issues

- [ ] Both servers are running simultaneously

- [ ] CORS settings in Django settings.py include port 8080

- [ ] No firewall blocking localhost connections

- [ ] Check browser console for error messages (F12)

- [ ] Check Django terminal for API request logs

## 📋 Quick Reference

### Important URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| API Test | http://localhost:8080/api-test |
| Backend API | http://localhost:8000/api/ |
| Django Admin | http://localhost:8000/admin/ |

### Important Files

| File | Purpose |
|------|---------|
| `ministry-agri-pulse/.env` | Frontend API configuration |
| `agri_project-main/moa_agriplan_system/settings.py` | Backend settings & CORS |
| `start-dev.ps1` | Automated startup script |
| `API_CONNECTION_GUIDE.md` | Detailed documentation |

### Important Commands

| Task | Command |
|------|---------|
| Start Backend | `python manage.py runserver 8000` |
| Start Frontend | `npm run dev` |
| Run Migrations | `python manage.py migrate` |
| Create Superuser | `python manage.py createsuperuser` |
| Setup Profiles | `python manage.py setup_superuser_profile` |

### Storage Keys

| Key | Location | Purpose |
|-----|----------|---------|
| `agri_app_auth_token` | localStorage | Authentication token |
| `agri_app_session` | localStorage | User session data |

## 🎯 Success Criteria

You're ready to develop when:

- ✅ Both servers start without errors
- ✅ API test page shows all tests passing
- ✅ You can login successfully
- ✅ Dashboard loads with data
- ✅ No CORS errors in browser console
- ✅ API requests show in Network tab with 200 status

## 📚 Next Steps

After successful setup:

1. **Explore the application** - Navigate through all pages
2. **Create test data** - Add units, indicators, plans
3. **Test workflows** - Create and submit plans
4. **Review documentation** - Read `API_CONNECTION_GUIDE.md`
5. **Customize** - Modify as needed for your requirements

## 🆘 Need Help?

If you're stuck:

1. ✅ Check this checklist again
2. 📖 Read `API_CONNECTION_GUIDE.md`
3. 🔍 Check `START_SERVERS.md`
4. 🧪 Use the API test page at `/api-test`
5. 🐛 Check browser console and Django logs

---

**Ready to start?** Run `.\start-dev.ps1` and begin! 🚀
