# Product Requirements Document (PRD) - Hooky

## 1. Project Overview
**Project Name:** Hooky
**Description:** An open-source platform for catching, inspecting, and debugging HTTP requests and webhooks in real-time. Hooky is designed to be an alternative to `webhook.site`, featuring the ability to be deployed serverless (for free) or easily self-hosted.

## 2. Goals & Target Audience
*   **Target Audience:** Software Engineers, Backend Developers, and API Integrators who need a tool to inspect webhook payloads or HTTP requests.
*   **Goals:**
    *   Provide an instant UI (users get a unique URL immediately upon visiting the page).
    *   High performance with 0ms cold starts (ensuring no missed or timed-out webhooks).
    *   100% free to deploy (maximizing the Cloudflare ecosystem).
    *   Seamless self-hosting support via Docker.

## 3. Tech Stack & Architecture
Hooky uses a Universal Architecture approach so that a single codebase can run in two different environments (Edge Serverless & Node.js Docker).

### 3.1. SaaS / Public Environment (Primary)
*   **Hosting:** Cloudflare Pages (Frontend) & Cloudflare Workers (API/Backend)
*   **Database:** Cloudflare D1 (Serverless SQLite)
*   **Real-time:** Cloudflare Native WebSockets or Server-Sent Events (SSE)
*   **ORM:** Drizzle ORM

### 3.2. Self-Hosted Environment
*   **Hosting:** Docker & Docker Compose (Node.js runtime)
*   **Database:** Pure SQLite (`better-sqlite3` or `libSQL`) via Docker Volumes
*   **Real-time:** SSE / Smart Polling / Local WebSocket
*   **ORM:** Drizzle ORM

### 3.3. Core Framework
*   **Frontend & API:** Nuxt 3 (using the Nitro engine which is highly compatible with Cloudflare) or Next.js (Edge Runtime).
*   **Styling:** TailwindCSS

## 4. Core Features (MVP)
1.  **Instant URL Generation:**
    *   The system automatically generates a UUID/Short-ID (e.g., `hooky.com/e/a1b2c3d4`) when a user visits the landing page.
2.  **Request Catcher (Endpoint):**
    *   Captures ALL HTTP Methods (GET, POST, PUT, PATCH, DELETE, etc.).
    *   Stores and displays:
        *   Headers
        *   Query Parameters
        *   Body / Payload (JSON, Form Data, Raw Text)
        *   IP Address Origin & Timestamp
3.  **Real-time Dashboard:**
    *   The UI automatically updates the list of incoming requests without requiring a page refresh.
4.  **History & Persistence (Optional for MVP):**
    *   Keeps a history up to a certain limit (e.g., last 100 requests per endpoint).
    *   Data is automatically purged (TTL / Time To Live) after X days.

## 5. Database Schema (Draft)

**Table: `endpoints`**
*   `id` (String/UUID, Primary Key) - The unique URL identifier
*   `created_at` (Timestamp)
*   `last_active` (Timestamp)

**Table: `requests`**
*   `id` (String/UUID, Primary Key)
*   `endpoint_id` (String/UUID, Foreign Key)
*   `method` (String) - GET, POST, etc.
*   `headers` (JSON)
*   `query_params` (JSON)
*   `body` (Text/JSON)
*   `created_at` (Timestamp)

## 6. Deployment Strategy
*   The system will use environment variables to differentiate execution modes:
    *   When deployed to Cloudflare, the ORM connects to the D1 binding.
    *   When deployed via Docker, the ORM connects to a local `.sqlite` file path.

## 7. Future Enhancements (Post-MVP)
*   **Custom Status Codes:** Users can configure their URLs to respond with specific HTTP status codes (200, 400, 500, etc.) for testing.
*   **Custom Response Body:** Users can set a mock response (static JSON) to be returned when the webhook is called.
*   **Webhooks Forwarding:** Forward incoming webhooks to an internal local URL (localhost) using a CLI tool (similar to ngrok).
