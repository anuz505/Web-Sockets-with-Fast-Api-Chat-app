import { expect } from '@playwright/test';

export class ChatPage {
  constructor(page) {
    this.page = page;
    this.elements = {
      friendItems: page.getByTestId('chat-friend-item'),
      conversationItems: page.getByTestId('chat-conversation-item'),
      partnerName: page.getByTestId('chat-partner-name'),
      messageInput: page.getByTestId('chat-message-input'),
      sendButton: page.getByTestId('chat-send-button'),
      messages: page.getByTestId('chat-message'),
      emptyState: page.getByText('Start a Chat'),
      conversationsHeading: page.getByRole('heading', { name: 'Messages' }),
    };
  }

  async goTo() {
    await this.page.goto('/chat');
    try {
      await expect(this.page.getByText('Start a Chat')).toBeVisible({ timeout: 10000 });
    } catch {
      await expect(this.page.getByRole('heading', { name: 'Messages' })).toBeVisible({ timeout: 10000 });
    }
  }

  async openConversation(username) {
    const conversationItem = this.elements.conversationItems.filter({ hasText: username }).first();
    const friendItem = this.elements.friendItems.filter({ hasText: username }).first();

    if (await this.elements.conversationItems.filter({ hasText: username }).count()) {
      await conversationItem.click();
    } else {
      await expect(friendItem).toBeVisible();
      await friendItem.click();
    }

    await expect(this.elements.partnerName).toHaveText(username);
    await expect(this.elements.messageInput).toBeEnabled();
  }

  async sendMessage(message) {
    await this.elements.messageInput.fill(message);
    await this.elements.sendButton.click();
  }

  getMessage(message) {
    return this.elements.messages.filter({ hasText: message });
  }
}