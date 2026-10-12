# Implementation Plan - Hooky

This document outlines the step-by-step execution plan to build and deploy Hooky.

## Phase 1: Project Initialization & Setup
- [x] **1.1 Scaffold the Project:** Initialize the core framework (Next.js or Nuxt 3).
- [x] **1.2 Styling Setup:** Install and configure TailwindCSS and UI components (e.g., shadcn/ui or simple custom Tailwind).
- [x] **1.3 Database Setup:** Install Drizzle ORM and configure database clients for both environments:
  - Local: `better-sqlite3` or `libsql` for development and Docker.
  - Cloud: Cloudflare D1 for the production SaaS.

## Phase 2: Database Schema & Core API
- [x] **2.1 Schema Definition:** Define Drizzle schemas for `endpoints` and `requests`.
- [x] **2.2 Migrations:** Generate and run the initial database migrations.
- [x] **2.3 URL Generation API:** Create an endpoint (`POST /api/endpoints`) to generate a unique webhook ID upon user visit.
- [x] **2.4 The Catcher API:** Create a wildcard API route (`/e/[id]`) that accepts ALL HTTP methods. It will extract headers, query parameters, and the payload body, then save them to the database.

## Phase 3: Frontend & Real-Time Dashboard
- [x] **3.1 Landing Page:** Build the home page with a clear Call-to-Action (CTA) to generate a new webhook URL instantly.
- [x] **3.2 Dashboard UI:** Build the inspector layout:
  - Sidebar: List of incoming requests (Method + Time).
  - Main Panel: Detailed view of the selected request (Headers, Query, Body, Raw data).
- [x] **3.3 Real-Time Implementation:** Implement Server-Sent Events (SSE) or an optimized polling mechanism so the dashboard updates automatically without refreshing when a new webhook hits the Catcher API.

## Phase 4: Docker & Self-Hosting Readiness
- [x] **4.1 Dockerfile:** Write a multi-stage `Dockerfile` to build and run the application using Node.js for self-hosting.
- [x] **4.2 Docker Compose:** Create a `docker-compose.yml` file to easily spin up the app with a persistent volume for the local SQLite database.
- [x] **4.3 Environment Variables:** Document the required `.env` variables for self-hosting.

## Phase 5: Cloudflare Deployment (SaaS Version)
- [ ] **5.1 Cloudflare Setup:** Initialize Wrangler (`wrangler.toml`).
- [ ] **5.2 D1 Binding:** Create a D1 database on Cloudflare and bind it to the project configuration.
- [ ] **5.3 Deployment:** Deploy the application to Cloudflare Pages/Workers.
- [ ] **5.4 Testing:** Perform end-to-end testing on the live URL to ensure 0ms cold starts and real-time features work perfectly on the Edge network.
