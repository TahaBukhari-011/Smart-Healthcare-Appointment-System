# Smart Healthcare Appointment System

A microservices-based healthcare appointment booking system with event-driven architecture.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│                    Deployed on Vercel                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                               │
│                    (Next.js API Routes)                          │
└─────────────────────────────────────────────────────────────────┘
          │                     │                     │
          ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  AUTH SERVICE   │  │  APPOINTMENT    │  │  NOTIFICATION   │
│                 │  │    SERVICE      │  │    SERVICE      │
│  - Register     │  │  - Book         │  │  - Create       │
│  - Login        │  │  - Approve      │  │  - List         │
│  - Verify JWT   │  │  - Reject       │  │  - Mark Read    │
│  - Get Users    │  │  - Cancel       │  │                 │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                     │
         │                    ▼                     │
         │           ┌─────────────────┐            │
         │           │   EVENT BUS     │◄───────────┘
         │           │   (In-Memory/   │
         │           │    Redis)       │
         │           └─────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MongoDB Database                          │
│   ┌─────────┐    ┌──────────────┐    ┌───────────────┐         │
│   │  Users  │    │ Appointments │    │ Notifications │         │
│   └─────────┘    └──────────────┘    └───────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Event Flow

```
Patient Books Appointment
         │
         ▼
┌─────────────────────┐
│ Appointment Service │──── EMIT ────▶ "APPOINTMENT_BOOKED"
└─────────────────────┘                        │
                                               ▼
                                  ┌─────────────────────┐
                                  │ Notification Service│
                                  │  (Subscribes to     │
                                  │   appointment       │
                                  │   events)           │
                                  └─────────────────────┘
                                               │
                                               ▼
                                  Creates notification for Doctor
```

## Project Structure

```
healthcare-system/
├── services/
│   ├── auth/           # Auth Microservice
│   ├── appointment/    # Appointment Microservice
│   └── notification/   # Notification Microservice
├── shared/
│   ├── events/         # Event Bus & Types
│   └── types/          # Shared TypeScript types
├── frontend/           # Next.js Frontend
├── docker-compose.yml  # Local development
└── README.md
```

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run with Docker (recommended)
docker-compose up

# Or run locally
npm run dev
```

## Security Features

- HttpOnly cookies for JWT tokens
- Protected API routes with middleware
- No secrets exposed to frontend
- CORS configuration
- Rate limiting (production)

## Deployment

- **Frontend**: Vercel
- **Microservices**: Vercel Serverless Functions
- **Database**: MongoDB Atlas
