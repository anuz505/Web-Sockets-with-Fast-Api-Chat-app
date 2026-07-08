# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Real-time chat app: FastAPI (WebSockets + REST) backend, React 19 + TypeScript frontend, PostgreSQL, Redis pub/sub, horizontally scaled behind an NGINX load balancer (3 backend instances). See `readme.md` for the intended architecture diagrams and feature list, but treat its "API Endpoints" section as aspirational, not accurate — the real routes are documented below and sometimes differ (e.g. friend request is `POST /friends/send_friend_request` with body `{id}`, not `/friends/request`).

## Commands

### Docker (primary way to run everything)

```bash
docker-compose up -d          # starts postgres, redis, backend1/2/3, nginx, frontend
docker-compose logs -f <service>   # e.g. backend1, nginx, frontend
docker-compose up -d --build <service>   # rebuild after dependency/Dockerfile changes
```

Services/ports: frontend `5173`, nginx `8080` (fronts backend1-3 internally on `8000`, exposed individually as `4001-4003`), postgres `5432`, redis `6379`. The frontend container bind-mounts `./client` and the backend3 container bind-mounts `./app` (not `./server/app` — check that mount if editing backend3-specific behavior), so most source edits are picked up live via volume + `--reload`/vite HMR; changes to `requirements.txt`, `package.json`, or Dockerfiles need a rebuild.

### Backend (server/app), without Docker

```bash
cd server/app
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Must run from `server/app` (or set `PYTHONPATH=server/app`) — imports throughout the backend are unqualified (`from api.auth import ...`, `from core.config import ...`), not `from app.api...`. This matches how the Dockerfile copies `server/app/` contents directly into `/app` and sets `PYTHONPATH=/app`.

Config is via `server/app/core/config.py` (pydantic-settings), reading a `.env` file — needs at minimum `secret_key`; DB/Redis defaults assume Docker service hostnames (`postgres`, `redis`) unless overridden.

### Frontend (client)

```bash
cd client
npm install
npm run dev        # vite dev server on :5173
npm run build       # tsc -b && vite build
npm run lint         # eslint .
```

`vite.config.ts` proxies `/auth`, `/friends`, `/messages`, `/ws` to `http://nginx:8080` — this only resolves when running inside the Docker network (service name `nginx`). Running `npm run dev` outside Docker against a Dockerized backend requires adjusting that proxy target (e.g. `localhost:8080`).

### E2E tests (client/E2E — separate Playwright project, own package.json)

```bash
cd client/E2E
npx playwright test                          # full suite (needs frontend+backend actually running, e.g. via docker-compose up -d)
npx playwright test tests/discover.spec.js   # single file
npx playwright test tests/discover.spec.js:12  # single test by line number
npx playwright test --headed                 # watch it run in a real browser
npx playwright show-trace test-results/.../trace.zip   # inspect a failure (trace only captured `on-first-retry` locally, `retries: 0` locally so set trace:'on' temporarily to capture on first failure)
```

No `webServer` is configured in `playwright.config.js` — the app stack must already be up (`docker-compose up -d`) before running tests. `baseURL` is `http://localhost:5173`. CI (`.github/workflows/playwright.yml`) runs `npx playwright install --with-deps && npx playwright test` on push/PR to main/master.

## Architecture

### Topology

```
Browser → nginx:8080 (load balancer, rate-limited 30r/s) → backend1|2|3:8000 → postgres / redis
Vite dev server:5173 proxies /auth, /friends, /messages, /ws → nginx:8080
```

All three backend instances are identical FastAPI processes; horizontal scaling works because per-user WebSocket state lives in each instance's in-memory `ConnectionManager` (`server/app/core/websocket_engine.py`), and cross-instance delivery goes through Redis pub/sub: each instance subscribes to a `user:{id}` channel on that user's connect, and message delivery tries local delivery first, falling back to publishing on the recipient's channel so whichever instance holds their socket picks it up (`server/app/core/redis_service.py`, `server/app/api/websocket.py`).

### Backend structure (`server/app/`)

- `main.py` — FastAPI app, CORS, lifespan (creates DB if missing, runs `init_db()`, connects Redis + starts the pub/sub listener task), mounts routers with no prefix beyond each router's own (`/auth`, `/friends`, `/messages`, plus the bare `/ws`).
- `api/auth.py` — register/login/refresh/logout/me. Access tokens are short-lived JWTs returned in the response body; refresh tokens are separate longer-lived JWTs set as an `httponly` cookie (`refresh_token`) and rotated on every `/auth/refresh` call.
- `api/friends.py` — friendships modeled as a single `friendships` table with a `status` enum (`none|pending|accepted|blocked`) and directional `user_id`→`friend_id` rows; queries have to check both directions. `peopleyoumayknow` is "all users with no friendship row in either direction."
- `api/message.py`, `api/websocket.py` — REST history/conversations list vs. live delivery over WS. WS auth is not header-based: the client must send `{"type": "auth", "content": "<jwt>"}` as the *first* message within 10s of connecting, or the server closes the socket.
- `db/database.py` — raw SQL via the `databases` library (no ORM); `init_db()` runs `CREATE TABLE IF NOT EXISTS` for `users`, `messages`, `friendships`, `conversations` on every startup.

### Frontend structure (`client/src/`)

- Routing (`App.tsx`): public `/`, `/login`, `/register`; everything else (`/chat`, `/friends`, `/discover`, `/friend-requests`, `/profile`) behind `ProtectedRoute`, which just checks `state.auth.isAuthenticated` from Redux.
- Auth (`store/auth-slice/index.ts`): Redux Toolkit holds the in-memory access token; there is **no global axios interceptor** — every API call in `api/*.ts` manually reads `store.getState().auth.token` and sets the `Authorization` header itself. On app boot (`main.tsx`) `checkAuth()` always fires, which calls `/auth/refresh` first if no token is in memory (relying on the httponly cookie) — this is why a fresh page load always shows a `/auth/refresh` call in the network logs even on `/login` or `/register`.
- Server state (friends lists, people-you-may-know, conversations) is fetched via React Query (`@tanstack/react-query`), not Redux.
- `hooks/Websocket.ts` — the single WebSocket connection lifecycle: connects once an access token exists, sends the `auth` message, pings every 30s, and auto-reconnects on unexpected close (unless close code `1000`), including a refresh-and-reconnect path if the server reports the token expired.

### E2E structure (`client/E2E/`)

Page-object model: `page-objects/*.js` wrap locators/actions per page. `tests/helpers/e2e-flow.js` holds API-driven setup helpers (`apiRegister`, `apiLogin`, `apiSendFriendRequest`, `apiAcceptFriendRequest`, `apiRemoveFriend`) built on Playwright's `APIRequestContext` — use these to get a test into an authenticated/friended state without touching the registration, login, discover, or friend-requests UI, since each of those pages already has its own dedicated spec. Only drive the UI for the page a given spec is actually testing.

`tests/auth.setup.js` is a real Playwright **setup project** (see `dependencies: ['setup']` in `playwright.config.js`), not an ordinary spec — it registers/logs in a single shared fixture user (`LOGIN_FIXTURE_USER` in `test-data/users.js`) once per run and saves `storageState` to `.auth/login-fixture.json` (gitignored — it holds live session cookies). Specs that need to *be* logged in without testing the login form itself consume that via `test.use({ storageState: '.auth/login-fixture.json' })`; `login.spec.js` uses the same fixture user directly (not via storageState) since it's exercising the login form. Specs needing two concurrent independent sessions (`chat.spec.js`, `friends.spec.js`) generate fresh per-test users via `createUserPair()`/`buildUser()` instead of sharing fixture data, so nothing depends on another spec file having run first, and the suite is safe to run with multiple workers.

Locators rely on `data-testid` attributes that must exist on the actual React components — it's easy to add a page-object locator without adding the matching attribute in the component, which manifests as a hung `waitForSelector` that only surfaces as "Target page, context or browser has been closed" once Playwright's default test timeout tears down the context (not a clear timeout message), rather than a normal locator-timeout error.
