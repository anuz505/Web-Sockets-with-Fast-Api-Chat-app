import { test, expect } from '@playwright/test';
import { createUserPair } from '../test-data/users.js';
import {
  apiRegisterAndLogin,
  apiSendFriendRequest,
  apiAcceptFriendRequest,
  apiRemoveFriend,
} from './helpers/e2e-flow.js';
import { ChatPage } from '../page-objects/ChatPage.js';

test.describe('Chat', () => {
  test('a message sent by user A is received by user B in real time', async ({ browser }) => {
    const { userA, userB } = createUserPair('chat');

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    let userAAuth, userBAuth;

    try {
      await test.step('seed two already-friended, logged-in users via the API', async () => {
        userAAuth = await apiRegisterAndLogin(pageA.request, userA);
        userBAuth = await apiRegisterAndLogin(pageB.request, userB);
        await apiSendFriendRequest(pageA.request, userAAuth.token, userBAuth.id);
        await apiAcceptFriendRequest(pageB.request, userBAuth.token, userAAuth.id);
      });

      const chatPageA = new ChatPage(pageA);
      const chatPageB = new ChatPage(pageB);

      await test.step('both users open the conversation', async () => {
        await chatPageA.goTo();
        await chatPageB.goTo();
        await chatPageA.openConversation(userB.username);
        await chatPageB.openConversation(userA.username);
      });

      await test.step('a message sent by A is visible to both A and B', async () => {
        const message = `Hello ${userB.username}, this is ${userA.username}`;
        await chatPageA.sendMessage(message);

        await expect(chatPageA.getMessage(message)).toBeVisible();
        // Generous timeout: delivery to B goes through the WebSocket -> Redis
        // pub/sub fan-out path (server/app/core/redis_service.py), not a
        // synchronous request/response.
        await expect(chatPageB.getMessage(message)).toBeVisible({ timeout: 10_000 });
      });
    } finally {
      await apiRemoveFriend(pageA.request, userAAuth?.token, userBAuth?.id);
      await contextA.close();
      await contextB.close();
    }
  });
});
