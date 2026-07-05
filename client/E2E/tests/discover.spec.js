import { test, expect } from '@playwright/test';
import { createUserPair } from '../test-data/users.js';
import { apiRegister, apiRegisterAndLogin, apiRemoveFriend } from './helpers/e2e-flow.js';
import { DiscoverPage } from '../page-objects/DiscoverPage.js';

test.describe('Discover page', () => {
  test('sending a friend request removes that user from the discover list', async ({ page, request }) => {
    const { userA, userB } = createUserPair('discover');

    // User B just needs to exist to show up in A's suggestions — no browser
    // session required for that, so a plain API actor is enough.
    const createdUserB = await apiRegister(request, userB);
    const { token } = await apiRegisterAndLogin(page.request, userA);

    const discoverPage = new DiscoverPage(page);

    try {
      await test.step('user B is visible on the discover page', async () => {
        await discoverPage.goTo();
        await expect(discoverPage.getUserCard(userB.username)).toBeVisible();
      });

      await test.step('sending a request removes user B from the list', async () => {
        await discoverPage.addFriend(userB.username);
        await expect(discoverPage.getUserCard(userB.username)).toHaveCount(0);
      });
    } finally {
      await apiRemoveFriend(page.request, token, createdUserB.id);
    }
  });
});
