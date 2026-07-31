import { Page, expect } from '@playwright/test';

export class ProfilePage {
  constructor(private page: Page) {}

  async navigateToProfile() {
    await this.page.goto('/profile');
  }

  async editProfile(fullName: string, bio: string) {
    const nameInput = this.page.locator('input[name="full_name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill(fullName);
    }
    const bioInput = this.page.locator('textarea[name="bio"]');
    if (await bioInput.isVisible()) {
      await bioInput.fill(bio);
    }
    const saveBtn = this.page.locator('button:has-text("Save Profile")');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    }
  }

  async uploadAvatar(fileName: string, mimeType: string, bufferContent: Buffer) {
    const avatarInput = this.page.locator('input[type="file"][accept*="image"]');
    if (await avatarInput.isVisible()) {
      await avatarInput.setInputFiles({
        name: fileName,
        mimeType: mimeType,
        buffer: bufferContent,
      });
    }
  }
}
