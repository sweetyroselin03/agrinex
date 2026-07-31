export class MobileAuthPage {
  constructor(private driver: any) {}

  async registerUser(fullName: string, email: string) {
    const nameField = await this.driver.$('~fullNameInput');
    if (await nameField.isExisting()) {
      await nameField.setValue(fullName);
    }
    const emailField = await this.driver.$('~emailInput');
    if (await emailField.isExisting()) {
      await emailField.setValue(email);
    }
    const nextBtn = await this.driver.$('~continueBtn');
    if (await nextBtn.isExisting()) {
      await nextBtn.click();
    }
  }

  async enterOTP(code: string) {
    const otpInput = await this.driver.$('~otpInput');
    if (await otpInput.isExisting()) {
      await otpInput.setValue(code);
    }
  }

  async login(email: string, pass: string) {
    const emailInput = await this.driver.$('~loginEmailInput');
    if (await emailInput.isExisting()) {
      await emailInput.setValue(email);
    }
    const passInput = await this.driver.$('~loginPasswordInput');
    if (await passInput.isExisting()) {
      await passInput.setValue(pass);
    }
    const loginBtn = await this.driver.$('~loginSubmitBtn');
    if (await loginBtn.isExisting()) {
      await loginBtn.click();
    }
  }

  async logout() {
    const logoutBtn = await this.driver.$('~logoutButton');
    if (await logoutBtn.isExisting()) {
      await logoutBtn.click();
    }
  }

  async forgotPassword(email: string) {
    const forgotBtn = await this.driver.$('~forgotPasswordButton');
    if (await forgotBtn.isExisting()) {
      await forgotBtn.click();
    }
  }
}
