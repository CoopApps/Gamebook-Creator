# API Testing Guide

Complete guide to testing the Gamebook Creator API endpoints.

## Base URL

Local development: `http://localhost:3000`

## Authentication Endpoints

### 1. Register a New User

**Endpoint:** `POST /api/auth/register`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "username": "testuser",
    "password": "TestPass123!"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "testuser@example.com",
      "username": "testuser",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Response (409 - Conflict):**
```json
{
  "success": false,
  "error": "ConflictError",
  "message": "Email already registered"
}
```

**Error Response (422 - Validation Error):**
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### 2. Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "testuser@example.com",
      "username": "testuser",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Response (401 - Unauthorized):**
```json
{
  "success": false,
  "error": "UnauthorizedError",
  "message": "Invalid email or password"
}
```

### 3. Refresh Access Token

**Endpoint:** `POST /api/auth/refresh`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token-here"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token"
  }
}
```

### 4. Get Current User Profile

**Endpoint:** `GET /api/auth/me`

**Requires:** Authentication (Bearer token)

**Request:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer your-access-token-here"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "email": "testuser@example.com",
    "username": "testuser",
    "oauthProvider": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "_count": {
      "projects": 5,
      "collaborations": 2
    }
  }
}
```

### 5. Update Profile

**Endpoint:** `PATCH /api/auth/profile`

**Requires:** Authentication (Bearer token)

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer your-access-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newusername"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid-here",
    "email": "testuser@example.com",
    "username": "newusername",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:10:00.000Z"
  }
}
```

### 6. Change Password

**Endpoint:** `POST /api/auth/change-password`

**Requires:** Authentication (Bearer token)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer your-access-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "TestPass123!",
    "newPassword": "NewPass456!"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 7. Logout

**Endpoint:** `POST /api/auth/logout`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/logout
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Complete Testing Flow

### Using Demo User

```bash
# 1. Login with demo user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@gamebook.dev",
    "password": "demo123"
  }' | jq

# Save the accessToken from response
export ACCESS_TOKEN="paste-access-token-here"

# 2. Get profile
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# 3. Update username
curl -X PATCH http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demoupdated"
  }' | jq
```

### Full Registration Flow

```bash
# 1. Register new user
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "SecurePass123!"
  }')

echo $REGISTER_RESPONSE | jq

# 2. Extract access token
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.refreshToken')

echo "Access Token: $ACCESS_TOKEN"
echo "Refresh Token: $REFRESH_TOKEN"

# 3. Get profile
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# 4. Refresh token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}" | jq

# 5. Change password
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!"
  }' | jq

# 6. Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

## Error Scenarios

### Invalid Email Format

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "username": "test",
    "password": "Test123!"
  }' | jq
```

### Weak Password

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "test",
    "password": "weak"
  }' | jq
```

### Missing Authentication

```bash
curl -X GET http://localhost:3000/api/auth/me | jq
```

### Invalid Token

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer invalid-token-here" | jq
```

### Expired Token

```bash
# Use an old/expired token
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer expired-token" | jq
```

## Password Requirements

Passwords must meet these criteria:
- ✅ At least 8 characters long
- ✅ Less than 72 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

**Valid Examples:**
- `Password123!`
- `MyS3cur3P@ss`
- `Test1234!@#`

**Invalid Examples:**
- `password` (no uppercase, no number, no special char)
- `PASSWORD123` (no lowercase, no special char)
- `Pass1!` (too short)

## Using Postman

### Setup

1. Import the collection: `postman_collection.json`
2. Set environment variable:
   - `baseUrl`: `http://localhost:3000`
   - `accessToken`: (will be set automatically after login)
   - `refreshToken`: (will be set automatically after login)

### Collection Variables

The Postman collection automatically:
- Saves tokens after login/register
- Uses saved tokens for authenticated requests
- Refreshes tokens when expired

## Using HTTPie

```bash
# Install HTTPie
pip install httpie

# Register
http POST :3000/api/auth/register \
  email=test@example.com \
  username=testuser \
  password=Test123!

# Login
http POST :3000/api/auth/login \
  email=test@example.com \
  password=Test123!

# Get profile (with token)
http GET :3000/api/auth/me \
  Authorization:"Bearer your-token-here"
```

## Testing Checklist

- [ ] Register new user with valid data
- [ ] Register with duplicate email (should fail)
- [ ] Register with duplicate username (should fail)
- [ ] Register with weak password (should fail)
- [ ] Register with invalid email (should fail)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Login with non-existent email (should fail)
- [ ] Get profile with valid token
- [ ] Get profile without token (should fail)
- [ ] Get profile with invalid token (should fail)
- [ ] Update username
- [ ] Update to taken username (should fail)
- [ ] Change password with correct current password
- [ ] Change password with wrong current password (should fail)
- [ ] Refresh token with valid refresh token
- [ ] Refresh token with invalid refresh token (should fail)
- [ ] Logout

## Common Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created (registration)
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `422 Unprocessable Entity` - Validation failed
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Rate Limiting

- 100 requests per 15 minutes per IP
- Exceeding limit returns `429 Too Many Requests`

## Next Steps

Once authentication is working:
1. Test with frontend application
2. Implement OAuth (Google, GitHub)
3. Add email verification
4. Add password reset functionality
5. Implement token blacklisting for logout
