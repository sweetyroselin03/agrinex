import { Page, expect } from '@playwright/test';

export class ChatbotPage {
  constructor(private page: Page) {}

  async navigateToAgriGPT() {
    await this.page.goto('/chat');
  }

  async startNewChat() {
    const newChatBtn = this.page.locator('button:has-text("New Chat"), button[aria-label*="New Chat"]');
    if (await newChatBtn.isVisible()) {
      await newChatBtn.click();
    }
  }

  async sendMessage(messageText: string) {
    const chatInput = this.page.locator('textarea[placeholder*="Ask AgriGPT"], input[placeholder*="Ask"]');
    if (await chatInput.isVisible()) {
      await chatInput.fill(messageText);
      await this.page.click('button[type="submit"], button[aria-label*="Send"]');
    }
  }

  async verifyMessagePresent(expectedText: string) {
    await expect(this.page.locator(`text=${expectedText}`)).toBeVisible({ timeout: 5000 });
  }

  async verifyMessageNotPresent(expectedText: string) {
    await expect(this.page.locator(`text=${expectedText}`)).not.toBeVisible();
  }

  async clearChat() {
    const clearBtn = this.page.locator('button:has-text("Clear"), button[aria-label*="Clear"]');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    }
  }
}
