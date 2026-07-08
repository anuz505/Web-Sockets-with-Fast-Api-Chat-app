import { test, expect } from '@playwright/test';
import { RegisterPage } from '../page-objects/RegisterPage.js';
import { users } from '../test-data/users.js';

test.describe('Register Page', () => {
  let registerPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goTo();
  });

  test('validate required fields sequentially', async () => {

    await registerPage.submit();

    await expect(registerPage.userNameInput).toHaveJSProperty('validationMessage','Please fill out this field.');

    await registerPage.fillUsername('Rhea');
    await registerPage.submit();

    await expect(registerPage.emailInput).toHaveJSProperty('validationMessage','Please fill out this field.');

    await registerPage.fillEmail('rhea@gmail.com');
    await registerPage.submit();

    await expect(registerPage.passwordInput).toHaveJSProperty('validationMessage','Please fill out this field.');
});


  test('show validation message for invalid inputs', async ({page}) => {
    await registerPage.register({username: 'a', email: 'invalid@email', password: 'short'});

    await expect(page.getByText('Username must be at least 3 characters')).toBeVisible();
    await expect(page.getByText('Email is invalid')).toBeVisible();
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
  });

  test.describe.configure({
    mode: 'serial'
  });

   users.forEach(user => {

    test(`register ${user.username}`, async ({ page }) => {

        const registerPage = new RegisterPage(page);

        await registerPage.goTo();
        await registerPage.register(user);

        const loginURL = page.url().includes('/login');

        if (loginURL) {
            console.log(`${user.username} registered successfully`);
        } else {
            console.log(`${user.username} registration failed`);
            console.log(await page.content());
        }
    });

    //duplicate test for the same user to check for duplicate registration
});

});
