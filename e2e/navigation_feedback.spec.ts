import { test, expect } from '@playwright/test';

test('a slow teacher navigation acknowledges the click and clears feedback on arrival', async ({ page }) => {
  // Run only against the local, seeded E2E database, never a production account.
  await page.goto('/sign-in');
  await page.getByLabel('E-posta').fill('ogretmen@dusunceizi.edu.tr');
  await page.getByLabel('Test parolası').fill(process.env.E2E_TEST_PASSWORD || 'pilot-e2e-password');
  await page.getByRole('button', { name: 'Test oturumu aç' }).click();
  await page.waitForURL('/dashboard');

  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route(/\/classrooms(?:\?|$)/, async (route) => {
    if (route.request().method() === 'GET') await gate;
    await route.continue();
  });

  try {
    const navigation = page.getByRole('navigation', { name: 'Ana menü' });
    await navigation.getByRole('link', { name: 'Sınıflarım ve Öğrenciler' }).click();
    // Either the Link acknowledges a blocked request or the prefetched fallback
    // renders immediately. Both are valid; an unchanged silent screen is not.
    await expect(page.getByRole('status').filter({ hasText: /Açılıyor|Sınıf bilgileri yükleniyor/ }).first()).toBeVisible();
    await expect(navigation).toBeVisible();
    release();
    await expect(page.getByRole('heading', { name: 'Sınıf Yönetimi', exact: true })).toBeVisible();
    await expect(page.locator('[data-navigation-pending="true"]')).toHaveCount(0);
    await expect(navigation.getByRole('link', { name: 'Sınıflarım ve Öğrenciler' })).toHaveAttribute('aria-current', 'page');

    await page.goBack();
    await expect(page.getByRole('heading', { name: /Hoş Geldiniz/ })).toBeVisible();
    await expect(page.locator('[data-navigation-pending="true"]')).toHaveCount(0);
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
});
