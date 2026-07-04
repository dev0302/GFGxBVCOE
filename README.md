<p align="center">
  <img src="./public/gfgLogo.webp" alt="GFG BVCOE Logo" width="120" />
</p>

# GFG BVCOE Official Platform

Official production platform for the GeeksforGeeks BVCOE student chapter, built with React, Vite, Tailwind CSS, Express, MongoDB, Cloudinary, Socket.IO, and AI-assisted event automation.

![Status](https://img.shields.io/badge/status-production-brightgreen?style=flat-square)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61dafb?style=flat-square)
![Backend](https://img.shields.io/badge/backend-Express%20%2B%20MongoDB-339933?style=flat-square)
![Realtime](https://img.shields.io/badge/realtime-Socket.IO-111111?style=flat-square)
![Last Commit](https://img.shields.io/github/last-commit/dev0302/GFGxBVCOE?style=flat-square)

**Live Site:** [https://gfg-bvcoe.com](https://gfg-bvcoe.com)<br>
**Repository:** [https://github.com/dev0302/GFGxBVCOE](https://github.com/dev0302/GFGxBVCOE)

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Frontend Routes](#frontend-routes)
- [API Reference](#api-reference)
- [Realtime Features](#realtime-features)
- [Deployment Notes](#deployment-notes)
- [Contributing](#contributing)
- [License](#license)

## Overview

GFG BVCOE is the official web platform for the GeeksforGeeks BVCOE society. It started as a public-facing chapter website and has grown into a full-stack society operations system with authentication, department dashboards, event management, member management, invite links, image uploads, activity logs, live presence, and AI-assisted event content generation.

The platform serves three main audiences:

- **Public visitors** who want to view society information, events, gallery, team, quiz results, and contact details.
- **Society members** who need profile access, department dashboards, team rosters, and event workflows.
- **Leadership/admin roles** such as Faculty Incharge, Chairperson, Vice-Chairperson, and department leads who manage permissions, events, members, upload links, signup access, and activity logs.

The codebase is split into:

- A **Vite + React frontend** in `src/`
- An **Express + MongoDB backend** in `server/`
- Shared public media assets in `public/`
- A keep-alive GitHub Actions workflow for the Render backend

## Core Features

### Public Website

- Responsive landing page for GFG BVCOE.
- Public pages for About, Events, Gallery, Team, Contact, Quiz, Leaderboard, Results, and Jam The Web.
- Rich image/event assets stored in `public/`.
- Animated UI using GSAP, Framer Motion, Lenis, and custom animation layers.
- Not-found handling for invalid routes.

### Authentication & Access Control

- OTP-based signup flow.
- Login/logout with JWT stored through cookie/header/local storage support.
- Password reset and password change flows.
- Profile update and avatar upload.
- Protected dashboard access.
- Role-based authorization for:
  - `ADMIN` / Faculty Incharge
  - `Chairperson`
  - `Vice-Chairperson`
  - Event Management
  - Technical
  - Design
  - Content and Documentation
  - Photography and Videography
  - Sponsorship and Marketing
  - Public Relation and Outreach
  - Social Media and Promotion

### Event Management

- Public event listing and event detail retrieval.
- Event dashboard for authorized users.
- Upload new events with images and metadata.
- Update event details and galleries.
- Soft-delete events with scheduled deletion.
- Cancel scheduled deletion.
- Force-delete events for authorized roles/departments.
- Upcoming event creation, update, deletion, and import pool.
- Public upload links for event submissions.
- Upload-link validation and suspension.
- Department-level controls for who can upload/manage events.
- Force-delete permissions configuration.

### Team & Society Management

- Department roster management.
- Add, update, delete team members.
- Upload member photos to Cloudinary.
- Excel upload for bulk team member import.
- Downloadable team template.
- Invite links for public team-member onboarding.
- Manage Society view for core roles.
- Search people across users, predefined profiles, and team members.
- Export-friendly data handling with `xlsx`, `jspdf`, and `jspdf-autotable`.

### Realtime Collaboration

- Socket.IO authenticated realtime layer.
- Online users list.
- Presence heartbeat and last-seen feed.
- Live upload request flow.
- Upload progress events.
- Upload open/close state notifications.
- Realtime image add/remove/sync events.

### AI-Assisted Workflows

- Groq-powered event formatter for turning raw event notes into structured JSON.
- AI content generation route that scrapes a provided URL with Playwright and generates a short title and description.

### Jam The Web

- Public Jam The Web team/result viewing.
- Authenticated score submission.
- Result declaration flow.

### Operations

- Render backend keep-alive workflow via GitHub Actions.
- Cloudinary cleanup utilities for uploaded media.
- Activity logging for important user and admin actions.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19 + Vite 7 | Single-page application and fast development |
| Styling | Tailwind CSS, tailwindcss-animate, class-variance-authority | Responsive UI and reusable design utilities |
| Routing | React Router DOM 7 | Public and protected client-side routes |
| State | Redux Toolkit, React Redux, Redux Persist, React Context | Auth, profile, manage-society state, and global UI state |
| Animation | GSAP, Framer Motion, Motion, Lenis, Locomotive Scroll | Page transitions and interactive visual effects |
| UI Utilities | Lucide React, React Icons, Radix Slot, Sonner | Icons, toasts, and composable UI primitives |
| Data Export | XLSX, jsPDF, jsPDF AutoTable | Excel/PDF export workflows |
| QR | qrcode.react | QR generation for event/upload workflows |
| Backend | Node.js + Express 5 | REST API, auth, dashboards, events, uploads |
| Database | MongoDB + Mongoose | Users, profiles, events, team members, config, logs |
| Realtime | Socket.IO | Online users and live upload collaboration |
| Uploads | Cloudinary + express-fileupload | Profile, event, and team media storage |
| Email | Brevo API, Nodemailer templates | OTP, signup invites, and transactional emails |
| AI | Groq SDK, Google Generative AI dependency, Playwright scraping | Event/content automation |
| Deployment | Vercel/Hostinger frontend config, Render backend | Production hosting |
| Automation | GitHub Actions | Backend keep-alive ping |

## Project Structure

```text
GFGxBVCOE/
├── .github/
│   └── workflows/
│       └── keep-alive.yml              # Scheduled Render backend ping
├── public/                             # Public images, videos, logos, gallery assets
├── server/                             # Express backend
│   ├── config/
│   │   ├── cloudinary.js               # Cloudinary SDK setup
│   │   └── database.js                 # MongoDB connection
│   ├── controllers/                    # Domain controllers
│   ├── mail/
│   │   └── templates.js                # Email templates
│   ├── middlewares/
│   │   └── AuthZ.js                    # JWT auth and role checks
│   ├── models/                         # Mongoose models
│   ├── routes/                         # Express routers
│   ├── scripts/
│   │   └── seedSignupConfig.js         # Signup config seed script
│   ├── utils/                          # Mail, activity logs, helpers
│   ├── index.js                        # Backend entrypoint + Socket.IO server
│   ├── package.json                    # Backend scripts/dependencies
│   └── package-lock.json
├── src/                                # React frontend
│   ├── animations/                     # GSAP/custom animation helpers
│   ├── assets/                         # Imported SVG/image assets
│   ├── components/                     # Shared and feature components
│   │   ├── common/                     # Navbar, Footer, profile dropdown
│   │   ├── DepartmentDashboard/        # Department dashboard layout/sidebar
│   │   ├── EventDashboard/             # Event dashboard layout and modals
│   │   ├── guards/                     # Frontend permission guards
│   │   ├── realtimeUpload/             # Realtime upload UI modules
│   │   └── ui/                         # Local UI primitives
│   ├── context/                        # Auth, sockets, feature flags, modals, upload transfer
│   ├── data/                           # Static event/team/head/quiz data
│   ├── images/                         # Imported images used by React components
│   ├── lib/                            # Shared utilities
│   ├── pages/                          # Route-level pages
│   │   ├── dashboard/                  # Generic department dashboards
│   │   └── eventDashboard/             # Event Management dashboard pages
│   ├── redux/                          # Redux store and slices
│   ├── services/                       # API client, sockets, presence socket
│   ├── styles/                         # Extra CSS modules
│   ├── App.jsx                         # Frontend route map
│   ├── index.css                       # Global CSS/Tailwind
│   └── main.jsx                        # React bootstrap
├── .env.example                        # Frontend env example
├── components.json                     # UI component config
├── eslint.config.js                    # ESLint config
├── jsconfig.json                       # JS path config
├── package.json                        # Frontend scripts/dependencies
├── postcss.config.js                   # PostCSS config
├── tailwind.config.js                  # Tailwind theme/config
├── tsconfig.json                       # TypeScript config for TS/TSX utility files
├── vercel.json                         # SPA rewrite config
└── vite.config.js                      # Vite config with @ alias
```

## Architecture

```text
Browser
  |
  | React Router + Context + Redux
  v
React/Vite Frontend
  |
  | fetch / Socket.IO
  v
Express API + Socket.IO Server
  |
  | Mongoose / Cloudinary / Brevo / Groq
  v
MongoDB + Cloudinary + Email/AI Services
```

Important implementation details:

- Frontend reads API base URL from `VITE_API_BASE_URL`.
- Backend mounts REST APIs under `/api/v1/*` plus AI/content routes under `/api/*`.
- Auth accepts JWT through `Token` cookie or `Authorization: Bearer <token>`.
- Socket.IO authenticates the same JWT during handshake.
- Cloudinary stores uploaded profile/event/team images.
- Leadership roles control signup, dashboard access, event force-delete, and society-wide views.

## Getting Started

### Prerequisites

- Node.js 20+ recommended
- npm
- MongoDB Atlas or local MongoDB
- Cloudinary account
- Brevo account for email/OTP flows
- Groq API key for AI routes

### Clone

```bash
git clone https://github.com/dev0302/GFGxBVCOE.git
cd GFGxBVCOE
```

### Install Frontend Dependencies

```bash
npm install
```

### Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### Frontend Environment

Create `.env` in the repository root:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GITHUB_TOKEN=
```

### Backend Environment

Create `server/.env`:

```env
PORT=8080
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>/<database>
JWT_SECRET=replace-with-a-strong-secret
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:8080
NODE_ENV=development

CLOUD_NAME=your-cloudinary-cloud-name
API_KEY=your-cloudinary-api-key
API_SECRET=your-cloudinary-api-secret

BREVO_API_KEY=your-brevo-api-key
SENDER_EMAIL=verified-sender@example.com

GROQ_API_KEY=your-groq-api-key
```

### Run Backend

```bash
cd server
npm run dev
```

Expected:

```text
Server running on port: 8080
```

### Run Frontend

In a second terminal:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Environment Variables

| Variable | App | Required | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Frontend | Yes | Backend base URL used by API and Socket.IO clients. |
| `VITE_GITHUB_TOKEN` | Frontend | Optional | Token used by footer GitHub integration if enabled. |
| `PORT` | Backend | No | Backend port. Defaults to `8080`. |
| `DATABASE_URL` | Backend | Yes | MongoDB connection string. |
| `JWT_SECRET` | Backend | Yes | JWT signing/verification secret. |
| `FRONTEND_URL` | Backend | Yes for emails | Frontend base URL for reset/invite links. |
| `API_URL` | Backend | Optional | API base URL used by OTP autofill flow. |
| `NODE_ENV` | Backend | Recommended | Controls production cookie behavior and development OTP responses. |
| `CLOUD_NAME` | Backend | Yes for uploads | Cloudinary cloud name. |
| `API_KEY` | Backend | Yes for uploads | Cloudinary API key. |
| `API_SECRET` | Backend | Yes for uploads | Cloudinary API secret. |
| `BREVO_API_KEY` | Backend | Yes for email | Brevo transactional email API key. |
| `SENDER_EMAIL` | Backend | Yes for email | Verified sender email address. |
| `GROQ_API_KEY` | Backend | Yes for AI | Groq API key for event formatting/content generation. |

> Do not commit real credentials. Keep production secrets in Vercel, Render, Hostinger, or the relevant hosting provider.

## Available Scripts

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite development server. |
| `npm run build` | Builds the frontend into `dist/`. |
| `npm run preview` | Serves the built frontend locally. |

### Backend

Run from `server/`.

| Command | Description |
|---|---|
| `npm run dev` | Starts backend with nodemon. |
| `npm start` | Starts backend with Node. |
| `npm test` | Placeholder script currently exits with an error. |

## Frontend Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Home page |
| `/about` | Public | About GFG BVCOE |
| `/team` | Public | Team page |
| `/events` | Public | Events listing |
| `/gallery` | Public | Gallery |
| `/contact` | Public | Contact page |
| `/results` | Public | Results page |
| `/quiz` | Public | Quiz page |
| `/leaderboard` | Public | Leaderboard |
| `/quiz/result` | Public | Quiz result page |
| `/jam-the-web` | Public/auth-enhanced | Jam The Web teams/results/scoring |
| `/login` | Public | Login |
| `/signup` | Public | Signup with OTP |
| `/forgot-password` | Public | Password reset request |
| `/reset-password/:token` | Public | Password reset completion |
| `/profile` | Authenticated | User profile |
| `/manage-team` | Authenticated | Manage department team |
| `/manage-society` | Society roles | Manage full society data |
| `/join-team/:token` | Public link | Join/add team member through invite |
| `/dashboard` | Society roles | Signup configuration dashboard |
| `/dashboard/:departmentKey` | Department dashboard | Generic department dashboard |
| `/em-dashboard` | Event roles | Event dashboard root |
| `/em-dashboard/upload` | Event roles | Upload event |
| `/em-dashboard/generate-link` | Event roles | Generate public upload link |
| `/em-dashboard/departments` | Event roles | Event dashboard allowed departments |
| `/em-dashboard/generate-qr` | Event roles | Generate QR |
| `/em-dashboard/force-delete` | Event roles/core roles | Force-delete permissions |
| `/em-dashboard/manage` | Event roles | Manage events |
| `/em-dashboard/upcoming` | Event roles | Manage upcoming events |
| `/em-dashboard/link/:token` | Public link | Upload event by public link |

## API Reference

Backend base URL:

```text
http://localhost:8080
```

### Auth API - `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/sendotp` | Public | Send OTP to an allowed email/department. |
| `GET` | `/allow-autofill` | Public | Enable/check OTP autofill flow. |
| `GET` | `/otp-for-autofill` | Public token | Poll OTP for autofill using one-time token. |
| `POST` | `/signup` | Public | Create account after OTP verification. |
| `POST` | `/login` | Public | Login and receive token. |
| `POST` | `/logout` | Public | Logout and clear token/cookie. |
| `POST` | `/forgot-password` | Public | Send password reset email. |
| `POST` | `/reset-password` | Public | Reset password using token. |
| `POST` | `/changepassword` | User | Change logged-in password. |
| `GET` | `/me` | User | Fetch current authenticated user. |
| `POST` | `/presence/heartbeat` | User | Update last seen. |
| `GET` | `/presence/last-seen` | User | Fetch last-seen feed. |
| `GET` | `/search-people` | User | Search users/team/predefined people. |
| `GET` | `/all-users` | Society roles | Fetch registered users. |
| `GET` | `/all-people` | User | Fetch people directory. |
| `POST` | `/send-signup-invite` | User | Send invite email to predefined profile. |
| `DELETE` | `/account` | User | Delete account. |
| `GET` | `/enrich-profile` | User | Server-sent profile enrichment stream. |
| `PUT` | `/profile` | User | Update profile. |
| `POST` | `/profile/avatar` | User | Upload avatar. |
| `GET` | `/signup-config` | Society roles | Read allowed signup emails. |
| `POST` | `/signup-config/add` | Society roles | Add allowed signup email. |
| `POST` | `/signup-config/remove` | Society roles | Remove allowed signup email. |

### Events API - `/api/v1/events`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Public | List events. |
| `POST` | `/` | Optional auth | Create event and optionally log creator. |
| `GET` | `/upcoming` | Public | List upcoming events. |
| `GET` | `/upcoming/import-pool` | Event upload access | Fetch upcoming import pool. |
| `POST` | `/upcoming` | Event upload access | Create upcoming event. |
| `PUT` | `/upcoming/:id` | Event upload access | Update upcoming event. |
| `DELETE` | `/upcoming/:id` | Event upload access | Delete upcoming event. |
| `POST` | `/upload-link` | Event upload access | Create public upload link. |
| `DELETE` | `/upload-link/:token` | Event upload access | Suspend upload link. |
| `GET` | `/upload-by-link/:token` | Public | Validate upload link. |
| `POST` | `/upload-by-link/:token` | Public | Submit event through upload link. |
| `DELETE` | `/:id` | Event upload access | Schedule soft delete. |
| `PATCH` | `/:id/cancel-delete` | Event upload access | Cancel scheduled delete. |
| `DELETE` | `/:id/force` | Event force-delete access | Permanently delete event. |
| `PUT` | `/:id` | Event upload access | Update event. |
| `GET` | `/upload-allowed` | Event upload access | Read upload allowed departments. |
| `POST` | `/upload-allowed/add` | Event config access | Add upload department. |
| `POST` | `/upload-allowed/remove` | Event config access | Remove upload department. |
| `GET` | `/force-delete-allowed` | Event upload access | Read force-delete departments. |
| `POST` | `/force-delete-allowed/add` | Force config access | Add force-delete department. |
| `POST` | `/force-delete-allowed/remove` | Force config access | Remove force-delete department. |
| `GET` | `/:id` | Public | Fetch event by id. |

### Team API - `/api/v1/team`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/join/:token` | Public | Validate team invite link. |
| `POST` | `/join/:token/upload-photo` | Public | Upload member photo through invite link. |
| `POST` | `/join/:token` | Public | Add member through invite link. |
| `GET` | `/departments` | User | List departments. |
| `GET` | `/roster` | User | Fetch department roster. |
| `GET` | `/members` | User | Fetch team members. |
| `POST` | `/members` | User | Add member. |
| `POST` | `/upload-photo` | User | Upload member photo. |
| `POST` | `/invite-link` | User | Create team invite link. |
| `DELETE` | `/invite-link/:token` | User | Suspend invite link. |
| `PUT` | `/members/:id` | User | Update member. |
| `DELETE` | `/members/:id` | User | Delete member. |
| `POST` | `/members/upload-excel` | User | Bulk import team members. |
| `GET` | `/template` | User | Download team import template. |

### Other APIs

| Base | Endpoint | Auth | Description |
|---|---|---|---|
| `/api/v1/dashboards` | `/:dashboardKey/allowed` | User | Read dashboard allowed departments. |
| `/api/v1/dashboards` | `/:dashboardKey/allowed/add` | Dashboard config access | Add dashboard department. |
| `/api/v1/dashboards` | `/:dashboardKey/allowed/remove` | Dashboard config access | Remove dashboard department. |
| `/api/v1/activity-logs` | `/:userId` | Society roles | Fetch activity logs for a user. |
| `/api/v1/jamtheweb` | `/` | Public | View Jam The Web teams. |
| `/api/v1/jamtheweb` | `/declared` | Public | Check if results are declared. |
| `/api/v1/jamtheweb` | `/declare` | User | Declare results. |
| `/api/v1/jamtheweb` | `/submit` | User | Submit scores. |
| `/api/v1/ai` | `/format-event` | Public route in code | Format raw event data with Groq. |
| `/api` | `/generate-content` | Public route in code | Scrape a URL and generate title/description. |

## Realtime Features

Socket.IO is initialized in `server/index.js` using the same HTTP server as Express.

### Authentication

Socket clients authenticate with JWT through:

- `socket.handshake.auth.token`
- `Authorization: Bearer <token>`
- `Token` cookie

### Server Events

| Event | Direction | Purpose |
|---|---|---|
| `online-users` | Server to client | Broadcast online users list. |
| `join-dashboard` | Client to server | Ask server to refresh online users. |
| `send-upload-request` | Client to server | Send upload request to another user. |
| `receive-upload-request` | Server to receiver | Notify receiver about upload request. |
| `upload-request-opened` | Client/server | Notify sender that request was opened. |
| `upload-request-closed` | Client/server | Notify sender that request was closed. |
| `upload-progress` | Client/server | Share live upload progress. |
| `upload-complete` | Client/server | Mark upload as complete. |
| `new-image-added` | Client/server | Sync newly added image. |
| `image-added` | Server alias | Compatibility event for image add. |
| `image-removed` | Client/server | Sync image removal. |
| `images-sync` | Client/server | Sync image state. |

## Deployment Notes

- Frontend SPA rewrites are configured in `vercel.json`.
- Vite outputs production files to `dist/`.
- `vite.config.js` sets `base: "/"` and alias `@ -> src`.
- GitHub Actions keep-alive pings `https://gfgxbvcoe.onrender.com/` every 10 minutes.
- The public live site is configured in GitHub metadata as [https://gfg-bvcoe.com](https://gfg-bvcoe.com).

## Contributing

1. Fork the repository.
2. Create a branch:

```bash
git checkout -b feature/your-feature
```

3. Install frontend and backend dependencies.
4. Add local `.env` files.
5. Keep changes scoped to the relevant feature area.
6. Run a frontend build before opening a PR:

```bash
npm run build
```

7. Commit with a clear message and open a pull request.

### Code Style Notes

- Keep public pages in `src/pages`.
- Keep reusable components in `src/components`.
- Keep API functions centralized in `src/services/api.js`.
- Keep backend routes thin and business logic in controllers.
- Use middleware guards for protected backend routes.
- Do not commit production secrets, local `.env` files, `node_modules`, or build artifacts.

## License

This project is proprietary and is provided for portfolio and demonstration purposes only.

Copyright © 2026 Dev Malik and GeeksforGeeks BVCOE.

Unauthorized copying, modification, distribution, or commercial use of this software is prohibited. See the [LICENSE](./LICENSE) file for details.
