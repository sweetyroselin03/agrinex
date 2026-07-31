import { Page, expect } from '@playwright/test';

export class CommunityPage {
  constructor(private page: Page) {}

  async navigateToCommunity() {
    await this.page.goto('/community');
  }

  async searchUsers(query: string) {
    const searchInput = this.page.locator('input[placeholder*="Search farmers"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(query);
      await this.page.waitForTimeout(400);
    }
  }

  async followUser() {
    const followBtn = this.page.locator('button:has-text("Follow")').first();
    if (await followBtn.isVisible()) {
      await followBtn.click();
    }
  }

  async unfollowUser() {
    const followingBtn = this.page.locator('button:has-text("Following")').first();
    if (await followingBtn.isVisible()) {
      await followingBtn.click();
    }
  }

  async createPost(content: string) {
    const textarea = this.page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="Share"]');
    if (await textarea.isVisible()) {
      await textarea.fill(content);
      await this.page.click('button:has-text("Post")');
    }
  }

  async likeFirstPost() {
    const likeBtn = this.page.locator('button[aria-label*="Like"]').first();
    if (await likeBtn.isVisible()) {
      await likeBtn.click();
    }
  }

  async commentOnFirstPost(text: string) {
    const commentInput = this.page.locator('input[placeholder*="comment"]').first();
    if (await commentInput.isVisible()) {
      await commentInput.fill(text);
      await this.page.keyboard.press('Enter');
    }
  }
}
