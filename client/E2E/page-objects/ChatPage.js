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
    // The chat page shows one of two mutually-exclusive headers depending on
    // whether the user has any conversations yet. `.or()` waits for whichever
    // one actually appears instead of waiting out a full timeout on the one
    // that doesn't apply before falling back to the other.
    await expect(this.elements.emptyState.or(this.elements.conversationsHeading)).toBeVisible();
  }

  async openConversation(username) {
    const conversationItem = this.elements.conversationItems.filter({ hasText: username }).first();
    const friendItem = this.elements.friendItems.filter({ hasText: username }).first();
    const target = (await conversationItem.count()) ? conversationItem : friendItem;

    await expect(target).toBeVisible();
    await target.click();

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