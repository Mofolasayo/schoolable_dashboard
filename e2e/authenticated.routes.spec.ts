import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { getCredentials } from './helpers/env';
import { expectPageReady } from './helpers/page';

const credentials = getCredentials();

const routes = [
  { name: 'dashboard home', path: '/dashboard' },
  { name: 'announcements', path: '/dashboard/announcements' },
  { name: 'compliance', path: '/dashboard/compliance' },
  { name: 'documents', path: '/dashboard/documents' },
  { name: 'tasks', path: '/dashboard/tasks' },
  { name: 'reports', path: '/dashboard/reports' },
  { name: 'attendance', path: '/dashboard/attendance' },
  { name: 'attendance calendar', path: '/dashboard/attendance-calendar' },
  { name: 'late analytics', path: '/dashboard/late-analytics' },
  { name: 'smart reminders', path: '/dashboard/smart-reminders' },
  { name: 'ai insights', path: '/dashboard/ai-insights' },
  { name: 'insights', path: '/dashboard/insights' },
  { name: 'performance', path: '/dashboard/performance' },
  { name: 'team lead ratings', path: '/dashboard/team-lead-ratings' },
  { name: 'teams', path: '/dashboard/teams' },
  { name: 'users', path: '/dashboard/users' },
  { name: 'staff', path: '/dashboard/staff' },
  { name: 'communication', path: '/dashboard/communication' },
  { name: 'hr policy', path: '/dashboard/hr-policy' },
  { name: 'audit logs', path: '/dashboard/audit-logs' },
  { name: 'settings', path: '/dashboard/settings' },
];

test.describe('dashboard feature pages', () => {
  test.skip(!credentials, 'Missing E2E admin credentials');

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const route of routes) {
    test(`${route.name} loads`, async ({ page }) => {
      await page.goto(route.path);
      await expectPageReady(page);
      await expect(page.locator('main')).toContainText(/\S+/);
    });
  }
});
