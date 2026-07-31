import { Page, expect } from '@playwright/test';

export class ScannerPage {
  constructor(private page: Page) {}

  async navigateToScanner() {
    await this.page.goto('/scanner');
  }

  async uploadLeafImage(fileName: string, mimeType: string, bufferContent: Buffer) {
    const fileInput = this.page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles({
        name: fileName,
        mimeType: mimeType,
        buffer: bufferContent,
      });
    }
  }

  async triggerDiagnosis() {
    const diagnoseBtn = this.page.locator('button:has-text("Diagnose"), button:has-text("Scan")');
    if (await diagnoseBtn.isVisible()) {
      await diagnoseBtn.click();
    }
  }

  async verifyResultContains(text: string) {
    await expect(this.page.locator(`text=${text}`)).toBeVisible({ timeout: 10000 });
  }
}
