export class MobileCommunityPage {
  constructor(private driver: any) {}

  async searchUsers(query: string) {
    const searchBar = await this.driver.$('~communitySearchInput');
    if (await searchBar.isExisting()) {
      await searchBar.setValue(query);
    }
  }

  async followUser() {
    const followBtn = await this.driver.$('~followUserButton');
    if (await followBtn.isExisting()) {
      await followBtn.click();
    }
  }

  async createPost(content: string) {
    const postInput = await this.driver.$('~createPostInput');
    if (await postInput.isExisting()) {
      await postInput.setValue(content);
      const submitBtn = await this.driver.$('~submitPostButton');
      await submitBtn.click();
    }
  }

  async likePost() {
    const likeBtn = await this.driver.$('~likePostButton');
    if (await likeBtn.isExisting()) {
      await likeBtn.click();
    }
  }

  async commentPost(commentText: string) {
    const commentInput = await this.driver.$('~commentInput');
    if (await commentInput.isExisting()) {
      await commentInput.setValue(commentText);
    }
  }
}
