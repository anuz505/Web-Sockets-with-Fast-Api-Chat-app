import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage.js';

test.describe('Login Page', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goTo();
  });

    test('invalid user login', async ({page}) => {  

        await loginPage.login({username: 'invalidUser', password:'invalidPassword'});

        await expect(page.getByText('user does not exist')).toBeVisible();
    });

    test('invalid password login', async ({page}) => {
        await loginPage.login({username: 'pam', password:'invalidPassword'});

        await expect(page.getByText('wrong password')).toBeVisible();
    });

    test('empty fields login', async ({}) => {
        await loginPage.submit();

        await expect(loginPage.userNameInput).toHaveJSProperty('validationMessage','Please fill out this field.');
        
        await loginPage.fillUsername('pam');
        await loginPage.submit();

        await expect(loginPage.passwordInput).toHaveJSProperty('validationMessage','Please fill out this field.');
    });

    test('valid user login', async ({page}) => {
        await loginPage.login({username: 'pam', password:'ValidPass12@3#'});

        await expect(page).toHaveURL(/chat/);
    });
});
