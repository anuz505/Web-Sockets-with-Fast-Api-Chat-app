import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage.js';
import { LOGIN_FIXTURE_USER } from '../test-data/users.js';

test.describe('Login page', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goTo();
  });

  test('rejects a username that does not exist', async ({ page }) => {
    await loginPage.login({ username: 'no-such-user', password: 'whatever-Pass1' });

    await expect(page.getByText('user does not exist')).toBeVisible();
  });

  test('rejects the wrong password for an existing user', async ({ page }) => {
    await loginPage.login({ username: LOGIN_FIXTURE_USER.username, password: 'wrong-password' });

    await expect(page.getByText('wrong password')).toBeVisible();
  });

  test('rejects empty fields via native validation', async () => {
    await loginPage.submit();
    await expect(loginPage.userNameInput).toHaveJSProperty(
      'validationMessage',
      'Please fill out this field.'
    );

    await loginPage.fillUsername(LOGIN_FIXTURE_USER.username);
    await loginPage.submit();
    await expect(loginPage.passwordInput).toHaveJSProperty(
      'validationMessage',
      'Please fill out this field.'
    );
  });

  test('logs in with valid credentials', async ({ page }) => {
    await loginPage.login(LOGIN_FIXTURE_USER);

    await expect(page).toHaveURL(/\/chat/);
  });
});
