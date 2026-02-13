import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { getCredentials } from './helpers/env';
import { expectPageReady } from './helpers/page';

const credentials = getCredentials();

test.describe('dashboard feature actions', () => {
  test.skip(!credentials, 'Missing E2E admin credentials');

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('announcement create modal opens and closes', async ({ page }) => {
    await page.goto('/dashboard/announcements');
    await expectPageReady(page);
    const createButton = page.getByRole('button', {
      name: /new announcement/i,
    });
    await expect(createButton).toBeVisible();
    await createButton.click();
    await expect(
      page.getByRole('heading', { name: /new announcement/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(
      page.getByRole('heading', { name: /new announcement/i })
    ).toHaveCount(0);
  });

  test('task create modal opens and closes', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    await expectPageReady(page);
    const createButton = page
      .getByRole('button', { name: /new task/i })
      .first();
    await expect(createButton).toBeVisible();
    await createButton.click();
    await expect(
      page.getByRole('heading', { name: /create new task/i })
    ).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(
      page.getByRole('heading', { name: /create new task/i })
    ).toHaveCount(0);
  });
});
