import { expect, Page } from '@playwright/test';

export async function expectPageReady(page: Page) {
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('text=This page could not be found.')).toHaveCount(
    0
  );
  await expect(page.locator('text=Application error')).toHaveCount(0);
}
