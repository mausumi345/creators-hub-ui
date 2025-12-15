# Creative Hub UI

React frontend for the Creative Hub platform - a collaboration space for designers, customers, and makers.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls with automatic token refresh

## Features

- **Authentication**
  - Login with username/password
  - Google OAuth login
  - User signup
  - Forgot password flow
  - Automatic token refresh on 401
  
- **Session Management**
  - HttpOnly cookie-based auth (`ch_access`, `ch_refresh`)
  - Automatic refresh when access token expires
  - Logout from current or all devices

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Environment Configuration

Create or edit `src/lib/config.ts`:

```typescript
export const API_BASE_URL = "http://localhost:8081/api/creatorshub";
```

### Run Development Server

```bash
npm run dev
```

App runs at: http://localhost:5173

## Authentication Flow

1. **Login/Signup**: Calls API Gateway → sets `ch_access` and `ch_refresh` cookies
2. **API Requests**: Axios includes cookies automatically (`withCredentials: true`)
3. **Token Expired**: Axios interceptor catches 401, calls `/auth/refresh`
4. **Refresh Success**: New cookies set, original request retried
5. **Refresh Failure**: User redirected to login

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/apiClient.ts` | Axios instance with auto-refresh |
| `src/contexts/AuthContext.tsx` | Auth state management |
| `src/components/ProtectedRoute.tsx` | Route protection |
| `src/pages/LoginPage.tsx` | Login form |
| `src/pages/SignupPage.tsx` | Registration form |

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── Logo.tsx
│   ├── TopBar.tsx
│   └── ProtectedRoute.tsx
├── contexts/         # React contexts
│   └── AuthContext.tsx
├── layouts/          # Page layouts
│   └── MainLayout.tsx
├── lib/              # Utilities
│   ├── apiClient.ts  # Axios with interceptors
│   └── config.ts     # API URLs
├── pages/            # Page components
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── ForgotPasswordPage.tsx
│   └── AuthCallbackPage.tsx
└── App.tsx           # Routes
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## API Integration

The app communicates with the API Gateway at `http://localhost:8081`:

| Endpoint | Action |
|----------|--------|
| `POST /auth/login` | Login |
| `POST /auth/signup` | Register |
| `GET /auth/login/google` | Google OAuth |
| `POST /auth/refresh` | Refresh tokens |
| `GET /auth/me` | Get user info |
| `POST /auth/logout` | Logout |

## Troubleshooting

### Cookies not being set

1. Ensure API Gateway has CORS configured with `credentials: true`
2. Check browser DevTools → Application → Cookies
3. Verify `withCredentials: true` in axios config

### 401 errors on page load

This is normal for unauthenticated users. The app tries to fetch `/auth/me` and handles the 401.

### CORS errors

Ensure the API Gateway's CORS allows:
- Origin: `http://localhost:5173`
- Credentials: `true`

---

*Last updated: December 2024*
