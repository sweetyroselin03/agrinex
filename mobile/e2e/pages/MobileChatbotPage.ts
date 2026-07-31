export class MobileChatbotPage {
  constructor(private driver: any) {}

  async newChat() {
    const newChatBtn = await this.driver.$('~newChatButton');
    if (await newChatBtn.isExisting()) {
      await newChatBtn.click();
    }
  }

  async sendMessage(msg: string) {
    const chatInput = await this.driver.$('~chatMessageInput');
    if (await chatInput.isExisting()) {
      await chatInput.setValue(msg);
      const sendBtn = await this.driver.$('~sendChatMessageButton');
      await sendBtn.click();
    }
  }

  async clearChat() {
    const clearBtn = await this.driver.$('~clearChatButton');
    if (await clearBtn.isExisting()) {
      await clearBtn.click();
    }
  }
}
