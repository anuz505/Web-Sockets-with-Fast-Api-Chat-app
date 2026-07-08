# E2E suite rewrite — what changed and why

This documents the rewrite of `client/E2E/`, done after a code review surfaced several
blocking issues: CI could never pass, one test had no assertion, two spec files were
empty (0 bytes) despite page objects existing for them, and a cross-file dependency on
a shared hardcoded user forced the suite to run single-threaded. The rewrite fixes those
and, along the way, the new/fixed tests caught real product bugs that had nothing to do
with test code (see [App bugs found by the new tests](#app-bugs-found-by-the-new-tests)).

## Design decisions

### 1. API setup, UI only for the page under test

Before: every multi-user spec (`discover`, `chat`) registered and logged in both users
by filling out the actual registration and login forms in the browser, every run.

After: `tests/helpers/e2e-flow.js` exposes `apiRegister`, `apiLogin`,
`apiRegisterAndLogin`, `apiSendFriendRequest`, `apiAcceptFriendRequest`,
`apiRemoveFriend` — all built on Playwright's `APIRequestContext` (`page.request` or the
standalone `request` fixture), calling the backend directly.

**Why:** registration and login already have their own dedicated specs
(`register.spec.js`, `login.spec.js`). Re-driving those forms inside a chat or
friends-list test doesn't add coverage — registration is already tested — it only adds
run time and unrelated failure surface (a chat test failing because the register page
broke is a confusing signal). Setup should be the fastest reliable path to the state a
test needs; the UI should only be touched for the thing the test is actually about.

**How it works:** `page.request` shares cookie storage with its browsing context, so
`apiLogin(page.request, user)` sets the real `refresh_token` httponly cookie the app
uses. The next `page.goto(...)` triggers the SPA's normal boot sequence
(`main.tsx` → `checkAuth()` → `POST /auth/refresh` using that cookie → Redux gets a real
access token) — so the app is authenticated exactly the way a real login would leave it,
without ever rendering the login form. Friend-request/accept endpoints require a Bearer
token (not the cookie), so `apiRegisterAndLogin` also captures and returns the
`access_token` from the login response for those calls.

A standalone `request` fixture (its own isolated cookie jar, no browser page) is used
for actors that never need a browser at all — e.g. the friend-request *sender* in
`requests.spec.js`, who only ever calls the API.

### 2. One shared fixture user via a real Playwright "setup project"

Before: `login.spec.js` and `homepage.spec.js` depended on a user named `pam` that only
existed because `register.spec.js` happened to register it first. Run any one file in
isolation, or reorder/parallelize the suite, and that assumption breaks.
`tests/auth.setup.js` existed but didn't match Playwright's default `testMatch` pattern
(`*.spec.*`) and wasn't declared as a project — it never actually ran.

After: `playwright.config.js` declares a `setup` project (`testMatch: /.*\.setup\.js/`)
that the `chromium` project depends on (`dependencies: ['setup']`). Playwright runs the
setup project to completion before any dependent test starts, regardless of worker
count. `tests/auth.setup.js` seeds one fixture user (`LOGIN_FIXTURE_USER` in
`test-data/users.js`) via the API and saves `storageState` to `.auth/login-fixture.json`.

**Why:** this makes "the fixture user exists" a guarantee, not a side effect of file
execution order — the suite is now safe to run with more than one worker, and any spec
file can be run alone.

### 3. `storageState` for "already logged in", real login for "test the login form"

`homepage.spec.js`'s authenticated-nav tests use
`test.use({ storageState: '.auth/login-fixture.json' })` — they don't care *how* the
session was created, only that nav links work when logged in, so they skip the login UI
entirely. `login.spec.js` still logs in through the actual form on every test, because
that form is what it's testing. This also let us delete the `mode: 'serial'` workaround
in `homepage.spec.js`: each worker loads its own context from the same storageState
file, so there's no shared runtime login to race.

### 4. Dynamic per-test users for multi-user flows

`createUserPair(prefix)` / `buildUser(prefix)` (`test-data/users.js`) generate a unique
username per test run (`Date.now()` + random suffix). Each multi-user spec creates its
own throwaway pair instead of touching shared fixture data, so tests are independent and
parallel-safe, and re-running the suite against the same (persistent, non-reset)
database never collides with a previous run's data.

### 5. `test.step()` for every multi-phase flow

Every spec with more than one logical phase (seed → act → assert) wraps each phase in
`test.step(...)`. This costs nothing and means a trace/report shows *which named phase*
was still running when something failed, instead of one flat stack trace — this is
exactly what would have made diagnosing today's earlier `discover.spec.js` failure
faster.

### 6. Config and CI

- `playwright.config.js`: `trace: 'retain-on-failure'` and `screenshot`/`video` on
  failure by default (previously `trace: 'on-first-retry'` with `retries: 0` locally
  meant a local failure captured nothing — you had to know to edit the config to debug).
  `globalSetup.js` pings `baseURL` before any test runs and throws a clear
  "start the app stack first" error instead of every test individually timing out with
  a confusing connection-refused failure.
- CI workflow moved from `client/E2E/.github/workflows/playwright.yml` to
  `.github/workflows/playwright.yml` at the repo root — GitHub Actions only scans
  workflows at the repo root, so the old location meant **this pipeline never ran at
  all**, on any push or PR. The new workflow explicitly boots the stack
  (`docker compose up -d --wait`), waits for the frontend/nginx to actually respond,
  then runs the tests from `client/E2E` via `working-directory`.
- `workers` bumped from a hardcoded `1` in CI to `4`: the old value was a workaround for
  the shared-fixture-user race described above; now that state is isolated per test,
  more parallelism is safe (kept well under nginx's `30r/s` rate limit as a ceiling).

## What each spec file does now

| File | Tests | Setup approach | Notes |
|---|---|---|---|
| `homepage.spec.js` | Home page nav for both logged-out and logged-in users; rotating quote text changes over time | None (logged-out) / `storageState` (logged-in) | Logged-in block no longer needs `mode: 'serial'`. Rotating-quote test uses `expect(...).toPass()` instead of a hand-rolled `while` + `Date.now()` polling loop. |
| `login.spec.js` | Wrong username, wrong password, empty-field native validation, valid login | Uses `LOGIN_FIXTURE_USER` directly (needs the account to exist, not to be pre-authenticated) | No longer depends on `register.spec.js` having run first. |
| `register.spec.js` | Sequential required-field validation, invalid-input messages, successful registration, duplicate-username rejection | Fresh `buildUser()` per test | Replaced the old bulk `users.forEach` loop, which asserted nothing and would fail to register the same static usernames twice against a persistent DB. Added a real duplicate-registration test (the old file had a comment saying this was intended but never implemented). |
| `discover.spec.js` | Sending a friend request removes that user from the discover list | API: register B (no login needed, they just need to exist), register+login A | Single browser context — B never needs a session for this test, only an account, so there's no need for a second context. |
| `requests.spec.js` (was empty) | Accepting a request removes it from the list; rejecting a request removes it from the list | API: sender (A) via standalone `request` fixture (no browser needed), recipient (B) via `page` | Previously 0 bytes — zero coverage for this page despite `RequestsPage.js` existing. Also the first place `RequestsPage.rejectRequest()` is actually called anywhere in the suite. |
| `friends.spec.js` (was empty) | An accepted friend appears in both users' friends lists | API: register+login both, send+accept request, all via API | Previously 0 bytes. Two contexts, since both sides need to independently view their own friends list. |
| `chat.spec.js` | A message sent by A is visible to both A and B in real time | API: register+login both, send+accept request, all via API | Trimmed from ~8 behaviors (register, login, friend request, accept, friends-list check, chat nav, message send/receive) down to one — the friend relationship is a precondition, not what this test is about. |

## Page object fix

`page-objects/ChatPage.js`'s `goTo()` used try/catch as UI-state branching: it waited
out a full 10s timeout for `"Start a Chat"` (only present in the empty-conversations
state) before falling back to check for the `"Messages"` heading. Whenever a user
already had conversations — which is every repeat run against the same test account —
this method paid that 10s tax for nothing. Replaced with a `.or()` locator race, which
resolves to whichever state locator actually appears instead of waiting for one to fail
first.

## App bugs found by the new tests

Writing/fixing real tests for pages that previously had none or were untested surfaced
two genuine product bugs, not test-code issues:

1. **Missing `data-testid` attributes.** `PeopleYouMayKnow.tsx`, `FriendRequests.tsx`,
   `MyFriends.tsx`, `Home.tsx`, and `Conversation.tsx` were all missing `data-testid`
   attributes that the page objects had assumed existed (`user-card`,
   `friend-request-card`, `friend-card`, `rotating-quote`, `chat-friend-item`,
   `chat-conversation-item`, `chat-partner-name`, `chat-message-input`,
   `chat-send-button`, `chat-message`). Every one of these manifested the same way: a
   `waitForSelector`/`toBeVisible()` call that hangs until Playwright's default test
   timeout tears down the browser context, surfacing as a confusing
   "Target page, context or browser has been closed" error instead of a normal
   "element not found" message. Added the missing attributes to all five components.

2. **`vite.config.ts` dev-proxy route collision with `/friends`.** The dev server
   proxies the path *prefix* `/friends` to the backend — but `/friends` is also the
   SPA's own client-side route for the Friends page. A hard navigation (typed URL, page
   refresh, or Playwright's `page.goto('/friends')`) never reaches the SPA at all: Vite's
   proxy intercepts it and forwards straight to the backend, which has no route for bare
   `/friends` (only `/friends/allfriends`, `/friends/peopleyoumayknow`, etc.), so it
   404s with a raw `{"detail":"Not Found"}` body instead of rendering the page. This is a
   real bug for actual users too (anyone refreshing or opening a bookmarked/shared link
   to `/friends`), not just a test artifact — it had simply never been caught because
   `friends.spec.js` was empty. Fixed by narrowing the proxy match to the regex
   `^/friends/.+` (Vite treats a `^`-prefixed key as a RegExp), so only real API calls
   are proxied and the bare page route falls through to the SPA.

## Hygiene fixes

- `.auth/` (where `auth.setup.js` writes storageState files containing live session
  cookies) was not covered by `.gitignore` — only `/playwright/.auth/` was, a different
  path. Added `/.auth/` to `client/E2E/.gitignore`.
- Added `test`, `test:headed`, `test:ui`, `report` scripts to `client/E2E/package.json`
  (previously `"scripts": {}`).
