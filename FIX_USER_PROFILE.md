# Fix: "User profile not configured" Error

## Problem
You're getting the error "User profile not configured. Contact an administrator." when trying to login, even after creating a superuser.

## Solution
The system requires a `UserProfile` for each user, but creating a superuser doesn't automatically create one. Here's how to fix it:

### Quick Fix (Command Line)

1. **First, create default units (if not already done):**
   ```bash
   cd agri_project-main
   python manage.py create_default_units
   ```

2. **Set up profile for your superuser:**
   ```bash
   python manage.py setup_superuser_profile <your-username>
   ```
   
   Replace `<your-username>` with your actual superuser username. For example:
   ```bash
   python manage.py setup_superuser_profile admin
   ```

3. **Try logging in again** - it should work now!

### Alternative: Using Django Admin

1. **Start the server:**
   ```bash
   python manage.py runserver
   ```

2. **Access Django Admin** at `http://127.0.0.1:8000/admin/`

3. **Go to "User profiles"** section

4. **Click "Add User profile"**

5. **Fill in the form:**
   - **User**: Select your superuser
   - **Role**: Select "Super Admin" (SUPERADMIN)
   - **Unit**: Select "Strategic Affairs Office" (or any unit you prefer)

6. **Save** and try logging in again

### Alternative: Using User Admin (Easier)

1. **Start the server:**
   ```bash
   python manage.py runserver
   ```

2. **Access Django Admin** at `http://127.0.0.1:8000/admin/`

3. **Go to "Users"** section

4. **Click on your superuser** to edit

5. **Scroll down to "User Profile" section**

6. **Fill in:**
   - **Role**: Select "Super Admin" (SUPERADMIN)
   - **Unit**: Select "Strategic Affairs Office"

7. **Save** and try logging in again

## What Was Fixed

1. ✅ Created management command `setup_superuser_profile` to easily create profiles
2. ✅ Created management command `create_default_units` to set up default organizational units
3. ✅ Enhanced Django Admin to show UserProfile inline when editing users
4. ✅ Added "Has Profile" indicator in User admin list

## For Future Users

When creating new users, you can:
- Use the management command: `python manage.py setup_superuser_profile <username>`
- Or create the profile through Django Admin (Users → Edit User → User Profile section)

