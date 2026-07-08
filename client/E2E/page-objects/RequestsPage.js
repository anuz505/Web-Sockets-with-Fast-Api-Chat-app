import { expect } from '@playwright/test';

export class RequestsPage {
  constructor(page) {
    this.page = page;
    this.elements = {
      requestCards: page.getByTestId('friend-request-card'),
    };
  }

  async goTo() {
    await this.page.goto('/friend-requests');
    await expect(this.page.getByRole('heading', { name: 'FRIEND REQUESTS' })).toBeVisible();
  }

  getRequestCard(username) {
    return this.elements.requestCards.filter({ hasText: username });
  }

  async acceptRequest(username) {
    const requestCard = this.getRequestCard(username);
    await expect(requestCard).toBeVisible();
    await requestCard.getByRole('button', { name: 'ACCEPT' }).click();
  }

  async rejectRequest(username) {
    const requestCard = this.getRequestCard(username);
    await expect(requestCard).toBeVisible();
    await requestCard.getByRole('button', { name: 'DECLINE' }).click();
  }
}