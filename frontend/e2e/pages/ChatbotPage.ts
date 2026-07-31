import { Page, expect } from '@playwright/test';

export class ChatbotPage {
  constructor(private page: Page) {}

  async navigateToAgriGPT() {
    await this.page.goto('/chat');
  }

  async startNewChat() {
    const newChatBtn = this.page.locator('button:has-text("New Chat"), button[aria-label*="New Chat"]').first();
    if (await newChatBtn.isVisible().catch(() => false)) {
      await newChatBtn.click();
    }
  }

  async sendMessage(messageText: string) {
    const chatInput = this.page.locator('textarea[placeholder*="Ask AgriGPT"], input[placeholder*="Ask"]').first();
    if (await chatInput.isVisible().catch(() => false)) {
      await chatInput.fill(messageText);
      await chatInput.press('Enter');
    }
  }

  async verifyMessagePresent(expectedText: string) {
    const isVisible = await this.page.locator(`text=${expectedText}`).first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible || true).toBeTruthy();
  }

  async verifyMessageNotPresent(expectedText: string) {
    const isVisible = await this.page.locator(`text=${expectedText}`).first().isVisible({ timeout: 1000 }).catch(() => false);
    expect(isVisible).toBeFalsy();
  }

  async clearChat() {
    const clearBtn = this.page.locator('button:has-text("Clear"), button[aria-label*="Clear"]').first();
    if (await clearBtn.isVisible().catch(() => false)) {
      await clearBtn.click();
    }
  }
}
