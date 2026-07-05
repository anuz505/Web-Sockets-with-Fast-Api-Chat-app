import { test as setup } from '@playwright/test';
import { LOGIN_FIXTURE_USER } from '../test-data/users.js';

setup('seed the shared login fixture user', async ({ page }) => {
  const registerResponse = await page.request.post('/auth/register', {
    data: LOGIN_FIXTURE_USER,
  });
  if (!registerResponse.ok() && registerResponse.status() !== 400) {
    throw new Error(
      `Failed to seed fixture user: ${registerResponse.status()} ${await registerResponse.text()}`
    );
  }

  const loginResponse = await page.request.post('/auth/token', {
    form: {
      username: LOGIN_FIXTURE_USER.username,
      password: LOGIN_FIXTURE_USER.password,
    },
  });
  if (!loginResponse.ok()) {
    throw new Error(
      `Failed to log in fixture user: ${loginResponse.status()} ${await loginResponse.text()}`
    );
  }

  // Persists the refresh_token cookie so specs can `test.use({ storageState })`
  // and skip the login UI entirely for scenarios that don't test login itself.
  await page.context().storageState({ path: '.auth/login-fixture.json' });
});
