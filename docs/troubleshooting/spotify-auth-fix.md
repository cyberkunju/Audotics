# Spotify Authentication Issue and Fix

## Problem Description

The application was experiencing authentication issues between the Next.js frontend (port 3000) and NestJS backend (port 3002) when using Spotify OAuth. 

### Symptoms
- 401 Unauthorized errors when accessing `/api/auth/spotify/me` endpoint
- 500 errors when refreshing tokens
- Backend logs showing "No access token found in cookies"
- User unable to stay authenticated between requests

### Error Logs
Frontend:
```
Backend request failed with status 401: {"message":"Failed to get user profile","error":"Unauthorized","statusCode":401}
```

Backend:
```
ERROR [AuthController] No access token found in cookies
ERROR [AuthController] Get user error:
ERROR [AuthController] UnauthorizedException: No access token found
```

## Root Cause Analysis

The primary issue was related to cross-domain cookie sharing between different ports on localhost:

1. **Cookie Domain Restrictions**: Cookies set on localhost:3002 (backend) were not accessible from localhost:3000 (frontend) due to domain mismatches and security restrictions.

2. **Cookie Security Settings**: Cookies were being set with incorrect security settings for cross-domain use:
   - `secure: false` (preventing cross-domain cookie access in modern browsers)
   - `sameSite: 'lax'` (restricting cross-site cookie usage)

3. **Missing Trust Proxy**: The backend wasn't configured to trust forwarded headers, causing issues with secure cookies in development environments.

4. **API URL Mismatch**: The frontend was trying to access an incorrect API URL (port 3003 instead of 3002).

5. **PowerShell Command Issues**: Windows PowerShell doesn't support the `&&` operator for command chaining, which caused confusion when trying to run both servers.

## Solution Implemented

### 1. Backend Cookie Configuration

Updated the cookie settings in `auth.controller.ts` to support cross-domain usage:

```typescript
private getCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: true,  // Changed to true for cross-domain cookie sharing
    sameSite: 'none', // Required for cross-domain cookies
    path: '/',
    // Removed domain restriction that was set to 'localhost'
  };
}
```

### 2. Added Trust Proxy Setting

Added trust proxy setting in `main.ts` to support secure cookies on localhost:

```typescript
// Enable trust proxy - IMPORTANT for secure cookies across domains
app.getHttpAdapter().getInstance().set('trust proxy', 1);
```

### 3. Fixed API URL in Frontend

Updated the API URL in the frontend code to point to the correct backend port:

```typescript
// Get the API URL with the correct port
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
```

### 4. Improved Request Configuration

Added proper cache control and cookie forwarding to API requests:

```typescript
const backendResponse = await fetch(`${BACKEND_AUTH_URL}/auth/spotify/user`, {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Cookie': `spotify_access_token=${accessToken}`
  },
  next: { revalidate: 0 },
  cache: 'no-store'
})
```

### 5. Fixed PowerShell Commands

Used semicolons instead of `&&` for command chaining in PowerShell:

```powershell
cd backend; npm run dev
```

## Technical Details

### Cookie Security in Cross-Domain Contexts

When using cookies across different domains or ports (even on localhost), the following settings are crucial:

1. **secure: true** - Required for cross-domain cookie sharing, even on localhost
2. **sameSite: 'none'** - Allows cookies to be sent in cross-site requests
3. **trust proxy** - Required for Express/NestJS to handle secure cookies correctly in development

### Browser Security Policies

Modern browsers enforce strict security policies for cookies:
- SameSite restrictions prevent cookies from being sent in cross-site requests
- Secure attribute is required for SameSite=None cookies
- Different ports on localhost are treated as different sites for security purposes

## Testing the Solution

After implementing the fixes, the application successfully:
1. Authenticates with Spotify
2. Stores authentication tokens in cookies
3. Shares those cookies between frontend and backend
4. Refreshes tokens automatically when needed

## Best Practices

1. **Always use trust proxy** when dealing with secure cookies in development
2. **Set sameSite to 'none' and secure to true** for cross-domain cookies
3. **Include explicit Cookie headers** when proxying requests to other services
4. **Add cache:'no-store'** to prevent caching of authentication requests
5. **Ensure consistent port configuration** across all services

## References

1. [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
2. [SameSite Cookies Explained](https://web.dev/articles/samesite-cookies-explained)
3. [Express Trust Proxy Documentation](https://expressjs.com/en/guide/behind-proxies.html)
4. [NestJS CORS Documentation](https://docs.nestjs.com/security/cors) 