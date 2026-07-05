import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import { LoginPage } from '../page-objects/LoginPage.js';
import { testUsers, users } from '../test-data/users.js';

const allUsers = [
    ...users,
    ...Object.values(testUsers).flatMap(pair => Object.values(pair)),
];

for (const user of allUsers) {
    setup(`authenticate ${user.username}`, async ({ page }) => {
        fs.mkdirSync('.auth', { recursive: true });

        const registerResponse = await page.request.post('/auth/register', {
            data: user,
        });

        if (!registerResponse.ok() && registerResponse.status() !== 400) {
            throw new Error(`Failed to prepare user ${user.username}`);
        }

        const loginPage = new LoginPage(page);
        await loginPage.goTo();
        await loginPage.login(user);
        await expect(page).toHaveURL(/\/chat/);

        await page.context().storageState({ path: `.auth/${user.username}.json` });
    });
}