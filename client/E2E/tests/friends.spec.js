import { test, expect } from '@playwright/test';
import { createUserPair } from '../test-data/users.js';
import {
  apiRegisterAndLogin,
  apiSendFriendRequest,
  apiAcceptFriendRequest,
  apiRemoveFriend,
} from './helpers/e2e-flow.js';
import { FriendsPage } from '../page-objects/FriendsPage.js';

test.describe('Friends page', () => {
  test("an accepted friend appears in both users' friends lists", async ({ browser }) => {
    const { userA, userB } = createUserPair('friends');

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    let userAAuth, userBAuth;

    try {
      userAAuth = await apiRegisterAndLogin(pageA.request, userA);
      userBAuth = await apiRegisterAndLogin(pageB.request, userB);

      await test.step('user A sends and user B accepts a friend request', async () => {
        await apiSendFriendRequest(pageA.request, userAAuth.token, userBAuth.id);
        await apiAcceptFriendRequest(pageB.request, userBAuth.token, userAAuth.id);
      });

      await test.step("user B appears in user A's friends list", async () => {
        const friendsPageA = new FriendsPage(pageA);
        await friendsPageA.goTo();
        await expect(friendsPageA.getFriendCard(userB.username)).toBeVisible();
      });

      await test.step("user A appears in user B's friends list", async () => {
        const friendsPageB = new FriendsPage(pageB);
        await friendsPageB.goTo();
        await expect(friendsPageB.getFriendCard(userA.username)).toBeVisible();
      });
    } finally {
      await apiRemoveFriend(pageA.request, userAAuth?.token, userBAuth?.id);
      await contextA.close();
      await contextB.close();
    }
  });
});
