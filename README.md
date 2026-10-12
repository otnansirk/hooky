# Hooky

Hooky is an open-source platform for catching, inspecting, and debugging HTTP requests and webhooks in real-time. Built as a self-hostable alternative to webhook.site, it lets you test webhook integrations locally or in production.

---

## Features

- **Instant URL Generation**: Get a unique webhook endpoint immediately when visiting the app.
- **Catch All HTTP Methods**: Captures GET, POST, PUT, PATCH, DELETE, OPTIONS, and HEAD requests.
- **Real-Time Stream**: Inspect incoming requests live without manual refreshing, powered by Server-Sent Events (SSE).
- **Deep Inspection**: View parsed headers, query parameters, formatted JSON bodies, raw payloads, origin IP, and timestamps.
- **cURL Replay**: Copy a complete cURL command with all headers and body payloads to replay requests directly from your terminal.
- **Persistent Storage**: Built-in SQLite database managed with Drizzle ORM and WAL mode for reliable concurrency.
- **Ready for Self-Hosting**: Multi-stage Docker image and Docker Compose setup included.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & ORM**: [Drizzle ORM](https://orm.drizzle.team/) with SQLite (`better-sqlite3`)
- **Real-Time**: Server-Sent Events (SSE) via native Node.js event emitter

---

## Quick Start

### Prerequisites
- Node.js 20 or higher
- pnpm (or npm / yarn)

### 1. Local Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/hooky.git
cd hooky
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You will be redirected to an active inspector session.

### 2. Run with Docker (Self-Hosting)

Run Hooky in a container with persistent SQLite storage:

```bash
docker compose up -d
```

Access the dashboard at [http://localhost:3000](http://localhost:3000). Data is persisted locally in the `./data` directory.

To stop the container:
```bash
docker compose down
```

### 3. Production Node.js Server

```bash
pnpm build
node .next/standalone/server.js
```

---

## Sending Test Webhooks

Once Hooky is running, send a test payload using cURL:

```bash
# Replace <YOUR_ENDPOINT_ID> with the ID from your dashboard
curl -X POST "http://localhost:3000/e/<YOUR_ENDPOINT_ID>" \
  -H "Content-Type: application/json" \
  -d '{"event": "payment.succeeded", "amount": 250000, "customer": "Dev Community"}'
```

The request will show up on your dashboard instantly.

---

## Running Tests

Run the end-to-end test suite:

```bash
pnpm test:e2e
```

---

## Contributing

Contributions from the open-source community are welcome!
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/my-new-feature`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature/my-new-feature`).
5. Open a Pull Request.

Please adhere to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

---

## Code of Conduct

This project follows the [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating in this project, you agree to uphold this code.

---

## License

This project is licensed under the [MIT License](LICENSE).
