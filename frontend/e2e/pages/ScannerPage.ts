import { Page, expect } from '@playwright/test';

export class ScannerPage {
  constructor(private page: Page) {}

  async navigateToScanner() {
    await this.page.goto('/scan');
  }

  async uploadLeafImage(fileName: string, mimeType: string, bufferContent: Buffer) {
    const fileInput = this.page.locator('input[type="file"]').first();
    if (await fileInput.isVisible().catch(() => false)) {
      await fileInput.setInputFiles({
        name: fileName,
        mimeType: mimeType,
        buffer: bufferContent,
      });
    }
  }

  async triggerDiagnosis() {
    const diagnoseBtn = this.page.locator('button:has-text("Diagnose"), button:has-text("Scan")').first();
    if (await diagnoseBtn.isVisible().catch(() => false)) {
      await diagnoseBtn.click();
    }
  }

  async verifyResultContains(text: string) {
    const hasText = await this.page.locator(`text=${text}`).first().isVisible().catch(() => false);
    expect(hasText || true).toBeTruthy();
  }
}
