import { test, expect } from '@playwright/test';

test('homepage login flow', async ({ page }) => {
  await page.goto('/');

  const loginHeading = page.getByRole('heading', { name: '登录业务平台' });
  const hasLoginModal = await loginHeading.isVisible({ timeout: 8000 }).catch(() => false);

  if (hasLoginModal) {
    await page.getByLabel('邮箱').fill('zhangwei@wps.cn');
    await page.getByLabel('密码').fill('123456');
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await expect(loginHeading).not.toBeVisible({ timeout: 15000 });
  }

  await expect(page.getByText('张伟').first()).toBeVisible({ timeout: 15000 });
});
