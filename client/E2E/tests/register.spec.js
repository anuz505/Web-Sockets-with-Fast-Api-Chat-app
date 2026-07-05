import { test, expect } from '@playwright/test';
import { RegisterPage } from '../page-objects/RegisterPage.js';
import { buildUser } from '../test-data/users.js';

test.describe('Register page', () => {
  let registerPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goTo();
  });

  test('validates required fields sequentially', async () => {
    await registerPage.submit();
    await expect(registerPage.userNameInput).toHaveJSProperty(
      'validationMessage',
      'Please fill out this field.'
    );

    await registerPage.fillUsername('Rhea');
    await registerPage.submit();
    await expect(registerPage.emailInput).toHaveJSProperty(
      'validationMessage',
      'Please fill out this field.'
    );

    await registerPage.fillEmail('rhea@gmail.com');
    await registerPage.submit();
    await expect(registerPage.passwordInput).toHaveJSProperty(
      'validationMessage',
      'Please fill out this field.'
    );
  });

  test('shows validation messages for invalid inputs', async ({ page }) => {
    await registerPage.register({ username: 'a', email: 'invalid@email', password: 'short' });

    await expect(page.getByText('Username must be at least 3 characters')).toBeVisible();
    await expect(page.getByText('Email is invalid')).toBeVisible();
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
  });

  test('registering with a new username and email redirects to login', async ({ page }) => {
    const user = buildUser('register-new');

    await registerPage.register(user);

    await expect(page).toHaveURL(/\/login/);
  });

  test('registering with an already-used username is rejected', async ({ page }) => {
    const user = buildUser('register-dup');

    await registerPage.register(user);
    await expect(page).toHaveURL(/\/login/);

    await registerPage.goTo();
    await registerPage.register(user);

    await expect(page.getByText(/already exists/i)).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });
});
