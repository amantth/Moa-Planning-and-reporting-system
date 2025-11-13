# Quick API Test Guide

## Test with Browser Console

Open your frontend in the browser and open the console (F12), then run these commands:

### 1. Test API Root
```javascript
fetch('http://localhost:8000/api/')
  .then(r => r.json())
  .then(console.log)
```

### 2. Test Login (Replace with your credentials)
```javascript
fetch('http://localhost:8000/api/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'your-email@example.com',
    password: 'your-password'
  })
})
.then(r => r.json())
.then(data => {
  console.log('Login response:', data);
  if (data.token) {
    localStorage.setItem('agri_app_auth_token', data.token);
    console.log('✅ Token saved!');
  }
})
```

### 3. Test Auth Me (After login)
```javascript
fetch('http://localhost:8000/api/auth/me/', {
  headers: {
    'Authorization': `Token ${localStorage.getItem('agri_app_auth_token')}`
  }
})
.then(r => r.json())
.then(console.log)
```

### 4. Test Users List (After login)
```javascript
fetch('http://localhost:8000/api/users/list-with-profiles/', {
  headers: {
    'Authorization': `Token ${localStorage.getItem('agri_app_auth_token')}`
  }
})
.then(r => r.json())
.then(console.log)
```

### 5. Test Units List (After login)
```javascript
fetch('http://localhost:8000/api/units/', {
  headers: {
    'Authorization': `Token ${localStorage.getItem('agri_app_auth_token')}`
  }
})
.then(r => r.json())
.then(console.log)
```

## Test with Postman

### 1. Login
```
POST http://localhost:8000/api/auth/login/
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "username": "your-email@example.com",
  "password": "your-password"
}
```

Copy the `token` from the response.

### 2. Get Current User
```
GET http://localhost:8000/api/auth/me/
Headers:
  Authorization: Token <paste-token-here>
```

### 3. List Users
```
GET http://localhost:8000/api/users/list-with-profiles/
Headers:
  Authorization: Token <paste-token-here>
```

### 4. Create Unit (POST example)
```
POST http://localhost:8000/api/units/
Headers:
  Authorization: Token <paste-token-here>
  Content-Type: application/json
Body (raw JSON):
{
  "name": "Test Unit",
  "type": "STRATEGIC",
  "description": "Testing POST request"
}
```

## Expected Results

✅ All requests should return 200 OK (or 201 Created for POST)
✅ Login should return a token
✅ Auth/me should return user and profile data
✅ Users list should return array of users with profiles
✅ POST requests should create new resources

## Troubleshooting

If you get errors:

1. **Network Error**: Backend not running
   ```powershell
   cd agri_project-main
   python manage.py runserver 8000
   ```

2. **401 Unauthorized**: Token missing or invalid
   - Login again to get fresh token
   - Check Authorization header format: `Token <token>` (not `Bearer`)

3. **404 Not Found**: Wrong URL
   - Check endpoint path
   - Make sure UserViewSet is registered

4. **500 Internal Server Error**: Check Django console for error details

## Quick Frontend Test

If your frontend is running, just:

1. Navigate to login page
2. Enter credentials
3. Check browser Network tab (F12)
4. Should see successful API calls with 200 status codes

All green = Everything works! 🎉
