import { test, expect, type Page } from '@playwright/test';

async function signInTeacher(page: Page) {
  // Run only against the local, seeded E2E database, never a production account.
  await page.goto('/sign-in');
  await page.getByLabel('E-posta').fill('ogretmen@dusunceizi.edu.tr');
  await page.getByLabel('Test parolası').fill(process.env.E2E_TEST_PASSWORD || 'pilot-e2e-password');
  await page.getByRole('button', { name: 'Test oturumu aç' }).click();
  await page.waitForURL('/dashboard');
}

for (const device of [
  { name: 'desktop', width: 1280, height: 800, classroomLink: 'Sınıflarım ve Öğrenciler' },
  { name: 'mobile', width: 390, height: 844, classroomLink: 'Sınıflar' },
]) {
test(`a slow teacher navigation acknowledges the click and clears feedback on arrival (${device.name})`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width: device.width, height: device.height });
  await signInTeacher(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route(/\/classrooms(?:\?|$)/, async (route) => {
    if (route.request().method() === 'GET') await gate;
    await route.continue();
  });

  try {
    const navigation = page.getByRole('navigation', { name: 'Ana menü' });
    await navigation.getByRole('link', { name: device.classroomLink, exact: true }).click();
    // Either the Link acknowledges a blocked request or the prefetched fallback
    // renders immediately. Both are valid; an unchanged silent screen is not.
    await expect(page.getByRole('status').filter({ hasText: /Açılıyor|Sınıf bilgileri yükleniyor/ }).first()).toBeVisible();
    await expect(navigation).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('navigation-pending.png'), fullPage: true });
    release();
    await expect(page.getByRole('heading', { name: 'Sınıf Yönetimi', exact: true })).toBeVisible();
    await expect(page.locator('[data-navigation-pending="true"]')).toHaveCount(0);
    await expect(navigation.getByRole('link', { name: device.classroomLink, exact: true })).toHaveAttribute('aria-current', 'page');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('navigation-arrived.png'), fullPage: true });

    await page.goBack();
    await expect(page.getByRole('heading', { name: /Hoş Geldiniz/ })).toBeVisible();
    await expect(page.locator('[data-navigation-pending="true"]')).toHaveCount(0);
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
});
}

test('a newer navigation wins over a delayed click and keyboard navigation remains usable', async ({ page }) => {
  await signInTeacher(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route(/\/classrooms(?:\?|$)/, async (route) => {
    if (route.request().method() === 'GET') await gate;
    await route.continue();
  });

  try {
    const navigation = page.getByRole('navigation', { name: 'Ana menü' });
    await navigation.getByRole('link', { name: 'Sınıflarım ve Öğrenciler', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: /Açılıyor|Sınıf bilgileri yükleniyor/ }).first()).toBeVisible();
    await navigation.getByRole('link', { name: 'Sınavlar', exact: true }).click();
    await page.waitForURL('/dashboard/exams');
    await expect(navigation.getByRole('link', { name: 'Sınavlar', exact: true })).toHaveAttribute('aria-current', 'page');
    release();
    await page.unrouteAll({ behavior: 'wait' });
    await expect(page).toHaveURL(/\/dashboard\/exams$/);
    await expect(page.locator('[data-navigation-pending="true"]')).toHaveCount(0);

    await navigation.getByRole('link', { name: 'Gösterge Paneli', exact: true }).press('Enter');
    await expect(page.getByRole('heading', { name: /Hoş Geldiniz/ })).toBeVisible();
    await expect(page.locator('[data-navigation-pending="true"]')).toHaveCount(0);
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
});
