import { test, expect } from '@playwright/test';
import {
  createUserPair,
  registerUser,
  loginUser,
  sendRequest,
  acceptRequest,
} from './helpers/e2e-flow.js';
import { FriendsPage } from '../page-objects/FriendsPage.js';
import { ChatPage } from '../page-objects/ChatPage.js';

test.describe('Chat Flow', () => {
  test('user A sends a message and user B receives it', async ({ browser }) => {
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
      await acceptRequest(pageB, userA.username);

      const friendsPageB = new FriendsPage(pageB);
      await friendsPageB.goTo();
      await expect(friendsPageB.getFriendCard(userA.username)).toBeVisible({ timeout: 15000 });

      const chatPageA = new ChatPage(pageA);
      const chatPageB = new ChatPage(pageB);

      await chatPageA.goTo();
      await chatPageB.goTo();

      await chatPageA.openConversation(userB.username);
      await chatPageB.openConversation(userA.username);

      const message = `Hello ${userB.username}, this is ${userA.username}`;
      await chatPageA.sendMessage(message);

      await expect(chatPageA.getMessage(message)).toBeVisible();
      await expect(chatPageB.getMessage(message)).toBeVisible({ timeout: 10000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});