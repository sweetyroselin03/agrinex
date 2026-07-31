import { test, expect } from '@playwright/test';
import { ScannerPage } from '../pages/ScannerPage';

test.describe('AgriNex AI Scanner E2E Test Suite', () => {
  let scannerPage: ScannerPage;

  test.beforeEach(async ({ page }) => {
    scannerPage = new ScannerPage(page);
    await scannerPage.navigateToScanner();
  });

  test('SCAN-001: Upload and diagnose Healthy Leaf sample', async ({ page }) => {
    await scannerPage.uploadLeafImage('healthy_leaf.jpg', 'image/jpeg', Buffer.from('healthy-leaf-mock-bytes'));
    await scannerPage.triggerDiagnosis();
  });

  test('SCAN-002: Upload and diagnose Diseased Leaf sample', async ({ page }) => {
    await scannerPage.uploadLeafImage('diseased_leaf.jpg', 'image/jpeg', Buffer.from('diseased-leaf-mock-bytes'));
    await scannerPage.triggerDiagnosis();
  });

  test('SCAN-003: Non-plant image rejection verification', async ({ page }) => {
    await scannerPage.uploadLeafImage('car.jpg', 'image/jpeg', Buffer.from('non-plant-mock-bytes'));
    await scannerPage.triggerDiagnosis();
  });
});
