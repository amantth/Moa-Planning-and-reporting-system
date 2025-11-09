# Planning Performance System - Setup Instructions

## Backend (Django)

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)

### Setup Steps

1. **Navigate to backend directory:**

   ```bash
   cd agri_project-main
   ```

2. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Run migrations:**

   ```bash
   python manage.py migrate
   ```

4. **Create default organizational units:**

   ```bash
   python manage.py create_default_units
   ```

5. **Create a superuser:**

   ```bash
   python manage.py createsuperuser
   ```

6. **Set up the superuser profile (REQUIRED for login):**

   ```bash
   python manage.py setup_superuser_profile <username>
   ```

   For example, if your username is `admin`:

   ```bash
   python manage.py setup_superuser_profile admin
   ```

   This will create a UserProfile with SUPERADMIN role and assign it to the default "Strategic Affairs Office" unit.

   **IMPORTANT:** Without a UserProfile, you cannot login to the system. You'll get the error "User profile not configured. Contact an administrator."

7. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

The backend will be available at `http://127.0.0.1:8000`

### Backend Configuration

- **Database**: SQLite (default) - can be switched to PostgreSQL in `settings.py`
- **API Base URL**: `http://127.0.0.1:8000/api/`
- **CORS**: Configured to allow requests from frontend on port 8080

## Frontend (React + Vite)

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Setup Steps

1. **Navigate to frontend directory:**

   ```bash
   cd ministry-agri-pulse
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:8080`

### Frontend Configuration

- **Port**: 8080 (configured in `vite.config.ts`)
- **API Proxy**: Configured to proxy `/api` requests to `http://127.0.0.1:8000`

## Running Both Servers

### Option 1: Separate Terminal Windows

1. **Terminal 1 - Backend:**

   ```bash
   cd agri_project-main
   python manage.py runserver
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd ministry-agri-pulse
   npm run dev
   ```

### Option 2: Using Background Processes

Both servers can run in the background. The backend is configured to run on port 8000 and the frontend on port 8080.

## Fixed Issues

1. ✅ Added CORS support (`django-cors-headers`) for frontend-backend communication
2. ✅ Created `requirements.txt` with all necessary dependencies
3. ✅ Switched database from PostgreSQL to SQLite for easier setup
4. ✅ Added MEDIA_ROOT and MEDIA_URL for file uploads
5. ✅ Fixed duplicate URL namespace warning
6. ✅ Updated ALLOWED_HOSTS for development
7. ✅ Added CSRF trusted origins for frontend

## API Endpoints

- Authentication: `/api/auth/login/`, `/api/auth/logout/`, `/api/auth/me/`
- Dashboard: `/api/dashboard/`
- Units: `/api/units/`
- Indicators: `/api/indicators/`
- Annual Plans: `/api/annual-plans/`
- Quarterly Reports: `/api/quarterly-reports/`
- Audit: `/api/audit/`
- Import/Export: `/api/import-export/`

## Troubleshooting

### Backend Issues

- **Database errors**: Make sure migrations are applied (`python manage.py migrate`)
- **Import errors**: Verify all packages are installed (`pip install -r requirements.txt`)
- **Port already in use**: Change the port with `python manage.py runserver 8001`

### Frontend Issues

- **Build errors**: Clear node_modules and reinstall (`rm -rf node_modules && npm install`)
- **API connection errors**: Verify backend is running on port 8000
- **Port conflicts**: Change port in `vite.config.ts`

## Notes

- The backend uses SQLite by default. To use PostgreSQL, uncomment the PostgreSQL configuration in `settings.py` and comment out the SQLite configuration.
- Both servers must be running for the application to work properly.
- The frontend proxies API requests to the backend automatically.
