import { test, expect } from '@playwright/test';
import { DiscoverPage } from '../page-objects/DiscoverPage.js';
import {
  createUserPair,
  registerUser,
  loginUser,
  sendRequest,
  acceptRequest,
} from './helpers/e2e-flow.js';

test.describe('Discover Page', () => {
  test('user A discovers user B and sends a friend request', async ({ browser }) => {
    const { userA, userB } = createUserPair();

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      await registerUser(pageA, userA);
      await registerUser(pageB, userB);

      await loginUser(pageA, userA);
      await loginUser(pageB, userB);

      await sendRequest(pageA, userB.username);

      const discoverPage = new DiscoverPage(pageA);
      await discoverPage.goTo();
      await expect(discoverPage.getUserCard(userB.username)).toHaveCount(0);

      await acceptRequest(pageB, userA.username);
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

});
