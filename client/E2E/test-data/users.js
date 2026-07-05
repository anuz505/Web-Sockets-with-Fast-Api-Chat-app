function uniqueSuffix() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildUser(prefix) {
  const username = `${prefix}-${uniqueSuffix()}`;
  return {
    username,
    email: `${username}@example.com`,
    password: 'ValidPass12@3#',
  };
}

export function createUserPair(prefix) {
  return {
    userA: buildUser(`${prefix}-a`),
    userB: buildUser(`${prefix}-b`),
  };
}

// Long-lived fixture user. Seeded once by tests/auth.setup.js (the Playwright
// "setup" project — see playwright.config.js's `dependencies`) and reused via
// storageState by specs that need an already-authenticated session (e.g.
// homepage.spec.js's "authenticated user" tests) without going through the
// login form. login.spec.js uses it directly (not via storageState) because
// it needs the account to exist, not to already be logged in — it's testing
// the login form itself.
export const LOGIN_FIXTURE_USER = {
  username: 'e2e-login-fixture',
  email: 'e2e-login-fixture@example.com',
  password: 'ValidPass12@3#',
};
