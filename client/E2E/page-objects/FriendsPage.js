import { expect } from '@playwright/test';

export class FriendsPage {
  constructor(page) {
    this.page = page;
    this.elements = {
      friendCards: page.getByTestId('friend-card'),
    };
  }

  async goTo() {
    await this.page.goto('/friends');
  }

  getFriendCard(username) {
    return this.elements.friendCards.filter({ hasText: username });
  }

  async expectFriendVisible(username) {
    await expect(this.getFriendCard(username)).toBeVisible();
  }
}