# 🚀 ReachInbox Email Scheduler - Full-stack Assignment

A production-grade email scheduling service with a dashboard, built using **BullMQ**, **Redis**, **PostgreSQL**, **Express**, and **Next.js**.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Testing](#testing)

---

## ✨ Features

### Backend Features
- ✅ **Email Scheduling** with BullMQ delayed jobs (NO cron)
- ✅ **Rate Limiting** - Configurable per-sender hourly limits (200 emails/hour default)
- ✅ **Worker Concurrency** - 5 parallel workers processing emails
- ✅ **Delay Between Emails** - Configurable 2-second delay to mimic throttling
- ✅ **Persistence** - Survives server restarts without losing scheduled jobs
- ✅ **Idempotency** - Emails are never sent twice
- ✅ **Multi-sender Support** - Different senders with individual rate limits
- ✅ **Ethereal SMTP** - Fake email sending for testing

### Frontend Features
- ✅ **Google OAuth Login** - Clickable Google login button
- ✅ **Dashboard** - View scheduled and sent emails
- ✅ **Email Composition** - Subject, body, CSV upload, scheduling
- ✅ **CSV File Upload** - Parse email addresses from CSV/TXT files
- ✅ **Real-time Status** - Loading states and empty states
- ✅ **Clean UI** - Simple, functional design matching assignment requirements
- ✅ **SMTP setup** - Configure a standard SMTP provider from the dashboard
- ✅ **HTML email editor** - Send a text fallback and email-safe HTML together
- ✅ **Attachments** - Add multiple files to a scheduled message
- ✅ **Templates and data pills** - Save reusable templates and personalize with `{{name}}`, `{{company}}`, or any CSV column
- ✅ **Docs page** - In-product setup and sending guidance

---

## 🛠 Tech Stack

### Backend
- **Language**: TypeScript
- **Framework**: Express.js
- **Queue**: BullMQ (backed by Redis)
- **Database**: PostgreSQL 16 with Prisma 7 ORM
- **SMTP**: Ethereal Email (fake SMTP)
- **Job Processing**: BullMQ Worker with concurrency

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Authentication**: NextAuth.js
- **HTTP Client**: Axios
- **Icons**: Lucide React

### Infrastructure
- **Database**: PostgreSQL 16 (Windows Service)
- **Cache/Queue**: Redis 5.0.14 (Windows)
- **Runtime**: Node.js 18+

---

## 📦 Prerequisites

Before running this project, ensure you have:

- **Node.js** v18 or higher
- **PostgreSQL 16** installed and running
- **Redis** installed and running
- **Git** for cloning the repository

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/kinshukkush/REACHINBOX-EMAIL-SCHEDULER
cd "Outbox Ai Assisment"
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:

```env
# Database
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/email_scheduler?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=4000

# SMTP (Ethereal Email - Get yours at https://ethereal.email)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your.email@ethereal.email
SMTP_PASS=your-ethereal-password

# Rate Limiting
MAX_EMAILS_PER_HOUR=200
DELAY_BETWEEN_EMAILS_MS=2000
WORKER_CONCURRENCY=5
```

Generate Prisma client and push schema:

```bash
npx prisma generate
npx prisma db push
```

`DATABASE_URL` is required by both the dashboard list endpoints and the worker. If `/emails/scheduled` or `/emails/sent` returns HTTP 500, PostgreSQL is usually stopped, `DATABASE_URL` is missing, or the new schema has not been pushed. Run the two Prisma commands above after adding the `Template` and `SmtpConfig` models, then restart the backend.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local` file in `frontend/` directory:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth (Dummy)
GOOGLE_CLIENT_ID=dummy-client-id
GOOGLE_CLIENT_SECRET=dummy-client-secret

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## ▶️ Running the Application

### Run everything with Docker

Install and start Docker Desktop, then from the repository root run:

```bash
docker compose up --build
```

Open `http://localhost:3000`. The stack starts PostgreSQL, Redis, the backend API, and the Next.js frontend. The backend automatically runs `prisma db push` on startup. To stop it, press `Ctrl+C`; to remove containers and stored database data, run `docker compose down -v`.

Optional SMTP settings can be supplied before starting:

```bash
SMTP_HOST=smtp.gmail.com SMTP_PORT=465 SMTP_SECURE=true SMTP_USER=you@example.com SMTP_PASS=app-password docker compose up --build
```

### Start Backend

```bash
cd backend
npm run dev
```

Backend runs on **http://localhost:4000**

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on **http://localhost:3000**

### Access the Application

1. Open http://localhost:3000
2. Click "Login with Google" button
3. You'll be redirected to the dashboard
4. Click "Compose" to schedule emails

---

## 🏗 Architecture

### Scheduling Mechanism

**NO CRON JOBS USED** - All scheduling is done via BullMQ delayed jobs:

1. User schedules emails via frontend
2. Backend creates email records in PostgreSQL
3. Jobs are added to BullMQ with calculated delay: `delay = scheduledTime - now`
4. BullMQ stores jobs in Redis (persistent)
5. When delay expires, worker picks up the job
6. Worker sends email via Ethereal SMTP
7. Database status updates to `SENT`

### Persistence Strategy

**Server Restart Recovery:**
- All scheduled jobs are stored in Redis
- BullMQ automatically recovers pending and delayed jobs
- Email status in PostgreSQL prevents duplicates
- Worker checks email status before sending

**Data Flow:**
```
User Input → API → PostgreSQL + BullMQ → Redis → Worker → SMTP → Update DB
```

### Rate Limiting Implementation

**Per-Sender Hourly Limit:**

1. **Redis-backed Counter**: Key format `rate-limit:{senderId}:{YYYY-MM-DD-HH}`
2. **Atomic Increment**: `INCR` command with 1-hour TTL
3. **Check Before Send**: Worker checks count before sending
4. **Overflow Handling**: Jobs throw `RATE_LIMIT_EXCEEDED` error
5. **Retry Logic**: BullMQ exponential backoff delays to next hour

**Configuration:**
- `MAX_EMAILS_PER_HOUR`: 200 (configurable per request)
- `DELAY_BETWEEN_EMAILS_MS`: 2000ms between individual sends
- `WORKER_CONCURRENCY`: 5 parallel workers

**Race Condition Safety:**
- Redis atomic operations ensure accurate counts
- Multiple workers share same Redis counter
- No in-memory state dependencies

### Concurrency

- **Worker Concurrency**: 5 jobs processed in parallel
- **Thread-safe**: Redis ensures atomic rate limit checks
- **Job Locking**: BullMQ handles job locking automatically

---

## 📡 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Endpoints

#### 1. Schedule Emails
```http
POST /emails/schedule
```

**Request Body:**
```json
{
  "subject": "Meeting Follow-up",
  "body": "Hi there, following up on our meeting...",
  "recipients": ["user1@example.com", "user2@example.com"],
  "startTime": "2026-02-08T10:00:00.000Z",
  "delayBetweenEmails": 2000,
  "hourlyLimit": 200,
  "senderEmail": "oliver.brown@domain.io"
}
```

**Response:**
```json
{
  "message": "Emails scheduled successfully",
  "jobs": [
    { "emailId": "uuid", "jobId": "1" },
    { "emailId": "uuid", "jobId": "2" }
  ]
}
```

#### 2. Get Scheduled Emails
```http
GET /emails/scheduled
```

**Response:**
```json
[
  {
    "id": "uuid",
    "to": "user@example.com",
    "subject": "Meeting Follow-up",
    "body": "Hi there...",
    "scheduledAt": "2026-02-08T10:00:00.000Z",
    "status": "PENDING",
    "sender": {
      "email": "oliver.brown@domain.io"
    }
  }
]
```

#### 3. Get Sent Emails
```http
GET /emails/sent
```

**Response:**
```json
[
  {
    "id": "uuid",
    "to": "user@example.com",
    "subject": "Meeting Follow-up",
    "body": "Hi there...",
    "sentAt": "2026-02-08T10:05:00.000Z",
    "status": "SENT",
    "sender": {
      "email": "oliver.brown@domain.io"
    }
  }
]
```

---

## 🔐 Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/email_scheduler` |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `PORT` | Express server port | `4000` |
| `SMTP_HOST` | Ethereal SMTP host | `smtp.ethereal.email` |
| `SMTP_PORT` | Ethereal SMTP port | `587` |
| `SMTP_USER` | Ethereal username | `your.email@ethereal.email` |
| `SMTP_PASS` | Ethereal password | `your-password` |
| `MAX_EMAILS_PER_HOUR` | Global hourly rate limit | `200` |
| `DELAY_BETWEEN_EMAILS_MS` | Delay between sends (ms) | `2000` |
| `WORKER_CONCURRENCY` | Parallel worker count | `5` |

### Frontend (.env.local)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | NextAuth callback URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth secret key | `your-secret-key` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `dummy-client-id` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | `dummy-client-secret` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000/api` |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts                 # Prisma client with PG adapter
│   │   └── redis.ts              # Redis/IORedis configuration
│   ├── controllers/
│   │   └── emailController.ts    # API request handlers
│   ├── queues/
│   │   └── emailQueue.ts         # BullMQ queue setup
│   ├── routes/
│   │   └── emailRoutes.ts        # Express routes
│   ├── services/
│   │   └── mailService.ts        # Nodemailer SMTP setup
│   ├── workers/
│   │   └── emailWorker.ts        # BullMQ worker with rate limiting
│   └── index.ts                  # Express server entry
├── prisma/
│   └── schema.prisma             # Database schema
├── prisma.config.ts              # Prisma 7 config
├── tsconfig.json
├── package.json
└── .env

frontend/
├── src/
│   ├── app/
│   │   ├── api/auth/             # NextAuth API routes
│   │   ├── dashboard/
│   │   │   ├── compose/          # Email composition
│   │   │   ├── sent/             # Sent emails view
│   │   │   ├── layout.tsx        # Dashboard layout
│   │   │   └── page.tsx          # Scheduled emails
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Root redirect
│   └── components/
│       ├── Header.tsx            # Top header with search
│       └── Sidebar.tsx           # Navigation sidebar
├── public/
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local
```

---

## 🧪 Testing

### Test Email Scheduling

1. **Via Frontend:**
   - Go to http://localhost:3000
   - Login and click "Compose"
   - Upload a CSV file with emails or enter manually
   - Set start time (future)
   - Click "Schedule Emails"
   - Check "Scheduled" tab to see pending emails
   - Wait for scheduled time, check "Sent" tab

2. **Via Postman:**
```bash
POST http://localhost:4000/api/emails/schedule
Content-Type: application/json

{
  "subject": "Test Email",
  "body": "This is a test",
  "recipients": ["test@example.com"],
  "startTime": "2026-02-08T15:00:00.000Z",
  "delayBetweenEmails": 2000,
  "hourlyLimit": 200,
  "senderEmail": "sender@example.com"
}
```

### Test Persistence (Server Restart)

1. Schedule emails for 5 minutes from now
2. Stop backend: `Ctrl+C` in backend terminal
3. Restart backend: `npm run dev`
4. Emails will still send at the scheduled time ✅

### View Sent Emails

Visit Ethereal Email inbox:
- URL: https://ethereal.email/messages
- Use your Ethereal credentials (from .env file)

---

## 🎯 Assignment Requirements Checklist

### Backend ✅
- [x] TypeScript + Express.js
- [x] BullMQ + Redis (NO cron jobs)
- [x] PostgreSQL with Prisma ORM
- [x] Ethereal SMTP integration
- [x] Email scheduling via API
- [x] Delayed jobs with calculated delays
- [x] Persistence across restarts
- [x] Idempotency (no duplicate sends)
- [x] Rate limiting (200 emails/hour, configurable)
- [x] Delay between emails (2 seconds, configurable)
- [x] Worker concurrency (5 parallel jobs)
- [x] Multi-sender support
- [x] Redis-backed rate limit counters
- [x] Safe across multiple workers

### Frontend ✅
- [x] Next.js 16 with TypeScript
- [x] Tailwind CSS styling
- [x] Google OAuth login (clickable button)
- [x] Dashboard with scheduled/sent tabs
- [x] Email composition page
- [x] CSV file upload with parsing
- [x] Start time picker
- [x] Delay and hourly limit inputs
- [x] Loading states
- [x] Empty states
- [x] Error handling
- [x] Clean code structure
- [x] Reusable components

---

## 🗄 Database Schema

```prisma
model Sender {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  emails    Email[]
  createdAt DateTime @default(now())
}

model Email {
  id          String      @id @default(uuid())
  to          String
  subject     String
  body        String
  scheduledAt DateTime
  sentAt      DateTime?
  status      EmailStatus @default(PENDING)
  sender      Sender      @relation(fields: [senderId], references: [id])
  senderId    String
  createdAt   DateTime    @default(now())
}

enum EmailStatus {
  PENDING
  SENT
  FAILED
}
```

---

## 🚨 Important Notes

### Services Required
- **PostgreSQL**: Must be running on port 5432
- **Redis**: Must be running on port 6379
- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:3000

### Credentials
- **Database**: Set up your own PostgreSQL with your credentials
- **Ethereal Email**: Create free account at https://ethereal.email

### Known Limitations
- Redis 5.0.14 (BullMQ recommends 6.2.0+) - Still functional
- Google OAuth uses dummy credentials (button is clickable)
- Emails sent to Ethereal (fake SMTP) for testing

---

## 📝 Author

**Created for ReachInbox Software Development Intern Assignment**

- Repository: [Your GitHub Repo URL]
- Demo Video: [Your Video URL]
- Submission Date: February 2026

---

## 📄 License

This project is created for educational and assessment purposes.

## Features

- **Google Login (Clickable Icon)**: Google OAuth integration with clickable login button.
- **Job Scheduling**: Schedule emails with specific start times using BullMQ and Redis.
- **Persistence**: Survives server restarts without losing jobs or duplicating sends.
- **Rate Limiting**: Configurable hourly limit per sender and delay between individual emails.
- **Multi-sender Support**: Manage multiple senders and track their hourly quotas.
- **Dashboard**: View scheduled and sent emails with a clean, Figma-inspired UI.
- **Ethereal Email**: Integration with fake SMTP for safe testing.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, BullMQ, Redis, Prisma 7, PostgreSQL 16.
- **Frontend**: Next.js 16, Tailwind CSS 4, TypeScript, NextAuth, Lucide Icons.

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- PostgreSQL 16 (already running on port 5432)
- Redis (running on port 6379)

### 📋 Complete Setup Instructions

#### 1. **Clone and Navigate**
```bash
cd "c:\Users\kinsh\Downloads\ALL Projects\Outbox Ai Assisment"
```

#### 2. **Backend Setup**
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

The backend server will start on **http://localhost:4000**

#### 3. **Frontend Setup**
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

The frontend will start on **http://localhost:3000**

---

## 🔐 Credentials & Configuration

### **Backend Environment Variables** (`backend/.env`)
```env
# Database Configuration
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/email_scheduler?schema=public"

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=4000

# SMTP Configuration (Ethereal Email - Get free account at https://ethereal.email)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your.email@ethereal.email
SMTP_PASS=your-ethereal-password

# Rate Limiting Configuration
MAX_EMAILS_PER_HOUR=200
DELAY_BETWEEN_EMAILS_MS=2000
WORKER_CONCURRENCY=5
```

### **Frontend Environment Variables** (`frontend/.env.local`)
```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth (Dummy values for clickable icon)
GOOGLE_CLIENT_ID=dummy-client-id
GOOGLE_CLIENT_SECRET=dummy-client-secret

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### **Database Credentials**
- **Username**: `postgres` (or your username)
- **Password**: Set your own password
- **Database**: `email_scheduler`
- **Port**: `5432`
- **Host**: `localhost`

### **Ethereal Email SMTP**
- Create free account at: https://ethereal.email
- **Host**: smtp.ethereal.email
- **Port**: 587
- **Preview Sent Emails**: https://ethereal.email/messages
- Use credentials from your Ethereal account

---

## 🏗 Architecture & Implementation

### **Scheduling**
Uses **BullMQ** delayed jobs. When an email is scheduled, a job is added to the Redis queue with a `delay` calculated from the `startTime`. This ensures persistence even if the process restarts.

**No cron jobs used** - all scheduling is handled by BullMQ's delayed job mechanism backed by Redis.

### **Rate Limiting**
Implemented using a Redis-backed counter keyed by `senderId` and `currentHour`. If the `MAX_EMAILS_PER_HOUR` is exceeded, the worker throws a custom error, triggering BullMQ's retry logic with exponential backoff, effectively delaying the job until the next window.

**Configuration**:
- `MAX_EMAILS_PER_HOUR`: 200 emails per sender per hour
- `DELAY_BETWEEN_EMAILS_MS`: 2000ms (2 seconds) between individual emails

### **Concurrency**
Configured in the BullMQ worker options with `WORKER_CONCURRENCY=5`. Multiple workers can process the queue in parallel, respecting the per-sender rate limits via the shared Redis state.

### **Persistence**
- Database: PostgreSQL stores all email records (pending, sent, failed)
- Queue: BullMQ + Redis stores job state
- On restart: Pending jobs are automatically recovered from Redis
- Idempotency: Email status is checked before sending to prevent duplicates

### **Database Schema** (Prisma)
```prisma
model Sender {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  emails    Email[]
  createdAt DateTime @default(now())
}

model Email {
  id          String      @id @default(uuid())
  to          String
  subject     String
  body        String
  scheduledAt DateTime
  sentAt      DateTime?
  status      EmailStatus @default(PENDING)
  sender      Sender      @relation(fields: [senderId], references: [id])
  senderId    String
  createdAt   DateTime    @default(now())
}

enum EmailStatus {
  PENDING
  SENT
  FAILED
}
```

---

## 🎯 API Endpoints

### **POST** `/api/emails/schedule`
Schedule new emails for sending.

**Request Body**:
```json
{
  "senderId": "uuid",
  "emails": ["user@example.com", "another@example.com"],
  "subject": "Email subject",
  "body": "Email body content",
  "startTime": "2026-02-06T10:00:00Z",
  "delayBetweenEmails": 2000,
  "hourlyLimit": 200
}
```

### **GET** `/api/emails/scheduled`
Get all scheduled (pending) emails.

### **GET** `/api/emails/sent`
Get all sent emails.

---

## 🧪 Testing the Application

### **1. Access the Dashboard**
1. Open http://localhost:3000
2. Click on the Google login icon
3. You'll be redirected to the dashboard

### **2. Schedule Emails**
1. Click "Compose New Email"
2. Enter subject and body
3. Upload a CSV file with email addresses
4. Set start time, delay, and hourly limit
5. Click "Schedule"

### **3. View Results**
- **Scheduled Emails Tab**: See pending emails
- **Sent Emails Tab**: See delivered emails
- **Ethereal Email**: Check https://ethereal.email/messages to view sent emails

### **4. Test Persistence**
1. Schedule emails for a future time
2. Stop the backend server (`Ctrl+C`)
3. Restart: `npm run dev`
4. Emails will still send at the scheduled time ✅

---

## 📦 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts              # Prisma client initialization
│   │   └── redis.ts           # Redis configuration
│   ├── controllers/
│   │   └── emailController.ts # API controllers
│   ├── queues/
│   │   └── emailQueue.ts      # BullMQ queue setup
│   ├── routes/
│   │   └── emailRoutes.ts     # Express routes
│   ├── services/
│   │   └── mailService.ts     # Nodemailer SMTP setup
│   ├── workers/
│   │   └── emailWorker.ts     # BullMQ worker with rate limiting
│   └── index.ts               # Express server entry point
├── prisma/
│   └── schema.prisma          # Database schema
├── prisma.config.ts           # Prisma 7 configuration
├── tsconfig.json              # TypeScript configuration
└── package.json

frontend/
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/
│   │   │   └── route.ts       # NextAuth API route
│   │   ├── dashboard/
│   │   │   ├── compose/       # Email composition page
│   │   │   ├── sent/          # Sent emails page
│   │   │   └── page.tsx       # Dashboard home
│   │   ├── login/
│   │   │   └── page.tsx       # Login page
│   │   └── layout.tsx         # Root layout
│   └── components/
│       ├── Header.tsx
│       └── Sidebar.tsx
└── package.json
```

---

## 🚨 Important Notes

### **Services Running**
- **Backend**: http://localhost:4000 (Express + BullMQ worker)
- **Frontend**: http://localhost:3000 (Next.js)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379 (version 5.0.14.1 - upgrade to 6.2.0+ recommended)

### **Known Warnings**
- Redis version 5.0.14.1 is below BullMQ's recommended 6.2.0 (still functional)
- Next.js Turbopack warning about lockfiles (non-critical)

### **Stopping Services**
- Frontend/Backend: `Ctrl+C` in the terminal
- PostgreSQL: `Stop-Service postgresql-x64-16` (PowerShell as Admin)
- Redis: Close redis-server.exe process

---

## 🎥 Demo Features

1. ✅ **Email Scheduling**: CSV upload, bulk scheduling
2. ✅ **Dashboard**: View scheduled and sent emails
3. ✅ **Rate Limiting**: Configurable per-sender limits
4. ✅ **Persistence**: Server restart recovery
5. ✅ **SMTP Integration**: Ethereal email for testing
6. ✅ **No Cron Jobs**: Pure BullMQ delayed jobs
7. ✅ **Worker Concurrency**: Parallel processing with Redis coordination

---

## 📝 Development Notes

### **Why Prisma 7?**
This project uses Prisma 7 which requires:
- `prisma.config.ts` for configuration
- PostgreSQL adapter (`@prisma/adapter-pg`)
- No `url` in schema.prisma datasource

### **Ethereal Email**
All emails are sent to Ethereal's fake SMTP server. You can view them at:
- https://ethereal.email/messages
- Login with: prince.senger76@ethereal.email / mw3rRHE8vJe1kfdETA

---

## 🤝 Assignment Completion Checklist

- ✅ Backend with TypeScript + Express
- ✅ BullMQ + Redis job scheduling (NO cron)
- ✅ PostgreSQL database with Prisma ORM
- ✅ Ethereal Email SMTP integration
- ✅ Rate limiting (200 emails/hour configurable)
- ✅ Delay between emails (2 seconds configurable)
- ✅ Worker concurrency (5 parallel jobs)
- ✅ Persistence across server restarts
- ✅ Frontend with Next.js + TypeScript
- ✅ Tailwind CSS styling
- ✅ Google OAuth login (clickable icon)
- ✅ Dashboard with Scheduled/Sent email views
- ✅ Email composition with CSV upload
- ✅ Clean component structure
- ✅ Loading states and error handling

---

## 👨‍💻 Author

Created for the ReachInbox Software Development Intern Assignment.

**Contact**: kinshuksaxena3@gmail.com
**Number**:+91 9057538521
**Linkedin**: https://www.linkedin.com/in/kinshuk-saxena-/

---

## 📄 License

This project is created for educational and assessment purposes.
