import { expect } from '@playwright/test';
import { RegisterPage } from '../../page-objects/RegisterPage.js';
import { LoginPage } from '../../page-objects/LoginPage.js';
import { DiscoverPage } from '../../page-objects/DiscoverPage.js';
import { RequestsPage } from '../../page-objects/RequestsPage.js';

function buildUser(prefix, seed) {
  const username = `${prefix}-${seed}`;

  return {
    username,
    email: `${username}@example.com`,
    password: 'ValidPass12@3#',
  };
}

export function createUserPair() {
  const seed = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    userA: buildUser('user-a', seed),
    userB: buildUser('user-b', seed),
  };
}

export async function registerUser(page, user) {
  const registerPage = new RegisterPage(page);
  await registerPage.goTo();
  await registerPage.register(user);
  await expect(page).toHaveURL(/\/login/);
}

export async function loginUser(page, user) {
  const loginPage = new LoginPage(page);
  await loginPage.goTo();
  await loginPage.login(user);
  await expect(page).toHaveURL(/\/chat/);
}

export async function sendRequest(page, targetUsername) {
  const discoverPage = new DiscoverPage(page);
  await discoverPage.goTo();
  await expect(discoverPage.getUserCard(targetUsername)).toBeVisible();
  await discoverPage.addFriend(targetUsername);
  await expect(discoverPage.getUserCard(targetUsername)).toHaveCount(0);
}

export async function acceptRequest(page, requesterUsername) {
  const requestsPage = new RequestsPage(page);
  await requestsPage.goTo();
  await expect(requestsPage.getRequestCard(requesterUsername)).toBeVisible();
  await requestsPage.acceptRequest(requesterUsername);
  await expect(requestsPage.getRequestCard(requesterUsername)).toHaveCount(0);
}
