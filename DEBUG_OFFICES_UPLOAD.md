# Debug: Offices & Upload Pages

## Quick Tests to Run

### 1. Check if Backend is Running
Open browser and go to:
```
http://localhost:8000/api/
```

**Expected**: Should see API root with list of endpoints

**If fails**: Backend not running. Start it:
```powershell
cd agri_project-main
python manage.py runserver 8000
```

### 2. Check if You're Logged In
Open browser console (F12) and run:
```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('agri_app_auth_token'));

// Check if session exists
console.log('Session:', localStorage.getItem('agri_app_session'));
```

**Expected**: Should see a token string

**If null**: You're not logged in. Go to login page and login first.

### 3. Test Units Endpoint Directly
In browser console:
```javascript
fetch('http://localhost:8000/api/units/', {
  headers: {
    'Authorization': `Token ${localStorage.getItem('agri_app_auth_token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Units:', data))
.catch(err => console.error('Error:', err));
```

**Expected**: Should see array of units (or empty array)

**If error**: Check the error message in console

### 4. Test Create Unit (Office)
In browser console:
```javascript
fetch('http://localhost:8000/api/units/', {
  method: 'POST',
  headers: {
    'Authorization': `Token ${localStorage.getItem('agri_app_auth_token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Test Office ' + Date.now(),
    type: 'STRATEGIC',
    parent: null
  })
})
.then(r => r.json())
.then(data => console.log('Created:', data))
.catch(err => console.error('Error:', err));
```

**Expected**: Should see the created unit object

**If error**: Check the error message

### 5. Test Import/Export Endpoint
In browser console:
```javascript
fetch('http://localhost:8000/api/import-export/', {
  headers: {
    'Authorization': `Token ${localStorage.getItem('agri_app_auth_token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Import/Export:', data))
.catch(err => console.error('Error:', err));
```

**Expected**: Should see array (or empty array)

## Common Issues & Fixes

### Issue 1: "401 Unauthorized"
**Cause**: Not logged in or token expired

**Fix**:
1. Go to login page
2. Login with your credentials
3. Try again

### Issue 2: "403 Forbidden - User profile not found"
**Cause**: Your user account doesn't have a profile

**Fix**: I've removed the profile requirement. Restart Django server:
```powershell
# Stop server (Ctrl+C)
# Start again
cd agri_project-main
python manage.py runserver 8000
```

### Issue 3: "Network Error" or "Failed to fetch"
**Cause**: Backend not running or CORS issue

**Fix**:
1. Check backend is running on port 8000
2. Check browser console for specific error
3. Verify `.env` file has correct API URL

### Issue 4: Button doesn't do anything (no error)
**Cause**: JavaScript error or event handler not working

**Fix**:
1. Open browser console (F12)
2. Click the button
3. Look for any red error messages
4. Share the error message

### Issue 5: "This field is required" errors
**Cause**: Missing required fields in form

**Fix for Offices**:
- Name: Must be filled
- Type: Must be selected
- Parent: Optional (can be left empty)

**Fix for Upload**:
- File: Must be selected
- Unit: Must be selected
- Year: Must be selected
- Quarter: Only for quarterly reports

## Check Frontend is Running

Frontend should be on:
```
http://localhost:8080
```

Or check your terminal for the actual port.

If not running:
```powershell
cd ministry-agri-pulse
npm run dev
```

## Manual API Test with Postman

### Create Office
```
POST http://localhost:8000/api/units/
Headers:
  Authorization: Token <your-token>
  Content-Type: application/json

Body (raw JSON):
{
  "name": "Test Office",
  "type": "STRATEGIC",
  "parent": null
}
```

### Upload File
```
POST http://localhost:8000/api/import-export/import_data/
Headers:
  Authorization: Token <your-token>

Body (form-data):
  file: (select your Excel/CSV file)
  source: ANNUAL
  unit_id: 1
  year: 2025
```

## Get Detailed Error Info

If something fails, check Django console output:
1. Look at the terminal where Django is running
2. You'll see detailed error messages there
3. Share those error messages for help

## Check Browser Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click the button that doesn't work
4. Look for the API request
5. Click on it to see:
   - Request headers
   - Request payload
   - Response status
   - Response data

This will show exactly what's being sent and what error is returned.

## Still Not Working?

Share these details:
1. Error message from browser console
2. Error message from Django terminal
3. Network tab screenshot showing the failed request
4. What button you're clicking
5. What happens (nothing, error message, etc.)
