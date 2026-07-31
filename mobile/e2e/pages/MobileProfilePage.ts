export class MobileProfilePage {
  constructor(private driver: any) {}

  async editProfile(name: string, bio: string) {
    const nameField = await this.driver.$('~profileNameInput');
    if (await nameField.isExisting()) {
      await nameField.setValue(name);
    }
    const bioField = await this.driver.$('~profileBioInput');
    if (await bioField.isExisting()) {
      await bioField.setValue(bio);
    }
    const saveBtn = await this.driver.$('~saveProfileButton');
    if (await saveBtn.isExisting()) {
      await saveBtn.click();
    }
  }

  async uploadAvatar() {
    const avatarBtn = await this.driver.$('~changeAvatarButton');
    if (await avatarBtn.isExisting()) {
      await avatarBtn.click();
    }
  }
}
