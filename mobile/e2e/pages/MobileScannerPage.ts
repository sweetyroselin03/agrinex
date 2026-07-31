export class MobileScannerPage {
  constructor(private driver: any) {}

  async selectCamera() {
    const cameraBtn = await this.driver.$('~openCameraButton');
    if (await cameraBtn.isExisting()) {
      await cameraBtn.click();
    }
  }

  async selectGallery() {
    const galleryBtn = await this.driver.$('~openGalleryButton');
    if (await galleryBtn.isExisting()) {
      await galleryBtn.click();
    }
  }

  async scanImage() {
    const scanBtn = await this.driver.$('~diagnoseCropButton');
    if (await scanBtn.isExisting()) {
      await scanBtn.click();
    }
  }
}
