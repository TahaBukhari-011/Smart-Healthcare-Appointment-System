# Vercel Deployment Guide

## Prerequisites

1. **MongoDB Atlas Account** - Free tier available at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. **Vercel Account** - Free tier available at [vercel.com](https://vercel.com)
3. **Git Repository** - Push your code to GitHub/GitLab/Bitbucket

## Step 1: Set Up MongoDB Atlas

1. Create a free MongoDB Atlas account
2. Create a new cluster (M0 Free tier is sufficient)
3. Create a database user with read/write access
4. Add `0.0.0.0/0` to IP Access List (for Vercel serverless functions)
5. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/healthcare?retryWrites=true&w=majority
   ```

## Step 2: Deploy to Vercel

### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET

# Deploy to production
vercel --prod
```

### Option B: Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A strong random string (min 32 characters)
4. Click "Deploy"

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/healthcare` |
| `JWT_SECRET` | Secret for JWT signing | `your-super-secret-key-min-32-chars` |
| `NEXT_PUBLIC_APP_URL` | Public app URL (optional) | `https://your-app.vercel.app` |

## Generate a Secure JWT Secret

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Architecture on Vercel

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel Platform                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐    ┌────────────────────────────────┐ │
│  │   Static Assets  │    │     Serverless Functions       │ │
│  │   (Next.js SSG)  │    │                                │ │
│  │                  │    │  /api/auth/*     → Auth Svc    │ │
│  │  - HTML/CSS/JS   │    │  /api/appointments/* → Appt Svc│ │
│  │  - Images        │    │  /api/notifications/* → Notif  │ │
│  │                  │    │  /api/doctors    → Auth Svc    │ │
│  └──────────────────┘    └────────────────────────────────┘ │
│                                      │                       │
│                                      ▼                       │
│                          ┌──────────────────┐               │
│                          │  MongoDB Atlas   │               │
│                          │  (External)      │               │
│                          └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Security Notes for Production

1. **Never expose secrets**: All secrets are stored in Vercel Environment Variables
2. **HttpOnly Cookies**: JWT tokens are stored in HttpOnly cookies (not accessible via JavaScript)
3. **CORS**: Configure properly if using external domains
4. **Rate Limiting**: Consider adding rate limiting for API routes
5. **Input Validation**: All inputs are validated on the server

## Post-Deployment Checklist

- [ ] Verify MongoDB connection works
- [ ] Test user registration and login
- [ ] Test appointment booking flow
- [ ] Verify notifications are created
- [ ] Check HttpOnly cookie is set correctly
- [ ] Test protected routes redirect to login

## Troubleshooting

### Connection Issues
- Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Verify connection string format

### Build Errors
- Check environment variables are set
- Verify all dependencies are in package.json

### Cookie Issues
- Ensure `secure: true` for production (already configured)
- Check `sameSite` settings match your domain setup
