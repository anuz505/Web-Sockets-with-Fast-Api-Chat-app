import { test, expect } from '@playwright/test';
import { createUserPair } from '../test-data/users.js';
import {
  apiRegister,
  apiLogin,
  apiRegisterAndLogin,
  apiSendFriendRequest,
  apiRemoveFriend,
} from './helpers/e2e-flow.js';
import { RequestsPage } from '../page-objects/RequestsPage.js';

test.describe('Friend Requests page', () => {
  test('accepting a request removes it from the list', async ({ page, request }) => {
    const { userA, userB } = createUserPair('requests-accept');

    // User A only ever calls the API (sender) — no browser page needed.
    const createdUserA = await apiRegister(request, userA);
    const tokenA = await apiLogin(request, userA);
    const createdUserB = await apiRegisterAndLogin(page.request, userB);
    await apiSendFriendRequest(request, tokenA, createdUserB.id);

    const requestsPage = new RequestsPage(page);
    await requestsPage.goTo();
    await expect(requestsPage.getRequestCard(userA.username)).toBeVisible();

    await requestsPage.acceptRequest(userA.username);
    await expect(requestsPage.getRequestCard(userA.username)).toHaveCount(0);

    // Accepting leaves a permanent 'accepted' friendship row (unlike reject,
    // which deletes it server-side) — clean it up.
    await apiRemoveFriend(page.request, createdUserB.token, createdUserA.id);
  });

  test('rejecting a request removes it from the list', async ({ page, request }) => {
    const { userA, userB } = createUserPair('requests-reject');

    const createdUserA = await apiRegister(request, userA);
    const tokenA = await apiLogin(request, userA);
    const createdUserB = await apiRegisterAndLogin(page.request, userB);
    await apiSendFriendRequest(request, tokenA, createdUserB.id);

    const requestsPage = new RequestsPage(page);
    await requestsPage.goTo();
    await expect(requestsPage.getRequestCard(userA.username)).toBeVisible();

    await requestsPage.rejectRequest(userA.username);
    await expect(requestsPage.getRequestCard(userA.username)).toHaveCount(0);
  });
});
