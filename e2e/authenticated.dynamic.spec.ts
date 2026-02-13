import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { getCredentials, optionalIds } from './helpers/env';
import { expectPageReady } from './helpers/page';

const credentials = getCredentials();

test.describe('dashboard dynamic feature pages', () => {
  test.skip(!credentials, 'Missing E2E admin credentials');

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('ai insight detail loads', async ({ page }) => {
    test.skip(!optionalIds.aiInsightId, 'Missing E2E_AI_INSIGHT_ID');
    await page.goto(`/dashboard/ai-insights/${optionalIds.aiInsightId}`);
    await expectPageReady(page);
    await expect(page.locator('main')).toContainText(/\S+/);
  });

  test('performance assessment detail loads', async ({ page }) => {
    test.skip(!optionalIds.employeeId, 'Missing E2E_EMPLOYEE_ID');
    await page.goto(`/dashboard/performance/assess/${optionalIds.employeeId}`);
    await expectPageReady(page);
    await expect(page.locator('main')).toContainText(/\S+/);
  });

  test('compliance policy detail loads', async ({ page }) => {
    test.skip(!optionalIds.policyId, 'Missing E2E_POLICY_ID');
    await page.goto(`/dashboard/compliance/${optionalIds.policyId}`);
    await expectPageReady(page);
    await expect(page.locator('main')).toContainText(/\S+/);
  });
});
