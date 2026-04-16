import type { Page } from '@playwright/test';

export class AuthPage {
  constructor(private readonly page: Page) {}

  async gotoLogin() {
    await this.page.goto('/login');
  }

  async gotoRegister() {
    await this.page.goto('/register');
  }

  async fillLogin(email: string, password: string) {
    await this.page.getByLabel('邮箱').fill(email);
    await this.page.getByLabel('密码').fill(password);
    await this.page.getByRole('button', { name: '登录' }).click();
  }

  async fillRegister(email: string, username: string, password: string) {
    await this.page.getByLabel('邮箱').fill(email);
    await this.page.getByLabel('用户名').fill(username);
    await this.page.getByLabel('密码').fill(password);
    await this.page.getByRole('button', { name: '注册' }).click();
  }
}
