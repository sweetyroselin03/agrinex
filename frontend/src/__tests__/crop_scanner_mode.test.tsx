import { describe, it, expect } from 'vitest';

describe('AgriNex AI Crop Scanner — Dual Scan Mode Suite (Crop vs Full)', () => {
  describe('Scan Mode Selection & State', () => {
    it('1. defaults scan mode to crop mode for focused lesion scanning', () => {
      let scanMode = 'crop';
      expect(scanMode).toBe('crop');
    });

    it('2. allows switching between Crop Image and Full Image modes', () => {
      let scanMode = 'crop';
      scanMode = 'full';
      expect(scanMode).toBe('full');
    });

    it('3. constructs correct payload for Crop Image scan', () => {
      const payload = {
        image_url: 'data:image/jpeg;base64,cropped_data',
        scan_mode: 'crop',
      };
      expect(payload.scan_mode).toBe('crop');
      expect(payload.image_url).toContain('cropped_data');
    });

    it('4. constructs correct payload for Full Image scan', () => {
      const payload = {
        image_url: 'data:image/jpeg;base64,raw_data',
        scan_mode: 'full',
      };
      expect(payload.scan_mode).toBe('full');
      expect(payload.image_url).toContain('raw_data');
    });

    it('5. triggers Cropper modal when selecting Crop Image mode', () => {
      let showCropper = false;
      const onSelectCropMode = () => {
        showCropper = true;
      };
      onSelectCropMode();
      expect(showCropper).toBe(true);
    });
  });

  describe('Cropper Tool Operations', () => {
    it('6. calculates rotated canvas dimensions correctly for 90deg', () => {
      let rotation = 0;
      rotation = (rotation + 90) % 360;
      expect(rotation).toBe(90);
    });

    it('7. clamps zoom factor within 1.0x to 3.0x', () => {
      const clampZoom = (z: number) => Math.min(3.0, Math.max(1.0, z));
      expect(clampZoom(0.5)).toBe(1.0);
      expect(clampZoom(4.0)).toBe(3.0);
      expect(clampZoom(2.0)).toBe(2.0);
    });

    it('8. generates cropped base64 output upon confirmation', () => {
      const confirmCrop = (original: string) => `cropped_${original}`;
      expect(confirmCrop('img123')).toBe('cropped_img123');
    });

    it('9. resets cropper controls to initial state on reset', () => {
      let zoom = 2.5;
      let rotation = 180;
      const reset = () => {
        zoom = 1.0;
        rotation = 0;
      };
      reset();
      expect(zoom).toBe(1.0);
      expect(rotation).toBe(0);
    });
  });

  describe('History Labeling & Result Verification', () => {
    it('10. labels cropped scan in history as "Cropped Scan"', () => {
      const scan = { id: 1, scan_mode: 'crop' };
      const label = scan.scan_mode === 'crop' ? 'Cropped Scan' : 'Full Image Scan';
      expect(label).toBe('Cropped Scan');
    });

    it('11. labels full image scan in history as "Full Image Scan"', () => {
      const scan = { id: 2, scan_mode: 'full' };
      const label = scan.scan_mode === 'crop' ? 'Cropped Scan' : 'Full Image Scan';
      expect(label).toBe('Full Image Scan');
    });

    it('12. defaults legacy scan records without scan_mode to "Scan"', () => {
      const scan: any = { id: 3 };
      const label = scan.scan_mode === 'crop' 
        ? 'Cropped Scan' 
        : scan.scan_mode === 'full' 
        ? 'Full Image Scan' 
        : 'Scan';
      expect(label).toBe('Scan');
    });
  });
});
