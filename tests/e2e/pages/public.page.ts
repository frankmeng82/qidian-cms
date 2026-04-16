import type { Page } from '@playwright/test';

export class PublicPage {
  constructor(private readonly page: Page) {}

  async gotoHome() {
    await this.page.goto('/');
  }

  async search(keyword: string) {
    await this.page.getByPlaceholder('搜索视频').fill(keyword);
    await this.page.getByRole('button', { name: 'Search' }).click();
  }

  async gotoUserCenter() {
    await this.page.getByRole('menuitem', { name: '用户中心' }).click();
  }

  async gotoAdmin() {
    await this.page.getByRole('menuitem', { name: '管理后台' }).click();
  }
}
