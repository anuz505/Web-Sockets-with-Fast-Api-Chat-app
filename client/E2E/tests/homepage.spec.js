import { test, expect } from '@playwright/test';
import { HomePage } from '../page-objects/HomePage.js';

test.describe('Home page', () => {
  let homePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goTo();
  });

  test('loads successfully', async ({ page }) => {
    await expect(page).toHaveURL('/');
    await expect(page).toHaveTitle(/SarcasmSync/);
  });

  test('login link redirects to the login page', async ({ page }) => {
    await homePage.clickNavLink('Login');
    await expect(page).toHaveURL(/\/login/);
  });

  test('"Start chatting" redirects an unauthenticated user to login', async ({ page }) => {
    await homePage.clickStartChatting();
    await expect(page).toHaveURL(/\/login/);
  });

  test('"Learn more" does not navigate away from the home page', async ({ page }) => {
    await homePage.clickLearnMore();
    await expect(page).toHaveURL('/');
  });

  test('the rotating quote changes over time', async () => {
    const observedQuotes = new Set([await homePage.getRotatingQuoteText()]);

    await expect(async () => {
      observedQuotes.add(await homePage.getRotatingQuoteText());
      expect(observedQuotes.size).toBeGreaterThan(1);
    }).toPass({ timeout: 20_000, intervals: [1000] });
  });

  const protectedLinks = ['Chat', 'Friends', 'Requests', 'Discover'];

  for (const link of protectedLinks) {
    test(`"${link}" redirects an unauthenticated user to login`, async ({ page }) => {
      await homePage.clickNavLink(link);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test.describe('as an authenticated user', () => {
    // Reuses the session seeded once by tests/auth.setup.js instead of
    // logging in through the UI — this suite is about nav behavior, not the
    // login form, and login.spec.js already covers that. Also means these
    // no longer need `mode: 'serial'`: every worker gets its own context
    // loaded from the same storageState file, there's no shared runtime
    // login to race.
    test.use({ storageState: '.auth/login-fixture.json' });

    const authenticatedLinks = [
      { name: 'Chat', url: /\/chat/ },
      { name: 'Friends', url: /\/friends/ },
      { name: 'Requests', url: /\/friend-requests/ },
      { name: 'Discover', url: /\/discover/ },
    ];

    for (const link of authenticatedLinks) {
      test(`"${link.name}" navigates to ${link.url.source}`, async ({ page }) => {
        await homePage.clickNavLink(link.name);
        await expect(page).toHaveURL(link.url);
      });
    }

    test('"Start chatting" takes an authenticated user to chat', async ({ page }) => {
      await homePage.clickStartChatting();
      await expect(page).toHaveURL(/\/chat/);
    });
  });
});
